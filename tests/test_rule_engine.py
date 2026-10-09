"""
tests/test_rule_engine.py — Unit tests for the deterministic rule engine.

Tests verify that each rule fires on flows that match its thresholds 
and does NOT fire on normal flows.
"""

import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from backend.services.rule_engine import check


# ── Helper ────────────────────────────────────────────────────────────────────
def flow(duration, src_bytes, dst_bytes):
    return {"duration": duration, "src_bytes": src_bytes, "dst_bytes": dst_bytes}


# ── Rule 1: Port Scan ─────────────────────────────────────────────────────────
class TestPortScanRule:
    def test_fires_on_port_scan(self):
        result = check(flow(0.3, 40, 20))
        assert result is not None
        assert result["attack_type"] == "PORT_SCAN"
        assert result["detection_method"] == "RULE"
        assert result["severity"] == "HIGH"
        assert result["status"] == "INTRUSION"

    def test_fires_on_boundary_values(self):
        # Exactly at boundary: duration=0.99, bytes=99
        result = check(flow(0.99, 99, 99))
        assert result is not None
        assert result["attack_type"] == "PORT_SCAN"

    def test_does_not_fire_on_normal(self):
        result = check(flow(5.0, 5000, 3000))
        # Normal traffic should not trigger port scan
        if result is not None:
            assert result["attack_type"] != "PORT_SCAN"

    def test_does_not_fire_when_duration_too_long(self):
        # duration >= 1 should not trigger port scan
        result = check(flow(1.5, 30, 20))
        if result is not None:
            assert result["attack_type"] != "PORT_SCAN"

    def test_does_not_fire_when_bytes_too_high(self):
        result = check(flow(0.5, 500, 20))
        if result is not None:
            assert result["attack_type"] != "PORT_SCAN"


# ── Rule 2: Data Exfiltration ─────────────────────────────────────────────────
class TestDataExfiltrationRule:
    def test_fires_on_exfiltration(self):
        result = check(flow(300, 500, 50_000_000))
        assert result is not None
        assert result["attack_type"] == "DATA_EXFILTRATION"
        assert result["severity"] == "CRITICAL"

    def test_does_not_fire_short_duration(self):
        result = check(flow(30, 500, 50_000_000))
        if result is not None:
            assert result["attack_type"] != "DATA_EXFILTRATION"

    def test_does_not_fire_small_bytes(self):
        result = check(flow(300, 500, 100_000))
        if result is not None:
            assert result["attack_type"] != "DATA_EXFILTRATION"

    def test_message_contains_thresholds(self):
        result = check(flow(300, 500, 50_000_000))
        assert result is not None
        assert "DATA_EXFILTRATION" in result["message"]


# ── Rule 3: DoS ───────────────────────────────────────────────────────────────
class TestDoSRule:
    def test_fires_on_dos_flood(self):
        # src_bytes >> dst_bytes  → ratio > 10
        result = check(flow(10, 5_000_000, 100))
        assert result is not None
        assert result["attack_type"] == "DOS"
        assert result["severity"] == "CRITICAL"

    def test_fires_at_exact_threshold(self):
        # ratio = 1100 / (100 + 1) ≈ 10.89 > 10
        result = check(flow(5, 1100, 100))
        assert result is not None
        assert result["attack_type"] == "DOS"

    def test_does_not_fire_balanced_traffic(self):
        result = check(flow(10, 5000, 4000))
        if result is not None:
            assert result["attack_type"] != "DOS"

    def test_dos_zero_dst_bytes(self):
        # dst_bytes=0: ratio = src_bytes / 1
        result = check(flow(5, 10_000, 0))
        assert result is not None
        assert result["attack_type"] == "DOS"


# ── Rule 4: Data Theft ────────────────────────────────────────────────────────
class TestDataTheftRule:
    def test_fires_on_large_download(self):
        # dst >> src
        result = check(flow(30, 200, 200_000))
        assert result is not None
        assert result["attack_type"] == "DATA_THEFT"
        assert result["severity"] == "HIGH"

    def test_does_not_fire_balanced(self):
        result = check(flow(30, 5000, 5000))
        if result is not None:
            assert result["attack_type"] != "DATA_THEFT"

    def test_data_theft_zero_src_bytes(self):
        # src_bytes=0: ratio = dst_bytes / 1
        result = check(flow(10, 0, 50_000))
        assert result is not None
        assert result["attack_type"] == "DATA_THEFT"


# ── Normal traffic ────────────────────────────────────────────────────────────
class TestNormalTraffic:
    def test_normal_http(self):
        result = check(flow(5, 900, 700))
        # ratio src/dst = 900/701 ≈ 1.28 — should NOT trigger DoS or data theft
        assert result is None

    def test_normal_large_session(self):
        result = check(flow(50, 50_000, 40_000))
        assert result is None

    def test_normal_short_but_balanced(self):
        # Short but bytes > 100 so not port scan; balanced so not dos/theft
        result = check(flow(0.5, 500, 400))
        assert result is None
