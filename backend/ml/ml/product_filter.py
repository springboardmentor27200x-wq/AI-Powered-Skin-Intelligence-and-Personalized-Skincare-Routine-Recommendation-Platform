import re
import pandas as pd


# Categories that are relevant to the skincare products
# required by SkinSense.
ALLOWED_SECONDARY_CATEGORIES = {
    "Moisturizers",
    "Treatments",
    "Cleansers",
    "Sunscreen",
    "Masks",
}

# Categories that should not enter the recommendation pool.
EXCLUDED_SECONDARY_CATEGORIES = {
    "Value & Gift Sets",
    "High Tech Tools",
    "Wellness",
    "Self Tanners",
    "Lip Balms & Treatments",
}


# Concern → product/ingredient keywords.
# This is a deterministic relevance layer, NOT a medical diagnosis.
CONCERN_KEYWORDS = {
    "Acne": [
        "acne",
        "blemish",
        "breakout",
        "pore",
        "salicylic",
        "bha",
        "niacinamide",
        "clarifying",
        "oil control",
    ],
    "Dark Spots": [
        "dark spot",
        "dark spots",
        "spot correct",
        "discoloration",
        "brightening",
        "vitamin c",
        "niacinamide",
        "tranexamic",
        "alpha arbutin",
        "licorice",
    ],
    "Hyperpigmentation": [
        "hyperpigmentation",
        "discoloration",
        "dark spot",
        "brightening",
        "vitamin c",
        "niacinamide",
        "tranexamic",
        "alpha arbutin",
        "azelaic",
    ],
    "Redness": [
        "redness",
        "calming",
        "soothing",
        "sensitive",
        "centella",
        "cica",
        "azelaic",
        "barrier",
        "oat",
        "allantoin",
    ],
    "Fine Lines": [
        "fine line",
        "fine lines",
        "wrinkle",
        "retinol",
        "retinoid",
        "peptide",
        "anti-aging",
        "collagen",
    ],
    "Uneven Skin Tone": [
        "uneven tone",
        "brightening",
        "vitamin c",
        "niacinamide",
        "exfoliating",
        "aha",
        "alpha hydroxy",
        "discoloration",
    ],
}


def normalize_text(value):
    """Convert any value into normalized searchable text."""
    if pd.isna(value):
        return ""

    text = str(value).lower()

    # Normalize common separators.
    text = text.replace("/", " ")
    text = text.replace("-", " ")
    text = re.sub(r"\s+", " ", text)

    return text.strip()


def build_search_text(row):
    """
    Combine fields that describe what the product is
    and what it may be useful for.
    """
    fields = [
        row.get("product_name", ""),
        row.get("secondary_category", ""),
        row.get("tertiary_category", ""),
        row.get("highlights", ""),
        row.get("ingredients", ""),
    ]

    return " ".join(normalize_text(value) for value in fields)


def is_eligible_product(row):
    """
    Decide whether a product belongs in SkinSense's
    recommendation pool.
    """

    secondary = normalize_text(row.get("secondary_category", ""))

    # Explicitly exclude unsuitable categories.
    if secondary in {
        normalize_text(category)
        for category in EXCLUDED_SECONDARY_CATEGORIES
    }:
        return False

    # Only allow categories relevant to our skincare use case.
    allowed = {
        normalize_text(category)
        for category in ALLOWED_SECONDARY_CATEGORIES
    }

    if secondary not in allowed:
        return False

    # Product must have ingredient information.
    ingredients = normalize_text(row.get("ingredients", ""))

    if not ingredients:
        return False

    return True


def filter_eligible_products(df):
    """
    Return only products suitable for the SkinSense
    recommendation pipeline.
    """

    mask = df.apply(is_eligible_product, axis=1)

    filtered = df[mask].copy()

    return filtered


def calculate_concern_relevance(product_text, concerns):
    """
    Calculate a simple 0-100 keyword relevance score.

    This is NOT a medical suitability score.
    It only measures whether product text contains
    terms associated with the user's selected concerns.
    """

    if not concerns:
        return 0.0

    text = normalize_text(product_text)

    matched_keywords = set()
    total_possible = 0

    for concern in concerns:
        keywords = CONCERN_KEYWORDS.get(concern, [])

        if not keywords:
            continue

        total_possible += len(keywords)

        for keyword in keywords:
            keyword_normalized = normalize_text(keyword)

            if keyword_normalized in text:
                matched_keywords.add(keyword_normalized)

    if total_possible == 0:
        return 0.0

    # Cap at 100.
    score = (len(matched_keywords) / total_possible) * 100

    return round(min(score, 100), 2)


def add_concern_relevance(df, concerns):
    """
    Add concern_relevance_score to every product.
    """

    result = df.copy()

    result["search_text"] = result.apply(build_search_text, axis=1)

    result["concern_relevance_score"] = result["search_text"].apply(
        lambda text: calculate_concern_relevance(
            text,
            concerns
        )
    )

    return result


def deduplicate_products(df):
    """
    Remove duplicate product names.

    This prevents multiple variants of the same product
    from filling the recommendation list.
    """

    result = df.copy()

    result["product_name_normalized"] = (
        result["product_name"]
        .fillna("")
        .astype(str)
        .str.lower()
        .str.strip()
    )

    result = result.drop_duplicates(
        subset=["product_name_normalized"],
        keep="first"
    )

    return result.drop(
        columns=["product_name_normalized"],
        errors="ignore"
    )


def prepare_product_pool(df, concerns=None):
    """
    Complete preprocessing pipeline:

    1. Eligibility filtering
    2. Concern relevance
    3. Product deduplication
    """

    if concerns is None:
        concerns = []

    result = filter_eligible_products(df)

    result = add_concern_relevance(
        result,
        concerns
    )

    result = deduplicate_products(result)

    return result


if __name__ == "__main__":
    print("Product filter module loaded successfully.")