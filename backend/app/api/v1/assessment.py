from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from app.db.session import get_db
from app.schemas.assessment import SkinAssessmentResponse, SkinHealthScore
from app.services.assessment_service import assessment_service
from app.services.profile_service import profile_service
from app.core.dependencies import get_current_user

router = APIRouter()

@router.post("/evaluate", response_model=SkinAssessmentResponse, summary="Evaluate profile and generate assessment")
def evaluate_profile(
    season: str = "Unknown",
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    profile = profile_service.get_profile_by_user_id(db, current_user["id"])
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skin profile not found. Please complete profile first.")
    
    assessment = assessment_service.evaluate_profile(db, current_user["id"], profile, season)
    return assessment

@router.get("/latest", response_model=Optional[SkinAssessmentResponse], summary="Get the user's latest assessment")
def get_latest_assessment(
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return assessment_service.get_latest_assessment(db, current_user["id"])

@router.post("/score", response_model=SkinHealthScore, summary="Calculate skin health score")
def calculate_score(
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    profile = profile_service.get_profile_by_user_id(db, current_user["id"])
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skin profile not found.")
        
    score = assessment_service.calculate_score(db, current_user["id"], profile)
    return score

@router.get("/score/latest", response_model=Optional[SkinHealthScore], summary="Get the latest skin health score")
def get_latest_score(
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return assessment_service.get_latest_score(db, current_user["id"])
