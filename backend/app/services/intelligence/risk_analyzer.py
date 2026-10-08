"""
risk_analyzer.py  — AI/ML-powered risk factor analysis

Architecture:
  1. Build risk feature vector from lifestyle/environment data
  2. Run RiskNet (PyTorch) → probability per risk category
  3. Convert probabilities to structured risk dicts (same format as before)
  4. If ML unavailable → fallback to rule-based logic

Output format (unchanged from previous contract):
  [{ factor_type, factor_name, impact_level, impact_score, description, ml_probability }]
"""
from typing import Any, Dict, List, Optional

from intelligence.inference.ml_model_manager import MLModelManager
from intelligence.preprocessing.feature_builder import build_risk_features

# Probability thresholds → impact level
HIGH_THRESHOLD = 0.65
MODERATE_THRESHOLD = 0.40

# Risk category → human-readable details template
RISK_TEMPLATES = {
    "STRESS": {
        "factor_name": "Elevated Stress Level",
        "description": "AI model detected elevated stress indicators. High stress triggers cortisol-mediated sebum production and barrier disruption.",
    },
    "SLEEP": {
        "factor_name": "Sleep Quality / Duration Risk",
        "description": "AI model detected sleep-related risk. Insufficient or poor-quality sleep reduces nighttime barrier recovery.",
    },
    "HYDRATION": {
        "factor_name": "Hydration Deficit",
        "description": "AI model detected hydration-related risk. Low water intake increases transepidermal water loss and dullness.",
    },
    "LIFESTYLE": {
        "factor_name": "Lifestyle Risk Factor",
        "description": "AI model detected lifestyle risks (smoking, alcohol, sedentary behaviour). These accelerate skin aging and barrier degradation.",
    },
    "ENVIRONMENT": {
        "factor_name": "Environmental Exposure Risk",
        "description": "AI model detected environmental risk. High UV or air pollution causes photo-damage and lipid barrier degradation.",
    },
}


