"""
services/ml_detector.py — Isolation Forest anomaly detection.

Why this exists:
  Rules cannot catch every attack. Unknown or novel traffic patterns 
  that deviate from normal behaviour are caught by the Isolation Forest,
  an unsupervised ML model trained only on normal traffic statistics.

How it connects to the NIDS architecture:
  Called by the detection service when no rule fires. The model is 
  loaded at startup and kept in memory for low-latency inference.

Isolation Forest interpretation:
  predict() returns  1 → inlier  (NORMAL)
                    -1 → outlier (ANOMALY / INTRUSION)
"""

import os
import time
import numpy as np
import joblib
from typing import Dict, Any, Optional

from backend.config import (
    MODEL_PATH,
    FEATURE_COLUMNS,
    RANDOM_FOREST_N_ESTIMATORS,
    RANDOM_FOREST_RANDOM_STATE,
)
from backend.utils.logger import get_logger

logger = get_logger("ml_detector")


class MLDetector:
    """
    Wraps the trained Isolation Forest model and provides a simple predict 
    interface compatible with the detection service.
    """

    def __init__(self) -> None:
        self._model = None
        self._model_loaded = False
        self._load_model()

    # ── Model loading ─────────────────────────────────────────────────────────

    def _load_model(self) -> None:
        """Attempt to load the persisted model from disk."""
        if os.path.exists(MODEL_PATH):
            try:
                self._model = joblib.load(MODEL_PATH)
                self._model_loaded = True
                logger.info("Isolation Forest model loaded from %s", MODEL_PATH)
            except Exception as exc:
                logger.warning("Failed to load model from %s: %s", MODEL_PATH, exc)
        else:
            logger.warning(
                "Model file not found at %s. POST /api/train to create it.", MODEL_PATH
            )

    def reload(self) -> None:
        """Reload the model from disk (called after /api/train)."""
        self._model_loaded = False
        self._model = None
        self._load_model()

    @property
    def is_ready(self) -> bool:
        return self._model_loaded and self._model is not None

    # ── Prediction ────────────────────────────────────────────────────────────

    def predict(self, flow: Dict[str, float]) -> Dict[str, Any]:
        """
        Run the Isolation Forest on a single network flow.

        Args:
            flow: dict with keys matching FEATURE_COLUMNS.

        Returns:
            A detection result dict.
        """
        if not self.is_ready:
            # Model not available — return a safe fallback
            return {
                "status": "UNKNOWN",
                "attack_type": None,
                "detection_method": "ISOLATION_FOREST",
                "severity": "UNKNOWN",
                "anomaly_score": None,
                "message": (
                    "ML model is not trained yet. "
                    "POST /api/train to train the model."
                ),
            }

        # Build feature vector in the correct column order
        feature_vector = np.array([[flow[col] for col in FEATURE_COLUMNS]])

        t0 = time.monotonic()
        raw_prediction = self._model.predict(feature_vector)[0]
        
        if hasattr(self._model, "predict_proba"):
            anomaly_score = float(self._model.predict_proba(feature_vector)[0][1])
        else:
            anomaly_score = float(self._model.score_samples(feature_vector)[0])
            raw_prediction = 1 if raw_prediction == -1 else 0
        latency_ms     = (time.monotonic() - t0) * 1000

        is_anomaly = raw_prediction == 1

        if is_anomaly:
            logger.info(
                "ML ANOMALY detected (score=%.4f, latency=%.2f ms) for flow=%s",
                anomaly_score, latency_ms, flow,
            )
            return {
                "status": "INTRUSION",
                "attack_type": "ML_ANOMALY",
                "detection_method": "RANDOM_FOREST",
                "severity": "MEDIUM",
                "anomaly_score": anomaly_score,
                "latency_ms": latency_ms,
                "message": (
                    "Traffic was classified as anomalous by Random Forest "
                    "because its feature pattern (duration, src_bytes, dst_bytes) "
                    "matched learned attack traffic "
                    f"(anomaly score: {anomaly_score:.4f})."
                ),
            }
        else:
            return {
                "status": "NORMAL",
                "attack_type": None,
                "detection_method": "RANDOM_FOREST",
                "severity": "LOW",
                "anomaly_score": anomaly_score,
                "latency_ms": latency_ms,
                "message": (
                    "Traffic classified as normal by Random Forest. "
                    f"Anomaly score: {anomaly_score:.4f}."
                ),
            }


# ── Module-level singleton ────────────────────────────────────────────────────
# Instantiated once at import time; all routes share this instance.
_detector: Optional[MLDetector] = None


def get_detector() -> MLDetector:
    global _detector
    if _detector is None:
        _detector = MLDetector()
    return _detector
