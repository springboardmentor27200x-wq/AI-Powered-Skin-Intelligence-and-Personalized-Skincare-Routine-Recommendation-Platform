import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, SkinAssessment, SkinProfile, ProgressLog
from schemas import AssessmentResponse, FaceScanRequest, ApplyScanRequest
from auth import get_current_user
from services.assessment_engine import calculate_skin_assessment
from services.skin_vision_engine import decode_image_from_base64, analyze_facial_skin
from datetime import date

router = APIRouter()


def serialize_assessment(assessment: SkinAssessment) -> dict:
    return {
        "id": assessment.id,
        "user_id": assessment.user_id,
        "overall_score": assessment.overall_score,
        "condition_score": assessment.condition_score,
        "lifestyle_score": assessment.lifestyle_score,
        "sleep_score": assessment.sleep_score,
        "consistency_score": assessment.consistency_score,
        "hydration_score": assessment.hydration_score,
        "concern_priorities": json.loads(assessment.concern_priorities or "[]"),
        "risk_factors": json.loads(assessment.risk_factors or "[]"),
        "recommendation_summary": assessment.recommendation_summary or "",
    }


@router.post("/evaluate", response_model=AssessmentResponse)
def evaluate_assessment(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = calculate_skin_assessment(db, user.id)

    assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == user.id)
        .order_by(SkinAssessment.updated_at.desc())
        .first()
    )

    if not assessment:
        assessment = SkinAssessment(
            user_id=user.id,
            overall_score=result["overall_score"],
            condition_score=result["condition_score"],
            lifestyle_score=result["lifestyle_score"],
            sleep_score=result["sleep_score"],
            consistency_score=result["consistency_score"],
            hydration_score=result["hydration_score"],
            concern_priorities=json.dumps(result["concern_priorities"]),
            risk_factors=json.dumps(result["risk_factors"]),
            recommendation_summary=result["recommendation_summary"],
        )
        db.add(assessment)
    else:
        assessment.overall_score = result["overall_score"]
        assessment.condition_score = result["condition_score"]
        assessment.lifestyle_score = result["lifestyle_score"]
        assessment.sleep_score = result["sleep_score"]
        assessment.consistency_score = result["consistency_score"]
        assessment.hydration_score = result["hydration_score"]
        assessment.concern_priorities = json.dumps(result["concern_priorities"])
        assessment.risk_factors = json.dumps(result["risk_factors"])
        assessment.recommendation_summary = result["recommendation_summary"]

    db.commit()
    db.refresh(assessment)
    return serialize_assessment(assessment)


@router.get("", response_model=AssessmentResponse)
def get_assessment(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == user.id)
        .order_by(SkinAssessment.updated_at.desc())
        .first()
    )
    if not assessment:
        # Evaluate automatically if none exists
        return evaluate_assessment(user, db)
    return serialize_assessment(assessment)


@router.post("/scan-face")
def scan_face_image(
    payload: FaceScanRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Analyzes an uploaded or camera-captured face photo for dark spots,
    blemishes/acne, wrinkles, redness, and oiliness.
    """
    if not payload.image_base64:
        raise HTTPException(status_code=400, detail="Image data is required.")

    try:
        pil_image = decode_image_from_base64(payload.image_base64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")

    analysis = analyze_facial_skin(pil_image)
    return analysis


@router.post("/apply-scan-results")
def apply_scan_to_profile(
    payload: ApplyScanRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Syncs concerns detected by the camera scan to the user's skin profile
    and automatically re-evaluates their skin routine and assessment.
    """
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == user.id).first()
    if profile:
        existing_concerns = json.loads(profile.skin_concerns or "[]")
        # Merge detected concerns
        merged = list(dict.fromkeys(existing_concerns + payload.detected_concerns))
        profile.skin_concerns = json.dumps(merged)
        db.commit()

    # Re-evaluate assessment
    updated_assessment = calculate_skin_assessment(db, user.id)
    assessment = db.query(SkinAssessment).filter(SkinAssessment.user_id == user.id).first()
    if assessment:
        assessment.overall_score = payload.skin_score or updated_assessment["overall_score"]
        assessment.concern_priorities = json.dumps(updated_assessment["concern_priorities"])
        db.commit()

    return {
        "message": "AI Scan concerns successfully applied to profile & routine!",
        "synced_concerns": payload.detected_concerns,
    }
