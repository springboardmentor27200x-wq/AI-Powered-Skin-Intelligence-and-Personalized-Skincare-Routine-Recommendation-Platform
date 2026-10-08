"""
Progress Prediction & Trend Analysis
====================================
Analyzes score history and adherence to generate
insights and simple improvement predictions.
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta


def _parse_date(date_str: str):
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except Exception:
        return None


def generate_progress_insights(
    history: List[Dict[str, Any]],
    today_adherence: int = 0,
    latest_score: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Generate trend analysis and insights from score history.

    history: list of {"date": "YYYY-MM-DD", "score": int, "summary": str}
    """
    if not history:
        return {
            "trend": "insufficient_data",
            "trend_label": "Not enough data yet",
            "insight": "Complete a few more days of assessment and checklist to unlock progress insights.",
            "prediction": None,
            "improvement_rate": None,
            "consistency_status": "unknown",
            "recommendations": [
                "Fill your daily checklist regularly",
                "Update your skin profile if anything changes",
                "Check back after 5–7 days of consistent use"
            ],
        }

    # Sort by date
    sorted_hist = sorted(
        [h for h in history if h.get("date") and h.get("score") is not None],
        key=lambda x: x["date"]
    )

    scores = [int(h["score"]) for h in sorted_hist]
    dates = [h["date"] for h in sorted_hist]
    n = len(scores)

    latest = latest_score if latest_score is not None else scores[-1]
    first = scores[0]
    change = latest - first

    # ----- Trend calculation -----
    if n >= 4:
        recent = scores[-3:]
        earlier = scores[-6:-3] if n >= 6 else scores[:n-3]
        recent_avg = sum(recent) / len(recent)
        earlier_avg = sum(earlier) / len(earlier) if earlier else recent_avg
        delta = recent_avg - earlier_avg
    elif n >= 2:
        delta = scores[-1] - scores[0]
    else:
        delta = 0

    if delta >= 6:
        trend = "improving"
        trend_label = "Improving"
    elif delta <= -6:
        trend = "declining"
        trend_label = "Declining"
    else:
        trend = "stable"
        trend_label = "Stable"

    # ----- Improvement rate (points per week) -----
    improvement_rate = None
    if n >= 2:
        d1 = _parse_date(dates[0])
        d2 = _parse_date(dates[-1])
        if d1 and d2:
            days = max((d2 - d1).days, 1)
            weeks = days / 7
            if weeks >= 0.5:
                improvement_rate = round(change / weeks, 1)

    # ----- Simple prediction (next 7–14 days) -----
    prediction = None
    if improvement_rate is not None and trend != "stable":
        predicted = latest + (improvement_rate * 1.5)  # ~10 days
        predicted = max(0, min(100, round(predicted)))
        prediction = {
            "target_score": predicted,
            "timeframe": "about 10–14 days",
            "note": "Based on your recent trend. Actual results depend on consistency."
        }

    # ----- Consistency status -----
    if today_adherence >= 80:
        consistency_status = "excellent"
    elif today_adherence >= 50:
        consistency_status = "moderate"
    elif today_adherence > 0:
        consistency_status = "low"
    else:
        consistency_status = "missing"

    # ----- Main insight -----
    if n < 3:
        insight = f"Your current score is {latest}. Keep logging for a few more days to see clear trends."
    elif trend == "improving":
        insight = (
            f"Great progress! Your score rose from {first} to {latest} "
            f"({'+' if change >= 0 else ''}{change} points). "
            f"Keep your routine consistent to maintain the upward trend."
        )
    elif trend == "declining":
        insight = (
            f"Your score has dropped from {first} to {latest} "
            f"({change} points). Focus on daily checklist completion and key treatments."
        )
    else:
        insight = (
            f"Your score is stable around {latest}. "
            f"Small consistent improvements in sleep, hydration, or adherence can push it higher."
        )

    # ----- Recommendations -----
    recommendations = []

    if consistency_status in ["low", "missing"]:
        recommendations.append("Complete your daily morning & evening checklist — consistency has a big impact on the score.")
    if trend == "declining":
        recommendations.append("Review your main concern treatments and avoid skipping active nights.")
        recommendations.append("Check sleep and stress levels — they strongly affect skin recovery.")
    if trend == "improving":
        recommendations.append("Don’t change too many products at once — stick to what’s working.")
    if today_adherence < 60:
        recommendations.append("Try setting a fixed time for your routine to improve adherence.")
    if not recommendations:
        recommendations.append("Continue your current routine and re-check progress in a few days.")
        recommendations.append("Protect progress with daily sunscreen and consistent moisturizing.")

    return {
        "trend": trend,
        "trend_label": trend_label,
        "insight": insight,
        "prediction": prediction,
        "improvement_rate": improvement_rate,
        "consistency_status": consistency_status,
        "change_from_start": change,
        "data_points": n,
        "recommendations": recommendations[:4],
    }