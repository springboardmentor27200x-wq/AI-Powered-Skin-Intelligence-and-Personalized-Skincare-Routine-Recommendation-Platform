from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from .auth import decode_access_token
from .database import get_db
from .models import User

# tokenUrl just tells the auto-generated docs (Swagger "Authorize"
# button) where to get a token from -- it doesn't change behaviour.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login/token")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Runs on every protected route. Reads the "Authorization: Bearer <token>"
    header, decodes the JWT, and loads the matching user from the DB.
    Any failure (missing token, bad signature, expired, unknown user)
    becomes a 401 -- never a silent pass-through.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
        user_id = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    return user


def require_role(*allowed_roles: str):
    """
    Dependency factory for role-based access control.

    Usage on a route:
        @router.get("/admin/users")
        def list_users(current_user: User = Depends(require_role("admin"))):
            ...

    Any authenticated user reaches get_current_user fine; this wraps
    it with a role check and returns 403 (not 401) if their role
    isn't in the allowed list -- they're a known user, just not
    permitted to do this particular thing.
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Role '{current_user.role}' is not permitted to "
                    f"access this resource."
                ),
            )
        return current_user

    return role_checker
