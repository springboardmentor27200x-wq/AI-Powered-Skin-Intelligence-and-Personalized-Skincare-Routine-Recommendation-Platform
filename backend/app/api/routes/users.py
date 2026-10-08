from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user, get_db
from app.models.user import User, UserProfile
from app.schemas.user import UserResponse, UserProfileUpdate

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Fetch current user's details and profile."""
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_profile(
    profile_in: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile information."""
    profile = current_user.profile
    if not profile:
        # Create a new profile if somehow it does not exist
        profile = UserProfile(user_id=current_user.id, name="User")
        db.add(profile)
        db.flush()

    # Update only fields provided
    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user
