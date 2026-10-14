"""Rule-based skin scoring — implements the weighted model from the
project plan:
    Skin Condition Assessment  35%
    Lifestyle Habits           20%
    Sleep Quality              15%
    Routine Consistency        20%
    Hydration Level            10%

Each component is computed as its own 0-100 sub-score, then combined by
weight. Where there isn't enough recent data to trust a component (fewer
than 3 of the last 7 days logged), that component defaults to a neutral
50 rather than a fabricated number, and a risk factor notes it.

Concern severity is not part of the project plan's model, so skin
condition scoring uses a flat deduction per stated concern.
"""
from datetime import date, timedelta

NEUTRAL_DEFAULT = 50
MIN_DAYS_TRUSTED = 3
CONCERN_PENALTY = 8  # flat deduction per concern, regardless of type

WEIGHTS = {
    "skin_condition": 0.35,
    "lifestyle": 0.20,
    "sleep": 0.15,
    "routine_consistency": 0.20,
    "hydration": 0.10,
}


def _clamp(value: float) -> int:
    return max(0, min(100, round(value)))


def score_skin_condition(concern_names: list[str]) -> int:
    """35% — flat deduction per stated concern."""
    score = 100 - (len(concern_names) * CONCERN_PENALTY)
    return _clamp(score)


def score_lifestyle(lifestyle_rows: list, days_logged: int) -> tuple[int, list[str]]:
    """20% — recent stress level and habit signals."""
    if days_logged < MIN_DAYS_TRUSTED:
        return NEUTRAL_DEFAULT, ["Not enough recent lifestyle logs to score this confidently — using a neutral default."]

    score = 100
    notes: list[str] = []
    high_stress_days = sum(1 for r in lifestyle_rows if r.stress_level == "high")
    if high_stress_days >= 4:
        score -= 15
        notes.append("High stress logged on most recent days.")
    elif high_stress_days >= 2:
        score -= 7

    negative_habits = {"smoking", "alcohol", "high_stress"}
    positive_habits = {"exercise"}
    for r in lifestyle_rows:
        habits = set(r.lifestyle_habits or [])
        if habits & negative_habits:
            score -= 3
        if habits & positive_habits:
            score += 2

    return _clamp(score), notes


def score_sleep(sleep_rows: list, days_logged: int) -> tuple[int, list[str]]:
    """15% — recent sleep quality and hours."""
    if days_logged < MIN_DAYS_TRUSTED:
        return NEUTRAL_DEFAULT, ["Not enough recent sleep logs to score this confidently — using a neutral default."]

    quality_points = {"poor": 30, "fair": 55, "good": 80, "excellent": 100}
    quality_scores = [quality_points.get(r.sleep_quality, 55) for r in sleep_rows]
    avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else NEUTRAL_DEFAULT

    hours = [r.sleep_hours for r in sleep_rows if r.sleep_hours is not None]
    avg_hours = sum(hours) / len(hours) if hours else None

    notes: list[str] = []
    score = avg_quality
    if avg_hours is not None and avg_hours < 6:
        score -= 10
        notes.append(f"Average sleep is low ({round(avg_hours, 1)}h/night).")

    return _clamp(score), notes


def score_routine_consistency(adherence_rows: list, routine_exists: bool) -> tuple[int, list[str]]:
    """20% — did the user actually follow the routine they were given."""
    if not routine_exists:
        return NEUTRAL_DEFAULT, ["No routine generated yet — routine consistency can't be scored."]
    if not adherence_rows:
        return NEUTRAL_DEFAULT, ["No routine adherence logged yet — mark your daily routine as done to improve accuracy here."]

    total_slots = len(adherence_rows) * 2  # morning + evening per day
    completed_slots = sum((1 if r.morning_completed else 0) + (1 if r.evening_completed else 0) for r in adherence_rows)
    ratio = completed_slots / total_slots if total_slots else 0

    notes: list[str] = []
    if ratio < 0.5:
        notes.append("Routine adherence has been low recently — consistency matters for results.")

    return _clamp(ratio * 100), notes


def score_hydration(hydration_rows: list, days_logged: int, target_liters: float = 2.5) -> tuple[int, list[str]]:
    """10% — recent water intake vs a healthy daily target."""
    if days_logged < MIN_DAYS_TRUSTED:
        return NEUTRAL_DEFAULT, ["Not enough recent hydration logs to score this confidently — using a neutral default."]

    intakes = [r.water_intake_liters for r in hydration_rows if r.water_intake_liters is not None]
    avg = float(sum(intakes)) / len(intakes) if intakes else None

    notes: list[str] = []
    if avg is None:
        return NEUTRAL_DEFAULT, notes
    if avg < target_liters:
        notes.append(f"Water intake is below target (avg {round(avg, 1)}L vs {target_liters}L recommended).")

    return _clamp((avg / target_liters) * 100), notes


def compute_weighted_assessment(
    concern_names: list[str],
    lifestyle_rows: list,
    sleep_rows: list,
    hydration_rows: list,
    adherence_rows: list,
    routine_exists: bool,
) -> dict:
    """Combines all five components into the final weighted score."""
    days_logged_lifestyle = len({r.log_date for r in lifestyle_rows})
    days_logged_sleep = len({r.log_date for r in sleep_rows})
    days_logged_hydration = len({r.log_date for r in hydration_rows})

    skin_condition = score_skin_condition(concern_names)
    lifestyle, lifestyle_notes = score_lifestyle(lifestyle_rows, days_logged_lifestyle)
    sleep, sleep_notes = score_sleep(sleep_rows, days_logged_sleep)
    routine_consistency, routine_notes = score_routine_consistency(adherence_rows, routine_exists)
    hydration, hydration_notes = score_hydration(hydration_rows, days_logged_hydration)

    final_score = _clamp(
        skin_condition * WEIGHTS["skin_condition"]
        + lifestyle * WEIGHTS["lifestyle"]
        + sleep * WEIGHTS["sleep"]
        + routine_consistency * WEIGHTS["routine_consistency"]
        + hydration * WEIGHTS["hydration"]
    )

    risk_factors = lifestyle_notes + sleep_notes + routine_notes + hydration_notes

    return {
        "score": final_score,
        "skin_condition_score": skin_condition,
        "lifestyle_score": lifestyle,
        "sleep_score": sleep,
        "routine_consistency_score": routine_consistency,
        "hydration_score": hydration,
        "prioritized_concerns": concern_names,
        "risk_factors": risk_factors,
    }


def recent_window(days: int = 7) -> date:
    return date.today() - timedelta(days=days)
def compute_trend_analysis(assessments: list) -> dict:
    """assessments must be ordered newest-first (as the history endpoint
    already returns them). Returns the trend summary for Progress
    Tracking & Analytics — direction, deltas, and simple stats."""
    if not assessments:
        return None

    scores = [a.score for a in assessments]
    current_score = scores[0]
    first_score = scores[-1]
    change_since_first = current_score - first_score
    change_since_last = (current_score - scores[1]) if len(scores) > 1 else None

    if change_since_last is None:
        trend = "stable"
    elif change_since_last > 2:
        trend = "improving"
    elif change_since_last < -2:
        trend = "declining"
    else:
        trend = "stable"

    return {
        "current_score": current_score,
        "first_score": first_score,
        "change_since_first": change_since_first,
        "change_since_last": change_since_last,
        "trend": trend,
        "average_score": round(sum(scores) / len(scores), 1),
        "best_score": max(scores),
        "worst_score": min(scores),
        "assessments_count": len(scores),
    }