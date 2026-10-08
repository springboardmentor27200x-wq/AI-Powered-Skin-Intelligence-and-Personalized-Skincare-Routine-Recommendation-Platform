"""
concern_analyzer.py  — AI/ML-powered concern analysis

Architecture:
  1. Build feature vector from user data
  2. Run ConcernNet (PyTorch) → probability per concern
  3. Merge ML predictions with user-declared concerns
  4. If ML unavailable → fallback to rule-based logic

Output format (unchanged from previous contract):
  [{ concern_name, severity, confidence, reasons, ml_probability }]
"""
from typing import Any, Dict, List, Optional

from intelligence.inference.ml_model_manager import MLModelManager
from intelligence.preprocessing.feature_builder import build_concern_features


# Concern label → display name
SUPPORTED_CONCERNS = {
    "ACNE":             "Acne & Breakouts",
    "HYPERPIGMENTATION":"Hyperpigmentation",
    "DARK_SPOTS":       "Dark Spots & Blemishes",
    "DRY_SKIN":         "Dryness & Flakiness",
    "OILY_SKIN":        "Excess Sebum & Oiliness",
    "SENSITIVE_SKIN":   "Skin Sensitivity & Reactivity",
    "WRINKLES":         "Wrinkles & Loss of Firmness",
    "FINE_LINES":       "Fine Lines & Expression Marks",
    "REDNESS":          "Erythema & Facial Redness",
    "UNEVEN_TONE":      "Uneven Skin Tone & Dullness",
}

# Minimum ML probability to include a non-declared concern in results
ML_INCLUDE_THRESHOLD = 0.45


