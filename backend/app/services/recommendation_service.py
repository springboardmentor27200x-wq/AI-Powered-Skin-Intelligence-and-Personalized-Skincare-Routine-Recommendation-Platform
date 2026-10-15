from typing import List

from app.schemas.recommendations import (
    IngredientAnalysisInput,
    IngredientAnalysisResult,
    IngredientInteraction,
    ProductRecommendationInput,
    ProductRecommendationResult,
)

INGREDIENT_LIBRARY = {
    "niacinamide": {
        "good_for": ["acne", "redness", "dark spots", "hyperpigmentation", "uneven skin tone", "oily"],
        "compatible_with": ["dry", "oily", "combination", "sensitive"],
    },
    "salicylic acid": {
        "good_for": ["acne", "oily skin", "clogged pores"],
        "compatible_with": ["oily", "combination"],
    },
    "hyaluronic acid": {
        "good_for": ["dry skin", "dehydration", "flakiness"],
        "compatible_with": ["dry", "sensitive", "combination"],
    },
    "ceramides": {
        "good_for": ["dry skin", "sensitive skin", "barrier repair"],
        "compatible_with": ["dry", "sensitive"],
    },
    "retinol": {
        "good_for": ["wrinkles", "fine lines", "uneven skin tone"],
        "compatible_with": ["normal", "dry", "oily"],
    },
    "vitamin c": {
        "good_for": ["dark spots", "hyperpigmentation", "uneven skin tone", "redness"],
        "compatible_with": ["normal", "combination", "oily"],
    },
    "azelaic acid": {
        "good_for": ["redness", "hyperpigmentation", "acne"],
        "compatible_with": ["sensitive", "combination"],
    },
    "fragrance": {
        "good_for": [],
        "compatible_with": [],
    },
    "glycolic acid": {"good_for": ["texture", "uneven skin tone"], "compatible_with": ["normal", "oily", "combination"]},
    "lactic acid": {"good_for": ["texture", "dry skin", "uneven skin tone"], "compatible_with": ["normal", "dry", "combination"]},
    "benzoyl peroxide": {"good_for": ["acne"], "compatible_with": ["oily", "combination"]},
    "peptides": {"good_for": ["fine lines", "wrinkles"], "compatible_with": ["normal", "dry", "oily", "combination", "sensitive"]},
}

INTERACTION_RULES = [
    ({"retinol", "salicylic acid"}, "moderate", "Use these on separate nights at first to reduce the chance of irritation."),
    ({"retinol", "glycolic acid"}, "moderate", "Alternate nights rather than layering until tolerance is established."),
    ({"retinol", "lactic acid"}, "moderate", "Alternate nights rather than layering until tolerance is established."),
    ({"retinol", "benzoyl peroxide"}, "moderate", "Use at different times of day or on alternate nights; formulations can increase irritation or reduce retinoid stability."),
    ({"benzoyl peroxide", "vitamin c"}, "caution", "Use at different times of day to reduce irritation and avoid potential formulation incompatibility."),
]

PRODUCT_CATALOG = [
    {
        "name": "ClearBalance Salicylic Cleanser",
        "category": "Face Wash",
        "price": 24,
        "matches": ["oily", "acne"],
        "ingredients": ["salicylic acid", "niacinamide"],
        "why": "Targets excess oil and clogged pores while supporting a calmer skin barrier.",
    },
    {
        "name": "HydraLock Ceramide Cream",
        "category": "Moisturizer",
        "price": 36,
        "matches": ["dry", "sensitive", "redness"],
        "ingredients": ["ceramides", "hyaluronic acid"],
        "why": "Strengthens the barrier and helps reduce dryness and irritation.",
    },
    {
        "name": "GlowBright Vitamin C Serum",
        "category": "Serum",
        "price": 42,
        "matches": ["dark spots", "hyperpigmentation", "uneven skin tone"],
        "ingredients": ["vitamin c", "niacinamide"],
        "why": "Brightens skin tone and supports a more even complexion.",
    },
    {
        "name": "CalmReset Barrier Serum",
        "category": "Serum",
        "price": 38,
        "matches": ["redness", "sensitive"],
        "ingredients": ["niacinamide", "azelaic acid"],
        "why": "Helps calm visible redness and supports a balanced, less reactive skin tone.",
    },
    {
        "name": "Night Renewal Retinol Cream",
        "category": "Treatment",
        "price": 58,
        "matches": ["wrinkles", "fine lines"],
        "ingredients": ["retinol", "ceramides"],
        "why": "Supports smooth texture and helps minimize fine lines with barrier support.",
    },
    {
        "name": "HydraMist Daily Gel",
        "category": "Moisturizer",
        "price": 29,
        "matches": ["oily", "combination"],
        "ingredients": ["hyaluronic acid", "niacinamide"],
        "why": "Lightweight hydration that supports oil balance without heaviness.",
    },
]


