from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.routine import RoutinePlan, RoutineStepCompletion
from app.models.user import User
from app.schemas.assessment import AssessmentInput
from app.schemas.routine import RoutineDayProgress, RoutinePlanResponse
from app.services.assessment_service import assess_user


def _daily_step_keys(routine: dict) -> list[str]:
    return [f"{section}:{index}" for section in ("morning", "evening") for index, _ in enumerate(routine.get(section, []))]


def _build_response(db: Session, plan: RoutinePlan) -> RoutinePlanResponse:
    today = date.today()
    daily_keys = _daily_step_keys(plan.routine)
    completed_rows = db.query(RoutineStepCompletion).filter(
        RoutineStepCompletion.routine_id == plan.id,
        RoutineStepCompletion.record_date == today,
        RoutineStepCompletion.completed.is_(True),
    ).all()
    completed_keys = [row.step_key for row in completed_rows]

    week_start = today - timedelta(days=6)
    week_rows = db.query(RoutineStepCompletion).filter(
        RoutineStepCompletion.routine_id == plan.id,
        RoutineStepCompletion.record_date >= week_start,
        RoutineStepCompletion.record_date <= today,
        RoutineStepCompletion.completed.is_(True),
    ).all()
    completed_by_date: dict[date, set[str]] = {}
    for row in week_rows:
        if row.step_key in daily_keys:
            completed_by_date.setdefault(row.record_date, set()).add(row.step_key)

    recent_progress = []
    plan_start_date = plan.created_at.date()
    for day_offset in range(6, -1, -1):
        progress_date = today - timedelta(days=day_offset)
        active_day = progress_date >= plan_start_date
        completed_count = len(completed_by_date.get(progress_date, set())) if active_day else 0
        total_count = len(daily_keys) if active_day else 0
        recent_progress.append(RoutineDayProgress(
            record_date=progress_date,
            completed_steps=completed_count,
            total_steps=total_count,
            adherence_percentage=round(completed_count / total_count * 100, 1) if total_count else 0,
        ))

    return RoutinePlanResponse(
        id=plan.id,
        routine=plan.routine,
        assessment_score=plan.assessment_score,
        summary=plan.summary,
        created_at=plan.created_at,
        completed_step_keys=completed_keys,
        today_completed_steps=len(set(completed_keys) & set(daily_keys)),
        today_total_steps=len(daily_keys),
        recent_progress=recent_progress,
    )


def get_current_routine(db: Session, user: User) -> RoutinePlanResponse | None:
    plan = db.query(RoutinePlan).filter(
        RoutinePlan.user_id == user.id,
        RoutinePlan.is_active.is_(True),
    ).order_by(RoutinePlan.created_at.desc()).first()
    return _build_response(db, plan) if plan else None


def generate_routine(db: Session, user: User, assessment: AssessmentInput) -> RoutinePlanResponse:
    result = assess_user(assessment)
    db.query(RoutinePlan).filter(
        RoutinePlan.user_id == user.id,
        RoutinePlan.is_active.is_(True),
    ).update({RoutinePlan.is_active: False}, synchronize_session=False)

    plan = RoutinePlan(
        user_id=user.id,
        routine=result.routine,
        assessment_score=round(result.score),
        summary=result.summary,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return _build_response(db, plan)


def toggle_routine_step(db: Session, user: User, routine_id: int, step_key: str, completed: bool) -> RoutinePlanResponse:
    plan = db.query(RoutinePlan).filter(
        RoutinePlan.id == routine_id,
        RoutinePlan.user_id == user.id,
        RoutinePlan.is_active.is_(True),
    ).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active routine not found.")
    if step_key not in _daily_step_keys(plan.routine):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Routine step key is invalid.")

    entry = db.query(RoutineStepCompletion).filter(
        RoutineStepCompletion.routine_id == plan.id,
        RoutineStepCompletion.record_date == date.today(),
        RoutineStepCompletion.step_key == step_key,
    ).first()
    if entry:
        entry.completed = completed
        entry.completed_at = datetime.now(timezone.utc)
    else:
        entry = RoutineStepCompletion(
            routine_id=plan.id,
            user_id=user.id,
            record_date=date.today(),
            step_key=step_key,
            completed=completed,
        )
        db.add(entry)
    db.commit()
    return _build_response(db, plan)