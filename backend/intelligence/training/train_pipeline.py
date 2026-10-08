"""

train_pipeline.py

End-to-end training pipeline for ConcernNet and RiskNet.



This script:

1. Generates or loads the synthetic dataset

2. Preprocesses features (StandardScaler)

3. Trains ConcernNet (PyTorch, 50 epochs)

4. Trains RiskNet (PyTorch, 50 epochs)

5. Evaluates on hold-out test set (F1, ROC-AUC)

6. Saves .pt model files + preprocessor.pkl + metadata.json



Usage:

    cd backend

    python intelligence/training/train_pipeline.py



NOTE: Evaluation is based on SYNTHETIC data.

      Results do NOT represent clinical accuracy.

"""

import json

import os

import sys

from datetime import datetime



import joblib

import numpy as np

import pandas as pd

import torch

import torch.nn as nn

from sklearn.metrics import f1_score, roc_auc_score

from sklearn.model_selection import train_test_split

from sklearn.preprocessing import StandardScaler

from torch.utils.data import DataLoader



#   Ensure backend root is importable  

BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

if BACKEND_ROOT not in sys.path:

    sys.path.insert(0, BACKEND_ROOT)



from intelligence.models.concern_net import ConcernNet, CONCERN_LABELS

from intelligence.models.risk_net import RiskNet, RISK_LABELS

from intelligence.models.dataset import SkinDataset



#   Paths  

INTEL_DIR    = os.path.join(BACKEND_ROOT, "intelligence")

DATA_DIR     = os.path.join(INTEL_DIR, "data")

DATASET_CSV  = os.path.join(DATA_DIR, "skin_dataset_synthetic_v1.csv")

SAVED_DIR    = os.path.join(INTEL_DIR, "saved_models")



CONCERN_MODEL_PATH   = os.path.join(SAVED_DIR, "concern_model_v1.pt")

RISK_MODEL_PATH      = os.path.join(SAVED_DIR, "risk_model_v1.pt")

PREPROCESSOR_PATH    = os.path.join(SAVED_DIR, "preprocessor_v1.pkl")

METADATA_PATH        = os.path.join(SAVED_DIR, "model_metadata.json")



CONCERN_FEATURES = [

    "skin_type", "age_group", "stress_level", "sleep_hours", "sleep_quality",

    "water_intake_ml", "physical_activity", "smoking", "alcohol",

    "uv_index", "air_quality_index", "has_allergies", "has_sensitivities",

    "concern_count", "is_oily_or_combo",

]

RISK_FEATURES = [

    "stress_level", "sleep_hours", "sleep_quality", "water_intake_ml",

    "physical_activity", "smoking", "alcohol", "uv_index",

]

CONCERN_LABEL_COLS = [f"label_{c}" for c in CONCERN_LABELS]

RISK_LABEL_COLS    = [f"risk_{r}" for r in RISK_LABELS]





def train_model(model, dataloader_train, dataloader_val, epochs=50, lr=1e-3):

    """Generic PyTorch training loop with BCEWithLogitsLoss."""

    optimizer = torch.optim.Adam(model.parameters(), lr=lr)

    criterion = nn.BCEWithLogitsLoss()

    best_val_loss = float("inf")

    best_state = None



    for epoch in range(1, epochs + 1):

        model.train()

        train_loss = 0.0

        for X_batch, y_batch in dataloader_train:

            optimizer.zero_grad()

            logits = model(X_batch)

            loss = criterion(logits, y_batch)

            loss.backward()

            optimizer.step()

            train_loss += loss.item()



        # Validation

        model.eval()

        val_loss = 0.0

        with torch.no_grad():

            for X_batch, y_batch in dataloader_val:

                logits = model(X_batch)

                val_loss += criterion(logits, y_batch).item()



        train_loss /= len(dataloader_train)

        val_loss   /= len(dataloader_val)



        if epoch % 10 == 0:

            print(f"  Epoch {epoch:3d}/{epochs}  train_loss={train_loss:.4f}  val_loss={val_loss:.4f}")



        if val_loss < best_val_loss:

            best_val_loss = val_loss

            best_state = {k: v.clone() for k, v in model.state_dict().items()}



    if best_state:

        model.load_state_dict(best_state)

    return model





def evaluate(model, X_test: np.ndarray, y_test: np.ndarray, label_names):

    """Evaluate model, return metrics dict."""

    model.eval()

    with torch.no_grad():

        X_t = torch.tensor(X_test, dtype=torch.float32)

        probs = torch.sigmoid(model(X_t)).numpy()



    preds = (probs > 0.5).astype(int)

    macro_f1 = f1_score(y_test, preds, average="macro", zero_division=0)



    per_label = {}

    for i, name in enumerate(label_names):

        lf1 = f1_score(y_test[:, i], preds[:, i], zero_division=0)

        per_label[name] = round(float(lf1), 4)



    try:

        roc = roc_auc_score(y_test, probs, average="macro")

        if np.isnan(roc):

            roc = None

    except Exception:

        roc = None



    return {"macro_f1": round(float(macro_f1), 4), "roc_auc": round(float(roc), 4) if roc is not None else None, "per_label_f1": per_label}





