"""
Analytics Service
=================
Derives engagement, adherence, and improvement metrics
from existing ScoreHistory and DailyChecklist data.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional


def _parse_date(d: str):
    try:
        return datetime.strptime(d, "%Y-%m-%d").date()
    except Exception:
        return None


def generate_user_analytics(
    score_history: List[Dict[str, Any]],
    checklist_items: List[Dict[str, Any]],
    days_window: int = 30,
) -> Dict[str, Any]:
    """
    Build analytics for a single user.

    score_history: [{"date": "YYYY-MM-DD", "score": int}, ...]
    checklist_items: [{"date": "YYYY-MM-DD", "is_completed": bool}, ...]
    """
    today = date.today()
    window_start = today - timedelta(days=days_window - 1)

    # ---------- Score metrics ----------
    scores = sorted(
        [h for h in score_history if h.get("date") and h.get("score") is not None],
        key=lambda x: x["date"],
    )
    scores_in_window = []
    for h in scores:
        d = _parse_date(h["date"])
        if d and d >= window_start:
            scores_in_window.append(h)

    assessment_count = len(scores)
    assessment_count_window = len(scores_in_window)

    latest_score = scores[-1]["score"] if scores else None
    first_score = scores[0]["score"] if scores else None
    improvement = (latest_score - first_score) if (latest_score is not None and first_score is not None) else 0

    # Active days with a score
    score_days = set()
    for h in scores_in_window:
        d = _parse_date(h["date"])
        if d:
            score_days.add(d.isoformat())

    # ---------- Checklist / engagement ----------
    daily = defaultdict(lambda: {"total": 0, "completed": 0})
    for item in checklist_items:
        d = item.get("date")
        if not d:
            continue
        parsed = _parse_date(d)
        if not parsed or parsed < window_start:
            continue
        daily[d]["total"] += 1
        if item.get("is_completed"):
            daily[d]["completed"] += 1

    checklist_days = len(daily)
    total_steps = sum(v["total"] for v in daily.values())
    completed_steps = sum(v["completed"] for v in daily.values())
    adherence_rate = round((completed_steps / total_steps) * 100, 1) if total_steps else 0

    # Active days = days with checklist activity OR score
    active_days = set(daily.keys()) | score_days
    active_day_count = len(active_days)
    engagement_rate = round((active_day_count / days_window) * 100, 1)

    # Streak (consecutive days ending today or yesterday)
    streak = 0
    cursor = today
    active_set = set(active_days)
    # allow streak to count if user was active yesterday even if not today yet
    if today.isoformat() not in active_set:
        cursor = today - timedelta(days=1)
    while cursor.isoformat() in active_set:
        streak += 1
        cursor -= timedelta(days=1)

    # ---------- Retention proxy ----------
    # Simple proxy: user is "retained" if active in last 7 days
    last_7_start = today - timedelta(days=6)
    retained = any(
        (_parse_date(d) and _parse_date(d) >= last_7_start) for d in active_days
    )

    # ---------- Quality labels ----------
    if engagement_rate >= 60:
        engagement_label = "High"
    elif engagement_rate >= 30:
        engagement_label = "Moderate"
    else:
        engagement_label = "Low"

    if adherence_rate >= 80:
        adherence_label = "Excellent"
    elif adherence_rate >= 50:
        adherence_label = "Moderate"
    else:
        adherence_label = "Low"

    return {
        "window_days": days_window,
        "engagement": {
            "active_days": active_day_count,
            "engagement_rate": engagement_rate,
            "label": engagement_label,
            "assessment_count_total": assessment_count,
            "assessment_count_window": assessment_count_window,
            "checklist_active_days": checklist_days,
            "current_streak_days": streak,
        },
        "adherence": {
            "completed_steps": completed_steps,
            "total_steps": total_steps,
            "adherence_rate": adherence_rate,
            "label": adherence_label,
        },
        "improvement": {
            "first_score": first_score,
            "latest_score": latest_score,
            "change": improvement,
            "assessments_used": assessment_count,
        },
        "retention_proxy": {
            "active_last_7_days": retained,
            "status": "retained" if retained else "at_risk",
        },
        "summary": _build_summary(
            engagement_label, adherence_label, improvement, retained, streak
        ),
    }


def _build_summary(engagement_label, adherence_label, improvement, retained, streak):
    parts = []
    parts.append(f"Engagement is {engagement_label.lower()}.")
    parts.append(f"Routine adherence is {adherence_label.lower()}.")
    if improvement > 0:
        parts.append(f"Skin score improved by {improvement} points.")
    elif improvement < 0:
        parts.append(f"Skin score dropped by {abs(improvement)} points.")
    else:
        parts.append("Skin score is stable.")
    if streak > 0:
        parts.append(f"Current activity streak: {streak} day(s).")
    parts.append(
        "User appears retained." if retained else "User may be at risk of dropping off."
    )
    return " ".join(parts)