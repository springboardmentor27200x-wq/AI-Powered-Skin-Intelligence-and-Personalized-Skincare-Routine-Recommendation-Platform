from datetime import date, datetime, timedelta, timezone
from app.db.session import active_db, init_mongo, get_next_id
from app.models.user import UserRole
from app.models.profile import SkinTypeEnum
from app.models.tracking import SleepQualityEnum
from app.core.security import hash_password

def init_db():
    db = active_db if active_db is not None else init_mongo()
    
    demo_users = [
        {
            "id": 1,
            "email": "user@skiniq.ai",
            "password": "Password123!",
            "full_name": "Geona Michelle",
            "role": UserRole.USER.value,
            "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
        },
        {
            "id": 2,
            "email": "customer@skiniq.ai",
            "password": "CustomerPass2026!",
            "full_name": "Geona Michelle",
            "role": UserRole.USER.value,
            "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
        },
        {
            "id": 3,
            "email": "admin@skiniq.ai",
            "password": "AdminPass2026!",
            "full_name": "System Administrator",
            "role": UserRole.ADMINISTRATOR.value,
            "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
        },
        {
            "id": 4,
            "email": "consultant@skiniq.ai",
            "password": "ConsultantPass2026!",
            "full_name": "Elena Vance, Skincare Professional",
            "role": UserRole.SKINCARE_CONSULTANT.value,
            "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
        },
        {
            "id": 5,
            "email": "derm@skiniq.ai",
            "password": "DermPass2026!",
            "full_name": "Dr. Marcus Chen, MD",
            "role": UserRole.DERMATOLOGIST.value,
            "avatar_url": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150"
        }
    ]

    for u_data in demo_users:
        user = db["users"].find_one({"email": u_data["email"]})
        now = datetime.now(timezone.utc)
        if user:
            db["users"].update_one(
                {"email": u_data["email"]},
                {"$set": {
                    "hashed_password": hash_password(u_data["password"]),
                    "full_name": u_data["full_name"],
                    "role": u_data["role"],
                    "is_active": True,
                    "avatar_url": u_data["avatar_url"],
                    "updated_at": now
                }}
            )
        else:
            db["users"].insert_one({
                "id": u_data["id"],
                "email": u_data["email"],
                "hashed_password": hash_password(u_data["password"]),
                "full_name": u_data["full_name"],
                "role": u_data["role"],
                "is_active": True,
                "avatar_url": u_data["avatar_url"],
                "created_at": now,
                "updated_at": now
            })

    user1 = db["users"].find_one({"email": "user@skiniq.ai"})
    if user1:
        u_id = user1["id"]
        now = datetime.now(timezone.utc)
        db["skin_profiles"].update_one(
            {"user_id": u_id},
            {"$set": {
                "id": 1,
                "user_id": u_id,
                "age": 25,
                "age_group": "25-34",
                "skin_type": SkinTypeEnum.COMBINATION.value,
                "oil_characteristics": "Moderate T-zone shine, normal-to-dry cheeks",
                "concerns": ["Hyperpigmentation", "Dark Spots", "Uneven Skin Tone"],
                "allergies": ["Synthetic Fragrance"],
                "sensitivities": ["High concentration AHAs"],
                "skin_goals": ["Deep Hydration & Glow", "Fade Dark Spots"],
                "working_routine": "Desk/Screen work indoors",
                "exercise_frequency": "3-4 times a week",
                "exercise_duration_mins": 45,
                "stress_level": 4,
                "baseline_water_intake_ml": 2200,
                "baseline_sleep_hours": 7.5,
                "sun_exposure_level": "Moderate (1-3 hours)",
                "climate_type": "Cold & Dry",
                "notes": "Combination skin prone to occasional forehead oiliness and sensitive dry cheeks in winter.",
                "created_at": now,
                "updated_at": now
            }},
            upsert=True
        )

        today = date.today()
        for i in range(7):
            past_day = str(today - timedelta(days=i))
            
            db["lifestyle_logs"].update_one(
                {"user_id": u_id, "log_date": past_day},
                {"$set": {
                    "id": i + 1,
                    "user_id": u_id,
                    "log_date": past_day,
                    "working_routine": "Desk/Screen work indoors",
                    "exercise_frequency": "3-4 times a week",
                    "exercise_minutes": 45 if i % 2 == 0 else 20,
                    "stress_level": 4 if i < 4 else 6,
                    "diet_quality_score": 8 if i % 2 == 0 else 7,
                    "alcohol_units": 0,
                    "smoking_status": "Non-smoker",
                    "notes": "",
                    "created_at": now
                }},
                upsert=True
            )

            db["sleep_logs"].update_one(
                {"user_id": u_id, "log_date": past_day},
                {"$set": {
                    "id": i + 1,
                    "user_id": u_id,
                    "log_date": past_day,
                    "sleep_duration_hours": 7.5 if i % 2 == 0 else 8.0,
                    "sleep_quality": SleepQualityEnum.GOOD.value if i % 2 == 0 else SleepQualityEnum.EXCELLENT.value,
                    "wake_feeling": "Good & Refreshed" if i % 2 == 0 else "Moderate",
                    "deep_sleep_hours": 2.1,
                    "bedtime": "23:15",
                    "wake_time": "07:15",
                    "notes": "",
                    "created_at": now
                }},
                upsert=True
            )

            db["hydration_logs"].update_one(
                {"user_id": u_id, "log_date": past_day},
                {"$set": {
                    "id": i + 1,
                    "user_id": u_id,
                    "log_date": past_day,
                    "water_amount_ml": 2250 if i > 0 else 1750,
                    "target_ml": 2500,
                    "glasses_count": 9 if i > 0 else 7,
                    "created_at": now
                }},
                upsert=True
            )

            db["environment_logs"].update_one(
                {"user_id": u_id, "log_date": past_day},
                {"$set": {
                    "id": i + 1,
                    "user_id": u_id,
                    "log_date": past_day,
                    "sun_exposure_hours": 2.0,
                    "uv_index": 4.5,
                    "dust_pollution_exposure": "Moderate",
                    "weather_condition": "Cold & Dry",
                    "pollution_aqi": 42,
                    "humidity_percent": 58.0,
                    "created_at": now
                }},
                upsert=True
            )

if __name__ == "__main__":
    init_db()
