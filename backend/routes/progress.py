import json
from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, ProgressLog, SkinAssessment, RoutineChecklistLog
from schemas import ProgressLogRequest, ProgressLogResponse, ProgressAnalyticsResponse
from auth import get_current_user

router = APIRouter()


def serialize_progress(log: ProgressLog) -> dict:
    return {
        "id": log.id,
        "user_id": log.user_id,
        "log_date": log.log_date,
        "skin_condition_rating": log.skin_condition_rating,
        "notes": log.notes or "",
        "concerns_severity": json.loads(log.concerns_severity or "{}"),
        "skin_health_score_at_log": log.skin_health_score_at_log,
    }


@router.post("", response_model=ProgressLogResponse, status_code=status.HTTP_201_CREATED)
def log_progress(
    data: ProgressLogRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    log_date = data.log_date or date.today()

    # Get latest skin assessment score for snapshot
    latest_assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == user.id)
        .order_by(SkinAssessment.updated_at.desc())
        .first()
    )
    score_snapshot = latest_assessment.overall_score if latest_assessment else 75.0

    entry = ProgressLog(
        user_id=user.id,
        log_date=log_date,
        skin_condition_rating=data.skin_condition_rating,
        notes=data.notes or "",
        concerns_severity=json.dumps(data.concerns_severity or {}),
        skin_health_score_at_log=score_snapshot,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return serialize_progress(entry)


@router.get("/history", response_model=List[ProgressLogResponse])
def get_progress_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = (
        db.query(ProgressLog)
        .filter(ProgressLog.user_id == user.id)
        .order_by(ProgressLog.log_date.desc())
        .limit(30)
        .all()
    )
    return [serialize_progress(l) for l in logs]


@router.get("/analytics", response_model=ProgressAnalyticsResponse)
def get_progress_analytics(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = (
        db.query(ProgressLog)
        .filter(ProgressLog.user_id == user.id)
        .order_by(ProgressLog.log_date.asc())
        .all()
    )

    checklist_logs = (
        db.query(RoutineChecklistLog)
        .filter(RoutineChecklistLog.user_id == user.id)
        .all()
    )

    total_logs = len(logs)
    if total_logs == 0:
        avg_rating = 7.0
        score_improvement = 0.0
    else:
        avg_rating = round(sum(l.skin_condition_rating for l in logs) / total_logs, 1)
        first_score = logs[0].skin_health_score_at_log or 70.0
        last_score = logs[-1].skin_health_score_at_log or 70.0
        score_improvement = round(last_score - first_score, 1)

    if checklist_logs:
        adherence_rate = round(sum(c.completion_rate for c in checklist_logs) / len(checklist_logs), 1)
    else:
        adherence_rate = 75.0

    trend = [
        {
            "date": str(l.log_date),
            "rating": l.skin_condition_rating,
            "health_score": l.skin_health_score_at_log or 75.0,
            "notes": l.notes
        }
        for l in logs
    ]

    return {
        "total_logs": total_logs,
        "average_condition_rating": avg_rating,
        "routine_adherence_rate": adherence_rate,
        "score_improvement": score_improvement,
        "progress_trend": trend
    }
