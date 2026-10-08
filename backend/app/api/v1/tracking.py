from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, Query, status
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.schemas.tracking import (
    LifestyleLogCreate, LifestyleLogResponse,
    SleepLogCreate, SleepLogResponse,
    HydrationLogCreate, HydrationLogResponse,
    EnvironmentLogCreate, EnvironmentLogResponse,
    DailyTrackingSummary
)
from app.services.tracking_service import tracking_service

router = APIRouter()

@router.post("/lifestyle", response_model=LifestyleLogResponse, summary="Log or update daily lifestyle habits")
def log_lifestyle(
    data: LifestyleLogCreate,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return tracking_service.log_lifestyle(db, current_user["id"], data)

@router.get("/lifestyle/history", response_model=List[LifestyleLogResponse], summary="Get lifestyle tracking history")
def get_lifestyle_history(
    days: int = Query(14, ge=1, le=90),
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return tracking_service.get_lifestyle_history(db, current_user["id"], days=days)

@router.post("/sleep", response_model=SleepLogResponse, summary="Log or update daily sleep record")
def log_sleep(
    data: SleepLogCreate,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return tracking_service.log_sleep(db, current_user["id"], data)

@router.get("/sleep/history", response_model=List[SleepLogResponse], summary="Get sleep tracking history")
def get_sleep_history(
    days: int = Query(14, ge=1, le=90),
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return tracking_service.get_sleep_history(db, current_user["id"], days=days)

@router.post("/hydration", response_model=HydrationLogResponse, summary="Log water intake")
def log_hydration(
    data: HydrationLogCreate,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return tracking_service.log_hydration(db, current_user["id"], data)

@router.put("/hydration/set", response_model=HydrationLogResponse, summary="Set absolute water intake for a date")
def set_hydration_total(
    target_date: Optional[date] = None,
    total_ml: int = Query(..., ge=0),
    target_ml: int = Query(2500, ge=500),
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    day = target_date or date.today()
    return tracking_service.set_hydration_total(db, current_user["id"], day, total_ml, target_ml)

@router.post("/environment", response_model=EnvironmentLogResponse, summary="Log environmental conditions")
def log_environment(
    data: EnvironmentLogCreate,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return tracking_service.log_environment(db, current_user["id"], data)

@router.get("/summary", response_model=DailyTrackingSummary, summary="Get consolidated daily tracking & lifestyle impact score")
def get_daily_summary(
    target_date: Optional[date] = None,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return tracking_service.get_daily_summary(db, current_user["id"], target_date)
