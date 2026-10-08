from datetime import date, datetime, timedelta, timezone
from typing import List, Optional
from app.db.session import get_next_id

class ProgressService:
    @staticmethod
    def log_adherence(db, user_id: int, log_date: str, morning: bool, evening: bool, notes: str) -> dict:
        now = datetime.now(timezone.utc)
        target_date = log_date or str(date.today())
        
        existing = db["routine_adherence_logs"].find_one({"user_id": user_id, "log_date": target_date})
        log_id = existing["id"] if existing and "id" in existing else get_next_id(db, "routine_adherence_logs")
        
        doc = {
            "id": log_id,
            "user_id": user_id,
            "log_date": target_date,
            "morning_completed": morning,
            "evening_completed": evening,
            "notes": notes,
            "created_at": existing.get("created_at", now) if existing else now
        }
        
        db["routine_adherence_logs"].update_one(
            {"user_id": user_id, "log_date": target_date},
            {"$set": doc},
            upsert=True
        )
        return doc
        
    @staticmethod
    def get_progress_analytics(db, user_id: int, days: int = 30) -> dict:
        start_date = str(date.today() - timedelta(days=days))
        
        # 1. Fetch Adherence Logs
        adherence_cursor = db["routine_adherence_logs"].find({
            "user_id": user_id,
            "log_date": {"$gte": start_date}
        }).sort("log_date", 1)
        
        adherence_logs = list(adherence_cursor)
        
        total_routines_possible = days * 2 # Morning and evening
        routines_completed = sum(1 for log in adherence_logs if log.get("morning_completed")) + \
                             sum(1 for log in adherence_logs if log.get("evening_completed"))
                             
        adherence_rate = (routines_completed / total_routines_possible) * 100 if total_routines_possible > 0 else 0
        
        # 2. Fetch Score History
        score_cursor = db["skin_scores"].find({
            "user_id": user_id,
            "evaluated_at": {"$gte": datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)}
        }).sort("evaluated_at", 1)
        
        score_history = []
        for s in score_cursor:
            score_history.append({
                "date": s["evaluated_at"].strftime("%Y-%m-%d"),
                "overall_score": s["overall_score"]
            })
            
        return {
            "user_id": user_id,
            "adherence_rate": round(adherence_rate, 1),
            "adherence_logs": [
                {
                    "date": log["log_date"],
                    "morning_completed": log.get("morning_completed", False),
                    "evening_completed": log.get("evening_completed", False),
                    "notes": log.get("notes")
                } for log in adherence_logs
            ],
            "score_history": score_history,
            "generated_at": datetime.now(timezone.utc)
        }


    @staticmethod
    def get_improvement_analysis(db, user_id: int) -> dict:
        scores = list(db["skin_scores"].find({"user_id": user_id}).sort("evaluated_at", 1))
        if len(scores) < 2:
            return {"status": "Not enough data for improvement analysis"}
        
        first, last = scores[0], scores[-1]
        improvement = last["overall_score"] - first["overall_score"]
        return {
            "overall_improvement": round(improvement, 2),
            "trend": "improving" if improvement > 0 else "declining" if improvement < 0 else "stable"
        }

    @staticmethod
    def get_before_after_comparison(db, user_id: int, date1: str, date2: str) -> dict:
        from datetime import datetime
        d1 = datetime.strptime(date1, "%Y-%m-%d")
        d2 = datetime.strptime(date2, "%Y-%m-%d")
        
        score1 = db["skin_scores"].find_one({"user_id": user_id, "evaluated_at": {"$gte": d1}})
        score2 = db["skin_scores"].find_one({"user_id": user_id, "evaluated_at": {"$gte": d2}})
        
        return {
            "before": score1.get("overall_score") if score1 else None,
            "after": score2.get("overall_score") if score2 else None,
            "difference": (score2["overall_score"] - score1["overall_score"]) if score1 and score2 else None
        }

    @staticmethod
    def get_trend_analysis(db, user_id: int) -> dict:
        scores = list(db["skin_scores"].find({"user_id": user_id}).sort("evaluated_at", 1).limit(10))
        if not scores: return {"trends": []}
        
        trend_data = [s["overall_score"] for s in scores]
        is_upward = all(x <= y for x, y in zip(trend_data, trend_data[1:]))
        return {"trend": "Consistent upward progress" if is_upward else "Fluctuating", "recent_scores": trend_data}

progress_service = ProgressService()
