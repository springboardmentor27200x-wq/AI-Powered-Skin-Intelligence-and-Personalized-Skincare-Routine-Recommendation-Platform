from datetime import datetime, timezone
from typing import Optional
from app.db.session import get_next_id
from app.schemas.routine import SkincareRoutineCreate

class RoutineService:
    @staticmethod
    def generate_routine(db, user_id: int, assessment: dict) -> dict:
        now = datetime.now(timezone.utc)
        season = assessment.get("season", "Unknown")
        concerns = assessment.get("prioritized_concerns", [])
        target_concern = concerns[0]["concern"] if concerns else "General Maintenance"
        
        # Dynamic rule-based generation
        morning_routine = [
            {"step_name": "Cleansing", "recommendation": {"product_type": "Gentle Cleanser", "product_name": "CeraVe Hydrating Cleanser", "reason": "Good for morning wash"}}
        ]
        
        evening_routine = [
            {"step_name": "Cleansing", "recommendation": {"product_type": "Foaming Cleanser", "product_name": "La Roche-Posay Purifying Foaming Cleanser", "reason": "Remove dirt and SPF"}}
        ]
        
        target_lower = target_concern.lower()
        if "acne" in target_lower or "breakout" in target_lower:
            evening_routine.append({"step_name": "Treatment", "recommendation": {"product_type": "BHA Liquid Exfoliant", "product_name": "Paula's Choice 2% BHA", "reason": f"Targeting {target_concern}"}})
            morning_routine.append({"step_name": "Moisturizing", "recommendation": {"product_type": "Oil-Free Moisturizer", "product_name": "Neutrogena Hydro Boost Water Gel", "reason": "Hydration without clogging pores"}})
            evening_routine.append({"step_name": "Moisturizing", "recommendation": {"product_type": "Light Lotion", "product_name": "CeraVe PM Facial Moisturizing Lotion", "reason": "Overnight repair"}})
            weekly_treatment = f"Use a clay mask once a week to help draw out impurities and target {target_concern}."
        elif "pigmentation" in target_lower or "dark spot" in target_lower:
            morning_routine.append({"step_name": "Treatment", "recommendation": {"product_type": "Vitamin C Serum", "product_name": "Mad Hippie Vitamin C Serum", "reason": "Brighten dark spots and protect against free radicals"}})
            evening_routine.append({"step_name": "Treatment", "recommendation": {"product_type": "Targeted Serum", "product_name": "The Ordinary Niacinamide 10% + Zinc 1%", "reason": f"Targeting {target_concern}"}})
            morning_routine.append({"step_name": "Moisturizing", "recommendation": {"product_type": "Lightweight Moisturizer", "product_name": "CeraVe Daily Moisturizing Lotion", "reason": "Hydration for the day"}})
            evening_routine.append({"step_name": "Moisturizing", "recommendation": {"product_type": "Night Cream", "product_name": "Olay Regenerist Micro-Sculpting Cream", "reason": "Overnight repair and cell turnover"}})
            weekly_treatment = f"Use an AHA exfoliant (like Glycolic Acid) twice a week to target {target_concern}."
        elif "dry" in target_lower:
            morning_routine.append({"step_name": "Treatment", "recommendation": {"product_type": "Hydrating Serum", "product_name": "The Inkey List Hyaluronic Acid", "reason": "Bind moisture to the skin"}})
            evening_routine.append({"step_name": "Treatment", "recommendation": {"product_type": "Barrier Repair", "product_name": "KraveBeauty Great Barrier Relief", "reason": f"Targeting {target_concern}"}})
            morning_routine.append({"step_name": "Moisturizing", "recommendation": {"product_type": "Rich Moisturizer", "product_name": "Vanicream Daily Facial Moisturizer", "reason": "Deep hydration"}})
            evening_routine.append({"step_name": "Moisturizing", "recommendation": {"product_type": "Heavy Cream", "product_name": "Weleda Skin Food", "reason": "Lock in moisture overnight"}})
            weekly_treatment = f"Use a hydrating sleeping mask twice a week to target {target_concern}."
        else:
            morning_routine.append({"step_name": "Moisturizing", "recommendation": {"product_type": "Lightweight Moisturizer", "product_name": "Neutrogena Hydro Boost", "reason": "Hydration for the day"}})
            evening_routine.append({"step_name": "Treatment", "recommendation": {"product_type": "Targeted Serum", "product_name": "The Ordinary Niacinamide 10% + Zinc 1%", "reason": f"Targeting {target_concern}"}})
            evening_routine.append({"step_name": "Moisturizing", "recommendation": {"product_type": "Night Cream", "product_name": "CeraVe PM Facial Moisturizing Lotion", "reason": "Overnight repair"}})
            weekly_treatment = f"Use a gentle chemical exfoliant once a week to target {target_concern}."

        # Apply seasonal modifications
        season_lower = season.lower()
        if season_lower == "winter":
            morning_routine.append({"step_name": "Extra Hydration", "recommendation": {"product_type": "Facial Oil or Rich Serum", "product_name": "The Ordinary Squalane Oil", "reason": "Combat harsh winter dryness"}})
            morning_routine.append({"step_name": "Sun Protection", "recommendation": {"product_type": "Hydrating Sunscreen SPF 30+", "product_name": "EltaMD UV Clear", "reason": "Crucial daily protection even in winter"}})
        elif season_lower == "summer":
            evening_routine.append({"step_name": "Deep Clean", "recommendation": {"product_type": "Double Cleanse Balm", "product_name": "Banila Co Clean It Zero", "reason": "Remove heavy summer sweat and SPF"}})
            morning_routine.append({"step_name": "Sun Protection", "recommendation": {"product_type": "Mattifying Sunscreen SPF 50+", "product_name": "La Roche-Posay Anthelios Light Fluid", "reason": "High protection for summer sun"}})
        else: # Spring or Autumn
            morning_routine.append({"step_name": "Sun Protection", "recommendation": {"product_type": "Sunscreen SPF 30+", "product_name": "EltaMD UV Clear", "reason": "Crucial daily protection"}})

        doc = {
            "id": get_next_id(db, "skincare_routines"),
            "user_id": user_id,
            "season": season,
            "target_concern": target_concern,
            "morning_routine": morning_routine,
            "evening_routine": evening_routine,
            "weekly_treatment": weekly_treatment,
            "created_at": now,
            "updated_at": now
        }
        
        db["skincare_routines"].insert_one(doc)
        return doc

    @staticmethod
    def get_latest_routine(db, user_id: int) -> Optional[dict]:
        return db["skincare_routines"].find_one({"user_id": user_id}, sort=[("created_at", -1)])

routine_service = RoutineService()
