"""Ingredient Intelligence — suitability assessment, interaction
analysis, and allergy detection. Rule-based: every flag traces back to
either an exact match against the user's stated allergies/sensitivities,
or a named dermatological caution for a skin type — nothing guessed.
"""

# category -> skin types where extra caution applies, with why
SKIN_TYPE_CAUTIONS = {
    "Retinoids": {
        "sensitive": "Retinoids can irritate sensitive skin — patch test and start with lower frequency.",
        "dry": "Retinoids can increase dryness — pair with a richer moisturizer.",
    },
    "AHAs/BHAs": {
        "sensitive": "Exfoliating acids can irritate sensitive skin — start with once a week.",
        "dry": "Can be drying with frequent use — limit to 2-3 times a week.",
    },
    "Vitamin C": {
        "sensitive": "High-strength vitamin C can sting sensitive skin — look for a lower concentration.",
    },
    "Salicylic Acid": {
        "dry": "Can be drying with overuse — balance with a hydrating moisturizer.",
    },
}


def _text_mentions(haystack_list: list[str], needle: str) -> bool:
    needle_lower = needle.lower()
    return any(needle_lower in item.lower() or item.lower() in needle_lower for item in haystack_list)


def assess_ingredient_suitability(
    ingredient, allergies: list[str], sensitivities: list[str], skin_type: str
) -> tuple[str, list[str]]:
    """Returns (status, reasons). status is 'avoid', 'caution', or 'suitable'."""
    reasons: list[str] = []
    status = "suitable"

    # Allergy detection — exact/substring match against stated allergies is a hard "avoid"
    if _text_mentions(allergies, ingredient.name) or _text_mentions(allergies, ingredient.category):
        status = "avoid"
        reasons.append(f"Listed in your stated allergies.")

    # Sensitivity match — downgrade to caution unless already avoid
    if _text_mentions(sensitivities, ingredient.name) or _text_mentions(sensitivities, ingredient.category):
        if status != "avoid":
            status = "caution"
        reasons.append("Listed in your stated sensitivities.")

    # Skin-type-specific dermatological caution
    type_notes = SKIN_TYPE_CAUTIONS.get(ingredient.category, {})
    note = type_notes.get(skin_type)
    if note:
        if status == "suitable":
            status = "caution"
        reasons.append(note)

    if status == "suitable":
        reasons.append("No known conflicts with your profile.")

    return status, reasons