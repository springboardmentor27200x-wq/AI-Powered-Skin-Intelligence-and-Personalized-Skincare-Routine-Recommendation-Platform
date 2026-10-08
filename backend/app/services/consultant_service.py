from typing import List

class ConsultantService:
    def get_all_clients(self, db) -> List[dict]:
        """Fetch all users and their basic info, pretending we are a consultant."""
        clients = list(db["users"].find({}, {"password_hash": 0}))
        
        # Hydrate with profile info
        for client in clients:
            client["id"] = client["_id"]
            del client["_id"]
            profile = db["profiles"].find_one({"user_id": client["id"]})
            client["skin_type"] = profile["skin_type"] if profile else "Unknown"
            client["concerns"] = profile["concerns"] if profile else []
            
            # Get latest score
            score = db["skin_scores"].find_one({"user_id": client["id"]}, sort=[("evaluated_at", -1)])
            client["latest_score"] = score["overall_score"] if score else None
            
        return clients

    def get_client_details(self, db, client_id: int) -> dict:
        client = db["users"].find_one({"_id": client_id}, {"password_hash": 0})
        if not client:
            return None
            
        client["id"] = client["_id"]
        del client["_id"]
        
        profile = db["profiles"].find_one({"user_id": client_id})
        if profile and "_id" in profile: del profile["_id"]
        
        assessments = list(db["skin_assessments"].find({"user_id": client_id}).sort("created_at", -1))
        for a in assessments:
            if "_id" in a: del a["_id"]
            
        scores = list(db["skin_scores"].find({"user_id": client_id}).sort("evaluated_at", -1))
        for s in scores:
            if "_id" in s: del s["_id"]
            
        routine = db["routines"].find_one({"user_id": client_id, "is_active": True})
        if routine and "_id" in routine: del routine["_id"]
        
        return {
            "client": client,
            "profile": profile,
            "assessments": assessments,
            "scores": scores,
            "active_routine": routine
        }
        
    def add_recommendation_note(self, db, client_id: int, note: str):
        from datetime import datetime, timezone
        db["profiles"].update_one(
            {"user_id": client_id},
            {"$push": {"consultant_notes": {"note": note, "date": datetime.now(timezone.utc).isoformat()}}},
            upsert=True
        )
        return {"status": "success", "message": "Recommendation note added."}

consultant_service = ConsultantService()
