# =========================================================
# SKIN HEALTH SCORING ENGINE
# =========================================================
#
# Weighted Scoring Model:
#
# Skin Condition Assessment  = 35%
# Lifestyle Habits          = 20%
# Sleep Quality             = 15%
# Routine Consistency       = 20%
# Hydration Level           = 10%
#
# Overall Skin Health Score = 0 - 100
# =========================================================


# =========================================================
# WEIGHTS
# =========================================================

SKIN_CONDITION_WEIGHT = 0.35
LIFESTYLE_WEIGHT = 0.20
SLEEP_WEIGHT = 0.15
ROUTINE_WEIGHT = 0.20
HYDRATION_WEIGHT = 0.10


# =========================================================
# HELPER
# =========================================================

def clamp_score(score: float) -> float:
    """
    Keeps a score between 0 and 100.
    """
    return max(0.0, min(100.0, float(score)))


# =========================================================
# SKIN CONDITION SCORING
# =========================================================

def calculate_skin_condition_score(
    skin_type: str | None,
    concerns: str | None,
    sensitivity: str | None,
    allergies: str | None,
) -> float:
    """
    Calculates the skin condition component.

    Base score starts at 100 and deductions are applied
    based on reported skin concerns and sensitivity.

    This is a rule-based baseline that can later be replaced
    or enhanced with ML models.
    """

    score = 100.0

    concern_text = (concerns or "").lower()
    sensitivity_text = (sensitivity or "").lower()
    allergy_text = (allergies or "").lower()

    # Skin concerns
    deductions = {
        "acne": 12,
        "hyperpigmentation": 8,
        "dark spots": 7,
        "dry skin": 8,
        "oily skin": 6,
        "sensitive skin": 8,
        "wrinkles": 8,
        "fine lines": 6,
        "redness": 8,
        "uneven skin tone": 7,
    }

    for concern, deduction in deductions.items():
        if concern in concern_text:
            score -= deduction

    # Sensitivity
    if "high" in sensitivity_text:
        score -= 10
    elif "moderate" in sensitivity_text:
        score -= 5

    # Allergies
    if allergy_text and allergy_text not in ["none", "no", "n/a"]:
        score -= 5

    return round(clamp_score(score), 2)


# =========================================================
# LIFESTYLE SCORING
# =========================================================

def calculate_lifestyle_score(
    exercise_minutes: int | float | None,
    stress_level: int | None,
) -> float:
    """
    Calculates lifestyle habits score.

    Exercise:
        150+ minutes/week equivalent -> excellent
        100-149                    -> good
        50-99                      -> moderate
        below 50                   -> low

    Stress:
        Lower stress produces a higher score.
    """

    exercise = float(exercise_minutes or 0)
    stress = int(stress_level or 0)

    # Exercise component
    if exercise >= 150:
        exercise_score = 100
    elif exercise >= 100:
        exercise_score = 85
    elif exercise >= 50:
        exercise_score = 70
    else:
        exercise_score = 50

    # Stress component
    # Expected stress scale: 1-10
    stress = max(1, min(10, stress))

    stress_score = 100 - ((stress - 1) * (100 / 9))

    lifestyle_score = (
        exercise_score * 0.5
        + stress_score * 0.5
    )

    return round(clamp_score(lifestyle_score), 2)


# =========================================================
# SLEEP QUALITY SCORING
# =========================================================

def calculate_sleep_score(
    sleep_hours: float | None,
    sleep_quality: int | None,
) -> float:
    """
    Calculates sleep quality score.

    Ideal sleep duration:
        7-9 hours

    Sleep quality:
        Expected scale: 1-10
    """

    hours = float(sleep_hours or 0)
    quality = int(sleep_quality or 0)

    # Sleep duration score
    if 7 <= hours <= 9:
        duration_score = 100
    elif 6 <= hours < 7 or 9 < hours <= 10:
        duration_score = 80
    elif 5 <= hours < 6 or 10 < hours <= 11:
        duration_score = 60
    else:
        duration_score = 40

    # Sleep quality score
    quality = max(1, min(10, quality))
    quality_score = quality * 10

    sleep_score = (
        duration_score * 0.5
        + quality_score * 0.5
    )

    return round(clamp_score(sleep_score), 2)


