"""Rule-based routine builder — maps skin type + prioritized concerns +
current season to a concrete set of morning/evening steps, each with a
frequency (daily, 2x_week, weekly). This is Milestone 2's "Personalized
Routine Generator", including weekly treatment planning, adaptive
updates, and seasonal recommendations. No specific product names here
(that's Milestone 3's product recommendation engine) — just step,
guidance, and how often to do it.

Season is defined by India's climate pattern (not the generic four-
season Western model), since that's the app's actual context:
  Summer  — March to June
  Monsoon — July to September
  Winter  — October to February
"""
from datetime import date

BASE_MORNING = [
    ("cleansing", "Gentle cleanser to remove overnight buildup", None, "daily"),
    ("moisturizing", "Lightweight moisturizer suited to your skin type", None, "daily"),
    ("sun_protection", "Broad-spectrum SPF 30+ sunscreen", None, "daily"),
]

BASE_EVENING = [
    ("cleansing", "Thorough cleanse to remove sunscreen, oil, and pollutants", None, "daily"),
    ("moisturizing", "Nourishing night moisturizer", None, "daily"),
]

SKIN_TYPE_NOTES = {
    "oily": {
        "cleansing": "Use a gel or foaming cleanser — avoid heavy, oil-based cleansers.",
        "moisturizing": "Choose an oil-free, gel-based moisturizer.",
    },
    "dry": {
        "cleansing": "Use a cream or hydrating cleanser — avoid foaming/stripping formulas.",
        "moisturizing": "Layer a richer, ceramide-based moisturizer.",
    },
    "sensitive": {
        "cleansing": "Use a fragrance-free, minimal-ingredient cleanser.",
        "moisturizing": "Patch-test new products; avoid fragrance and alcohol-based formulas.",
    },
    "combination": {
        "cleansing": "Balance is key — a gentle gel cleanser works across both oily and dry zones.",
        "moisturizing": "Consider a lighter gel on the T-zone and a richer cream on drier areas.",
    },
    "normal": {},
}

def _normalize_concern(name: str) -> str:
    return name.strip().lower().replace("_", " ").replace("-", " ")


CONCERN_STEPS = {
    "acne": [("evening", "treatment", "Apply a salicylic acid or benzoyl peroxide spot treatment", "Targets active breakouts", "daily")],
    "oily skin": [("morning", "treatment", "Use a lightweight, oil-controlling toner", "Helps manage excess oil through the day", "daily")],
    "dry skin": [("evening", "treatment", "Apply a hyaluronic acid serum before moisturizer", "Boosts hydration retention overnight", "daily")],
    "sensitive skin": [("evening", "treatment", "Use a soothing, fragrance-free serum (e.g. centella or panthenol)", "Calms irritation", "daily")],
    "hyperpigmentation": [("morning", "treatment", "Apply a vitamin C serum before moisturizer and sunscreen", "Brightens and protects against further pigmentation", "daily")],
    "dark spots": [("evening", "treatment", "Use a niacinamide serum", "Helps fade dark spots over time", "daily")],
    "wrinkles": [("evening", "treatment", "Apply a retinoid", "Supports collagen and reduces fine lines — start slow", "2x_week")],
    "fine lines": [("evening", "treatment", "Apply a peptide-based serum", "Supports skin firmness", "daily")],
    "redness": [("evening", "treatment", "Use a soothing serum with centella asiatica or azelaic acid", "Reduces visible redness", "daily")],
    "uneven skin tone": [("evening", "exfoliation", "Use a gentle AHA exfoliant", "Promotes even skin tone over time — not a daily step", "2x_week")],
}

SKIN_TYPE_WEEKLY_TREATMENTS = {
    "oily": [("evening", "treatment", "Use a clay or charcoal mask", "Helps draw out excess oil and unclog pores", "weekly")],
    "dry": [("evening", "treatment", "Use a hydrating overnight mask", "Extra moisture replenishment", "weekly")],
    "combination": [("evening", "treatment", "Use a clay mask on the T-zone only", "Balances oil without over-drying other areas", "weekly")],
    "sensitive": [("evening", "treatment", "Use a calming, fragrance-free mask", "Extra soothing without introducing new irritants", "weekly")],
    "normal": [("evening", "treatment", "Use a hydrating or brightening mask", "General weekly skin maintenance", "weekly")],
}

