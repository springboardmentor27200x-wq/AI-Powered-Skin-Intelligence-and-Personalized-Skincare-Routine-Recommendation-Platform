import json
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, SkincareRoutine, RoutineChecklistLog
from schemas import RoutineResponse, ChecklistRequest, ChecklistResponse
from auth import get_current_user
from services.routine_generator import generate_personalized_routine

router = APIRouter()


def serialize_routine(routine: SkincareRoutine) -> dict:
    return {
        "id": routine.id,
        "user_id": routine.user_id,
        "morning_steps": json.loads(routine.morning_steps or "[]"),
        "evening_steps": json.loads(routine.evening_steps or "[]"),
        "weekly_treatments": json.loads(routine.weekly_treatments or "[]"),
        "seasonal_advice": json.loads(routine.seasonal_advice or "[]"),
        "is_active": routine.is_active,
    }


@router.post("/generate", response_model=RoutineResponse)
def generate_routine(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    data = generate_personalized_routine(db, user.id)

    routine = (
        db.query(SkincareRoutine)
        .filter(SkincareRoutine.user_id == user.id, SkincareRoutine.is_active == True)
        .first()
    )

    if not routine:
        routine = SkincareRoutine(
            user_id=user.id,
            morning_steps=json.dumps(data["morning_steps"]),
            evening_steps=json.dumps(data["evening_steps"]),
            weekly_treatments=json.dumps(data["weekly_treatments"]),
            seasonal_advice=json.dumps(data["seasonal_advice"]),
            is_active=True,
        )
        db.add(routine)
    else:
        routine.morning_steps = json.dumps(data["morning_steps"])
        routine.evening_steps = json.dumps(data["evening_steps"])
        routine.weekly_treatments = json.dumps(data["weekly_treatments"])
        routine.seasonal_advice = json.dumps(data["seasonal_advice"])

    db.commit()
    db.refresh(routine)
    return serialize_routine(routine)


@router.get("", response_model=RoutineResponse)
def get_routine(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    routine = (
        db.query(SkincareRoutine)
        .filter(SkincareRoutine.user_id == user.id, SkincareRoutine.is_active == True)
        .first()
    )
    if not routine:
        return generate_routine(user, db)
    return serialize_routine(routine)


@router.post("/checklist", response_model=ChecklistResponse)
def update_checklist(
    data: ChecklistRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    routine = (
        db.query(SkincareRoutine)
        .filter(SkincareRoutine.user_id == user.id, SkincareRoutine.is_active == True)
        .first()
    )
    total_steps = 7.0
    if routine:
        morning = json.loads(routine.morning_steps or "[]")
        evening = json.loads(routine.evening_steps or "[]")
        total_steps = float(len(morning) + len(evening)) or 7.0

    completion_rate = min(100.0, round((len(data.completed_steps) / total_steps) * 100.0, 1))

    log = (
        db.query(RoutineChecklistLog)
        .filter(RoutineChecklistLog.user_id == user.id, RoutineChecklistLog.log_date == today)
        .first()
    )

    if not log:
        log = RoutineChecklistLog(
            user_id=user.id,
            log_date=today,
            completed_steps=json.dumps(data.completed_steps),
            completion_rate=completion_rate,
        )
        db.add(log)
    else:
        log.completed_steps = json.dumps(data.completed_steps)
        log.completion_rate = completion_rate

    db.commit()
    db.refresh(log)

    return {
        "id": log.id,
        "user_id": log.user_id,
        "log_date": log.log_date,
        "completed_steps": json.loads(log.completed_steps or "[]"),
        "completion_rate": log.completion_rate,
    }


@router.get("/checklist/today", response_model=ChecklistResponse)
def get_today_checklist(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    log = (
        db.query(RoutineChecklistLog)
        .filter(RoutineChecklistLog.user_id == user.id, RoutineChecklistLog.log_date == today)
        .first()
    )
    if not log:
        return {
            "id": 0,
            "user_id": user.id,
            "log_date": today,
            "completed_steps": [],
            "completion_rate": 0.0,
        }
    return {
        "id": log.id,
        "user_id": log.user_id,
        "log_date": log.log_date,
        "completed_steps": json.loads(log.completed_steps or "[]"),
        "completion_rate": log.completion_rate,
    }