# =========================================================
# ROUTINE CONSISTENCY SCORING
# =========================================================

def calculate_routine_consistency_score(
    routine_completed_days: int = 0,
    total_tracking_days: int = 0,
) -> float:
    """
    Calculates routine adherence.

    Example:
        Completed 8 days out of 10
        = 80% consistency
    """

    if total_tracking_days <= 0:
        # No routine tracking data yet.
        return 0.0

    score = (
        routine_completed_days
        / total_tracking_days
    ) * 100

    return round(clamp_score(score), 2)


# =========================================================
# HYDRATION SCORING
# =========================================================

def calculate_hydration_score(
    water_intake: float | None,
) -> float:
    """
    Calculates hydration score.

    Water intake is measured in liters/day.

    2.5+ L -> 100
    2.0-2.49 -> 90
    1.5-1.99 -> 75
    1.0-1.49 -> 60
    below 1.0 -> 40
    """

    water = float(water_intake or 0)

    if water >= 2.5:
        score = 100
    elif water >= 2.0:
        score = 90
    elif water >= 1.5:
        score = 75
    elif water >= 1.0:
        score = 60
    else:
        score = 40

    return round(clamp_score(score), 2)


# =========================================================
# OVERALL SKIN HEALTH SCORE
# =========================================================

def calculate_overall_skin_health_score(
    skin_condition_score: float,
    lifestyle_score: float,
    sleep_score: float,
    routine_consistency_score: float,
    hydration_score: float,
) -> float:
    """
    Calculates the final weighted Skin Health Score.
    """

    overall_score = (
        skin_condition_score * SKIN_CONDITION_WEIGHT
        + lifestyle_score * LIFESTYLE_WEIGHT
        + sleep_score * SLEEP_WEIGHT
        + routine_consistency_score * ROUTINE_WEIGHT
        + hydration_score * HYDRATION_WEIGHT
    )

    return round(clamp_score(overall_score), 2)


# =========================================================
# HEALTH STATUS
# =========================================================

def get_health_status(score: float) -> str:
    """
    Converts numerical score into an understandable
    health status.
    """

    score = clamp_score(score)

    if score >= 85:
        return "Excellent"
    elif score >= 70:
        return "Good"
    elif score >= 50:
        return "Moderate"
    else:
        return "Needs Attention"


# =========================================================
# COMPLETE SCORING BREAKDOWN
# =========================================================

def calculate_skin_health(
    skin_type: str | None,
    concerns: str | None,
    sensitivity: str | None,
    allergies: str | None,
    exercise_minutes: int | float | None,
    stress_level: int | None,
    sleep_hours: float | None,
    sleep_quality: int | None,
    routine_completed_days: int = 0,
    total_tracking_days: int = 0,
    water_intake: float | None = None,
) -> dict:
    """
    Runs the complete Skin Health Scoring Engine.

    Returns all individual scores plus the final score.
    """

    skin_condition_score = calculate_skin_condition_score(
        skin_type=skin_type,
        concerns=concerns,
        sensitivity=sensitivity,
        allergies=allergies,
    )

    lifestyle_score = calculate_lifestyle_score(
        exercise_minutes=exercise_minutes,
        stress_level=stress_level,
    )

    sleep_score = calculate_sleep_score(
        sleep_hours=sleep_hours,
        sleep_quality=sleep_quality,
    )

    routine_consistency_score = calculate_routine_consistency_score(
        routine_completed_days=routine_completed_days,
        total_tracking_days=total_tracking_days,
    )

    hydration_score = calculate_hydration_score(
        water_intake=water_intake,
    )

    overall_score = calculate_overall_skin_health_score(
        skin_condition_score=skin_condition_score,
        lifestyle_score=lifestyle_score,
        sleep_score=sleep_score,
        routine_consistency_score=routine_consistency_score,
        hydration_score=hydration_score,
    )

    return {
        "skin_condition_score": skin_condition_score,
        "lifestyle_score": lifestyle_score,
        "sleep_score": sleep_score,
        "routine_consistency_score": routine_consistency_score,
        "hydration_score": hydration_score,
        "skin_score": overall_score,
        "health_status": get_health_status(overall_score),
    }