class ConcernAnalyzer:
    """
    AI-assisted skin concern assessment.
    Uses PyTorch ConcernNet for probability prediction.
    Declared concerns from user profile are always included.

    Assessment mode: "AI_ASSISTED" | "RULE_BASED_FALLBACK"
    """

    @classmethod
    def analyze_concerns(
        cls,
        skin_profile: Optional[Any],
        user_profile: Optional[Any] = None,
        risks: Optional[List[Dict[str, Any]]] = None,
        lifestyle_record: Optional[Any] = None,
        hydration_record: Optional[Any] = None,
        sleep_record: Optional[Any] = None,
        environment_record: Optional[Any] = None,
    ) -> List[Dict[str, Any]]:

        risks = risks or []
        manager = MLModelManager.get_instance()

        # ── Get user-declared concerns from profile ────────────────────────────
        reported_concerns: List[str] = []
        if skin_profile and skin_profile.concerns:
            for c in skin_profile.concerns:
                code = (c.code or c.name or "").upper()
                for key in SUPPORTED_CONCERNS:
                    if key in code or code in key:
                        reported_concerns.append(key)
                        break

        # ── Risk flags (used in both ML and fallback) ─────────────────────────
        has_high_stress  = any(r.get("factor_type") == "STRESS" and r.get("impact_level") == "HIGH" for r in risks)
        has_poor_sleep   = any(r.get("factor_type") == "SLEEP" and r.get("impact_level") in ["HIGH", "MODERATE"] for r in risks)
        has_dehydration  = any(r.get("factor_type") == "HYDRATION" for r in risks)
        has_high_uv      = any(r.get("factor_type") == "ENVIRONMENT" and "UV" in r.get("factor_name", "") for r in risks)
        has_smoking      = any(r.get("factor_type") == "LIFESTYLE" and "Smoke" in r.get("factor_name", "") for r in risks)
        skin_type        = (getattr(skin_profile, "skin_type", None) or "NORMAL").upper()
        age_group        = (getattr(user_profile, "age_group", None) or "").upper()

        # ── AI/ML Path ────────────────────────────────────────────────────────
        if manager.available:
            feature_dict = build_concern_features(
                skin_profile=skin_profile,
                user_profile=user_profile,
                lifestyle_record=lifestyle_record,
                sleep_record=sleep_record,
                hydration_record=hydration_record,
                environment_record=environment_record,
            )
            ml_predictions = manager.predict_concerns(feature_dict)
            # { concern_name: probability }
            ml_prob_map = {p["concern_name"]: p["probability"] for p in ml_predictions}

            results = []
            seen = set()

            # Include declared concerns (always present) + ML predictions above threshold
            for concern_name in list(SUPPORTED_CONCERNS.keys()):
                ml_prob = ml_prob_map.get(concern_name, 0.0)
                is_declared = concern_name in reported_concerns

                if not is_declared and ml_prob < ML_INCLUDE_THRESHOLD:
                    continue

                seen.add(concern_name)

                # Severity: base 50, boosted by ML probability
                # Higher ML probability → higher severity
                severity = 35 + int(ml_prob * 50)

                reasons = [
                    f"AI assessment model probability: {ml_prob:.0%}"
                ]
                if is_declared:
                    reasons.insert(0, "Selected as an active skin concern in your profile")
                    severity = max(severity, 55)

                # Additional rule-based amplifiers (context factors)
                if concern_name == "ACNE":
                    if skin_type in ("OILY", "COMBINATION"):
                        severity = min(100, severity + 10)
                        reasons.append(f"Amplified by {skin_type.capitalize()} skin type")
                    if has_high_stress:
                        severity = min(100, severity + 8)
                        reasons.append("Elevated stress detected")

                elif concern_name == "DRY_SKIN":
                    if skin_type in ("DRY", "SENSITIVE"):
                        severity = min(100, severity + 12)
                        reasons.append(f"Consistent with {skin_type.capitalize()} skin profile")
                    if has_dehydration:
                        severity = min(100, severity + 8)
                        reasons.append("Low water intake detected")

                elif concern_name in ("HYPERPIGMENTATION", "DARK_SPOTS"):
                    if has_high_uv:
                        severity = min(100, severity + 10)
                        reasons.append("High UV exposure detected")

                elif concern_name in ("WRINKLES", "FINE_LINES"):
                    if has_smoking:
                        severity = min(100, severity + 8)
                        reasons.append("Smoke exposure is a contributing factor")

                elif concern_name in ("SENSITIVE_SKIN", "REDNESS"):
                    if skin_type == "SENSITIVE":
                        severity = min(100, severity + 12)
                        reasons.append("Constitutional sensitive skin type")

                results.append({
                    "concern_name":    concern_name,
                    "severity":        min(100, max(20, severity)),
                    "confidence":      min(0.98, max(0.50, ml_prob + 0.10)),
                    "ml_probability":  ml_prob,
                    "assessment_mode": "AI_ASSISTED",
                    "reasons":         reasons,
                })

            # Ensure declared concerns are always in results
            for declared in reported_concerns:
                if declared not in seen and declared in SUPPORTED_CONCERNS:
                    results.append({
                        "concern_name":    declared,
                        "severity":        55,
                        "confidence":      0.85,
                        "ml_probability":  ml_prob_map.get(declared, 0.0),
                        "assessment_mode": "AI_ASSISTED",
                        "reasons":         ["Selected as active concern in profile",
                                            f"AI model probability: {ml_prob_map.get(declared, 0.0):.0%}"],
                    })

            if not results:
                results.append({
                    "concern_name":    "BARRIER_MAINTENANCE",
                    "severity":        25,
                    "confidence":      0.90,
                    "ml_probability":  0.0,
                    "assessment_mode": "AI_ASSISTED",
                    "reasons":         ["No high-priority concerns detected by AI model",
                                        "Preventative barrier health recommended"],
                })

            return results

        # ── Fallback: Rule-Based (if ML unavailable) ──────────────────────────
        return cls._rule_based_fallback(
            reported_concerns, skin_type, age_group,
            has_high_stress, has_poor_sleep, has_dehydration,
            has_high_uv, has_smoking, skin_profile, hydration_record,
        )

    @classmethod
    def _rule_based_fallback(
        cls, reported_concerns, skin_type, age_group,
        has_high_stress, has_poor_sleep, has_dehydration,
        has_high_uv, has_smoking, skin_profile, hydration_record,
    ) -> List[Dict[str, Any]]:
        """Original rule-based logic used when ML model is unavailable."""
        results = []
        active_codes = set(reported_concerns)

        for code in active_codes:
            severity = 50
            reasons = [f"Selected as an active skin concern in profile"]
            confidence = 0.80

            if code in ("ACNE",):
                if skin_type in ("OILY", "COMBINATION"):
                    severity += 18
                    reasons.append(f"Amplified by {skin_type.capitalize()} skin profile")
                if has_high_stress:
                    severity += 12
                    reasons.append("Elevated stress levels detected")
                if has_poor_sleep:
                    severity += 8
                    reasons.append("Sub-optimal sleep detected")
            elif code == "DRY_SKIN":
                if skin_type in ("DRY", "SENSITIVE"):
                    severity += 20
                    reasons.append(f"Direct correlation with {skin_type.capitalize()} skin")
                if has_dehydration:
                    severity += 15
                    reasons.append("Water intake deficit detected")
            elif code in ("HYPERPIGMENTATION", "DARK_SPOTS"):
                if has_high_uv:
                    severity += 18
                    reasons.append("High UV exposure detected")
            elif code in ("WRINKLES", "FINE_LINES"):
                if has_smoking:
                    severity += 12
                    reasons.append("Smoke exposure is a contributing factor")
                if has_dehydration:
                    severity += 8
                    reasons.append("Dehydration accentuates expression lines")
            elif code in ("SENSITIVE_SKIN", "REDNESS"):
                if skin_type == "SENSITIVE":
                    severity += 20
                    reasons.append("Constitutional sensitive skin barrier")
                if skin_profile and (skin_profile.allergies or skin_profile.sensitivities):
                    severity += 15
                    reasons.append("Known allergy/sensitivity history")
                if has_high_stress:
                    severity += 8
                    reasons.append("Stress triggers neurogenic inflammation")
            elif code == "OILY_SKIN":
                if skin_type in ("OILY", "COMBINATION"):
                    severity += 20
                    reasons.append(f"Overactive sebaceous glands ({skin_type.capitalize()} type)")
                if has_high_stress:
                    severity += 10
                    reasons.append("Cortisol upregulates sebaceous activity")
            elif code == "UNEVEN_TONE":
                if has_poor_sleep:
                    severity += 12
                    reasons.append("Circadian disruption causes uneven microcirculation")
                if has_high_uv:
                    severity += 12
                    reasons.append("Solar radiation causes irregular melanin deposition")

            results.append({
                "concern_name":    code,
                "severity":        min(100, max(20, severity)),
                "confidence":      min(0.95, confidence),
                "ml_probability":  None,
                "assessment_mode": "RULE_BASED_FALLBACK",
                "reasons":         reasons,
            })

        if has_dehydration and "DRY_SKIN" not in active_codes:
            results.append({
                "concern_name": "DRY_SKIN", "severity": 45, "confidence": 0.75,
                "ml_probability": None, "assessment_mode": "RULE_BASED_FALLBACK",
                "reasons": ["Inferred from systemic hydration deficit"],
            })

        if not results:
            results.append({
                "concern_name": "BARRIER_MAINTENANCE", "severity": 25, "confidence": 0.90,
                "ml_probability": None, "assessment_mode": "RULE_BASED_FALLBACK",
                "reasons": ["No active disorders selected — preventative routine recommended"],
            })

        return results
