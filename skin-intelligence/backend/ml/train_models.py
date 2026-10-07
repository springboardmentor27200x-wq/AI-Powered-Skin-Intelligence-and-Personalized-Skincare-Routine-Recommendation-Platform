import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor, XGBClassifier
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.multioutput import MultiOutputClassifier
from sklearn.metrics import mean_squared_error, accuracy_score

def train_and_save_models():
    data_path = os.path.join(os.path.dirname(__file__), 'realistic_skincare_data.csv')
    df = pd.parse_csv(data_path) if hasattr(pd, "parse_csv") else pd.read_csv(data_path)

    X = df.drop(columns=['health_score', 'concern_acne', 'concern_dry_skin', 'concern_wrinkles', 'concern_dark_spots'])
    
    y_score = df['health_score']
    y_concerns = df[['concern_acne', 'concern_dry_skin', 'concern_wrinkles', 'concern_dark_spots']]

    # Preprocessing
    categorical_features = ['skin_type', 'age_group', 'avg_uv', 'avg_stress']
    numeric_features = ['avg_sleep', 'avg_water', 'sunscreen_rate']

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ])

    # Model 1: Health Score Regressor
    score_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', XGBRegressor(n_estimators=200, learning_rate=0.05, max_depth=6, random_state=42))
    ])

    # Model 2: Concerns Classifier (Multi-label)
    concerns_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', MultiOutputClassifier(XGBClassifier(n_estimators=200, learning_rate=0.05, max_depth=6, random_state=42, eval_metric='logloss')))
    ])

    # Train Score Model
    X_train, X_test, ys_train, ys_test = train_test_split(X, y_score, test_size=0.2, random_state=42)
    score_pipeline.fit(X_train, ys_train)
    ys_pred = score_pipeline.predict(X_test)
    mse = mean_squared_error(ys_test, ys_pred)
    print(f"Score Model MSE: {mse:.2f}")

    # Train Concerns Model
    X_train, X_test, yc_train, yc_test = train_test_split(X, y_concerns, test_size=0.2, random_state=42)
    concerns_pipeline.fit(X_train, yc_train)
    yc_pred = concerns_pipeline.predict(X_test)
    acc = accuracy_score(yc_test, yc_pred)
    print(f"Concerns Model Exact Match Accuracy: {acc:.2f}")

    # Save models
    os.makedirs(os.path.dirname(os.path.abspath(__file__)), exist_ok=True)
    score_model_path = os.path.join(os.path.dirname(__file__), 'score_model.joblib')
    concerns_model_path = os.path.join(os.path.dirname(__file__), 'concerns_model.joblib')
    
    joblib.dump(score_pipeline, score_model_path)
    joblib.dump(concerns_pipeline, concerns_model_path)
    print(f"Models saved to {score_model_path} and {concerns_model_path}")

if __name__ == '__main__':
    train_and_save_models()
