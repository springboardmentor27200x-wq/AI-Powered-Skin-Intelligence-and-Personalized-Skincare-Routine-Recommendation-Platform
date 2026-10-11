from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import (
    UserResponse,
    UserUpdateRequest,
    PasswordChangeRequest,
    RegisterRequest,
    RoleUpdateRequest,
    VALID_ROLES
)
from auth import get_current_user, hash_password, verify_password
from rbac import require_role

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def current_user(user: User = Depends(get_current_user)):
    return user

@router.put("/me", response_model=UserResponse)
def update_profile(
    req: UserUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.name is not None:
        user.name = req.name
    if req.phone is not None:
        user.phone = req.phone
    if req.bio is not None:
        user.bio = req.bio
    db.commit()
    db.refresh(user)
    return user

@router.post("/change-password")
def change_password(
    req: PasswordChangeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(req.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    user.password_hash = hash_password(req.new_password)
    db.commit()
    return {"message": "Password changed successfully"}

@router.get("/", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin"))
):
    return db.query(User).order_by(User.id.asc()).all()

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def admin_create_user(
    req: RegisterRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin"))
):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if req.role and req.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {VALID_ROLES}")
    user = User(
        name=req.name,
        email=req.email,
        password_hash=hash_password(req.password),
        age=req.age,
        gender=req.gender,
        phone=req.phone,
        role=req.role or "user"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.get("/clients", response_model=List[UserResponse])
def list_clients(
    db: Session = Depends(get_db),
    consultant: User = Depends(require_role("skincare_consultant", "dermatologist", "admin"))
):
    return db.query(User).filter(User.role == "user").order_by(User.id.asc()).all()

@router.put("/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    req: RoleUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin"))
):
    if req.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {VALID_ROLES}")
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    target_user.role = req.role
    db.commit()
    db.refresh(target_user)
    return target_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin"))
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
    db.delete(target_user)
    db.commit()
    return None
