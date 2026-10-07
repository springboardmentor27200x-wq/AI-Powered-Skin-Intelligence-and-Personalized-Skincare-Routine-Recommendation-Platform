from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, SleepLog
from schemas import SleepLogRequest, SleepLogResponse
from auth import get_current_user

router = APIRouter()


@router.post("", response_model=SleepLogResponse, status_code=status.HTTP_201_CREATED)
def log_sleep(
    data: SleepLogRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log_date = data.log_date or date.today()
    entry = SleepLog(
        user_id=user.id,
        log_date=log_date,
        sleep_hours=data.sleep_hours,
        bedtime=data.bedtime,
        wakeup_time=data.wakeup_time,
        quality=data.quality,
        consistency=data.consistency,
        notes=data.notes,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("", response_model=List[SleepLogResponse])
def get_sleep_logs(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(SleepLog)
        .filter(SleepLog.user_id == user.id)
        .order_by(SleepLog.log_date.desc())
        .limit(30)
        .all()
    )


@router.get("/today", response_model=SleepLogResponse)
def get_today_sleep(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(SleepLog)
        .filter(SleepLog.user_id == user.id, SleepLog.log_date == date.today())
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="No sleep log for today")
    return entry


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sleep_log(
    log_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = db.query(SleepLog).filter(
        SleepLog.id == log_id, SleepLog.user_id == user.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Sleep log not found")
    db.delete(entry)
    db.commit()
