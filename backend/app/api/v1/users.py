from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.db.session import get_db
from app.models.user import UserRole
from app.schemas.user import UserResponse, RoleUpdate
from app.core.dependencies import get_current_user, require_roles

router = APIRouter()

@router.get("/", response_model=List[UserResponse], summary="List all users (Admin & Consultant only)")
def list_users(
    skip: int = 0,
    limit: int = 100,
    db = Depends(get_db),
    current_user: dict = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.SKINCARE_CONSULTANT, UserRole.DERMATOLOGIST]))
):
    users = list(db["users"].find().skip(skip).limit(limit))
    return users

@router.get("/{user_id}", response_model=UserResponse, summary="Get user details by ID")
def get_user_by_id(
    user_id: int,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") == UserRole.USER.value and current_user.get("id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: cannot view another user's account"
        )
    user = db["users"].find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.get("/admin/stats", summary="Get administrator system telemetry & counts")
def get_admin_stats(
    db = Depends(get_db),
    current_user: dict = Depends(require_roles([UserRole.ADMINISTRATOR]))
):
    total_users = db["users"].count_documents({})
    total_profiles = db["skin_profiles"].count_documents({})
    total_logs = db["lifestyle_logs"].count_documents({})
    users_by_role = {
        "consumers": db["users"].count_documents({"role": UserRole.USER.value}),
        "consultants": db["users"].count_documents({"role": UserRole.SKINCARE_CONSULTANT.value}),
        "dermatologists": db["users"].count_documents({"role": UserRole.DERMATOLOGIST.value}),
        "administrators": db["users"].count_documents({"role": UserRole.ADMINISTRATOR.value}),
    }
    return {
        "total_users": total_users,
        "total_profiles": total_profiles,
        "total_logs": total_logs,
        "users_by_role": users_by_role,
        "database_status": "Connected (MongoDB)",
        "security_protocol": "OAuth2 JWT (HS256)",
        "server_status": "Healthy / 100% Operational"
    }

@router.patch("/{user_id}/role", response_model=UserResponse, summary="Update user role (Admin only)")
def update_user_role(
    user_id: int,
    role_update: RoleUpdate,
    db = Depends(get_db),
    current_user: dict = Depends(require_roles([UserRole.ADMINISTRATOR]))
):
    user = db["users"].find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    role_val = role_update.role.value if hasattr(role_update.role, "value") else str(role_update.role)
    db["users"].update_one({"id": user_id}, {"$set": {"role": role_val}})
    updated_user = db["users"].find_one({"id": user_id})
    return updated_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete user (Admin only)")
def delete_user(
    user_id: int,
    db = Depends(get_db),
    current_user: dict = Depends(require_roles([UserRole.ADMINISTRATOR]))
):
    user = db["users"].find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if user["id"] == current_user.get("id"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete your own account")
        
    db["users"].delete_one({"id": user_id})
    db["skin_profiles"].delete_many({"user_id": user_id})
    db["lifestyle_logs"].delete_many({"user_id": user_id})
    db["sleep_logs"].delete_many({"user_id": user_id})
    db["hydration_logs"].delete_many({"user_id": user_id})
    db["environment_logs"].delete_many({"user_id": user_id})
    return None
