from datetime import date

from app.services.product_usage import (
    days_remaining, default_lasts_days, product_status, REPLENISH_WARNING_DAYS, FALLBACK_LASTS_DAYS,
)


def test_default_lifespans_by_category():
    assert default_lasts_days("Face Wash") == 60
    assert default_lasts_days("Moisturizer") == 60
    assert default_lasts_days("Sunscreen") == 45
    assert default_lasts_days("Serum") == 45
    assert default_lasts_days("Toner") == 90
    assert default_lasts_days("Face Masks") == 30


def test_treatment_category_matches_loosely():
    assert default_lasts_days("Treatment") == 45
    assert default_lasts_days("Treatment Products") == 45


def test_category_match_ignores_case():
    assert default_lasts_days("SUNSCREEN") == 45


def test_unknown_or_missing_category_uses_fallback():
    assert default_lasts_days("Perfume") == FALLBACK_LASTS_DAYS
    assert default_lasts_days("") == FALLBACK_LASTS_DAYS
    assert default_lasts_days(None) == FALLBACK_LASTS_DAYS


def test_days_remaining_counts_down_from_start():
    start = date(2026, 10, 1)
    assert days_remaining(start, 60, date(2026, 10, 1)) == 60
    assert days_remaining(start, 60, date(2026, 10, 11)) == 50


def test_days_remaining_goes_negative_after_running_out():
    assert days_remaining(date(2026, 8, 1), 30, date(2026, 10, 1)) < 0


def test_status_boundaries():
    assert product_status(REPLENISH_WARNING_DAYS + 1) == "ok"
    assert product_status(REPLENISH_WARNING_DAYS) == "low"
    assert product_status(1) == "low"
    assert product_status(0) == "empty"
    assert product_status(-5) == "empty"