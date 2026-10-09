"""
config.py — Central configuration for the Hybrid NIDS backend.

Why this exists:
  All tuneable parameters live here so that nothing is hard-coded in the
  detection logic, ML pipeline, or API routes. Changing a threshold or a
  file path means editing ONE file.

How it connects to the NIDS architecture:
  Every other module imports from here. The rule engine reads RULE_* 
  thresholds, the ML detector reads ISOLATION_FOREST_* settings, and 
  the app reads PORT / DATABASE_PATH / MODEL_PATH.
"""

import os

# ── Path helpers ──────────────────────────────────────────────────────────────
BASE_DIR  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # project root
DATA_DIR  = os.path.join(BASE_DIR, "data")
MODEL_DIR = os.path.join(BASE_DIR, "models")

# ── Flask / API settings ──────────────────────────────────────────────────────
FLASK_HOST  = os.environ.get("FLASK_HOST", "0.0.0.0")
FLASK_PORT  = int(os.environ.get("FLASK_PORT", 5000))
FLASK_DEBUG = os.environ.get("FLASK_DEBUG", "false").lower() == "true"

# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_PATH = os.environ.get("DATABASE_PATH", os.path.join(DATA_DIR, "nids.db"))

# ── ML model ──────────────────────────────────────────────────────────────────
MODEL_PATH   = os.environ.get("MODEL_PATH", os.path.join(MODEL_DIR, "rf_model.joblib"))
DATASET_PATH = os.environ.get("DATASET_PATH", os.path.join(DATA_DIR, "sample_data.csv"))
TEST_DATA_PATH = os.environ.get("TEST_DATA_PATH", os.path.join(DATA_DIR, "test_data.csv"))

# ── Random Forest hyper-parameters ───────────────────────────────────────────
RANDOM_FOREST_N_ESTIMATORS = int(os.environ.get("RF_N_ESTIMATORS", 100))
RANDOM_FOREST_RANDOM_STATE = int(os.environ.get("RF_RANDOM_STATE", 42))

# Features fed to the model (keep order consistent everywhere)
FEATURE_COLUMNS = ["duration", "src_bytes", "dst_bytes"]

# ── Rule thresholds ───────────────────────────────────────────────────────────
# Rule 1 — Port Scan
RULE_PORT_SCAN_MAX_DURATION  = float(os.environ.get("RULE_PORT_SCAN_MAX_DURATION", 1.0))
RULE_PORT_SCAN_MAX_SRC_BYTES = float(os.environ.get("RULE_PORT_SCAN_MAX_SRC_BYTES", 100.0))
RULE_PORT_SCAN_MAX_DST_BYTES = float(os.environ.get("RULE_PORT_SCAN_MAX_DST_BYTES", 100.0))

# Rule 2 — Data Exfiltration
RULE_EXFIL_MIN_DURATION  = float(os.environ.get("RULE_EXFIL_MIN_DURATION", 60.0))
RULE_EXFIL_MIN_DST_BYTES = float(os.environ.get("RULE_EXFIL_MIN_DST_BYTES", 10_000_000.0))

# Rule 3 — DoS
RULE_DOS_RATIO_THRESHOLD = float(os.environ.get("RULE_DOS_RATIO_THRESHOLD", 10.0))

# Rule 4 — Data Theft
RULE_DATA_THEFT_RATIO_THRESHOLD = float(os.environ.get("RULE_DATA_THEFT_RATIO_THRESHOLD", 10.0))

# ── Dataset generator settings ────────────────────────────────────────────────
DATASET_RANDOM_SEED   = int(os.environ.get("DATASET_RANDOM_SEED", 42))
DATASET_NORMAL_COUNT  = int(os.environ.get("DATASET_NORMAL_COUNT", 2000))
DATASET_ATTACK_COUNT  = int(os.environ.get("DATASET_ATTACK_COUNT", 125))   # per attack type

# ── Evaluation ────────────────────────────────────────────────────────────────
EVAL_RESULTS_PATH = os.environ.get("EVAL_RESULTS_PATH",
                                   os.path.join(BASE_DIR, "results", "evaluation.json"))
