from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies.database import get_db
from app.dependencies.auth import get_current_active_user
from app.models.user import User
from app.schemas.skin_profile import (
    SkinProfileCreate,
    SkinProfileUpdate,
    SkinProfileResponse,
)
from app.services.skin_service import skin_service

router = APIRouter(prefix="/skin-profile", tags=["Skin Profile"])


@router.get("", response_model=SkinProfileResponse)
def get_skin_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve the current user's skin profile."""
    profile = skin_service.get_profile(db, current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skin profile not found. Please create one."
        )
    return profile


@router.post("", response_model=SkinProfileResponse, status_code=status.HTTP_201_CREATED)
def create_skin_profile(
    profile_in: SkinProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create or overwrite the user's skin profile."""
    return skin_service.create_or_update_profile(db, current_user.id, profile_in)


@router.put("", response_model=SkinProfileResponse)
def update_skin_profile(
    profile_in: SkinProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update existing skin profile fields."""
    return skin_service.patch_profile(db, current_user.id, profile_in)
