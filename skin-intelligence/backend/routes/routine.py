"""
Routine Routes — Module 4: Personalized Routine Generator

Endpoints:
  POST /api/routine/generate    — Generate and persist full routine set
  GET  /api/routine/latest      — Get most recent routine set
  GET  /api/routine/{type}      — Get specific routine type (morning|evening|weekly)
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.skin_profile import SkinProfile
from models.skin_assessment import SkinAssessment
from models.skin_texture import SkinTextureAnalysis
from models.skincare_routine import SkincareRoutine
from schemas import RoutineOut, RoutineGenerateResponse
from utils.auth import get_current_user
from services.routine_generator import RoutineGenerator

router = APIRouter(prefix="/api/routine", tags=["Skincare Routine"])


# ============================================================
# POST /api/routine/generate
# ============================================================

@router.post("/generate", response_model=RoutineGenerateResponse, status_code=status.HTTP_201_CREATED)
def generate_routine(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate a full personalized skincare routine (morning + evening + weekly).
    Requires an existing skin profile. Uses latest assessment and latest AI skin texture scan.
    Persists results to DB and returns immediately.
    """
    # Verify profile exists
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skin profile not found. Please complete your skin profile first.",
        )

    profile_dict = {
        "skin_type": profile.skin_type,
        "age_group": profile.age_group,
        "skin_concerns": profile.skin_concerns or [],
        "allergies": profile.allergies or [],
        "sensitivities": profile.sensitivities or [],
    }

    # Use latest assessment concern analysis if available
    latest_assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == current_user.id)
        .order_by(SkinAssessment.created_at.desc())
        .first()
    )
    concern_analysis = latest_assessment.concern_analysis if latest_assessment else []

    # Use latest texture analysis if available
    latest_texture = (
        db.query(SkinTextureAnalysis)
        .filter(SkinTextureAnalysis.user_id == current_user.id)
        .order_by(SkinTextureAnalysis.created_at.desc())
        .first()
    )
    texture_dict = None
    if latest_texture:
        texture_dict = {
            "overall_texture_score": latest_texture.overall_texture_score,
            "smoothness_score": latest_texture.smoothness_score,
            "roughness_score": latest_texture.roughness_score,
            "pore_visibility_score": latest_texture.pore_visibility_score,
            "pore_density_score": latest_texture.pore_density_score,
            "oiliness_shine_score": latest_texture.oiliness_shine_score,
            "redness_erythema_score": latest_texture.redness_erythema_score,
            "fine_lines_score": latest_texture.fine_lines_score,
            "texture_type": latest_texture.texture_type,
            "primary_concern": latest_texture.primary_concern,
        }

    # Run routine generator
    gen = RoutineGenerator(
        profile=profile_dict,
        concern_analysis=concern_analysis,
        allergies=profile.allergies,
        sensitivities=profile.sensitivities,
        texture_data=texture_dict,
    )
    result = gen.generate_all()

    # Persist routine to DB
    routine = SkincareRoutine(
        user_id=current_user.id,
        morning_routine=result["morning_routine"],
        evening_routine=result["evening_routine"],
        weekly_treatments=result["weekly_treatments"],
        seasonal_tips=result["seasonal_tips"],
        generated_for_skin_type=profile.skin_type,
        generated_for_concerns=profile.skin_concerns or [],
    )
    db.add(routine)
    db.commit()
    db.refresh(routine)

    return RoutineGenerateResponse(
        routine=routine,
        ingredient_highlights=result.get("ingredient_highlights", []),
    )


# ============================================================
# GET /api/routine/latest
# ============================================================

@router.get("/latest", response_model=RoutineOut)
def get_latest_routine(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the most recently generated routine set for this user."""
    routine = (
        db.query(SkincareRoutine)
        .filter(SkincareRoutine.user_id == current_user.id)
        .order_by(SkincareRoutine.created_at.desc())
        .first()
    )
    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No routine found. Generate your first personalized routine.",
        )
    return routine


# ============================================================
# GET /api/routine/{type}
# ============================================================

@router.get("/{routine_type}", response_model=List[dict])
def get_routine_by_type(
    routine_type: str = Path(..., description="morning | evening | weekly | seasonal"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return a specific routine section from the latest generated routine."""
    routine = (
        db.query(SkincareRoutine)
        .filter(SkincareRoutine.user_id == current_user.id)
        .order_by(SkincareRoutine.created_at.desc())
        .first()
    )
    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No routine found. Generate your personalized routine first.",
        )

    type_map = {
        "morning": routine.morning_routine,
        "evening": routine.evening_routine,
        "weekly": routine.weekly_treatments,
        "seasonal": routine.seasonal_tips,
    }

    data = type_map.get(routine_type.lower())
    if data is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid routine type '{routine_type}'. Use: morning, evening, weekly, seasonal.",
        )
    return data
