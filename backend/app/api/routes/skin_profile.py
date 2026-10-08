from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user, get_db
from app.models.skin_profile import SkinProfile, SkinConcern
from app.models.user import User
from app.schemas.skin_profile import SkinProfileCreate, SkinProfileUpdate, SkinProfileResponse, SkinConcernResponse

router = APIRouter()


@router.get("/concerns", response_model=List[SkinConcernResponse])
def get_all_concerns(db: Session = Depends(get_db)):
    """Retrieve all standard skin concern reference items."""
    return db.query(SkinConcern).all()


@router.get("/me", response_model=SkinProfileResponse)
def get_my_skin_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve the current user's skin profile."""
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skin profile not found"
        )
    return profile


@router.post("", response_model=SkinProfileResponse, status_code=status.HTTP_201_CREATED)
def create_skin_profile(
    profile_in: SkinProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new skin profile for the current user."""
    # Resolve concerns by their codes
    concerns_list = []
    if profile_in.concerns:
        concerns_list = db.query(SkinConcern).filter(SkinConcern.code.in_(profile_in.concerns)).all()

    # Check if a skin profile already exists — if so, update (upsert)
    existing = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if existing:
        existing.skin_type = profile_in.skin_type
        existing.allergies = profile_in.allergies
        existing.sensitivities = profile_in.sensitivities
        existing.concerns = concerns_list
        db.commit()
        db.refresh(existing)
        return existing

    profile = SkinProfile(
        user_id=current_user.id,
        skin_type=profile_in.skin_type,
        allergies=profile_in.allergies,
        sensitivities=profile_in.sensitivities,
        concerns=concerns_list
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.patch("/me", response_model=SkinProfileResponse)
def update_skin_profile(
    profile_in: SkinProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's skin profile details."""
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skin profile not found. Please create one first."
        )

    update_data = profile_in.model_dump(exclude_unset=True)

    # Update concerns if provided in request
    if "concerns" in update_data:
        concern_codes = update_data.pop("concerns")
        if concern_codes is not None:
            concerns_list = db.query(SkinConcern).filter(SkinConcern.code.in_(concern_codes)).all()
            profile.concerns = concerns_list

    for field, value in update_data.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile
