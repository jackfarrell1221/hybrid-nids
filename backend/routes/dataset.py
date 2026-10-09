"""
routes/dataset.py — /api/dataset/validate, /api/dataset/evaluate, /api/dataset/train endpoints.

Why this exists:
  Allows users to upload custom CSV network flow datasets, parse/validate columns,
  evaluate flows through the hybrid pipeline, calculate evaluation metrics,
  export predictions, and optionally retrain the Random Forest model.
"""

import os
import io
import time
import json
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
import pandas as pd
import numpy as np
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)

from backend.config import (
    FEATURE_COLUMNS,
    DATASET_PATH,
    EVAL_RESULTS_PATH
)
from backend.services.detection_service import detect_flow
from backend.models.model_manager import train_model
from backend.services.ml_detector import get_detector
from backend.utils.logger import get_logger

logger = get_logger("routes.dataset")

dataset_bp = Blueprint("dataset", __name__)


def parse_csv_from_request(req) -> pd.DataFrame:
    """Helper to parse DataFrame from file upload or JSON payload."""
    if "file" in req.files:
        file = req.files["file"]
        if file.filename == "":
            raise ValueError("No file selected for upload.")
        df = pd.read_csv(file)
    elif req.is_json:
        data = req.get_json()
        if "csv_text" in data:
            df = pd.read_csv(io.StringIO(data["csv_text"]))
        elif "rows" in data:
            df = pd.DataFrame(data["rows"])
        else:
            raise ValueError("JSON request must contain 'csv_text' or 'rows'.")
    else:
        raise ValueError("Invalid request. Provide a CSV file upload or JSON payload.")

    return df


@dataset_bp.route("/api/dataset/validate", methods=["POST"])
def validate_dataset():
    """
    POST /api/dataset/validate
    Validates CSV headers and returns row count, columns, and sample preview.
    """
    try:
        df = parse_csv_from_request(request)
        total_rows = len(df)

        missing_features = [col for col in FEATURE_COLUMNS if col not in df.columns]
        has_labels = "label" in df.columns or "attack_type" in df.columns

        # Sanitize sample rows for JSON serialization
        sample_rows = df.head(10).replace({np.nan: None}).to_dict(orient="records")

        return jsonify({
            "status": "valid" if len(missing_features) == 0 else "invalid",
            "total_rows": total_rows,
            "columns": list(df.columns),
            "missing_features": missing_features,
            "has_labels": has_labels,
            "sample_rows": sample_rows,
        }), 200

    except Exception as exc:
        logger.exception("Dataset validation failed: %s", exc)
        return jsonify({"error": str(exc)}), 400


