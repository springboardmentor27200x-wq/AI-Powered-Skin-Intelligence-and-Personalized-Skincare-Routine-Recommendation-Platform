from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.routine_adherence import RoutineAdherenceLog
from app.schemas.adherence import AdherenceIn, AdherenceOut

router = APIRouter(prefix="/adherence", tags=["adherence"])


@router.put("/me", response_model=AdherenceOut)
def mark_adherence(
    payload: AdherenceIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(RoutineAdherenceLog)
        .filter(RoutineAdherenceLog.user_id == current_user.id, RoutineAdherenceLog.log_date == payload.log_date)
        .first()
    )
    if entry:
        entry.morning_completed = payload.morning_completed
        entry.evening_completed = payload.evening_completed
    else:
        entry = RoutineAdherenceLog(user_id=current_user.id, **payload.model_dump())
        db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/me", response_model=list[AdherenceOut])
def list_adherence(
    days: int = Query(default=7, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    since = date.today() - timedelta(days=days)
    return (
        db.query(RoutineAdherenceLog)
        .filter(RoutineAdherenceLog.user_id == current_user.id, RoutineAdherenceLog.log_date >= since)
        .order_by(RoutineAdherenceLog.log_date.desc())
        .all()
    )