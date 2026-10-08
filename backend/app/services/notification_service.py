from typing import List, Dict
from datetime import datetime, timezone

class NotificationService:
    @staticmethod
    def get_notifications(db, user_id: int) -> List[Dict]:
        now = datetime.now(timezone.utc)
        hour = now.hour
        notifications = []
        
        # Routine reminders
        if 6 <= hour <= 9:
            notifications.append({"type": "Routine Reminder", "message": "Time for your morning skincare routine!"})
        elif 19 <= hour <= 23:
            notifications.append({"type": "Routine Reminder", "message": "Time for your evening skincare routine!"})
            
        # Hydration reminder (Check logs)
        today = str(now.date())
        hyd_log = db["hydration_logs"].find_one({"user_id": user_id, "log_date": today})
        if not hyd_log or hyd_log.get("water_amount_ml", 0) < 1000 and hour > 14:
            notifications.append({"type": "Hydration Reminder", "message": "You are behind on your water intake today. Drink up!"})
            
        # Sleep reminder
        if 21 <= hour <= 23:
            notifications.append({"type": "Sleep Reminder", "message": "Wind down soon to get your 8 hours of sleep!"})
            
        # Product Replenishment (Simulated check)
        notifications.append({"type": "Product Replenishment", "message": "Based on your usage, your Cleanser might run out in 5 days."})
        
        # Progress alerts
        score = db["skin_scores"].find_one({"user_id": user_id}, sort=[("evaluated_at", -1)])
        if score and score.get("overall_score", 0) > 80:
            notifications.append({"type": "Progress Alert", "message": "Great job! Your skin health score is excellent."})
            
        return notifications

notification_service = NotificationService()
