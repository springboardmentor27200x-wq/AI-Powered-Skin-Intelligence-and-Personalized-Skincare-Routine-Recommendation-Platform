
# =========================================================
# SKIN CONCERN ANALYSIS ENGINE
# =========================================================
#
# Features:
# - Skin concern identification
# - Concern severity scoring
# - Concern prioritization
# - Primary and secondary concerns
# - Structured lifestyle risk analysis
# - Sensitivity and allergy warnings
# - Risk levels, explanations, and recommendations
#
# Rule-based baseline for AI Skin Intelligence.
# This engine does not diagnose medical conditions.
# =========================================================

from typing import Any


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
# SEVERITY SETTINGS
# =========================================================

SEVERITY_SCORES = {
    "mild": 30,
    "moderate": 60,
    "severe": 90,
}

DEFAULT_SEVERITY = 50


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def normalize_text(value: str | None) -> str:
    """Normalize text for consistent matching."""
    return " ".join((value or "").lower().strip().split())


def clamp_score(score: float) -> float:
    """Keep a numeric score between 0 and 100."""
    return max(0.0, min(100.0, float(score)))


def is_reported(value: str | None) -> bool:
    """Check whether a field contains meaningful information."""
    return normalize_text(value) not in {
        "",
        "none",
        "no",
        "n/a",
        "na",
        "nil",
        "not applicable",
    }


# =========================================================
# CONCERN SEVERITY
# =========================================================

def calculate_concern_severity(
    concern: str,
    concerns_text: str,
    sensitivity: str = "",
) -> int:
    """
    Return a severity score from 0 to 100.

    Severity is determined from the text associated with the
    individual concern, rather than from severity words that
    may describe a different concern.
    """

    text = normalize_text(concerns_text)
    concern_lower = normalize_text(concern)
    sensitivity_text = normalize_text(sensitivity)

    # The concern must actually be reported.
    if concern_lower not in text:
        return 0

    # Look for severity words near the individual concern.
    # This helps distinguish:
    # "mild acne, severe dry skin"
    # from a single global severity.
    import re

    escaped_concern = re.escape(concern_lower)

    pattern = (
        rf"(?:(mild|moderate|severe)\s+"
        rf"{escaped_concern}\b|"
        rf"\b{escaped_concern}\b"
        rf"[^,;.!]*(?:is|of|:)?\s*"
        rf"(mild|moderate|severe)\b)"
    )

    match = re.search(pattern, text)

    if match:
        severity_word = match.group(1) or match.group(2)
        severity = SEVERITY_SCORES[severity_word]
    else:
        severity = DEFAULT_SEVERITY

    # Sensitivity modestly increases priority when the concern
    # itself is sensitive skin and high sensitivity is reported.
    if (
        concern_lower == "sensitive skin"
        and sensitivity_text in {"high", "high sensitivity"}
    ):
        severity += 10

    return int(min(severity, 100))


# =========================================================
# IDENTIFY SKIN CONCERNS
# =========================================================

def identify_skin_concerns(
    concerns: str | None,
    sensitivity: str | None = None,
) -> list[dict[str, Any]]:
    """
    Identify supported concerns and calculate severity.
    """

    concerns_text = normalize_text(concerns)
    detected = []

    for concern in SUPPORTED_CONCERNS:
        if concern.lower() not in concerns_text:
            continue

        severity = calculate_concern_severity(
            concern=concern,
            concerns_text=concerns_text,
            sensitivity=sensitivity or "",
        )

        detected.append({
            "concern": concern,
            "severity": severity,
        })

    detected.sort(
        key=lambda item: item["severity"],
        reverse=True,
    )

    return detected


# =========================================================
# CONCERN PRIORITIZATION
# =========================================================

