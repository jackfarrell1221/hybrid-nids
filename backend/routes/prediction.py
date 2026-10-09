"""
routes/prediction.py — /api/predict and /api/health endpoints.

Why this exists:
  Separating route definitions from business logic keeps app.py clean 
  and makes it easy to add, remove, or version individual API routes.

How it connects to the NIDS architecture:
  /api/predict is the primary entry point for external callers 
  (the frontend and the simulator). It validates input then delegates 
  entirely to detection_service.detect_flow().
"""

from flask import Blueprint, request, jsonify

from backend.services.detection_service import detect_flow
from backend.models.model_manager import get_alert_db
from backend.services.ml_detector import get_detector
from backend.utils.validation import validate_flow, sanitize_flow
from backend.utils.logger import get_logger

logger = get_logger("routes.prediction")

prediction_bp = Blueprint("prediction", __name__)


@prediction_bp.route("/api/health", methods=["GET"])
def health():
    """
    GET /api/health
    Returns system liveness and model status.
    """
    detector = get_detector()
    return jsonify({
        "status":       "online",
        "model_loaded": detector.is_ready,
        "message":      "Hybrid NIDS is running.",
    }), 200


@prediction_bp.route("/api/predict", methods=["POST"])
def predict():
    """
    POST /api/predict
    Accepts a network flow JSON and returns a detection result.

    Expected body:
        { "duration": <float>, "src_bytes": <float>, "dst_bytes": <float> }
    """
    # ── Parse JSON body ───────────────────────────────────────────────────────
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"error": "Request body must be valid JSON."}), 400

    # ── Validate ──────────────────────────────────────────────────────────────
    valid, error_msg = validate_flow(data)
    if not valid:
        logger.warning("Invalid predict request: %s", error_msg)
        return jsonify({"error": error_msg}), 400

    # ── Sanitise (cast to float) ──────────────────────────────────────────────
    flow = sanitize_flow(data)

    # ── Detect ────────────────────────────────────────────────────────────────
    try:
        result = detect_flow(flow)
        # Also log the flow in the flows table for statistics
        get_alert_db().log_flow(result)
        return jsonify(result), 200
    except Exception as exc:
        logger.exception("Error during detection: %s", exc)
        return jsonify({"error": "Internal detection error.", "detail": str(exc)}), 500
