from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies.database import get_db
from app.dependencies.auth import get_current_active_user
from app.models.user import User
from app.schemas.lifestyle import (
    LifestyleCreate,
    LifestyleUpdate,
    LifestyleResponse,
)
from app.services.lifestyle_service import lifestyle_service

router = APIRouter(prefix="/lifestyle", tags=["Lifestyle"])


@router.get("", response_model=LifestyleResponse)
def get_lifestyle_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve the current user's lifestyle profile."""
    profile = lifestyle_service.get_profile(db, current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lifestyle profile not found. Please create one."
        )
    return profile


@router.post("", response_model=LifestyleResponse, status_code=status.HTTP_201_CREATED)
def create_lifestyle_profile(
    lifestyle_in: LifestyleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create or overwrite the user's lifestyle profile."""
    return lifestyle_service.create_or_update_profile(db, current_user.id, lifestyle_in)


@router.put("", response_model=LifestyleResponse)
def update_lifestyle_profile(
    lifestyle_in: LifestyleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update lifestyle profile fields."""
    return lifestyle_service.patch_profile(db, current_user.id, lifestyle_in)
