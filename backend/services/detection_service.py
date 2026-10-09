"""
services/detection_service.py — Central detection orchestrator.

Why this exists:
  This is the single authoritative place that decides HOW a flow is 
  classified. It enforces the pipeline order:
    1. Rules (deterministic, fast)
    2. Isolation Forest (ML, fallback)

  No route or other module should duplicate this logic.

How it connects to the NIDS architecture:
  All detection requests — whether from /api/predict or the simulator —
  pass through detect_flow(). This guarantees consistent behaviour 
  regardless of which API endpoint received the request.
"""

import time
from datetime import datetime, timezone
from typing import Dict, Any

from backend.services import rule_engine
from backend.services.ml_detector import get_detector
from backend.models.model_manager import get_alert_db
from backend.utils.logger import get_logger

logger = get_logger("detection_service")


def detect_flow(flow: Dict[str, float]) -> Dict[str, Any]:
    """
    Main detection entry point.

    Pipeline:
        flow → rule_engine.check() → if match: return rule result
                                   → else:      ml_detector.predict()

    Args:
        flow: sanitised dict with 'duration', 'src_bytes', 'dst_bytes'.

    Returns:
        Full detection result dict enriched with timestamp and flow echo.
    """
    t_start = time.monotonic()

    # ── Step 1: Rule-based detection ─────────────────────────────────────────
    rule_result = rule_engine.check(flow)

    if rule_result is not None:
        result = rule_result
        result["latency_ms"] = (time.monotonic() - t_start) * 1000
    else:
        # ── Step 2: ML detection ──────────────────────────────────────────────
        result = get_detector().predict(flow)
        # latency_ms is already set inside ml_detector.predict()
        if "latency_ms" not in result:
            result["latency_ms"] = (time.monotonic() - t_start) * 1000

    # ── Enrich with flow echo and timestamp ───────────────────────────────────
    result["duration"]  = flow["duration"]
    result["src_bytes"] = flow["src_bytes"]
    result["dst_bytes"] = flow["dst_bytes"]
    result["timestamp"] = datetime.now(timezone.utc).isoformat()

    # ── Persist intrusions to the alert database ──────────────────────────────
    if result.get("status") == "INTRUSION":
        try:
            db = get_alert_db()
            db.insert_alert(result)
        except Exception as exc:
            logger.error("Failed to persist alert: %s", exc)

    logger.info(
        "detect_flow: status=%s method=%s latency=%.2f ms",
        result.get("status"),
        result.get("detection_method"),
        result.get("latency_ms", 0),
    )
    return result