def main():

    os.makedirs(SAVED_DIR, exist_ok=True)



    #   1. Generate dataset if needed  

    if not os.path.exists(DATASET_CSV):

        print("[Dataset] Generating synthetic dataset...")

        import subprocess

        result = subprocess.run(

            [sys.executable, os.path.join(DATA_DIR, "generate_dataset.py")],

            check=True, capture_output=True, text=True

        )

        print(result.stdout)

    else:

        print(f"[Dataset] Loading {DATASET_CSV}")





    df = pd.read_csv(DATASET_CSV)

    print(f"[Dataset] Loaded {len(df)} rows")



    #   2. Split  

    df_train, df_temp = train_test_split(df, test_size=0.20, random_state=42)

    df_val,   df_test = train_test_split(df_temp, test_size=0.50, random_state=42)

    print(f"[Split] Train={len(df_train)}  Val={len(df_val)}  Test={len(df_test)}")



    #   3. Preprocess - shared scaler for concern features  

    scaler = StandardScaler()

    X_train_c = scaler.fit_transform(df_train[CONCERN_FEATURES].values)

    X_val_c   = scaler.transform(df_val[CONCERN_FEATURES].values)

    X_test_c  = scaler.transform(df_test[CONCERN_FEATURES].values)

    joblib.dump(scaler, PREPROCESSOR_PATH)

    print(f"[Preprocessor] StandardScaler fitted + saved -> {PREPROCESSOR_PATH}")



    y_train_c = df_train[CONCERN_LABEL_COLS].values.astype(np.float32)

    y_val_c   = df_val[CONCERN_LABEL_COLS].values.astype(np.float32)

    y_test_c  = df_test[CONCERN_LABEL_COLS].values.astype(np.float32)



    # Risk features scaler

    risk_scaler = StandardScaler()

    X_train_r = risk_scaler.fit_transform(df_train[RISK_FEATURES].values)

    X_val_r   = risk_scaler.transform(df_val[RISK_FEATURES].values)

    X_test_r  = risk_scaler.transform(df_test[RISK_FEATURES].values)

    risk_scaler_path = PREPROCESSOR_PATH.replace("preprocessor_v1", "risk_preprocessor_v1")

    joblib.dump(risk_scaler, risk_scaler_path)



    y_train_r = df_train[RISK_LABEL_COLS].values.astype(np.float32)

    y_val_r   = df_val[RISK_LABEL_COLS].values.astype(np.float32)

    y_test_r  = df_test[RISK_LABEL_COLS].values.astype(np.float32)



    #   4. Train ConcernNet  

    print("\n[ConcernNet] Training...")

    concern_model = ConcernNet(input_dim=len(CONCERN_FEATURES), hidden_dim=64, output_dim=len(CONCERN_LABELS))



    dl_train = DataLoader(SkinDataset(X_train_c, y_train_c), batch_size=64, shuffle=True)

    dl_val   = DataLoader(SkinDataset(X_val_c,   y_val_c),   batch_size=64)



    concern_model = train_model(concern_model, dl_train, dl_val, epochs=50)

    torch.save(concern_model.state_dict(), CONCERN_MODEL_PATH)

    print(f"[ConcernNet] Saved -> {CONCERN_MODEL_PATH}")



    concern_metrics = evaluate(concern_model, X_test_c, y_test_c, CONCERN_LABELS)

    print(f"[ConcernNet] Test macro-F1={concern_metrics['macro_f1']}  ROC-AUC={concern_metrics['roc_auc']}")



    #   5. Train RiskNet  

    print("\n[RiskNet] Training...")

    risk_model = RiskNet(input_dim=len(RISK_FEATURES), hidden_dim=32, output_dim=len(RISK_LABELS))



    dl_train_r = DataLoader(SkinDataset(X_train_r, y_train_r), batch_size=64, shuffle=True)

    dl_val_r   = DataLoader(SkinDataset(X_val_r,   y_val_r),   batch_size=64)



    risk_model = train_model(risk_model, dl_train_r, dl_val_r, epochs=50)

    torch.save(risk_model.state_dict(), RISK_MODEL_PATH)

    print(f"[RiskNet] Saved -> {RISK_MODEL_PATH}")



    risk_metrics = evaluate(risk_model, X_test_r, y_test_r, RISK_LABELS)

    print(f"[RiskNet] Test macro-F1={risk_metrics['macro_f1']}")



    #   6. Save metadata  

    metadata = {

        "model_version": "v1.0",

        "training_date": datetime.utcnow().isoformat(),

        "dataset": "skin_dataset_synthetic_v1.csv",

        "dataset_version": "v1",

        "dataset_type": "SYNTHETIC - Not clinical data",

        "feature_version": "v1",

        "concern_model": {

            "architecture": "ConcernNet (15->64->32->10)",

            "loss": "BCEWithLogitsLoss",

            "optimizer": "Adam lr=1e-3",

            "epochs": 50,

            "metrics": concern_metrics,

        },

        "risk_model": {

            "architecture": "RiskNet (8->32->5)",

            "loss": "BCEWithLogitsLoss",

            "optimizer": "Adam lr=1e-3",

            "epochs": 50,

            "metrics": risk_metrics,

        },

        "disclaimer": "Evaluation is based on synthetic data and does not represent clinical accuracy.",

    }

    with open(METADATA_PATH, "w") as f:

        json.dump(metadata, f, indent=2)

    print(f"\n[Metadata] Saved -> {METADATA_PATH}")

    print("\n[OK] Training complete.")

    print("NOTE: Evaluated on SYNTHETIC data. Does not represent clinical accuracy.")





if __name__ == "__main__":

    main()

