from __future__ import annotations
from typing import List
from datetime import datetime
from pathlib import Path
from uuid import uuid4
import mimetypes
import io
import base64
import csv

from PIL import Image, ImageStat
import re


from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import Table, Column, Integer, String, DateTime, Float, Text, Boolean, insert, select, desc

from .database import get_db, Base, engine
from .models import (
    User,
    SkinProfile as SkinProfileModel,
    Consultation,
    ConsultationMessage,
    Ingredient,
    Product,
    ProgressEntry,
    RoutineLog,
    RecommendationEvent,
)

from .auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_roles,
)

from .schemas import (
    UserRegister,
    UserLogin,
    Token,
    UserResponse,
    ConsultationCreate,
    ConsultationUpdate,
    ConsultationResponse,
    MessageCreate,
    MessageResponse,
    IngredientAnalysisRequest,
    ProductCompareRequest,
    ProgressEntryCreate,
    RoutineLogCreate,
    ProductResponse,
    IngredientResponse,
)

app = FastAPI(
    title="AI Skin Intelligence API",
    description="Backend API for personalized skincare intelligence",
    version="1.3.0"
)

Base.metadata.create_all(bind=engine)

# =========================================================
# PHOTO-ASSISTED SKIN CHECK-IN STORAGE
# =========================================================

UPLOAD_ROOT = Path(__file__).resolve().parent / "uploads" / "skin_checkins"
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_ROOT.parent)), name="uploads")

skin_checkins_table = Table(
    "skin_checkins",
    Base.metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("user_id", Integer, nullable=False, index=True),
    Column("pimple_count", Integer, nullable=False, default=0),
    Column("scar_count", Integer, nullable=False, default=0),
    Column("stretch_mark_count", Integer, nullable=False, default=0),
    Column("wrinkle_count", Integer, nullable=False, default=0),
    Column("pigmentation_spot_count", Integer, nullable=False, default=0),
    Column("redness_level", Integer, nullable=False, default=0),
    Column("dryness_level", Integer, nullable=False, default=0),
    Column("irritation_level", Integer, nullable=False, default=0),
    Column("has_scars", Boolean, nullable=False, default=False),
    Column("has_stretch_marks", Boolean, nullable=False, default=False),
    Column("has_wrinkles", Boolean, nullable=False, default=False),
    Column("photo_url", String(500), nullable=True),
    Column("photo_source", String(30), nullable=False, default="none"),
    Column("analysis_score", Float, nullable=False, default=100),
    Column("concern_level", String(30), nullable=False, default="Low"),
    Column("summary", Text, nullable=True),
    Column("created_at", DateTime, nullable=False, default=datetime.utcnow),
    extend_existing=True,
)


class SkinCheckinPayload(BaseModel):
    pimple_count: int = Field(0, ge=0, le=500)
    scar_count: int = Field(0, ge=0, le=500)
    stretch_mark_count: int = Field(0, ge=0, le=500)
    wrinkle_count: int = Field(0, ge=0, le=500)
    pigmentation_spot_count: int = Field(0, ge=0, le=500)
    redness_level: int = Field(0, ge=0, le=5)
    dryness_level: int = Field(0, ge=0, le=5)
    irritation_level: int = Field(0, ge=0, le=5)
    has_scars: bool = False
    has_stretch_marks: bool = False
    has_wrinkles: bool = False
    photo_url: str | None = None
    photo_source: str = Field("none", pattern="^(none|camera|gallery)$")
    notes: str = Field("", max_length=1000)

class SkinProfile(BaseModel):
    age_group: str
    skin_type: str
    primary_concern: str
    allergies: str
    sensitivities: str
    lifestyle_habits: str
    sleep_quality: str
    water_intake: str
    environmental_exposure: str

def _safe_checkin_text(value: str | None) -> str:
    return (value or "").strip()


def _checkin_analysis(payload: SkinCheckinPayload, profile: SkinProfile | None = None) -> dict:
    penalties = (
        payload.pimple_count * 1.8
        + payload.scar_count * 0.9
        + payload.stretch_mark_count * 0.5
        + payload.wrinkle_count * 0.8
        + payload.pigmentation_spot_count * 1.0
        + payload.redness_level * 4.0
        + payload.dryness_level * 4.0
        + payload.irritation_level * 5.0
    )

    score = int(round(max(0, min(100, 100 - penalties))))

    if score >= 80:
        level = "Low"
    elif score >= 60:
        level = "Moderate"
    else:
        level = "High"

    signals = []
    actions = []

    if payload.pimple_count > 0:
        signals.append(f"{payload.pimple_count} pimple(s) recorded.")
        actions.append("Keep acne-focused care targeted and avoid unnecessary irritation.")
    if payload.scar_count > 0 or payload.has_scars:
        signals.append(f"{payload.scar_count} scar(s) recorded.")
        actions.append("Track scar appearance over time and avoid aggressive product changes without guidance.")
    if payload.stretch_mark_count > 0 or payload.has_stretch_marks:
        signals.append(f"{payload.stretch_mark_count} stretch mark(s) recorded.")
        actions.append("Use consistent skin-care and monitor changes over time.")
    if payload.wrinkle_count > 0 or payload.has_wrinkles:
        signals.append(f"{payload.wrinkle_count} wrinkle(s) recorded.")
        actions.append("Keep sun protection and a consistent routine as ongoing priorities.")
    if payload.pigmentation_spot_count > 0:
        signals.append(f"{payload.pigmentation_spot_count} pigmentation spot(s) recorded.")
        actions.append("Prioritize daytime sun protection and gentle, consistent care.")
    if payload.redness_level >= 3:
        signals.append("Moderate-to-high redness was reported.")
        actions.append("Keep the routine simple and monitor tolerance.")
    if payload.dryness_level >= 3:
        signals.append("Moderate-to-high dryness was reported.")
        actions.append("Emphasize gentle cleansing and moisturization.")
    if payload.irritation_level >= 3:
        signals.append("Moderate-to-high irritation was reported.")
        actions.append("Avoid adding multiple new actives at the same time.")

    if not signals:
        signals.append("No notable visual or symptom counts were recorded in this check-in.")
        actions.append("Continue the current routine and keep tracking consistently.")

    profile_summary = None
    if profile is not None:
        profile_summary = {
            "skin_type": profile.skin_type,
            "primary_concern": profile.primary_concern,
            "sleep_quality": profile.sleep_quality,
            "water_intake": profile.water_intake,
        }

    return {
        "score": score,
        "concern_level": level,
        "signals": signals,
        "actions": list(dict.fromkeys(actions)),
        "profile_summary": profile_summary,
        "analysis_method": "Photo-assisted self-check-in with structured user-entered observations and stored profile data.",
        "vision_model_note": "The current implementation stores the photo and uses the entered counts/severity levels for analysis; it does not automatically diagnose lesions from the image.",
        "disclaimer": "This check-in is educational decision support, not a medical diagnosis. Persistent, worsening, painful, or concerning changes should be reviewed by a qualified professional.",
    }


try:
    Base.metadata.create_all(bind=engine, tables=[skin_checkins_table])
except Exception:
    # Database creation is retried by normal application startup/database setup.
    pass


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROOT ENDPOINT
# =========================================================

@app.get("/")
def root():
    return {
        "message": "AI Skin Intelligence API is running",
        "version": "1.3.0",
        "status": "healthy"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AI Skin Intelligence API",
        "version": "1.3.0"
    }


# =========================================================
# SKIN ASSESSMENT ENGINE
# =========================================================

def assess_skin(profile: SkinProfile):

    concerns = []
    risk_factors = []
    recommendations = []

    # -----------------------------------------------------
    # Primary concern
    # -----------------------------------------------------

    concerns.append(profile.primary_concern)

    # -----------------------------------------------------
    # Skin type analysis
    # -----------------------------------------------------

    if profile.skin_type == "Dry":

        concerns.append("Dryness")

        recommendations.append(
            "Focus on gentle cleansing and skin hydration."
        )

    elif profile.skin_type == "Oily":

        concerns.append("Excess oil")

        recommendations.append(
            "Focus on gentle cleansing and lightweight hydration."
        )

    elif profile.skin_type == "Combination":

        concerns.append("Combination skin")

        recommendations.append(
            "Use balanced hydration with targeted oil control."
        )

    elif profile.skin_type == "Sensitive":

        concerns.append("Skin sensitivity")

        risk_factors.append("Sensitive skin")

        recommendations.append(
            "Prefer gentle, fragrance-free skincare products."
        )

    elif profile.skin_type == "Normal":

        recommendations.append(
            "Maintain a simple, consistent skincare routine."
        )

    # -----------------------------------------------------
    # Sleep analysis
    # -----------------------------------------------------

    if profile.sleep_quality == "Poor":

        risk_factors.append("Poor sleep quality")

    elif profile.sleep_quality == "Average":

        risk_factors.append("Average sleep quality")

    # -----------------------------------------------------
    # Water intake analysis
    # -----------------------------------------------------

    if profile.water_intake == "Less than 1 L":

        risk_factors.append("Low water intake")

    elif profile.water_intake == "1 - 2 L":

        risk_factors.append("Moderate water intake")

    # -----------------------------------------------------
    # Environmental exposure
    # -----------------------------------------------------

    exposure = profile.environmental_exposure.lower()

    if "sun" in exposure:

        risk_factors.append("Frequent sun exposure")

    if "pollution" in exposure:

        risk_factors.append("Pollution exposure")

    if "dry climate" in exposure:

        risk_factors.append("Dry environmental conditions")

    # -----------------------------------------------------
    # Allergies
    # -----------------------------------------------------

    if profile.allergies.strip():

        risk_factors.append("Known allergies")

    # -----------------------------------------------------
    # Sensitivities
    # -----------------------------------------------------

    if profile.sensitivities.strip():

        risk_factors.append("Reported skin sensitivities")

    # -----------------------------------------------------
    # Remove duplicates
    # -----------------------------------------------------

    concerns = list(dict.fromkeys(concerns))

    risk_factors = list(dict.fromkeys(risk_factors))

    # -----------------------------------------------------
    # Prioritize primary concern
    # -----------------------------------------------------

    priority = [
        profile.primary_concern
    ]

    # -----------------------------------------------------
    # Risk level
    #
    # This is a simple application-level risk indicator,
    # not a medical diagnosis.
    # -----------------------------------------------------

    high_risk_factors = {
        "Sensitive skin",
        "Known allergies",
        "Reported skin sensitivities",
        "Poor sleep quality",
    }

    high_count = sum(
        1 for factor in risk_factors
        if factor in high_risk_factors
    )

    if high_count >= 2:

        risk_level = "High"

    elif len(risk_factors) >= 2:

        risk_level = "Moderate"

    elif len(risk_factors) == 1:

        risk_level = "Low"

    else:

        risk_level = "Low"

    # -----------------------------------------------------
    # Additional recommendations
    # -----------------------------------------------------

    if profile.allergies.strip():

        recommendations.append(
            "Check ingredient lists carefully and avoid known allergens."
        )

    if profile.sensitivities.strip():

        recommendations.append(
            "Introduce new products gradually and monitor skin tolerance."
        )

    if "sun" in exposure:

        recommendations.append(
            "Use daytime sun protection consistently."
        )

    return {
        "primary_concern": profile.primary_concern,
        "concerns": concerns,
        "priority_concerns": priority,
        "risk_factors": risk_factors,
        "risk_level": risk_level,
        "recommendations": recommendations,
    }


# =========================================================
# PERSONALIZED ROUTINE GENERATOR
# =========================================================

def generate_routine(
    profile: SkinProfile,
    assessment: dict
):

    skin_type = profile.skin_type.lower()
    concern = profile.primary_concern.lower()

    sensitivities = profile.sensitivities.strip()
    allergies = profile.allergies.strip()

    risk_level = assessment.get(
        "risk_level",
        "Low"
    )

    # =====================================================
    # MORNING ROUTINE
    # =====================================================

    morning = [

        {
            "step": 1,
            "name": "Gentle Cleanser",
            "description": (
                "Cleanse the skin gently to remove "
                "oil, sweat and overnight buildup."
            )
        }

    ]

    # -----------------------------------------------------
    # Skin-type based hydration
    # -----------------------------------------------------

    if skin_type == "dry":

        morning.append({

            "step": 2,
            "name": "Hydrating Serum",
            "description": (
                "Use a hydrating serum to support "
                "skin moisture and barrier function."
            )

        })

    elif skin_type == "oily":

        morning.append({

            "step": 2,
            "name": "Lightweight Hydrating Serum",
            "description": (
                "Use lightweight hydration without "
                "adding excessive heaviness."
            )

        })

    elif skin_type == "sensitive":

        morning.append({

            "step": 2,
            "name": "Barrier-Supporting Serum",
            "description": (
                "Choose a gentle, fragrance-free "
                "barrier-supporting formula."
            )

        })

    else:

        morning.append({

            "step": 2,
            "name": "Hydrating Serum",
            "description": (
                "Apply a lightweight hydrating serum."
            )

        })

    # =====================================================
    # CONCERN-BASED MORNING CARE
    # =====================================================

    if concern in [
        "hyperpigmentation",
        "dark spots",
        "uneven skin tone"
    ]:

        morning.append({

            "step": len(morning) + 1,
            "name": "Brightening Care",
            "description": (
                "Use a gentle brightening product "
                "appropriate for your skin tolerance."
            )

        })

    elif concern == "acne":

        morning.append({

            "step": len(morning) + 1,
            "name": "Acne-Focused Care",
            "description": (
                "Use a suitable acne-focused treatment "
                "while avoiding unnecessary irritation."
            )

        })

    elif concern == "redness":

        morning.append({

            "step": len(morning) + 1,
            "name": "Calming Care",
            "description": (
                "Use a gentle calming product designed "
                "to support the skin barrier."
            )

        })

    # =====================================================
    # MOISTURIZER
    # =====================================================

    if skin_type == "oily":

        moisturizer_description = (
            "Apply a lightweight, non-heavy moisturizer."
        )

    elif skin_type == "dry":

        moisturizer_description = (
            "Apply a richer moisturizer to support hydration."
        )

    elif skin_type == "sensitive":

        moisturizer_description = (
            "Use a gentle fragrance-free moisturizer "
            "to support the skin barrier."
        )

    else:

        moisturizer_description = (
            "Apply a moisturizer appropriate for your skin type."
        )

    morning.append({

        "step": len(morning) + 1,
        "name": "Moisturizer",
        "description": moisturizer_description

    })

    # =====================================================
    # SUNSCREEN
    # =====================================================

    morning.append({

        "step": len(morning) + 1,
        "name": "Broad-Spectrum Sunscreen",
        "description": (
            "Apply sunscreen during daytime and "
            "reapply as appropriate for sun exposure."
        )

    })

    # =====================================================
    # EVENING ROUTINE
    # =====================================================

    evening = [

        {
            "step": 1,
            "name": "Gentle Cleanser",
            "description": (
                "Cleanse the skin to remove "
                "daily buildup and sunscreen."
            )
        }

    ]

    # =====================================================
    # EVENING TREATMENT
    # =====================================================

    if concern == "acne":

        evening.append({

            "step": 2,
            "name": "Acne Treatment",
            "description": (
                "Use a suitable acne-focused treatment "
                "according to your skin tolerance."
            )

        })

    elif concern in [
        "hyperpigmentation",
        "dark spots",
        "uneven skin tone"
    ]:

        evening.append({

            "step": 2,
            "name": "Pigmentation-Focused Care",
            "description": (
                "Use a gentle treatment targeting "
                "uneven pigmentation."
            )

        })

    elif concern == "redness":

        evening.append({

            "step": 2,
            "name": "Calming Treatment",
            "description": (
                "Use gentle barrier-supportive care "
                "to minimize irritation."
            )

        })

    else:

        evening.append({

            "step": 2,
            "name": "Barrier Care",
            "description": (
                "Use a gentle hydrating or "
                "barrier-supporting treatment."
            )

        })

    # =====================================================
    # EVENING MOISTURIZER
    # =====================================================

    evening.append({

        "step": len(evening) + 1,
        "name": "Moisturizer",
        "description": (
            "Apply moisturizer to support overnight "
            "skin barrier recovery."
        )

    })

    # =====================================================
    # SAFETY NOTES
    # =====================================================

    safety_notes = []

    if skin_type == "sensitive":

        safety_notes.append(
            "Prioritize gentle, fragrance-free products "
            "and introduce new products gradually."
        )

    if sensitivities:

        safety_notes.append(
            "Avoid ingredients or products associated "
            "with the reported sensitivities."
        )

    if allergies:

        safety_notes.append(
            "Avoid known allergens and check product "
            "ingredient lists carefully."
        )

    if risk_level == "High":

        safety_notes.append(
            "Because the assessment indicates higher "
            "risk factors, keep the routine simple and "
            "avoid introducing multiple new products at once."
        )

    # =====================================================
    # WEEKLY CARE
    # =====================================================

    weekly = [

        "Maintain a consistent skincare routine.",

        "Avoid introducing several new products simultaneously.",

        "Monitor your skin's response to new products."

    ]

    if "sun" in profile.environmental_exposure.lower():

        weekly.append(
            "Pay particular attention to daytime sun protection."
        )

    # =====================================================
    # FINAL ROUTINE
    # =====================================================

    return {

        "skin_type": profile.skin_type,

        "primary_concern": profile.primary_concern,

        "risk_level": risk_level,

        "morning": morning,

        "evening": evening,

        "weekly": weekly,

        "safety_notes": safety_notes

    }


