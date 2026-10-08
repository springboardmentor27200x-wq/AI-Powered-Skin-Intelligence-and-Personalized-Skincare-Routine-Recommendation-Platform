from datetime import datetime, timezone
from typing import Optional, List
from fastapi import HTTPException, status
from app.models.profile import SkinTypeEnum
from app.schemas.profile import SkinProfileCreate, SkinProfileUpdate
from app.db.session import get_next_id

class ProfileService:
    @staticmethod
    def get_profile_by_user_id(db, user_id: int) -> Optional[dict]:
        return db["skin_profiles"].find_one({"user_id": user_id})

    @staticmethod
    def create_or_update_profile(db, user_id: int, data: SkinProfileCreate) -> dict:
        now = datetime.now(timezone.utc)
        skin_type_val = data.skin_type.value if hasattr(data.skin_type, "value") else str(data.skin_type)
        
        existing = db["skin_profiles"].find_one({"user_id": user_id})
        profile_id = existing["id"] if existing and "id" in existing else get_next_id(db, "skin_profiles")
        
        doc = {
            "id": profile_id,
            "user_id": user_id,
            "age": data.age,
            "age_group": data.age_group,
            "skin_type": skin_type_val,
            "oil_characteristics": data.oil_characteristics,
            "concerns": data.concerns,
            "allergies": data.allergies,
            "sensitivities": data.sensitivities,
            "skin_goals": data.skin_goals,
            "working_routine": data.working_routine,
            "exercise_frequency": data.exercise_frequency,
            "exercise_duration_mins": data.exercise_duration_mins,
            "stress_level": data.stress_level,
            "baseline_water_intake_ml": data.baseline_water_intake_ml,
            "baseline_sleep_hours": data.baseline_sleep_hours,
            "sun_exposure_level": data.sun_exposure_level,
            "climate_type": data.climate_type,
            "notes": data.notes,
            "updated_at": now
        }
        
        if existing:
            db["skin_profiles"].update_one({"user_id": user_id}, {"$set": doc})
            doc["created_at"] = existing.get("created_at", now)
        else:
            doc["created_at"] = now
            db["skin_profiles"].insert_one(doc)
            
        return doc

    @staticmethod
    def update_profile_partial(db, user_id: int, data: SkinProfileUpdate) -> dict:
        existing = db["skin_profiles"].find_one({"user_id": user_id})
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Skin profile not found for this user. Please complete initial assessment first.",
            )
        
        now = datetime.now(timezone.utc)
        update_data = {"updated_at": now}
        
        dump = data.model_dump(exclude_unset=True)
        for k, v in dump.items():
            if v is not None:
                if k == "skin_type" and hasattr(v, "value"):
                    update_data[k] = v.value
                else:
                    update_data[k] = v

        db["skin_profiles"].update_one({"user_id": user_id}, {"$set": update_data})
        updated = db["skin_profiles"].find_one({"user_id": user_id})
        return updated

profile_service = ProfileService()
