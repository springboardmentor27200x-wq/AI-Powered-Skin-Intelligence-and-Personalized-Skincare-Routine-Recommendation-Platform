# Product Recommendation Engine


PRODUCTS = [
    {
        "name": "Gentle Face Wash",
        "category": "Face Wash",
        "price": 299,
        "suitable_for": ["Dry Skin", "Sensitive Skin", "Acne"],
        "ingredients": ["Ceramides", "Niacinamide"]
    },
    {
        "name": "Oil Control Face Wash",
        "category": "Face Wash",
        "price": 349,
        "suitable_for": ["Oily Skin", "Acne"],
        "ingredients": ["Salicylic Acid", "Niacinamide"]
    },
    {
        "name": "Hydrating Moisturizer",
        "category": "Moisturizer",
        "price": 399,
        "suitable_for": ["Dry Skin", "Sensitive Skin"],
        "ingredients": ["Hyaluronic Acid", "Ceramides"]
    },
    {
        "name": "Light Gel Moisturizer",
        "category": "Moisturizer",
        "price": 349,
        "suitable_for": ["Oily Skin", "Acne"],
        "ingredients": ["Niacinamide", "Hyaluronic Acid"]
    },
    {
        "name": "Daily Sunscreen SPF 50",
        "category": "Sunscreen",
        "price": 499,
        "suitable_for": [
            "Acne",
            "Oily Skin",
            "Dry Skin",
            "Sensitive Skin",
            "Dark Spots"
        ],
        "ingredients": ["Niacinamide"]
    },
    {
        "name": "Vitamin C Brightening Serum",
        "category": "Serum",
        "price": 599,
        "suitable_for": [
            "Dark Spots",
            "Hyperpigmentation",
            "Uneven Skin Tone"
        ],
        "ingredients": ["Vitamin C"]
    },
    {
        "name": "Niacinamide Serum",
        "category": "Serum",
        "price": 449,
        "suitable_for": [
            "Acne",
            "Oily Skin",
            "Uneven Skin Tone"
        ],
        "ingredients": ["Niacinamide"]
    },
    {
        "name": "Hydrating Toner",
        "category": "Toner",
        "price": 299,
        "suitable_for": ["Dry Skin", "Sensitive Skin"],
        "ingredients": ["Hyaluronic Acid"]
    },
    {
        "name": "Salicylic Acid Treatment",
        "category": "Treatment Products",
        "price": 549,
        "suitable_for": ["Acne", "Oily Skin"],
        "ingredients": ["Salicylic Acid"]
    },
    {
        "name": "Ceramide Repair Mask",
        "category": "Face Masks",
        "price": 399,
        "suitable_for": ["Dry Skin", "Sensitive Skin"],
        "ingredients": ["Ceramides"]
    }
]


def calculate_suitability(product, skin_type, skin_concerns, sensitivity):

    concerns = [
        concern.strip().lower()
        for concern in skin_concerns.split(",")
        if concern.strip()
    ]

    score = 50

    # Skin type matching
    if skin_type.lower() in [
        item.lower() for item in product["suitable_for"]
    ]:
        score += 20

    # Concern matching
    for concern in product["suitable_for"]:
        if concern.lower() in concerns:
            score += 10

    # Sensitive skin caution
    if sensitivity.lower() == "high":
        strong_ingredients = [
            "Salicylic Acid",
            "Vitamin C"
        ]

        if any(
            ingredient in strong_ingredients
            for ingredient in product["ingredients"]
        ):
            score -= 10

    score = max(0, min(100, score))

    return score


def recommend_products(
    skin_type,
    skin_concerns,
    sensitivity,
    budget
):

    recommendations = []

    for product in PRODUCTS:

        if product["price"] > budget:
            continue

        score = calculate_suitability(
            product,
            skin_type,
            skin_concerns,
            sensitivity
        )

        if score >= 60:
            recommendations.append({
                "name": product["name"],
                "category": product["category"],
                "price": product["price"],
                "suitability_score": score,
                "ingredients": product["ingredients"]
            })

    recommendations.sort(
        key=lambda item: item["suitability_score"],
        reverse=True
    )

    return recommendations


def compare_products(product_names):

    selected_products = []

    for product in PRODUCTS:

        if product["name"].lower() in [
            name.lower() for name in product_names
        ]:
            selected_products.append({
                "name": product["name"],
                "category": product["category"],
                "price": product["price"],
                "ingredients": product["ingredients"],
                "suitable_for": product["suitable_for"]
            })

    return selected_products


def suggest_alternatives(
    category,
    budget
):

    alternatives = []

    for product in PRODUCTS:

        if (
            product["category"].lower() == category.lower()
            and product["price"] <= budget
        ):
            alternatives.append({
                "name": product["name"],
                "price": product["price"],
                "category": product["category"],
                "ingredients": product["ingredients"]
            })

    return alternatives