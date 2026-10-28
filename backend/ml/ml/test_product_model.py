import pandas as pd
import joblib
from pathlib import Path


BASE = Path("ml/data/sephora")

MODEL_PATH = Path(
    "ml/models/product_recommendation_model.joblib"
)

PRODUCT_PATH = BASE / "product_info.csv"


# ============================================================
# LOAD MODEL + PRODUCTS
# ============================================================

print("Loading ML model...")

model = joblib.load(MODEL_PATH)

print("Loading products...")

products = pd.read_csv(PRODUCT_PATH)


# ============================================================
# CLEAN PRODUCTS
# ============================================================

products = products[
    products["ingredients"].notna()
    & (products["ingredients"].astype(str).str.strip() != "")
].copy()

products["ingredient_text"] = (
    products["ingredients"]
    .astype(str)
    .str.lower()
)

products["highlights_text"] = (
    products["highlights"]
    .fillna("")
    .astype(str)
    .str.lower()
)

products["primary_category"] = (
    products["primary_category"]
    .fillna("Unknown")
)

products["secondary_category"] = (
    products["secondary_category"]
    .fillna("Unknown")
)

products["price"] = pd.to_numeric(
    products["price_usd"],
    errors="coerce"
).fillna(
    products["price_usd"].median()
)

products["product_rating"] = pd.to_numeric(
    products["rating"],
    errors="coerce"
).fillna(
    products["rating"].median()
)

products["review_count"] = pd.to_numeric(
    products["reviews"],
    errors="coerce"
).fillna(0)


# ============================================================
# USER PROFILE
# ============================================================

user_skin_type = "combination"


# ============================================================
# CREATE USER-PRODUCT INPUT
# ============================================================

products["skin_type"] = user_skin_type


model_features = products[
    [
        "skin_type",
        "ingredient_text",
        "highlights_text",
        "primary_category",
        "secondary_category",
        "price",
        "product_rating",
        "review_count",
    ]
]


# ============================================================
# PREDICT
# ============================================================

print("\nGenerating recommendations...")

probabilities = model.predict_proba(
    model_features
)[:, 1]


products["ml_score"] = probabilities * 100


# ============================================================
# TOP PRODUCTS
# ============================================================

results = products.sort_values(
    "ml_score",
    ascending=False
).head(20)


print("\n")
print("=" * 80)
print("TOP 20 ML PRODUCT RECOMMENDATIONS")
print("=" * 80)

for index, row in results.iterrows():

    print(
        f"\n{row['product_name']}"
    )

    print(
        f"Brand: {row['brand_name']}"
    )

    print(
        f"Category: {row['primary_category']}"
    )

    print(
        f"ML Score: {row['ml_score']:.2f}/100"
    )

    print(
        f"Product Rating: {row['rating']}"
    )

    print(
        f"Price: ${row['price_usd']}"
    )


print("\n")
print("=" * 80)
print("TEST COMPLETE")
print("=" * 80)