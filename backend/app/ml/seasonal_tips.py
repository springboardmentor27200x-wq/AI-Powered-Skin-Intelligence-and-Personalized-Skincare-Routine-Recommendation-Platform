"""
Seasonal & Environmental Skincare Tips
======================================
Generates personalized tips using season + live weather (UV, humidity, temp)
+ user skin profile.
"""

from __future__ import annotations
from typing import Any, Dict, List
from datetime import datetime

from app.ml.weather_service import get_current_weather, get_environmental_signals


def _normalize(text: str) -> str:
    return (text or "").lower().strip()


def _get_current_season() -> str:
    """Simple season detection based on month (Northern Hemisphere / India-friendly)."""
    month = datetime.now().month
    if month in [12, 1, 2]:
        return "winter"
    elif month in [3, 4, 5]:
        return "summer"
    elif month in [6, 7, 8, 9]:
        return "monsoon"
    else:
        return "autumn"


def generate_seasonal_tips(
    profile: Dict[str, Any],
    season: str = None,
    lat: float = None,
    lon: float = None,
) -> Dict[str, Any]:
    """
    Generate personalized seasonal + environmental tips.
    """
    if not season:
        season = _get_current_season()
    season = _normalize(season)

    skin_type = _normalize(profile.get("skin_type") or "normal")
    concerns = _normalize(profile.get("skin_concerns") or "")
    env = _normalize(profile.get("environmental_exposure") or "")
    water_level = _normalize(profile.get("water_intake_level") or "")

    # Live weather signals
    weather = get_current_weather(
        lat=lat or 28.6139,
        lon=lon or 77.2090,
    )
    signals = get_environmental_signals(weather)

    tips: List[Dict[str, str]] = []

    # ---------- Season base tips ----------
    if season == "winter":
        tips.append({"tip": "Switch to a richer moisturizer to combat dryness", "priority": "high", "category": "hydration"})
        tips.append({"tip": "Add a hyaluronic acid serum before moisturizing", "priority": "high", "category": "hydration"})
        if skin_type in ["dry", "sensitive"] or "dry" in concerns:
            tips.append({"tip": "Look for ceramides and occlusives (shea butter, squalane)", "priority": "high", "category": "barrier"})
        if skin_type == "oily":
            tips.append({"tip": "Use a lightweight gel-cream instead of heavy balms", "priority": "medium", "category": "texture"})
        tips.append({"tip": "Don’t skip sunscreen — UV rays are still present in winter", "priority": "high", "category": "protection"})

    elif season == "summer":
        tips.append({"tip": "Use a lightweight, non-comedogenic moisturizer", "priority": "high", "category": "texture"})
        tips.append({"tip": "Apply SPF 50+ every morning and reapply if outdoors", "priority": "high", "category": "protection"})
        if skin_type == "oily" or "acne" in concerns or "oily" in concerns:
            tips.append({"tip": "Choose oil-free and non-comedogenic products", "priority": "high", "category": "acne"})
        if "hyperpigmentation" in concerns or "dark spots" in concerns:
            tips.append({"tip": "Be extra consistent with sunscreen to prevent dark spots from worsening", "priority": "high", "category": "pigmentation"})
        tips.append({"tip": "Consider a vitamin C serum in the morning for antioxidant protection", "priority": "medium", "category": "antioxidant"})

    elif season == "monsoon":
        tips.append({"tip": "Avoid heavy creams — humidity already adds moisture", "priority": "high", "category": "texture"})
        tips.append({"tip": "Use a gentle cleanser twice daily to remove sweat and pollution", "priority": "high", "category": "cleanse"})
        if skin_type == "oily" or "acne" in concerns:
            tips.append({"tip": "Include salicylic acid or niacinamide to control excess oil and breakouts", "priority": "high", "category": "acne"})
        tips.append({"tip": "Keep skin clean and dry — change pillowcases regularly", "priority": "medium", "category": "hygiene"})

    else:  # autumn / default
        tips.append({"tip": "Transition to slightly richer textures as weather cools", "priority": "medium", "category": "texture"})
        tips.append({"tip": "Maintain daily SPF while UV is still moderate", "priority": "high", "category": "protection"})

    # ---------- Live weather boosters ----------
    if signals.get("high_uv"):
        tips.append({
            "tip": f"UV index is high ({weather.get('uv_index')}) — never skip broad-spectrum sunscreen today",
            "priority": "high",
            "category": "protection"
        })
        if "hyperpigmentation" in concerns or "dark spots" in concerns:
            tips.append({
                "tip": "Pair sunscreen with a pigment-correcting serum (niacinamide / vitamin C)",
                "priority": "high",
                "category": "pigmentation"
            })

    if signals.get("high_humidity"):
        tips.append({
            "tip": f"Humidity is high ({weather.get('humidity')}%) — prefer lightweight gel textures",
            "priority": "medium",
            "category": "texture"
        })

    if signals.get("low_humidity"):
        tips.append({
            "tip": f"Air is dry ({weather.get('humidity')}% humidity) — add extra hydration / occlusive layer",
            "priority": "high",
            "category": "hydration"
        })

    if signals.get("hot"):
        tips.append({
            "tip": "Temperatures are high — avoid heavy occlusives and focus on light, non-comedogenic products",
            "priority": "medium",
            "category": "texture"
        })

    if signals.get("cold"):
        tips.append({
            "tip": "Cold weather detected — strengthen barrier with ceramides and richer creams",
            "priority": "high",
            "category": "barrier"
        })

    # ---------- Profile-based ----------
    if "high pollution" in env:
        tips.append({"tip": "Add an antioxidant serum (Vitamin C or green tea) to fight pollution damage", "priority": "high", "category": "antioxidant"})
        tips.append({"tip": "Double cleanse in the evening to remove pollution particles", "priority": "medium", "category": "cleanse"})

    if "high sun" in env or "high sun exposure" in env:
        tips.append({"tip": "High sun exposure reported — strict daily SPF is essential", "priority": "high", "category": "protection"})

    if water_level == "low":
        tips.append({"tip": "Increase water intake — internal hydration supports skin barrier", "priority": "medium", "category": "hydration"})

    # Remove duplicates
    seen = set()
    unique_tips = []
    for t in tips:
        if t["tip"] not in seen:
            seen.add(t["tip"])
            unique_tips.append(t)

    # Summary
    if season == "winter":
        summary = "Focus on barrier repair and deeper hydration this winter."
    elif season == "summer":
        summary = "Prioritize lightweight textures and strict sun protection."
    elif season == "monsoon":
        summary = "Keep routines light and focus on oil control and cleansing."
    else:
        summary = "Adjust textures gradually and maintain consistent protection."

    if signals.get("high_uv"):
        summary += " High UV today — sunscreen is non-negotiable."

    return {
        "season": season,
        "tips": unique_tips[:8],
        "summary": summary,
        "high_priority_count": sum(1 for t in unique_tips if t["priority"] == "high"),
        "weather": {
            "temperature": weather.get("temperature"),
            "humidity": weather.get("humidity"),
            "uv_index": weather.get("uv_index"),
            "source": weather.get("source"),
            "success": weather.get("success", False),
        },
    }