def _normalize(value: str) -> str:
    return value.strip().lower().replace("_", " ")


def _normalize_list(items: List[str]) -> List[str]:
    return [_normalize(item) for item in items if item and item.strip()]


def analyze_ingredients(payload: IngredientAnalysisInput) -> IngredientAnalysisResult:
    skin_type = _normalize(payload.skin_type)
    concerns = _normalize_list(payload.concerns)
    allergies = _normalize_list(payload.allergies)
    ingredients = _normalize_list(payload.ingredients)

    if not ingredients:
        return IngredientAnalysisResult(
            score=100.0,
            safe_ingredients=[],
            avoid_ingredients=[],
            neutral_ingredients=[],
            summary="No ingredients were supplied for analysis.",
        )

    safe: List[str] = []
    avoid: List[str] = []
    neutral: List[str] = []
    interactions = []

    for ingredient in ingredients:
        if ingredient in allergies or ingredient in {"fragrance", "essential oils", "sulfates", "alcohol"}:
            avoid.append(ingredient)
            continue

        library_entry = INGREDIENT_LIBRARY.get(ingredient)
        if not library_entry:
            neutral.append(ingredient)
            continue

        if library_entry.get("good_for"):
            if skin_type in library_entry.get("compatible_with", []) or any(concern in library_entry["good_for"] for concern in concerns):
                safe.append(ingredient)
            else:
                neutral.append(ingredient)
        else:
            neutral.append(ingredient)

    supplied = set(ingredients)
    for pair, severity, guidance in INTERACTION_RULES:
        if pair.issubset(supplied):
            interactions.append(IngredientInteraction(
                ingredients=sorted(pair),
                severity=severity,
                guidance=guidance,
            ))

    score = max(0.0, 100.0 - (25 * len(avoid)) - (10 * len(interactions)))
    summary = (
        f"This ingredient mix is {score:.0f}% suitable for {skin_type} skin with concerns in {', '.join(concerns) if concerns else 'general balance'}. "
        f"Safe ingredients include {', '.join(safe) if safe else 'no clear matches'}, while {', '.join(avoid) if avoid else 'no allergens'} should be avoided."
    )

    return IngredientAnalysisResult(
        score=round(score, 2),
        safe_ingredients=safe,
        avoid_ingredients=avoid,
        neutral_ingredients=neutral,
        interactions=interactions,
        summary=summary,
    )


def generate_product_recommendations(payload: ProductRecommendationInput) -> ProductRecommendationResult:
    skin_type = _normalize(payload.skin_type)
    concerns = _normalize_list(payload.concerns)
    allergies = _normalize_list(payload.allergies)
    budget = payload.budget if payload.budget is not None else 100.0

    scored: List[dict] = []
    for product in PRODUCT_CATALOG:
        product_ingredients = _normalize_list(product["ingredients"])
        if any(allergen == ingredient for allergen in allergies for ingredient in product_ingredients):
            continue
        if payload.budget is not None and product["price"] > budget:
            continue

        match_score = 50

        if skin_type in product["matches"]:
            match_score += 25
        else:
            for concern in concerns:
                if concern in product["matches"]:
                    match_score += 18
                    break

        for concern in concerns:
            if concern in product["matches"]:
                match_score += 12

        if product["price"] <= budget:
            match_score += 8

        if match_score <= 0:
            continue

        scored.append({
            "name": product["name"],
            "category": product["category"],
            "price": product["price"],
            "match_score": round(min(99.0, match_score), 2),
            "why": product["why"],
        })

    scored = sorted(scored, key=lambda item: item["match_score"], reverse=True)[:3]
    if scored:
        summary = (
            f"Top catalog matches for {skin_type} skin targeting {', '.join(concerns) if concerns else 'general balance'} "
            f"within a ${budget:.2f} budget. Known allergen matches were excluded."
        )
    else:
        summary = "No catalog products meet both the stated budget and known-allergen constraints."

    return ProductRecommendationResult(
        recommendations=scored,
        summary=summary,
    )
