from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.routine import (
    FullRoutinePlanResponse,
    RoutineResponse,
)
from app.schemas.recommendation import (
    RoutineAdherenceToggleRequest,
    RoutineAdherenceSummaryResponse,
)
from app.services.routine_service import RoutineService

router = APIRouter()


@router.get(
    "/current",
    response_model=FullRoutinePlanResponse,
    summary="Get current active personalized routine plan (Morning, Evening, Weekly, Seasonal)",
)
def get_current_routine_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves the currently active personalized routine plan,
    containing structured Morning, Evening, Weekly, and Seasonal steps.
    """
    plan = RoutineService.get_active_routine_plan(db=db, user_id=current_user.id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active skincare routine found. Please run a skin assessment to generate your personalized routine.",
        )
    return plan


@router.post(
    "/generate",
    response_model=FullRoutinePlanResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a new routine version based on current assessment",
)
def generate_new_routine_version(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Formulates a new personalized routine plan, incrementing the version
    and preserving allergy and sensitivity constraints.
    """
    plan = RoutineService.generate_routine_plan(db=db, user_id=current_user.id)
    return plan


@router.get(
    "/history",
    response_model=List[RoutineResponse],
    summary="Get historical routine versions",
)
def get_routine_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return RoutineService.get_routine_history(db=db, user_id=current_user.id)


@router.post(
    "/adherence/toggle",
    summary="Toggle step adherence completion for a date",
)
def toggle_routine_step_adherence(
    payload: RoutineAdherenceToggleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Logs step completion for the day and updates the user's live routine consistency score.
    """
    try:
        result = RoutineService.toggle_step_adherence(
            db=db,
            user_id=current_user.id,
            routine_step_id=payload.routine_step_id,
            record_date=payload.record_date,
            completed=payload.completed,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get(
    "/adherence/summary",
    response_model=RoutineAdherenceSummaryResponse,
    summary="Get 7-day adherence summary, streaks, and completion rate",
)
def get_routine_adherence_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves weekly adherence percentage, logging streak days, and completed steps.
    """
    return RoutineService.get_adherence_summary(db=db, user_id=current_user.id)
