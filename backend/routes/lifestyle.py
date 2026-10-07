from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, LifestyleLog
from schemas import LifestyleLogRequest, LifestyleLogResponse
from auth import get_current_user

router = APIRouter()


@router.post("", response_model=LifestyleLogResponse, status_code=status.HTTP_201_CREATED)
def log_lifestyle(
    data: LifestyleLogRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log_date = data.log_date or date.today()
    entry = LifestyleLog(
        user_id=user.id,
        log_date=log_date,
        exercise_minutes=data.exercise_minutes,
        diet_quality=data.diet_quality,
        stress_level=data.stress_level,
        smoking=data.smoking,
        alcohol=data.alcohol,
        notes=data.notes,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("", response_model=List[LifestyleLogResponse])
def get_lifestyle_logs(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(LifestyleLog)
        .filter(LifestyleLog.user_id == user.id)
        .order_by(LifestyleLog.log_date.desc())
        .limit(30)
        .all()
    )


@router.get("/latest", response_model=LifestyleLogResponse)
def get_latest_lifestyle(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(LifestyleLog)
        .filter(LifestyleLog.user_id == user.id)
        .order_by(LifestyleLog.log_date.desc())
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="No lifestyle logs found")
    return entry


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lifestyle_log(
    log_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = db.query(LifestyleLog).filter(
        LifestyleLog.id == log_id, LifestyleLog.user_id == user.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Lifestyle log not found")
    db.delete(entry)
    db.commit()
