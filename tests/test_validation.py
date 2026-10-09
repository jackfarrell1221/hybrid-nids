"""
tests/test_validation.py — Tests for input validation.
"""

import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from backend.utils.validation import validate_flow, sanitize_flow


class TestValidation:
    # ── Valid inputs ──────────────────────────────────────────────────────────
    def test_valid_input(self):
        ok, err = validate_flow({"duration": 5, "src_bytes": 900, "dst_bytes": 700})
        assert ok is True
        assert err is None

    def test_valid_float_input(self):
        ok, err = validate_flow({"duration": 5.5, "src_bytes": 900.5, "dst_bytes": 700.1})
        assert ok is True

    def test_valid_zero_values(self):
        ok, err = validate_flow({"duration": 0, "src_bytes": 0, "dst_bytes": 0})
        assert ok is True

    # ── Missing fields ────────────────────────────────────────────────────────
    def test_missing_duration(self):
        ok, err = validate_flow({"src_bytes": 900, "dst_bytes": 700})
        assert ok is False
        assert "duration" in err

    def test_missing_src_bytes(self):
        ok, err = validate_flow({"duration": 5, "dst_bytes": 700})
        assert ok is False
        assert "src_bytes" in err

    def test_missing_dst_bytes(self):
        ok, err = validate_flow({"duration": 5, "src_bytes": 900})
        assert ok is False
        assert "dst_bytes" in err

    def test_all_missing(self):
        ok, err = validate_flow({})
        assert ok is False

    # ── Negative values ───────────────────────────────────────────────────────
    def test_negative_duration(self):
        ok, err = validate_flow({"duration": -1, "src_bytes": 900, "dst_bytes": 700})
        assert ok is False
        assert "duration" in err

    def test_negative_src_bytes(self):
        ok, err = validate_flow({"duration": 5, "src_bytes": -10, "dst_bytes": 700})
        assert ok is False

    def test_negative_dst_bytes(self):
        ok, err = validate_flow({"duration": 5, "src_bytes": 900, "dst_bytes": -1})
        assert ok is False

    # ── Invalid data types ────────────────────────────────────────────────────
    def test_string_duration(self):
        ok, err = validate_flow({"duration": "five", "src_bytes": 900, "dst_bytes": 700})
        assert ok is False
        assert "duration" in err

    def test_none_value(self):
        ok, err = validate_flow({"duration": None, "src_bytes": 900, "dst_bytes": 700})
        assert ok is False

    def test_not_a_dict(self):
        ok, err = validate_flow("not a dict")
        assert ok is False

    def test_list_input(self):
        ok, err = validate_flow([1, 2, 3])
        assert ok is False

    # ── Sanitize ──────────────────────────────────────────────────────────────
    def test_sanitize_returns_floats(self):
        flow = sanitize_flow({"duration": 5, "src_bytes": 900, "dst_bytes": 700})
        assert all(isinstance(v, float) for v in flow.values())

    def test_sanitize_correct_keys(self):
        flow = sanitize_flow({"duration": 5, "src_bytes": 900, "dst_bytes": 700})
        assert set(flow.keys()) == {"duration", "src_bytes", "dst_bytes"}
