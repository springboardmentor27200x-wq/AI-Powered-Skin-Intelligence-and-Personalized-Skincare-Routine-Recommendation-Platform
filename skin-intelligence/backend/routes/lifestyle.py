from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import List

from database import get_db
from models.user import User
from models.lifestyle_log import LifestyleLog
from schemas import LifestyleLogCreate, LifestyleLogOut, LifestyleLogStats
from utils.auth import get_current_user

router = APIRouter(prefix="/api/lifestyle", tags=["Lifestyle Tracking"])


@router.get("/today", response_model=LifestyleLogOut)
def get_today_log(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    log = db.query(LifestyleLog).filter(
        LifestyleLog.user_id == current_user.id,
        LifestyleLog.log_date == today
    ).first()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No lifestyle log for today yet"
        )
    return log


@router.post("", response_model=LifestyleLogOut)
def create_or_update_log(
    log_in: LifestyleLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if a log for this user on this date already exists
    log = db.query(LifestyleLog).filter(
        LifestyleLog.user_id == current_user.id,
        LifestyleLog.log_date == log_in.log_date
    ).first()
    
    if log:
        # Update existing record
        log.sleep_hours = log_in.sleep_hours
        log.sleep_quality = log_in.sleep_quality
        log.water_intake_ml = log_in.water_intake_ml
        log.uv_exposure = log_in.uv_exposure
        log.pollution_exposure = log_in.pollution_exposure
        log.stress_level = log_in.stress_level
        log.sunscreen_applied = log_in.sunscreen_applied
    else:
        # Create new record
        log = LifestyleLog(
            user_id=current_user.id,
            log_date=log_in.log_date,
            sleep_hours=log_in.sleep_hours,
            sleep_quality=log_in.sleep_quality,
            water_intake_ml=log_in.water_intake_ml,
            uv_exposure=log_in.uv_exposure,
            pollution_exposure=log_in.pollution_exposure,
            stress_level=log_in.stress_level,
            sunscreen_applied=log_in.sunscreen_applied
        )
        db.add(log)
        
    db.commit()
    db.refresh(log)
    return log


@router.get("/history", response_model=List[LifestyleLogOut])
def get_history(
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    start_date = date.today() - timedelta(days=days)
    logs = db.query(LifestyleLog).filter(
        LifestyleLog.user_id == current_user.id,
        LifestyleLog.log_date >= start_date
    ).order_by(LifestyleLog.log_date.asc()).all()
    return logs


@router.get("/stats", response_model=LifestyleLogStats)
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = db.query(LifestyleLog).filter(LifestyleLog.user_id == current_user.id).all()
    total = len(logs)
    if total == 0:
        return {
            "avg_sleep_hours": 0.0,
            "avg_water_intake_ml": 0.0,
            "sunscreen_compliance_rate": 0.0,
            "total_logs": 0
        }
        
    avg_sleep = sum(log.sleep_hours for log in logs) / total
    avg_water = sum(log.water_intake_ml for log in logs) / total
    sunscreen_count = sum(1 for log in logs if log.sunscreen_applied)
    sunscreen_rate = (sunscreen_count / total) * 100
    
    return {
        "avg_sleep_hours": round(avg_sleep, 1),
        "avg_water_intake_ml": round(avg_water, 0),
        "sunscreen_compliance_rate": round(sunscreen_rate, 1),
        "total_logs": total
    }
