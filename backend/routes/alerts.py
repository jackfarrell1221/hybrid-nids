"""
routes/alerts.py — /api/alerts, /api/statistics, /api/rules endpoints.

Why this exists:
  The dashboard needs historical alert data and aggregated statistics.
  Separating these read-only query routes from the write/detection routes 
  makes the API surface clear.
"""

from flask import Blueprint, request, jsonify

from backend.models.model_manager import get_alert_db
from backend.services.rule_engine import get_rules_info
from backend.utils.logger import get_logger

logger = get_logger("routes.alerts")

alerts_bp = Blueprint("alerts", __name__)


@alerts_bp.route("/api/alerts", methods=["GET"])
def get_alerts():
    """
    GET /api/alerts?limit=50
    Returns the most recent intrusion alerts.
    """
    try:
        limit = int(request.args.get("limit", 100))
        alerts = get_alert_db().get_alerts(limit=limit)
        return jsonify({"alerts": alerts, "count": len(alerts)}), 200
    except Exception as exc:
        logger.exception("Failed to fetch alerts: %s", exc)
        return jsonify({"error": str(exc)}), 500


@alerts_bp.route("/api/alerts/<int:alert_id>/triage", methods=["PUT"])
def update_alert_triage(alert_id: int):
    """
    PUT /api/alerts/<alert_id>/triage
    Payload: {"triage_status": "ACKNOWLEDGED" | "RESOLVED" | "FALSE_POSITIVE" | "OPEN"}
    Updates triage status of an alert.
    """
    try:
        data = request.get_json() or {}
        new_status = data.get("triage_status", "ACKNOWLEDGED").upper()
        allowed = ["OPEN", "ACKNOWLEDGED", "RESOLVED", "FALSE_POSITIVE"]
        if new_status not in allowed:
            return jsonify({"error": f"Invalid triage status. Must be one of {allowed}"}), 400

        updated = get_alert_db().update_triage_status(alert_id, new_status)
        if not updated:
            return jsonify({"error": f"Alert with ID {alert_id} not found."}), 404

        return jsonify({"status": "success", "alert_id": alert_id, "triage_status": new_status}), 200

    except Exception as exc:
        logger.exception("Failed updating alert triage status: %s", exc)
        return jsonify({"error": str(exc)}), 500



@alerts_bp.route("/api/statistics", methods=["GET"])
def get_statistics():
    """
    GET /api/statistics
    Returns aggregated detection statistics.
    """
    try:
        stats = get_alert_db().get_statistics()
        return jsonify(stats), 200
    except Exception as exc:
        logger.exception("Failed to compute statistics: %s", exc)
        return jsonify({"error": str(exc)}), 500


@alerts_bp.route("/api/rules", methods=["GET"])
def get_rules():
    """
    GET /api/rules
    Returns human-readable descriptions of all active detection rules.
    """
    return jsonify({"rules": get_rules_info()}), 200


@alerts_bp.route("/api/evaluation", methods=["GET"])
def get_evaluation():
    """
    GET /api/evaluation
    Returns offline benchmark results from results/evaluation.json.
    """
    import os, json
    from backend.config import EVAL_RESULTS_PATH
    if os.path.exists(EVAL_RESULTS_PATH):
        try:
            with open(EVAL_RESULTS_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            return jsonify(data), 200
        except Exception as exc:
            return jsonify({"error": f"Failed reading evaluation file: {exc}"}), 500
    return jsonify({"error": "Evaluation results not found. Run scripts/evaluate.py first."}), 404


@alerts_bp.route("/api/model/info", methods=["GET"])
def get_model_info():
    """
    GET /api/model/info
    Returns configuration and status metadata for the Isolation Forest model.
    """
    import os
    from datetime import datetime, timezone
    from backend.config import (
        MODEL_PATH,
        FEATURE_COLUMNS,
        RANDOM_FOREST_N_ESTIMATORS,
        RANDOM_FOREST_RANDOM_STATE,
    )
    from backend.services.ml_detector import get_detector

    detector = get_detector()
    exists = os.path.exists(MODEL_PATH)
    file_info = {}
    if exists:
        try:
            stat = os.stat(MODEL_PATH)
            file_info = {
                "size_bytes": stat.st_size,
                "last_modified": datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(),
            }
        except Exception:
            pass

    return jsonify({
        "model_name": "Random Forest",
        "algorithm": "sklearn.ensemble.RandomForestClassifier",
        "loaded": detector.is_ready,
        "features": FEATURE_COLUMNS,
        "n_estimators": RANDOM_FOREST_N_ESTIMATORS,
        "random_state": RANDOM_FOREST_RANDOM_STATE,
        "model_path": MODEL_PATH,
        "file_exists": exists,
        "file_info": file_info,
    }), 200


@alerts_bp.route("/api/system/health", methods=["GET"])
def get_system_health():
    """
    GET /api/system/health
    Comprehensive health check across backend components.
    """
    import os
    from datetime import datetime, timezone
    from backend.config import DATABASE_PATH, MODEL_PATH
    from backend.services.ml_detector import get_detector

    detector = get_detector()
    db_exists = os.path.exists(DATABASE_PATH)
    model_exists = os.path.exists(MODEL_PATH)

    return jsonify({
        "status": "operational",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "components": {
            "api": {"status": "operational", "name": "REST API"},
            "rule_engine": {"status": "operational", "active_rules": 4},
            "ml_detector": {
                "status": "operational" if detector.is_ready else "not_loaded",
                "ready": detector.is_ready,
                "model_exists": model_exists,
            },
            "database": {
                "status": "operational" if db_exists else "initializing",
                "connected": True,
                "type": "SQLite3",
            },
        },
    }), 200
