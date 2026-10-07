"""
Assessment Engine — Rule-Based Skin Intelligence Module

Implements Module 3 (Skin Assessment Engine) of the Skin Intelligence platform.
Uses a deterministic, weighted rule system to:
  - Score each possible skin concern based on profile + lifestyle data
  - Identify risk factors from lifestyle patterns
  - Compute a 5-factor weighted skin health score with full breakdown
"""

from typing import Dict, List, Any, Optional
import os
import joblib
import pandas as pd

# ============================================================
# CONCERN DEFINITIONS
# ============================================================

ALL_CONCERNS = [
    "Acne",
    "Hyperpigmentation",
    "Dark Spots",
    "Dry Skin",
    "Oily Skin",
    "Sensitive Skin",
    "Wrinkles",
    "Fine Lines",
    "Redness",
    "Uneven Skin Tone",
]

CONCERN_EXPLANATIONS = {
    "Acne": "Acne occurs when hair follicles become clogged with oil and dead skin cells, leading to pimples, blackheads, or cysts.",
    "Hyperpigmentation": "Hyperpigmentation is darkening of skin patches caused by excess melanin production, often triggered by UV exposure, inflammation, or hormonal changes.",
    "Dark Spots": "Dark spots (post-inflammatory hyperpigmentation) are flat, discolored areas left behind after acne, injury, or sun damage.",
    "Dry Skin": "Dry skin lacks sufficient moisture and natural oils, causing tightness, flaking, and a dull appearance.",
    "Oily Skin": "Oily skin produces excess sebum, leading to a shiny complexion, enlarged pores, and higher acne risk.",
    "Sensitive Skin": "Sensitive skin reacts easily to external triggers like products, temperature, or pollution with redness, itching, or burning.",
    "Wrinkles": "Wrinkles are creases and folds in the skin caused by collagen loss, dehydration, UV damage, and aging.",
    "Fine Lines": "Fine lines are early-stage superficial wrinkles around expressive areas like eyes and mouth, often reversible with proper skincare.",
    "Redness": "Skin redness may indicate rosacea, irritation, or broken capillaries, often worsened by heat, alcohol, spicy food, or harsh products.",
    "Uneven Skin Tone": "Uneven skin tone results from irregular melanin distribution, sun damage, scarring, or dehydration.",
}

SEVERITY_LABELS = {
    "Critical": (7, 10),
    "Moderate": (4, 6),
    "Low": (1, 3),
    "None": (0, 0),
}


