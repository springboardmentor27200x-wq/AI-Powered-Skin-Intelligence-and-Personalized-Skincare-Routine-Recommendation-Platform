import pandas as pd
from pathlib import Path

BASE = Path("ml/data/sephora")

print("Loading product data...")
products = pd.read_csv(BASE / "product_info.csv")

print(f"Products loaded: {len(products)}")

# Keep skincare products only
skincare_categories = [
    "Skincare",
]

products = products[
    products["primary_category"].isin(skincare_categories)
].copy()

print(f"Skincare products: {len(products)}")

# Remove products without ingredients
products = products[
    products["ingredients"].notna()
    & (products["ingredients"].astype(str).str.strip() != "")
].copy()

# Remove products without ratings
products = products[
    products["rating"].notna()
].copy()

# Useful ML features
products["price"] = products["price_usd"].fillna(
    products["price_usd"].median()
)

products["review_count"] = products["reviews"].fillna(0)

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

# Keep only useful columns
training_products = products[
    [
        "product_id",
        "product_name",
        "brand_name",
        "rating",
        "review_count",
        "price",
        "ingredient_text",
        "highlights_text",
        "primary_category",
        "secondary_category",
        "tertiary_category",
    ]
].copy()

# Load all review files
review_files = sorted(BASE.glob("reviews_*.csv"))

reviews = []

for file in review_files:
    print(f"Loading {file.name}...")
    df = pd.read_csv(file)

    reviews.append(
        df[
            [
                "product_id",
                "rating",
                "is_recommended",
                "skin_type",
                "review_text",
            ]
        ]
    )

reviews = pd.concat(reviews, ignore_index=True)

print(f"Total reviews: {len(reviews)}")

# Normalize skin type
reviews["skin_type"] = (
    reviews["skin_type"]
    .fillna("unknown")
    .astype(str)
    .str.lower()
    .str.strip()
)

# Keep known skin types
valid_skin_types = [
    "combination",
    "dry",
    "normal",
    "oily",
    "unknown",
]

reviews = reviews[
    reviews["skin_type"].isin(valid_skin_types)
].copy()

# Merge reviews with product information
training_data = reviews.merge(
    training_products,
    on="product_id",
    how="inner",
    suffixes=("_review", "_product")
)

print(f"Final merged rows: {len(training_data)}")

# Rename rating columns
training_data = training_data.rename(
    columns={
        "rating_review": "user_rating",
        "rating_product": "product_rating",
    }
)

# Save
output = BASE / "skincare_ml_training.csv"

training_data.to_csv(
    output,
    index=False
)

print()
print("===================================")
print("DATASET READY")
print("===================================")
print(f"Rows: {len(training_data)}")
print(f"Columns: {len(training_data.columns)}")
print(f"Saved to: {output}")
print()
print("Skin types:")
print(training_data["skin_type"].value_counts())