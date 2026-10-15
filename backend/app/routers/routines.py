from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_active_user
from app.dependencies.database import get_db
from app.models.user import User
from app.schemas.assessment import AssessmentInput
from app.schemas.routine import RoutinePlanResponse, RoutineStepToggle
from app.services.routine_service import generate_routine, get_current_routine, toggle_routine_step

router = APIRouter(prefix="/routines", tags=["Routine Tracking"])


@router.get("/current", response_model=RoutinePlanResponse | None)
def current_routine(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return get_current_routine(db, current_user)


@router.post("/generate", response_model=RoutinePlanResponse)
def create_routine(
    assessment: AssessmentInput,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return generate_routine(db, current_user, assessment)


@router.put("/{routine_id}/steps/{step_key}", response_model=RoutinePlanResponse)
def update_routine_step(
    routine_id: int,
    step_key: str,
    payload: RoutineStepToggle,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return toggle_routine_step(db, current_user, routine_id, step_key, payload.completed)