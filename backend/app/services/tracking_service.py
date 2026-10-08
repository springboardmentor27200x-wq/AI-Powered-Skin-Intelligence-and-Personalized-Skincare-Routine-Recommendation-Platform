from datetime import date, datetime, timedelta, timezone
from typing import List, Optional
from app.models.tracking import SleepQualityEnum
from app.schemas.tracking import (
    LifestyleLogCreate,
    SleepLogCreate,
    HydrationLogCreate,
    EnvironmentLogCreate,
    DailyTrackingSummary
)
from app.db.session import get_next_id

class TrackingService:
    @staticmethod
    def log_lifestyle(db, user_id: int, data: LifestyleLogCreate) -> dict:
        target_date = str(data.log_date or date.today())
        now = datetime.now(timezone.utc)
        
        existing = db["lifestyle_logs"].find_one({"user_id": user_id, "log_date": target_date})
        log_id = existing["id"] if existing and "id" in existing else get_next_id(db, "lifestyle_logs")
        
        doc = {
            "id": log_id,
            "user_id": user_id,
            "log_date": target_date,
            "working_routine": data.working_routine,
            "exercise_frequency": data.exercise_frequency,
            "exercise_minutes": data.exercise_minutes,
            "stress_level": data.stress_level,
            "diet_quality_score": data.diet_quality_score,
            "alcohol_units": data.alcohol_units,
            "smoking_status": data.smoking_status,
            "notes": data.notes or "",
            "created_at": existing.get("created_at", now) if existing else now
        }
        
        db["lifestyle_logs"].update_one(
            {"user_id": user_id, "log_date": target_date},
            {"$set": doc},
            upsert=True
        )
        return doc

    @staticmethod
    def get_lifestyle_history(db, user_id: int, days: int = 14) -> List[dict]:
        start_date = str(date.today() - timedelta(days=days))
        cursor = db["lifestyle_logs"].find({
            "user_id": user_id,
            "log_date": {"$gte": start_date}
        }).sort("log_date", -1)
        return list(cursor)

    @staticmethod
    def log_sleep(db, user_id: int, data: SleepLogCreate) -> dict:
        target_date = str(data.log_date or date.today())
        now = datetime.now(timezone.utc)
        qual_val = data.sleep_quality.value if hasattr(data.sleep_quality, "value") else str(data.sleep_quality)
        
        existing = db["sleep_logs"].find_one({"user_id": user_id, "log_date": target_date})
        log_id = existing["id"] if existing and "id" in existing else get_next_id(db, "sleep_logs")
        
        doc = {
            "id": log_id,
            "user_id": user_id,
            "log_date": target_date,
            "sleep_duration_hours": data.sleep_duration_hours,
            "sleep_quality": qual_val,
            "wake_feeling": data.wake_feeling,
            "deep_sleep_hours": data.deep_sleep_hours,
            "bedtime": data.bedtime,
            "wake_time": data.wake_time,
            "notes": data.notes or "",
            "created_at": existing.get("created_at", now) if existing else now
        }
        
        db["sleep_logs"].update_one(
            {"user_id": user_id, "log_date": target_date},
            {"$set": doc},
            upsert=True
        )
        return doc

    @staticmethod
    def get_sleep_history(db, user_id: int, days: int = 14) -> List[dict]:
        start_date = str(date.today() - timedelta(days=days))
        cursor = db["sleep_logs"].find({
            "user_id": user_id,
            "log_date": {"$gte": start_date}
        }).sort("log_date", -1)
        return list(cursor)

    @staticmethod
    def log_hydration(db, user_id: int, data: HydrationLogCreate) -> dict:
        target_date = str(data.log_date or date.today())
        now = datetime.now(timezone.utc)
        
        existing = db["hydration_logs"].find_one({"user_id": user_id, "log_date": target_date})
        log_id = existing["id"] if existing and "id" in existing else get_next_id(db, "hydration_logs")
        
        current_amount = existing.get("water_amount_ml", 0) if existing else 0
        new_amount = current_amount + data.water_amount_ml
        
        doc = {
            "id": log_id,
            "user_id": user_id,
            "log_date": target_date,
            "water_amount_ml": new_amount,
            "target_ml": data.target_ml,
            "glasses_count": max(1, round(new_amount / 250)),
            "created_at": existing.get("created_at", now) if existing else now
        }
        
        db["hydration_logs"].update_one(
            {"user_id": user_id, "log_date": target_date},
            {"$set": doc},
            upsert=True
        )
        return doc

    @staticmethod
    def set_hydration_total(db, user_id: int, target_date: date, total_ml: int, target_ml: int = 2500) -> dict:
        target_date_str = str(target_date)
        now = datetime.now(timezone.utc)
        
        existing = db["hydration_logs"].find_one({"user_id": user_id, "log_date": target_date_str})
        log_id = existing["id"] if existing and "id" in existing else get_next_id(db, "hydration_logs")
        
        doc = {
            "id": log_id,
            "user_id": user_id,
            "log_date": target_date_str,
            "water_amount_ml": total_ml,
            "target_ml": target_ml,
            "glasses_count": max(0, round(total_ml / 250)),
            "created_at": existing.get("created_at", now) if existing else now
        }
        
        db["hydration_logs"].update_one(
            {"user_id": user_id, "log_date": target_date_str},
            {"$set": doc},
            upsert=True
        )
        return doc

    @staticmethod
    def log_environment(db, user_id: int, data: EnvironmentLogCreate) -> dict:
        target_date = str(data.log_date or date.today())
        now = datetime.now(timezone.utc)
        
        existing = db["environment_logs"].find_one({"user_id": user_id, "log_date": target_date})
        log_id = existing["id"] if existing and "id" in existing else get_next_id(db, "environment_logs")
        
        doc = {
            "id": log_id,
            "user_id": user_id,
            "log_date": target_date,
            "sun_exposure_hours": data.sun_exposure_hours,
            "uv_index": data.uv_index,
            "dust_pollution_exposure": data.dust_pollution_exposure,
            "weather_condition": data.weather_condition,
            "pollution_aqi": data.pollution_aqi,
            "humidity_percent": data.humidity_percent,
            "created_at": existing.get("created_at", now) if existing else now
        }
        
        db["environment_logs"].update_one(
            {"user_id": user_id, "log_date": target_date},
            {"$set": doc},
            upsert=True
        )
        return doc

    @staticmethod
    def get_daily_summary(db, user_id: int, target_date: Optional[date] = None) -> DailyTrackingSummary:
        day = target_date or date.today()
        day_str = str(day)
        
        lifestyle = db["lifestyle_logs"].find_one({"user_id": user_id, "log_date": day_str})
        sleep = db["sleep_logs"].find_one({"user_id": user_id, "log_date": day_str})
        hydration = db["hydration_logs"].find_one({"user_id": user_id, "log_date": day_str})
        env = db["environment_logs"].find_one({"user_id": user_id, "log_date": day_str})

        hydration_ml = hydration.get("water_amount_ml", 0) if hydration else 0
        target_ml = hydration.get("target_ml", 2500) if hydration else 2500
        hyd_pct = min(100.0, round((hydration_ml / target_ml) * 100, 1)) if target_ml > 0 else 0.0

        sleep_hrs = sleep.get("sleep_duration_hours", 7.5) if sleep else 7.5
        sleep_qual = sleep.get("sleep_quality", "GOOD") if sleep else "GOOD"
        wake_feel = sleep.get("wake_feeling", "Good & Refreshed") if sleep else "Good & Refreshed"
        
        working_routine = lifestyle.get("working_routine", "Desk/Screen work indoors") if lifestyle else "Desk/Screen work indoors"
        exercise_mins = lifestyle.get("exercise_minutes", 30) if lifestyle else 30
        stress = lifestyle.get("stress_level", 5) if lifestyle else 5
        diet = lifestyle.get("diet_quality_score", 7) if lifestyle else 7

        uv = env.get("uv_index", 4.0) if env else 4.0
        sun_hrs = env.get("sun_exposure_hours", 2.0) if env else 2.0
        dust = env.get("dust_pollution_exposure", "Moderate") if env else "Moderate"
        weather = env.get("weather_condition", "Cold & Dry") if env else "Cold & Dry"

        sleep_score = max(20.0, min(100.0, 100.0 - abs(8.0 - sleep_hrs) * 15.0))
        if wake_feel == "Good & Refreshed":
            sleep_score = min(100.0, sleep_score + 10)
        elif wake_feel in ["Tired & Fatigued", "Exhausted"]:
            sleep_score = max(10.0, sleep_score - 15)

        stress_score = (10 - stress) * 10.0
        diet_score = diet * 10.0
        
        lifestyle_impact = round(
            (hyd_pct * 0.25) + (sleep_score * 0.35) + (stress_score * 0.20) + (diet_score * 0.20),
            1
        )

        return DailyTrackingSummary(
            date=day,
            hydration_total_ml=hydration_ml,
            hydration_target_ml=target_ml,
            hydration_percentage=hyd_pct,
            sleep_hours=sleep_hrs,
            sleep_quality=sleep_qual,
            wake_feeling=wake_feel,
            stress_level=stress,
            exercise_minutes=exercise_mins,
            working_routine=working_routine,
            diet_quality_score=diet,
            uv_index=uv,
            sun_exposure_hours=sun_hrs,
            dust_pollution_exposure=dust,
            weather_condition=weather,
            lifestyle_impact_score=lifestyle_impact
        )

tracking_service = TrackingService()
