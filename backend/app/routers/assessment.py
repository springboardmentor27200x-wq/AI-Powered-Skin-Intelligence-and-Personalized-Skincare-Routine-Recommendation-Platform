from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.skin_profile import SkinProfile
from app.models.skin_concern import SkinConcern, UserSkinConcern
from app.models.sleep_record import SleepRecord
from app.models.lifestyle_record import LifestyleRecord
from app.models.hydration_record import HydrationRecord
from app.models.skin_assessment import SkinAssessment
from app.models.routine import Routine
from app.models.routine_adherence import RoutineAdherenceLog
from app.schemas.assessment import SkinAssessmentOut, TrendAnalyticsOut
from app.services.assessment_engine import compute_weighted_assessment, recent_window, compute_trend_analysis
from app.services.routine_engine import upsert_routine_for_assessment

router = APIRouter(prefix="/assessments", tags=["assessments"])


@router.post("/me/run", response_model=SkinAssessmentOut, status_code=status.HTTP_201_CREATED)
def run_assessment(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Create a skin profile first")

    concern_rows = (
        db.query(SkinConcern.name)
        .join(UserSkinConcern, UserSkinConcern.skin_concern_id == SkinConcern.id)
        .filter(UserSkinConcern.user_id == current_user.id)
        .all()
    )
    concern_names = [name for (name,) in concern_rows]

    since = recent_window(7)
    lifestyle_rows = db.query(LifestyleRecord).filter(LifestyleRecord.user_id == current_user.id, LifestyleRecord.log_date >= since).all()
    sleep_rows = db.query(SleepRecord).filter(SleepRecord.user_id == current_user.id, SleepRecord.log_date >= since).all()
    hydration_rows = db.query(HydrationRecord).filter(HydrationRecord.user_id == current_user.id, HydrationRecord.log_date >= since).all()
    adherence_rows = db.query(RoutineAdherenceLog).filter(RoutineAdherenceLog.user_id == current_user.id, RoutineAdherenceLog.log_date >= since).all()
    routine_exists = db.query(Routine).filter(Routine.user_id == current_user.id).first() is not None

    result = compute_weighted_assessment(
        concern_names, lifestyle_rows, sleep_rows, hydration_rows, adherence_rows, routine_exists
    )

    assessment = SkinAssessment(user_id=current_user.id, **result)
    db.add(assessment)
    db.flush()  # assigns assessment.id before the routine references it

    # Adaptive routine updates: the routine regenerates automatically
    # from every new assessment, not just on manual request.
    upsert_routine_for_assessment(db, current_user.id, profile.skin_type, assessment)

    db.commit()
    db.refresh(assessment)
    return assessment


@router.get("/me/latest", response_model=SkinAssessmentOut)
def get_latest_assessment(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == current_user.id)
        .order_by(SkinAssessment.created_at.desc())
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No assessment yet — run one first")
    return assessment


@router.get("/me/history", response_model=list[SkinAssessmentOut])
def get_assessment_history(
    limit: int = Query(default=30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == current_user.id)
        .order_by(SkinAssessment.created_at.desc())
        .limit(limit)
        .all()
    )
from app.schemas.assessment import TrendAnalyticsOut  # add alongside your existing SkinAssessmentOut import


@router.get("/me/analytics", response_model=TrendAnalyticsOut)
def get_my_analytics(
    limit: int = Query(default=30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assessments = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == current_user.id)
        .order_by(SkinAssessment.created_at.desc())
        .limit(limit)
        .all()
    )
    if not assessments:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No assessment history yet")

    result = compute_trend_analysis(assessments)
    return TrendAnalyticsOut(**result)