# =========================================================
# PROFILE + ASSESSMENT ENDPOINT
# =========================================================

@app.post("/api/profile")
def create_profile(
    profile: SkinProfile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update the authenticated user's skin profile and assessment."""

    existing_profile = db.query(SkinProfileModel).filter(
        SkinProfileModel.user_id == current_user.id
    ).first()

    if existing_profile:
        existing_profile.age_group = profile.age_group
        existing_profile.skin_type = profile.skin_type
        existing_profile.primary_concern = profile.primary_concern
        existing_profile.allergies = profile.allergies
        existing_profile.sensitivities = profile.sensitivities
        existing_profile.lifestyle_habits = profile.lifestyle_habits
        existing_profile.sleep_quality = profile.sleep_quality
        existing_profile.water_intake = profile.water_intake
        existing_profile.environmental_exposure = profile.environmental_exposure
        existing_profile.updated_at = datetime.utcnow()
    else:
        existing_profile = SkinProfileModel(
            user_id=current_user.id,
            age_group=profile.age_group,
            skin_type=profile.skin_type,
            primary_concern=profile.primary_concern,
            allergies=profile.allergies,
            sensitivities=profile.sensitivities,
            lifestyle_habits=profile.lifestyle_habits,
            sleep_quality=profile.sleep_quality,
            water_intake=profile.water_intake,
            environmental_exposure=profile.environmental_exposure,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(existing_profile)

    db.commit()
    db.refresh(existing_profile)

    assessment = assess_skin(profile)

    return {
        "message": "Skin profile assessed and saved successfully",
        "profile": profile.model_dump(),
        "assessment": assessment
    }


# =========================================================
# PERSONALIZED ROUTINE ENDPOINT
# =========================================================

@app.post("/api/routine")
def create_routine(profile: SkinProfile):

    assessment = assess_skin(profile)

    routine = generate_routine(
        profile,
        assessment
    )

    return {

        "message": "Personalized routine generated successfully",

        "profile": profile.model_dump(),

        "assessment": assessment,

        "routine": routine

    }
# =========================================================
# SHARED AUTHENTICATED SKIN PROFILE LOADER
# =========================================================

def get_saved_skin_profile(
    current_user: User,
    db: Session
) -> SkinProfile:
    """
    Load the saved skin profile belonging only to the authenticated user.
    This prevents AI features from using another user's profile.
    """
    db_profile = db.query(SkinProfileModel).filter(
        SkinProfileModel.user_id == current_user.id
    ).first()

    if not db_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skin profile not found. Complete your skin profile first."
        )

    return SkinProfile(
        age_group=db_profile.age_group or "",
        skin_type=db_profile.skin_type or "",
        primary_concern=db_profile.primary_concern or "",
        allergies=db_profile.allergies or "",
        sensitivities=db_profile.sensitivities or "",
        lifestyle_habits=db_profile.lifestyle_habits or "",
        sleep_quality=db_profile.sleep_quality or "",
        water_intake=db_profile.water_intake or "",
        environmental_exposure=db_profile.environmental_exposure or "",
    )


# =========================================================
# AI SKIN INTELLIGENCE ANALYSIS
# =========================================================

def generate_ai_skin_analysis(profile: SkinProfile, assessment: dict):
    """
    Explainable skin-intelligence layer built from the user's
    stored skin profile and the existing assessment engine.

    This is a decision-support feature, not a medical diagnosis.
    """

    scores = {
        "barrier_support": 0,
        "hydration": 0,
        "sun_protection": 0,
        "irritation_control": 0,
        "lifestyle": 0,
    }

    insights = []
    priority_areas = []
    actions = []

    skin_type = profile.skin_type.strip().lower()
    concern = profile.primary_concern.strip().lower()
    sleep = profile.sleep_quality.strip().lower()
    water = profile.water_intake.strip().lower()
    exposure = profile.environmental_exposure.strip().lower()
    allergies = profile.allergies.strip()
    sensitivities = profile.sensitivities.strip()
    lifestyle = profile.lifestyle_habits.strip().lower()

    # Skin-type intelligence
    if skin_type == "dry":
        scores["barrier_support"] += 2
        scores["hydration"] += 2
        priority_areas.append("Hydration and skin-barrier support")
        insights.append("Your dry-skin profile indicates that hydration and barrier support should be priorities.")
    elif skin_type == "oily":
        scores["irritation_control"] += 1
        priority_areas.append("Oil balance and gentle cleansing")
        insights.append("Your oily-skin profile suggests balancing oil control with non-stripping skincare.")
    elif skin_type == "combination":
        scores["hydration"] += 1
        scores["irritation_control"] += 1
        priority_areas.append("Balanced hydration and oil control")
        insights.append("Combination skin benefits from balanced hydration with targeted oil control.")
    elif skin_type == "sensitive":
        scores["barrier_support"] += 2
        scores["irritation_control"] += 3
        priority_areas.append("Barrier protection and irritation control")
        insights.append("Your sensitive-skin profile makes gentle, low-irritation care a high priority.")
    else:
        scores["barrier_support"] += 1
        priority_areas.append("Consistent maintenance")
        insights.append("A consistent basic routine is appropriate for maintaining your current skin profile.")

    # Primary concern intelligence
    if any(x in concern for x in ["hyperpigmentation", "dark spot", "uneven skin tone"]):
        scores["sun_protection"] += 3
        priority_areas.append("Pigmentation management and sun protection")
        insights.append("Your primary concern makes consistent daytime sun protection especially important.")
    elif any(x in concern for x in ["acne", "pimple", "breakout"]):
        scores["irritation_control"] += 2
        priority_areas.append("Breakout control")
        insights.append("Your profile indicates that breakout control should be balanced with gentle skin care.")
    elif "dryness" in concern:
        scores["hydration"] += 2
        priority_areas.append("Hydration")
    elif any(x in concern for x in ["redness", "irritation"]):
        scores["irritation_control"] += 2
        priority_areas.append("Irritation and redness control")

    # Sleep intelligence
    if sleep == "poor":
        scores["lifestyle"] += 2
        priority_areas.append("Sleep quality")
        insights.append("Poor sleep quality is a lifestyle factor worth improving alongside skincare.")
    elif sleep == "average":
        scores["lifestyle"] += 1

    # Hydration intelligence
    if water == "less than 1 l":
        scores["hydration"] += 2
        priority_areas.append("Daily hydration habits")
        insights.append("Your recorded water intake is low, so improving hydration habits may support overall skin care.")
    elif water == "1 - 2 l":
        scores["hydration"] += 1

    # Environment intelligence
    if "sun" in exposure:
        scores["sun_protection"] += 3
        priority_areas.append("Sun exposure protection")
        actions.append("Use consistent daytime sun protection when exposed to sunlight.")

    if "pollution" in exposure:
        scores["irritation_control"] += 1
        priority_areas.append("Environmental exposure")
        actions.append("Cleanse gently after significant pollution exposure without over-cleansing.")

    if "dry climate" in exposure:
        scores["hydration"] += 2
        priority_areas.append("Dry-environment protection")
        actions.append("Prioritize barrier-supporting hydration in dry environmental conditions.")

    # Allergy / sensitivity intelligence
    if allergies:
        scores["irritation_control"] += 3
        priority_areas.append("Allergen avoidance")
        actions.append("Review ingredient lists and avoid your known allergens.")

    if sensitivities:
        scores["irritation_control"] += 3
        priority_areas.append("Sensitivity management")
        actions.append("Introduce new skincare products gradually and monitor tolerance.")

    # Lifestyle intelligence
    if lifestyle:
        if any(x in lifestyle for x in ["smoking", "smoke"]):
            scores["lifestyle"] += 2
            priority_areas.append("Lifestyle exposure")
        if any(x in lifestyle for x in ["stress", "high stress"]):
            scores["lifestyle"] += 1
            priority_areas.append("Stress management")

    # Remove duplicates while preserving order
    priority_areas = list(dict.fromkeys(priority_areas))

    # Add existing assessment risk factors as supporting evidence
    risk_factors = assessment.get("risk_factors", [])
    if risk_factors:
        insights.append(
            "The analysis also considers these recorded factors: "
            + ", ".join(risk_factors) + "."
        )

    # Determine overall attention level
    total_score = sum(scores.values())
    if total_score >= 10 or len(risk_factors) >= 4:
        attention_level = "High"
    elif total_score >= 5 or len(risk_factors) >= 2:
        attention_level = "Moderate"
    else:
        attention_level = "Low"

    # Generate concise actions from the highest-scoring areas
    ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    area_labels = {
        "barrier_support": "Support the skin barrier",
        "hydration": "Prioritize hydration",
        "sun_protection": "Prioritize sun protection",
        "irritation_control": "Minimize irritation",
        "lifestyle": "Improve supportive lifestyle habits",
    }

    for area, score in ranked:
        if score > 0 and area_labels[area] not in actions:
            actions.append(area_labels[area] + ".")

    # Keep the response practical and compact
    actions = list(dict.fromkeys(actions))[:6]
    priority_areas = priority_areas[:6]
    insights = list(dict.fromkeys(insights))[:6]

    return {
        "analysis_type": "Explainable Skin Intelligence",
        "attention_level": attention_level,
        "overall_score": total_score,
        "skin_type": profile.skin_type,
        "primary_concern": profile.primary_concern,
        "priority_areas": priority_areas,
        "insights": insights,
        "recommended_actions": actions,
        "risk_factors": risk_factors,
        "assessment": assessment,
        "disclaimer": "This feature provides personalized skincare guidance from profile data and is not a medical diagnosis.",
    }


@app.get("/api/ai/skin-analysis")
def ai_skin_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate personalized skin intelligence for the logged-in user."""

    profile = get_saved_skin_profile(current_user, db)

    assessment = assess_skin(profile)
    analysis = generate_ai_skin_analysis(profile, assessment)

    return {
        "message": "AI skin analysis generated successfully",
        "user_id": current_user.id,
        "analysis": analysis,
    }


# =========================================================
# MILESTONE 2.2 - PERSONALIZED RECOMMENDATION ENGINE
# =========================================================

def build_personalized_recommendations(profile: SkinProfile, assessment: dict):
    """
    Build personalized recommendations from the user's saved skin profile
    and the existing skin assessment engine. This is an application-level
    recommendation engine, not a medical diagnosis.
    """
    skin_type = (profile.skin_type or "").strip().lower()
    concern = (profile.primary_concern or "").strip().lower()
    exposure = (profile.environmental_exposure or "").strip().lower()
    sleep = (profile.sleep_quality or "").strip().lower()
    water = (profile.water_intake or "").strip().lower()
    allergies = (profile.allergies or "").strip()
    sensitivities = (profile.sensitivities or "").strip()
    lifestyle = (profile.lifestyle_habits or "").strip().lower()
    risk_level = assessment.get("risk_level", "Low")

    priorities = []
    morning = []
    evening = []
    weekly = []
    lifestyle_recommendations = []
    safety_notes = []

    def add_priority(value):
        if value and value not in priorities:
            priorities.append(value)

    def add_safety(value):
        if value and value not in safety_notes:
            safety_notes.append(value)

    # ---- Skin type ----
    if skin_type == "dry":
        add_priority("Hydration and barrier support")
        morning.append("Use a gentle cleanser and follow with hydrating care.")
        evening.append("Use a richer moisturizer to support the skin barrier overnight.")
    elif skin_type == "oily":
        add_priority("Oil control without over-drying")
        morning.append("Use a gentle cleanser and lightweight hydration.")
        evening.append("Keep cleansing gentle and use a lightweight moisturizer.")
    elif skin_type == "combination":
        add_priority("Balanced hydration and oil control")
        morning.append("Use gentle cleansing with lightweight, balanced hydration.")
        evening.append("Moisturize consistently while avoiding unnecessarily heavy products.")
    elif skin_type == "sensitive":
        add_priority("Barrier protection and irritation reduction")
        morning.append("Prefer a gentle, fragrance-free routine with minimal active ingredients.")
        evening.append("Focus on barrier-supportive, fragrance-free care.")
        add_safety("Introduce new products one at a time and monitor skin tolerance.")
    else:
        add_priority("Consistent skin maintenance")
        morning.append("Maintain a simple, consistent cleansing and hydration routine.")
        evening.append("Cleanse gently and moisturize before bed.")

    # ---- Primary concern ----
    concern_map = {
        "hyperpigmentation": (
            "Pigmentation management",
            "Use gentle brightening care and prioritize consistent daytime sun protection.",
            "Use pigmentation-focused care gradually and avoid excessive irritation."
        ),
        "dark spots": (
            "Dark-spot management",
            "Prioritize daytime sun protection and gentle targeted care.",
            "Use targeted dark-spot care gradually and monitor tolerance."
        ),
        "uneven skin tone": (
            "Even skin tone",
            "Use gentle brightening care with consistent daytime sun protection.",
            "Keep targeted care gradual and barrier-friendly."
        ),
        "acne": (
            "Acne management",
            "Use a suitable acne-focused product while avoiding unnecessary irritation.",
            "Introduce acne-focused treatments gradually and keep the rest of the routine simple."
        ),
        "redness": (
            "Redness and barrier support",
            "Prefer calming, fragrance-free products and avoid unnecessary irritation.",
            "Focus on gentle barrier-supportive care rather than multiple active products."
        ),
        "dryness": (
            "Dryness and hydration",
            "Prioritize hydration and barrier-supportive moisturizing.",
            "Use consistent moisturizing and avoid over-cleansing."
        ),
    }

    if concern in concern_map:
        title, am, pm = concern_map[concern]
        add_priority(title)
        morning.append(am)
        evening.append(pm)
    elif concern:
        add_priority(concern.title())
        morning.append("Use gentle care targeted to your primary concern without overloading the routine.")
        evening.append("Use a simple targeted treatment appropriate for your skin tolerance.")

    # ---- Sun / environmental exposure ----
    if "sun" in exposure:
        add_priority("Sun protection")
        morning.append("Apply broad-spectrum sunscreen during daytime and reapply as appropriate for exposure.")
        weekly.append("Review your sun-protection habits and limit unnecessary prolonged sun exposure.")

    if "pollution" in exposure:
        add_priority("Environmental protection")
        evening.append("Cleanse gently at night to remove daily environmental buildup without over-cleansing.")

    if "dry climate" in exposure:
        add_priority("Environmental hydration")
        lifestyle_recommendations.append("In dry conditions, pay extra attention to regular moisturizing and barrier support.")

    # ---- Sleep and hydration ----
    if sleep == "poor":
        add_priority("Sleep and recovery")
        lifestyle_recommendations.append("Work toward a more consistent sleep schedule and adequate nightly rest.")
    elif sleep == "average":
        lifestyle_recommendations.append("Improving sleep consistency may support overall skin-care goals.")

    if water == "less than 1 l":
        add_priority("Hydration habits")
        lifestyle_recommendations.append("Increase fluid intake gradually according to your normal needs and medical guidance.")
    elif water == "1 - 2 l":
        lifestyle_recommendations.append("Maintain consistent fluid intake throughout the day.")

    # ---- Lifestyle text ----
    if lifestyle:
        if "smok" in lifestyle:
            add_priority("Lifestyle factors")
            lifestyle_recommendations.append("Consider reducing smoking exposure because it can work against overall skin-health goals.")
        if "stress" in lifestyle:
            add_priority("Stress management")
            lifestyle_recommendations.append("Include practical stress-management habits that fit your daily routine.")

    # ---- Allergies and sensitivities ----
    if allergies:
        add_safety("Avoid known allergens and check ingredient lists carefully before using a product.")
    if sensitivities:
        add_safety("Avoid products associated with your reported sensitivities and introduce changes gradually.")
    if risk_level == "High":
        add_safety("Keep the routine simple and avoid introducing several new products at the same time.")

    # ---- Universal baseline ----
    morning.append("Use sunscreen during daytime as appropriate for your exposure.")
    weekly.extend([
        "Keep the routine consistent rather than changing several products at once.",
        "Monitor how your skin responds to new products.",
    ])

    # De-duplicate while preserving order.
    morning = list(dict.fromkeys(morning))
    evening = list(dict.fromkeys(evening))
    weekly = list(dict.fromkeys(weekly))
    lifestyle_recommendations = list(dict.fromkeys(lifestyle_recommendations))
    safety_notes = list(dict.fromkeys(safety_notes))

    return {
        "skin_summary": f"{profile.skin_type} skin with {profile.primary_concern} as the primary concern.",
        "risk_level": risk_level,
        "priority_areas": priorities,
        "morning_recommendations": morning,
        "evening_recommendations": evening,
        "weekly_care": weekly,
        "lifestyle_recommendations": lifestyle_recommendations,
        "safety_notes": safety_notes,
        "medical_disclaimer": (
            "These recommendations are educational and personalized from the supplied profile. "
            "They are not a medical diagnosis or a substitute for professional dermatological advice."
        ),
    }


@app.get("/api/ai/recommendations")
def get_personalized_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return personalized recommendations for the authenticated user."""
    profile = get_saved_skin_profile(current_user, db)

    assessment = assess_skin(profile)
    recommendations = build_personalized_recommendations(profile, assessment)

    return {
        "message": "Personalized recommendations generated successfully",
        "user_id": current_user.id,
        "profile": profile.model_dump(),
        "assessment": assessment,
        "recommendations": recommendations,
    }



# =========================================================
# MILESTONE 2.3 - AI DERMATOLOGY RECOMMENDATION
# =========================================================

def build_dermatology_recommendation(profile: SkinProfile, assessment: dict):
    """
    Provide a cautious recommendation about whether professional
    dermatology guidance may be useful.

    This is decision support based on the saved profile.
    It does not diagnose a skin condition or determine medical necessity.
    """

    risk_level = assessment.get("risk_level", "Low")
    risk_factors = assessment.get("risk_factors", [])

    reasons = []
    concern = (profile.primary_concern or "").strip().lower()
    skin_type = (profile.skin_type or "").strip().lower()

    # Higher-risk profile factors
    if risk_level == "High":
        reasons.append(
            "The skin assessment contains multiple higher-priority risk factors."
        )
    elif risk_level == "Moderate":
        reasons.append(
            "The skin assessment contains multiple factors that may benefit from additional professional guidance."
        )

    if profile.allergies.strip():
        reasons.append(
            "Reported allergies make careful professional guidance and ingredient selection important."
        )

    if profile.sensitivities.strip():
        reasons.append(
            "Reported skin sensitivities suggest that product selection should be approached cautiously."
        )

    if skin_type == "sensitive":
        reasons.append(
            "Sensitive skin can benefit from a simpler routine and professional guidance when irritation persists."
        )

    if concern in {
        "acne",
        "hyperpigmentation",
        "dark spots",
        "uneven skin tone",
        "redness",
    }:
        reasons.append(
            f"Your primary concern ({profile.primary_concern}) may benefit from individualized dermatology guidance if it persists or worsens."
        )

    if not reasons:
        reasons.append(
            "No strong professional-review indicators were identified from the information currently stored in your skin profile."
        )

    # Decide recommendation level without claiming a diagnosis.
    if risk_level == "High" or profile.allergies.strip() or profile.sensitivities.strip():
        consultation_recommended = True
        urgency = "Moderate"
        next_step = (
            "Consider booking a dermatologist consultation for personalized professional guidance."
        )
    elif risk_level == "Moderate":
        consultation_recommended = True
        urgency = "Routine"
        next_step = (
            "Consider a dermatologist consultation if your concerns persist, worsen, or do not improve with a gentle routine."
        )
    else:
        consultation_recommended = False
        urgency = "Low"
        next_step = (
            "Continue your personalized routine and consider professional advice if symptoms persist, worsen, or become concerning."
        )

    return {
        "consultation_recommended": consultation_recommended,
        "urgency": urgency,
        "reason": reasons[:5],
        "risk_factors": risk_factors,
        "next_step": next_step,
        "disclaimer": (
            "This recommendation is educational decision support based on the "
            "information in your skin profile. It is not a medical diagnosis "
            "or a determination of medical necessity."
        ),
    }


@app.get("/api/ai/dermatology-recommendation")
def get_dermatology_recommendation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return an explainable recommendation about seeking dermatology guidance."""

    profile = get_saved_skin_profile(current_user, db)

    assessment = assess_skin(profile)
    recommendation = build_dermatology_recommendation(profile, assessment)

    return {
        "message": "AI dermatology recommendation generated successfully",
        "user_id": current_user.id,
        "profile": profile.model_dump(),
        "assessment": assessment,
        "recommendation": recommendation,
    }



# =========================================================
# MILESTONE 2.4 - RECOMMENDATION EXPLANATION
# =========================================================

def build_recommendation_explanation(profile: SkinProfile, assessment: dict, recommendations: dict):
    """
    Explain why the personalized recommendations were generated.

    This uses the same profile and assessment rules as the recommendation
    engine so that the explanation stays consistent with the recommendation.
    It is educational decision support, not a medical diagnosis.
    """

    skin_type = (profile.skin_type or "").strip().lower()
    concern = (profile.primary_concern or "").strip().lower()
    exposure = (profile.environmental_exposure or "").strip().lower()
    risk_level = assessment.get("risk_level", "Low")

    explanations = []

    def add(category, recommendation, reason):
        explanations.append({
            "category": category,
            "recommendation": recommendation,
            "why": reason
        })

    # Skin type
    if skin_type == "dry":
        add(
            "Skin type",
            "Gentle cleansing and hydration",
            "Your profile records dry skin, so the routine emphasizes hydration and skin-barrier support."
        )
    elif skin_type == "oily":
        add(
            "Skin type",
            "Gentle cleansing with lightweight hydration",
            "Your profile records oily skin, so the routine aims to support oil balance without unnecessarily stripping the skin."
        )
    elif skin_type == "combination":
        add(
            "Skin type",
            "Balanced hydration and oil control",
            "Your combination-skin profile calls for a balance between hydration and oil control."
        )
    elif skin_type == "sensitive":
        add(
            "Skin type",
            "Gentle, fragrance-free and barrier-supportive care",
            "Your profile records sensitive skin, so reducing unnecessary irritation is a priority."
        )
    else:
        add(
            "Skin type",
            "Simple and consistent skincare",
            "The routine uses a basic maintenance approach based on the recorded skin type."
        )

    # Primary concern
    if concern in {"hyperpigmentation", "dark spots", "uneven skin tone"}:
        add(
            "Primary concern",
            "Targeted pigmentation care and daytime sun protection",
            f"Your primary concern is {profile.primary_concern}, so the routine prioritizes gradual targeted care and consistent sun protection."
        )
    elif concern == "acne":
        add(
            "Primary concern",
            "Acne-focused care with minimal unnecessary irritation",
            "Your primary concern is acne, so the routine emphasizes targeted care while keeping the rest of the routine simple."
        )
    elif concern == "redness":
        add(
            "Primary concern",
            "Calming and barrier-supportive care",
            "Your primary concern is redness, so the routine emphasizes gentle care and irritation reduction."
        )
    elif concern == "dryness":
        add(
            "Primary concern",
            "Hydration and barrier support",
            "Your primary concern is dryness, so moisturizing and barrier-supportive care are prioritized."
        )
    elif concern:
        add(
            "Primary concern",
            f"Care targeted toward {profile.primary_concern}",
            "The routine includes targeted guidance based on the primary concern stored in your profile."
        )

    # Environment
    if "sun" in exposure:
        add(
            "Environment",
            "Consistent daytime sun protection",
            "Your profile records sun exposure, which is why daytime sun protection is emphasized."
        )

    if "pollution" in exposure:
        add(
            "Environment",
            "Gentle cleansing after environmental exposure",
            "Your profile records pollution exposure, so the routine includes gentle cleansing without recommending over-cleansing."
        )

    if "dry climate" in exposure:
        add(
            "Environment",
            "Extra barrier-supportive hydration",
            "Your profile records dry-climate exposure, so maintaining skin hydration is emphasized."
        )

    # Lifestyle
    if (profile.sleep_quality or "").strip().lower() == "poor":
        add(
            "Lifestyle",
            "Improve sleep consistency",
            "Your profile records poor sleep quality, so sleep and recovery are included as supportive lifestyle factors."
        )

    if (profile.water_intake or "").strip().lower() == "less than 1 l":
        add(
            "Lifestyle",
            "Improve daily hydration habits",
            "Your recorded water intake is below the lowest tracked range, so hydration habits are highlighted."
        )

    lifestyle = (profile.lifestyle_habits or "").strip().lower()
    if "smok" in lifestyle:
        add(
            "Lifestyle",
            "Consider reducing smoking exposure",
            "Smoking exposure is recorded in your lifestyle information, so it is included as a supportive skin-health consideration."
        )

    if "stress" in lifestyle:
        add(
            "Lifestyle",
            "Include practical stress-management habits",
            "Stress is recorded in your lifestyle information, so stress management is included as a supportive factor."
        )

    # Safety
    if profile.allergies.strip():
        add(
            "Safety",
            "Avoid known allergens and check ingredient lists",
            "Your profile contains reported allergies, so ingredient checking and allergen avoidance are emphasized."
        )

    if profile.sensitivities.strip():
        add(
            "Safety",
            "Introduce new products gradually",
            "Your profile contains reported sensitivities, so gradual product introduction and tolerance monitoring are recommended."
        )

    if risk_level == "High":
        add(
            "Safety",
            "Keep the routine simple",
            "The existing assessment marked the profile as higher risk, so unnecessary product changes should be minimized."
        )

    return {
        "explanation_type": "Explainable Personalized Recommendations",
        "risk_level": risk_level,
        "summary": (
            "Recommendations are generated from your saved skin profile, "
            "existing skin assessment, environmental exposure, lifestyle factors, "
            "and reported allergies or sensitivities."
        ),
        "explanations": explanations[:12],
        "disclaimer": (
            "These explanations describe how the application generated its "
            "recommendations from profile data. They are not a medical diagnosis "
            "or a substitute for professional dermatological advice."
        ),
    }


@app.get("/api/ai/recommendation-explanation")
def get_recommendation_explanation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Explain why personalized skincare recommendations were generated."""

    profile = get_saved_skin_profile(current_user, db)

    assessment = assess_skin(profile)
    recommendations = build_personalized_recommendations(profile, assessment)
    explanation = build_recommendation_explanation(
        profile,
        assessment,
        recommendations
    )

    return {
        "message": "Recommendation explanation generated successfully",
        "user_id": current_user.id,
        "profile": profile.model_dump(),
        "recommendations": recommendations,
        "explanation": explanation,
    }


# =========================================================
# CONSOLIDATED AI SKIN INTELLIGENCE SUMMARY
# =========================================================

@app.get("/api/ai/summary")
def get_ai_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Return the complete AI Skin Intelligence result for the
    authenticated user's saved profile in one API response.
    """
    profile = get_saved_skin_profile(current_user, db)
    assessment = assess_skin(profile)

    analysis = generate_ai_skin_analysis(profile, assessment)
    recommendations = build_personalized_recommendations(
        profile,
        assessment
    )
    dermatology_recommendation = build_dermatology_recommendation(
        profile,
        assessment
    )
    recommendation_explanation = build_recommendation_explanation(
        profile,
        assessment,
        recommendations
    )

    return {
        "message": "Complete AI skin intelligence summary generated successfully",
        "user_id": current_user.id,
        "profile": profile.model_dump(),
        "assessment": assessment,
        "analysis": analysis,
        "recommendations": recommendations,
        "dermatology_recommendation": dermatology_recommendation,
        "recommendation_explanation": recommendation_explanation,
        "disclaimer": (
            "This application provides educational, personalized skincare "
            "decision support from profile data. It is not a medical diagnosis "
            "or a substitute for professional dermatological advice."
        ),
    }


# =========================================================
# AUTHENTICATION
# =========================================================


@app.post(
    "/auth/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    # Check whether email already exists
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )

    # Validate role
    allowed_roles = {
        "user",
        "consultant",
        "dermatologist",
        "admin",
    }

    if user_data.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role"
        )

    # Create database user
    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        role=user_data.role,
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post(
    "/auth/login",
    response_model=Token
)
def login(
    user_data: UserLogin,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    if not verify_password(
        user_data.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    access_token = create_access_token(
        user_id=user.id,
        role=user.role
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role,
    }


@app.get(
    "/auth/me",
    response_model=UserResponse
)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user
# =========================================================
# ROLE-BASED ACCESS CONTROL
# =========================================================


@app.get("/roles/user")
def user_access(
    current_user: User = Depends(
        require_roles("user", "consultant", "dermatologist", "admin")
    )
):
    return {
        "message": "User access granted",
        "user_id": current_user.id,
        "role": current_user.role,
    }


@app.get("/roles/consultant")
def consultant_access(
    current_user: User = Depends(
        require_roles("consultant", "admin")
    )
):
    return {
        "message": "Consultant access granted",
        "user_id": current_user.id,
        "role": current_user.role,
    }


@app.get("/roles/dermatologist")
def dermatologist_access(
    current_user: User = Depends(
        require_roles("dermatologist", "admin")
    )
):
    return {
        "message": "Dermatologist access granted",
        "user_id": current_user.id,
        "role": current_user.role,
    }


@app.get("/roles/admin")
def admin_access(
    current_user: User = Depends(
        require_roles("admin")
    )
):
    return {
        "message": "Admin access granted",
        "user_id": current_user.id,
        "role": current_user.role,
    }
@app.post("/skin-profile")
def create_skin_profile(
    profile: SkinProfile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing_profile = db.query(SkinProfileModel).filter(
        SkinProfileModel.user_id == current_user.id
    ).first()

    if existing_profile:
        raise HTTPException(
            status_code=400,
            detail="Skin profile already exists"
        )

    new_profile = SkinProfileModel(
        user_id=current_user.id,
        age_group=profile.age_group,
        skin_type=profile.skin_type,
        primary_concern=profile.primary_concern,
        allergies=profile.allergies,
        sensitivities=profile.sensitivities,
        lifestyle_habits=profile.lifestyle_habits,
        sleep_quality=profile.sleep_quality,
        water_intake=profile.water_intake,
        environmental_exposure=profile.environmental_exposure,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    return new_profile


@app.get("/skin-profile/me")
def get_my_skin_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(SkinProfileModel).filter(
        SkinProfileModel.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Skin profile not found"
        )

    return profile


@app.put("/skin-profile/me")
def update_my_skin_profile(
    profile: SkinProfile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing_profile = db.query(SkinProfileModel).filter(
        SkinProfileModel.user_id == current_user.id
    ).first()

    if not existing_profile:
        raise HTTPException(
            status_code=404,
            detail="Skin profile not found"
        )

    existing_profile.age_group = profile.age_group
    existing_profile.skin_type = profile.skin_type
    existing_profile.primary_concern = profile.primary_concern
    existing_profile.allergies = profile.allergies
    existing_profile.sensitivities = profile.sensitivities
    existing_profile.lifestyle_habits = profile.lifestyle_habits
    existing_profile.sleep_quality = profile.sleep_quality
    existing_profile.water_intake = profile.water_intake
    existing_profile.environmental_exposure = profile.environmental_exposure
    existing_profile.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(existing_profile)

    return existing_profile


# =========================================================
# DERMATOLOGIST CONSULTATION
# =========================================================


@app.post("/consultations", status_code=status.HTTP_201_CREATED)
def create_consultation(
    data: ConsultationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Auto-fill skin data from user's profile if available
    skin_profile = db.query(SkinProfileModel).filter(
        SkinProfileModel.user_id == current_user.id
    ).first()

    skin_type = skin_profile.skin_type if skin_profile else None
    primary_concern = skin_profile.primary_concern if skin_profile else None

    # Derive priority from assessment risk level
    priority = "medium"
    if skin_profile:
        try:
            profile_obj = SkinProfile(
                age_group=skin_profile.age_group or "",
                skin_type=skin_profile.skin_type or "",
                primary_concern=skin_profile.primary_concern or "",
                allergies=skin_profile.allergies or "",
                sensitivities=skin_profile.sensitivities or "",
                lifestyle_habits=skin_profile.lifestyle_habits or "",
                sleep_quality=skin_profile.sleep_quality or "",
                water_intake=skin_profile.water_intake or "",
                environmental_exposure=skin_profile.environmental_exposure or "",
            )
            assessment = assess_skin(profile_obj)
            risk = assessment.get("risk_level", "Low")
            if risk == "High":
                priority = "high"
            elif risk == "Moderate":
                priority = "medium"
            else:
                priority = "low"
        except Exception:
            priority = "medium"

    consultation = Consultation(
        user_id=current_user.id,
        subject=data.subject,
        description=data.description,
        skin_type=skin_type,
        primary_concern=primary_concern,
        status="pending",
        priority=priority,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    db.add(consultation)
    db.commit()
    db.refresh(consultation)

    return {
        "message": "Consultation request created",
        "consultation_id": consultation.id,
        "status": consultation.status,
        "priority": consultation.priority,
    }


@app.get("/consultations/my")
def get_my_consultations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    consultations = db.query(Consultation).filter(
        (Consultation.user_id == current_user.id) |
        (Consultation.dermatologist_id == current_user.id)
    ).order_by(Consultation.updated_at.desc()).all()

    results = []
    for c in consultations:
        results.append({
            "id": c.id,
            "user_id": c.user_id,
            "patient_name": c.patient.full_name if c.patient else None,
            "dermatologist_id": c.dermatologist_id,
            "dermatologist_name": c.dermatologist.full_name if c.dermatologist else None,
            "subject": c.subject,
            "description": c.description,
            "skin_type": c.skin_type,
            "primary_concern": c.primary_concern,
            "status": c.status,
            "priority": c.priority,
            "dermatologist_notes": c.dermatologist_notes,
            "recommendations": c.recommendations,
            "created_at": c.created_at.isoformat(),
            "updated_at": c.updated_at.isoformat(),
        })

    return results


@app.get("/consultations/queue")
def get_consultation_queue(
    current_user: User = Depends(
        require_roles("dermatologist", "admin")
    ),
    db: Session = Depends(get_db)
):
    consultations = db.query(Consultation).filter(
        Consultation.status == "pending"
    ).order_by(Consultation.created_at.asc()).all()

    results = []
    for c in consultations:
        results.append({
            "id": c.id,
            "user_id": c.user_id,
            "patient_name": c.patient.full_name if c.patient else None,
            "subject": c.subject,
            "description": c.description,
            "skin_type": c.skin_type,
            "primary_concern": c.primary_concern,
            "status": c.status,
            "priority": c.priority,
            "created_at": c.created_at.isoformat(),
        })

    return results


@app.get("/consultations/{consultation_id}")
def get_consultation(
    consultation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    consultation = db.query(Consultation).filter(
        Consultation.id == consultation_id
    ).first()

    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    # Only the patient, assigned dermatologist, or admin can view
    if (
        consultation.user_id != current_user.id
        and consultation.dermatologist_id != current_user.id
        and current_user.role != "admin"
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    return {
        "id": consultation.id,
        "user_id": consultation.user_id,
        "patient_name": consultation.patient.full_name if consultation.patient else None,
        "dermatologist_id": consultation.dermatologist_id,
        "dermatologist_name": consultation.dermatologist.full_name if consultation.dermatologist else None,
        "subject": consultation.subject,
        "description": consultation.description,
        "skin_type": consultation.skin_type,
        "primary_concern": consultation.primary_concern,
        "status": consultation.status,
        "priority": consultation.priority,
        "dermatologist_notes": consultation.dermatologist_notes,
        "recommendations": consultation.recommendations,
        "created_at": consultation.created_at.isoformat(),
        "updated_at": consultation.updated_at.isoformat(),
    }


@app.patch("/consultations/{consultation_id}/accept")
def accept_consultation(
    consultation_id: int,
    current_user: User = Depends(
        require_roles("dermatologist", "admin")
    ),
    db: Session = Depends(get_db)
):
    consultation = db.query(Consultation).filter(
        Consultation.id == consultation_id
    ).first()

    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    if consultation.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot accept a consultation with status '{consultation.status}'"
        )

    consultation.dermatologist_id = current_user.id
    consultation.status = "in_review"
    consultation.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(consultation)

    return {
        "message": "Consultation accepted",
        "consultation_id": consultation.id,
        "status": consultation.status,
    }


@app.patch("/consultations/{consultation_id}/respond")
def respond_to_consultation(
    consultation_id: int,
    data: ConsultationUpdate,
    current_user: User = Depends(
        require_roles("dermatologist", "admin")
    ),
    db: Session = Depends(get_db)
):
    consultation = db.query(Consultation).filter(
        Consultation.id == consultation_id
    ).first()

    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    if consultation.dermatologist_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You are not assigned to this consultation")

    if consultation.status not in ("in_review", "pending"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot respond to a consultation with status '{consultation.status}'"
        )

    if data.dermatologist_notes is not None:
        consultation.dermatologist_notes = data.dermatologist_notes

    if data.recommendations is not None:
        consultation.recommendations = data.recommendations

    consultation.status = "completed"
    consultation.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(consultation)

    return {
        "message": "Consultation response submitted",
        "consultation_id": consultation.id,
        "status": consultation.status,
    }


@app.patch("/consultations/{consultation_id}/cancel")
def cancel_consultation(
    consultation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    consultation = db.query(Consultation).filter(
        Consultation.id == consultation_id
    ).first()

    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    if consultation.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    if consultation.status == "completed":
        raise HTTPException(status_code=400, detail="Cannot cancel a completed consultation")

    consultation.status = "cancelled"
    consultation.updated_at = datetime.utcnow()

    db.commit()

    return {
        "message": "Consultation cancelled",
        "consultation_id": consultation.id,
        "status": "cancelled",
    }


@app.post("/consultations/{consultation_id}/messages", status_code=status.HTTP_201_CREATED)
def send_message(
    consultation_id: int,
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    consultation = db.query(Consultation).filter(
        Consultation.id == consultation_id
    ).first()

    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    if (
        consultation.user_id != current_user.id
        and consultation.dermatologist_id != current_user.id
        and current_user.role != "admin"
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    if consultation.status in ("cancelled",):
        raise HTTPException(status_code=400, detail="Cannot message on a cancelled consultation")

    msg = ConsultationMessage(
        consultation_id=consultation_id,
        sender_id=current_user.id,
        message=data.message,
        created_at=datetime.utcnow(),
    )

    db.add(msg)
    db.commit()
    db.refresh(msg)

    return {
        "id": msg.id,
        "consultation_id": msg.consultation_id,
        "sender_id": msg.sender_id,
        "sender_name": current_user.full_name,
        "message": msg.message,
        "created_at": msg.created_at.isoformat(),
    }


@app.get("/consultations/{consultation_id}/messages")
def get_messages(
    consultation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    consultation = db.query(Consultation).filter(
        Consultation.id == consultation_id
    ).first()

    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    if (
        consultation.user_id != current_user.id
        and consultation.dermatologist_id != current_user.id
        and current_user.role != "admin"
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    messages = db.query(ConsultationMessage).filter(
        ConsultationMessage.consultation_id == consultation_id
    ).order_by(ConsultationMessage.created_at.asc()).all()

    results = []
    for m in messages:
        results.append({
            "id": m.id,
            "consultation_id": m.consultation_id,
            "sender_id": m.sender_id,
            "sender_name": m.sender.full_name if m.sender else None,
            "message": m.message,
            "created_at": m.created_at.isoformat(),
        })

    return results

# =========================================================
# MILESTONE 3
# INGREDIENT INTELLIGENCE
# PRODUCT INTELLIGENCE
# PROGRESS TRACKING
# ANALYTICS
# DASHBOARD
# =========================================================

MILESTONE3_DISCLAIMER = (
    "Milestone 3 provides educational, profile-based skincare decision support. "
    "It is not a medical diagnosis and does not replace professional advice."
)


# ---------------------------------------------------------
# Internal utility helpers
# ---------------------------------------------------------

def _m3_split(value: str | None) -> list[str]:
    if not value:
        return []
    return [part.strip().lower() for part in re.split(r"[,;|]+", value) if part.strip()]


def _m3_clamp(value: float, low: float = 0, high: float = 100) -> float:
    return max(low, min(high, float(value)))


PRODUCT_ACTIVE_DETAILS = {
    "gentle barrier cleanser": [{"name":"Ceramides","concentration":"3% (demo catalog formulation)","role":"Barrier-support ingredient."}],
    "lightweight balance cleanser": [{"name":"Niacinamide","concentration":"4% (demo catalog formulation)","role":"Oil-balance and barrier-support ingredient."}],
    "hydration support serum": [{"name":"Hyaluronic Acid","concentration":"1.5% (demo catalog formulation)","role":"Hydration-support ingredient."}],
    "barrier cream": [{"name":"Ceramides","concentration":"3% (demo catalog formulation)","role":"Barrier-support ingredient."}],
    "daily uv shield spf 50": [{"name":"UV Filters","concentration":"SPF 50 protection level (demo catalog formulation)","role":"UV-protection system."},{"name":"Niacinamide","concentration":"4% (demo catalog formulation)","role":"Barrier and tone-support ingredient."}],
    "blemish support serum": [{"name":"Salicylic Acid","concentration":"2% (demo catalog formulation)","role":"BHA / blemish-focused active."},{"name":"Niacinamide","concentration":"4% (demo catalog formulation)","role":"Oil-balance and barrier-support ingredient."}],
    "brightening antioxidant serum": [{"name":"Vitamin C","concentration":"10% (demo catalog formulation)","role":"Antioxidant / brightening active."},{"name":"Niacinamide","concentration":"4% (demo catalog formulation)","role":"Barrier and tone-support ingredient."}],
}


def _m3_product_dict(product: Product) -> dict:
    return {
        "id": product.id,
        "name": product.name,
        "brand": product.brand,
        "category": product.category,
        "description": product.description,
        "ingredients": _m3_split(product.ingredients),
        "suitable_skin_types": _m3_split(product.suitable_skin_types),
        "concern_targets": _m3_split(product.concern_targets),
        "price": float(product.price or 0),
        "currency": product.currency,
        "rating": float(product.rating or 0),
        "is_active": product.is_active,
        "active_ingredient_details": PRODUCT_ACTIVE_DETAILS.get((product.name or "").strip().lower(), []),
    }


def _m3_assessment_score(profile: SkinProfile, assessment: dict) -> float:
    risk = assessment.get("risk_level", "Low")
    base = {"Low": 82, "Moderate": 68, "High": 52}.get(risk, 65)

    skin_type = (profile.skin_type or "").lower()
    concern = (profile.primary_concern or "").lower()

    if skin_type == "sensitive":
        base -= 4
    if concern in {"acne", "redness"}:
        base -= 4

    return _m3_clamp(base)


def _m3_sleep_score(profile: SkinProfile) -> float:
    value = (profile.sleep_quality or "").strip().lower()
    return {
        "excellent": 95,
        "good": 82,
        "average": 65,
        "poor": 40,
    }.get(value, 60)


def _m3_hydration_score(profile: SkinProfile) -> float:
    value = (profile.water_intake or "").strip().lower()

    if "more than" in value:
        return 90
    if "2 - 3" in value or "2-3" in value:
        return 82
    if "1 - 2" in value or "1-2" in value:
        return 62
    if "less" in value:
        return 40

    return 55


def _m3_lifestyle_score(profile: SkinProfile) -> float:
    text = (profile.lifestyle_habits or "").lower()
    score = 82

    if "smok" in text:
        score -= 20
    if "stress" in text:
        score -= 10
    if "sedentary" in text:
        score -= 5

    return _m3_clamp(score)


def _m3_routine_consistency(db: Session, user_id: int) -> float:
    rows = (
        db.query(RoutineLog)
        .filter(RoutineLog.user_id == user_id)
        .order_by(RoutineLog.log_date.desc())
        .limit(14)
        .all()
    )

    if not rows:
        return 70.0

    total = 0.0
    for row in rows:
        completed = sum(
            bool(flag)
            for flag in (
                row.morning_completed,
                row.evening_completed,
                row.sunscreen_completed,
            )
        )
        total += (completed / 3.0) * 100.0

    return round(total / len(rows), 1)


def _m3_weighted_score(
    profile: SkinProfile,
    assessment: dict,
    db: Session,
    user_id: int,
) -> dict:
    condition = _m3_assessment_score(profile, assessment)
    lifestyle = _m3_lifestyle_score(profile)
    sleep = _m3_sleep_score(profile)
    routine = _m3_routine_consistency(db, user_id)
    hydration = _m3_hydration_score(profile)

    overall = (
        condition * 0.35
        + lifestyle * 0.20
        + sleep * 0.15
        + routine * 0.20
        + hydration * 0.10
    )

    return {
        "overall": int(round(_m3_clamp(overall))),
        "components": {
            "skin_condition_assessment": round(condition, 1),
            "lifestyle_habits": round(lifestyle, 1),
            "sleep_quality": round(sleep, 1),
            "routine_consistency": round(routine, 1),
            "hydration_level": round(hydration, 1),
        },
        "weights": {
            "skin_condition_assessment": 0.35,
            "lifestyle_habits": 0.20,
            "sleep_quality": 0.15,
            "routine_consistency": 0.20,
            "hydration_level": 0.10,
        },
    }


def _m3_seed_catalog(db: Session) -> None:
    # Seed only when no records exist, so a real catalog is never overwritten.
    if db.query(Ingredient).count() == 0:
        db.add_all([
            Ingredient(
                name="Niacinamide",
                category="Vitamin B3",
                description="A cosmetic ingredient commonly used in barrier and oil-balance focused skincare.",
                benefits="Barrier support and appearance of uneven tone.",
                caution="Introduce gradually if your skin is reactive.",
                suitable_skin_types="normal,dry,oily,combination,sensitive",
                concern_targets="acne,dark spots,hyperpigmentation,redness,uneven skin tone",
                common_interactions="Keep a routine simple when introducing multiple active ingredients.",
                allergen_flag=False,
            ),
            Ingredient(
                name="Vitamin C",
                category="Antioxidant",
                description="An antioxidant ingredient used in many brightening-oriented formulations.",
                benefits="Antioxidant support and appearance of uneven tone.",
                caution="Can irritate some skin types, especially stronger formulations.",
                suitable_skin_types="normal,oily,combination",
                concern_targets="dark spots,hyperpigmentation,uneven skin tone",
                common_interactions="Avoid introducing several new actives at once.",
                allergen_flag=False,
            ),
            Ingredient(
                name="Hyaluronic Acid",
                category="Humectant",
                description="A hydrating ingredient used to support the feel of moisturized skin.",
                benefits="Hydration support.",
                caution="Use according to the formulation's directions.",
                suitable_skin_types="normal,dry,oily,combination,sensitive",
                concern_targets="dry skin",
                common_interactions="Often paired with simple moisturizing routines.",
                allergen_flag=False,
            ),
            Ingredient(
                name="Salicylic Acid",
                category="BHA",
                description="An exfoliating ingredient commonly used in blemish-focused products.",
                benefits="Supports pore-focused and breakout-focused routines.",
                caution="May cause dryness or irritation; gradual introduction is appropriate.",
                suitable_skin_types="oily,combination",
                concern_targets="acne,oily skin",
                common_interactions="Avoid overloading a sensitive routine with multiple exfoliating actives.",
                allergen_flag=False,
            ),
            Ingredient(
                name="Ceramides",
                category="Barrier Lipids",
                description="Barrier-supportive lipids commonly found in moisturizers.",
                benefits="Supports moisture retention and the skin barrier.",
                caution="Follow the product label and individual tolerance.",
                suitable_skin_types="normal,dry,oily,combination,sensitive",
                concern_targets="dry skin,redness,sensitive skin",
                common_interactions="Often paired with gentle hydrating ingredients.",
                allergen_flag=False,
            ),
            Ingredient(
                name="Peptides",
                category="Peptides",
                description="A class of cosmetic ingredients used in many skin-conditioning products.",
                benefits="Skin-conditioning support.",
                caution="Formulation and concentration vary by product.",
                suitable_skin_types="normal,dry,oily,combination,sensitive",
                concern_targets="fine lines,wrinkles",
                common_interactions="Use according to the overall routine and product directions.",
                allergen_flag=False,
            ),
        ])
        db.commit()

    if db.query(Product).count() == 0:
        db.add_all([
            Product(
                name="Gentle Barrier Cleanser",
                brand="Skin Intelligence Lab",
                category="Face Wash",
                description="A gentle cleanser concept for a low-irritation routine.",
                ingredients="Ceramides,Glycerin",
                suitable_skin_types="normal,dry,sensitive,combination",
                concern_targets="dry skin,redness,sensitive skin",
                price=499,
                currency="INR",
                rating=4.5,
            ),
            Product(
                name="Lightweight Balance Cleanser",
                brand="Skin Intelligence Lab",
                category="Face Wash",
                description="A lightweight cleanser concept for oil-balance routines.",
                ingredients="Niacinamide,Glycerin",
                suitable_skin_types="oily,combination",
                concern_targets="acne,oily skin",
                price=449,
                currency="INR",
                rating=4.4,
            ),
            Product(
                name="Hydration Support Serum",
                brand="Skin Intelligence Lab",
                category="Serum",
                description="A hydration-focused serum concept.",
                ingredients="Hyaluronic Acid,Glycerin",
                suitable_skin_types="normal,dry,oily,combination,sensitive",
                concern_targets="dry skin",
                price=699,
                currency="INR",
                rating=4.6,
            ),
            Product(
                name="Barrier Cream",
                brand="Skin Intelligence Lab",
                category="Moisturizer",
                description="A richer moisturizer concept for barrier-focused routines.",
                ingredients="Ceramides,Glycerin",
                suitable_skin_types="dry,sensitive",
                concern_targets="dry skin,redness,sensitive skin",
                price=799,
                currency="INR",
                rating=4.7,
            ),
            Product(
                name="Daily UV Shield SPF 50",
                brand="Skin Intelligence Lab",
                category="Sunscreen",
                description="A daily sunscreen concept for daytime UV protection.",
                ingredients="UV Filters,Niacinamide",
                suitable_skin_types="normal,dry,oily,combination",
                concern_targets="dark spots,hyperpigmentation,uneven skin tone",
                price=749,
                currency="INR",
                rating=4.6,
            ),
            Product(
                name="Blemish Support Serum",
                brand="Skin Intelligence Lab",
                category="Treatment",
                description="A breakout-focused product concept.",
                ingredients="Salicylic Acid,Niacinamide",
                suitable_skin_types="oily,combination",
                concern_targets="acne",
                price=649,
                currency="INR",
                rating=4.3,
            ),
            Product(
                name="Brightening Antioxidant Serum",
                brand="Skin Intelligence Lab",
                category="Serum",
                description="A gradual brightening-support concept.",
                ingredients="Vitamin C,Niacinamide",
                suitable_skin_types="normal,oily,combination",
                concern_targets="hyperpigmentation,dark spots,uneven skin tone",
                price=899,
                currency="INR",
                rating=4.5,
            ),
        ])
        db.commit()


def _m3_ingredient_fit(ingredient: Ingredient, profile: SkinProfile) -> dict:
    skin = (profile.skin_type or "").strip().lower()
    concern = (profile.primary_concern or "").strip().lower()
    allergies = set(_m3_split(profile.allergies))
    sensitivities = set(_m3_split(profile.sensitivities))

    suitable = set(_m3_split(ingredient.suitable_skin_types))
    targets = set(_m3_split(ingredient.concern_targets))

    score = 50
    reasons = []
    warnings = []

    if skin in suitable:
        score += 25
        reasons.append("Matches the recorded skin type.")

    if concern in targets:
        score += 20
        reasons.append("Matches the recorded primary concern.")

    ingredient_lower = ingredient.name.lower()

    if ingredient_lower in allergies:
        score -= 70
        warnings.append("The ingredient appears in the reported allergies.")

    if ingredient_lower in sensitivities:
        score -= 40
        warnings.append("The ingredient appears in the reported sensitivities.")

    if ingredient.allergen_flag:
        score -= 15
        warnings.append("Catalog metadata flags this ingredient for additional caution.")

    return {
        "score": int(round(_m3_clamp(score))),
        "reasons": reasons,
        "warnings": warnings,
    }


def _m3_product_fit(product: Product, profile: SkinProfile, budget: float | None) -> dict:
    skin = (profile.skin_type or "").strip().lower()
    concern = (profile.primary_concern or "").strip().lower()
    allergies = _m3_split(profile.allergies)
    sensitivities = _m3_split(profile.sensitivities)

    suitable = set(_m3_split(product.suitable_skin_types))
    targets = set(_m3_split(product.concern_targets))

    score = 40.0
    reasons = []
    warnings = []

    if skin in suitable:
        score += 25
        reasons.append("Matches the recorded skin type.")

    if concern in targets:
        score += 20
        reasons.append("Targets the recorded primary concern.")

    if budget is not None:
        if product.price <= budget:
            score += 10
            reasons.append("Within the requested budget.")
        else:
            score -= 15
            warnings.append("Above the requested budget.")

    ingredient_text = (product.ingredients or "").lower()

    for term in allergies:
        if term and term in ingredient_text:
            score -= 70
            warnings.append(f"Contains a reported allergy term: {term}.")

    for term in sensitivities:
        if term and term in ingredient_text:
            score -= 40
            warnings.append(f"Contains a reported sensitivity term: {term}.")

    score += min(float(product.rating or 0), 5.0)

    return {
        "score": int(round(_m3_clamp(score))),
        "reasons": list(dict.fromkeys(reasons)),
        "warnings": list(dict.fromkeys(warnings)),
    }



@app.get("/api/profile/me")
def m3_profile_alias(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the authenticated user's saved skin profile."""
    profile = (
        db.query(SkinProfileModel)
        .filter(SkinProfileModel.user_id == current_user.id)
        .first()
    )
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Skin profile not found. Complete your skin profile first.",
        )
    return profile


