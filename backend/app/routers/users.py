from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.dependencies.database import get_db
from app.dependencies.auth import get_current_active_user
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, UserPasswordChange
from app.services.user_service import user_service

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_my_details(current_user: User = Depends(get_current_active_user)):
    """Get current user details."""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_my_details(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update current user name or email."""
    updated = user_service.update_user_profile(db, current_user, user_in)
    return updated


@router.put("/me/password", status_code=status.HTTP_200_OK)
def change_my_password(
    pwd_in: UserPasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Change current user password."""
    user_service.change_user_password(db, current_user, pwd_in)
    return {"detail": "Password updated successfully."}
