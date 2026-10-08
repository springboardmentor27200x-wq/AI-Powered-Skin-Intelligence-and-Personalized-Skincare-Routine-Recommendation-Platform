from typing import Any, Dict, List, Optional


class ScoreEngine:
    """
    Computes the 5-pillar Skin Health Score using the official project formula:
    Overall Score = 35% Condition + 20% Lifestyle + 15% Sleep + 20% Routine Consistency + 10% Hydration.
    """

    WEIGHT_SKIN_CONDITION = 0.35
    WEIGHT_LIFESTYLE = 0.20
    WEIGHT_SLEEP = 0.15
    WEIGHT_ROUTINE_CONSISTENCY = 0.20
    WEIGHT_HYDRATION = 0.10

    ROUTINE_CONSISTENCY_BASELINE = 50  # Documented neutral baseline for Milestone 2

    @classmethod
    def calculate_scores(
        cls,
        concerns: List[Dict[str, Any]],
        lifestyle_record: Optional[Any] = None,
        sleep_record: Optional[Any] = None,
        hydration_record: Optional[Any] = None,
        routine_adherence_score: Optional[int] = None,
    ) -> Dict[str, Any]:
        # 1. Skin Condition Score (35%)
        # Baseline 100 minus concern severity penalties
        condition_penalty = 0.0
        for c in concerns:
            sev = c.get("severity", 50)
            prio = c.get("priority", "MEDIUM")
            if prio == "HIGH":
                condition_penalty += sev * 0.35
            elif prio == "MEDIUM":
                condition_penalty += sev * 0.18
            else:
                condition_penalty += sev * 0.08

        skin_condition_score = int(min(100, max(20, round(100 - condition_penalty))))

        # 2. Lifestyle Score (20%)
        if lifestyle_record:
            l_score = 80

            # Physical activity
            act = (lifestyle_record.physical_activity or "MODERATE").upper()
            if act == "ACTIVE":
                l_score += 10
            elif act == "MODERATE":
                l_score += 5
            elif act == "SEDENTARY":
                l_score -= 12

            # Smoking
            smk = (lifestyle_record.smoking or "NONE").upper()
            if smk in ["HEAVY", "REGULAR"]:
                l_score -= 28
            elif smk == "LIGHT":
                l_score -= 15
            else:
                l_score += 5

            # Alcohol
            alc = (lifestyle_record.alcohol or "NONE").upper()
            if alc in ["HEAVY", "REGULAR"]:
                l_score -= 22
            elif alc == "LIGHT":
                l_score -= 8
            else:
                l_score += 5

            # Stress Level (1 - 10)
            stress = lifestyle_record.stress_level
            if stress is not None:
                if stress <= 3:
                    l_score += 8
                elif stress >= 8:
                    l_score -= 20
                elif stress >= 6:
                    l_score -= 10

            lifestyle_score = int(min(100, max(15, l_score)))
        else:
            lifestyle_score = 70  # Neutral baseline

        # 3. Sleep Score (15%)
        if sleep_record:
            duration = sleep_record.duration_minutes
            quality = (sleep_record.quality or "GOOD").upper()

            # Base on duration (ideal: 420 - 540 minutes, i.e. 7 - 9 hours)
            if duration is not None:
                if 420 <= duration <= 540:
                    s_base = 95
                elif 360 <= duration < 420:
                    s_base = 78
                elif duration > 540:
                    s_base = 82
                elif 300 <= duration < 360:
                    s_base = 60
                else:  # under 5 hours
                    s_base = 40
            else:
                s_base = 75

            # Adjustment for quality
            if quality == "EXCELLENT":
                s_base += 5
            elif quality == "FAIR":
                s_base -= 15
            elif quality == "POOR":
                s_base -= 25

            sleep_score = int(min(100, max(20, s_base)))
        else:
            sleep_score = 70  # Neutral baseline

        # 4. Routine Consistency Score (20%)
        if routine_adherence_score is not None:
            routine_consistency_score = int(min(100, max(15, routine_adherence_score)))
        else:
            routine_consistency_score = cls.ROUTINE_CONSISTENCY_BASELINE

        # 5. Hydration Score (10%)
        if hydration_record:
            intake = hydration_record.water_intake_ml
            target = max(1, hydration_record.target_water_ml or 2000)
            hydration_score = int(min(100, max(10, round((intake / target) * 100))))
        else:
            hydration_score = 65  # Neutral baseline

        # 6. Overall Weighted Skin Health Score
        overall_score = int(round(
            (skin_condition_score * cls.WEIGHT_SKIN_CONDITION)
            + (lifestyle_score * cls.WEIGHT_LIFESTYLE)
            + (sleep_score * cls.WEIGHT_SLEEP)
            + (routine_consistency_score * cls.WEIGHT_ROUTINE_CONSISTENCY)
            + (hydration_score * cls.WEIGHT_HYDRATION)
        ))
        overall_score = min(100, max(15, overall_score))

        # 7. Generate Explainability Breakdown
        pillars = {
            "Skin Condition": skin_condition_score,
            "Lifestyle Habits": lifestyle_score,
            "Sleep Quality": sleep_score,
            "Hydration Level": hydration_score,
            "Routine Consistency": routine_consistency_score,
        }

        strong_pillars = [
            f"{name} ({score}/100)" for name, score in pillars.items() if score >= 70
        ]
        improvement_areas = [
            f"{name} ({score}/100)" for name, score in pillars.items() if score < 70
        ]

        if overall_score >= 80:
            summary = "Excellent skin health with resilient barrier function and well-aligned lifestyle habits."
        elif overall_score >= 65:
            summary = "Good overall skin condition with minor areas of lifestyle or environmental stress to optimize."
        elif overall_score >= 50:
            summary = "Moderate skin barrier compromise; targeted topical intervention and hydration adjustments recommended."
        else:
            summary = "Significant barrier stress detected; prioritize gentle barrier recovery and restorative lifestyle habits."

        explanation = {
            "strong_pillars": strong_pillars,
            "improvement_areas": improvement_areas,
            "summary": summary,
            "weights": {
                "skin_condition": f"{int(cls.WEIGHT_SKIN_CONDITION * 100)}%",
                "lifestyle": f"{int(cls.WEIGHT_LIFESTYLE * 100)}%",
                "sleep": f"{int(cls.WEIGHT_SLEEP * 100)}%",
                "routine_consistency": f"{int(cls.WEIGHT_ROUTINE_CONSISTENCY * 100)}%",
                "hydration": f"{int(cls.WEIGHT_HYDRATION * 100)}%",
            },
            "routine_consistency_note": "Initial baseline of 50/100 utilized pending multi-week routine logging in Milestone 3.",
        }

        return {
            "skin_condition_score": skin_condition_score,
            "lifestyle_score": lifestyle_score,
            "sleep_score": sleep_score,
            "routine_consistency_score": routine_consistency_score,
            "hydration_score": hydration_score,
            "overall_score": overall_score,
            "explanation": explanation,
        }
