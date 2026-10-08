"""
Concern Prioritization & Severity Ranking
=========================================
Assigns severity scores to skin concerns and returns a ranked list.
"""

from __future__ import annotations
from typing import Any, Dict, List, Tuple


# Base severity for each concern (0-100)
BASE_SEVERITY = {
    "acne": 78,
    "hyperpigmentation": 72,
    "dark spots": 68,
    "uneven skin tone": 62,
    "dry skin": 65,
    "oily skin": 58,
    "sensitive skin": 70,
    "redness": 66,
    "wrinkles": 60,
    "fine lines": 55,
    "dehydration": 63,
    "barrier damage": 74,
    "pores": 52,
    "blackheads": 54,
    "dullness": 50,
}

# Extra severity modifiers based on skin type
SKIN_TYPE_MODIFIERS = {
    "oily": {"acne": 12, "pores": 10, "blackheads": 8, "oily skin": 10},
    "dry": {"dry skin": 14, "dehydration": 12, "fine lines": 8, "barrier damage": 10},
    "sensitive": {"sensitive skin": 15, "redness": 12, "barrier damage": 10},
    "combination": {"acne": 6, "dry skin": 5, "oily skin": 5},
    "normal": {},
}

# Lifestyle / signal boosters
SIGNAL_BOOSTERS = {
    "high_stress": {"acne": 8, "redness": 6, "sensitive skin": 5},
    "poor_sleep": {"acne": 6, "dullness": 7, "fine lines": 5, "dark spots": 4},
    "high_sun": {"hyperpigmentation": 12, "dark spots": 10, "uneven skin tone": 8, "wrinkles": 6},
    "high_pollution": {"dullness": 8, "acne": 5, "hyperpigmentation": 4},
    "low_hydration": {"dry skin": 10, "dehydration": 12, "dullness": 6},
    "low_consistency": {"acne": 5, "hyperpigmentation": 4, "dry skin": 4},
}


def _normalize(text: str) -> str:
    return (text or "").lower().strip()


def prioritize_concerns(
    profile: Dict[str, Any],
    routine_consistency: int = 50,
) -> Dict[str, Any]:
    """
    Rank skin concerns by severity.

    Returns:
        {
            "ranked_concerns": [
                {"concern": "Acne", "severity": 86, "level": "High", "reason": "..."},
                ...
            ],
            "top_concerns": ["Acne", "Hyperpigmentation", ...],
            "severity_summary": "2 high, 1 moderate priority concerns"
        }
    """
    skin_type = _normalize(profile.get("skin_type") or "normal")
    raw_concerns = _normalize(profile.get("skin_concerns") or "")
    stress = _normalize(profile.get("stress_level") or "")
    sleep_quality = _normalize(profile.get("sleep_quality") or "")
    env = _normalize(profile.get("environmental_exposure") or "")
    water_level = _normalize(profile.get("water_intake_level") or "")
    sensitivities = _normalize(profile.get("sensitivities") or "")

    # Collect mentioned concerns
    mentioned = set()
    for key in BASE_SEVERITY.keys():
        if key in raw_concerns:
            mentioned.add(key)

    # Also add skin-type implied concerns
    if skin_type == "oily" and "oily skin" not in mentioned:
        mentioned.add("oily skin")
    if skin_type == "dry" and "dry skin" not in mentioned:
        mentioned.add("dry skin")
    if skin_type == "sensitive" and "sensitive skin" not in mentioned:
        mentioned.add("sensitive skin")
    if "easily irritated" in sensitivities or "reactive" in sensitivities:
        mentioned.add("sensitive skin")
        mentioned.add("redness")

    if not mentioned:
        return {
            "ranked_concerns": [],
            "top_concerns": [],
            "severity_summary": "No major concerns detected",
        }

    # Build active signals
    signals = set()
    if stress in ["high", "very high"]:
        signals.add("high_stress")
    if sleep_quality == "poor":
        signals.add("poor_sleep")
    if "high sun" in env:
        signals.add("high_sun")
    if "high pollution" in env:
        signals.add("high_pollution")
    if water_level == "low":
        signals.add("low_hydration")
    if routine_consistency < 45:
        signals.add("low_consistency")

    # Calculate severity for each concern
    scored: List[Tuple[str, int, str]] = []

    for concern in mentioned:
        score = BASE_SEVERITY.get(concern, 50)

        # Skin type modifier
        score += SKIN_TYPE_MODIFIERS.get(skin_type, {}).get(concern, 0)

        # Signal boosters
        for sig in signals:
            score += SIGNAL_BOOSTERS.get(sig, {}).get(concern, 0)

        score = max(20, min(98, score))

        # Human label
        label = concern.replace("_", " ").title()
        if concern == "dry skin":
            label = "Dry Skin"
        elif concern == "oily skin":
            label = "Oily Skin"
        elif concern == "sensitive skin":
            label = "Sensitive Skin"
        elif concern == "uneven skin tone":
            label = "Uneven Skin Tone"
        elif concern == "dark spots":
            label = "Dark Spots"
        elif concern == "fine lines":
            label = "Fine Lines"

        # Severity level
        if score >= 75:
            level = "High"
        elif score >= 58:
            level = "Moderate"
        else:
            level = "Low"

        # Simple reason
        reasons = []
        if skin_type in ["oily", "dry", "sensitive"] and concern in SKIN_TYPE_MODIFIERS.get(skin_type, {}):
            reasons.append(f"common with {skin_type} skin")
        if "high_stress" in signals and concern in ["acne", "redness"]:
            reasons.append("worsened by stress")
        if "high_sun" in signals and concern in ["hyperpigmentation", "dark spots", "uneven skin tone"]:
            reasons.append("increased by sun exposure")
        if "poor_sleep" in signals and concern in ["acne", "dullness", "fine lines"]:
            reasons.append("linked to poor sleep")
        if not reasons:
            reasons.append("reported by user")

        reason = reasons[0]
        scored.append((label, score, level, reason))

    # Sort by severity descending
    scored.sort(key=lambda x: x[1], reverse=True)

    ranked = [
        {
            "concern": label,
            "severity": score,
            "level": level,
            "reason": reason,
        }
        for label, score, level, reason in scored
    ]

    top_concerns = [item["concern"] for item in ranked[:5]]

    high = sum(1 for r in ranked if r["level"] == "High")
    moderate = sum(1 for r in ranked if r["level"] == "Moderate")
    summary_parts = []
    if high:
        summary_parts.append(f"{high} high")
    if moderate:
        summary_parts.append(f"{moderate} moderate")
    severity_summary = (
        ", ".join(summary_parts) + " priority concerns"
        if summary_parts
        else "Low priority concerns only"
    )

    return {
        "ranked_concerns": ranked,
        "top_concerns": top_concerns,
        "severity_summary": severity_summary,
    }