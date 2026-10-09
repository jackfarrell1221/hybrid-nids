"""
services/rule_engine.py — Deterministic rule-based intrusion detection.

Why this exists:
  Known attack patterns (port scans, DoS, exfiltration) have clear,
  deterministic signatures. Checking these rules first is fast, 
  transparent, and requires no ML inference, which saves compute.

How it connects to the NIDS architecture:
  The detection service calls rule_engine.check(flow) first. 
  Only if no rule fires does the flow proceed to Isolation Forest.

Design:
  Rules are plain functions stored in a list (RULES). Adding a new rule 
  means defining one function and appending it to RULES — no other file 
  needs changing.
"""

from typing import Optional, Dict, Any
from backend.config import (
    RULE_PORT_SCAN_MAX_DURATION,
    RULE_PORT_SCAN_MAX_SRC_BYTES,
    RULE_PORT_SCAN_MAX_DST_BYTES,
    RULE_EXFIL_MIN_DURATION,
    RULE_EXFIL_MIN_DST_BYTES,
    RULE_DOS_RATIO_THRESHOLD,
    RULE_DATA_THEFT_RATIO_THRESHOLD,
)
from backend.utils.logger import get_logger

logger = get_logger("rule_engine")


# ── Individual rule functions ─────────────────────────────────────────────────
# Each function accepts a sanitised flow dict and returns a result dict if the
# rule fires, or None if it does not.

def _rule_port_scan(flow: Dict[str, float]) -> Optional[Dict[str, Any]]:
    """
    RULE 1 — PORT SCAN
    Detects very short connections with negligible data exchange, 
    characteristic of a scanner probing open ports.
    """
    if (
        flow["duration"] < RULE_PORT_SCAN_MAX_DURATION
        and flow["src_bytes"] < RULE_PORT_SCAN_MAX_SRC_BYTES
        and flow["dst_bytes"] < RULE_PORT_SCAN_MAX_DST_BYTES
    ):
        return {
            "status": "INTRUSION",
            "attack_type": "PORT_SCAN",
            "detection_method": "RULE",
            "severity": "HIGH",
            "message": (
                f"Detected by PORT_SCAN rule because the connection duration "
                f"({flow['duration']:.2f}s) was below {RULE_PORT_SCAN_MAX_DURATION}s "
                f"and both source bytes ({flow['src_bytes']:.0f}) and destination "
                f"bytes ({flow['dst_bytes']:.0f}) were below the configured threshold "
                f"of {RULE_PORT_SCAN_MAX_SRC_BYTES} bytes."
            ),
        }
    return None


def _rule_data_exfiltration(flow: Dict[str, float]) -> Optional[Dict[str, Any]]:
    """
    RULE 2 — DATA EXFILTRATION
    Detects long-duration connections that transfer a huge volume of data 
    outbound — typical of a host slowly leaking data to an attacker.
    """
    if (
        flow["duration"] > RULE_EXFIL_MIN_DURATION
        and flow["dst_bytes"] > RULE_EXFIL_MIN_DST_BYTES
    ):
        return {
            "status": "INTRUSION",
            "attack_type": "DATA_EXFILTRATION",
            "detection_method": "RULE",
            "severity": "CRITICAL",
            "message": (
                f"Detected by DATA_EXFILTRATION rule because the connection lasted "
                f"{flow['duration']:.0f}s (threshold: >{RULE_EXFIL_MIN_DURATION}s) "
                f"and transferred {flow['dst_bytes']:.0f} bytes outbound "
                f"(threshold: >{RULE_EXFIL_MIN_DST_BYTES:.0f} bytes)."
            ),
        }
    return None


