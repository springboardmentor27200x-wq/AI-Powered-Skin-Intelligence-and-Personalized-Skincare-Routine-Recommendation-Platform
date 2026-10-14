from datetime import date, datetime, timedelta, timezone
from types import SimpleNamespace

from app.services.notification_engine import build_user_notifications

TODAY = date(2026, 10, 8)


def assessment(score, days_ago=0):
    created = datetime(2026, 10, 8, 12, 0, tzinfo=timezone.utc) - timedelta(days=days_ago)
    return SimpleNamespace(score=score, created_at=created)


def adherence(morning, evening):
    return SimpleNamespace(morning_completed=morning, evening_completed=evening)


def build(**overrides):
    """A fully up-to-date user by default — so each test only changes one thing."""
    args = dict(
        today=TODAY,
        has_routine=True,
        adherence_today=adherence(True, True),
        hydration_liters_today=3.0,
        sleep_logged_today=True,
        recent_sleep_hours=[8.0, 7.5, 8.0],
        assessments_newest_first=[assessment(80, days_ago=1)],
    )
    args.update(overrides)
    return build_user_notifications(**args)


def ids(notes):
    return {n["id"] for n in notes}


def test_fully_up_to_date_user_has_no_notifications():
    assert build() == []


# ---- routine ----

def test_no_adherence_logged_prompts_routine():
    assert "routine-today" in ids(build(adherence_today=None))


def test_neither_routine_done_prompts_routine():
    assert "routine-today" in ids(build(adherence_today=adherence(False, False)))


def test_morning_done_prompts_evening():
    notes = build(adherence_today=adherence(True, False))
    assert "routine-evening" in ids(notes)
    assert "routine-today" not in ids(notes)


def test_evening_done_prompts_morning():
    assert "routine-morning" in ids(build(adherence_today=adherence(False, True)))


def test_no_routine_means_no_routine_reminders():
    notes = build(has_routine=False, adherence_today=None)
    assert not any(n["type"] == "routine" for n in notes)


# ---- hydration ----

def test_no_water_logged_prompts_hydration():
    assert "hydration-today" in ids(build(hydration_liters_today=None))


def test_water_below_target_shows_progress():
    notes = build(hydration_liters_today=1.5)
    note = next(n for n in notes if n["id"] == "hydration-low")
    assert "1.5 L of 2.5 L" in note["message"]


def test_water_at_target_has_no_reminder():
    assert not any(n["type"] == "hydration" for n in build(hydration_liters_today=2.5))


# ---- sleep ----

def test_no_sleep_logged_prompts_sleep():
    assert "sleep-today" in ids(build(sleep_logged_today=False))


def test_low_sleep_average_is_a_warning():
    notes = build(recent_sleep_hours=[5.0, 5.5, 4.5])
    note = next(n for n in notes if n["id"] == "sleep-low")
    assert note["severity"] == "warning"
    assert "5.0 h" in note["message"]


def test_single_sleep_log_never_triggers_low_sleep_warning():
    assert "sleep-low" not in ids(build(recent_sleep_hours=[4.0]))


def test_healthy_sleep_has_no_warning():
    assert "sleep-low" not in ids(build(recent_sleep_hours=[7.0, 7.5]))


# ---- progress ----

def test_no_assessments_prompts_first_assessment():
    assert "assessment-first" in ids(build(assessments_newest_first=[]))


def test_stale_assessment_prompts_new_one():
    notes = build(assessments_newest_first=[assessment(80, days_ago=9)])
    note = next(n for n in notes if n["id"] == "assessment-stale")
    assert "9 days ago" in note["message"]


def test_recent_assessment_is_not_stale():
    assert "assessment-stale" not in ids(build(assessments_newest_first=[assessment(80, days_ago=6)]))


def test_score_drop_is_a_warning():
    notes = build(assessments_newest_first=[assessment(70, 1), assessment(80, 3)])
    note = next(n for n in notes if n["id"] == "score-down")
    assert note["severity"] == "warning"
    assert "10 points" in note["message"]


