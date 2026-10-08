import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report


# ============================================================
# 1. LOAD DATASET
# ============================================================

df = pd.read_csv("skin_dataset.csv")

print("Dataset loaded successfully!")
print("Shape:", df.shape)

print("\nOriginal data types:")
print(df.dtypes)


# ============================================================
# 2. SEPARATE FEATURES AND TARGET
# ============================================================

X = df.drop("Skin_Concern", axis=1).copy()
y = df["Skin_Concern"].astype(str)


# ============================================================
# 3. DEFINE COLUMNS EXPLICITLY
# ============================================================

categorical_columns = [
    "Skin_Type",
    "Sensitivity",
    "Hydration",
    "Stress_Level",
    "Sleep_Quality",
    "Physical_Activity"
]

numerical_columns = [
    "Age",
    "Water_Intake"
]


# ============================================================
# 4. CONVERT CATEGORICAL COLUMNS TO STRING
# ============================================================

for column in categorical_columns:
    X[column] = X[column].astype(str)


# Convert numerical columns to numeric
for column in numerical_columns:
    X[column] = pd.to_numeric(X[column], errors="coerce")


# ============================================================
# 5. CHECK FOR MISSING VALUES
# ============================================================

print("\nMissing values after conversion:")
print(X.isnull().sum())


# ============================================================
# 6. DISPLAY COLUMN TYPES
# ============================================================

print("\nCategorical columns:")
print(categorical_columns)

print("\nNumerical columns:")
print(numerical_columns)

print("\nFinal data types:")
print(X.dtypes)


# ============================================================
# 7. PREPROCESSING
# ============================================================

preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(
                handle_unknown="ignore",
                sparse_output=False
            ),
            categorical_columns
        ),
        (
            "numerical",
            "passthrough",
            numerical_columns
        )
    ]
)


# ============================================================
# 8. RANDOM FOREST MODEL
# ============================================================

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    class_weight="balanced"
)


# ============================================================
# 9. CREATE PIPELINE
# ============================================================

pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("model", model)
    ]
)


# ============================================================
# 10. TRAIN / TEST SPLIT
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("\nTraining data:", X_train.shape)
print("Testing data:", X_test.shape)


# ============================================================
# 11. TRAIN MODEL
# ============================================================

print("\nTraining Random Forest model...")

pipeline.fit(X_train, y_train)

print("Training completed successfully!")


# ============================================================
# 12. PREDICTIONS
# ============================================================

y_pred = pipeline.predict(X_test)


# ============================================================
# 13. ACCURACY
# ============================================================

accuracy = accuracy_score(y_test, y_pred)

print("\n========================================")
print("MODEL ACCURACY")
print("========================================")

print("Accuracy:", round(accuracy * 100, 2), "%")


# ============================================================
# 14. CLASSIFICATION REPORT
# ============================================================

print("\n========================================")
print("CLASSIFICATION REPORT")
print("========================================")

print(
    classification_report(
        y_test,
        y_pred,
        zero_division=0
    )
)


# ============================================================
# 15. SAVE MODEL
# ============================================================

model_path = "skin_concern_model.joblib"

joblib.dump(
    pipeline,
    model_path
)

print("\n========================================")
print("MODEL SAVED")
print("========================================")

print("File:", model_path)
print("ML model is ready!")