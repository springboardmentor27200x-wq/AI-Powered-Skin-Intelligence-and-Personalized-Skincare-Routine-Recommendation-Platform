"""Builds a user's reminders and alerts from data that already exists.

Everything here is computed live from today's logs, so a reminder disappears
the moment the user does the thing it asks for — nothing to schedule, store,
or mark as read.
"""
from datetime import date

from app.services.product_usage import days_remaining, product_status

HYDRATION_TARGET_LITERS = 2.5  # same target the assessment engine scores against
LOW_SLEEP_HOURS = 6.0
ASSESSMENT_STALE_DAYS = 7
SCORE_CHANGE_THRESHOLD = 2  # same cutoff compute_trend_analysis uses for improving/declining

_SEVERITY_ORDER = {"warning": 0, "info": 1, "success": 2}


def _note(id_: str, type_: str, severity: str, title: str, message: str, action_path: str | None):
    return {
        "id": id_,
        "type": type_,
        "severity": severity,
        "title": title,
        "message": message,
        "action_path": action_path,
    }


def build_user_notifications(
    *,
    today: date,
    has_routine: bool,
    adherence_today,
    hydration_liters_today: float | None,
    sleep_logged_today: bool,
    recent_sleep_hours: list[float],
    assessments_newest_first: list,
    products_in_use: list | None = None,
) -> list[dict]:
    notes: list[dict] = []

    # ---- Routine reminders ----
    if has_routine:
        morning = bool(adherence_today and adherence_today.morning_completed)
        evening = bool(adherence_today and adherence_today.evening_completed)
        if not morning and not evening:
            notes.append(_note(
                "routine-today", "routine", "info",
                "Today's routine isn't marked yet",
                "Mark your morning and evening routine as done to keep your consistency score up.",
                "/plan",
            ))
        elif morning and not evening:
            notes.append(_note(
                "routine-evening", "routine", "info",
                "Evening routine still to do",
                "Your morning routine is done — don't forget tonight's.",
                "/plan",
            ))
        elif evening and not morning:
            notes.append(_note(
                "routine-morning", "routine", "info",
                "Morning routine not marked",
                "Your evening routine is done, but this morning's isn't marked yet.",
                "/plan",
            ))

    # ---- Hydration reminders ----
    if hydration_liters_today is None:
        notes.append(_note(
            "hydration-today", "hydration", "info",
            "Log today's water intake",
            f"Aim for about {HYDRATION_TARGET_LITERS} L a day — log what you've had so far.",
            "/lifestyle",
        ))
    elif hydration_liters_today < HYDRATION_TARGET_LITERS:
        notes.append(_note(
            "hydration-low", "hydration", "info",
            "Water intake below target",
            f"You've logged {round(hydration_liters_today, 1)} L of {HYDRATION_TARGET_LITERS} L today.",
            "/lifestyle",
        ))

    # ---- Sleep reminders ----
    if not sleep_logged_today:
        notes.append(_note(
            "sleep-today", "sleep", "info",
            "Log last night's sleep",
            "Sleep makes up 15% of your skin health score.",
            "/lifestyle",
        ))
    if len(recent_sleep_hours) >= 2:
        avg = sum(recent_sleep_hours) / len(recent_sleep_hours)
        if avg < LOW_SLEEP_HOURS:
            notes.append(_note(
                "sleep-low", "sleep", "warning",
                "Sleep running low",
                f"You've averaged {round(avg, 1)} h over your last {len(recent_sleep_hours)} logged nights.",
                "/lifestyle",
            ))

    # ---- Progress alerts ----
    if not assessments_newest_first:
        notes.append(_note(
            "assessment-first", "progress", "info",
            "Run your first skin assessment",
            "Your assessment unlocks your score, routine, and product recommendations.",
            "/plan",
        ))
    else:
        latest = assessments_newest_first[0]
        age_days = (today - latest.created_at.date()).days
        if age_days >= ASSESSMENT_STALE_DAYS:
            notes.append(_note(
                "assessment-stale", "progress", "info",
                "Time for a fresh assessment",
                f"Your last assessment was {age_days} days ago.",
                "/plan",
            ))
        if len(assessments_newest_first) >= 2:
            change = latest.score - assessments_newest_first[1].score
            if change <= -SCORE_CHANGE_THRESHOLD:
                notes.append(_note(
                    "score-down", "progress", "warning",
                    "Skin health score dropped",
                    f"Down {abs(change)} points since your previous assessment.",
                    "/progress",
                ))
            elif change >= SCORE_CHANGE_THRESHOLD:
                notes.append(_note(
                    "score-up", "progress", "success",
                    "Skin health score improved",
                    f"Up {change} points since your previous assessment.",
                    "/progress",
                ))

    # ---- Product replenishment reminders ----
    for item in products_in_use or []:
        left = days_remaining(item.started_on, item.lasts_days, today)
        status = product_status(left)
        if status == "empty":
            if left == 0:
                when = "should run out today"
            else:
                days = abs(left)
                when = f"should have run out {days} day{'s' if days != 1 else ''} ago"
            notes.append(_note(
                f"restock-{item.product_id}", "product", "warning",
                f"Time to restock {item.name}",
                f"Your {item.name} {when}.",
                "/my-products",
            ))
        elif status == "low":
            notes.append(_note(
                f"low-{item.product_id}", "product", "info",
                f"{item.name} is running low",
                f"About {left} day{'s' if left != 1 else ''} left — time to reorder.",
                "/my-products",
            ))

    notes.sort(key=lambda n: _SEVERITY_ORDER[n["severity"]])
    return notes