"""
utils/validation.py — Input validation for the /api/predict endpoint.

Why this exists:
  Accepting arbitrary user input without validation is a security risk 
  and causes confusing server-side errors. This module rejects malformed 
  requests early so the detection pipeline only receives clean data.

How it connects to the NIDS architecture:
  Called by the prediction route before the flow is passed to the
  detection service.
"""

from typing import Tuple, Optional, Dict, Any


REQUIRED_FIELDS = ("duration", "src_bytes", "dst_bytes")


def validate_flow(data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """
    Validate a network-flow dictionary.

    Returns:
        (True, None)            if the input is valid.
        (False, error_message)  if the input is invalid.
    """
    if not isinstance(data, dict):
        return False, "Request body must be a JSON object."

    # Check for required fields
    missing = [f for f in REQUIRED_FIELDS if f not in data]
    if missing:
        return False, f"Missing required field(s): {', '.join(missing)}"

    # Validate each field
    for field in REQUIRED_FIELDS:
        value = data[field]

        # Must be numeric
        if not isinstance(value, (int, float)):
            return False, (
                f"Field '{field}' must be a number, "
                f"got {type(value).__name__!r}."
            )

        # Must not be NaN or infinite
        import math
        if math.isnan(value) or math.isinf(value):
            return False, f"Field '{field}' must be a finite number."

        # Must be non-negative
        if value < 0:
            return False, f"Field '{field}' must be non-negative, got {value}."

    return True, None


def sanitize_flow(data: Dict[str, Any]) -> Dict[str, float]:
    """
    Extract and cast validated flow fields to float.
    Call only AFTER validate_flow returns (True, None).
    """
    return {field: float(data[field]) for field in REQUIRED_FIELDS}
