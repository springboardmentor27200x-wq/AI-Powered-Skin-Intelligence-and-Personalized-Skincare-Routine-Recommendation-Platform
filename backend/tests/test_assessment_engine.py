from datetime import date, timedelta
from types import SimpleNamespace

from app.services.assessment_engine import (
    score_skin_condition, score_lifestyle, score_sleep,
    score_routine_consistency, score_hydration,
    compute_weighted_assessment, compute_trend_analysis, recent_window,
    NEUTRAL_DEFAULT,
)


def lifestyle_row(log_date, stress_level="low", habits=None):
    return SimpleNamespace(log_date=log_date, stress_level=stress_level, lifestyle_habits=habits or [])


def sleep_row(log_date, quality="good", hours=7.5):
    return SimpleNamespace(log_date=log_date, sleep_quality=quality, sleep_hours=hours)


def hydration_row(log_date, liters=2.5):
    return SimpleNamespace(log_date=log_date, water_intake_liters=liters)


def adherence_row(morning=True, evening=True):
    return SimpleNamespace(morning_completed=morning, evening_completed=evening)


# ---- score_skin_condition ----

def test_skin_condition_no_concerns_is_perfect():
    assert score_skin_condition([]) == 100


def test_skin_condition_deducts_per_concern():
    assert score_skin_condition(["acne", "redness", "dryness"]) == 100 - 3 * 8


def test_skin_condition_clamps_at_zero():
    assert score_skin_condition(["c"] * 20) == 0


# ---- score_lifestyle ----

def test_lifestyle_too_few_days_returns_neutral():
    score, notes = score_lifestyle([lifestyle_row(date.today())], days_logged=1)
    assert score == NEUTRAL_DEFAULT
    assert "neutral default" in notes[0]


def test_lifestyle_high_stress_penalty():
    rows = [lifestyle_row(date.today() - timedelta(days=i), stress_level="high") for i in range(4)]
    score, notes = score_lifestyle(rows, days_logged=4)
    assert score == 100 - 15
    assert any("stress" in n.lower() for n in notes)


def test_lifestyle_negative_and_positive_habits():
    rows = [
        lifestyle_row(date.today(), habits=["smoking"]),
        lifestyle_row(date.today() - timedelta(days=1), habits=["exercise"]),
        lifestyle_row(date.today() - timedelta(days=2), habits=[]),
    ]
    score, _ = score_lifestyle(rows, days_logged=3)
    # 100 - 3 (smoking) + 2 (exercise) = 99
    assert score == 99


# ---- score_sleep ----

def test_sleep_too_few_days_returns_neutral():
    score, notes = score_sleep([sleep_row(date.today())], days_logged=1)
    assert score == NEUTRAL_DEFAULT


def test_sleep_excellent_quality_high_hours():
    rows = [sleep_row(date.today() - timedelta(days=i), quality="excellent", hours=8) for i in range(3)]
    score, notes = score_sleep(rows, days_logged=3)
    assert score == 100
    assert notes == []


def test_sleep_low_hours_penalty():
    rows = [sleep_row(date.today() - timedelta(days=i), quality="good", hours=5) for i in range(3)]
    score, notes = score_sleep(rows, days_logged=3)
    assert score == 70  # 80 - 10
    assert any("low" in n.lower() for n in notes)


# ---- score_routine_consistency ----

def test_routine_consistency_no_routine():
    score, notes = score_routine_consistency([], routine_exists=False)
    assert score == NEUTRAL_DEFAULT
    assert "No routine generated" in notes[0]


def test_routine_consistency_no_logs_yet():
    score, notes = score_routine_consistency([], routine_exists=True)
    assert score == NEUTRAL_DEFAULT
    assert "adherence logged" in notes[0]


def test_routine_consistency_full_adherence():
    rows = [adherence_row(True, True) for _ in range(5)]
    score, notes = score_routine_consistency(rows, routine_exists=True)
    assert score == 100
    assert notes == []


def test_routine_consistency_partial_adherence_flags_low():
    rows = [adherence_row(True, False) for _ in range(5)]  # 50% exactly, not < 0.5
    score, notes = score_routine_consistency(rows, routine_exists=True)
    assert score == 50
    rows_low = [adherence_row(False, False)] * 3 + [adherence_row(True, True)]
    score_low, notes_low = score_routine_consistency(rows_low, routine_exists=True)
    assert score_low < 50
    assert any("low" in n.lower() for n in notes_low)


# ---- score_hydration ----

def test_hydration_too_few_days_returns_neutral():
    score, notes = score_hydration([hydration_row(date.today())], days_logged=1)
    assert score == NEUTRAL_DEFAULT


def test_hydration_meets_target():
    rows = [hydration_row(date.today() - timedelta(days=i), liters=2.5) for i in range(3)]
    score, notes = score_hydration(rows, days_logged=3, target_liters=2.5)
    assert score == 100
    assert notes == []


def test_hydration_below_target_flags_note():
    rows = [hydration_row(date.today() - timedelta(days=i), liters=1.0) for i in range(3)]
    score, notes = score_hydration(rows, days_logged=3, target_liters=2.5)
    assert score == 40  # (1.0 / 2.5) * 100
    assert any("below target" in n.lower() for n in notes)


# ---- compute_weighted_assessment ----

def test_weighted_assessment_combines_all_components_with_correct_weights():
    result = compute_weighted_assessment(
        concern_names=[],  # skin_condition = 100
        lifestyle_rows=[],  # too few days -> neutral 50
        sleep_rows=[],  # neutral 50
        hydration_rows=[],  # neutral 50
        adherence_rows=[],  # routine_exists False -> neutral 50
        routine_exists=False,
    )
    # 100*0.35 + 50*0.20 + 50*0.15 + 50*0.20 + 50*0.10 = 35 + 10 + 7.5 + 10 + 5 = 67.5 -> rounds to 68
    assert result["score"] == 68
    assert result["skin_condition_score"] == 100
    assert result["lifestyle_score"] == 50
    assert result["prioritized_concerns"] == []
    assert isinstance(result["risk_factors"], list)
    assert len(result["risk_factors"]) > 0


# ---- compute_trend_analysis ----

def assessment(score):
    return SimpleNamespace(score=score)


def test_trend_analysis_empty_history_returns_none():
    assert compute_trend_analysis([]) is None


def test_trend_analysis_single_assessment_is_stable():
    result = compute_trend_analysis([assessment(70)])
    assert result["trend"] == "stable"
    assert result["change_since_last"] is None
    assert result["assessments_count"] == 1


def test_trend_analysis_improving():
    result = compute_trend_analysis([assessment(80), assessment(70)])
    assert result["change_since_last"] == 10
    assert result["trend"] == "improving"


def test_trend_analysis_declining():
    result = compute_trend_analysis([assessment(60), assessment(75)])
    assert result["change_since_last"] == -15
    assert result["trend"] == "declining"


def test_trend_analysis_stats_across_history():
    result = compute_trend_analysis([assessment(70), assessment(60), assessment(80)])
    assert result["current_score"] == 70
    assert result["first_score"] == 80
    assert result["best_score"] == 80
    assert result["worst_score"] == 60
    assert result["average_score"] == 70.0


# ---- recent_window ----

def test_recent_window_returns_correct_past_date():
    assert recent_window(7) == date.today() - timedelta(days=7)