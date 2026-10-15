from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.dependencies.database import get_db
from app.dependencies.auth import require_role
from app.models.user import User, UserRole
from app.schemas.user import UserListResponse, UserResponse
from app.services.user_service import user_service

router = APIRouter(prefix="/admin", tags=["Administration"])


@router.get("/users", response_model=UserListResponse)
def get_all_registered_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role([UserRole.ADMINISTRATOR]))
):
    """List all registered users (Administrator only)."""
    users, total = user_service.get_all_users(db, skip=skip, limit=limit)
    return UserListResponse(
        users=[UserResponse.model_validate(u) for u in users],
        total=total
    )
