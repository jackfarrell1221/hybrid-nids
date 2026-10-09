"""
scripts/simulate_attacks.py — CLI attack simulator.

Sends synthetic traffic flows to the running NIDS /api/predict endpoint.

Usage:
    python scripts/simulate_attacks.py
    python scripts/simulate_attacks.py --scenario port_scan --count 5
    python scripts/simulate_attacks.py --scenario full

This script demonstrates the NIDS from the command line without needing 
the React dashboard.
"""

import os
import sys
import json
import time
import argparse
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import requests
except ImportError:
    print("requests not installed. Run: pip install requests")
    sys.exit(1)

from backend.config import FLASK_PORT

BASE_URL = os.environ.get("NIDS_API_URL", f"http://localhost:{FLASK_PORT}")


SCENARIOS = {
    "normal": {
        "desc": "Normal HTTP session",
        "flows": [
            {"duration": 5.2, "src_bytes": 900, "dst_bytes": 700},
            {"duration": 45,  "src_bytes": 12000, "dst_bytes": 8000},
        ],
    },
    "port_scan": {
        "desc": "Port scanner probe",
        "flows": [
            {"duration": 0.3, "src_bytes": 40, "dst_bytes": 0},
            {"duration": 0.1, "src_bytes": 20, "dst_bytes": 10},
        ],
    },
    "dos": {
        "desc": "DoS flood",
        "flows": [
            {"duration": 10, "src_bytes": 2_000_000, "dst_bytes": 500},
            {"duration": 5,  "src_bytes": 5_000_000, "dst_bytes": 100},
        ],
    },
    "data_exfiltration": {
        "desc": "Data exfiltration",
        "flows": [
            {"duration": 300, "src_bytes": 800, "dst_bytes": 50_000_000},
        ],
    },
    "data_theft": {
        "desc": "Unauthorised large download",
        "flows": [
            {"duration": 30, "src_bytes": 200, "dst_bytes": 150_000},
        ],
    },
}


def send_flow(flow: dict) -> dict:
    resp = requests.post(f"{BASE_URL}/api/predict", json=flow, timeout=10)
    resp.raise_for_status()
    return resp.json()


def run_scenario(name: str):
    if name not in SCENARIOS:
        print(f"Unknown scenario: {name}. Available: {list(SCENARIOS)}")
        return

    info = SCENARIOS[name]
    print(f"\n{'='*55}")
    print(f"  Scenario: {name.upper()} -- {info['desc']}")
    print(f"{'='*55}")

    for flow in info["flows"]:
        print(f"\n  Flow: {flow}")
        try:
            result = send_flow(flow)
            status = result.get("status", "?")
            attack = result.get("attack_type", "-")
            method = result.get("detection_method", "?")
            sev    = result.get("severity", "-")
            lat    = result.get("latency_ms", 0)
            print(f"  > Status:  {status}")
            print(f"    Attack:  {attack}")
            print(f"    Method:  {method}")
            print(f"    Severity:{sev}")
            print(f"    Latency: {lat:.2f} ms")
        except requests.RequestException as e:
            print(f"  [ERROR] {e}")
        time.sleep(0.1)


def run_full():
    print("\n" + "="*55)
    print("  FULL SIMULATION -- all scenarios")
    print("="*55)
    for name in SCENARIOS:
        run_scenario(name)


def main():
    parser = argparse.ArgumentParser(description="Hybrid NIDS Attack Simulator CLI")
    parser.add_argument(
        "--scenario",
        default="full",
        choices=list(SCENARIOS.keys()) + ["full"],
        help="Scenario to run (default: full)",
    )
    parser.add_argument(
        "--count", type=int, default=1,
        help="Number of times to repeat flows (default: 1)",
    )
    args = parser.parse_args()

    # Check backend health
    try:
        resp = requests.get(f"{BASE_URL}/api/health", timeout=5)
        health = resp.json()
        print(f"[+] Backend: {health.get('status')} | Model loaded: {health.get('model_loaded')}")
    except requests.RequestException:
        print(f"[!] Cannot reach backend at {BASE_URL}. Is it running?")
        sys.exit(1)

    if args.scenario == "full":
        run_full()
    else:
        for _ in range(args.count):
            run_scenario(args.scenario)


if __name__ == "__main__":
    main()