class RiskAnalyzer:
    """
    AI-assisted skin risk factor analysis using RiskNet (PyTorch).
    Falls back to rule-based logic if ML model is unavailable.
    """

    @classmethod
    def analyze_risks(
        cls,
        lifestyle_record: Optional[Any] = None,
        sleep_record: Optional[Any] = None,
        hydration_record: Optional[Any] = None,
        environment_record: Optional[Any] = None,
    ) -> List[Dict[str, Any]]:

        manager = MLModelManager.get_instance()

        if manager.available:
            risk_feature_dict = build_risk_features(
                lifestyle_record=lifestyle_record,
                sleep_record=sleep_record,
                hydration_record=hydration_record,
                environment_record=environment_record,
            )
            ml_predictions = manager.predict_risks(risk_feature_dict)
            ml_map = {p["risk_name"]: p["probability"] for p in ml_predictions}

            # Ground truth: detect specific factual telemetry factors
            telemetry_risks = cls._rule_based_fallback(
                lifestyle_record, sleep_record, hydration_record, environment_record
            )
            detected_types = set()
            risks = []
            for r in telemetry_risks:
                ft = r["factor_type"]
                prob = ml_map.get(ft, 0.5)
                r["ml_probability"] = prob
                r["assessment_mode"] = "AI_ASSISTED"
                if prob >= HIGH_THRESHOLD:
                    r["impact_level"] = "HIGH"
                detected_types.add(ft)
                risks.append(r)

            # In addition, include any emergent risk predicted by AI model above threshold
            for pred in ml_predictions:
                risk_name = pred["risk_name"]
                prob = pred["probability"]
                if risk_name not in detected_types and prob >= MODERATE_THRESHOLD:
                    impact_level = "HIGH" if prob >= HIGH_THRESHOLD else "MODERATE"
                    impact_score = int(prob * 15)
                    template = RISK_TEMPLATES.get(risk_name, {
                        "factor_name": f"AI-Identified {risk_name.capitalize()} Risk",
                        "description": "AI assessment model identified elevated risk from correlated profile telemetry.",
                    })
                    risks.append({
                        "factor_type":     risk_name,
                        "factor_name":     template["factor_name"],
                        "impact_level":    impact_level,
                        "impact_score":    impact_score,
                        "description":     template["description"],
                        "ml_probability":  prob,
                        "assessment_mode": "AI_ASSISTED",
                    })

            return risks


        # ── Fallback: Rule-Based ───────────────────────────────────────────────
        return cls._rule_based_fallback(
            lifestyle_record, sleep_record, hydration_record, environment_record
        )

    @classmethod
    def _rule_based_fallback(cls, lifestyle_record, sleep_record, hydration_record, environment_record) -> List[Dict[str, Any]]:
        """Original deterministic rule-based risk analysis used as fallback."""
        risks: List[Dict[str, Any]] = []

        # Stress
        if lifestyle_record and lifestyle_record.stress_level is not None:
            stress = lifestyle_record.stress_level
            if stress >= 8:
                risks.append({"factor_type": "STRESS", "factor_name": "High Cortisol Stress",
                    "impact_level": "HIGH", "impact_score": 15, "ml_probability": None,
                    "assessment_mode": "RULE_BASED_FALLBACK",
                    "description": f"Stress level ({stress}/10) triggers cortisol-mediated sebum oxidation."})
            elif stress >= 6:
                risks.append({"factor_type": "STRESS", "factor_name": "Moderate Stress",
                    "impact_level": "MODERATE", "impact_score": 8, "ml_probability": None,
                    "assessment_mode": "RULE_BASED_FALLBACK",
                    "description": f"Stress level ({stress}/10) may cause intermittent sensitivity."})

        # Sleep
        if sleep_record:
            duration = sleep_record.duration_minutes
            quality  = (sleep_record.quality or "").upper()
            if duration is not None and duration < 360:
                risks.append({"factor_type": "SLEEP", "factor_name": "Insufficient Sleep Duration",
                    "impact_level": "HIGH", "impact_score": 12, "ml_probability": None,
                    "assessment_mode": "RULE_BASED_FALLBACK",
                    "description": f"Sleep {duration//60}h {duration%60}m is below 7h threshold."})
            elif duration is not None and duration < 420:
                risks.append({"factor_type": "SLEEP", "factor_name": "Sub-optimal Sleep",
                    "impact_level": "MODERATE", "impact_score": 6, "ml_probability": None,
                    "assessment_mode": "RULE_BASED_FALLBACK",
                    "description": f"Sleep {duration//60}h {duration%60}m is marginally below optimal."})
            if quality == "POOR":
                risks.append({"factor_type": "SLEEP", "factor_name": "Poor Sleep Quality",
                    "impact_level": "HIGH", "impact_score": 10, "ml_probability": None,
                    "assessment_mode": "RULE_BASED_FALLBACK",
                    "description": "Fragmented sleep impairs nighttime skin repair."})

        # Hydration
        if hydration_record:
            intake = hydration_record.water_intake_ml
            target = hydration_record.target_water_ml or 2000
            if intake < 1200:
                risks.append({"factor_type": "HYDRATION", "factor_name": "Dehydration Deficit",
                    "impact_level": "HIGH", "impact_score": 14, "ml_probability": None,
                    "assessment_mode": "RULE_BASED_FALLBACK",
                    "description": f"Water intake ({intake}ml vs {target}ml target) is significantly low."})
            elif intake < (target * 0.75):
                risks.append({"factor_type": "HYDRATION", "factor_name": "Low Fluid Intake",
                    "impact_level": "MODERATE", "impact_score": 7, "ml_probability": None,
                    "assessment_mode": "RULE_BASED_FALLBACK",
                    "description": f"Water intake ({intake}ml) is below target ({target}ml)."})

        # Lifestyle
        if lifestyle_record:
            smoking = (lifestyle_record.smoking or "NONE").upper()
            if smoking in ("HEAVY", "REGULAR"):
                risks.append({"factor_type": "LIFESTYLE", "factor_name": "Nicotine / Smoke Exposure",
                    "impact_level": "HIGH", "impact_score": 15, "ml_probability": None,
                    "assessment_mode": "RULE_BASED_FALLBACK",
                    "description": "Tobacco smoke causes microvascular constriction and collagen breakdown."})
            alcohol = (lifestyle_record.alcohol or "NONE").upper()
            if alcohol in ("HEAVY", "REGULAR"):
                risks.append({"factor_type": "LIFESTYLE", "factor_name": "Excessive Alcohol Intake",
                    "impact_level": "HIGH", "impact_score": 12, "ml_probability": None,
                    "assessment_mode": "RULE_BASED_FALLBACK",
                    "description": "Heavy alcohol triggers vasodilation, flushing, and dehydration."})

            activity = (getattr(lifestyle_record, "physical_activity", None) or "MODERATE").upper()
            if activity == "SEDENTARY":
                risks.append({"factor_type": "LIFESTYLE", "factor_name": "Sedentary Activity",
                    "impact_level": "LOW", "impact_score": 4, "ml_probability": None,
                    "assessment_mode": "RULE_BASED_FALLBACK",
                    "description": "Limited physical activity reduces microvascular blood flow and waste clearance."})


        # Environment
        if environment_record:
            uv = getattr(environment_record, "uv_index", None)
            if uv is not None and uv >= 8:
                risks.append({"factor_type": "ENVIRONMENT", "factor_name": "Extreme UV Radiation",
                    "impact_level": "HIGH", "impact_score": 14, "ml_probability": None,
                    "assessment_mode": "RULE_BASED_FALLBACK",
                    "description": f"UV Index {uv} represents extreme photo-damage risk."})
            elif uv is not None and uv >= 5:
                risks.append({"factor_type": "ENVIRONMENT", "factor_name": "High UV Index",
                    "impact_level": "MODERATE", "impact_score": 8, "ml_probability": None,
                    "assessment_mode": "RULE_BASED_FALLBACK",
                    "description": f"UV Index {uv} requires vigilant sun protection."})

        return risks
