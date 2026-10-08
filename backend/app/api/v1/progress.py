from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from app.db.session import get_db
from app.schemas.progress import ProgressAnalyticsResponse, AdherenceLog
from app.services.progress_service import progress_service
from app.core.dependencies import get_current_user
from pydantic import BaseModel

router = APIRouter()

class AdherenceRequest(BaseModel):
    log_date: Optional[str] = None
    morning_completed: bool = False
    evening_completed: bool = False
    notes: Optional[str] = ""

@router.post("/adherence", summary="Log routine adherence")
def log_adherence(
    data: AdherenceRequest,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return progress_service.log_adherence(
        db, 
        current_user["id"], 
        data.log_date, 
        data.morning_completed, 
        data.evening_completed, 
        data.notes
    )

@router.get("/analytics", response_model=ProgressAnalyticsResponse, summary="Get progress tracking and analytics")
def get_progress_analytics(
    days: int = 30,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return progress_service.get_progress_analytics(db, current_user["id"], days)

@router.get("/score", summary="Get detailed weighted skin health score")
def get_skin_health_score(
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.services.scoring_service import scoring_service
    return scoring_service.calculate_skin_health_score(db, current_user["id"])

@router.get("/improvement", summary="Get improvement analysis")
def get_improvement_analysis(
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return progress_service.get_improvement_analysis(db, current_user["id"])

@router.get("/compare", summary="Get before/after comparisons")
def get_before_after_comparison(
    date1: str,
    date2: str,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return progress_service.get_before_after_comparison(db, current_user["id"], date1, date2)

@router.get("/trends", summary="Get trend analysis")
def get_trend_analysis(
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return progress_service.get_trend_analysis(db, current_user["id"])
