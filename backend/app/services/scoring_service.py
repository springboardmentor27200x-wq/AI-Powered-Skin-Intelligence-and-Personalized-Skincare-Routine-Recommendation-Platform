from typing import Dict
from app.db.session import get_db

class ScoringService:
    @staticmethod
    def calculate_skin_health_score(db, user_id: int) -> dict:
        # Mock data retrieval for scoring
        # In a real app, this would query skin_profiles, lifestyle_logs, sleep_logs, hydration_logs, and routine_adherence_logs
        
        # 1. Skin Condition Assessment (35%)
        # Base score on profile concerns and baseline
        skin_condition_score = 85.0
        
        # 2. Lifestyle Habits (20%)
        # Base score on stress levels, environmental exposure, diet
        lifestyle_score = 75.0
        
        # 3. Sleep Quality (15%)
        # Base score on sleep logs (duration, quality)
        sleep_score = 90.0
        
        # 4. Routine Consistency (20%)
        # Base score on adherence rate
        from app.services.progress_service import progress_service
        analytics = progress_service.get_progress_analytics(db, user_id, days=7)
        routine_score = analytics.get("adherence_rate", 50.0)
        
        # 5. Hydration Level (10%)
        # Base score on water intake logs
        hydration_score = 80.0
        
        # Calculate Weighted Score
        weighted_score = (
            (skin_condition_score * 0.35) +
            (lifestyle_score * 0.20) +
            (sleep_score * 0.15) +
            (routine_score * 0.20) +
            (hydration_score * 0.10)
        )
        
        # Calculate improvement (difference from a previous mock score)
        # Assuming previous score was a bit lower
        previous_score = weighted_score - 4.5
        improvement_score = weighted_score - previous_score
        
        # Save score to db
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        
        doc = {
            "user_id": user_id,
            "evaluated_at": now,
            "overall_score": round(weighted_score, 1),
            "breakdown": {
                "skin_condition": round(skin_condition_score, 1),
                "lifestyle": round(lifestyle_score, 1),
                "sleep": round(sleep_score, 1),
                "routine": round(routine_score, 1),
                "hydration": round(hydration_score, 1)
            }
        }
        
        db["skin_scores"].insert_one(doc)
        
        return {
            "overall_score": round(weighted_score, 1),
            "skin_condition_score": round(skin_condition_score, 1),
            "lifestyle_impact_score": round(lifestyle_score, 1),
            "sleep_quality_score": round(sleep_score, 1),
            "routine_adherence_score": round(routine_score, 1),
            "hydration_level_score": round(hydration_score, 1),
            "skin_improvement_score": round(improvement_score, 1),
            "weights": {
                "skin_condition": "35%",
                "lifestyle": "20%",
                "sleep": "15%",
                "routine": "20%",
                "hydration": "10%"
            }
        }

scoring_service = ScoringService()
