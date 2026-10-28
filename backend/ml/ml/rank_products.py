import os
import joblib
import pandas as pd

from product_filter import prepare_product_pool
from product_safety import apply_product_safety_filter


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "ml",
    "models",
    "product_recommendation_model.joblib"
)

PRODUCT_PATH = os.path.join(
    BASE_DIR,
    "ml",
    "data",
    "sephora",
    "product_info.csv"
)


def load_model():
    return joblib.load(MODEL_PATH)


def load_products():
    return pd.read_csv(PRODUCT_PATH)


def prepare_model_input(df, skin_type):
    """
    Prepare the exact feature names expected by the
    trained product recommendation model.
    """

    result = df.copy()

    result["ingredient_text"] = (
        result["ingredients"]
        .fillna("")
        .astype(str)
    )

    result["highlights_text"] = (
        result["highlights"]
        .fillna("")
        .astype(str)
    )

    result["skin_type"] = skin_type

    # Exact feature names used during training
    result["price"] = pd.to_numeric(
        result["price_usd"],
        errors="coerce"
    )

    result["product_rating"] = pd.to_numeric(
        result["rating"],
        errors="coerce"
    )

    result["review_count"] = pd.to_numeric(
        result["reviews"],
        errors="coerce"
    )

    # Fill missing numeric values
    result["price"] = result["price"].fillna(
        result["price"].median()
    )

    result["product_rating"] = (
        result["product_rating"].fillna(0)
    )

    result["review_count"] = (
        result["review_count"].fillna(0)
    )

    result["primary_category"] = (
        result["primary_category"]
        .fillna("Unknown")
        .astype(str)
    )

    result["secondary_category"] = (
        result["secondary_category"]
        .fillna("Unknown")
        .astype(str)
    )

    return result[
        [
            "ingredient_text",
            "highlights_text",
            "skin_type",
            "primary_category",
            "secondary_category",
            "price",
            "product_rating",
            "review_count",
        ]
    ]


def rank_products(
    skin_type,
    concerns,
    allergies="",
    top_n=10
):
    """
    Hybrid product ranking:

    1. Eligibility filter
    2. Allergy safety filter
    3. ML recommendation probability
    4. Concern relevance
    5. Hybrid ranking
    """

    model = load_model()
    products = load_products()

    # -----------------------------------------
    # STEP 1 — Eligibility + concern matching
    # -----------------------------------------

    eligible = prepare_product_pool(
        products,
        concerns
    )

    # -----------------------------------------
    # STEP 2 — Allergy safety filtering
    # -----------------------------------------

    eligible = apply_product_safety_filter(
        eligible,
        allergies
    )

    # -----------------------------------------
    # STEP 3 — Remove size variants
    # -----------------------------------------

    eligible = eligible[
        ~eligible["product_name"]
        .fillna("")
        .str.lower()
        .str.contains(
            r"\bmini\b|\btravel\b|\btrial\b",
            regex=True,
            na=False
        )
    ].copy()

    if eligible.empty:
        return pd.DataFrame()

    print(
        f"Eligible safe products: {len(eligible)}"
    )

    # -----------------------------------------
    # STEP 4 — ML prediction
    # -----------------------------------------

    model_input = prepare_model_input(
        eligible,
        skin_type
    )

    probabilities = model.predict_proba(
        model_input
    )[:, 1]

    eligible["ml_recommendation_probability"] = (
        probabilities * 100
    ).round(2)

    # -----------------------------------------
    # STEP 5 — Hybrid ranking
    # -----------------------------------------

    eligible["hybrid_ranking_score"] = (
        0.70
        * eligible["ml_recommendation_probability"]
        + 0.30
        * eligible["concern_relevance_score"]
    ).round(2)

    # -----------------------------------------
    # STEP 6 — Sort
    # -----------------------------------------

    ranked = eligible.sort_values(
        by="hybrid_ranking_score",
        ascending=False
    )

    return ranked.head(top_n)[
        [
            "product_name",
            "brand_name",
            "secondary_category",
            "price_usd",
            "rating",
            "ml_recommendation_probability",
            "concern_relevance_score",
            "hybrid_ranking_score",
        ]
    ]


# -----------------------------------------
# TEST
# -----------------------------------------

if __name__ == "__main__":

    print(
        "\nLoading SkinSense product ML model...\n"
    )

    results = rank_products(
        skin_type="combination",
        concerns=[
            "Acne",
            "Dark Spots"
        ],
        allergies="Fragrance",
        top_n=20
    )

    print(
        "\nTop 20 ML + concern + safety ranked products:\n"
    )

    print(
        results.to_string(index=False)
    )