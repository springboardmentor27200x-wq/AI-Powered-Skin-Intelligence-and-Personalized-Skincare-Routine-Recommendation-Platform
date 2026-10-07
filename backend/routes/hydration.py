from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, HydrationLog
from schemas import HydrationLogRequest, HydrationLogResponse
from auth import get_current_user

router = APIRouter()


@router.post("", response_model=HydrationLogResponse, status_code=status.HTTP_201_CREATED)
def log_hydration(
    data: HydrationLogRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log_date = data.log_date or date.today()
    entry = HydrationLog(
        user_id=user.id,
        log_date=log_date,
        water_litres=data.water_litres,
        glasses=data.glasses,
        notes=data.notes,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("", response_model=List[HydrationLogResponse])
def get_hydration_logs(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(HydrationLog)
        .filter(HydrationLog.user_id == user.id)
        .order_by(HydrationLog.log_date.desc())
        .limit(30)
        .all()
    )


@router.get("/today", response_model=HydrationLogResponse)
def get_today_hydration(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(HydrationLog)
        .filter(HydrationLog.user_id == user.id, HydrationLog.log_date == date.today())
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="No hydration log for today")
    return entry


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hydration_log(
    log_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = db.query(HydrationLog).filter(
        HydrationLog.id == log_id, HydrationLog.user_id == user.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Hydration log not found")
    db.delete(entry)
    db.commit()
