"""
feature_builder.py
Converts raw user database records into a flat feature dictionary
that can be encoded + normalized by the preprocessor.

No ML logic here - pure data extraction.
"""
from typing import Any, Dict, Optional


SKIN_TYPE_MAP = {
    "DRY": 0, "NORMAL": 1, "COMBINATION": 2, "OILY": 3, "SENSITIVE": 4,
}
AGE_GROUP_MAP = {
    "UNDER_18": 0, "18_24": 1, "25_34": 2, "35_44": 3, "45_54": 4, "55_OVER": 5,
}
SLEEP_QUALITY_MAP = {
    "POOR": 0, "FAIR": 1, "GOOD": 2, "EXCELLENT": 3,
}
ACTIVITY_MAP = {
    "SEDENTARY": 0, "LIGHT": 1, "MODERATE": 2, "ACTIVE": 3, "VERY_ACTIVE": 4,
}
SMOKING_MAP = {
    "NONE": 0, "LIGHT": 1, "REGULAR": 2, "HEAVY": 3,
}
ALCOHOL_MAP = {
    "NONE": 0, "LIGHT": 1, "MODERATE": 2, "REGULAR": 3, "HEAVY": 4,
}


def build_concern_features(
    skin_profile: Optional[Any],
    user_profile: Optional[Any],
    lifestyle_record: Optional[Any],
    sleep_record: Optional[Any],
    hydration_record: Optional[Any],
    environment_record: Optional[Any],
) -> Dict[str, float]:
    """
    Returns a dict of 15 numeric features for the ConcernNet model.
    Missing values are filled with safe defaults.
    """
    skin_type_raw = (getattr(skin_profile, "skin_type", None) or "NORMAL").upper()
    age_group_raw = (getattr(user_profile, "age_group", None) or "25_34").upper()

    allergies = getattr(skin_profile, "allergies", None) or ""
    sensitivities = getattr(skin_profile, "sensitivities", None) or ""
    concerns = getattr(skin_profile, "concerns", None) or []

    stress = float(getattr(lifestyle_record, "stress_level", None) or 5)
    activity_raw = (getattr(lifestyle_record, "physical_activity", None) or "MODERATE").upper()
    smoking_raw = (getattr(lifestyle_record, "smoking", None) or "NONE").upper()
    alcohol_raw = (getattr(lifestyle_record, "alcohol", None) or "NONE").upper()

    sleep_duration = float(getattr(sleep_record, "duration_minutes", None) or 420) / 60.0  # convert to hours
    sleep_quality_raw = (getattr(sleep_record, "quality", None) or "GOOD").upper()

    water_ml = float(getattr(hydration_record, "water_intake_ml", None) or 1800)

    uv = float(getattr(environment_record, "uv_index", None) or 3)
    aqi = float(getattr(environment_record, "air_quality_index", None) or 50)

    return {
        "skin_type": float(SKIN_TYPE_MAP.get(skin_type_raw, 1)),
        "age_group": float(AGE_GROUP_MAP.get(age_group_raw, 2)),
        "stress_level": stress,
        "sleep_hours": sleep_duration,
        "sleep_quality": float(SLEEP_QUALITY_MAP.get(sleep_quality_raw, 2)),
        "water_intake_ml": water_ml,
        "physical_activity": float(ACTIVITY_MAP.get(activity_raw, 2)),
        "smoking": float(SMOKING_MAP.get(smoking_raw, 0)),
        "alcohol": float(ALCOHOL_MAP.get(alcohol_raw, 0)),
        "uv_index": uv,
        "air_quality_index": aqi,
        "has_allergies": 1.0 if allergies and allergies.strip() else 0.0,
        "has_sensitivities": 1.0 if sensitivities and sensitivities.strip() else 0.0,
        "concern_count": float(len(concerns)),
        "is_oily_or_combo": 1.0 if skin_type_raw in ("OILY", "COMBINATION") else 0.0,
    }


def build_risk_features(
    lifestyle_record: Optional[Any],
    sleep_record: Optional[Any],
    hydration_record: Optional[Any],
    environment_record: Optional[Any],
) -> Dict[str, float]:
    """
    Returns a dict of 8 numeric features for the RiskNet model.
    """
    stress = float(getattr(lifestyle_record, "stress_level", None) or 5)
    activity_raw = (getattr(lifestyle_record, "physical_activity", None) or "MODERATE").upper()
    smoking_raw = (getattr(lifestyle_record, "smoking", None) or "NONE").upper()
    alcohol_raw = (getattr(lifestyle_record, "alcohol", None) or "NONE").upper()

    sleep_duration = float(getattr(sleep_record, "duration_minutes", None) or 420) / 60.0
    sleep_quality_raw = (getattr(sleep_record, "quality", None) or "GOOD").upper()

    water_ml = float(getattr(hydration_record, "water_intake_ml", None) or 1800)

    uv = float(getattr(environment_record, "uv_index", None) or 3)

    return {
        "stress_level": stress,
        "sleep_hours": sleep_duration,
        "sleep_quality": float(SLEEP_QUALITY_MAP.get(sleep_quality_raw, 2)),
        "water_intake_ml": water_ml,
        "physical_activity": float(ACTIVITY_MAP.get(activity_raw, 2)),
        "smoking": float(SMOKING_MAP.get(smoking_raw, 0)),
        "alcohol": float(ALCOHOL_MAP.get(alcohol_raw, 0)),
        "uv_index": uv,
    }
