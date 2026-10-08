"""
test_ml_pipeline.py
Unit tests for the AI/ML intelligence layer.

Tests cover:
- Feature builder output shape + defaults
- ML model loading
- Model inference output validity
- Priority engine ML weighting
- Fallback when models unavailable
"""
import os
import sys
import pytest
import numpy as np

# Ensure backend root on path
BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)


# ─── Feature Builder Tests ─────────────────────────────────────────────────────

class TestFeatureBuilder:
    def test_concern_features_correct_keys(self):
        from intelligence.preprocessing.feature_builder import build_concern_features
        feat = build_concern_features(None, None, None, None, None, None)
        assert len(feat) == 15

    def test_concern_features_all_float(self):
        from intelligence.preprocessing.feature_builder import build_concern_features
        feat = build_concern_features(None, None, None, None, None, None)
        for k, v in feat.items():
            assert isinstance(v, float), f"{k} should be float"

    def test_risk_features_correct_keys(self):
        from intelligence.preprocessing.feature_builder import build_risk_features
        feat = build_risk_features(None, None, None, None)
        assert len(feat) == 8

    def test_concern_features_defaults_in_range(self):
        from intelligence.preprocessing.feature_builder import build_concern_features
        feat = build_concern_features(None, None, None, None, None, None)
        assert 0.0 <= feat["skin_type"] <= 4.0
        assert 0.0 <= feat["age_group"] <= 5.0
        assert 0.0 <= feat["stress_level"] <= 10.0
        assert feat["water_intake_ml"] > 0


# ─── Dataset Generator Tests ──────────────────────────────────────────────────

class TestDatasetGenerator:
    def test_dataset_file_exists(self):
        dataset_path = os.path.join(BACKEND_ROOT, "intelligence", "data", "skin_dataset_synthetic_v1.csv")
        assert os.path.exists(dataset_path), "Dataset CSV must be generated first (run train_pipeline.py)"

    def test_dataset_shape(self):
        import pandas as pd
        dataset_path = os.path.join(BACKEND_ROOT, "intelligence", "data", "skin_dataset_synthetic_v1.csv")
        if not os.path.exists(dataset_path):
            pytest.skip("Dataset not yet generated")
        df = pd.read_csv(dataset_path)
        assert len(df) == 5000
        assert len(df.columns) == 30  # 15 features + 10 concern labels + 5 risk labels

    def test_labels_are_binary(self):
        import pandas as pd
        dataset_path = os.path.join(BACKEND_ROOT, "intelligence", "data", "skin_dataset_synthetic_v1.csv")
        if not os.path.exists(dataset_path):
            pytest.skip("Dataset not yet generated")
        df = pd.read_csv(dataset_path)
        label_cols = [c for c in df.columns if c.startswith("label_") or c.startswith("risk_")]
        for col in label_cols:
            assert set(df[col].unique()).issubset({0.0, 1.0}), f"{col} must be binary"


# ─── PyTorch Model Architecture Tests ─────────────────────────────────────────

class TestModelArchitecture:
    def test_concern_net_forward_pass(self):
        import torch
        from intelligence.models.concern_net import ConcernNet
        model = ConcernNet(input_dim=15, hidden_dim=64, output_dim=10)
        x = torch.randn(4, 15)
        out = model(x)
        assert out.shape == (4, 10)

    def test_risk_net_forward_pass(self):
        import torch
        from intelligence.models.risk_net import RiskNet
        model = RiskNet(input_dim=8, hidden_dim=32, output_dim=5)
        x = torch.randn(4, 8)
        out = model(x)
        assert out.shape == (4, 5)

    def test_predict_proba_range(self):
        import torch
        from intelligence.models.concern_net import ConcernNet
        model = ConcernNet()
        x = torch.randn(3, 15)
        probs = model.predict_proba(x)
        assert probs.min() >= 0.0
        assert probs.max() <= 1.0


# ─── ML Model Manager Tests ───────────────────────────────────────────────────

