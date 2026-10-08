#!/usr/bin/env python3
"""
Train Skin Health Score model with XGBoost and save as joblib.
Run:  python train_skin_score_xgb.py
"""

import json
import random
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBRegressor

random.seed(42)
np.random.seed(42)

OUTPUT_DIR = Path("app/ml")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

SKIN_TYPES = ["normal", "dry", "oily", "combination", "sensitive"]
CONCERNS = [
    "acne", "hyperpigmentation", "dark spots", "dry skin", "oily skin",
    "sensitive skin", "wrinkles", "fine lines", "redness", "uneven skin tone"
]
SLEEP_HOURS = ["less than 5", "5-6", "6-7", "7-8", "more than 8"]
SLEEP_QUALITY = ["poor", "average", "good", "excellent"]
STRESS = ["low", "moderate", "high", "very high"]
EXERCISE = ["never", "sometimes", "weekly", "daily"]
WATER_LEVEL = ["low", "moderate", "high"]
WATER_AVG = ["less than 1", "1-2", "2-3", "more than 3"]
ENV = ["low", "moderate", "high pollution", "high sun exposure", "high pollution and sun"]


def generate_sample():
    skin_type = random.choice(SKIN_TYPES)
    n_concerns = random.randint(0, 4)
    concerns = random.sample(CONCERNS, k=n_concerns)
    sleep_hours = random.choice(SLEEP_HOURS)
    sleep_quality = random.choice(SLEEP_QUALITY)
    stress = random.choice(STRESS)
    exercise = random.choice(EXERCISE)
    water_level = random.choice(WATER_LEVEL)
    water_avg = random.choice(WATER_AVG)
    env = random.choice(ENV)
    has_sensitivity = random.random() < 0.25
    has_allergy = random.random() < 0.15
    routine_consistency = random.randint(0, 100)

    score = 82.0
    if skin_type == "sensitive":
        score -= 9
    elif skin_type == "dry":
        score -= 7
    elif skin_type == "oily":
        score -= 5
    elif skin_type == "combination":
        score -= 4

    concern_penalty = {
        "acne": 14, "hyperpigmentation": 11, "dark spots": 9,
        "dry skin": 9, "oily skin": 7, "sensitive skin": 11,
        "wrinkles": 9, "fine lines": 7, "redness": 9, "uneven skin tone": 7
    }
    for c in concerns:
        score -= concern_penalty.get(c, 5)

    if sleep_quality == "poor":
        score -= 18
    elif sleep_quality == "average":
        score -= 8
    elif sleep_quality == "good":
        score -= 2

    if sleep_hours == "less than 5":
        score -= 14
    elif sleep_hours == "5-6":
        score -= 9
    elif sleep_hours == "6-7":
        score -= 4

    if stress == "very high":
        score -= 16
    elif stress == "high":
        score -= 11
    elif stress == "moderate":
        score -= 5

    if exercise == "never":
        score -= 10
    elif exercise == "sometimes":
        score -= 5
    elif exercise == "weekly":
        score -= 1

    if water_level == "low":
        score -= 12
    elif water_level == "moderate":
        score -= 4

    if water_avg == "less than 1":
        score -= 9
    elif water_avg == "1-2":
        score -= 3

    if "high pollution" in env:
        score -= 8
    if "high sun" in env:
        score -= 8

    if has_sensitivity:
        score -= 5
    if has_allergy:
        score -= 3

    score += (routine_consistency - 50) * 0.18
    score += np.random.normal(0, 3.5)
    score = float(np.clip(score, 15, 98))

    return {
        "skin_type": skin_type,
        "num_concerns": len(concerns),
        "has_acne": int("acne" in concerns),
        "has_pigmentation": int(any(c in concerns for c in ["hyperpigmentation", "dark spots", "uneven skin tone"])),
        "has_dryness": int(any(c in concerns for c in ["dry skin", "sensitive skin"])),
        "has_aging": int(any(c in concerns for c in ["wrinkles", "fine lines"])),
        "has_redness": int("redness" in concerns),
        "sleep_hours": sleep_hours,
        "sleep_quality": sleep_quality,
        "stress": stress,
        "exercise": exercise,
        "water_level": water_level,
        "water_avg": water_avg,
        "env": env,
        "has_sensitivity": int(has_sensitivity),
        "has_allergy": int(has_allergy),
        "routine_consistency": routine_consistency,
        "score": score,
    }


def main():
    print("Generating 5000 synthetic samples...")
    data = [generate_sample() for _ in range(5000)]
    df = pd.DataFrame(data)

    feature_cols = [
        "skin_type", "num_concerns", "has_acne", "has_pigmentation",
        "has_dryness", "has_aging", "has_redness",
        "sleep_hours", "sleep_quality", "stress", "exercise",
        "water_level", "water_avg", "env",
        "has_sensitivity", "has_allergy", "routine_consistency"
    ]
    X = df[feature_cols]
    y = df["score"]

    categorical = ["skin_type", "sleep_hours", "sleep_quality", "stress",
                   "exercise", "water_level", "water_avg", "env"]
    numeric = ["num_concerns", "has_acne", "has_pigmentation", "has_dryness",
               "has_aging", "has_redness", "has_sensitivity", "has_allergy",
               "routine_consistency"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical),
            ("num", StandardScaler(), numeric),
        ]
    )

    model = Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", XGBRegressor(
            n_estimators=120,
            max_depth=5,
            learning_rate=0.08,
            subsample=0.9,
            colsample_bytree=0.9,
            random_state=42,
            n_jobs=2,
            verbosity=0,
        )),
    ])

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)

    print(f"Test MAE : {mae:.2f}")
    print(f"Test R²  : {r2:.3f}")

    model_path = OUTPUT_DIR / "skin_score_model.joblib"
    joblib.dump(model, model_path)
    print(f"\nXGBoost model saved to: {model_path}")

    meta = {
        "model_type": "XGBRegressor",
        "test_mae": round(mae, 2),
        "test_r2": round(r2, 3),
        "n_samples": len(df),
    }
    with open(OUTPUT_DIR / "skin_score_meta.json", "w") as f:
        json.dump(meta, f, indent=2)

    print("Training complete.")


if __name__ == "__main__":
    main()