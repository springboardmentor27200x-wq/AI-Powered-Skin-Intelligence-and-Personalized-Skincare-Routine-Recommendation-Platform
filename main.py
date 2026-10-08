from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from schemas import (
    UserCreate,
      UserLogin,
      SkinProfileCreate,
      LifestyleCreate,
      SleepCreate,
      SkinAssessmentCreate,
      RoutineCreate,
      IngredientAnalysisCreate,
      ProductRecommendationCreate,
      ProductComparisonCreate,
      AlternativeProductCreate,
      SkinProgressCreate
)
from database import engine, Base, SessionLocal
import models
import hashlib
import os

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://localhost:5174"
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def hash_password(password: str):
    salt = os.urandom(16)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        100000
    )
    return salt.hex() + ":" + password_hash.hex()


def verify_password(password: str, stored_password: str):
    try:
        salt_hex, hash_hex = stored_password.split(":")
        salt = bytes.fromhex(salt_hex)

        new_hash = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            100000
        )

        return new_hash.hex() == hash_hex
    except Exception:
        return False
    
@app.get("/")
def home():
    return {"message": "SkinCare Assistant API is running"}

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "SkinCare Assistant API"
    }


@app.post("/register")
def register_user(user: UserCreate):
    db = SessionLocal()

    try:
        existing_user = db.query(models.User).filter(
            models.User.email == user.email
        ).first()

        if existing_user:
            return {
                "message": "Email already registered"
            }

        hashed_password = hash_password(user.password)

        new_user = models.User(
            name=user.name,
            email=user.email,
            password=hashed_password
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {
            "message": "Registration successful",
            "user": {
                "id": new_user.id,
                "name": new_user.name,
                "email": new_user.email
            }
        }

    except Exception as e:
        db.rollback()
        return {
            "message": "Registration failed",
            "error": str(e)
        }

    finally:
        db.close()
@app.post("/login")
def login_user(user: UserLogin):
    db = SessionLocal()

    try:
        existing_user = db.query(models.User).filter(
            models.User.email == user.email
        ).first()

        if not existing_user:
            return {
                "message": "Invalid email or password"
            }

        if not verify_password(user.password, existing_user.password):
            return {
                "message": "Invalid email or password"
            }

        return {
            "message": "Login successful",
            "user": {
                "id": existing_user.id,
                "name": existing_user.name,
                "email": existing_user.email
            }
        }

    finally:
        db.close()
@app.post("/skin-profile")
def create_skin_profile(profile: SkinProfileCreate):
    db = SessionLocal()

    try:
        new_profile = models.SkinProfile(
            user_id=profile.user_id,
            skin_type=profile.skin_type,
            skin_concerns=profile.skin_concerns,
            sensitivity=profile.sensitivity
        )

        db.add(new_profile)
        db.commit()
        db.refresh(new_profile)

        return {
            "message": "Skin profile saved successfully",
            "profile": {
                "id": new_profile.id,
                "user_id": new_profile.user_id,
                "skin_type": new_profile.skin_type,
                "skin_concerns": new_profile.skin_concerns,
                "sensitivity": new_profile.sensitivity
            }
        }

    finally:
        db.close()
@app.post("/lifestyle")
def create_lifestyle(data: LifestyleCreate):
    db = SessionLocal()

    try:
        new_lifestyle = models.Lifestyle(
            user_id=data.user_id,
            water_intake=data.water_intake,
            exercise=data.exercise,
            smoking=data.smoking
        )

        db.add(new_lifestyle)
        db.commit()
        db.refresh(new_lifestyle)

        return {
            "message": "Lifestyle data saved successfully",
            "lifestyle": {
                "id": new_lifestyle.id,
                "user_id": new_lifestyle.user_id,
                "water_intake": new_lifestyle.water_intake,
                "exercise": new_lifestyle.exercise,
                "smoking": new_lifestyle.smoking
            }
        }

    finally:
        db.close()
@app.post("/sleep")
def create_sleep(data: SleepCreate):
    db = SessionLocal()

    try:
        new_sleep = models.SleepTracking(
            user_id=data.user_id,
            sleep_hours=data.sleep_hours,
            sleep_quality=data.sleep_quality
        )

        db.add(new_sleep)
        db.commit()
        db.refresh(new_sleep)

        return {
            "message": "Sleep data saved successfully",
            "sleep": {
                "id": new_sleep.id,
                "user_id": new_sleep.user_id,
                "sleep_hours": new_sleep.sleep_hours,
                "sleep_quality": new_sleep.sleep_quality
            }
        }

    finally:
        db.close()
@app.post("/assessment")
def create_assessment(data: SkinAssessmentCreate):
    db = SessionLocal()

    try:
        profile = db.query(models.SkinProfile).filter(
            models.SkinProfile.user_id == data.user_id
        ).order_by(models.SkinProfile.id.desc()).first()

        lifestyle = db.query(models.Lifestyle).filter(
            models.Lifestyle.user_id == data.user_id
        ).order_by(models.Lifestyle.id.desc()).first()

        sleep = db.query(models.SleepTracking).filter(
            models.SleepTracking.user_id == data.user_id
        ).order_by(models.SleepTracking.id.desc()).first()

        previous_assessment = db.query(models.SkinAssessment).filter(
            models.SkinAssessment.user_id == data.user_id
        ).order_by(models.SkinAssessment.id.desc()).first()

        if not profile:
            return {"message": "Skin profile not found"}

        # =====================================
        # 1. SKIN CONDITION SCORE - 35%
        # =====================================

        skin_condition = 100

        skin_type = (profile.skin_type or "").strip().lower()
        sensitivity = (profile.sensitivity or "").strip().lower()

        if skin_type == "sensitive":
            skin_condition -= 10
        elif skin_type == "dry":
            skin_condition -= 5
        elif skin_type == "oily":
            skin_condition -= 5

        if sensitivity == "high":
            skin_condition -= 15
        elif sensitivity == "medium":
            skin_condition -= 7

        if profile.skin_concerns:
            skin_condition -= 5

        skin_condition = max(0, skin_condition)

        # =====================================
        # 2. LIFESTYLE SCORE - 20%
        # =====================================

        lifestyle_score = 100

        if lifestyle:

            smoking = (lifestyle.smoking or "").strip().lower()
            exercise = (lifestyle.exercise or "").strip().lower()

            if smoking == "yes":
                lifestyle_score -= 30

            if "low" in exercise:
                lifestyle_score -= 20
            elif "medium" in exercise:
                lifestyle_score -= 10

        lifestyle_score = max(0, lifestyle_score)

        # =====================================
        # 3. SLEEP SCORE - 15%
        # =====================================

        sleep_score = 100

        if sleep:

            if sleep.sleep_hours < 6:
                sleep_score = 50
            elif sleep.sleep_hours < 7:
                sleep_score = 70
            elif sleep.sleep_hours < 8:
                sleep_score = 85
            else:
                sleep_score = 100

            sleep_quality = (
                sleep.sleep_quality or ""
            ).strip().lower()

            if sleep_quality == "poor":
                sleep_score -= 10
            elif sleep_quality == "average":
                sleep_score -= 5

        sleep_score = max(0, sleep_score)

        # =====================================
        # 4. ROUTINE CONSISTENCY - 20%
        # =====================================

        routine_score = max(
            0,
            min(100, data.routine_consistency)
        )

        # =====================================
        # 5. HYDRATION SCORE - 10%
        # =====================================

        hydration_score = 70

        if lifestyle:

            water = (
                lifestyle.water_intake or ""
            ).strip().lower()

            if "3" in water or "4" in water or "5" in water:
                hydration_score = 100
            elif "2" in water:
                hydration_score = 90
            elif "1" in water:
                hydration_score = 60

        # =====================================
        # FINAL WEIGHTED SCORE
        # =====================================

        score = round(
            (skin_condition * 0.35)
            + (lifestyle_score * 0.20)
            + (sleep_score * 0.15)
            + (routine_score * 0.20)
            + (hydration_score * 0.10)
        )

        # =====================================
        # IMPROVEMENT SCORE
        # =====================================

        if previous_assessment:
            improvement_score = (
                score - previous_assessment.score
            )
        else:
            improvement_score = 0

        # =====================================
        # CONCERN IDENTIFICATION
        # =====================================

        raw_concerns = profile.skin_concerns or ""

        concern_text = raw_concerns.lower()

        concern_aliases = {
            "Acne": ["acne"],
            "Hyperpigmentation": ["hyperpigmentation"],
            "Dark Spots": ["dark spots", "dark spot"],
            "Dry Skin": ["dry skin", "dryness"],
            "Oily Skin": ["oily skin", "oiliness"],
            "Sensitive Skin": ["sensitive skin", "sensitivity"],
            "Wrinkles": ["wrinkles", "wrinkle"],
            "Fine Lines": ["fine lines", "fine line"],
            "Redness": ["redness"],
            "Uneven Skin Tone": [
                "uneven skin tone",
                "uneven tone"
            ]
        }

        identified_concerns = []

        for concern_name, aliases in concern_aliases.items():

            for alias in aliases:

                if alias in concern_text:
                    identified_concerns.append(concern_name)
                    break

        if not identified_concerns:
            identified_concerns = [
                "General Skin Health"
            ]

        # =====================================
        # CONCERN PRIORITIZATION
        # =====================================

        concern_priority = {
            "Acne": 10,
            "Sensitive Skin": 9,
            "Hyperpigmentation": 8,
            "Dark Spots": 7,
            "Redness": 6,
            "Dry Skin": 5,
            "Oily Skin": 5,
            "Wrinkles": 4,
            "Fine Lines": 3,
            "Uneven Skin Tone": 2,
            "General Skin Health": 1
        }

        prioritized_concerns = sorted(
            identified_concerns,
            key=lambda concern: concern_priority.get(
                concern,
                1
            ),
            reverse=True
        )

        primary_concern = prioritized_concerns[0]

        # =====================================
        # RISK FACTOR ANALYSIS
        # =====================================

        risk_factors = []

        if sensitivity == "high":
            risk_factors.append(
                "High skin sensitivity"
            )
        elif sensitivity == "medium":
            risk_factors.append(
                "Moderate skin sensitivity"
            )

        if skin_type == "dry":
            risk_factors.append(
                "Dry skin may require additional hydration"
            )

        if skin_type == "oily":
            risk_factors.append(
                "Oily skin may require oil-control care"
            )

        if lifestyle:

            smoking = (
                lifestyle.smoking or ""
            ).strip().lower()

            exercise = (
                lifestyle.exercise or ""
            ).strip().lower()

            if smoking == "yes":
                risk_factors.append(
                    "Smoking habit may negatively affect skin health"
                )

            if "low" in exercise:
                risk_factors.append(
                    "Low exercise activity"
                )

        if sleep:

            if sleep.sleep_hours < 7:
                risk_factors.append(
                    "Less than 7 hours of sleep"
                )

            sleep_quality = (
                sleep.sleep_quality or ""
            ).strip().lower()

            if sleep_quality == "poor":
                risk_factors.append(
                    "Poor sleep quality"
                )

        if routine_score < 60:
            risk_factors.append(
                "Low skincare routine consistency"
            )

        if hydration_score < 70:
            risk_factors.append(
                "Low hydration level"
            )

        if not risk_factors:
            risk_factors.append(
                "No major risk factors identified from available data"
            )

        # =====================================
        # RISK LEVEL
        # =====================================

        if score >= 80:
            risk_level = "Low"
        elif score >= 60:
            risk_level = "Medium"
        else:
            risk_level = "High"

        # =====================================
        # PERSONALIZED RECOMMENDATION
        # =====================================

        recommendations = {

            "Acne":
                "Use a gentle cleanser, avoid harsh products "
                "and maintain a consistent skincare routine.",

            "Hyperpigmentation":
                "Use sunscreen daily and choose gentle "
                "brightening skincare products.",

            "Dark Spots":
                "Use sunscreen regularly and follow a "
                "consistent skincare routine.",

            "Dry Skin":
                "Use a gentle cleanser, hydrating moisturizer "
                "and maintain good water intake.",

            "Oily Skin":
                "Use a gentle cleanser, lightweight moisturizer "
                "and regular sun protection.",

            "Sensitive Skin":
                "Use gentle fragrance-free skincare products "
                "and avoid harsh ingredients.",

            "Wrinkles":
                "Maintain hydration, sun protection and a "
                "consistent gentle skincare routine.",

            "Fine Lines":
                "Focus on hydration, sun protection and "
                "consistent skincare.",

            "Redness":
                "Use gentle fragrance-free skincare products "
                "and avoid harsh ingredients.",

            "Uneven Skin Tone":
                "Use sunscreen consistently and maintain "
                "a gentle skincare routine.",

            "General Skin Health":
                "Maintain a gentle skincare routine, healthy "
                "lifestyle and adequate sleep."
        }

        recommendation = recommendations.get(
            primary_concern,
            recommendations["General Skin Health"]
        )

        # =====================================
        # SAVE ASSESSMENT
        # =====================================

        new_assessment = models.SkinAssessment(
            user_id=data.user_id,
            score=score,
            primary_concern=primary_concern,
            risk_level=risk_level,
            recommendation=recommendation
        )

        db.add(new_assessment)
        db.commit()
        db.refresh(new_assessment)

        # =====================================
        # RESPONSE
        # =====================================

        return {
            "message": "Skin assessment completed successfully",

            "assessment": {

                "id": new_assessment.id,

                "user_id": new_assessment.user_id,

                "score": new_assessment.score,

                "primary_concern":
                    new_assessment.primary_concern,

                "risk_level":
                    new_assessment.risk_level,

                "recommendation":
                    new_assessment.recommendation,

                "improvement_score":
                    improvement_score,

                "identified_concerns":
                    identified_concerns,

                "prioritized_concerns":
                    prioritized_concerns,

                "risk_factors":
                    risk_factors,

                "score_breakdown": {

                    "skin_condition": {
                        "score": skin_condition,
                        "weight": "35%"
                    },

                    "lifestyle_habits": {
                        "score": lifestyle_score,
                        "weight": "20%"
                    },

                    "sleep_quality": {
                        "score": sleep_score,
                        "weight": "15%"
                    },

                    "routine_consistency": {
                        "score": routine_score,
                        "weight": "20%"
                    },

                    "hydration_level": {
                        "score": hydration_score,
                        "weight": "10%"
                    }
                }
            }
        }

    finally:
        db.close()                   
@app.post("/routine")
def create_routine(data: RoutineCreate):
    db = SessionLocal()

    try:
        profile = db.query(models.SkinProfile).filter(
            models.SkinProfile.user_id == data.user_id
        ).order_by(models.SkinProfile.id.desc()).first()

        assessment = db.query(models.SkinAssessment).filter(
            models.SkinAssessment.user_id == data.user_id
        ).order_by(models.SkinAssessment.id.desc()).first()

        if not profile:
            return {
                "message": "Skin profile not found"
            }

        if assessment:
            score = assessment.score
            primary_concern = (
                assessment.primary_concern
            )
        else:
            score = 0
            primary_concern = "General Skin Health"

        # =====================================
        # PERSONALIZED ROUTINE
        # =====================================

        if primary_concern == "Acne":

            morning = (
                "Cleansing → Acne-friendly treatment → "
                "Light moisturizer → Sun protection"
            )

            evening = (
                "Cleansing → Acne treatment → "
                "Moisturizing → Night care"
            )

            weekly = (
                "Gentle exfoliation once a week if suitable "
                "for your skin."
            )

        elif primary_concern == "Dry Skin":

            morning = (
                "Gentle cleansing → Hydrating treatment → "
                "Moisturizing → Sun protection"
            )

            evening = (
                "Gentle cleansing → Hydrating treatment → "
                "Rich moisturizing → Night care"
            )

            weekly = (
                "Hydrating treatment once a week."
            )

        elif primary_concern == "Oily Skin":

            morning = (
                "Gentle cleansing → Lightweight treatment → "
                "Light moisturizer → Sun protection"
            )

            evening = (
                "Gentle cleansing → Oil-control treatment → "
                "Light moisturizer → Night care"
            )

            weekly = (
                "Gentle exfoliation once a week if suitable."
            )

        elif primary_concern == "Sensitive Skin":

            morning = (
                "Gentle cleansing → Soothing treatment → "
                "Moisturizer → Sun protection"
            )

            evening = (
                "Gentle cleansing → Soothing treatment → "
                "Moisturizer → Night care"
            )

            weekly = (
                "Prefer gentle hydration and avoid harsh "
                "exfoliation."
            )

        elif (
            primary_concern == "Dark Spots"
            or primary_concern == "Hyperpigmentation"
        ):

            morning = (
                "Gentle cleansing → Brightening treatment → "
                "Moisturizer → Sun protection"
            )

            evening = (
                "Gentle cleansing → Brightening treatment → "
                "Moisturizer → Night care"
            )

            weekly = (
                "Gentle treatment routine once a week."
            )

        elif primary_concern == "Redness":

            morning = (
                "Gentle cleansing → Soothing treatment → "
                "Moisturizer → Sun protection"
            )

            evening = (
                "Gentle cleansing → Soothing treatment → "
                "Moisturizer → Night care"
            )

            weekly = (
                "Gentle hydration-focused care."
            )

        elif (
            primary_concern == "Wrinkles"
            or primary_concern == "Fine Lines"
        ):

            morning = (
                "Gentle cleansing → Hydrating treatment → "
                "Moisturizer → Sun protection"
            )

            evening = (
                "Gentle cleansing → Hydrating treatment → "
                "Moisturizer → Night care"
            )

            weekly = (
                "Gentle hydration and skin-care maintenance."
            )

        elif primary_concern == "Uneven Skin Tone":

            morning = (
                "Gentle cleansing → Brightening treatment → "
                "Moisturizer → Sun protection"
            )

            evening = (
                "Gentle cleansing → Gentle treatment → "
                "Moisturizer → Night care"
            )

            weekly = (
                "Gentle treatment routine once a week."
            )

        else:

            morning = (
                "Gentle cleansing → Moisturizing → "
                "Sun protection"
            )

            evening = (
                "Gentle cleansing → Moisturizing → "
                "Night care"
            )

            weekly = (
                "Maintain a gentle weekly skincare routine."
            )

        # =====================================
        # ADAPTIVE UPDATE
        # =====================================

        if score < 60:

            adaptive_update = (
                "Your score is currently low. Keep the routine "
                "simple, gentle and consistent. Avoid introducing "
                "too many new products at once."
            )

        elif score < 80:

            adaptive_update = (
                "Your score is in the moderate range. Maintain "
                "routine consistency and monitor your skin response."
            )

        else:

            adaptive_update = (
                "Your score is good. Continue the routine "
                "consistently to maintain your current skin health."
            )

        # =====================================
        # ROUTINE CATEGORIES
        # =====================================

        routine_categories = [
            "Cleansing",
            "Exfoliation",
            "Treatment",
            "Moisturizing",
            "Sun Protection",
            "Night Care"
        ]

        # =====================================
        # SAVE ROUTINE
        # =====================================

        new_routine = models.SkincareRoutine(
            user_id=data.user_id,
            morning_routine=morning,
            evening_routine=evening,
            weekly_treatment=weekly
        )

        db.add(new_routine)
        db.commit()
        db.refresh(new_routine)

        # =====================================
        # RESPONSE
        # =====================================

        return {

            "message":
                "Personalized skincare routine updated successfully",

            "routine": {

                "id": new_routine.id,

                "user_id":
                    new_routine.user_id,

                "morning_routine":
                    new_routine.morning_routine,

                "evening_routine":
                    new_routine.evening_routine,

                "weekly_treatment":
                    new_routine.weekly_treatment,

                "based_on_score":
                    score,

                "based_on_concern":
                    primary_concern,

                "routine_categories":
                    routine_categories,

                "adaptive_update":
                    adaptive_update
            }
        }

    finally:
        db.close()
@app.get("/seasonal-recommendation/{user_id}")
def get_seasonal_recommendation(user_id: int):
    from datetime import datetime

    db = SessionLocal()

    try:
        profile = db.query(models.SkinProfile).filter(
            models.SkinProfile.user_id == user_id
        ).order_by(models.SkinProfile.id.desc()).first()

        if not profile:
            return {"message": "Skin profile not found"}

        month = datetime.now().month
        concern = profile.skin_concerns or "General"

        if month in [3, 4, 5]:
            season = "Spring"
            base_tip = (
                "Use lightweight skincare, sunscreen and maintain "
                "good hydration."
            )

        elif month in [6, 7, 8, 9]:
            season = "Monsoon"
            base_tip = (
                "Keep the skin clean, use lightweight products and "
                "avoid excessive product layering."
            )

        elif month in [10, 11]:
            season = "Autumn"
            base_tip = (
                "Maintain hydration and use gentle skincare products "
                "as the weather becomes drier."
            )

        else:
            season = "Winter"
            base_tip = (
                "Use a gentle cleanser, hydrating moisturizer and "
                "protect the skin from dryness."
            )

        if "Acne" in concern:
            concern_tip = (
                "For acne-prone skin, keep the routine gentle and "
                "avoid heavy products."
            )
        elif "Dryness" in concern:
            concern_tip = (
                "For dry skin, focus on hydration and use a "
                "moisturizer regularly."
            )
        elif "Dark Spots" in concern or "Hyperpigmentation" in concern:
            concern_tip = (
                "For pigmentation concerns, use sunscreen regularly "
                "and maintain a consistent routine."
            )
        else:
            concern_tip = (
                "Continue a gentle skincare routine suitable for "
                "your skin type."
            )

        return {
            "message": "Seasonal recommendation generated successfully",
            "season": season,
            "skin_concern": concern,
            "recommendation": base_tip,
            "concern_specific_tip": concern_tip
        }

    finally:
        db.close()
from ingredient_engine import analyze_ingredient


@app.post("/ingredient/analyze")
def ingredient_analysis(data: IngredientAnalysisCreate):

    result = analyze_ingredient(
        ingredient=data.ingredient,
        skin_type=data.skin_type,
        skin_concerns=data.skin_concerns,
        sensitivity=data.sensitivity,
        allergies=data.allergies
    )

    return result
from product_engine import recommend_products,compare_products,suggest_alternatives


@app.post("/products/recommend")
def product_recommendation(data: ProductRecommendationCreate):

    recommendations = recommend_products(
        skin_type=data.skin_type,
        skin_concerns=data.skin_concerns,
        sensitivity=data.sensitivity,
        budget=data.budget
    )

    return {
        "recommendations": recommendations
    }
@app.post("/products/compare")
def product_comparison(data: ProductComparisonCreate):

    products = compare_products(
        data.product_names
    )

    return {
        "products": products
    }
@app.post("/products/alternatives")
def alternative_products(data: AlternativeProductCreate):

    alternatives = suggest_alternatives(
        category=data.category,
        budget=data.budget
    )

    return {
        "alternatives": alternatives
    }
from database import SessionLocal
from models import SkinProgress

@app.post("/progress")
def create_progress(data: SkinProgressCreate):

    db = SessionLocal()

    progress = SkinProgress(
        user_id=data.user_id,
        progress_date=data.progress_date,
        skin_score=data.skin_score,
        routine_adherence=data.routine_adherence,
        notes=data.notes
    )

    db.add(progress)
    db.commit()
    db.refresh(progress)
    db.close()

    return {
        "message": "Progress saved successfully",
        "progress_id": progress.id
    }
@app.get("/progress/{user_id}")
def get_progress(user_id: int):

    db = SessionLocal()

    progress_records = (
        db.query(SkinProgress)
        .filter(SkinProgress.user_id == user_id)
        .order_by(SkinProgress.id.asc())
        .all()
    )

    db.close()

    if not progress_records:
        return {
            "message": "No progress records found"
        }

    records = []

    previous_score = None

    for progress in progress_records:

        if previous_score is None:
            improvement = 0
        else:
            improvement = progress.skin_score - previous_score

        records.append({
            "progress_date": progress.progress_date,
            "skin_score": progress.skin_score,
            "routine_adherence": progress.routine_adherence,
            "improvement_score": improvement,
            "notes": progress.notes
        })

        previous_score = progress.skin_score

    return {
        "user_id": user_id,
        "progress": records
    }
@app.get("/progress/compare/{user_id}")
def compare_progress(user_id: int):

    db = SessionLocal()

    progress_records = (
        db.query(SkinProgress)
        .filter(SkinProgress.user_id == user_id)
        .order_by(SkinProgress.id.asc())
        .all()
    )

    db.close()

    if len(progress_records) < 2:
        return {
            "message": "At least two progress records are required"
        }

    before = progress_records[0]
    after = progress_records[-1]

    score_change = after.skin_score - before.skin_score

    return {
        "user_id": user_id,
        "before": {
            "date": before.progress_date,
            "skin_score": before.skin_score,
            "routine_adherence": before.routine_adherence
        },
        "after": {
            "date": after.progress_date,
            "skin_score": after.skin_score,
            "routine_adherence": after.routine_adherence
        },
        "score_change": score_change
    }
@app.get("/progress/trend/{user_id}")
def progress_trend(user_id: int):

    db = SessionLocal()

    progress_records = (
        db.query(SkinProgress)
        .filter(SkinProgress.user_id == user_id)
        .order_by(SkinProgress.id.asc())
        .all()
    )

    db.close()

    if not progress_records:
        return {
            "message": "No progress records found"
        }

    trend = []

    for progress in progress_records:
        trend.append({
            "date": progress.progress_date,
            "skin_score": progress.skin_score,
            "routine_adherence": progress.routine_adherence
        })

    return {
        "user_id": user_id,
        "trend": trend
    }
@app.get("/analytics/{user_id}")
def skincare_analytics(user_id: int):

    db = SessionLocal()

    progress_records = (
        db.query(SkinProgress)
        .filter(SkinProgress.user_id == user_id)
        .order_by(SkinProgress.id.asc())
        .all()
    )

    db.close()

    if not progress_records:
        return {
            "message": "No progress data available for analytics"
        }

    scores = [
        progress.skin_score
        for progress in progress_records
    ]

    adherence = [
        progress.routine_adherence
        for progress in progress_records
    ]

    current_score = scores[-1]
    first_score = scores[0]

    average_score = round(
        sum(scores) / len(scores),
        2
    )

    average_adherence = round(
        sum(adherence) / len(adherence),
        2
    )

    improvement = current_score - first_score

    return {
        "user_id": user_id,
        "current_skin_score": current_score,
        "average_skin_score": average_score,
        "average_routine_adherence": average_adherence,
        "overall_improvement": improvement,
        "total_progress_records": len(progress_records)
    }
# =========================================================
# MILESTONE 4 — EXECUTIVE DASHBOARD
# =========================================================

@app.get("/executive-dashboard")
def executive_dashboard():

    db = SessionLocal()

    try:

        # -----------------------------------------
        # PLATFORM COUNTS
        # -----------------------------------------

        total_users = db.query(models.User).count()

        total_skin_profiles = db.query(
            models.SkinProfile
        ).count()

        total_lifestyle_records = db.query(
            models.Lifestyle
        ).count()

        total_sleep_records = db.query(
            models.SleepTracking
        ).count()

        total_assessments = db.query(
            models.SkinAssessment
        ).count()

        total_routines = db.query(
            models.SkincareRoutine
        ).count()

        total_progress_records = db.query(
            models.SkinProgress
        ).count()


        # -----------------------------------------
        # PROGRESS ANALYTICS
        # -----------------------------------------

        progress_records = (
            db.query(models.SkinProgress)
            .order_by(models.SkinProgress.id.asc())
            .all()
        )


        if progress_records:

            scores = [
                record.skin_score
                for record in progress_records
                if record.skin_score is not None
            ]

            adherence = [
                record.routine_adherence
                for record in progress_records
                if record.routine_adherence is not None
            ]

            if scores:
                average_skin_score = round(
                    sum(scores) / len(scores),
                    2
                )

                latest_skin_score = scores[-1]

                first_skin_score = scores[0]

                overall_improvement = (
                    latest_skin_score - first_skin_score
                )

            else:

                average_skin_score = 0
                latest_skin_score = 0
                overall_improvement = 0


            if adherence:

                average_routine_adherence = round(
                    sum(adherence) / len(adherence),
                    2
                )

            else:

                average_routine_adherence = 0

        else:

            average_skin_score = 0
            latest_skin_score = 0
            average_routine_adherence = 0
            overall_improvement = 0


        # -----------------------------------------
        # EXECUTIVE DASHBOARD RESPONSE
        # -----------------------------------------

        return {

            "dashboard": "Executive Dashboard",

            "platform_statistics": {

                "total_users": total_users,

                "total_skin_profiles":
                    total_skin_profiles,

                "total_lifestyle_records":
                    total_lifestyle_records,

                "total_sleep_records":
                    total_sleep_records,

                "total_assessments":
                    total_assessments,

                "total_routines":
                    total_routines,

                "total_progress_records":
                    total_progress_records

            },

            "skin_health_statistics": {

                "latest_skin_score":
                    latest_skin_score,

                "average_skin_score":
                    average_skin_score,

                "average_routine_adherence":
                    average_routine_adherence,

                "overall_improvement":
                    overall_improvement

            },

            "system_status": {

                "backend": "Operational",

                "database": "Connected",

                "analytics": "Operational",

                "progress_tracking": "Operational"

            }

        }

    except Exception as e:

        return {

            "dashboard":
                "Executive Dashboard",

            "message":
                "Unable to generate dashboard",

            "error":
                str(e)

        }

    finally:

        db.close()