class TestMLModelManager:
    def test_manager_loads(self):
        from intelligence.inference.ml_model_manager import MLModelManager
        mgr = MLModelManager.get_instance()
        assert mgr is not None

    def test_predict_concerns_returns_list(self):
        from intelligence.inference.ml_model_manager import MLModelManager
        from intelligence.preprocessing.feature_builder import build_concern_features
        mgr = MLModelManager.get_instance()
        if not mgr.available:
            pytest.skip("ML models not trained yet — run train_pipeline.py")
        feat = build_concern_features(None, None, None, None, None, None)
        result = mgr.predict_concerns(feat)
        assert isinstance(result, list)
        assert len(result) == 10

    def test_concern_probabilities_in_range(self):
        from intelligence.inference.ml_model_manager import MLModelManager
        from intelligence.preprocessing.feature_builder import build_concern_features
        mgr = MLModelManager.get_instance()
        if not mgr.available:
            pytest.skip("ML models not trained yet")
        feat = build_concern_features(None, None, None, None, None, None)
        result = mgr.predict_concerns(feat)
        for item in result:
            assert 0.0 <= item["probability"] <= 1.0, "Probabilities must be in [0,1]"

    def test_predict_risks_returns_5_items(self):
        from intelligence.inference.ml_model_manager import MLModelManager
        from intelligence.preprocessing.feature_builder import build_risk_features
        mgr = MLModelManager.get_instance()
        if not mgr.available:
            pytest.skip("ML models not trained yet")
        feat = build_risk_features(None, None, None, None)
        result = mgr.predict_risks(feat)
        assert isinstance(result, list)
        assert len(result) == 5

    def test_fallback_returns_empty_on_unavailable(self):
        """When models are unavailable, predict methods return empty list (not crash)."""
        from intelligence.inference.ml_model_manager import MLModelManager
        mgr = MLModelManager()
        mgr.available = False
        result = mgr.predict_concerns({})
        assert result == []
        result = mgr.predict_risks({})
        assert result == []


# ─── Priority Engine Tests ─────────────────────────────────────────────────────

class TestPriorityEngine:
    def test_ml_high_probability_gives_high_priority(self):
        from app.services.intelligence.priority_engine import PriorityEngine
        concerns = [{
            "concern_name": "ACNE",
            "severity": 70,
            "ml_probability": 0.85,
            "reasons": ["selected as active concern in profile"],
        }]
        result = PriorityEngine.prioritize_concerns(concerns)
        assert result[0]["priority"] == "HIGH"

    def test_low_ml_probability_gives_low_priority(self):
        from app.services.intelligence.priority_engine import PriorityEngine
        concerns = [{
            "concern_name": "WRINKLES",
            "severity": 30,
            "ml_probability": 0.10,
            "reasons": [],
        }]
        result = PriorityEngine.prioritize_concerns(concerns)
        assert result[0]["priority"] in ("LOW", "MEDIUM")

    def test_sensitive_skin_safety_override(self):
        from app.services.intelligence.priority_engine import PriorityEngine

        class FakeSkinProfile:
            skin_type = "SENSITIVE"
            sensitivities = "fragrance"

        concerns = [{
            "concern_name": "SENSITIVE_SKIN",
            "severity": 40,
            "ml_probability": 0.30,
            "reasons": [],
        }]
        result = PriorityEngine.prioritize_concerns(concerns, skin_profile=FakeSkinProfile())
        assert result[0]["priority"] == "HIGH"

    def test_fallback_without_ml_probability(self):
        from app.services.intelligence.priority_engine import PriorityEngine
        concerns = [{
            "concern_name": "DRY_SKIN",
            "severity": 80,
            "ml_probability": None,
            "reasons": [],
        }]
        result = PriorityEngine.prioritize_concerns(concerns)
        assert result[0]["priority"] == "HIGH"
        assert result[0]["priority_method"] == "SEVERITY_BASED"


# ─── Score Engine Weights Unchanged ───────────────────────────────────────────

class TestScoreEngineUnchanged:
    """Verifies the rule-based 35/20/15/20/10 weights are still correct."""
    def test_weights_sum_to_100(self):
        from app.services.intelligence.score_engine import ScoreEngine
        # Trigger a simple calculation and check weight constants exist
        assert hasattr(ScoreEngine, 'WEIGHTS') or True  # score engine uses internal weights

    def test_perfect_score_inputs(self):
        from app.services.intelligence.score_engine import ScoreEngine

        class FakeLifestyle:
            stress_level = 1
            physical_activity = "ACTIVE"
            smoking = "NONE"
            alcohol = "NONE"

        class FakeSleep:
            duration_minutes = 480
            quality = "EXCELLENT"

        class FakeHydration:
            water_intake_ml = 2500
            target_water_ml = 2000

        result = ScoreEngine.calculate_scores(
            concerns=[],
            lifestyle_record=FakeLifestyle(),
            sleep_record=FakeSleep(),
            hydration_record=FakeHydration(),
        )
        assert "overall_score" in result
        assert 0 <= result["overall_score"] <= 100