def _rule_dos(flow: Dict[str, float]) -> Optional[Dict[str, Any]]:
    """
    RULE 3 — DENIAL OF SERVICE (DoS)
    Detects traffic where the source sends vastly more data than the 
    destination responds with — typical of a flood-style DoS attack.
    """
    ratio = flow["src_bytes"] / (flow["dst_bytes"] + 1)
    if ratio > RULE_DOS_RATIO_THRESHOLD:
        return {
            "status": "INTRUSION",
            "attack_type": "DOS",
            "detection_method": "RULE",
            "severity": "CRITICAL",
            "message": (
                f"Detected by DOS rule because the traffic imbalance ratio "
                f"src_bytes / (dst_bytes + 1) = {ratio:.1f} exceeds the "
                f"threshold of {RULE_DOS_RATIO_THRESHOLD}. This suggests an "
                f"inbound flood towards the destination host."
            ),
        }
    return None


def _rule_data_theft(flow: Dict[str, float]) -> Optional[Dict[str, Any]]:
    """
    RULE 4 — DATA THEFT
    Detects traffic where the destination returns vastly more data than 
    the source sent — indicating large unauthorised downloads.
    """
    ratio = flow["dst_bytes"] / (flow["src_bytes"] + 1)
    if ratio > RULE_DATA_THEFT_RATIO_THRESHOLD:
        return {
            "status": "INTRUSION",
            "attack_type": "DATA_THEFT",
            "detection_method": "RULE",
            "severity": "HIGH",
            "message": (
                f"Detected by DATA_THEFT rule because the traffic imbalance ratio "
                f"dst_bytes / (src_bytes + 1) = {ratio:.1f} exceeds the "
                f"threshold of {RULE_DATA_THEFT_RATIO_THRESHOLD}. This suggests "
                f"a large unauthorised data download from the destination."
            ),
        }
    return None


# ── Rule registry ─────────────────────────────────────────────────────────────
# Rules are evaluated in order. To add a new rule, define a function above 
# and append it to this list.
RULES = [
    _rule_port_scan,
    _rule_data_exfiltration,
    _rule_dos,
    _rule_data_theft,
]


# ── Public interface ──────────────────────────────────────────────────────────
def check(flow: Dict[str, float]) -> Optional[Dict[str, Any]]:
    """
    Evaluate all rules against a network flow.

    Args:
        flow: dict with keys 'duration', 'src_bytes', 'dst_bytes'.

    Returns:
        A result dict if any rule fires, otherwise None.
    """
    for rule_fn in RULES:
        result = rule_fn(flow)
        if result is not None:
            logger.info(
                "Rule matched: %s for flow=%s", result["attack_type"], flow
            )
            return result
    return None


def get_rules_info() -> list:
    """Return human-readable descriptions of all active rules."""
    return [
        {
            "name": "PORT_SCAN",
            "description": "Short connections with minimal data transfer.",
            "thresholds": {
                "duration": f"< {RULE_PORT_SCAN_MAX_DURATION}s",
                "src_bytes": f"< {RULE_PORT_SCAN_MAX_SRC_BYTES}",
                "dst_bytes": f"< {RULE_PORT_SCAN_MAX_DST_BYTES}",
            },
            "severity": "HIGH",
        },
        {
            "name": "DATA_EXFILTRATION",
            "description": "Long connection with massive outbound data transfer.",
            "thresholds": {
                "duration": f"> {RULE_EXFIL_MIN_DURATION}s",
                "dst_bytes": f"> {RULE_EXFIL_MIN_DST_BYTES}",
            },
            "severity": "CRITICAL",
        },
        {
            "name": "DOS",
            "description": "Inbound traffic flood (src >> dst).",
            "thresholds": {
                "src_bytes / (dst_bytes + 1)": f"> {RULE_DOS_RATIO_THRESHOLD}",
            },
            "severity": "CRITICAL",
        },
        {
            "name": "DATA_THEFT",
            "description": "Large unauthorised download (dst >> src).",
            "thresholds": {
                "dst_bytes / (src_bytes + 1)": f"> {RULE_DATA_THEFT_RATIO_THRESHOLD}",
            },
            "severity": "HIGH",
        },
    ]
