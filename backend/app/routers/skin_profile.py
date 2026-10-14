from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import get_current_user
from app.models.skin_profile import SkinProfile
from app.models.skin_concern import SkinConcern, UserSkinConcern
from app.models.user import User
from app.schemas.skin_profile import SkinProfileIn, SkinProfileOut

router = APIRouter(prefix="/skin-profile", tags=["skin-profile"])


def _sync_skin_concerns(db: Session, user_id, concern_names: list[str]) -> list[str]:
    """Replaces the user's selected concerns with the given list, creating
    any new concern lookup rows the first time they're used."""
    db.query(UserSkinConcern).filter(UserSkinConcern.user_id == user_id).delete()

    resolved_names: list[str] = []
    for name in concern_names:
        concern = db.query(SkinConcern).filter(SkinConcern.name == name).first()
        if concern is None:
            concern = SkinConcern(name=name)
            db.add(concern)
            db.flush()
        db.add(UserSkinConcern(user_id=user_id, skin_concern_id=concern.id, severity="moderate"))
        resolved_names.append(concern.name)

    return resolved_names


def _load_skin_concerns(db: Session, user_id) -> list[str]:
    rows = (
        db.query(SkinConcern.name)
        .join(UserSkinConcern, UserSkinConcern.skin_concern_id == SkinConcern.id)
        .filter(UserSkinConcern.user_id == user_id)
        .all()
    )
    return [name for (name,) in rows]


def _to_out(profile: SkinProfile, concerns: list[str]) -> SkinProfileOut:
    return SkinProfileOut(
        id=profile.id,
        user_id=profile.user_id,
        skin_type=profile.skin_type,
        age_group=profile.age_group,
        skin_concerns=concerns,
        allergies=profile.allergies,
        sensitivities=profile.sensitivities,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.get("/me", response_model=SkinProfileOut)
def get_my_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No skin profile yet")
    concerns = _load_skin_concerns(db, current_user.id)
    return _to_out(profile, concerns)


@router.put("/me", response_model=SkinProfileOut)
def upsert_my_profile(
    payload: SkinProfileIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    data = payload.model_dump()
    data.pop("skin_concerns")

    if profile is None:
        profile = SkinProfile(user_id=current_user.id, **data)
        db.add(profile)
    else:
        for field, value in data.items():
            setattr(profile, field, value)

    concerns = _sync_skin_concerns(db, current_user.id, payload.skin_concerns)

    db.commit()
    db.refresh(profile)
    return _to_out(profile, concerns)