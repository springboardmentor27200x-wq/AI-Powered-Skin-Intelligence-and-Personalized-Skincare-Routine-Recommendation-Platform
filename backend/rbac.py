from fastapi import Depends, HTTPException, status
from auth import get_current_user
from models import User


def require_role(*roles: str):
    """
    FastAPI dependency factory.
    Usage:
        @router.get("/admin")
        def admin_only(user: User = Depends(require_role("admin"))):
            ...
    """
    def _guard(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(roles)}",
            )
        return user
    return _guard
