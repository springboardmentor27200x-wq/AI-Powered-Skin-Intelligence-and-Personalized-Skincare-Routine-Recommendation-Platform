from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.assessment import (
    AssessmentPrecheckResponse,
    SkinAssessmentResponse,
)
from app.services.assessment_service import AssessmentService

router = APIRouter()


@router.get(
    "/precheck",
    response_model=AssessmentPrecheckResponse,
    summary="Get pre-assessment summary of current profile & telemetry data",
)
def get_assessment_precheck(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns user profile, skin profile, and today's telemetry logs
    for the pre-assessment review card.
    """
    return AssessmentService.get_precheck_data(db=db, user_id=current_user.id)


@router.post(
    "/run",
    response_model=SkinAssessmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Run DermaIQ Assessment and calculate health scores",
)
def run_skin_assessment(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Executes the 5-pillar explainable intelligence engine:
    identifies skin concerns, evaluates lifestyle/environmental risks,
    prioritizes concerns, computes scores, and generates matching routines.
    """
    assessment = AssessmentService.run_assessment(db=db, user_id=current_user.id)
    return assessment


@router.get(
    "/latest",
    response_model=SkinAssessmentResponse,
    summary="Retrieve user's latest skin assessment",
)
def get_latest_assessment(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetches the user's most recent skin assessment with concerns,
    risks, and 5-pillar score breakdown.
    """
    assessment = AssessmentService.get_latest_assessment(db=db, user_id=current_user.id)
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No previous skin assessment found. Please run an assessment first.",
        )
    return assessment


@router.get(
    "/history",
    response_model=List[SkinAssessmentResponse],
    summary="List historical assessments for current user",
)
def list_assessment_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return AssessmentService.list_user_assessments(db=db, user_id=current_user.id)


@router.get(
    "/forecast/barrier-7day",
    summary="Get 7-day predictive barrier resilience trajectory forecast",
)
def get_7day_barrier_forecast(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Computes a 7-day predictive stratum corneum barrier resilience trajectory
    correlating overall skin health, routine adherence consistency, and sleep/hydration velocity.
    """
    return AssessmentService.get_7day_barrier_forecast(db=db, user_id=current_user.id)


@router.get(
    "/analytics/timeline",
    summary="Get multi-signal telemetry and skin score timeline analytics",
)
def get_telemetry_timeline(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Aggregates multi-signal telemetry (sleep, hydration, stress, UV exposure)
    correlated with historical skin condition scores.
    """
    return AssessmentService.get_telemetry_timeline_analytics(db=db, user_id=current_user.id, days=min(90, max(7, days)))


@router.get(
    "/{assessment_id}",
    response_model=SkinAssessmentResponse,
    summary="Get assessment by ID with role-based access control",
)
def get_assessment_by_id(
    assessment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assessment = AssessmentService.get_assessment_by_id(
        db=db,
        assessment_id=assessment_id,
        user_id=current_user.id,
        user_role=current_user.role,
    )
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found or you do not have permission to view it.",
        )
    return assessment
