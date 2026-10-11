import json
from datetime import date, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, ProgressLog, SkinAssessment, RoutineChecklistLog, SkinProfile
from schemas import ProgressLogRequest
from auth import get_current_user

router = APIRouter()


def serialize_progress(log: ProgressLog) -> dict:
    rating = getattr(log, "condition_rating", getattr(log, "skin_condition_rating", 7)) or 7
    concerns = getattr(log, "active_concerns", getattr(log, "concerns_severity", "[]"))
    try:
        concerns_parsed = json.loads(concerns) if isinstance(concerns, str) else concerns
    except Exception:
        concerns_parsed = []

    if isinstance(concerns_parsed, dict):
        concerns_list = list(concerns_parsed.keys())
    elif isinstance(concerns_parsed, list):
        concerns_list = concerns_parsed
    else:
        concerns_list = []

    return {
        "id": log.id,
        "user_id": log.user_id,
        "log_date": str(log.log_date),
        "condition_rating": rating,
        "skin_condition_rating": rating,
        "notes": log.notes or "",
        "active_concerns": concerns_list,
        "photo_url": getattr(log, "photo_url", "") or "",
        "skin_health_score_at_log": getattr(log, "skin_health_score_at_log", None),
    }


def _calculate_streaks(active_dates: set) -> tuple:
    if not active_dates:
        return 0, 0

    today = date.today()
    yesterday = today - timedelta(days=1)

    # Current streak
    curr_streak = 0
    check_day = today if today in active_dates else (yesterday if yesterday in active_dates else None)

    if check_day:
        curr_streak = 1
        d = check_day - timedelta(days=1)
        while d in active_dates:
            curr_streak += 1
            d -= timedelta(days=1)

    # Longest streak
    sorted_dates = sorted(active_dates)
    longest = 0
    temp_streak = 0
    prev_date = None

    for d in sorted_dates:
        if prev_date is None or d == prev_date + timedelta(days=1):
            temp_streak += 1
        elif d != prev_date:
            temp_streak = 1
        if temp_streak > longest:
            longest = temp_streak
        prev_date = d

    return curr_streak, max(longest, curr_streak)


@router.post("", status_code=status.HTTP_201_CREATED)
def log_progress(
    data: ProgressLogRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No skin profile found. Please create your skin profile first."
        )

    log_date = data.log_date or date.today()
    rating = data.condition_rating or data.skin_condition_rating or 7

    # Check if a log already exists for this date, update if so
    existing = (
        db.query(ProgressLog)
        .filter(ProgressLog.user_id == user.id, ProgressLog.log_date == log_date)
        .first()
    )

    # Get latest skin assessment score snapshot
    latest_assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == user.id)
        .order_by(SkinAssessment.created_at.desc())
        .first()
    )
    score_snapshot = latest_assessment.overall_score if latest_assessment else 75.0

    concerns_val = data.active_concerns
    if data.concerns_severity and not concerns_val:
        concerns_val = list(data.concerns_severity.keys())

    if existing:
        existing.condition_rating = rating
        if hasattr(existing, "skin_condition_rating"):
            existing.skin_condition_rating = rating
        existing.notes = data.notes or ""
        existing.active_concerns = json.dumps(concerns_val)
        if hasattr(existing, "skin_health_score_at_log"):
            existing.skin_health_score_at_log = score_snapshot
        db.commit()
        db.refresh(existing)
        return serialize_progress(existing)

    entry = ProgressLog(
        user_id=user.id,
        log_date=log_date,
        condition_rating=rating,
        skin_condition_rating=rating,
        notes=data.notes or "",
        active_concerns=json.dumps(concerns_val),
        skin_health_score_at_log=score_snapshot,
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return serialize_progress(entry)


@router.get("/history")
def get_progress_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No skin profile found. Please create your skin profile first."
        )

    logs = (
        db.query(ProgressLog)
        .filter(ProgressLog.user_id == user.id)
        .order_by(ProgressLog.log_date.desc())
        .limit(30)
        .all()
    )
    return [serialize_progress(l) for l in logs]


@router.get("/analytics")
def get_progress_analytics(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No skin profile found. Please create your skin profile first."
        )

    logs = (
        db.query(ProgressLog)
        .filter(ProgressLog.user_id == user.id)
        .order_by(ProgressLog.log_date.asc())
        .all()
    )

    checklist_logs = (
        db.query(RoutineChecklistLog)
        .filter(RoutineChecklistLog.user_id == user.id)
        .order_by(RoutineChecklistLog.log_date.asc())
        .all()
    )

    total_logs = len(logs)
    if total_logs == 0:
        avg_rating = 0.0
        score_improvement = 0.0
    else:
        avg_rating = round(sum(getattr(l, "condition_rating", 7) for l in logs) / total_logs, 1)
        first_score = getattr(logs[0], "skin_health_score_at_log", None) or 70.0
        last_score = getattr(logs[-1], "skin_health_score_at_log", None) or 70.0
        score_improvement = round(last_score - first_score, 1)

    if checklist_logs:
        adherence_rate = round(sum(c.completion_rate for c in checklist_logs) / len(checklist_logs), 1)
    elif total_logs > 0:
        adherence_rate = round(min(100.0, total_logs * 25.0), 1)
    else:
        adherence_rate = 0.0

    # Collect active dates for streak calculation
    active_dates = set()
    for l in logs:
        active_dates.add(l.log_date)
    for c in checklist_logs:
        if c.completion_rate > 0:
            active_dates.add(c.log_date)

    current_streak, longest_streak = _calculate_streaks(active_dates)

    # Build 30-day activity calendar
    today = date.today()
    logs_by_date = {l.log_date: l for l in logs}
    checklists_by_date = {c.log_date: c for c in checklist_logs}

    activity_calendar = []
    for i in range(29, -1, -1):
        day_date = today - timedelta(days=i)
        p_log = logs_by_date.get(day_date)
        c_log = checklists_by_date.get(day_date)

        is_completed = False
        is_partial = False
        condition_val = None
        completion_pct = 0.0
        notes_val = ""

        if p_log:
            condition_val = getattr(p_log, "condition_rating", 7)
            notes_val = p_log.notes or ""
            is_completed = True

        if c_log:
            completion_pct = c_log.completion_rate or 0.0
            if completion_pct >= 60.0:
                is_completed = True
            elif completion_pct > 0:
                is_partial = True

        activity_calendar.append({
            "date": str(day_date),
            "day": day_date.day,
            "month": day_date.strftime("%b"),
            "weekday": day_date.strftime("%a"),
            "is_today": day_date == today,
            "has_activity": is_completed or is_partial,
            "status": "completed" if is_completed else ("partial" if is_partial else "none"),
            "condition_rating": condition_val,
            "completion_rate": completion_pct,
            "notes": notes_val,
        })

    trend = [
        {
            "date": str(l.log_date),
            "rating": getattr(l, "condition_rating", 7),
            "health_score": getattr(l, "skin_health_score_at_log", 75.0) or 75.0,
            "notes": l.notes
        }
        for l in logs
    ]

    return {
        "total_logs": total_logs,
        "average_condition_rating": avg_rating,
        "routine_adherence_rate": adherence_rate,
        "score_improvement": score_improvement,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "progress_trend": trend,
        "activity_calendar": activity_calendar,
    }
