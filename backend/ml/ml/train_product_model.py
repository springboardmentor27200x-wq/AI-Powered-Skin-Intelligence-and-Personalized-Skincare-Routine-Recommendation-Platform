import pandas as pd
import numpy as np
import joblib

from pathlib import Path

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    classification_report,
)


# ============================================================
# PATHS
# ============================================================

BASE = Path("ml/data/sephora")

DATASET = BASE / "skincare_ml_training.csv"
MODEL_DIR = Path("ml/models")

MODEL_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 60)
print("LOADING DATASET")
print("=" * 60)

df = pd.read_csv(DATASET)

print(f"Total rows loaded: {len(df):,}")


# ============================================================
# CLEAN DATA
# ============================================================

print("\nCleaning data...")

# Keep only reviews with known recommendation labels
df = df[df["is_recommended"].notna()].copy()

# Remove unknown skin types
valid_skin_types = [
    "combination",
    "dry",
    "normal",
    "oily",
]

df = df[df["skin_type"].isin(valid_skin_types)].copy()

# Remove rows without ingredients
df = df[
    df["ingredient_text"].notna()
    & (df["ingredient_text"].astype(str).str.strip() != "")
].copy()

# Fill missing categorical/text values
df["ingredient_text"] = df["ingredient_text"].fillna("")
df["highlights_text"] = df["highlights_text"].fillna("")
df["primary_category"] = df["primary_category"].fillna("Unknown")
df["secondary_category"] = df["secondary_category"].fillna("Unknown")

# Numeric values
df["price"] = pd.to_numeric(
    df["price"],
    errors="coerce"
).fillna(df["price"].median())

df["product_rating"] = pd.to_numeric(
    df["product_rating"],
    errors="coerce"
).fillna(df["product_rating"].median())

df["review_count"] = pd.to_numeric(
    df["review_count"],
    errors="coerce"
).fillna(0)

# Target
df["target"] = df["is_recommended"].astype(int)


print(f"Clean training rows: {len(df):,}")

print("\nSkin type distribution:")
print(df["skin_type"].value_counts())

print("\nTarget distribution:")
print(df["target"].value_counts())


# ============================================================
# FEATURES
# ============================================================

print("\nPreparing features...")

X = df[
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

y = df["target"]


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

print("\nSplitting dataset...")

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)

print(f"Training rows: {len(X_train):,}")
print(f"Testing rows:  {len(X_test):,}")


# ============================================================
# PREPROCESSING
# ============================================================

print("\nBuilding preprocessing pipeline...")

preprocessor = ColumnTransformer(
    transformers=[
        (
            "ingredients",
            TfidfVectorizer(
                max_features=5000,
                ngram_range=(1, 2),
                min_df=3,
                max_df=0.95,
                sublinear_tf=True,
            ),
            "ingredient_text",
        ),

        (
            "highlights",
            TfidfVectorizer(
                max_features=2000,
                ngram_range=(1, 2),
                min_df=3,
                max_df=0.95,
                sublinear_tf=True,
            ),
            "highlights_text",
        ),

        (
            "categorical",
            OneHotEncoder(
                handle_unknown="ignore"
            ),
            [
                "skin_type",
                "primary_category",
                "secondary_category",
            ],
        ),

        (
            "numeric",
            StandardScaler(),
            [
                "price",
                "product_rating",
                "review_count",
            ],
        ),
    ]
)


# ============================================================
# MODEL
# ============================================================

print("\nBuilding Logistic Regression model...")

model = LogisticRegression(
    max_iter=1000,
    class_weight="balanced",
    solver="liblinear",
    random_state=42,
)


pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("model", model),
    ]
)


# ============================================================
# TRAIN
# ============================================================

print("\n" + "=" * 60)
print("TRAINING MODEL")
print("=" * 60)

pipeline.fit(X_train, y_train)

print("Training completed!")


# ============================================================
# PREDICTION
# ============================================================

print("\nGenerating predictions...")

y_pred = pipeline.predict(X_test)

y_probability = pipeline.predict_proba(X_test)[:, 1]


# ============================================================
# EVALUATION
# ============================================================

accuracy = accuracy_score(
    y_test,
    y_pred
)

precision = precision_score(
    y_test,
    y_pred,
    zero_division=0
)

recall = recall_score(
    y_test,
    y_pred,
    zero_division=0
)

f1 = f1_score(
    y_test,
    y_pred,
    zero_division=0
)

roc_auc = roc_auc_score(
    y_test,
    y_probability
)


print("\n" + "=" * 60)
print("MODEL EVALUATION")
print("=" * 60)

print(f"Accuracy : {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall   : {recall:.4f}")
print(f"F1 Score : {f1:.4f}")
print(f"ROC-AUC  : {roc_auc:.4f}")

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        y_pred,
        target_names=[
            "Not Recommended",
            "Recommended",
        ],
        zero_division=0,
    )
)


# ============================================================
# SAVE MODEL
# ============================================================

model_path = MODEL_DIR / "product_recommendation_model.joblib"

joblib.dump(
    pipeline,
    model_path
)

print("\n" + "=" * 60)
print("MODEL SAVED")
print("=" * 60)

print(f"Path: {model_path}")

print("\nDONE.")