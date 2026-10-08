from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from app.db.session import get_db
from app.schemas.routine import SkincareRoutineResponse
from app.services.routine_service import routine_service
from app.services.assessment_service import assessment_service
from app.core.dependencies import get_current_user

router = APIRouter()

@router.post("/generate", response_model=SkincareRoutineResponse, summary="Generate a skincare routine based on latest assessment")
def generate_routine(
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    assessment = assessment_service.get_latest_assessment(db, current_user["id"])
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skin assessment not found. Please evaluate profile first.")
        
    routine = routine_service.generate_routine(db, current_user["id"], assessment)
    return routine

@router.get("/latest", response_model=Optional[SkincareRoutineResponse], summary="Get the latest skincare routine")
def get_latest_routine(
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return routine_service.get_latest_routine(db, current_user["id"])