def prioritize_concerns(
    detected_concerns: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Rank concerns by reported severity.

    Priority score is a transparent rule-based score, not a
    medically validated urgency prediction.
    """

    if not detected_concerns:
        return {
            "primary_concern": None,
            "secondary_concerns": [],
            "prioritized_concerns": [],
        }

    prioritized = []

    for item in detected_concerns:
        severity = clamp_score(
            item.get("severity", 0)
        )

        if severity >= 75:
            priority_level = "High"
        elif severity >= 45:
            priority_level = "Medium"
        else:
            priority_level = "Low"

        prioritized.append({
            **item,
            "priority_score": round(severity, 2),
            "priority_level": priority_level,
            "reason": (
                f"{item['concern']} is ranked using its "
                f"reported severity score of {severity:.0f}/100."
            ),
        })

    prioritized.sort(
        key=lambda item: item["priority_score"],
        reverse=True,
    )

    return {
        "primary_concern": prioritized[0]["concern"],
        "secondary_concerns": [
            item["concern"]
            for item in prioritized[1:]
        ],
        "prioritized_concerns": prioritized,
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
) -> dict[str, Any]:
    """
    Identify potential lifestyle and skincare risk indicators.

    Missing information is not automatically classified as a risk.
    The results are informational and do not constitute a diagnosis.
    """

    risks = []

    def add_risk(
        category: str,
        level: str,
        message: str,
        recommendation: str,
    ) -> None:
        risks.append({
            "category": category,
            "level": level,
            "message": message,
            "recommendation": recommendation,
        })

    # -------------------------
    # STRESS
    # Expected scale: 1-10
    # -------------------------

    if stress_level is not None:
        stress = int(stress_level)

        if 1 <= stress <= 10:
            if stress >= 8:
                add_risk(
                    "Stress",
                    "High",
                    "High reported stress level.",
                    "Consider stress-management strategies and regular breaks.",
                )
            elif stress >= 6:
                add_risk(
                    "Stress",
                    "Moderate",
                    "Moderate reported stress level.",
                    "Monitor stress and consider relaxation activities.",
                )

    # -------------------------
    # SLEEP DURATION
    # -------------------------

    if sleep_hours is not None:
        sleep = float(sleep_hours)

        if sleep >= 0:
            if sleep < 6:
                add_risk(
                    "Sleep",
                    "High",
                    "Reported sleep duration is below 6 hours.",
                    "Review sleep habits and seek professional advice if problems persist.",
                )
            elif sleep < 7:
                add_risk(
                    "Sleep",
                    "Moderate",
                    "Reported sleep duration is below 7 hours.",
                    "Consider maintaining a consistent sleep schedule.",
                )

    # -------------------------
    # SLEEP QUALITY
    # Expected scale: 1-10
    # -------------------------

    if sleep_quality is not None:
        quality = int(sleep_quality)

        if 1 <= quality <= 10:
            if quality <= 4:
                add_risk(
                    "Sleep quality",
                    "Moderate",
                    "Low reported sleep quality.",
                    "Monitor sleep quality and seek advice if the issue continues.",
                )
            elif quality <= 6:
                add_risk(
                    "Sleep quality",
                    "Low",
                    "Moderate reported sleep quality.",
                    "Consider reviewing sleep habits.",
                )

    # -------------------------
    # HYDRATION
    # -------------------------

    if water_intake is not None:
        water = float(water_intake)

        if water >= 0:
            if water < 1.0:
                add_risk(
                    "Hydration",
                    "Moderate",
                    "Reported daily water intake is below 1 liter.",
                    "Review hydration needs based on activity, climate and medical advice.",
                )
            elif water < 1.5:
                add_risk(
                    "Hydration",
                    "Low",
                    "Reported daily water intake is below 1.5 liters.",
                    "Review fluid intake according to individual needs.",
                )

    # -------------------------
    # PHYSICAL ACTIVITY
    # Expected input: minutes per week
    # -------------------------

    if exercise_minutes is not None:
        exercise = float(exercise_minutes)

        if exercise >= 0:
            if exercise < 50:
                add_risk(
                    "Physical activity",
                    "Low",
                    "Reported weekly physical activity is limited.",
                    "Consider gradually increasing activity if appropriate.",
                )

    # -------------------------
    # SKIN SENSITIVITY
    # -------------------------

    sensitivity_text = normalize_text(sensitivity)

    if sensitivity_text in {"high", "high sensitivity"}:
        add_risk(
            "Skin sensitivity",
            "High",
            "High skin sensitivity was reported.",
            "Introduce new products cautiously and stop products that cause irritation.",
        )
    elif sensitivity_text in {"moderate", "moderate sensitivity"}:
        add_risk(
            "Skin sensitivity",
            "Moderate",
            "Moderate skin sensitivity was reported.",
            "Patch-test new products and monitor for irritation.",
        )

    # -------------------------
    # ALLERGIES
    # -------------------------

    if is_reported(allergies):
        add_risk(
            "Allergy",
            "High",
            "A possible skin or product allergy was reported.",
            "Avoid known allergens and check product ingredients. Seek professional advice when needed.",
        )

    # -------------------------
    # OVERALL RISK SUMMARY
    # -------------------------

    levels = [risk["level"] for risk in risks]

    if "High" in levels:
        overall_level = "High"
    elif "Moderate" in levels:
        overall_level = "Moderate"
    elif "Low" in levels:
        overall_level = "Low"
    else:
        overall_level = "No identified lifestyle risk flags"

    return {
        "overall_risk_level": overall_level,
        "risk_factors": [
            risk["message"]
            for risk in risks
        ],
        "risk_details": risks,
    }


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
) -> dict[str, Any]:
    """
    Runs the complete Skin Concern Analysis Engine.
    """

    detected_concerns = identify_skin_concerns(
        concerns=concerns,
        sensitivity=sensitivity,
    )

    priority = prioritize_concerns(
        detected_concerns=detected_concerns,
    )

    risk_analysis = identify_risk_factors(
        exercise_minutes=exercise_minutes,
        stress_level=stress_level,
        sleep_hours=sleep_hours,
        sleep_quality=sleep_quality,
        water_intake=water_intake,
        sensitivity=sensitivity,
        allergies=allergies,
    )

    return {
        # Existing fields retained for compatibility.
        "detected_concerns": detected_concerns,
        "primary_concern": priority["primary_concern"],
        "secondary_concerns": priority["secondary_concerns"],
        "risk_factors": risk_analysis["risk_factors"],

        # New concern prioritization output.
        "prioritized_concerns": priority["prioritized_concerns"],

        # New structured risk analysis output.
        "risk_analysis": risk_analysis,
    }