def test_score_gain_is_a_success():
    notes = build(assessments_newest_first=[assessment(85, 1), assessment(78, 3)])
    note = next(n for n in notes if n["id"] == "score-up")
    assert note["severity"] == "success"
    assert "7 points" in note["message"]


def test_small_score_change_is_ignored():
    notes = build(assessments_newest_first=[assessment(81, 1), assessment(80, 3)])
    assert not ids(notes) & {"score-up", "score-down"}


def test_single_assessment_has_no_change_alert():
    assert not ids(build(assessments_newest_first=[assessment(80, 1)])) & {"score-up", "score-down"}


# ---- ordering & shape ----

def test_warnings_come_before_info_before_success():
    notes = build(
        hydration_liters_today=None,                                   # info
        recent_sleep_hours=[4.0, 5.0],                                 # warning
        assessments_newest_first=[assessment(90, 1), assessment(80, 3)],  # success
    )
    severities = [n["severity"] for n in notes]
    assert severities == sorted(severities, key=lambda s: {"warning": 0, "info": 1, "success": 2}[s])
    assert severities[0] == "warning"
    assert severities[-1] == "success"


def test_every_notification_has_the_expected_fields():
    for n in build(adherence_today=None, hydration_liters_today=None, sleep_logged_today=False):
        assert set(n) == {"id", "type", "severity", "title", "message", "action_path"}


# ---- product replenishment ----

def in_use(name, started_days_ago, lasts_days):
    return SimpleNamespace(
        product_id=f"id-{name}",
        name=name,
        started_on=TODAY - timedelta(days=started_days_ago),
        lasts_days=lasts_days,
    )


def product_notes(notes):
    return [n for n in notes if n["type"] == "product"]


def test_no_products_means_no_product_notifications():
    assert product_notes(build(products_in_use=[])) == []
    assert product_notes(build()) == []


def test_product_with_plenty_left_has_no_reminder():
    assert product_notes(build(products_in_use=[in_use("Cleanser", 10, 60)])) == []


def test_product_with_seven_days_left_is_running_low():
    notes = product_notes(build(products_in_use=[in_use("Cleanser", 53, 60)]))
    assert len(notes) == 1
    assert notes[0]["severity"] == "info"
    assert notes[0]["id"] == "low-id-Cleanser"
    assert "7 days left" in notes[0]["message"]
    assert notes[0]["action_path"] == "/my-products"


def test_product_with_eight_days_left_has_no_reminder():
    assert product_notes(build(products_in_use=[in_use("Cleanser", 52, 60)])) == []


def test_one_day_left_uses_singular():
    note = product_notes(build(products_in_use=[in_use("Serum", 44, 45)]))[0]
    assert "1 day left" in note["message"]


def test_product_running_out_today_is_a_warning():
    note = product_notes(build(products_in_use=[in_use("Toner", 90, 90)]))[0]
    assert note["severity"] == "warning"
    assert note["id"] == "restock-id-Toner"
    assert "run out today" in note["message"]


def test_product_past_its_date_says_how_long_ago():
    note = product_notes(build(products_in_use=[in_use("Mask", 33, 30)]))[0]
    assert note["severity"] == "warning"
    assert "3 days ago" in note["message"]


def test_one_day_overdue_uses_singular():
    note = product_notes(build(products_in_use=[in_use("Mask", 31, 30)]))[0]
    assert "1 day ago" in note["message"]


def test_each_product_gets_its_own_reminder():
    notes = product_notes(build(products_in_use=[in_use("A", 55, 60), in_use("B", 40, 45)]))
    assert {n["id"] for n in notes} == {"low-id-A", "low-id-B"}


def test_restock_warning_sorts_before_low_info():
    notes = build(products_in_use=[in_use("Low", 55, 60), in_use("Empty", 70, 60)])
    product_ids = [n["id"] for n in notes if n["type"] == "product"]
    assert product_ids == ["restock-id-Empty", "low-id-Low"]