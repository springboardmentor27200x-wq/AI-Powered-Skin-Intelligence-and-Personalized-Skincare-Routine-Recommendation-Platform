from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.security import decode_access_token
from app.db.database import get_db
from app.models.user import User

# tokenUrl must point to the absolute path of the login endpoint for Swagger docs
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login", auto_error=False)


def get_optional_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme_optional)
) -> Optional[User]:
    """Dependency to optionally retrieve logged in user context, returning None if unauthenticated."""
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        if not payload:
            return None
        email: str = payload.get("sub")
        if not email:
            return None
        user = db.query(User).filter(User.email == email.strip().lower()).first()
        if not user or not user.is_active:
            return None
        return user
    except Exception:
        return None


def get_current_user(
    db: Session = Depends(get_db),
    header_token: Optional[str] = Depends(oauth2_scheme_optional),
    token: Optional[str] = None,
) -> User:
    """Dependency to retrieve the currently logged in user context via Bearer header or token query param."""
    effective_token = header_token or token
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not effective_token:
        raise credentials_exception
        
    payload = decode_access_token(effective_token)
    if payload is None:
        raise credentials_exception
        
    email: Optional[str] = payload.get("sub")
    if not email:
        raise credentials_exception

    email_clean = email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if user is None:
        raise credentials_exception
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive"
        )
        
    return user


class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource"
            )
        return current_user


def require_role(roles: List[str]):
    """Enforce that the authenticated user has one of the allowed roles."""
    return RoleChecker(roles)
