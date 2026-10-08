# Ingredient Intelligence Engine


INGREDIENTS = {
    "retinoids": {
        "category": "Retinoids",
        "benefits": [
            "Supports skin renewal",
            "Helps with fine lines",
            "Helps improve acne"
        ],
        "suitable_for": [
            "Acne",
            "Wrinkles",
            "Fine Lines"
        ],
        "sensitivity": "High",
        "education": "Retinoids are active skincare ingredients that support skin renewal. Beginners should use them carefully."
    },

    "niacinamide": {
        "category": "Niacinamide",
        "benefits": [
            "Supports skin barrier",
            "Helps control excess oil",
            "Helps improve uneven skin tone"
        ],
        "suitable_for": [
            "Oily Skin",
            "Acne",
            "Uneven Skin Tone",
            "Sensitive Skin"
        ],
        "sensitivity": "Low",
        "education": "Niacinamide is a versatile ingredient commonly used for oil control, skin barrier support and uneven skin tone."
    },

    "vitamin c": {
        "category": "Vitamin C",
        "benefits": [
            "Antioxidant support",
            "Helps improve uneven skin tone",
            "Helps with dark spots"
        ],
        "suitable_for": [
            "Dark Spots",
            "Hyperpigmentation",
            "Uneven Skin Tone"
        ],
        "sensitivity": "Medium",
        "education": "Vitamin C is an antioxidant ingredient commonly used for skin brightness and uneven skin tone."
    },

    "hyaluronic acid": {
        "category": "Hyaluronic Acid",
        "benefits": [
            "Supports skin hydration",
            "Helps reduce dryness"
        ],
        "suitable_for": [
            "Dry Skin",
            "Sensitive Skin"
        ],
        "sensitivity": "Low",
        "education": "Hyaluronic Acid is a hydrating ingredient that helps the skin retain moisture."
    },

    "salicylic acid": {
        "category": "Salicylic Acid",
        "benefits": [
            "Helps unclog pores",
            "Helps manage excess oil",
            "Supports acne care"
        ],
        "suitable_for": [
            "Acne",
            "Oily Skin"
        ],
        "sensitivity": "Medium",
        "education": "Salicylic Acid is a beta hydroxy acid commonly used for oily and acne-prone skin."
    },

    "ceramides": {
        "category": "Ceramides",
        "benefits": [
            "Supports skin barrier",
            "Helps reduce dryness"
        ],
        "suitable_for": [
            "Dry Skin",
            "Sensitive Skin"
        ],
        "sensitivity": "Low",
        "education": "Ceramides are skin-barrier supporting ingredients that help maintain moisture."
    },

    "peptides": {
        "category": "Peptides",
        "benefits": [
            "Supports skin structure",
            "Helps improve appearance of fine lines"
        ],
        "suitable_for": [
            "Wrinkles",
            "Fine Lines"
        ],
        "sensitivity": "Low",
        "education": "Peptides are short chains of amino acids commonly used in skincare formulations."
    },

    "ahas/bhas": {
        "category": "AHAs/BHAs",
        "benefits": [
            "Supports exfoliation",
            "Helps improve uneven skin texture"
        ],
        "suitable_for": [
            "Acne",
            "Uneven Skin Tone",
            "Dark Spots"
        ],
        "sensitivity": "High",
        "education": "AHAs and BHAs are exfoliating ingredients. They should be introduced carefully, especially for sensitive skin."
    }
}


def analyze_ingredient(
    ingredient: str,
    skin_type: str,
    skin_concerns: str,
    sensitivity: str,
    allergies: str = ""
):

    ingredient_key = ingredient.lower().strip()

    # Find ingredient
    data = INGREDIENTS.get(ingredient_key)

    if not data:
        return {
            "ingredient": ingredient,
            "found": False,
            "message": "Ingredient information not available in the current intelligence database."
        }

    concerns = [
        concern.strip().lower()
        for concern in skin_concerns.split(",")
        if concern.strip()
    ]

    allergy_list = [
        allergy.strip().lower()
        for allergy in allergies.split(",")
        if allergy.strip()
    ]

    suitable = False

    for concern in data["suitable_for"]:
        if concern.lower() in concerns:
            suitable = True
            break

    warnings = []

    # Sensitivity warning
    if sensitivity.lower() == "high" and data["sensitivity"] == "High":
        warnings.append(
            "This ingredient may be strong for highly sensitive skin."
        )

    # Allergy detection
    if ingredient_key in allergy_list:
        warnings.append(
            "This ingredient is listed in the user's allergy information."
        )

    # Interaction analysis
    interactions = []

    if ingredient_key == "retinoids":
        interactions.append(
            "Use carefully with strong exfoliating acids such as AHAs/BHAs."
        )

    if ingredient_key == "vitamin c":
        interactions.append(
            "Avoid combining multiple strong active ingredients in the same routine without proper guidance."
        )

    if ingredient_key == "salicylic acid":
        interactions.append(
            "Use carefully with other strong exfoliating or active ingredients."
        )

    if ingredient_key == "ahas/bhas":
        interactions.append(
            "Avoid excessive use with other strong exfoliating or active ingredients."
        )

    return {
        "ingredient": data["category"],
        "found": True,
        "benefits": data["benefits"],
        "suitable": suitable,
        "suitable_for": data["suitable_for"],
        "sensitivity_level": data["sensitivity"],
        "warnings": warnings,
        "interactions": interactions,
        "education": data["education"]
    }