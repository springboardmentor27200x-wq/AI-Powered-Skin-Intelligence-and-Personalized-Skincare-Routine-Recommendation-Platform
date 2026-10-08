import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.progress import (
    AdherenceStats,
    AssessmentComparison,
    AssessmentHistoryItem,
    ConcernTrend,
    ProgressSummary,
    TrendResponse,
)
from app.services.progress_service import ProgressService

router = APIRouter()


@router.get(
    "/summary",
    response_model=ProgressSummary,
    summary="Get overall progress summary: current vs previous assessment comparison",
)
def get_progress_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns progress summary comparing the latest two assessments.
    Includes pillar deltas (hydration, sleep, lifestyle etc.) and a friendly message.
    Returns has_data=False if no assessments exist.
    """
    user_id = uuid.UUID(str(current_user.id))
    return ProgressService.get_progress_summary(db, user_id)


@router.get(
    "/trends",
    response_model=TrendResponse,
    summary="Get time-series skin health score data for charts",
)
def get_trend_data(
    period: str = Query("30d", description="7d | 30d | 90d | all"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns time-series data for all score pillars over the given period.
    Data comes from ProgressSnapshot records (real persisted assessment data only).
    """
    valid_periods = {"7d", "30d", "90d", "all"}
    if period not in valid_periods:
        period = "30d"
    user_id = uuid.UUID(str(current_user.id))
    return ProgressService.get_trend_data(db, user_id, period=period)


@router.get(
    "/concerns",
    response_model=List[ConcernTrend],
    summary="Get per-concern severity trends over time",
)
def get_concern_trends(
    period: str = Query("30d", description="7d | 30d | 90d | all"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns trend data for each skin concern severity tracked across assessments."""
    valid_periods = {"7d", "30d", "90d", "all"}
    if period not in valid_periods:
        period = "30d"
    user_id = uuid.UUID(str(current_user.id))
    return ProgressService.get_concern_trends(db, user_id, period=period)


@router.get(
    "/adherence",
    response_model=AdherenceStats,
    summary="Get routine adherence statistics and streak",
)
def get_adherence_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns adherence stats calculated from real RoutineAdherenceRecord rows:
    - Today's completion percentage
    - This week's completion percentage
    - Current streak (consecutive days with any completed step)
    """
    user_id = uuid.UUID(str(current_user.id))
    return ProgressService.get_adherence_stats(db, user_id)


@router.get(
    "/history",
    response_model=List[AssessmentHistoryItem],
    summary="Get assessment history list (most recent first)",
)
def get_assessment_history(
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns a list of past assessments with scores and top concerns.
    Used for the assessment history timeline on the Progress page.
    """
    user_id = uuid.UUID(str(current_user.id))
    return ProgressService.get_assessment_history(db, user_id, limit=limit)


@router.get(
    "/compare",
    response_model=AssessmentComparison,
    summary="Compare two assessments side-by-side (baseline vs target)",
)
def compare_assessments(
    baseline_id: Optional[str] = Query(None, description="Assessment ID for baseline (older)"),
    target_id: Optional[str] = Query(None, description="Assessment ID for comparison (newer)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Compares two assessments side-by-side with overall score delta,
    5-pillar score comparisons, and concern severity evolutions.
    If baseline_id or target_id is omitted, compares the two most recent assessments.
    """
    user_id = uuid.UUID(str(current_user.id))
    return ProgressService.compare_assessments(
        db=db,
        user_id=user_id,
        baseline_id=baseline_id,
        target_id=target_id,
    )