@dataset_bp.route("/api/dataset/evaluate", methods=["POST"])
def evaluate_custom_dataset():
    """
    POST /api/dataset/evaluate
    Runs the hybrid pipeline across every row of the uploaded CSV dataset,
    calculates metrics if ground-truth labels exist, and returns predictions.
    """
    try:
        df = parse_csv_from_request(request)

        # Check required columns
        for col in FEATURE_COLUMNS:
            if col not in df.columns:
                return jsonify({"error": f"Missing required column: {col}"}), 400

        predictions = []
        latencies_ms = []
        rule_count = 0
        ml_count = 0
        normal_count = 0
        intrusion_count = 0
        attack_distribution = {}

        has_ground_truth = "label" in df.columns
        ground_truths = []

        for idx, row in df.iterrows():
            flow = {col: float(row[col]) for col in FEATURE_COLUMNS}
            t0 = time.monotonic()
            res = detect_flow(flow)
            lat_ms = (time.monotonic() - t0) * 1000
            latencies_ms.append(lat_ms)

            status = res.get("status", "NORMAL")
            method = res.get("detection_method", "UNKNOWN")
            attack_type = res.get("attack_type")

            if method == "RULE":
                rule_count += 1
            else:
                ml_count += 1

            if status == "NORMAL":
                normal_count += 1
            else:
                intrusion_count += 1
                if attack_type:
                    attack_distribution[attack_type] = attack_distribution.get(attack_type, 0) + 1

            pred_item = {
                "id": idx + 1,
                "duration": flow["duration"],
                "src_bytes": flow["src_bytes"],
                "dst_bytes": flow["dst_bytes"],
                "status": status,
                "detection_method": method,
                "attack_type": attack_type,
                "severity": res.get("severity", "LOW"),
                "latency_ms": round(lat_ms, 3),
                "message": res.get("message", ""),
            }

            if has_ground_truth:
                gt_val = str(row["label"]).upper()
                gt_normal = "NORMAL" if gt_val in ["NORMAL", "0", "FALSE"] else "INTRUSION"
                ground_truths.append(gt_normal)
                pred_item["ground_truth"] = gt_normal
                pred_item["correct"] = (status == gt_normal)

            predictions.append(pred_item)

        # Calculate evaluation metrics if ground truth is available
        metrics = None
        confusion_mat = None
        report = None

        if has_ground_truth and len(ground_truths) > 0:
            gt_binary = [1 if x == "INTRUSION" else 0 for x in ground_truths]
            pred_binary = [1 if p["status"] == "INTRUSION" else 0 for p in predictions]

            prec = float(precision_score(gt_binary, pred_binary, zero_division=0))
            rec = float(recall_score(gt_binary, pred_binary, zero_division=0))
            f1 = float(f1_score(gt_binary, pred_binary, zero_division=0))
            acc = float(np.mean([1 if a == b else 0 for a, b in zip(gt_binary, pred_binary)]))
            cm = confusion_matrix(gt_binary, pred_binary).tolist()

            report = classification_report(
                ground_truths, [p["status"] for p in predictions],
                labels=["NORMAL", "INTRUSION"],
                target_names=["NORMAL", "INTRUSION"],
                output_dict=True,
                zero_division=0
            )

            metrics = {
                "precision": round(prec, 4),
                "recall": round(rec, 4),
                "f1_score": round(f1, 4),
                "accuracy": round(acc, 4),
                "avg_latency_ms": round(float(np.mean(latencies_ms)), 3),
            }

            confusion_mat = {
                "labels": ["NORMAL", "INTRUSION"],
                "matrix": cm
            }

        result_data = {
            "meta": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "total_samples": len(df),
                "has_ground_truth": has_ground_truth,
            },
            "metrics": metrics,
            "confusion_matrix": confusion_mat,
            "classification_report": report,
            "attack_distribution": attack_distribution,
            "counts": {
                "total": len(df),
                "normal_predicted": normal_count,
                "intrusion_predicted": intrusion_count,
                "rule_detections": rule_count,
                "ml_detections": ml_count,
            },
            "predictions": predictions,
        }

        # Optionally cache custom evaluation result
        try:
            with open(EVAL_RESULTS_PATH, "w", encoding="utf-8") as f:
                json.dump(result_data, f, indent=2)
        except Exception as e:
            logger.warning("Could not cache evaluation file: %s", e)

        return jsonify(result_data), 200

    except Exception as exc:
        logger.exception("Dataset evaluation failed: %s", exc)
        return jsonify({"error": str(exc)}), 500


@dataset_bp.route("/api/dataset/train", methods=["POST"])
def train_custom_dataset():
    """
    POST /api/dataset/train
    Saves uploaded CSV data as sample_data.csv and triggers Random Forest training.
    """
    try:
        df = parse_csv_from_request(request)

        for col in FEATURE_COLUMNS:
            if col not in df.columns:
                return jsonify({"error": f"Dataset missing required column: {col}"}), 400

        # Save to dataset path
        os.makedirs(os.path.dirname(DATASET_PATH), exist_ok=True)
        cols_to_save = FEATURE_COLUMNS + ["label"] if "label" in df.columns else FEATURE_COLUMNS
        df[cols_to_save].to_csv(DATASET_PATH, index=False)
        logger.info("Saved custom training dataset with %d rows to %s", len(df), DATASET_PATH)

        # Trigger model retraining & reload
        result = train_model()
        get_detector().reload()

        return jsonify({
            "status": "success",
            "message": f"Successfully retrained model on custom dataset ({len(df)} samples).",
            "details": result,
        }), 200

    except Exception as exc:
        logger.exception("Custom dataset training failed: %s", exc)
        return jsonify({"error": str(exc)}), 500
