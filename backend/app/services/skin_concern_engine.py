# =========================================================
# SKIN CONCERN ANALYSIS ENGINE
# =========================================================
#
# Identifies:
# - Skin concerns
# - Concern severity
# - Primary concern
# - Secondary concerns
# - Risk factors
#
# This is a rule-based baseline for Milestone 2.
# It can later be enhanced with ML models.
# =========================================================


# =========================================================
# SUPPORTED SKIN CONCERNS
# =========================================================

SUPPORTED_CONCERNS = [
    "Acne",
    "Hyperpigmentation",
    "Dark Spots",
    "Dry Skin",
    "Oily Skin",
    "Sensitive Skin",
    "Wrinkles",
    "Fine Lines",
    "Redness",
    "Uneven Skin Tone",
]


# =========================================================
# CONCERN SEVERITY
# =========================================================

def calculate_concern_severity(
    concern: str,
    concerns_text: str,
    sensitivity: str = "",
) -> int:
    """
    Returns a severity score from 0 to 100.

    Higher score = greater concern.
    """

    text = (concerns_text or "").lower()
    sensitivity_text = (sensitivity or "").lower()

    severity = 0

    severity_keywords = {
        "acne": {
            "mild": 30,
            "moderate": 60,
            "severe": 90,
        },
        "hyperpigmentation": {
            "mild": 30,
            "moderate": 60,
            "severe": 90,
        },
        "dark spots": {
            "mild": 30,
            "moderate": 60,
            "severe": 90,
        },
        "dry skin": {
            "mild": 30,
            "moderate": 60,
            "severe": 90,
        },
        "oily skin": {
            "mild": 30,
            "moderate": 60,
            "severe": 90,
        },
        "sensitive skin": {
            "mild": 30,
            "moderate": 60,
            "severe": 90,
        },
        "wrinkles": {
            "mild": 30,
            "moderate": 60,
            "severe": 90,
        },
        "fine lines": {
            "mild": 30,
            "moderate": 60,
            "severe": 90,
        },
        "redness": {
            "mild": 30,
            "moderate": 60,
            "severe": 90,
        },
        "uneven skin tone": {
            "mild": 30,
            "moderate": 60,
            "severe": 90,
        },
    }

    concern_lower = concern.lower()

    # Check whether the concern was reported
    if concern_lower not in text:
        return 0

    # Determine severity from the text
    if "severe" in text:
        severity = 90
    elif "moderate" in text:
        severity = 60
    elif "mild" in text:
        severity = 30
    else:
        # Concern exists but severity wasn't specified
        severity = 50

    # Sensitive skin gets additional priority
    if concern_lower == "sensitive skin" and "high" in sensitivity_text:
        severity += 10

    return min(severity, 100)


# =========================================================
# IDENTIFY CONCERNS
# =========================================================

def identify_skin_concerns(
    concerns: str | None,
    sensitivity: str | None = None,
) -> list:
    """
    Identifies supported skin concerns from the user's
    skin profile.
    """

    concerns_text = (concerns or "").lower()

    detected = []

    for concern in SUPPORTED_CONCERNS:

        if concern.lower() in concerns_text:

            severity = calculate_concern_severity(
                concern=concern,
                concerns_text=concerns_text,
                sensitivity=sensitivity or "",
            )

            detected.append({
                "concern": concern,
                "severity": severity,
            })

    # Sort highest severity first
    detected.sort(
        key=lambda item: item["severity"],
        reverse=True
    )

    return detected


# =========================================================
# CONCERN PRIORITIZATION
# =========================================================

def prioritize_concerns(
    detected_concerns: list,
) -> dict:
    """
    Determines the primary and secondary concerns.
    """

    if not detected_concerns:
        return {
            "primary_concern": None,
            "secondary_concerns": [],
        }

    primary_concern = detected_concerns[0]["concern"]

    secondary_concerns = [
        item["concern"]
        for item in detected_concerns[1:]
    ]

    return {
        "primary_concern": primary_concern,
        "secondary_concerns": secondary_concerns,
    }


# =========================================================
# RISK FACTOR ANALYSIS
# =========================================================

def identify_risk_factors(
    exercise_minutes: int | float | None,
    stress_level: int | None,
    sleep_hours: float | None,
    sleep_quality: int | None,
    water_intake: float | None,
    sensitivity: str | None = None,
    allergies: str | None = None,
) -> list:
    """
    Identifies lifestyle and environmental risk factors.
    """

    risk_factors = []

    exercise = float(exercise_minutes or 0)
    stress = int(stress_level or 0)
    sleep = float(sleep_hours or 0)
    sleep_quality_value = int(sleep_quality or 0)
    water = float(water_intake or 0)

    # -------------------------
    # Stress
    # -------------------------

    if stress >= 8:
        risk_factors.append("High stress level")
    elif stress >= 6:
        risk_factors.append("Moderate stress level")

    # -------------------------
    # Sleep
    # -------------------------

    if sleep < 6:
        risk_factors.append("Insufficient sleep")
    elif sleep < 7:
        risk_factors.append("Below-optimal sleep duration")

    if sleep_quality_value <= 4:
        risk_factors.append("Poor sleep quality")
    elif sleep_quality_value <= 6:
        risk_factors.append("Moderate sleep quality")

    # -------------------------
    # Hydration
    # -------------------------

    if water < 1.0:
        risk_factors.append("Very low hydration")
    elif water < 1.5:
        risk_factors.append("Low hydration")
    elif water < 2.0:
        risk_factors.append("Moderate hydration")

    # -------------------------
    # Exercise
    # -------------------------

    if exercise < 50:
        risk_factors.append("Low physical activity")
    elif exercise < 100:
        risk_factors.append("Moderate physical activity")

    # -------------------------
    # Sensitivity
    # -------------------------

    sensitivity_text = (sensitivity or "").lower()

    if "high" in sensitivity_text:
        risk_factors.append("High skin sensitivity")
    elif "moderate" in sensitivity_text:
        risk_factors.append("Moderate skin sensitivity")

    # -------------------------
    # Allergies
    # -------------------------

    allergy_text = (allergies or "").strip().lower()

    if allergy_text and allergy_text not in [
        "none",
        "no",
        "n/a",
        "na",
    ]:
        risk_factors.append("Reported skin/product allergies")

    return risk_factors


# =========================================================
# COMPLETE CONCERN ANALYSIS
# =========================================================

def analyze_skin_concerns(
    concerns: str | None,
    sensitivity: str | None = None,
    allergies: str | None = None,
    exercise_minutes: int | float | None = None,
    stress_level: int | None = None,
    sleep_hours: float | None = None,
    sleep_quality: int | None = None,
    water_intake: float | None = None,
) -> dict:
    """
    Runs the complete Skin Concern Analysis Engine.
    """

    detected_concerns = identify_skin_concerns(
        concerns=concerns,
        sensitivity=sensitivity,
    )

    priority = prioritize_concerns(
        detected_concerns
    )

    risk_factors = identify_risk_factors(
        exercise_minutes=exercise_minutes,
        stress_level=stress_level,
        sleep_hours=sleep_hours,
        sleep_quality=sleep_quality,
        water_intake=water_intake,
        sensitivity=sensitivity,
        allergies=allergies,
    )

    return {
        "detected_concerns": detected_concerns,
        "primary_concern": priority["primary_concern"],
        "secondary_concerns": priority["secondary_concerns"],
        "risk_factors": risk_factors,
    }