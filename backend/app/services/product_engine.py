"""Product Recommendation Engine — personalized suitability scoring,
reusing the same ingredient suitability logic from Ingredient
Intelligence so a product containing an ingredient you're allergic to
is genuinely flagged, not just skin-type matched.
"""

# concern -> the ingredient category most relevant to treating it
CONCERN_TO_CATEGORY = {
    "acne": "Salicylic Acid",
    "oily skin": "Niacinamide",
    "dry skin": "Hyaluronic Acid",
    "sensitive skin": "Ceramides",
    "hyperpigmentation": "Vitamin C",
    "dark spots": "Niacinamide",
    "wrinkles": "Retinoids",
    "fine lines": "Peptides",
    "redness": "Ceramides",
    "uneven skin tone": "AHAs/BHAs",
}


def _normalize(name: str) -> str:
    return name.strip().lower().replace("_", " ").replace("-", " ")


def _clamp(value: float) -> int:
    return max(0, min(100, round(value)))


def score_product(
    skin_types: list[str],
    ingredient_names_and_categories: list[tuple[str, str]],
    ingredient_statuses: dict[str, str],
    user_skin_type: str,
    prioritized_concerns: list[str],
) -> tuple[int, list[str]]:
    """
    ingredient_names_and_categories: [(ingredient_name, category), ...] for this product
    ingredient_statuses: {ingredient_name: "avoid"|"caution"|"suitable"} for this user
    """
    score = 100
    reasons: list[str] = []

    if skin_types:
        if user_skin_type in skin_types:
            reasons.append(f"Formulated for {user_skin_type} skin.")
        else:
            score -= 15
            reasons.append(f"Not typically formulated for {user_skin_type} skin.")

    for name, _category in ingredient_names_and_categories:
        status = ingredient_statuses.get(name, "suitable")
        if status == "avoid":
            score -= 40
            reasons.append(f"Contains {name}, which conflicts with your allergies.")
        elif status == "caution":
            score -= 10
            reasons.append(f"Contains {name} — use with caution based on your profile.")

    concern_categories = set()
    for c in prioritized_concerns[:3]:
        cat = CONCERN_TO_CATEGORY.get(_normalize(c))
        if cat:
            concern_categories.add(cat)
    product_categories = {cat for _, cat in ingredient_names_and_categories}
    if concern_categories & product_categories:
        score += 15
        reasons.append("Contains an ingredient that targets one of your priority concerns.")

    if not reasons:
        reasons.append("No specific concerns or benefits identified for your profile.")

    return _clamp(score), reasons