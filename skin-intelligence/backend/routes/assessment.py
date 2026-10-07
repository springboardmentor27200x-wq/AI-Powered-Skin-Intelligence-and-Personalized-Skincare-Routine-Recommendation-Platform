"""
Assessment Routes — Module 3: Skin Assessment Engine

Endpoints:
  POST /api/assessment/run      — Run full assessment, persist and return results
  GET  /api/assessment/latest   — Get most recent assessment for current user
  GET  /api/assessment/history  — Get all past assessments (paginated)
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models.user import User
from models.skin_profile import SkinProfile
from models.lifestyle_log import LifestyleLog
from models.skin_assessment import SkinAssessment
from models.skin_texture import SkinTextureAnalysis
from schemas import AssessmentOut, AssessmentRunResponse
from utils.auth import get_current_user
from services.assessment_engine import AssessmentEngine

router = APIRouter(prefix="/api/assessment", tags=["Skin Assessment"])


# ============================================================
# HELPER: Build lifestyle stats dict from DB logs
# ============================================================

def _build_lifestyle_stats(user_id: int, db: Session) -> dict:
    """Compute lifestyle stats from the last 30 days of logs."""
    logs = (
        db.query(LifestyleLog)
        .filter(LifestyleLog.user_id == user_id)
        .order_by(LifestyleLog.log_date.desc())
        .limit(30)
        .all()
    )

    if not logs:
        return {
            "avg_sleep_hours": 7.0,
            "avg_water_intake_ml": 2000,
            "sunscreen_compliance_rate": 50,
            "avg_uv_exposure": "Low",
            "avg_stress_level": "Low",
            "total_logs": 0,
        }

    valid_sleep = [float(l.sleep_hours) for l in logs if l.sleep_hours is not None]
    avg_sleep = sum(valid_sleep) / len(valid_sleep) if valid_sleep else 7.0

    valid_water = [int(l.water_intake_ml) for l in logs if l.water_intake_ml is not None]
    avg_water = sum(valid_water) / len(valid_water) if valid_water else 2000

    sunscreen_rate = (sum(1 for l in logs if getattr(l, 'sunscreen_applied', False)) / len(logs)) * 100

    # Determine most common UV and stress levels
    uv_counts: dict = {}
    stress_counts: dict = {}
    for log in logs:
        uv = log.uv_exposure or "Low"
        stress = log.stress_level or "Low"
        uv_counts[uv] = uv_counts.get(uv, 0) + 1
        stress_counts[stress] = stress_counts.get(stress, 0) + 1

    avg_uv = max(uv_counts, key=uv_counts.get) if uv_counts else "Low"
    avg_stress = max(stress_counts, key=stress_counts.get) if stress_counts else "Low"

    return {
        "avg_sleep_hours": round(avg_sleep, 1),
        "avg_water_intake_ml": round(avg_water),
        "sunscreen_compliance_rate": round(sunscreen_rate, 1),
        "avg_uv_exposure": avg_uv,
        "avg_stress_level": avg_stress,
        "total_logs": len(logs),
    }


def compute_and_save_assessment(user_id: int, db: Session) -> tuple[Optional[SkinAssessment], str]:
    """
    Core function to run the AssessmentEngine connecting profile, lifestyle,
    and the latest AI vision camera texture analysis.
    """
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == user_id).first()
    if not profile:
        return None, "Skin profile not found."

    profile_dict = {
        "skin_type": profile.skin_type,
        "age_group": profile.age_group,
        "skin_concerns": profile.skin_concerns or [],
        "allergies": profile.allergies or [],
        "sensitivities": profile.sensitivities or [],
    }
    lifestyle_stats = _build_lifestyle_stats(user_id, db)

    # Fetch latest texture analysis
    latest_texture = (
        db.query(SkinTextureAnalysis)
        .filter(SkinTextureAnalysis.user_id == user_id)
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

    engine = AssessmentEngine(profile_dict, lifestyle_stats, texture_dict)
    result = engine.run()

    assessment = SkinAssessment(
        user_id=user_id,
        overall_score=result["overall_score"],
        score_breakdown=result["score_breakdown"],
        concern_analysis=result["concern_analysis"],
        risk_factors=result["risk_factors"],
        lifestyle_snapshot=result["lifestyle_snapshot"],
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    summary = result.get("summary", "Assessment completed successfully.")
    return assessment, summary


# ============================================================
# POST /api/assessment/run
# ============================================================

@router.post("/run", response_model=AssessmentRunResponse, status_code=status.HTTP_201_CREATED)
def run_assessment(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Run the full skin assessment engine for the current user.
    Requires an existing skin profile. Persists results to DB.
    """
    assessment, summary = compute_and_save_assessment(current_user.id, db)
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=summary,
        )

    return AssessmentRunResponse(
        assessment=assessment,
        summary=summary,
    )


# ============================================================
# GET /api/assessment/latest
# ============================================================

@router.get("/latest", response_model=AssessmentOut)
def get_latest_assessment(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve the most recent assessment for the current user."""
    assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == current_user.id)
        .order_by(SkinAssessment.created_at.desc())
        .first()
    )
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No assessment found. Run your first assessment to get started.",
        )
    return assessment


# ============================================================
# GET /api/assessment/history
# ============================================================

@router.get("/history", response_model=List[AssessmentOut])
def get_assessment_history(
    limit: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return paginated list of past assessments, newest first."""
    assessments = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == current_user.id)
        .order_by(SkinAssessment.created_at.desc())
        .limit(limit)
        .all()
    )
    return assessments
