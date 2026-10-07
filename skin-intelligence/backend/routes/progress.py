from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.progress import ProgressLog
from schemas import ProgressLogCreate, ProgressLogOut
from utils.auth import get_current_user
from models.user import User

router = APIRouter(
    prefix="/api/progress",
    tags=["Progress Tracking"]
)

@router.post("/", response_model=ProgressLogOut, status_code=status.HTTP_201_CREATED)
def log_progress(
    progress_data: ProgressLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log a new progress entry."""
    new_log = ProgressLog(
        user_id=current_user.id,
        **progress_data.dict()
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

@router.get("/", response_model=List[ProgressLogOut])
def get_progress_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all progress logs for the current user."""
    logs = db.query(ProgressLog).filter(
        ProgressLog.user_id == current_user.id
    ).order_by(ProgressLog.date_logged.desc()).all()
    
    return logs

@router.get("/analytics")
def get_progress_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get summarized analytics for the progress logs."""
    logs = db.query(ProgressLog).filter(
        ProgressLog.user_id == current_user.id
    ).order_by(ProgressLog.date_logged.asc()).all()
    
    if not logs:
        return {
            "total_logs": 0,
            "trend": "neutral",
            "average_score": 0,
            "chart_data": {"labels": [], "scores": [], "adherence": []}
        }
        
    labels = [log.date_logged.strftime("%Y-%m-%d") for log in logs]
    scores = [log.skin_health_score for log in logs]
    adherence = [log.routine_adherence for log in logs]
    
    avg_score = sum(scores) / len(scores)
    
    # Calculate simple trend based on first and last
    trend = "neutral"
    if len(scores) > 1:
        if scores[-1] > scores[0]:
            trend = "improving"
        elif scores[-1] < scores[0]:
            trend = "declining"
            
    return {
        "total_logs": len(logs),
        "trend": trend,
        "average_score": round(avg_score, 1),
        "chart_data": {
            "labels": labels,
            "scores": scores,
            "adherence": adherence
        }
    }
