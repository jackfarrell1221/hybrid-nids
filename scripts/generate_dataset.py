"""
scripts/generate_dataset.py — Synthetic network-flow dataset generator.

Why this exists:
  A real packet capture would require root privileges and a live network.
  For this proof-of-concept we generate realistic synthetic flows so 
  the NIDS can be trained and evaluated without network access.

How it connects to the NIDS architecture:
  Produces:
    data/sample_data.csv  — used for Isolation Forest training
    data/test_data.csv    — used for evaluation (evaluate.py)

  The 'label' and 'attack_type' columns are included for evaluation 
  purposes ONLY. The Isolation Forest is trained without using them.

Run:
    python scripts/generate_dataset.py
"""

import os
import sys
import numpy as np
import pandas as pd

# Add project root to path so we can import config
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.config import (
    DATA_DIR,
    DATASET_PATH,
    TEST_DATA_PATH,
    DATASET_RANDOM_SEED,
    DATASET_NORMAL_COUNT,
    DATASET_ATTACK_COUNT,
)


def generate_normal(n: int, rng: np.random.Generator) -> pd.DataFrame:
    """
    Normal HTTP/HTTPS/DNS traffic:
    70% typical small-to-medium web flows (HTML, API, CSS/JS, images)
    30% medium-to-large web transfers (downloads, streaming, updates)
    """
    n1 = int(n * 0.7)
    n2 = n - n1

    dur1 = rng.uniform(1, 30, n1)
    src1 = rng.integers(300, 3000, n1).astype(float)
    dst1 = rng.integers(400, 5000, n1).astype(float)

    dur2 = rng.uniform(10, 120, n2)
    src2 = rng.integers(1000, 20000, n2).astype(float)
    dst2 = rng.integers(2000, 50000, n2).astype(float)

    duration = np.concatenate([dur1, dur2]).round(2)
    src_bytes = np.concatenate([src1, src2])
    dst_bytes = np.concatenate([dst1, dst2])

    df = pd.DataFrame({
        "duration":  duration,
        "src_bytes": src_bytes,
        "dst_bytes": dst_bytes,
        "label":     "NORMAL",
        "attack_type": None,
    })
    return df


def generate_port_scan(n: int, rng: np.random.Generator) -> pd.DataFrame:
    """
    Port scanner: very short connections, almost no data.
    """
    df = pd.DataFrame({
        "duration":  rng.uniform(0.01, 0.8, n).round(3),
        "src_bytes": rng.integers(5, 80, n).astype(float),
        "dst_bytes": rng.integers(0, 70, n).astype(float),
        "label":     "INTRUSION",
        "attack_type": "PORT_SCAN",
    })
    return df


def generate_dos(n: int, rng: np.random.Generator) -> pd.DataFrame:
    """
    DoS flood: huge src_bytes, tiny dst_bytes.
    """
    df = pd.DataFrame({
        "duration":  rng.uniform(1, 30, n).round(2),
        "src_bytes": rng.integers(500_000, 10_000_000, n).astype(float),
        "dst_bytes": rng.integers(50, 3_000, n).astype(float),
        "label":     "INTRUSION",
        "attack_type": "DOS",
    })
    return df


def generate_data_exfiltration(n: int, rng: np.random.Generator) -> pd.DataFrame:
    """
    Data exfiltration: long session, huge outbound (dst_bytes).
    """
    df = pd.DataFrame({
        "duration":  rng.uniform(61, 7_200, n).round(1),
        "src_bytes": rng.integers(100, 3_000, n).astype(float),
        "dst_bytes": rng.integers(10_000_001, 200_000_000, n).astype(float),
        "label":     "INTRUSION",
        "attack_type": "DATA_EXFILTRATION",
    })
    return df


def generate_data_theft(n: int, rng: np.random.Generator) -> pd.DataFrame:
    """
    Data theft (large download): dst_bytes >> src_bytes by ratio > 10.
    """
    src = rng.integers(100, 2_000, n).astype(float)
    # Ensure ratio > 10
    dst = src * rng.uniform(11, 50, n)
    df = pd.DataFrame({
        "duration":  rng.uniform(2, 120, n).round(2),
        "src_bytes": src,
        "dst_bytes": dst.round(0),
        "label":     "INTRUSION",
        "attack_type": "DATA_THEFT",
    })
    return df


def generate_dataset(
    normal_count: int,
    attack_count: int,
    seed: int,
) -> pd.DataFrame:
    """
    Build a full dataset with normal and attack records.

    Args:
        normal_count: number of NORMAL flow records.
        attack_count: number of records PER attack type.
        seed:         RNG seed for reproducibility.

    Returns:
        Shuffled DataFrame with columns:
        duration, src_bytes, dst_bytes, label, attack_type
    """
    rng = np.random.default_rng(seed)

    parts = [
        generate_normal(normal_count, rng),
        generate_port_scan(attack_count, rng),
        generate_dos(attack_count, rng),
        generate_data_exfiltration(attack_count, rng),
        generate_data_theft(attack_count, rng),
    ]

    df = pd.concat(parts, ignore_index=True)
    df = df.sample(frac=1, random_state=seed).reset_index(drop=True)
    return df


def main():
    os.makedirs(DATA_DIR, exist_ok=True)

    print(f"[+] Generating training dataset (seed={DATASET_RANDOM_SEED}) ...")
    train_df = generate_dataset(
        normal_count=DATASET_NORMAL_COUNT,
        attack_count=DATASET_ATTACK_COUNT,
        seed=DATASET_RANDOM_SEED,
    )
    train_df.to_csv(DATASET_PATH, index=False)
    print(f"    Saved {len(train_df)} rows -> {DATASET_PATH}")

    print(f"[+] Generating test dataset (seed={DATASET_RANDOM_SEED + 1}) ...")
    test_df = generate_dataset(
        normal_count=DATASET_NORMAL_COUNT // 2,
        attack_count=DATASET_ATTACK_COUNT // 2,
        seed=DATASET_RANDOM_SEED + 1,
    )
    test_df.to_csv(TEST_DATA_PATH, index=False)
    print(f"    Saved {len(test_df)} rows -> {TEST_DATA_PATH}")

    print("\n[+] Label distribution (training):")
    print(train_df["label"].value_counts().to_string())
    print("\n[+] Attack type distribution (training):")
    print(train_df["attack_type"].value_counts(dropna=False).to_string())
    print("\n[OK] Dataset generation complete.")


if __name__ == "__main__":
    main()
