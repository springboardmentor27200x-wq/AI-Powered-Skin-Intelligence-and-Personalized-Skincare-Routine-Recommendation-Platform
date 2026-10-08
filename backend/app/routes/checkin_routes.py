from datetime import date as Date, timedelta
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..dependencies import get_current_user
from ..models import User, DailyCheckin, Lifestyle, Sleep
from ..services.skin_scoring import (calculate_skin_health, calculate_lifestyle_score, calculate_sleep_score, calculate_hydration_score)

router = APIRouter(prefix="/api/checkins", tags=["Daily Check-ins"])


class CheckinInput(BaseModel):
    date: Date = Field(default_factory=Date.today)
    routine_completed: bool
    water_intake_liters: float = Field(ge=0, le=20)
    sleep_hours: float = Field(ge=0, le=16)
    skin_condition_rating: float = Field(ge=0, le=100)


def _owned(user_id, current_user):
    if current_user.id != user_id and current_user.role not in ("admin", "consultant", "dermatologist"):
        raise HTTPException(status_code=403, detail="You can only update your own daily check-in.")


@router.put("/{user_id}")
def save_daily_checkin(user_id: int, payload: CheckinInput, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _owned(user_id, current_user)
    user = db.query(User).filter_by(id=user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found.")
    lifestyle = db.query(Lifestyle).filter_by(user_id=user_id).order_by(Lifestyle.id.desc()).first()
    sleep = calculate_sleep_score(payload.sleep_hours, 7)
    hydration = calculate_hydration_score(payload.water_intake_liters)
    lifestyle_score = calculate_lifestyle_score(lifestyle.exercise_minutes if lifestyle else 0, lifestyle.stress_level if lifestyle else 5)
    weighted_score = round(payload.skin_condition_rating * .35 + lifestyle_score * .20 + sleep * .15 + (100 if payload.routine_completed else 0) * .20 + hydration * .10, 2)
    record = db.query(DailyCheckin).filter_by(user_id=user_id, date=payload.date).first()
    if not record:
        record = DailyCheckin(user_id=user_id, date=payload.date)
        db.add(record)
    record.routine_completed = payload.routine_completed
    record.water_intake_liters = payload.water_intake_liters
    record.sleep_hours = payload.sleep_hours
    record.skin_condition_rating = payload.skin_condition_rating
    record.lifestyle_score = lifestyle_score
    record.hydration_score = hydration
    record.skin_health_score = weighted_score
    db.commit()
    db.refresh(record)
    return {"id": record.id, "user_id": user_id, "date": record.date, "routine_completed": record.routine_completed, "water_intake_liters": record.water_intake_liters, "sleep_hours": record.sleep_hours, "skin_condition_rating": record.skin_condition_rating, "skin_health_score": record.skin_health_score, "components": {"skin_condition": payload.skin_condition_rating, "lifestyle": record.lifestyle_score, "sleep": sleep, "routine_consistency": 100 if record.routine_completed else 0, "hydration": record.hydration_score}}


@router.get("/{user_id}")
def get_daily_checkins(user_id: int, days: int = 30, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _owned(user_id, current_user)
    days = max(1, min(days, 365))
    start = date.today() - timedelta(days=days - 1)
    records = db.query(DailyCheckin).filter(DailyCheckin.user_id == user_id, DailyCheckin.date >= start).order_by(DailyCheckin.date.asc()).all()
    rows = [{"date": r.date.isoformat(), "routine_completed": r.routine_completed, "water_intake_liters": r.water_intake_liters, "sleep_hours": r.sleep_hours, "skin_condition_rating": r.skin_condition_rating, "skin_health_score": r.skin_health_score} for r in records]
    groups = {}
    for row in rows:
        day = date.fromisoformat(row["date"])
        week_start = (day - timedelta(days=day.weekday())).isoformat()
        groups.setdefault(week_start, []).append(row)
    weekly = []
    for week_start, group in sorted(groups.items()):
        weekly.append({"week_start": week_start, "days_recorded": len(group), "average_skin_health_score": round(sum(x["skin_health_score"] for x in group) / len(group), 1), "routine_completion_rate": round(100 * sum(x["routine_completed"] for x in group) / len(group), 1), "average_water_intake_liters": round(sum(x["water_intake_liters"] for x in group) / len(group), 2), "average_sleep_hours": round(sum(x["sleep_hours"] for x in group) / len(group), 2)})
    return {"daily": rows, "weekly_summary": weekly, "total_days": len(rows)}