# ---------------------------------------------------------
# INGREDIENT INTELLIGENCE
# ---------------------------------------------------------

@app.get("/api/ingredients")
def m3_list_ingredients(
    query: str | None = None,
    category: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _m3_seed_catalog(db)

    query_obj = db.query(Ingredient)

    if query:
        query_obj = query_obj.filter(
            Ingredient.name.ilike(f"%{query.strip()}%")
        )

    if category:
        query_obj = query_obj.filter(
            Ingredient.category.ilike(f"%{category.strip()}%")
        )

    rows = query_obj.order_by(Ingredient.name.asc()).all()

    return {
        "count": len(rows),
        "ingredients": [
            {
                "id": row.id,
                "name": row.name,
                "category": row.category,
                "description": row.description,
                "benefits": row.benefits,
                "caution": row.caution,
                "allergen_flag": row.allergen_flag,
            }
            for row in rows
        ],
    }


@app.get("/api/ingredients/{ingredient_name}")
def m3_get_ingredient(
    ingredient_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _m3_seed_catalog(db)

    ingredient = (
        db.query(Ingredient)
        .filter(Ingredient.name.ilike(ingredient_name))
        .first()
    )

    if not ingredient:
        ingredient = (
            db.query(Ingredient)
            .filter(Ingredient.name.ilike(f"%{ingredient_name}%"))
            .first()
        )

    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    return {
        "id": ingredient.id,
        "name": ingredient.name,
        "category": ingredient.category,
        "description": ingredient.description,
        "benefits": ingredient.benefits,
        "caution": ingredient.caution,
        "suitable_skin_types": _m3_split(ingredient.suitable_skin_types),
        "concern_targets": _m3_split(ingredient.concern_targets),
        "common_interactions": ingredient.common_interactions,
        "allergen_flag": ingredient.allergen_flag,
        "disclaimer": MILESTONE3_DISCLAIMER,
    }


@app.post("/api/ingredients/analyze")
def m3_analyze_ingredient(
    data: IngredientAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _m3_seed_catalog(db)

    ingredient = (
        db.query(Ingredient)
        .filter(Ingredient.name.ilike(data.ingredient_name.strip()))
        .first()
    )

    if not ingredient:
        ingredient = (
            db.query(Ingredient)
            .filter(Ingredient.name.ilike(f"%{data.ingredient_name.strip()}%"))
            .first()
        )

    if not ingredient:
        return {
            "found": False,
            "ingredient_name": data.ingredient_name,
            "message": "Ingredient not found in the current catalog.",
            "disclaimer": MILESTONE3_DISCLAIMER,
        }

    profile = get_saved_skin_profile(current_user, db)
    fit = _m3_ingredient_fit(ingredient, profile)

    db.add(RecommendationEvent(
        user_id=current_user.id,
        event_type="ingredient_analysis",
        item_type="ingredient",
        item_id=ingredient.id,
        score=fit["score"],
    ))
    db.commit()

    return {
        "found": True,
        "ingredient": {
            "id": ingredient.id,
            "name": ingredient.name,
            "category": ingredient.category,
            "description": ingredient.description,
            "benefits": ingredient.benefits,
            "caution": ingredient.caution,
            "suitable_skin_types": _m3_split(ingredient.suitable_skin_types),
            "concern_targets": _m3_split(ingredient.concern_targets),
            "common_interactions": ingredient.common_interactions,
            "allergen_flag": ingredient.allergen_flag,
        },
        "personalized_fit": fit,
        "product_ingredients_received": _m3_split(
            data.product_ingredients
        ),
        "disclaimer": MILESTONE3_DISCLAIMER,
    }


# ---------------------------------------------------------
# PRODUCT INTELLIGENCE
# ---------------------------------------------------------

@app.get("/api/products")
def m3_list_products(
    category: str | None = None,
    max_price: float | None = None,
    query: str | None = None,
    limit: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _m3_seed_catalog(db)

    limit = max(1, min(limit, 100))

    query_obj = db.query(Product).filter(
        Product.is_active.is_(True)
    )

    if category:
        query_obj = query_obj.filter(
            Product.category.ilike(f"%{category.strip()}%")
        )

    if max_price is not None:
        query_obj = query_obj.filter(
            Product.price <= max_price
        )

    if query:
        query_obj = query_obj.filter(
            Product.name.ilike(f"%{query.strip()}%")
        )

    rows = (
        query_obj
        .order_by(Product.rating.desc(), Product.price.asc())
        .limit(limit)
        .all()
    )

    return {
        "count": len(rows),
        "products": [_m3_product_dict(row) for row in rows],
    }


@app.get("/api/products/recommendations")
def m3_product_recommendations(
    category: str | None = None,
    budget: float | None = None,
    concern: str | None = None,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _m3_seed_catalog(db)

    profile = get_saved_skin_profile(current_user, db)
    assessment = assess_skin(profile)

    requested_concern = (
        concern or profile.primary_concern or ""
    ).strip().lower()

    candidates = (
        db.query(Product)
        .filter(Product.is_active.is_(True))
        .all()
    )

    ranked = []

    for product in candidates:
        if (
            category
            and category.strip().lower() not in product.category.lower()
        ):
            continue

        fit = _m3_product_fit(product, profile, budget)

        if requested_concern:
            targets = set(_m3_split(product.concern_targets))
            if requested_concern in targets:
                fit["score"] = int(
                    min(100, fit["score"] + 5)
                )
                fit["reasons"].append(
                    "Matches the selected concern."
                )

        ranked.append({
            "product": _m3_product_dict(product),
            "suitability_score": fit["score"],
            "reasons": list(dict.fromkeys(fit["reasons"])),
            "warnings": fit["warnings"],
        })

    ranked.sort(
        key=lambda item: item["suitability_score"],
        reverse=True,
    )

    ranked = ranked[: max(1, min(limit, 30))]

    for item in ranked:
        db.add(RecommendationEvent(
            user_id=current_user.id,
            event_type="product_recommendation",
            item_type="product",
            item_id=item["product"]["id"],
            score=item["suitability_score"],
        ))

    db.commit()

    return {
        "user_id": current_user.id,
        "profile_summary": {
            "skin_type": profile.skin_type,
            "primary_concern": profile.primary_concern,
            "risk_level": assessment.get("risk_level"),
        },
        "budget": budget,
        "category": category,
        "recommendations": ranked,
        "disclaimer": MILESTONE3_DISCLAIMER,
    }


@app.get("/api/products/{product_id}")
def m3_get_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _m3_seed_catalog(db)

    product = (
        db.query(Product)
        .filter(
            Product.id == product_id,
            Product.is_active.is_(True)
        )
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return _m3_product_dict(product)


@app.post("/api/products/compare")
def m3_compare_products(
    data: ProductCompareRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _m3_seed_catalog(db)

    ids = list(dict.fromkeys(data.product_ids))[:6]

    products = (
        db.query(Product)
        .filter(
            Product.id.in_(ids),
            Product.is_active.is_(True)
        )
        .all()
    )

    if len(products) < 2:
        raise HTTPException(
            status_code=404,
            detail="At least two requested products were not found.",
        )

    profile = get_saved_skin_profile(current_user, db)

    rows = []

    for product in products:
        fit = _m3_product_fit(product, profile, None)

        rows.append({
            **_m3_product_dict(product),
            "personalized_suitability_score": fit["score"],
            "reasons": fit["reasons"],
            "warnings": fit["warnings"],
        })

    return {
        "products": rows,
        "disclaimer": MILESTONE3_DISCLAIMER,
    }


@app.get("/api/products/alternatives/{product_id}")
def m3_product_alternatives(
    product_id: int,
    limit: int = 5,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _m3_seed_catalog(db)

    source = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not source:
        raise HTTPException(status_code=404, detail="Product not found")

    profile = get_saved_skin_profile(current_user, db)

    candidates = (
        db.query(Product)
        .filter(
            Product.category == source.category,
            Product.is_active.is_(True),
            Product.id != source.id,
        )
        .all()
    )

    ranked = []

    for product in candidates:
        fit = _m3_product_fit(product, profile, None)
        price_gap = abs(
            float(product.price or 0)
            - float(source.price or 0)
        )

        adjustment = min(
            15,
            (price_gap / max(float(source.price or 1), 1)) * 10
        )

        ranked.append({
            "product": _m3_product_dict(product),
            "suitability_score": int(
                max(0, fit["score"] - adjustment)
            ),
            "reasons": fit["reasons"],
            "warnings": fit["warnings"],
        })

    ranked.sort(
        key=lambda item: item["suitability_score"],
        reverse=True,
    )

    return {
        "source_product": _m3_product_dict(source),
        "alternatives": ranked[: max(1, min(limit, 20))],
        "disclaimer": MILESTONE3_DISCLAIMER,
    }


# ---------------------------------------------------------
# PROGRESS TRACKING
# ---------------------------------------------------------

@app.post("/api/progress/routine-log")
def m3_log_routine(
    data: RoutineLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = (
        db.query(RoutineLog)
        .filter(
            RoutineLog.user_id == current_user.id,
            RoutineLog.log_date == data.log_date,
        )
        .first()
    )

    if row:
        row.morning_completed = data.morning_completed
        row.evening_completed = data.evening_completed
        row.sunscreen_completed = data.sunscreen_completed
        row.notes = data.notes
        row.updated_at = datetime.utcnow()
    else:
        row = RoutineLog(
            user_id=current_user.id,
            log_date=data.log_date,
            morning_completed=data.morning_completed,
            evening_completed=data.evening_completed,
            sunscreen_completed=data.sunscreen_completed,
            notes=data.notes,
        )
        db.add(row)

    db.commit()
    db.refresh(row)

    return {
        "message": "Routine log saved",
        "routine_log": {
            "id": row.id,
            "log_date": row.log_date,
            "morning_completed": row.morning_completed,
            "evening_completed": row.evening_completed,
            "sunscreen_completed": row.sunscreen_completed,
            "notes": row.notes,
        },
    }


@app.get("/api/progress/routine-logs")
def m3_routine_logs(
    limit: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    limit = max(1, min(limit, 365))

    rows = (
        db.query(RoutineLog)
        .filter(RoutineLog.user_id == current_user.id)
        .order_by(RoutineLog.log_date.desc())
        .limit(limit)
        .all()
    )

    return {
        "user_id": current_user.id,
        "logs": [
            {
                "id": row.id,
                "log_date": row.log_date,
                "morning_completed": row.morning_completed,
                "evening_completed": row.evening_completed,
                "sunscreen_completed": row.sunscreen_completed,
                "notes": row.notes,
            }
            for row in rows
        ],
    }


@app.post("/api/progress/log")
def m3_log_progress(
    data: ProgressEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_saved_skin_profile(current_user, db)
    assessment = assess_skin(profile)
    score_data = _m3_weighted_score(
        profile,
        assessment,
        db,
        current_user.id,
    )

    entry = ProgressEntry(
        user_id=current_user.id,
        skin_health_score=score_data["overall"],
        routine_adherence=(
            data.routine_adherence
            if data.routine_adherence is not None
            else score_data["components"]["routine_consistency"]
        ),
        improvement_score=(
            data.improvement_score
            if data.improvement_score is not None
            else 0
        ),
        hydration_score=(
            data.hydration_score
            if data.hydration_score is not None
            else score_data["components"]["hydration_level"]
        ),
        lifestyle_score=(
            data.lifestyle_score
            if data.lifestyle_score is not None
            else score_data["components"]["lifestyle_habits"]
        ),
        sleep_score=(
            data.sleep_score
            if data.sleep_score is not None
            else score_data["components"]["sleep_quality"]
        ),
        concern_status=(
            data.concern_status or profile.primary_concern
        ),
        notes=data.notes,
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {
        "message": "Progress entry recorded",
        "entry": {
            "id": entry.id,
            "recorded_at": entry.recorded_at.isoformat(),
            "skin_health_score": entry.skin_health_score,
            "routine_adherence": entry.routine_adherence,
            "improvement_score": entry.improvement_score,
            "hydration_score": entry.hydration_score,
            "lifestyle_score": entry.lifestyle_score,
            "sleep_score": entry.sleep_score,
            "concern_status": entry.concern_status,
            "notes": entry.notes,
        },
    }


@app.get("/api/progress/me")
def m3_get_progress(
    limit: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    limit = max(1, min(limit, 365))

    rows = (
        db.query(ProgressEntry)
        .filter(ProgressEntry.user_id == current_user.id)
        .order_by(ProgressEntry.recorded_at.asc())
        .limit(limit)
        .all()
    )

    return {
        "user_id": current_user.id,
        "entries": [
            {
                "id": row.id,
                "recorded_at": row.recorded_at.isoformat(),
                "skin_health_score": row.skin_health_score,
                "routine_adherence": row.routine_adherence,
                "improvement_score": row.improvement_score,
                "hydration_score": row.hydration_score,
                "lifestyle_score": row.lifestyle_score,
                "sleep_score": row.sleep_score,
                "concern_status": row.concern_status,
                "notes": row.notes,
            }
            for row in rows
        ],
    }


# ---------------------------------------------------------
# ANALYTICS
# ---------------------------------------------------------

def _m3_trend(values: list[float]) -> str:
    if len(values) < 2:
        return "baseline"

    change = values[-1] - values[0]

    if change > 3:
        return "improving"
    if change < -3:
        return "declining"
    return "stable"


@app.get("/api/analytics/overview")
def m3_analytics_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_saved_skin_profile(current_user, db)
    assessment = assess_skin(profile)
    score_data = _m3_weighted_score(
        profile,
        assessment,
        db,
        current_user.id,
    )

    progress = (
        db.query(ProgressEntry)
        .filter(ProgressEntry.user_id == current_user.id)
        .order_by(ProgressEntry.recorded_at.asc())
        .limit(60)
        .all()
    )

    health_values = [
        float(row.skin_health_score)
        for row in progress
    ]

    adherence_values = [
        float(row.routine_adherence)
        for row in progress
    ]

    current_score = float(score_data["overall"])
    previous_score = (
        health_values[-1]
        if health_values
        else current_score
    )

    return {
        "user_id": current_user.id,
        "current": {
            "skin_health_score": current_score,
            "routine_adherence": (
                adherence_values[-1]
                if adherence_values
                else score_data["components"]["routine_consistency"]
            ),
            "improvement_score": (
                progress[-1].improvement_score
                if progress
                else 0
            ),
        },
        "change": {
            "skin_health_points": round(
                current_score - previous_score,
                1,
            ),
            "skin_health_trend": (
                _m3_trend(health_values + [current_score])
                if health_values
                else "baseline"
            ),
            "routine_trend": (
                _m3_trend(adherence_values)
                if adherence_values
                else "baseline"
            ),
        },
        "weighted_model": score_data,
        "history_count": len(progress),
        "disclaimer": MILESTONE3_DISCLAIMER,
    }


@app.get("/api/analytics/trends")
def m3_analytics_trends(
    limit: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    limit = max(1, min(limit, 365))

    rows = (
        db.query(ProgressEntry)
        .filter(ProgressEntry.user_id == current_user.id)
        .order_by(ProgressEntry.recorded_at.asc())
        .limit(limit)
        .all()
    )

    return {
        "user_id": current_user.id,
        "trends": [
            {
                "date": row.recorded_at.date().isoformat(),
                "skin_health_score": row.skin_health_score,
                "routine_adherence": row.routine_adherence,
                "improvement_score": row.improvement_score,
                "hydration_score": row.hydration_score,
                "lifestyle_score": row.lifestyle_score,
                "sleep_score": row.sleep_score,
            }
            for row in rows
        ],
    }


# ---------------------------------------------------------
# MILESTONE 3 DASHBOARD
# ---------------------------------------------------------

@app.get("/api/dashboard/milestone3")
def m3_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _m3_seed_catalog(db)

    profile = get_saved_skin_profile(current_user, db)
    assessment = assess_skin(profile)
    score_data = _m3_weighted_score(
        profile,
        assessment,
        db,
        current_user.id,
    )

    products = (
        db.query(Product)
        .filter(Product.is_active.is_(True))
        .all()
    )

    ranked = []

    for product in products:
        fit = _m3_product_fit(product, profile, None)
        ranked.append({
            "product": _m3_product_dict(product),
            "suitability_score": fit["score"],
            "reasons": fit["reasons"],
            "warnings": fit["warnings"],
        })

    ranked.sort(
        key=lambda row: row["suitability_score"],
        reverse=True,
    )

    progress_count = (
        db.query(ProgressEntry)
        .filter(ProgressEntry.user_id == current_user.id)
        .count()
    )

    return {
        "message": "Milestone 3 dashboard generated",
        "user_id": current_user.id,
        "profile": {
            "skin_type": profile.skin_type,
            "primary_concern": profile.primary_concern,
            "risk_level": assessment.get("risk_level"),
        },
        "skin_health": score_data,
        "top_product_recommendations": ranked[:5],
        "progress": {
            "entries": progress_count,
            "tracking_available": True,
        },
        "analytics": {
            "trend_available": progress_count >= 2,
        },
        "features": {
            "ingredient_intelligence": True,
            "product_recommendations": True,
            "progress_tracking": True,
            "analytics": True,
            "user_dashboard": True,
        },
        "disclaimer": MILESTONE3_DISCLAIMER,
    }


# ---------------------------------------------------------
# Compatibility endpoints used by the frontend overview layer
# ---------------------------------------------------------

@app.get("/api/ai/overview")
def m3_ai_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_saved_skin_profile(current_user, db)
    assessment = assess_skin(profile)
    analysis = generate_ai_skin_analysis(profile, assessment)
    score_data = _m3_weighted_score(
        profile, assessment, db, current_user.id
    )

    return {
        "user_id": current_user.id,
        "analysis": analysis,
        "skin_health": score_data,
        "assessment": assessment,
        "disclaimer": MILESTONE3_DISCLAIMER,
    }


@app.get("/api/ai/skin-index")
def m3_ai_skin_index(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_saved_skin_profile(current_user, db)
    assessment = assess_skin(profile)
    score_data = _m3_weighted_score(
        profile, assessment, db, current_user.id
    )

    return {
        "user_id": current_user.id,
        "skin_health_score": score_data["overall"],
        "components": score_data["components"],
        "weights": score_data["weights"],
        "disclaimer": MILESTONE3_DISCLAIMER,
    }


@app.get("/api/ai/insights")
def m3_ai_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_saved_skin_profile(current_user, db)
    assessment = assess_skin(profile)
    analysis = generate_ai_skin_analysis(profile, assessment)

    return {
        "user_id": current_user.id,
        "attention_level": analysis.get("attention_level"),
        "overall_score": analysis.get("overall_score"),
        "priority_areas": analysis.get("priority_areas", []),
        "insights": analysis.get("insights", []),
        "recommended_actions": analysis.get("recommended_actions", []),
        "risk_factors": assessment.get("risk_factors", []),
        "disclaimer": MILESTONE3_DISCLAIMER,
    }


def _build_overview_actions(profile: SkinProfile, assessment: dict) -> list[str]:
    """Build a practical, profile-aware action list for the M3 Action Plan."""
    actions: list[str] = []
    skin = (profile.skin_type or "").strip().lower()
    concern = (profile.primary_concern or "").strip().lower()
    sleep = (profile.sleep_quality or "").strip().lower()
    water = (profile.water_intake or "").strip().lower()
    exposure = (profile.environmental_exposure or "").strip().lower()
    if skin == "dry": actions.append("Prioritize gentle cleansing and barrier-supportive moisturization.")
    elif skin == "oily": actions.append("Use gentle cleansing and lightweight hydration without over-cleansing.")
    elif skin == "combination": actions.append("Balance hydration with targeted oil-control care.")
    elif skin == "sensitive": actions.append("Keep the routine simple, fragrance-conscious, and introduce new products gradually.")
    else: actions.append("Keep the routine consistent with gentle cleansing, hydration, and daytime protection.")
    if concern in {"acne","pimple","breakouts","breakout"}: actions.append("Use targeted breakout care gradually and monitor irritation.")
    elif concern in {"hyperpigmentation","dark spots","uneven skin tone"}: actions.append("Prioritize daytime sun protection and gradual targeted pigmentation care.")
    elif concern in {"dryness","dry skin"}: actions.append("Increase barrier-supportive hydration and avoid unnecessary over-cleansing.")
    elif concern in {"redness","irritation","sensitive skin"}: actions.append("Minimize unnecessary actives and focus on calming, barrier-supportive care.")
    elif concern in {"fine lines","wrinkles"}: actions.append("Keep daily sun protection consistent and introduce anti-ageing actives cautiously.")
    if "sun" in exposure: actions.append("Maintain consistent daytime sun protection during relevant exposure.")
    if "pollution" in exposure: actions.append("Cleanse gently after significant environmental exposure without over-cleansing.")
    if sleep == "poor": actions.append("Work toward a more consistent sleep schedule as a supportive lifestyle habit.")
    if water == "less than 1 l": actions.append("Review hydration habits and increase fluids according to your normal needs.")
    if profile.allergies.strip(): actions.append("Check product ingredient lists carefully and avoid known allergens.")
    if profile.sensitivities.strip(): actions.append("Introduce new products one at a time and monitor skin tolerance.")
    if assessment.get("risk_level") == "High": actions.append("Consider professional dermatology guidance for persistent, worsening, painful, or concerning changes.")
    return list(dict.fromkeys(actions))[:8]


@app.get("/api/ai/action-plan")
def m3_ai_action_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_saved_skin_profile(current_user, db)
    assessment = assess_skin(profile)

    actions = _build_overview_actions(
        profile,
        assessment,
    )

    items = [
        {
            "id": index + 1,
            "title": action,
            "priority": (
                "high"
                if index < 2 and assessment.get("risk_level") == "High"
                else "medium"
                if index < 4
                else "low"
            ),
            "source": "profile_assessment",
        }
        for index, action in enumerate(actions)
    ]

    return {
        "user_id": current_user.id,
        "action_plan": {
            "items": items,
            "count": len(items),
            "next_review": "Review after observing your routine consistently.",
        },
        "assessment": assessment,
        "disclaimer": MILESTONE3_DISCLAIMER,
    }


# ---------------------------------------------------------
# Dashboard aggregate endpoints
# ---------------------------------------------------------

@app.get("/api/dashboard/overview")
def m3_dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_saved_skin_profile(current_user, db)
    assessment = assess_skin(profile)
    score_data = _m3_weighted_score(
        profile,
        assessment,
        db,
        current_user.id,
    )

    progress_count = (
        db.query(ProgressEntry)
        .filter(ProgressEntry.user_id == current_user.id)
        .count()
    )

    routine_adherence = score_data["components"]["routine_consistency"]

    return {
        "user": {
            "id": current_user.id,
            "name": current_user.full_name,
            "role": current_user.role,
        },
        "profile": {
            "skin_type": profile.skin_type,
            "primary_concern": profile.primary_concern,
            "age_group": profile.age_group,
        },
        "assessment": assessment,
        "skin_health": score_data,
        "progress": {
            "entries": progress_count,
            "routine_adherence": routine_adherence,
        },
        "features": {
            "milestone1": True,
            "milestone2": True,
            "milestone3": True,
        },
        "disclaimer": MILESTONE3_DISCLAIMER,
    }


@app.get("/api/overview/metrics")
def m3_overview_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_saved_skin_profile(current_user, db)
    assessment = assess_skin(profile)
    score_data = _m3_weighted_score(
        profile,
        assessment,
        db,
        current_user.id,
    )

    return {
        "user_id": current_user.id,
        "metrics": [
            {
                "key": "skin_health",
                "label": "Skin Health Score",
                "value": score_data["overall"],
                "unit": "/100",
            },
            {
                "key": "routine_adherence",
                "label": "Routine Adherence",
                "value": score_data["components"]["routine_consistency"],
                "unit": "%",
            },
            {
                "key": "sleep",
                "label": "Sleep Support",
                "value": score_data["components"]["sleep_quality"],
                "unit": "%",
            },
            {
                "key": "hydration",
                "label": "Hydration Support",
                "value": score_data["components"]["hydration_level"],
                "unit": "%",
            },
            {
                "key": "lifestyle",
                "label": "Lifestyle Support",
                "value": score_data["components"]["lifestyle_habits"],
                "unit": "%",
            },
        ],
    }


# ---------------------------------------------------------
# Consultation statistics for the dashboard
# ---------------------------------------------------------

@app.get("/api/consultations/stats")
def m3_consultation_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Consultation)
        .filter(
            (Consultation.user_id == current_user.id)
            | (Consultation.dermatologist_id == current_user.id)
        )
        .all()
    )

    counts = {
        "total": len(rows),
        "pending": 0,
        "in_review": 0,
        "completed": 0,
        "cancelled": 0,
    }

    for row in rows:
        key = (row.status or "").lower()
        if key in counts:
            counts[key] += 1

    return counts


# =========================================================
# PHOTO-ASSISTED SKIN CHECK-IN
# =========================================================

def _analyze_photo_quality(content: bytes) -> dict:
    """Check basic photo quality for a photo-assisted check-in; not a medical image diagnosis."""
    try:
        image = Image.open(io.BytesIO(content)).convert("RGB")
        width, height = image.size
        gray = image.convert("L")
        brightness = float(ImageStat.Stat(gray).mean[0])
        contrast = float(ImageStat.Stat(gray).stddev[0])
        score = 100.0
        notes = []
        if min(width, height) < 600: score -= 25; notes.append("Low resolution for detailed self-checking.")
        elif min(width, height) < 900: score -= 10; notes.append("Moderate resolution; closer framing may help.")
        if brightness < 45: score -= 25; notes.append("Image appears too dark.")
        elif brightness > 220: score -= 20; notes.append("Image appears overexposed.")
        if contrast < 18: score -= 15; notes.append("Low contrast may reduce visible detail.")
        score = int(round(_m3_clamp(score)))
        return {"valid":True,"width":width,"height":height,"brightness":round(brightness,1),"contrast":round(contrast,1),"score":score,"quality_label":"Good" if score>=80 else "Usable with caution" if score>=60 else "Retake recommended","notes":notes or ["Lighting and resolution are suitable for a photo-assisted self-check-in."]}
    except Exception as exc:
        return {"valid":False,"score":0,"quality_label":"Could not analyze photo quality","notes":[str(exc)]}


def _uploaded_photo_quality(photo_url: str | None) -> dict | None:
    if not photo_url or not photo_url.startswith("/uploads/"): return None
    try:
        relative = photo_url.replace("/uploads/", "", 1)
        photo_path = UPLOAD_ROOT.parent / relative
        if not photo_path.exists(): return None
        return _analyze_photo_quality(photo_path.read_bytes())
    except Exception:
        return None


def _checkin_priority_concerns(payload: SkinCheckinPayload) -> list[str]:
    concerns=[]
    if payload.pimple_count>0: concerns.append("Acne / pimples")
    if payload.pigmentation_spot_count>0: concerns.append("Pigmentation / dark spots")
    if payload.wrinkle_count>0 or payload.has_wrinkles: concerns.append("Fine lines / wrinkles")
    if payload.scar_count>0 or payload.has_scars: concerns.append("Scarring")
    if payload.stretch_mark_count>0 or payload.has_stretch_marks: concerns.append("Stretch marks")
    if payload.redness_level>=2: concerns.append("Redness")
    if payload.dryness_level>=2: concerns.append("Dryness")
    if payload.irritation_level>=2: concerns.append("Irritation")
    return concerns[:6]


def _checkin_dermatology_recommendation(payload: SkinCheckinPayload, result: dict, base: dict) -> dict:
    reasons=list(base.get("reason",[])); risk_flags=list(base.get("risk_factors",[]))
    high_signal = any([payload.pimple_count>=10,payload.pigmentation_spot_count>=10,payload.redness_level>=4,payload.dryness_level>=4,payload.irritation_level>=4,payload.scar_count>=5,payload.stretch_mark_count>=5,payload.wrinkle_count>=8])
    multiple=len(_checkin_priority_concerns(payload))>=3
    if payload.irritation_level>=3: reasons.append("The check-in records moderate-to-high irritation, so professional guidance may be useful if it persists."); risk_flags.append("Moderate-to-high irritation reported in check-in")
    if payload.redness_level>=4: reasons.append("The check-in records high redness; persistent or worsening redness should be reviewed professionally."); risk_flags.append("High redness reported in check-in")
    if high_signal or multiple or result.get("concern_level")=="High": reasons.append("Several visible concerns were recorded in this check-in, which may warrant professional review if persistent, painful, or worsening.")
    out=dict(base)
    if high_signal or multiple or result.get("concern_level")=="High":
        out["consultation_recommended"]=True; out["urgency"]="Moderate" if result.get("concern_level")=="High" else "Routine"; out["next_step"]="Consider booking a dermatologist consultation if these observations persist, worsen, become painful, or are concerning to you."
    out["reason"]=list(dict.fromkeys(reasons))[:6]; out["risk_factors"]=list(dict.fromkeys(risk_flags))[:8]
    return out


def _checkin_product_recommendations(payload: SkinCheckinPayload, profile: SkinProfile, db: Session) -> list[dict]:
    _m3_seed_catalog(db); priority=[x.lower() for x in _checkin_priority_concerns(payload)]; ranked=[]
    for product in db.query(Product).filter(Product.is_active.is_(True)).all():
        fit=_m3_product_fit(product,profile,None); targets=set(_m3_split(product.concern_targets)); score=float(fit["score"]); reasons=list(fit["reasons"]); warnings=list(fit["warnings"])
        for observed in priority:
            if observed=="acne / pimples" and "acne" in targets: score+=16; reasons.append("Relevant to the check-in signal: acne / pimples.")
            elif observed=="pigmentation / dark spots" and targets.intersection({"dark spots","hyperpigmentation","uneven skin tone"}): score+=16; reasons.append("Relevant to the check-in signal: pigmentation / dark spots.")
            elif observed=="fine lines / wrinkles" and targets.intersection({"wrinkles","fine lines"}): score+=16; reasons.append("Relevant to the check-in signal: fine lines / wrinkles.")
            elif observed=="redness" and "redness" in targets: score+=12; reasons.append("Relevant to the check-in signal: redness.")
            elif observed=="dryness" and "dry skin" in targets: score+=12; reasons.append("Relevant to the check-in signal: dryness.")
        if warnings: continue
        ranked.append({"product":_m3_product_dict(product),"suitability_score":int(round(_m3_clamp(score))),"reasons":list(dict.fromkeys(reasons)),"warnings":[]})
    ranked.sort(key=lambda x:x["suitability_score"],reverse=True)
    return ranked[:5]


@app.post("/api/skin-checkin/upload")
async def upload_skin_checkin_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file.")

    allowed_types = {
        "image/jpeg", "image/png", "image/webp",
        "image/heic", "image/heif", "image/jpg",
    }
    if file.content_type.lower() not in allowed_types:
        raise HTTPException(status_code=400, detail="Supported images: JPG, JPEG, PNG, WEBP, HEIC, HEIF.")

    content = await file.read()
    max_bytes = 10 * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail="Image is too large. Maximum size is 10 MB.")

    suffix = Path(file.filename or "image.jpg").suffix.lower()
    if not suffix:
        suffix = mimetypes.guess_extension(file.content_type or "image/jpeg") or ".jpg"

    filename = f"user_{current_user.id}_{uuid4().hex}{suffix}"
    path = UPLOAD_ROOT / filename
    path.write_bytes(content)

    return {
        "message": "Skin check-in photo uploaded successfully",
        "photo_url": f"/uploads/skin_checkins/{filename}",
        "photo_source": "gallery",
        "filename": filename,
        "size_bytes": len(content),
        "photo_quality": _analyze_photo_quality(content),
    }


@app.post("/api/skin-checkin/analyze")
def analyze_skin_checkin(
    payload: SkinCheckinPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = None
    try:
        profile = get_saved_skin_profile(current_user, db)
    except HTTPException:
        profile = None

    result = _checkin_analysis(payload, profile)
    result["priority_concerns"] = _checkin_priority_concerns(payload)
    photo_quality = _uploaded_photo_quality(payload.photo_url)
    if photo_quality is not None:
        result["photo_quality"] = photo_quality

    if profile is not None:
        assessment = assess_skin(profile)
        base_doctor = build_dermatology_recommendation(profile, assessment)
        doctor = _checkin_dermatology_recommendation(payload, result, base_doctor)
        products = _checkin_product_recommendations(payload, profile, db)
    else:
        doctor = {
            "consultation_recommended": result["concern_level"] == "High",
            "urgency": "Routine" if result["concern_level"] != "High" else "Moderate",
            "reason": ["Complete your skin profile for a more personalized professional-guidance assessment."],
            "risk_factors": [],
            "next_step": "Complete the Skin Profile and consider professional advice for persistent or worsening concerns.",
            "disclaimer": "Educational decision support only; not a medical diagnosis.",
        }
        products = []

    summary_parts = [f"Check-in score: {result['score']}/100.", f"Concern level: {result['concern_level']}.", *result["signals"][:4]]
    stmt = insert(skin_checkins_table).values(
        user_id=current_user.id, pimple_count=payload.pimple_count, scar_count=payload.scar_count,
        stretch_mark_count=payload.stretch_mark_count, wrinkle_count=payload.wrinkle_count,
        pigmentation_spot_count=payload.pigmentation_spot_count, redness_level=payload.redness_level,
        dryness_level=payload.dryness_level, irritation_level=payload.irritation_level,
        has_scars=payload.has_scars or payload.scar_count > 0, has_stretch_marks=payload.has_stretch_marks or payload.stretch_mark_count > 0,
        has_wrinkles=payload.has_wrinkles or payload.wrinkle_count > 0, photo_url=payload.photo_url,
        photo_source=payload.photo_source, analysis_score=result["score"], concern_level=result["concern_level"],
        summary=" ".join(summary_parts), created_at=datetime.utcnow(),
    )
    result_row=db.execute(stmt); db.commit()
    return {
        "message":"Skin check-in analyzed and saved",
        "checkin_id":result_row.inserted_primary_key[0],
        "analysis":result,
        "dermatologist_recommendation":doctor,
        "product_recommendations":products,
        "photo_url":payload.photo_url,
        "photo_quality":photo_quality,
        "profile_used":profile is not None,
        "analysis_flow":["Photo quality check when a photo is provided","Structured visible-observation scoring","Saved skin-profile context","Personalized product suitability","Professional-guidance decision support"],
    }


@app.get("/api/skin-checkin/latest")
def latest_skin_checkin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = db.execute(
        select(skin_checkins_table)
        .where(skin_checkins_table.c.user_id == current_user.id)
        .order_by(skin_checkins_table.c.created_at.desc())
        .limit(1)
    ).mappings().first()

    if not row:
        return {"found": False}

    return {"found": True, "checkin": dict(row)}


@app.get("/api/skin-checkin/history")
def skin_checkin_history(
    limit: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    limit = max(1, min(limit, 100))
    rows = db.execute(
        select(skin_checkins_table)
        .where(skin_checkins_table.c.user_id == current_user.id)
        .order_by(skin_checkins_table.c.created_at.desc())
        .limit(limit)
    ).mappings().all()

    return {
        "count": len(rows),
        "checkins": [dict(row) for row in rows],
    }


# =========================================================
# MILESTONE 4
# EXECUTIVE DASHBOARDS, CLINICAL REPORTING, AND CAMERA STREAM
# =========================================================

class Base64CameraPayload(BaseModel):
    image_base64: str
    photo_source: str = "camera"


@app.post("/api/skin-checkin/upload-camera")
def upload_skin_checkin_camera(
    payload: Base64CameraPayload,
    current_user: User = Depends(get_current_user),
):
    """Save photo taken directly via live browser camera stream."""
    raw_data = payload.image_base64
    if "," in raw_data:
        raw_data = raw_data.split(",", 1)[1]

    try:
        content = base64.b64decode(raw_data)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image data.")

    filename = f"user_{current_user.id}_{uuid4().hex}.jpg"
    path = UPLOAD_ROOT / filename
    path.write_bytes(content)

    quality = _analyze_photo_quality(content)
    return {
        "message": "Live camera skin check-in captured successfully",
        "photo_url": f"/uploads/skin_checkins/{filename}",
        "photo_source": "camera",
        "filename": filename,
        "size_bytes": len(content),
        "photo_quality": quality,
    }


@app.get("/api/admin/executive-dashboard")
def executive_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Milestone 4 Executive Dashboard:
    Aggregates platform KPIs, concern distributions, risk categorizations,
    lesion detection totals, and tele-dermatology throughput.
    """
    total_users = db.query(User).count()
    patients = db.query(User).filter(User.role == "user").count()
    dermatologists = db.query(User).filter(User.role == "dermatologist").count()
    consultants = db.query(User).filter(User.role == "consultant").count()

    all_consultations = db.query(Consultation).all()
    total_consultations = len(all_consultations)
    pending_c = sum(1 for c in all_consultations if c.status == "pending")
    in_review_c = sum(1 for c in all_consultations if c.status == "in_review")
    completed_c = sum(1 for c in all_consultations if c.status == "completed")
    cancelled_c = sum(1 for c in all_consultations if c.status == "cancelled")
    completion_rate = round((completed_c / max(total_consultations, 1)) * 100, 1)

    profiles = db.query(SkinProfileModel).all()
    concern_counts: dict[str, int] = {}
    skin_type_counts: dict[str, int] = {}
    risk_level_counts: dict[str, int] = {"Low": 0, "Moderate": 0, "High": 0}

    for p in profiles:
        c = (p.primary_concern or "Unspecified").title()
        concern_counts[c] = concern_counts.get(c, 0) + 1

        st = (p.skin_type or "Unspecified").title()
        skin_type_counts[st] = skin_type_counts.get(st, 0) + 1

        try:
            p_obj = SkinProfile(
                age_group=p.age_group or "",
                skin_type=p.skin_type or "",
                primary_concern=p.primary_concern or "",
                allergies=p.allergies or "",
                sensitivities=p.sensitivities or "",
                lifestyle_habits=p.lifestyle_habits or "",
                sleep_quality=p.sleep_quality or "",
                water_intake=p.water_intake or "",
                environmental_exposure=p.environmental_exposure or "",
            )
            risk = assess_skin(p_obj).get("risk_level", "Low")
            risk_level_counts[risk] = risk_level_counts.get(risk, 0) + 1
        except Exception:
            risk_level_counts["Low"] += 1

    checkin_rows = db.execute(select(skin_checkins_table)).mappings().all()
    total_checkins = len(checkin_rows)
    total_pimples = sum(row.get("pimple_count", 0) for row in checkin_rows)
    total_scars = sum(row.get("scar_count", 0) for row in checkin_rows)
    total_stretch_marks = sum(row.get("stretch_mark_count", 0) for row in checkin_rows)
    total_wrinkles = sum(row.get("wrinkle_count", 0) for row in checkin_rows)
    avg_score = round(sum(row.get("analysis_score", 100) for row in checkin_rows) / max(total_checkins, 1), 1) if checkin_rows else 80.0

    return {
        "kpis": {
            "total_users": total_users,
            "patients": patients,
            "dermatologists": dermatologists,
            "consultants": consultants,
            "total_consultations": total_consultations,
            "completed_consultations": completed_c,
            "completion_rate_pct": completion_rate,
            "total_checkins": total_checkins,
            "average_checkin_score": avg_score,
            "active_catalog_products": db.query(Product).filter(Product.is_active.is_(True)).count(),
            "catalog_ingredients": db.query(Ingredient).count(),
        },
        "consultations_telemetry": {
            "total": total_consultations,
            "pending": pending_c,
            "in_review": in_review_c,
            "completed": completed_c,
            "cancelled": cancelled_c,
            "completion_rate_pct": completion_rate,
        },
        "distributions": {
            "concerns": concern_counts,
            "skin_types": skin_type_counts,
            "risk_levels": risk_level_counts,
        },
        "lesion_telemetry": {
            "total_pimples_detected": total_pimples,
            "total_scars_recorded": total_scars,
            "total_stretch_marks_recorded": total_stretch_marks,
            "total_wrinkles_recorded": total_wrinkles,
        },
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/api/reports/clinical-summary")
def clinical_summary_report(
    user_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate an authoritative, printable Clinical Skincare Summary Report.
    """
    target_user_id = current_user.id
    if user_id and current_user.role in ("dermatologist", "admin"):
        target_user_id = user_id

    target_user = db.query(User).filter(User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = db.query(SkinProfileModel).filter(SkinProfileModel.user_id == target_user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Skin profile not found for this user.")

    profile_obj = SkinProfile(
        age_group=profile.age_group or "",
        skin_type=profile.skin_type or "",
        primary_concern=profile.primary_concern or "",
        allergies=profile.allergies or "",
        sensitivities=profile.sensitivities or "",
        lifestyle_habits=profile.lifestyle_habits or "",
        sleep_quality=profile.sleep_quality or "",
        water_intake=profile.water_intake or "",
        environmental_exposure=profile.environmental_exposure or "",
    )
    assessment = assess_skin(profile_obj)
    routine = generate_routine(profile_obj, assessment)
    score_data = _m3_weighted_score(profile_obj, assessment, db, target_user_id)
    analysis = generate_ai_skin_analysis(profile_obj, assessment)
    doctor_rec = build_dermatology_recommendation(profile_obj, assessment)

    checkin_rows = db.execute(
        select(skin_checkins_table)
        .where(skin_checkins_table.c.user_id == target_user_id)
        .order_by(skin_checkins_table.c.created_at.desc())
        .limit(5)
    ).mappings().all()

    consultations = db.query(Consultation).filter(Consultation.user_id == target_user_id).order_by(Consultation.created_at.desc()).limit(5).all()

    return {
        "report_id": f"CLIN-{target_user_id}-{int(datetime.utcnow().timestamp())}",
        "generated_at": datetime.utcnow().isoformat(),
        "patient": {
            "id": target_user.id,
            "full_name": target_user.full_name,
            "email": target_user.email,
            "account_role": target_user.role,
        },
        "skin_profile": profile_obj.model_dump(),
        "clinical_assessment": assessment,
        "skin_health_index": score_data,
        "ai_intelligence": {
            "attention_level": analysis.get("attention_level"),
            "overall_score": analysis.get("overall_score"),
            "insights": analysis.get("insights", []),
            "actions": analysis.get("recommended_actions", []),
        },
        "prescribed_routine": routine,
        "dermatology_triage": doctor_rec,
        "recent_checkins": [dict(r) for r in checkin_rows],
        "consultations_history": [
            {
                "id": c.id,
                "subject": c.subject,
                "status": c.status,
                "priority": c.priority,
                "created_at": c.created_at.isoformat(),
                "dermatologist_notes": c.dermatologist_notes,
                "recommendations": c.recommendations
            } for c in consultations
        ],
        "disclaimer": (
            "This report is generated by AI Skin Intelligence for clinical decision support. "
            "It does not replace certified professional judgment."
        ),
    }


@app.get("/api/reports/export/csv")
def export_csv_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Export the user's routine, progress, and check-in timeline as a CSV spreadsheet."""
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow(["=== AI SKIN INTELLIGENCE - PATIENT CLINICAL DATA EXPORT ==="])
    writer.writerow(["Patient ID", current_user.id, "Name", current_user.full_name, "Export Date", datetime.utcnow().isoformat()])
    writer.writerow([])

    # Section 1: Routine Logs
    writer.writerow(["--- DAILY ROUTINE LOGS ---"])
    writer.writerow(["Log Date", "Morning Completed", "Sunscreen Applied", "Evening Completed", "Notes"])
    routine_rows = db.query(RoutineLog).filter(RoutineLog.user_id == current_user.id).order_by(RoutineLog.log_date.desc()).all()
    for r in routine_rows:
        writer.writerow([r.log_date, r.morning_completed, r.sunscreen_completed, r.evening_completed, r.notes or ""])

    writer.writerow([])
    # Section 2: Progress Entries
    writer.writerow(["--- SKIN HEALTH BIOMETRIC PROGRESS ---"])
    writer.writerow(["Timestamp", "Skin Health Score", "Routine Adherence", "Hydration", "Lifestyle", "Sleep", "Concern Status", "Notes"])
    progress_rows = db.query(ProgressEntry).filter(ProgressEntry.user_id == current_user.id).order_by(ProgressEntry.recorded_at.desc()).all()
    for p in progress_rows:
        writer.writerow([p.recorded_at.isoformat(), p.skin_health_score, p.routine_adherence, p.hydration_score, p.lifestyle_score, p.sleep_score, p.concern_status or "", p.notes or ""])

    writer.writerow([])
    # Section 3: Photo-Assisted Skin Check-ins
    writer.writerow(["--- PHOTO-ASSISTED LESION & ERYTHEMA CHECK-INS ---"])
    writer.writerow(["Timestamp", "Pimples", "Pigmentation Spots", "Scars", "Wrinkles", "Redness (0-5)", "Dryness (0-5)", "Irritation (0-5)", "Score", "Concern Level"])
    checkin_rows = db.execute(select(skin_checkins_table).where(skin_checkins_table.c.user_id == current_user.id).order_by(skin_checkins_table.c.created_at.desc())).mappings().all()
    for c in checkin_rows:
        writer.writerow([c.get("created_at"), c.get("pimple_count"), c.get("pigmentation_spot_count"), c.get("scar_count"), c.get("wrinkle_count"), c.get("redness_level"), c.get("dryness_level"), c.get("irritation_level"), c.get("analysis_score"), c.get("concern_level")])

    csv_data = output.getvalue()
    filename = f"skin_intelligence_export_user_{current_user.id}_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.get("/api/reports/export/json")
def export_json_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Complete JSON export of all user profile, progress, check-in, and consultation data."""
    profile = db.query(SkinProfileModel).filter(SkinProfileModel.user_id == current_user.id).first()
    routine_rows = db.query(RoutineLog).filter(RoutineLog.user_id == current_user.id).all()
    progress_rows = db.query(ProgressEntry).filter(ProgressEntry.user_id == current_user.id).all()
    checkin_rows = db.execute(select(skin_checkins_table).where(skin_checkins_table.c.user_id == current_user.id)).mappings().all()
    consultations = db.query(Consultation).filter(Consultation.user_id == current_user.id).all()

    return {
        "user": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "role": current_user.role,
        },
        "profile": {
            "skin_type": profile.skin_type if profile else None,
            "primary_concern": profile.primary_concern if profile else None,
            "age_group": profile.age_group if profile else None,
            "allergies": profile.allergies if profile else None,
            "sensitivities": profile.sensitivities if profile else None,
        } if profile else None,
        "routine_logs_count": len(routine_rows),
        "progress_entries_count": len(progress_rows),
        "checkins_count": len(checkin_rows),
        "consultations_count": len(consultations),
        "exported_at": datetime.utcnow().isoformat(),
    }


@app.get("/api/system/capabilities")
def m4_capabilities():
    return {
        "service": "AI Skin Intelligence API",
        "version": "1.4.0",
        "milestone1": True,
        "milestone2": True,
        "milestone3": True,
        "milestone4": True,
        "authentication": True,
        "skin_profile": True,
        "skin_assessment": True,
        "personalized_routine": True,
        "ai_skin_intelligence": True,
        "ingredient_intelligence": True,
        "product_intelligence": True,
        "progress_tracking": True,
        "analytics": True,
        "dashboard": True,
        "executive_dashboard": True,
        "clinical_reporting": True,
        "csv_export": True,
        "json_export": True,
        "photo_assisted_skin_checkin": True,
        "camera_upload": True,
        "gallery_upload": True,
        "skin_checkin_analysis": True,
        "checkin_product_recommendations": True,
        "checkin_dermatology_guidance": True,
        "consultations": True,
        "postgresql_support": True,
        "docker_ready": True,
    }
