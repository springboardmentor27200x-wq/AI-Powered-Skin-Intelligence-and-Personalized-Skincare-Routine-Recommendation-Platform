from typing import List

from app.schemas.assessment import AssessmentInput, AssessmentResult

WEIGHTS = {
    "skin_condition_assessment": 0.35,
    "lifestyle_habits": 0.20,
    "sleep_quality": 0.15,
    "routine_consistency": 0.20,
    "hydration_level": 0.10,
}

CONCERN_PRIORITY = {
    "acne": 1,
    "redness": 2,
    "dark spots": 3,
    "hyperpigmentation": 3,
    "dry skin": 4,
    "dehydration": 4,
    "oily skin": 5,
    "sensitive skin": 6,
    "wrinkles": 7,
    "fine lines": 7,
    "uneven skin tone": 8,
    "flakiness": 9,
}

RECOMMENDATION_LIBRARY = {
    "acne": [
        "Salicylic acid cleanser for oil control",
        "Non-comedogenic moisturizer with niacinamide",
        "Daily SPF 30+ sunscreen to reduce post-acne marks",
    ],
    "redness": [
        "Barrier-supporting ceramide moisturizer",
        "Niacinamide serum to calm visible redness",
        "Fragrance-free, gentle routine to reduce irritation",
    ],
    "dark spots": [
        "Vitamin C serum for brightening",
        "Alpha arbutin or azelaic acid treatment",
        "Sunscreen to prevent pigment darkening",
    ],
    "hyperpigmentation": [
        "Vitamin C brightening serum",
        "Azelaic acid treatment for even tone",
        "Broad-spectrum sunscreen every morning",
    ],
    "dry skin": [
        "Cream cleanser with low foaming action",
        "Ceramide-rich moisturizer to support the barrier",
        "Hydrating serum with hyaluronic acid",
    ],
    "dehydration": [
        "Hydrating cleanser and lightweight humectant serum",
        "Moisture-binding serum with glycerin or hyaluronic acid",
        "Consistent hydration and water intake checks",
    ],
    "oily skin": [
        "Oil-control foaming cleanser",
        "Lightweight gel moisturizer",
        "Weekly salicylic acid treatment for clogged pores",
    ],
    "sensitive skin": [
        "Fragrance-free cleanser and moisturizer",
        "Simple minimal-ingredient routine",
        "Patch-test new active ingredients before full use",
    ],
    "wrinkles": [
        "Retinoid alternative or peptide serum",
        "Hydrating moisturizer to plump fine lines",
        "Night routine with barrier support",
    ],
    "fine lines": [
        "Peptide serum for smoothing",
        "Hydrating treatment to reduce surface dryness",
        "Consistent nightly skincare ritual",
    ],
    "uneven skin tone": [
        "Niacinamide serum for tone balancing",
        "Vitamin C treatment for brightness",
        "Consistent sunscreen use to protect results",
    ],
    "flakiness": [
        "Cream-based cleanser and gentle exfoliation",
        "Rich moisturizer with ceramides",
        "Avoid over-exfoliating or harsh scrubs",
    ],
}


def _normalize_text(value: str) -> str:
    return value.strip().lower().replace("_", " ")


def _normalize_score(value: float, minimum: float = 0.0, maximum: float = 100.0) -> float:
    return round(max(minimum, min(maximum, float(value))), 2)


def _sleep_score(value: str | None) -> float:
    mapping = {
        "poor": 45,
        "fair": 60,
        "good": 75,
        "excellent": 90,
    }
    return mapping.get((value or "fair").lower(), 65)


def _hydration_score(value: str | None) -> float:
    mapping = {
        "low": 45,
        "moderate": 70,
        "high": 88,
    }
    return mapping.get((value or "moderate").lower(), 70)


def _priority_concerns(concerns: List[str]) -> List[str]:
    if not concerns:
        return ["balanced skin maintenance"]

    normalized = []
    for concern in concerns:
        key = _normalize_text(concern)
        normalized.append((CONCERN_PRIORITY.get(key, 99), key))

    sorted_concerns = [name for _, name in sorted(normalized)]
    return sorted_concerns[:3]


def _build_recommendations(concerns: List[str], allergies: List[str], skin_type: str, budget: float | None) -> List[str]:
    concern_recommendations: List[str] = []
    for concern in _priority_concerns(concerns):
        for item in RECOMMENDATION_LIBRARY.get(concern, [f"Apply a targeted {concern} treatment plan"]):
            if item not in concern_recommendations:
                concern_recommendations.append(item)

    if allergies:
        allergy_text = ", ".join(sorted({a.strip() for a in allergies if a.strip()}))
        concern_recommendations.append(f"Avoid fragrance-heavy products and patch-test around known allergens: {allergy_text}.")

    if budget is not None and budget > 0:
        concern_recommendations.append(f"Keep the routine under an estimated budget of ${budget:.2f} per month.")

    if skin_type in {"dry", "sensitive"}:
        concern_recommendations.append("Choose a gentle, barrier-supportive routine with fewer active ingredients.")
    elif skin_type == "oily":
        concern_recommendations.append("Use lightweight, non-comedogenic formulas to support oil balance.")

    return concern_recommendations[:6]


