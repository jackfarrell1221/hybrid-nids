"""
routes/training.py — /api/train endpoint.

Why this exists:
  Training is an administrative action that should be triggerable 
  from the dashboard. Separating it into its own blueprint keeps the 
  route surface area manageable.
"""

from flask import Blueprint, jsonify

from backend.models.model_manager import train_model
from backend.services.ml_detector import get_detector
from backend.utils.logger import get_logger

logger = get_logger("routes.training")

training_bp = Blueprint("training", __name__)


@training_bp.route("/api/train", methods=["POST"])
def train():
    """
    POST /api/train
    Trains the Isolation Forest model on sample_data.csv and 
    reloads it into the running server.
    """
    try:
        result = train_model()

        # Reload the in-memory model so predictions use the freshly trained weights
        get_detector().reload()
        logger.info("Model retrained and reloaded successfully.")

        return jsonify(result), 200

    except FileNotFoundError as exc:
        logger.error("Training failed — dataset not found: %s", exc)
        return jsonify({"error": str(exc)}), 404

    except Exception as exc:
        logger.exception("Training failed: %s", exc)
        return jsonify({"error": "Training failed.", "detail": str(exc)}), 500
