"""How long a product lasts and when it's time to reorder.

We don't know a user's real usage pace, so each product gets a typical lifespan
for its category (the user can override it), counted from the day they started it.
"""
from datetime import date

REPLENISH_WARNING_DAYS = 7  # start reminding this many days before it runs out

# matched against the product category, lowercase, by substring
DEFAULT_LASTS_DAYS = {
    "face wash": 60,
    "moisturizer": 60,
    "sunscreen": 45,
    "serum": 45,
    "toner": 90,
    "treatment": 45,
    "mask": 30,
}
FALLBACK_LASTS_DAYS = 60


def default_lasts_days(category: str) -> int:
    lowered = (category or "").lower()
    for key, days in DEFAULT_LASTS_DAYS.items():
        if key in lowered:
            return days
    return FALLBACK_LASTS_DAYS


def days_remaining(started_on: date, lasts_days: int, today: date) -> int:
    """Negative once the product should already have run out."""
    return lasts_days - (today - started_on).days


def product_status(days_left: int) -> str:
    if days_left <= 0:
        return "empty"
    if days_left <= REPLENISH_WARNING_DAYS:
        return "low"
    return "ok"