def _build_routine(skin_type: str, concerns: List[str], allergies: List[str]) -> dict:
    concern_list = set(_normalize_text(c) for c in concerns)

    if "acne" in concern_list or skin_type == "oily":
        morning = [
            "Gentle salicylic acid cleanser",
            "Lightweight niacinamide serum",
            "Oil-free moisturizer",
            "Broad-spectrum SPF 30+ sunscreen",
        ]
    elif "dry skin" in concern_list or "dehydration" in concern_list or skin_type == "dry":
        morning = [
            "Cream cleanser",
            "Hyaluronic acid hydrating serum",
            "Ceramide-rich moisturizer",
            "Mineral SPF 30+ sunscreen",
        ]
    else:
        morning = [
            "Gentle balancing cleanser",
            "Vitamin C serum",
            "Hydrating moisturizer",
            "SPF 30+ sunscreen",
        ]

    if "acne" in concern_list or "redness" in concern_list:
        evening = [
            "Double cleanse if needed",
            "Targeted acne or calming treatment",
            "Barrier-supporting moisturizer",
            "Avoid harsh scrubs or over-exfoliation",
        ]
    elif "dry skin" in concern_list or "flakiness" in concern_list:
        evening = [
            "Cream cleanser",
            "Hydrating serum",
            "Rich moisturizer with ceramides",
            "Weekly hydrating mask",
        ]
    else:
        evening = [
            "Gentle cleanser",
            "Active treatment matched to skin goals",
            "Nourishing night cream",
            "Double-check any new ingredients against allergies",
        ]

    weekly = [
        "Use one targeted treatment 2-3 times per week based on concern severity.",
        "Keep a skin journal to track irritation, texture, and moisture balance.",
        "Review product labels to ensure no active ingredient conflicts with known allergies.",
    ]
    if allergies:
        weekly.append("Avoid all allergens in the schedule: " + ", ".join(sorted(set(allergies))))

    return {
        "morning": morning,
        "evening": evening,
        "weekly": weekly,
    }


def assess_user(data: AssessmentInput) -> AssessmentResult:
    """Rule-based skin assessment aligned to the project PDF's weighted scoring model."""
    skin_type = _normalize_text(data.skin_type)
    concerns = [_normalize_text(c) for c in data.concerns if c and c.strip()]
    allergies = [a.strip() for a in data.allergies if a and a.strip()]

    condition_score = 100.0
    if "acne" in concerns:
        condition_score -= 18
    if "redness" in concerns:
        condition_score -= 12
    if "hyperpigmentation" in concerns or "dark spots" in concerns:
        condition_score -= 10
    if "dry skin" in concerns or "dehydration" in concerns or "flakiness" in concerns:
        condition_score -= 12
    if "oily skin" in concerns:
        condition_score -= 10
    if "sensitive skin" in concerns:
        condition_score -= 16
    if "wrinkles" in concerns or "fine lines" in concerns:
        condition_score -= 8
    if "uneven skin tone" in concerns:
        condition_score -= 8
    if allergies:
        condition_score -= min(10, len(allergies) * 3)
    if skin_type == "dry":
        condition_score -= 4
    elif skin_type == "oily":
        condition_score -= 5
    if data.age and data.age > 45:
        condition_score -= 6

    lifestyle_score = data.lifestyle_score if data.lifestyle_score is not None else 72
    sleep_score = _sleep_score(data.sleep_quality)
    routine_score = data.routine_consistency if data.routine_consistency is not None else 70
    hydration_score = _hydration_score(data.hydration_level)

    breakdown = {
        "skin_condition_assessment": _normalize_score(condition_score),
        "lifestyle_habits": _normalize_score(lifestyle_score),
        "sleep_quality": _normalize_score(sleep_score),
        "routine_consistency": _normalize_score(routine_score),
        "hydration_level": _normalize_score(hydration_score),
    }

    final_score = sum(breakdown[key] * WEIGHTS[key] for key in WEIGHTS)
    final_score = _normalize_score(final_score)

    priority_concerns = _priority_concerns(concerns)
    recommendations = _build_recommendations(concerns, allergies, skin_type, data.budget)
    routine = _build_routine(skin_type, priority_concerns, allergies)

    if final_score >= 80:
        summary = "Your skin profile is in a stable range. Focus on consistency and barrier support to maintain the current balance."
    elif final_score >= 65:
        summary = "Your skin is doing reasonably well, but a few targeted treatments and better consistency will improve tone, hydration, and resilience."
    elif final_score >= 45:
        summary = "Your routine should be adjusted around your main concerns. Prioritize barrier care, hydration, and treatment consistency."
    else:
        summary = "Your current routine needs a more structured treatment plan. Start with gentle, non-irritating essentials and address the top skin concerns first."

    return AssessmentResult(
        score=final_score,
        breakdown=breakdown,
        priority_concerns=priority_concerns,
        recommendations=recommendations,
        routine=routine,
        summary=summary,
    )
