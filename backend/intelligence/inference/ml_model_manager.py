"""
ml_model_manager.py
Singleton that loads ConcernNet + RiskNet once at startup and reuses them.

- Loads PyTorch .pt model state dicts
- Loads sklearn StandardScaler from .pkl
- Exposes predict_concerns() and predict_risks()
- Handles load failures gracefully: sets available=False, returns empty results

Usage:
    from intelligence.inference.ml_model_manager import MLModelManager
    manager = MLModelManager.get_instance()
    if manager.available:
        concerns = manager.predict_concerns(feature_vector)
        risks    = manager.predict_risks(risk_feature_vector)
"""
import json
import logging
import os
from typing import Dict, List, Optional

import joblib
import numpy as np
import torch

logger = logging.getLogger(__name__)

INTEL_DIR    = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SAVED_DIR    = os.path.join(INTEL_DIR, "saved_models")

CONCERN_MODEL_PATH    = os.path.join(SAVED_DIR, "concern_model_v1.pt")
RISK_MODEL_PATH       = os.path.join(SAVED_DIR, "risk_model_v1.pt")
PREPROCESSOR_PATH     = os.path.join(SAVED_DIR, "preprocessor_v1.pkl")
RISK_PREPROCESSOR_PATH= os.path.join(SAVED_DIR, "risk_preprocessor_v1.pkl")
METADATA_PATH         = os.path.join(SAVED_DIR, "model_metadata.json")


class MLModelManager:
    """
    Loads and caches both ML models. Thread-safe singleton via class variable.
    """

    _instance: Optional["MLModelManager"] = None

    def __init__(self):
        self.available = False
        self.concern_model = None
        self.risk_model = None
        self.concern_scaler = None
        self.risk_scaler = None
        self.metadata: Dict = {}
        self._load()

    @classmethod
    def get_instance(cls) -> "MLModelManager":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load(self):
        try:
            # Import model classes here to avoid circular imports
            from intelligence.models.concern_net import ConcernNet, CONCERN_LABELS
            from intelligence.models.risk_net import RiskNet, RISK_LABELS

            if not os.path.exists(CONCERN_MODEL_PATH):
                logger.warning("[MLModelManager] concern_model_v1.pt not found - run train_pipeline.py first")
                return
            if not os.path.exists(RISK_MODEL_PATH):
                logger.warning("[MLModelManager] risk_model_v1.pt not found - run train_pipeline.py first")
                return
            if not os.path.exists(PREPROCESSOR_PATH):
                logger.warning("[MLModelManager] preprocessor_v1.pkl not found")
                return

            # Load concern model
            self.concern_model = ConcernNet(input_dim=15, hidden_dim=64, output_dim=len(CONCERN_LABELS))
            state = torch.load(CONCERN_MODEL_PATH, map_location="cpu", weights_only=True)
            self.concern_model.load_state_dict(state)
            self.concern_model.eval()

            # Load risk model
            self.risk_model = RiskNet(input_dim=8, hidden_dim=32, output_dim=len(RISK_LABELS))
            state = torch.load(RISK_MODEL_PATH, map_location="cpu", weights_only=True)
            self.risk_model.load_state_dict(state)
            self.risk_model.eval()

            # Load scalers
            self.concern_scaler = joblib.load(PREPROCESSOR_PATH)
            if os.path.exists(RISK_PREPROCESSOR_PATH):
                self.risk_scaler = joblib.load(RISK_PREPROCESSOR_PATH)
            else:
                self.risk_scaler = self.concern_scaler  # fallback

            # Load metadata
            if os.path.exists(METADATA_PATH):
                with open(METADATA_PATH) as f:
                    self.metadata = json.load(f)

            self.available = True
            logger.info(f"[MLModelManager] Models loaded - version {self.metadata.get('model_version', 'unknown')}")

        except Exception as e:
            logger.error(f"[MLModelManager] Failed to load models: {e}")
            self.available = False

    CONCERN_FEATURE_ORDER = [
        "skin_type", "age_group", "stress_level", "sleep_hours", "sleep_quality",
        "water_intake_ml", "physical_activity", "smoking", "alcohol",
        "uv_index", "air_quality_index", "has_allergies", "has_sensitivities",
        "concern_count", "is_oily_or_combo",
    ]

    RISK_FEATURE_ORDER = [
        "stress_level", "sleep_hours", "sleep_quality", "water_intake_ml",
        "physical_activity", "smoking", "alcohol", "uv_index",
    ]

    def predict_concerns(self, feature_dict: Dict[str, float]) -> List[Dict]:
        """
        Returns list of { concern_name, probability } dicts sorted by probability desc.
        Returns [] if model unavailable.
        """
        if not self.available or self.concern_model is None:
            return []

        try:
            from intelligence.models.concern_net import CONCERN_LABELS
            vec = np.array(
                [feature_dict.get(k, 0.0) for k in self.CONCERN_FEATURE_ORDER],
                dtype=np.float32
            ).reshape(1, -1)
            vec_scaled = self.concern_scaler.transform(vec)
            x = torch.tensor(vec_scaled, dtype=torch.float32)
            probs = self.concern_model.predict_proba(x).numpy()[0]

            return sorted(
                [{"concern_name": name, "probability": float(round(p, 4))}
                 for name, p in zip(CONCERN_LABELS, probs)],
                key=lambda d: d["probability"],
                reverse=True,
            )
        except Exception as e:
            logger.error(f"[MLModelManager] predict_concerns failed: {e}")
            return []

    def predict_risks(self, risk_feature_dict: Dict[str, float]) -> List[Dict]:
        """
        Returns list of { risk_name, probability } dicts sorted by probability desc.
        Returns [] if model unavailable.
        """
        if not self.available or self.risk_model is None:
            return []

        try:
            from intelligence.models.risk_net import RISK_LABELS
            vec = np.array(
                [risk_feature_dict.get(k, 0.0) for k in self.RISK_FEATURE_ORDER],
                dtype=np.float32
            ).reshape(1, -1)
            vec_scaled = self.risk_scaler.transform(vec)
            x = torch.tensor(vec_scaled, dtype=torch.float32)
            probs = self.risk_model.predict_proba(x).numpy()[0]

            return sorted(
                [{"risk_name": name, "probability": float(round(p, 4))}
                 for name, p in zip(RISK_LABELS, probs)],
                key=lambda d: d["probability"],
                reverse=True,
            )
        except Exception as e:
            logger.error(f"[MLModelManager] predict_risks failed: {e}")
            return []
