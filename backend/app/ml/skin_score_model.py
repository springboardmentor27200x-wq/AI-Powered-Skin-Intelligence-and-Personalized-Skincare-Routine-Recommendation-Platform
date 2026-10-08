"""
Hybrid Skin Health Score Engine
===============================
- Transparent weighted formula (for clinical explainability)
- XGBoost Regressor model (for ML refinement)
- Final score = 70% weighted + 30% XGBoost ML
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict

import joblib
import numpy as np
import pandas as pd

from app.ml.concern_prioritizer import prioritize_concerns
from app.ml.seasonal_tips import generate_seasonal_tips
from app.ml.ingredient_intelligence import (
    generate_ingredient_insights,
    get_comprehensive_ingredient_intelligence,
)

logger = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).parent / "skin_score_model.joblib"

_model = None
_model_loaded = False


def _load_model():
    global _model, _model_loaded
    if _model_loaded:
        return _model
    try:
        print(f"[SkinScore] Looking for model at: {MODEL_PATH}")
        print(f"[SkinScore] Exists: {MODEL_PATH.exists()}")
        if MODEL_PATH.exists():
            _model = joblib.load(MODEL_PATH)
            print("[SkinScore] Model loaded successfully")
        else:
            print("[SkinScore] Model file not found")
            _model = None
    except Exception as e:
        print(f"[SkinScore] Failed to load model: {e}")
        _model = None
    _model_loaded = True
    return _model


def _build_features(profile: Dict[str, Any], routine_consistency: int = 0) -> pd.DataFrame:
    skin_type = (profile.get("skin_type") or "normal").lower().strip()
    user_concerns = (profile.get("skin_concerns") or "").lower()
    sleep_hours = (profile.get("sleep_hours") or "7-8").lower()
    sleep_quality = (profile.get("sleep_quality") or "average").lower()
    stress = (profile.get("stress_level") or "moderate").lower()
    exercise = (profile.get("exercise_frequency") or "sometimes").lower()
    water_level = (profile.get("water_intake_level") or "moderate").lower()
    water_avg = (profile.get("average_water_intake") or "1-2").lower()
    env = (profile.get("environmental_exposure") or "moderate").lower()
    sensitivities = (profile.get("sensitivities") or "").lower()
    allergies = (profile.get("allergies") or "").lower()

    features = {
        "skin_type": skin_type,
        "num_concerns": len([c for c in user_concerns.replace(",", " ").split() if c.strip()]),
        "has_acne": int("acne" in user_concerns),
        "has_pigmentation": int(any(k in user_concerns for k in ["hyperpigmentation", "dark spots", "uneven skin tone"])),
        "has_dryness": int(any(k in user_concerns for k in ["dry skin", "sensitive skin"])),
        "has_aging": int(any(k in user_concerns for k in ["wrinkles", "fine lines"])),
        "has_redness": int("redness" in user_concerns),
        "sleep_hours": sleep_hours,
        "sleep_quality": sleep_quality,
        "stress": stress,
        "exercise": exercise,
        "water_level": water_level,
        "water_avg": water_avg,
        "env": env,
        "has_sensitivity": int("easily irritated" in sensitivities or "reactive" in sensitivities or "sensitive" in sensitivities),
        "has_allergy": int(bool(allergies and allergies not in ["none", "no", ""])),
        "routine_consistency": int(routine_consistency or 0),
    }
    return pd.DataFrame([features])


def _weighted_score(profile: Dict[str, Any], routine_consistency: int = 0) -> Dict[str, Any]:
    skin_type = (profile.get("skin_type") or "").lower()
    user_concerns = (profile.get("skin_concerns") or "").lower()
    sleep_hours = (profile.get("sleep_hours") or "").lower()
    sleep_quality = (profile.get("sleep_quality") or "").lower()
    stress = (profile.get("stress_level") or "").lower()
    exercise = (profile.get("exercise_frequency") or "").lower()
    water_level = (profile.get("water_intake_level") or "").lower()
    water_avg = (profile.get("average_water_intake") or "").lower()
    env = (profile.get("environmental_exposure") or "").lower()
    sensitivities = (profile.get("sensitivities") or "").lower()
    allergies = (profile.get("allergies") or "").lower()

    concern_scores = {}
    identified = []
    risks = []

    condition = 100
    concern_map = {
        "acne": ("Acne", 18),
        "hyperpigmentation": ("Hyperpigmentation", 14),
        "dark spots": ("Dark Spots", 12),
        "dry skin": ("Dry Skin", 12),
        "oily skin": ("Oily Skin", 10),
        "sensitive skin": ("Sensitive Skin", 14),
        "wrinkles": ("Wrinkles", 12),
        "fine lines": ("Fine Lines", 10),
        "redness": ("Redness", 12),
        "uneven skin tone": ("Uneven Skin Tone", 10),
    }
    for key, (label, penalty) in concern_map.items():
        if key in user_concerns:
            identified.append(label)
            concern_scores[label] = penalty
            condition -= penalty

    if skin_type == "oily":
        condition -= 8
        if "Oily Skin" not in identified:
            identified.append("Oily Skin")
            concern_scores["Oily Skin"] = 8
        risks.append("Oily skin increases acne risk")
    elif skin_type == "dry":
        condition -= 10
        if "Dry Skin" not in identified:
            identified.append("Dry Skin")
            concern_scores["Dry Skin"] = 10
        risks.append("Dryness can weaken the skin barrier")
    elif skin_type == "sensitive":
        condition -= 12
        if "Sensitive Skin" not in identified:
            identified.append("Sensitive Skin")
            concern_scores["Sensitive Skin"] = 12
        risks.append("Sensitive skin has higher irritation risk")
    elif skin_type == "combination":
        condition -= 6
        risks.append("Combination skin can cause uneven oil and dryness")

    if "easily irritated" in sensitivities or "reactive" in sensitivities:
        condition -= 6
        risks.append("High skin sensitivity / reactivity")
    if allergies and allergies not in ["none", "no", ""]:
        risks.append(f"Allergy risk: {allergies}")
        condition -= 4
    condition = max(0, min(100, condition))

    lifestyle = 100
    if stress in ["high", "very high"]:
        lifestyle -= 25
        risks.append("High stress can worsen acne, redness and aging")
    elif stress == "moderate":
        lifestyle -= 10
    if exercise == "never":
        lifestyle -= 20
        risks.append("Low activity can reduce skin circulation and recovery")
    elif exercise == "sometimes":
        lifestyle -= 10
    elif exercise == "weekly":
        lifestyle -= 5
    if "high pollution" in env:
        lifestyle -= 15
        risks.append("High pollution exposure increases dullness and damage")
    if "high sun exposure" in env:
        lifestyle -= 15
        risks.append("High sun exposure increases pigmentation and aging risk")
    lifestyle = max(0, min(100, lifestyle))

    sleep = 100
    if sleep_quality == "poor":
        sleep -= 35
        risks.append("Poor sleep reduces skin repair")
    elif sleep_quality == "average":
        sleep -= 15
    elif sleep_quality == "good":
        sleep -= 5
    if "less than 5" in sleep_hours:
        sleep -= 25
        risks.append("Very low sleep hours")
    elif "5-6" in sleep_hours:
        sleep -= 15
    elif "6-7" in sleep_hours:
        sleep -= 8
    sleep = max(0, min(100, sleep))

    consistency = max(0, min(100, int(routine_consistency or 0)))
    if consistency < 40:
        risks.append("Low routine adherence will slow improvement")

    hydration = 100
    if water_level == "low":
        hydration -= 30
        risks.append("Low hydration increases dryness and dullness")
    elif water_level == "moderate":
        hydration -= 10
    if "less than 1" in water_avg:
        hydration -= 20
    elif "1-2" in water_avg:
        hydration -= 8
    hydration = max(0, min(100, hydration))

    weighted = round(
        condition * 0.35 +
        lifestyle * 0.20 +
        sleep * 0.15 +
        consistency * 0.20 +
        hydration * 0.10
    )
    weighted = max(0, min(100, weighted))

    prioritized = sorted(concern_scores.items(), key=lambda x: x[1], reverse=True)
    prioritized_list = [name for name, _ in prioritized[:5]] or identified[:4]

    unique_risks = []
    for r in risks:
        if r not in unique_risks:
            unique_risks.append(r)

    return {
        "weighted_score": weighted,
        "breakdown": {
            "skin_condition": condition,
            "lifestyle": lifestyle,
            "sleep": sleep,
            "routine_consistency": consistency,
            "hydration": hydration,
        },
        "weights": {
            "skin_condition": "35%",
            "lifestyle": "20%",
            "sleep": "15%",
            "routine_consistency": "20%",
            "hydration": "10%",
        },
        "concerns": prioritized_list,
        "all_identified_concerns": identified,
        "risk_factors": unique_risks[:6],
        "total_concerns_found": len(identified),
    }


def assess_skin(profile: Dict[str, Any], routine_consistency: int = 0) -> Dict[str, Any]:
    """
    Hybrid Skin Health Score.
    Final score = 70% weighted formula + 30% ML prediction.
    """
    weighted_result = _weighted_score(profile, routine_consistency)
    weighted = weighted_result["weighted_score"]

    model = _load_model()
    ml_score = None

    if model is not None:
        try:
            X = _build_features(profile, routine_consistency)
            pred = float(model.predict(X)[0])
            ml_score = float(np.clip(pred, 0, 100))
            print(f"[SkinScore] ML prediction: {ml_score}")
        except Exception as e:
            print(f"[SkinScore] Prediction failed: {e}")
            ml_score = None

        if ml_score is not None:
            final_score = round(0.70 * weighted + 0.30 * ml_score)
            model_name = "hybrid_weighted_xgboost_v1"
        else:
            final_score = weighted
            model_name = "weighted_only"

    final_score = max(0, min(100, final_score))

    concern_result = prioritize_concerns(profile, routine_consistency)
    seasonal = generate_seasonal_tips(profile)
    ingredient_insights = generate_ingredient_insights(
        profile,
        top_concerns=concern_result.get("top_concerns", [])
    )
    ingredient_intelligence = get_comprehensive_ingredient_intelligence(
        profile,
        top_concerns=concern_result.get("top_concerns", [])
    )

    return {
        "score": final_score,
        "breakdown": weighted_result["breakdown"],
        "weights": weighted_result["weights"],
        "concerns": concern_result["top_concerns"],
        "ranked_concerns": concern_result["ranked_concerns"],
        "severity_summary": concern_result["severity_summary"],
        "all_identified_concerns": weighted_result["all_identified_concerns"],
        "risk_factors": weighted_result["risk_factors"],
        "total_concerns_found": weighted_result["total_concerns_found"],
        "seasonal_tips": seasonal["tips"],
        "season": seasonal["season"],
        "seasonal_summary": seasonal["summary"],
        "weather": seasonal.get("weather"),
        "ingredient_insights": ingredient_insights,
        "ingredient_intelligence": ingredient_intelligence,
        "summary": (
            f"Your overall skin health score is {final_score}/100. "
            f"Main focus areas: {', '.join(concern_result['top_concerns']) if concern_result['top_concerns'] else 'Overall stable condition'}."
        ),
        "model": model_name,
    }