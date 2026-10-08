from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.db.session import get_db
from app.models.user import UserRole
from app.schemas.profile import SkinProfileCreate, SkinProfileUpdate, SkinProfileResponse
from app.services.profile_service import profile_service
from app.core.dependencies import get_current_user, require_roles

router = APIRouter()

@router.get("/me", response_model=Optional[SkinProfileResponse], summary="Get current user's skin profile")
def get_my_profile(
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    profile = profile_service.get_profile_by_user_id(db, current_user["id"])
    if not profile:
        return None
    return profile

@router.post("/me", response_model=SkinProfileResponse, summary="Create or update current user's skin profile")
def save_my_profile(
    profile_data: SkinProfileCreate,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return profile_service.create_or_update_profile(db, current_user["id"], profile_data)

@router.patch("/me", response_model=SkinProfileResponse, summary="Partially update current user's skin profile")
def update_my_profile(
    profile_data: SkinProfileUpdate,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return profile_service.update_profile_partial(db, current_user["id"], profile_data)

@router.get("/{user_id}", response_model=SkinProfileResponse, summary="Get skin profile for specific user (Staff / Self)")
def get_user_profile(
    user_id: int,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") == UserRole.USER.value and current_user.get("id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: cannot view another user's skin profile"
        )
    profile = profile_service.get_profile_by_user_id(db, user_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skin profile not found")
    return profile