class AssessmentEngine:
    """
    Deterministic rule-based skin assessment engine with ML & AI Vision Camera Texture integration.

    Usage:
        engine = AssessmentEngine(profile_dict, lifestyle_stats_dict, texture_dict)
        result = engine.run()
    """

    def __init__(
        self,
        profile: Dict[str, Any],
        lifestyle_stats: Optional[Dict[str, Any]] = None,
        texture_data: Optional[Dict[str, Any]] = None,
    ):
        """
        Args:
            profile: SkinProfile dict with keys:
                skin_type, age_group, skin_concerns, allergies, sensitivities
            lifestyle_stats: LifestyleLogStats dict with optional keys:
                avg_sleep_hours, avg_water_intake_ml, sunscreen_compliance_rate,
                avg_uv_exposure, avg_stress_level, total_logs
            texture_data: Optional SkinTextureAnalysis dict with vision scan scores:
                overall_texture_score, smoothness_score, roughness_score,
                pore_visibility_score, pore_density_score, oiliness_shine_score,
                redness_erythema_score, fine_lines_score, texture_type, primary_concern
        """
        self.skin_type = profile.get("skin_type", "Normal")
        self.age_group = profile.get("age_group", "25-34")
        self.skin_concerns = [c.lower() for c in profile.get("skin_concerns", [])]
        self.allergies = profile.get("allergies", [])
        self.sensitivities = profile.get("sensitivities", [])

        stats = lifestyle_stats or {}
        self.avg_sleep = stats.get("avg_sleep_hours", 7.0)
        self.avg_water = stats.get("avg_water_intake_ml", 2000)
        self.sunscreen_rate = stats.get("sunscreen_compliance_rate", 50)
        self.avg_uv = stats.get("avg_uv_exposure", "Low")
        self.avg_stress = stats.get("avg_stress_level", "Low")
        self.total_logs = stats.get("total_logs", 0)
        self.texture_data = texture_data

    # ----------------------------------------------------------
    # PUBLIC: run full assessment
    # ----------------------------------------------------------

    def run(self) -> Dict[str, Any]:
        """Run full assessment and return structured result dict."""
        concern_analysis = self._score_all_concerns()
        risk_factors = self._identify_risk_factors()
        score_breakdown = self._compute_score_breakdown()

        # Compute overall score strictly from the 5-factor weighted breakdown
        # ensuring full alignment with vision texture score and breakdown items
        overall_score = round(sum(
            f["weighted_contribution"] for f in score_breakdown.values()
        ), 1)

        return {
            "overall_score": overall_score,
            "score_breakdown": score_breakdown,
            "concern_analysis": concern_analysis,
            "risk_factors": risk_factors,
            "lifestyle_snapshot": {
                "avg_sleep_hours": self.avg_sleep,
                "avg_water_intake_ml": self.avg_water,
                "sunscreen_compliance_rate": self.sunscreen_rate,
                "avg_uv_exposure": self.avg_uv,
                "avg_stress_level": self.avg_stress,
                "total_logs": self.total_logs,
            },
            "summary": self._generate_summary(overall_score, concern_analysis, risk_factors),
        }

    # ----------------------------------------------------------
    # CONCERN SCORING
    # ----------------------------------------------------------

    def _score_all_concerns(self) -> List[Dict[str, Any]]:
        """Score every concern and return sorted list (highest severity first)."""
        results = []
        for concern in ALL_CONCERNS:
            score, modifiers = self._score_concern(concern)
            if score == 0:
                continue
            severity = self._get_severity_label(score)
            results.append({
                "concern": concern,
                "score": score,
                "severity": severity,
                "modifiers_applied": modifiers,
                "explanation": CONCERN_EXPLANATIONS.get(concern, ""),
                "recommended_focus": severity in ("Critical", "Moderate"),
            })

        results.sort(key=lambda x: x["score"], reverse=True)
        return results

    def _score_concern(self, concern: str) -> tuple[int, List[str]]:
        """Return (score 0-10, list of modifiers applied) for a single concern."""
        score = 0
        modifiers = []
        c = concern.lower()

        # 1. Explicit concern from profile (strongest signal)
        if c in self.skin_concerns:
            score += 4
            modifiers.append("Reported in your skin profile")

        # 2. Skin type affinity
        score, modifiers = self._apply_skin_type_modifier(c, score, modifiers)

        # 3. Age group modifiers
        score, modifiers = self._apply_age_modifier(c, score, modifiers)

        # 4. Lifestyle modifiers
        score, modifiers = self._apply_lifestyle_modifiers(c, score, modifiers)

        # 5. AI Vision Camera Texture modifiers
        score, modifiers = self._apply_texture_modifiers(c, score, modifiers)

        return min(score, 10), modifiers

    def _apply_texture_modifiers(self, concern: str, score: int, modifiers: List[str]):
        if not self.texture_data:
            return score, modifiers
        
        c = concern.lower()
        roughness = float(self.texture_data.get("roughness_score") or 0)
        redness = float(self.texture_data.get("redness_erythema_score") or 0)
        pores = float(self.texture_data.get("pore_visibility_score") or 0)
        pore_density = float(self.texture_data.get("pore_density_score") or 0)
        oiliness = float(self.texture_data.get("oiliness_shine_score") or 0)
        fine_lines = float(self.texture_data.get("fine_lines_score") or 0)
        overall_tex = float(self.texture_data.get("overall_texture_score") or 100)
        primary_concern = (self.texture_data.get("primary_concern") or "").lower()

        # If vision detected primary concern matching this
        if primary_concern and (primary_concern in c or c in primary_concern):
            score += 3
            modifiers.append(f"AI Vision Scan flagged as Primary Concern ({primary_concern.title()})")

        # Roughness / Overall Texture
        if c in ("uneven skin tone", "dry skin") and (roughness > 35 or overall_tex < 60):
            add = 3 if roughness > 50 else 2
            score += add
            modifiers.append(f"AI Camera Scan detected surface roughness ({roughness:.1f}%)")

        # Redness / Sensitivity
        if c in ("redness", "sensitive skin") and redness > 30:
            add = 3 if redness > 50 else 2
            score += add
            modifiers.append(f"AI Camera Scan detected vascular redness ({redness:.1f}%)")

        # Pores & Acne
        if c in ("acne", "oily skin") and (pores > 35 or pore_density > 35):
            add = 3 if pores > 50 else 2
            score += add
            modifiers.append(f"AI Camera Scan detected enlarged pore density ({pores:.1f}%)")

        # Oiliness
        if c == "oily skin" and oiliness > 40:
            add = 3 if oiliness > 60 else 2
            score += add
            modifiers.append(f"AI Camera Scan detected excess surface sebum/shine ({oiliness:.1f}%)")

        # Fine Lines & Wrinkles
        if c in ("fine lines", "wrinkles") and fine_lines > 30:
            add = 3 if fine_lines > 50 else 2
            score += add
            modifiers.append(f"AI Camera Scan detected micro-creasing/lines ({fine_lines:.1f}%)")

        return score, modifiers

    def _apply_skin_type_modifier(self, concern: str, score: int, modifiers: List[str]):
        st = self.skin_type.lower()
        mapping = {
            "oily": {"acne": 2, "oily skin": 3, "hyperpigmentation": 1, "uneven skin tone": 1},
            "dry":  {"dry skin": 3, "wrinkles": 2, "fine lines": 2, "uneven skin tone": 1},
            "combination": {"acne": 1, "oily skin": 1, "dry skin": 1},
            "sensitive": {"sensitive skin": 3, "redness": 2, "uneven skin tone": 1},
            "normal": {},
        }
        additions = mapping.get(st, {})
        add = additions.get(concern, 0)
        if add:
            score += add
            modifiers.append(f"{self.skin_type} skin type affinity")
        return score, modifiers

    def _apply_age_modifier(self, concern: str, score: int, modifiers: List[str]):
        ag = self.age_group.lower()
        add = 0
        if ag in ("under 18", "18-24") and concern == "acne":
            add = 2
            modifiers.append("Younger age group — higher acne prevalence")
        elif ag == "25-34":
            if concern in ("fine lines",):
                add = 1
                modifiers.append("Early signs of aging starting in this age group")
        elif ag == "35-44":
            if concern in ("fine lines", "wrinkles", "hyperpigmentation", "uneven skin tone"):
                add = 1
                modifiers.append("Mid-30s age group — collagen decline begins")
        elif ag in ("45-54", "55+"):
            if concern in ("wrinkles", "fine lines"):
                add = 2
                modifiers.append("Significant collagen loss in this age group")
            elif concern in ("hyperpigmentation", "dark spots"):
                add = 1
                modifiers.append("Cumulative sun damage more visible with age")
        if add:
            score += add
        return score, modifiers

    def _apply_lifestyle_modifiers(self, concern: str, score: int, modifiers: List[str]):
        # UV exposure without sunscreen
        uv = self.avg_uv or "Low"
        if uv in ("High", "Moderate") and self.sunscreen_rate < 60:
            if concern in ("hyperpigmentation", "dark spots", "uneven skin tone"):
                score += 2
                modifiers.append(f"{uv} UV exposure with low sunscreen use")
            elif concern in ("wrinkles", "fine lines"):
                score += 1
                modifiers.append(f"{uv} UV exposure accelerates aging")

        # Stress level
        stress = self.avg_stress or "Low"
        if stress == "High":
            if concern == "acne":
                score += 2
                modifiers.append("High stress elevates cortisol → acne flares")
            elif concern == "redness":
                score += 1
                modifiers.append("High stress can trigger skin inflammation")
        elif stress == "Medium":
            if concern == "acne":
                score += 1
                modifiers.append("Moderate stress can contribute to breakouts")

        # Sleep deprivation
        if self.avg_sleep < 6:
            if concern in ("dark spots", "fine lines"):
                score += 2
                modifiers.append("Poor sleep (<6h) impairs skin repair")
            elif concern in ("uneven skin tone",):
                score += 1
                modifiers.append("Sleep deprivation reduces skin cell regeneration")
        elif self.avg_sleep < 7:
            if concern == "dark spots":
                score += 1
                modifiers.append("Slightly low sleep can affect skin clarity")

        # Dehydration
        if self.avg_water < 1500:
            if concern == "dry skin":
                score += 2
                modifiers.append("Low water intake worsens skin dehydration")
            elif concern in ("fine lines", "uneven skin tone"):
                score += 1
                modifiers.append("Poor hydration reduces skin plumpness")
        elif self.avg_water < 2000:
            if concern == "dry skin":
                score += 1
                modifiers.append("Slightly low water intake affects moisture balance")

        return score, modifiers

    # ----------------------------------------------------------
    # RISK FACTOR IDENTIFICATION
    # ----------------------------------------------------------

    def _identify_risk_factors(self) -> List[Dict[str, str]]:
        """Identify actionable risk factors from lifestyle patterns & vision texture scan."""
        risks = []

        # AI Vision Texture scan risks
        if self.texture_data:
            overall_tex = float(self.texture_data.get("overall_texture_score") or 100)
            roughness = float(self.texture_data.get("roughness_score") or 0)
            redness = float(self.texture_data.get("redness_erythema_score") or 0)
            pores = float(self.texture_data.get("pore_visibility_score") or 0)
            oiliness = float(self.texture_data.get("oiliness_shine_score") or 0)

            if overall_tex < 60 or roughness > 45:
                risks.append({
                    "risk": "Compromised Surface Texture & Barrier",
                    "severity": "High" if overall_tex < 50 or roughness > 60 else "Moderate",
                    "description": f"AI Camera Scan recorded texture health of {overall_tex:.1f}/100 with roughness index of {roughness:.1f}%. The epidermal barrier exhibits noticeable micro-roughness.",
                    "recommended_action": "Incorporate barrier-restoring ceramides, panthenol, and gentle PHA exfoliation 1-2 times weekly to smooth surface irregularities.",
                })

            if redness > 40:
                risks.append({
                    "risk": "Elevated Facial Erythema / Reactivity",
                    "severity": "High" if redness > 65 else "Moderate",
                    "description": f"AI Camera Scan detected elevated vascular redness zones ({redness:.1f}%).",
                    "recommended_action": "Avoid harsh physical scrubs; prioritize Centella Asiatica (Cica), Azelaic Acid, and thermal soothing hydrators.",
                })

            if pores > 50 or oiliness > 60:
                risks.append({
                    "risk": "Sebaceous Congestion & Pore Clustering",
                    "severity": "Moderate",
                    "description": f"AI Camera Scan identified pore prominence of {pores:.1f}% and sebum shine of {oiliness:.1f}%.",
                    "recommended_action": "Use 2% BHA (Salicylic Acid) and Niacinamide 5% to regulate sebum flow and refine pore appearance.",
                })

        uv = self.avg_uv or "Low"
        # UV + no sunscreen
        if uv in ("High", "Moderate") and self.sunscreen_rate < 60:
            risks.append({
                "risk": "UV-Induced Damage",
                "severity": "High" if uv == "High" else "Moderate",
                "description": (
                    f"You have {uv} UV exposure but only apply sunscreen "
                    f"{self.sunscreen_rate:.0f}% of the time."
                ),
                "recommended_action": "Apply SPF 50+ broad-spectrum sunscreen every morning, even on cloudy days. Reapply every 2 hours outdoors.",
            })

        # High stress
        if self.avg_stress == "High":
            risks.append({
                "risk": "Stress-Related Skin Flares",
                "severity": "Moderate",
                "description": "Chronic high stress elevates cortisol, which triggers excess sebum production and systemic inflammation.",
                "recommended_action": "Incorporate stress management practices (meditation, exercise, sleep hygiene) and choose anti-inflammatory skincare ingredients.",
            })

        # Sleep deprivation
        if self.avg_sleep < 6:
            risks.append({
                "risk": "Skin Repair Deficit",
                "severity": "High",
                "description": f"You are averaging only {self.avg_sleep:.1f} hours of sleep. Skin regenerates primarily during deep sleep cycles.",
                "recommended_action": "Aim for 7–9 hours of sleep. Use a rich overnight moisturizer or sleeping mask to maximize nighttime skin repair.",
            })
        elif self.avg_sleep < 7:
            risks.append({
                "risk": "Suboptimal Skin Recovery",
                "severity": "Low",
                "description": f"Averaging {self.avg_sleep:.1f} hours of sleep — slightly below the recommended 7–9 hours.",
                "recommended_action": "Try to add 30–60 minutes of sleep and establish a consistent bedtime routine.",
            })

        # Dehydration
        if self.avg_water < 1500:
            risks.append({
                "risk": "Skin Dehydration",
                "severity": "High",
                "description": f"Daily water intake of {self.avg_water:.0f}ml is significantly below the recommended 2,000–2,500ml.",
                "recommended_action": "Increase daily water intake to at least 2 litres. Use hydrating serums with Hyaluronic Acid and Glycerin.",
            })
        elif self.avg_water < 2000:
            risks.append({
                "risk": "Mild Dehydration",
                "severity": "Low",
                "description": f"Water intake of {self.avg_water:.0f}ml/day is slightly below optimal levels.",
                "recommended_action": "Aim for 2,000–2,500ml of water per day for optimal skin hydration.",
            })

        # Sensitivity + many products
        if self.sensitivities and len(self.sensitivities) >= 3:
            risks.append({
                "risk": "High Sensitivity Reactivity",
                "severity": "Moderate",
                "description": f"You have reported {len(self.sensitivities)} sensitivities, which increases the risk of adverse reactions.",
                "recommended_action": "Patch-test all new products. Choose fragrance-free, minimal-ingredient formulas. Introduce new actives one at a time.",
            })

        # No logs recorded
        if self.total_logs < 3:
            risks.append({
                "risk": "Insufficient Lifestyle Data",
                "severity": "Low",
                "description": "Fewer than 3 lifestyle logs recorded — assessment accuracy is limited.",
                "recommended_action": "Log your lifestyle daily for at least 7 days to enable more accurate skin health analysis.",
            })

        return risks

    # ----------------------------------------------------------
    # SCORE BREAKDOWN (5-FACTOR MODEL)
    # ----------------------------------------------------------

    def _compute_score_breakdown(self) -> Dict[str, Dict[str, float]]:
        """
        Compute the 5-factor weighted skin health score breakdown.

        Weights:
          Skin Condition Assessment  35%
          Lifestyle Habits           20%
          Sleep Quality              15%
          Routine Consistency        20%
          Hydration Level            10%
        """
        # 1. Skin Condition Assessment (35%)
        if self.texture_data and self.texture_data.get("overall_texture_score") is not None:
            texture_score = float(self.texture_data["overall_texture_score"])
            # Use the original exact score from skin texture analysis directly
            condition_score = round(max(0.0, min(100.0, texture_score)), 1)
            condition_desc = f"Original AI Camera Texture Analysis score: {condition_score:.1f}/100."
        else:
            condition_score = 90.0
            condition_score -= len(self.skin_concerns) * 6
            condition_score -= len(self.sensitivities) * 4
            condition_score = max(25.0, min(100.0, condition_score))
            condition_desc = "Based on your reported skin type, concerns, and sensitivities."

        # 2. Lifestyle Habits (20%) — UV/stress-based
        lifestyle_score = 80
        uv = self.avg_uv or "Low"
        if uv == "High":
            lifestyle_score -= 20
        elif uv == "Moderate":
            lifestyle_score -= 10
        stress = self.avg_stress or "Low"
        if stress == "High":
            lifestyle_score -= 15
        elif stress == "Medium":
            lifestyle_score -= 5
        lifestyle_score = max(20, min(100, lifestyle_score))

        # 3. Sleep Quality (15%)
        sleep = self.avg_sleep
        if sleep >= 7 and sleep <= 9:
            sleep_score = 100
        elif sleep >= 6:
            sleep_score = 80
        elif sleep >= 5:
            sleep_score = 55
        else:
            sleep_score = 30

        # 4. Routine Consistency (20%) — sunscreen compliance
        routine_score = max(0, min(100, self.sunscreen_rate))

        # 5. Hydration Level (10%)
        water = self.avg_water
        if water >= 2500:
            hydration_score = 100
        elif water >= 2000:
            hydration_score = 85
        elif water >= 1500:
            hydration_score = 65
        elif water >= 1000:
            hydration_score = 45
        else:
            hydration_score = 25

        breakdown = {
            "Skin Condition Assessment": {
                "raw_score": round(condition_score, 1),
                "weight": 0.35,
                "weighted_contribution": round(condition_score * 0.35, 2),
                "description": condition_desc,
            },
            "Lifestyle Habits": {
                "raw_score": round(lifestyle_score, 1),
                "weight": 0.20,
                "weighted_contribution": round(lifestyle_score * 0.20, 2),
                "description": "Reflects UV exposure levels and daily stress impact on skin.",
            },
            "Sleep Quality": {
                "raw_score": round(sleep_score, 1),
                "weight": 0.15,
                "weighted_contribution": round(sleep_score * 0.15, 2),
                "description": f"Computed from your average of {self.avg_sleep:.1f} hours/night.",
            },
            "Routine Consistency": {
                "raw_score": round(routine_score, 1),
                "weight": 0.20,
                "weighted_contribution": round(routine_score * 0.20, 2),
                "description": f"Based on sunscreen compliance rate of {self.sunscreen_rate:.0f}%.",
            },
            "Hydration Level": {
                "raw_score": round(hydration_score, 1),
                "weight": 0.10,
                "weighted_contribution": round(hydration_score * 0.10, 2),
                "description": f"Derived from your average daily intake of {self.avg_water:.0f}ml.",
            },
        }
        return breakdown

    # ----------------------------------------------------------
    # SUMMARY GENERATION
    # ----------------------------------------------------------

    def _generate_summary(self, score: float, concerns: List[Dict], risks: List[Dict]) -> str:
        critical = [c["concern"] for c in concerns if c["severity"] == "Critical"]
        high_risks = [r["risk"] for r in risks if r["severity"] == "High"]

        if score >= 85:
            base = "Your skin is in excellent health."
        elif score >= 70:
            base = "Your skin is in good overall condition."
        elif score >= 55:
            base = "Your skin is in fair condition with room for improvement."
        else:
            base = "Your skin needs dedicated care and lifestyle adjustments."

        if critical:
            base += f" Primary concerns to address: {', '.join(critical)}."
        if high_risks:
            base += f" Critical lifestyle risks: {', '.join(high_risks)}."

        return base

    # ----------------------------------------------------------
    # UTILITY
    # ----------------------------------------------------------

    @staticmethod
    def _get_severity_label(score: int) -> str:
        if score >= 7:
            return "Critical"
        elif score >= 4:
            return "Moderate"
        elif score >= 1:
            return "Low"
        return "None"
