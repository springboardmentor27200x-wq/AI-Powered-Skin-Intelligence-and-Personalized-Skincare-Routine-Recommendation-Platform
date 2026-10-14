from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.skin_profile import SkinProfile
from app.models.skin_concern import SkinConcern, UserSkinConcern
from app.models.skin_assessment import SkinAssessment
from app.models.routine import Routine, RoutineStep
from app.schemas.client_view import ClientListItemOut, ClientDetailOut

router = APIRouter(prefix="/clients", tags=["clients"])

ALLOWED_ROLES = (UserRole.skincare_consultant, UserRole.dermatologist, UserRole.administrator)


def _latest_assessment(db: Session, user_id):
    return (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == user_id)
        .order_by(SkinAssessment.created_at.desc())
        .first()
    )


@router.get("", response_model=list[ClientListItemOut])
def list_clients(
    current_user: User = Depends(require_roles(*ALLOWED_ROLES)),
    db: Session = Depends(get_db),
):
    users = db.query(User).filter(User.role == UserRole.user).all()
    results = []
    for u in users:
        profile = db.query(SkinProfile).filter(SkinProfile.user_id == u.id).first()
        latest = _latest_assessment(db, u.id)
        results.append(ClientListItemOut(
            id=u.id, full_name=u.full_name, email=u.email,
            skin_type=profile.skin_type if profile else None,
            latest_score=latest.score if latest else None,
        ))
    return results


@router.get("/{client_id}", response_model=ClientDetailOut)
def get_client_detail(
    client_id: str,
    current_user: User = Depends(require_roles(*ALLOWED_ROLES)),
    db: Session = Depends(get_db),
):
    client = db.query(User).filter(User.id == client_id, User.role == UserRole.user).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    profile = db.query(SkinProfile).filter(SkinProfile.user_id == client.id).first()
    concerns = []
    if profile:
        concerns = [
            name for (name,) in (
                db.query(SkinConcern.name)
                .join(UserSkinConcern, UserSkinConcern.skin_concern_id == SkinConcern.id)
                .filter(UserSkinConcern.user_id == client.id)
                .all()
            )
        ]

    latest = _latest_assessment(db, client.id)
    history = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == client.id)
        .order_by(SkinAssessment.created_at.desc())
        .limit(10)
        .all()
    )

    routine = db.query(Routine).filter(Routine.user_id == client.id).first()
    routine_out = None
    if routine:
        steps = db.query(RoutineStep).filter(RoutineStep.routine_id == routine.id).order_by(RoutineStep.time_of_day, RoutineStep.step_order).all()
        routine_out = {
            "generated_at": routine.generated_at.isoformat(),
            "season": routine.season,
            "morning": [{"instruction": s.instruction, "category": s.category, "frequency": s.frequency} for s in steps if s.time_of_day == "morning"],
            "evening": [{"instruction": s.instruction, "category": s.category, "frequency": s.frequency} for s in steps if s.time_of_day == "evening"],
        }

    return ClientDetailOut(
        id=client.id, full_name=client.full_name, email=client.email,
        skin_type=profile.skin_type if profile else None,
        age_group=profile.age_group if profile else None,
        skin_concerns=concerns,
        allergies=profile.allergies if profile else [],
        sensitivities=profile.sensitivities if profile else [],
        latest_assessment={
            "score": latest.score, "prioritized_concerns": latest.prioritized_concerns,
            "risk_factors": latest.risk_factors, "created_at": latest.created_at.isoformat(),
        } if latest else None,
        assessment_history=[
            {"score": a.score, "created_at": a.created_at.isoformat()} for a in history
        ],
        current_routine=routine_out,
    )