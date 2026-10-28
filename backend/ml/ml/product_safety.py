import re
import pandas as pd


# Keywords used to identify potentially relevant
# allergy/sensitivity groups in product ingredient text.
ALLERGY_KEYWORDS = {
    "fragrance": [
        "fragrance",
        "parfum",
        "perfume",
        "aroma",
    ],

    "essential oils": [
        "essential oil",
        "lavender oil",
        "tea tree oil",
        "peppermint oil",
        "eucalyptus oil",
        "rosemary oil",
        "lemon oil",
        "orange oil",
        "bergamot oil",
        "citrus oil",
        "cinnamon oil",
        "clove oil",
    ],

    "alcohol": [
        "alcohol denat",
        "denatured alcohol",
        "ethanol",
        "ethyl alcohol",
        "isopropyl alcohol",
        "isopropanol",
    ],

    "preservatives": [
        "paraben",
        "methylparaben",
        "propylparaben",
        "butylparaben",
        "phenoxyethanol",
        "benzyl alcohol",
        "sodium benzoate",
        "potassium sorbate",
    ],

    "latex": [
        "latex",
        "rubber latex",
    ],

    "nickel / metals": [
        "nickel",
        "cobalt",
        "chromium",
    ],
}


def normalize_text(value):
    """Convert a value into normalized searchable text."""

    if pd.isna(value):
        return ""

    text = str(value).lower()

    text = text.replace("/", " ")
    text = text.replace("-", " ")

    text = re.sub(r"\s+", " ", text)

    return text.strip()


def parse_allergies(allergies):
    """
    Convert the user's stored allergy string into
    normalized allergy groups.

    Example:
        "Fragrance, Alcohol"
        →
        ["fragrance", "alcohol"]
    """

    if not allergies:
        return []

    if allergies.strip().lower() in [
        "no",
        "not sure",
    ]:
        return []

    return [
        item.strip().lower()
        for item in allergies.split(",")
        if item.strip()
    ]


def get_product_ingredient_text(row):
    """
    Combine ingredient-related product information.
    """

    fields = [
        row.get("ingredients", ""),
        row.get("highlights", ""),
        row.get("product_name", ""),
    ]

    return " ".join(
        normalize_text(value)
        for value in fields
    )


def detect_product_risks(product_text, allergies):
    """
    Detect potential conflicts between a product's
    ingredient text and the user's declared allergies.

    Returns:
        status
        matched risks
    """

    text = normalize_text(product_text)

    parsed_allergies = parse_allergies(allergies)

    matched_risks = []

    for allergy in parsed_allergies:

        keywords = ALLERGY_KEYWORDS.get(
            allergy,
            []
        )

        for keyword in keywords:

            if normalize_text(keyword) in text:

                matched_risks.append({
                    "allergy": allergy,
                    "matched_keyword": keyword,
                })

    # Remove duplicate matches
    unique_matches = []

    seen = set()

    for match in matched_risks:

        key = (
            match["allergy"],
            match["matched_keyword"]
        )

        if key not in seen:

            seen.add(key)
            unique_matches.append(match)

    if unique_matches:
        status = "AVOID"
    else:
        status = "CLEAR"

    return {
        "status": status,
        "matched_risks": unique_matches,
    }


def apply_product_safety_filter(
    df,
    allergies=""
):
    """
    Apply allergy-based safety filtering to products.

    Products containing detected allergy-related
    keywords are removed from the final recommendation
    pool.

    Note:
    This is a conservative keyword-based safety layer,
    not a medical safety guarantee.
    """

    result = df.copy()

    statuses = []
    risks = []

    for _, row in result.iterrows():

        product_text = get_product_ingredient_text(
            row
        )

        safety = detect_product_risks(
            product_text,
            allergies
        )

        statuses.append(
            safety["status"]
        )

        risks.append(
            safety["matched_risks"]
        )

    result["safety_status"] = statuses
    result["safety_risks"] = risks

    # Only CLEAR products continue to recommendations.
    safe_products = result[
        result["safety_status"] == "CLEAR"
    ].copy()

    return safe_products


if __name__ == "__main__":

    # Simple standalone test
    test_product = pd.Series({
        "product_name": "Example Vitamin C Serum",
        "ingredients": (
            "Water, Vitamin C, "
            "Fragrance, Glycerin"
        ),
        "highlights": "",
    })

    text = get_product_ingredient_text(
        test_product
    )

    result = detect_product_risks(
        text,
        "Fragrance"
    )

    print("\nProduct safety test:")
    print(result)