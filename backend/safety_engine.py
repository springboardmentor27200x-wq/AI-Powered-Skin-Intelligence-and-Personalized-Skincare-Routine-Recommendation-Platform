def normalize(value):
    if not value:
        return ""

    return str(value).strip().lower()


def parse_allergies(allergies):
    if not allergies:
        return []

    allergy_text = normalize(allergies)

    if allergy_text in ["no", "none", "no allergies"]:
        return []

    if allergy_text in ["not sure", "unknown"]:
        return ["unknown"]

    return [
        item.strip()
        for item in str(allergies).split(",")
        if item.strip()
    ]


ALLERGY_GROUPS = {
    "fragrance": [
        "fragrance",
        "parfum",
        "perfume"
    ],

    "essential oil": [
        "essential oil",
        "lavender oil",
        "tea tree oil",
        "peppermint oil",
        "eucalyptus oil"
    ],

    "alcohol": [
        "alcohol",
        "ethanol",
        "denatured alcohol"
    ],

    "preservative": [
        "preservative",
        "parabens",
        "phenoxyethanol"
    ],

    "latex": [
        "latex"
    ],

    "nickel": [
        "nickel",
        "metal"
    ]
}


def ingredient_matches_allergy(ingredient, allergy):
    ingredient_text = normalize(ingredient)
    allergy_text = normalize(allergy)

    if not allergy_text:
        return False

    # Unknown allergy should never be treated
    # as a confirmed ingredient conflict.
    if allergy_text == "unknown":
        return False

    # Direct match
    if allergy_text in ingredient_text:
        return True

    # Group match
    if allergy_text in ALLERGY_GROUPS:
        for item in ALLERGY_GROUPS[allergy_text]:
            if item in ingredient_text:
                return True

    return False


def check_ingredient_safety(
    ingredient,
    allergies="",
    sensitivity=""
):
    allergy_list = parse_allergies(allergies)

    # --------------------------------
    # 1. CONFIRMED ALLERGY CHECK
    # --------------------------------

    for allergy in allergy_list:

        if ingredient_matches_allergy(
            ingredient,
            allergy
        ):
            return {
                "ingredient": ingredient,
                "status": "AVOID",
                "reason": (
                    f"This ingredient may conflict "
                    f"with the reported allergy: {allergy}."
                )
            }

    # --------------------------------
    # 2. UNKNOWN ALLERGY STATUS
    # --------------------------------

    if "unknown" in allergy_list:
        return {
            "ingredient": ingredient,
            "status": "REVIEW",
            "reason": (
                "Allergy status is unknown. "
                "Check the complete product ingredient "
                "list before use."
            )
        }

    # --------------------------------
    # 3. SENSITIVITY CHECK
    # --------------------------------

    sensitivity_text = normalize(sensitivity)

    if sensitivity_text:

        if "fragrance" in sensitivity_text:

            if (
                "fragrance" in normalize(ingredient)
                or "parfum" in normalize(ingredient)
                or "perfume" in normalize(ingredient)
            ):
                return {
                    "ingredient": ingredient,
                    "status": "FLAGGED",
                    "reason": (
                        "Fragrance sensitivity was reported. "
                        "Avoid fragrance-containing products."
                    )
                }

        if "alcohol" in sensitivity_text:

            if (
                "alcohol" in normalize(ingredient)
                or "ethanol" in normalize(ingredient)
            ):
                return {
                    "ingredient": ingredient,
                    "status": "FLAGGED",
                    "reason": (
                        "Alcohol sensitivity was reported. "
                        "Check the complete ingredient list."
                    )
                }

        if "essential oil" in sensitivity_text:

            if "oil" in normalize(ingredient):
                return {
                    "ingredient": ingredient,
                    "status": "FLAGGED",
                    "reason": (
                        "Essential-oil sensitivity was reported. "
                        "Check the complete ingredient list."
                    )
                }

    # --------------------------------
    # 4. NO CONFLICT FOUND
    # --------------------------------

    return {
        "ingredient": ingredient,
        "status": "REVIEW",
        "reason": (
            "No matching reported allergy or sensitivity "
            "was found. This does not guarantee that the "
            "ingredient is safe for every individual."
        )
    }


def apply_safety_filter(
    recommendations,
    allergies="",
    sensitivity=""
):
    safe_recommendations = []
    flagged_recommendations = []
    avoided_recommendations = []

    for recommendation in recommendations:

        ingredient = recommendation["ingredient"]

        safety = check_ingredient_safety(
            ingredient=ingredient,
            allergies=allergies,
            sensitivity=sensitivity
        )

        recommendation_with_safety = {
            **recommendation,
            "safety_status": safety["status"],
            "safety_reason": safety["reason"]
        }

        if safety["status"] == "AVOID":

            avoided_recommendations.append(
                recommendation_with_safety
            )

        elif safety["status"] == "FLAGGED":

            flagged_recommendations.append(
                recommendation_with_safety
            )

        else:

            safe_recommendations.append(
                recommendation_with_safety
            )

    return {
        "safe": safe_recommendations,
        "flagged": flagged_recommendations,
        "avoid": avoided_recommendations
    }