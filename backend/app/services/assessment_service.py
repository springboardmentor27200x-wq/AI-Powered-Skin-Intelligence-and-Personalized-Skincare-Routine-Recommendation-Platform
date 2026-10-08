from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, status
from app.db.session import get_next_id
from app.schemas.assessment import SkinAssessmentCreate, SkinHealthScore

class AssessmentService:
    @staticmethod
    def evaluate_profile(db, user_id: int, profile: dict, season: str) -> dict:
        now = datetime.now(timezone.utc)
        
        # Simple algorithm to determine priority concerns based on the profile
        concerns = profile.get("concerns", [])
        prioritized = []
        
        for idx, concern in enumerate(concerns):
            priority = idx + 1
            severity = "Moderate"
            if "acne" in concern.lower():
                severity = "Severe"
                priority = 1
            prioritized.append({
                "concern": concern,
                "severity": severity,
                "priority": priority,
                "reasoning": f"Based on profile indicating {concern}"
            })
            
        prioritized.sort(key=lambda x: x["priority"])
        
        # Calculate High Risk Factors
        high_risk_factors = []
        
        stress_level = profile.get("stress_level", 5)
        if stress_level >= 8:
            high_risk_factors.append("High Stress (High risk)")
        elif stress_level >= 6:
            high_risk_factors.append("Moderate Stress (Mid risk)")
            
        water_intake = profile.get("baseline_water_intake_ml", 2000)
        if water_intake < 1500:
            high_risk_factors.append("Chronic Dehydration (High risk)")
        elif water_intake < 2000:
            high_risk_factors.append("Suboptimal Hydration (Low risk)")
            
        sleep_hours = profile.get("baseline_sleep_hours", 7.0)
        if sleep_hours < 6.0:
            high_risk_factors.append("Sleep Deprivation (High risk)")
        elif sleep_hours < 7.0:
            high_risk_factors.append("Mild Sleep Deficit (Mid risk)")
            
        sun_exposure = profile.get("sun_exposure_level", "")
        if "High" in sun_exposure or "Extreme" in sun_exposure:
            high_risk_factors.append("High Sun Exposure (High risk)")
        elif "Moderate" in sun_exposure:
            high_risk_factors.append("Moderate Sun Exposure (Mid risk)")
            
        working_routine = profile.get("working_routine", "")
        if "Outdoor" in working_routine or "Active field work" in working_routine:
            high_risk_factors.append("Outdoor Environmental Exposure (Mid risk)")
        elif "Night shifts" in working_routine:
            high_risk_factors.append("Circadian Rhythm Disruption (High risk)")
            
        climate = profile.get("climate_type", "")
        if "Arid & Desert" in climate:
            high_risk_factors.append("Extreme Dry Climate (Low risk)")
            
        allergies = profile.get("allergies", [])
        sensitivities = profile.get("sensitivities", [])
        if len(allergies) + len(sensitivities) >= 3:
            high_risk_factors.append("High Sensitization Risk (High risk)")
            
        # Add risk factors based on concerns
        for concern in concerns:
            lower_concern = concern.lower()
            if "dark spot" in lower_concern or "pigmentation" in lower_concern or "melasma" in lower_concern:
                high_risk_factors.append(f"{concern} (High risk)")
            elif "pimple" in lower_concern or "acne" in lower_concern or "breakout" in lower_concern:
                high_risk_factors.append(f"{concern} (Mid risk)")
            elif "dry" in lower_concern or "dehydrated" in lower_concern or "flaky" in lower_concern:
                high_risk_factors.append(f"{concern} (Low risk)")
            elif "wrinkle" in lower_concern or "aging" in lower_concern:
                high_risk_factors.append(f"{concern} (Mid risk)")
            elif "redness" in lower_concern or "rosacea" in lower_concern:
                high_risk_factors.append(f"{concern} (Mid risk)")
            else:
                high_risk_factors.append(f"{concern} (Mid risk)")
        
        doc = {
            "id": get_next_id(db, "skin_assessments"),
            "user_id": user_id,
            "prioritized_concerns": prioritized[:3], # Top 3
            "high_risk_factors": high_risk_factors,
            "overall_health_summary": f"Your skin needs attention for {len(concerns)} concerns during the {season} season.",
            "season": season,
            "created_at": now,
            "updated_at": now
        }
        
        db["skin_assessments"].insert_one(doc)
        return doc

    @staticmethod
    def get_latest_assessment(db, user_id: int) -> Optional[dict]:
        return db["skin_assessments"].find_one({"user_id": user_id}, sort=[("created_at", -1)])

    @staticmethod
    def calculate_score(db, user_id: int, profile: dict) -> dict:
        # Dynamic calculation based on profile data
        concerns = profile.get("concerns", [])
        stress = profile.get("stress_level", 5)
        sleep = profile.get("baseline_sleep_hours", 7.0)
        water = profile.get("baseline_water_intake_ml", 2000)
        
        condition_score = max(0, 100.0 - (len(concerns) * 12.0))
        lifestyle_score = max(0, 100.0 - (stress * 5.0))
        sleep_score = min(100.0, (sleep / 8.0) * 100.0)
        hydration_score = min(100.0, (water / 2500.0) * 100.0)
        routine_score = 85.0 # Updated baseline for now (dynamic score from progress)
        
        def get_impact(score):
            if score >= 80: return "Excellent"
            if score >= 60: return "Good"
            return "Needs Improvement"
            
        overall = (condition_score * 0.35) + (lifestyle_score * 0.20) + (sleep_score * 0.15) + (routine_score * 0.20) + (hydration_score * 0.10)
        
        now = datetime.now(timezone.utc)
        
        doc = {
            "id": get_next_id(db, "skin_scores"),
            "user_id": user_id,
            "overall_score": round(overall, 2),
            "condition_score": {"score": condition_score, "impact": get_impact(condition_score)},
            "lifestyle_score": {"score": lifestyle_score, "impact": get_impact(lifestyle_score)},
            "sleep_score": {"score": sleep_score, "impact": get_impact(sleep_score)},
            "routine_score": {"score": routine_score, "impact": get_impact(routine_score)},
            "hydration_score": {"score": hydration_score, "impact": get_impact(hydration_score)},
            "skin_improvement_score": {"score": 80.0, "impact": "Good"},
            "evaluated_at": now
        }
        db["skin_scores"].insert_one(doc)
        return doc
        
    @staticmethod
    def get_latest_score(db, user_id: int) -> Optional[dict]:
        return db["skin_scores"].find_one({"user_id": user_id}, sort=[("evaluated_at", -1)])

assessment_service = AssessmentService()
