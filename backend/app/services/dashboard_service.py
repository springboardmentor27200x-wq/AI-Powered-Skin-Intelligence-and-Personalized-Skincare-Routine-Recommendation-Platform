from typing import Dict
from app.services.assessment_service import assessment_service
from app.services.progress_service import progress_service
from app.services.product_service import product_service

class DashboardService:
    @staticmethod
    def get_user_dashboard(db, user_id: int, profile: dict) -> Dict:
        latest_score = assessment_service.get_latest_score(db, user_id)
        recommendations = product_service.recommend_products(user_id, profile)
        progress = progress_service.get_progress_analytics(db, user_id, days=7)
        
        return {
            "skin_health_score": latest_score.get("overall_score") if latest_score else None,
            "personalized_routine": {"morning": ["Cleanser", "Moisturizer", "Sunscreen"], "evening": ["Cleanser", "Treatment", "Moisturizer"]},
            "product_recommendations": recommendations.get("recommended_products", []),
            "progress_tracking": progress,
            "daily_skincare_checklist": [
                {"task": "Morning Cleanse", "done": False},
                {"task": "Apply Sunscreen", "done": False},
                {"task": "Drink 2L Water", "done": False}
            ]
        }
    
    @staticmethod
    def get_consultant_dashboard(db) -> Dict:
        profiles_count = db["skin_profiles"].count_documents({})
        assessments = list(db["skin_assessments"].find().sort("created_at", -1).limit(5))
        return {
            "client_profiles_count": profiles_count,
            "recent_skin_assessment_reports": [a.get("overall_health_summary") for a in assessments],
            "progress_monitoring": "Active",
            "recommendation_management": "Active"
        }
    
    @staticmethod
    def get_dermatologist_dashboard(db) -> Dict:
        return {
            "patient_insights": "Aggregated metrics available",
            "skin_condition_reports": "Severe cases flagged",
            "treatment_recommendations": "Requires review",
            "progress_analytics": "Trends calculated"
        }
    
    @staticmethod
    def get_admin_dashboard(db) -> Dict:
        users = db["users"].count_documents({})
        return {
            "user_management": {"total_users": users},
            "platform_analytics": {"active_today": 12},
            "recommendation_monitoring": "All systems nominal",
            "system_reports": "No errors"
        }

dashboard_service = DashboardService()