# Seasonal adjustments, based on India's climate pattern.
SEASONAL_STEPS = {
    "summer": [
        ("morning", "sun_protection", "Reapply sunscreen every 3–4 hours if outdoors", "Summer sun is more intense and prolonged", "daily"),
    ],
    "monsoon": [
        ("evening", "moisturizing", "Follow with a light, oil-free, non-comedogenic moisturizer", "Humidity raises breakout risk during monsoon", "daily"),
    ],
    "winter": [
        ("evening", "moisturizing", "Layer a richer, occlusive moisturizer or facial oil", "Cold, dry air strips moisture faster in winter", "daily"),
    ],
}


def get_current_season(today: date | None = None) -> str:
    month = (today or date.today()).month
    if month in (3, 4, 5, 6):
        return "summer"
    if month in (7, 8, 9):
        return "monsoon"
    return "winter"  # 10, 11, 12, 1, 2


def generate_routine_steps(skin_type: str, prioritized_concerns: list[str], season: str | None = None) -> list[dict]:
    """Returns a flat list of step dicts: time_of_day, category, instruction, reason, frequency."""
    steps: list[dict] = []
    type_notes = SKIN_TYPE_NOTES.get(skin_type, {})
    season = season or get_current_season()

    for category, instruction, reason, frequency in BASE_MORNING:
        note = type_notes.get(category)
        steps.append({
            "time_of_day": "morning", "category": category,
            "instruction": note or instruction, "reason": reason, "frequency": frequency,
        })

    for category, instruction, reason, frequency in BASE_EVENING:
        note = type_notes.get(category)
        steps.append({
            "time_of_day": "evening", "category": category,
            "instruction": note or instruction, "reason": reason, "frequency": frequency,
        })

    for concern in prioritized_concerns[:3]:
        key = _normalize_concern(concern)
        for time_of_day, category, instruction, reason, frequency in CONCERN_STEPS.get(key, []):
            steps.append({
                "time_of_day": time_of_day, "category": category,
                "instruction": instruction, "reason": reason, "frequency": frequency,
            })

    weekly = SKIN_TYPE_WEEKLY_TREATMENTS.get(skin_type)
    if weekly:
        for time_of_day, category, instruction, reason, frequency in weekly:
            steps.append({
                "time_of_day": time_of_day, "category": category,
                "instruction": instruction, "reason": reason, "frequency": frequency,
            })

    for time_of_day, category, instruction, reason, frequency in SEASONAL_STEPS.get(season, []):
        steps.append({
            "time_of_day": time_of_day, "category": category,
            "instruction": instruction, "reason": reason, "frequency": frequency,
        })

    morning_i, evening_i = 0, 0
    for step in steps:
        if step["time_of_day"] == "morning":
            morning_i += 1
            step["step_order"] = morning_i
        else:
            evening_i += 1
            step["step_order"] = evening_i

    return steps


def upsert_routine_for_assessment(db, user_id, skin_type: str, assessment):
    """Creates or replaces the user's routine, tied to the assessment that
    produced it, and to the current season. Called automatically whenever
    a new assessment runs, so the routine adapts to the latest score and
    the current time of year without a separate manual step."""
    from app.models.routine import Routine, RoutineStep

    season = get_current_season()

    routine = db.query(Routine).filter(Routine.user_id == user_id).first()
    if routine:
        db.query(RoutineStep).filter(RoutineStep.routine_id == routine.id).delete()
        routine.based_on_assessment_id = assessment.id
        routine.season = season
    else:
        routine = Routine(user_id=user_id, based_on_assessment_id=assessment.id, season=season)
        db.add(routine)
    db.flush()

    step_dicts = generate_routine_steps(skin_type, assessment.prioritized_concerns, season)
    steps = [RoutineStep(routine_id=routine.id, **sd) for sd in step_dicts]
    db.add_all(steps)
    db.flush()

    return routine, steps