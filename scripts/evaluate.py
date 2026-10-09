"""
scripts/evaluate.py — Offline evaluation of the Hybrid NIDS.

Why this exists:
  This script provides a rigorous, offline evaluation of the full 
  detection pipeline against labelled test data. It calculates 
  precision, recall, F1-score, and confusion matrix so claims about 
  system performance are grounded in actual measurements.

IMPORTANT DISCLAIMER:
  All metrics are computed on SYNTHETIC test data.
  This does NOT represent performance against real network traffic.
  The system is a proof-of-concept evaluated in a controlled environment.

How to run:
    python scripts/evaluate.py

Results are saved to:
    results/evaluation.json
"""

import os
import sys
import json
import time
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    confusion_matrix, classification_report,
)

from backend.config import (
    TEST_DATA_PATH,
    DATASET_PATH,
    FEATURE_COLUMNS,
    EVAL_RESULTS_PATH,
)
from backend.services.detection_service import detect_flow
from backend.utils.validation import sanitize_flow
from backend.utils.logger import get_logger

logger = get_logger("evaluate")


def load_test_data() -> pd.DataFrame:
    if os.path.exists(TEST_DATA_PATH):
        df = pd.read_csv(TEST_DATA_PATH)
        logger.info("Loaded test data from %s (%d rows)", TEST_DATA_PATH, len(df))
    elif os.path.exists(DATASET_PATH):
        logger.warning("test_data.csv not found; using sample_data.csv instead.")
        df = pd.read_csv(DATASET_PATH)
    else:
        raise FileNotFoundError(
            "No dataset found. Run: python scripts/generate_dataset.py"
        )
    return df


def run_evaluation() -> dict:
    df = load_test_data()

    # Ensure required columns exist
    for col in FEATURE_COLUMNS:
        if col not in df.columns:
            raise ValueError(f"Missing column '{col}' in test data.")

    if "label" not in df.columns:
        raise ValueError("Test data must have a 'label' column for evaluation.")

    ground_truths = []   # "NORMAL" or "INTRUSION"
    predictions   = []   # "NORMAL" or "INTRUSION"
    latencies_ms  = []

    rule_count = 0
    ml_count   = 0
    normal_count     = 0
    intrusion_count  = 0

    print(f"\n[+] Evaluating {len(df)} flows ...")
    for idx, row in df.iterrows():
        flow = {col: float(row[col]) for col in FEATURE_COLUMNS}
        gt_label = "INTRUSION" if row["label"] == "INTRUSION" else "NORMAL"
        ground_truths.append(gt_label)

        t0 = time.monotonic()
        result = detect_flow(flow)
        lat_ms = (time.monotonic() - t0) * 1000
        latencies_ms.append(lat_ms)

        pred_label = result.get("status", "NORMAL")
        predictions.append(pred_label)

        if result.get("detection_method") == "RULE":
            rule_count += 1
        else:
            ml_count += 1

        if pred_label == "NORMAL":
            normal_count += 1
        else:
            intrusion_count += 1

        if (idx + 1) % 100 == 0:
            print(f"  ... processed {idx + 1}/{len(df)}")

    # ── Metrics ───────────────────────────────────────────────────────────────
    gt_binary   = [1 if x == "INTRUSION" else 0 for x in ground_truths]
    pred_binary = [1 if x == "INTRUSION" else 0 for x in predictions]

    precision = precision_score(gt_binary, pred_binary, zero_division=0)
    recall    = recall_score(gt_binary, pred_binary, zero_division=0)
    f1        = f1_score(gt_binary, pred_binary, zero_division=0)
    cm        = confusion_matrix(gt_binary, pred_binary).tolist()
    avg_lat   = float(np.mean(latencies_ms))

    report = classification_report(
        ground_truths, predictions,
        labels=["NORMAL", "INTRUSION"],
        target_names=["NORMAL", "INTRUSION"],
        output_dict=True,
    )

    results = {
        "meta": {
            "timestamp":    datetime.now(timezone.utc).isoformat(),
            "test_samples": len(df),
            "disclaimer":   (
                "This is a proof-of-concept NIDS evaluated using a "
                "controlled synthetic/artificial network environment. "
                "Metrics do not represent production performance."
            ),
        },
        "metrics": {
            "precision":      round(precision, 4),
            "recall":         round(recall, 4),
            "f1_score":       round(f1, 4),
            "avg_latency_ms": round(avg_lat, 3),
        },
        "confusion_matrix": {
            "labels": ["NORMAL", "INTRUSION"],
            "matrix": cm,
        },
        "classification_report": report,
        "counts": {
            "total":            len(df),
            "normal_predicted": normal_count,
            "intrusion_predicted": intrusion_count,
            "rule_detections":  rule_count,
            "ml_detections":    ml_count,
        },
    }

    return results


def save_results(results: dict):
    os.makedirs(os.path.dirname(EVAL_RESULTS_PATH), exist_ok=True)
    with open(EVAL_RESULTS_PATH, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\n[+] Results saved to {EVAL_RESULTS_PATH}")


def print_report(results: dict):
    m = results["metrics"]
    c = results["counts"]
    print("\n" + "="*55)
    print("  HYBRID NIDS -- EVALUATION REPORT")
    print("="*55)
    print(f"  Total test samples : {c['total']}")
    print(f"  Normal predicted   : {c['normal_predicted']}")
    print(f"  Intrusion detected : {c['intrusion_predicted']}")
    print(f"  Rule detections    : {c['rule_detections']}")
    print(f"  ML detections      : {c['ml_detections']}")
    print("  " + "-"*40)
    print(f"  Precision          : {m['precision']:.4f}")
    print(f"  Recall             : {m['recall']:.4f}")
    print(f"  F1 Score           : {m['f1_score']:.4f}")
    print(f"  Avg Latency        : {m['avg_latency_ms']:.3f} ms")
    print("="*55)
    print("\n  [!] DISCLAIMER:")
    print(f"  {results['meta']['disclaimer']}")
    print("="*55)


if __name__ == "__main__":
    try:
        results = run_evaluation()
        save_results(results)
        print_report(results)
    except FileNotFoundError as e:
        print(f"[!] {e}")
        sys.exit(1)
    except Exception as e:
        logger.exception("Evaluation failed: %s", e)
        sys.exit(1)
