"""
services/simulator.py — Safe local attack traffic simulator.

Why this exists:
  Real network attacks must never be generated against external hosts.
  This module creates synthetic flow records that mimic attack patterns 
  and submits them to the detection pipeline locally, allowing students 
  to demonstrate the NIDS without any real network activity.

How it connects to the NIDS architecture:
  The /api/simulate route calls functions from this module. Each 
  function returns a list of flow dicts which are then piped through 
  detect_flow(), providing realistic test coverage.
"""

import random
import time
from typing import List, Dict, Any

from backend.services.detection_service import detect_flow
from backend.utils.logger import get_logger

logger = get_logger("simulator")

# Fixed seed for reproducibility in single-scenario runs
_RNG = random.Random(42)


# ── Flow generators ───────────────────────────────────────────────────────────

def _normal_flow() -> Dict[str, float]:
    """Typical HTTP/HTTPS session: moderate duration, balanced bytes."""
    return {
        "duration":  round(_RNG.uniform(2, 25), 1),
        "src_bytes": round(_RNG.uniform(600, 2500), 0),
        "dst_bytes": round(_RNG.uniform(800, 4500), 0),
    }


def _port_scan_flow() -> Dict[str, float]:
    """Very short connection, almost no data — probing a port."""
    return {
        "duration":  round(_RNG.uniform(0.01, 0.9), 3),
        "src_bytes": round(_RNG.uniform(10, 90), 0),
        "dst_bytes": round(_RNG.uniform(0, 80), 0),
    }


def _dos_flow() -> Dict[str, float]:
    """Flood: source sends enormous traffic, destination barely responds."""
    return {
        "duration":  round(_RNG.uniform(1, 30), 2),
        "src_bytes": round(_RNG.uniform(500_000, 5_000_000), 0),
        "dst_bytes": round(_RNG.uniform(100, 5_000), 0),
    }


def _exfiltration_flow() -> Dict[str, float]:
    """Long session transferring a huge amount of data outbound."""
    return {
        "duration":  round(_RNG.uniform(61, 3600), 1),
        "src_bytes": round(_RNG.uniform(200, 2_000), 0),
        "dst_bytes": round(_RNG.uniform(10_000_001, 100_000_000), 0),
    }


def _data_theft_flow() -> Dict[str, float]:
    """Large download: dst_bytes >> src_bytes."""
    return {
        "duration":  round(_RNG.uniform(5, 120), 2),
        "src_bytes": round(_RNG.uniform(100, 1_000), 0),
        "dst_bytes": round(_RNG.uniform(50_000, 500_000), 0),
    }


_SCENARIO_MAP = {
    "normal":            _normal_flow,
    "port_scan":         _port_scan_flow,
    "dos":               _dos_flow,
    "data_exfiltration": _exfiltration_flow,
    "data_theft":        _data_theft_flow,
}


# ── Public functions ──────────────────────────────────────────────────────────

def simulate_scenario(scenario: str, count: int = 1) -> List[Dict[str, Any]]:
    """
    Generate *count* flows for *scenario* and run them through detection.

    Args:
        scenario: one of 'normal', 'port_scan', 'dos', 
                  'data_exfiltration', 'data_theft'.
        count:    number of flows to generate (default 1).

    Returns:
        List of detection result dicts.
    """
    if scenario not in _SCENARIO_MAP:
        raise ValueError(
            f"Unknown scenario '{scenario}'. "
            f"Choose from: {list(_SCENARIO_MAP.keys())}"
        )

    generator = _SCENARIO_MAP[scenario]
    results = []
    for _ in range(count):
        flow = generator()
        result = detect_flow(flow)
        result["scenario"] = scenario
        results.append(result)

    logger.info("Simulated %d '%s' flow(s).", count, scenario)
    return results


def run_full_simulation() -> List[Dict[str, Any]]:
    """
    Run a predefined sequence of all scenario types to demonstrate 
    the complete NIDS capability in one call.

    Returns:
        Aggregated list of detection results.
    """
    sequence = [
        ("normal",            3),
        ("port_scan",         2),
        ("dos",               2),
        ("data_exfiltration", 2),
        ("data_theft",        2),
        ("normal",            3),
    ]

    all_results: List[Dict[str, Any]] = []
    for scenario, count in sequence:
        all_results.extend(simulate_scenario(scenario, count))
        time.sleep(0.01)   # tiny pause so timestamps differ

    logger.info("Full simulation complete: %d flows processed.", len(all_results))
    return all_results


def list_scenarios() -> List[str]:
    """Return available scenario names."""
    return list(_SCENARIO_MAP.keys())
