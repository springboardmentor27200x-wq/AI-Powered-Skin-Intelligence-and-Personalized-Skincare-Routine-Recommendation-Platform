from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.skin_profile import SkinProfile
from app.models.skin_assessment import SkinAssessment
from app.models.routine import Routine, RoutineStep
from app.schemas.routine import RoutineOut
from app.services.routine_engine import upsert_routine_for_assessment

router = APIRouter(prefix="/routines", tags=["routines"])


def _to_out(routine: Routine, steps: list[RoutineStep]) -> RoutineOut:
    return RoutineOut(
        id=routine.id,
        generated_at=routine.generated_at,
        based_on_assessment_id=routine.based_on_assessment_id,
        season=routine.season,
        morning=[s for s in steps if s.time_of_day == "morning"],
        evening=[s for s in steps if s.time_of_day == "evening"],
    )


@router.post("/me/generate", response_model=RoutineOut, status_code=status.HTTP_201_CREATED)
def generate_routine(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Create a skin profile first")

    latest_assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == current_user.id)
        .order_by(SkinAssessment.created_at.desc())
        .first()
    )
    if not latest_assessment:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Run a skin assessment first")

    routine, steps = upsert_routine_for_assessment(db, current_user.id, profile.skin_type, latest_assessment)

    db.commit()
    db.refresh(routine)
    for s in steps:
        db.refresh(s)

    return _to_out(routine, steps)


@router.get("/me", response_model=RoutineOut)
def get_my_routine(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    routine = db.query(Routine).filter(Routine.user_id == current_user.id).first()
    if not routine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No routine yet — generate one first")

    steps = db.query(RoutineStep).filter(RoutineStep.routine_id == routine.id).order_by(RoutineStep.time_of_day, RoutineStep.step_order).all()
    return _to_out(routine, steps)