from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserResponse, LoginRequest, TokenResponse
from ..auth import hash_password, verify_password, create_access_token
from ..dependencies import get_current_user, require_role
from ..roles import Role
from pydantic import BaseModel
import bcrypt
router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        role=user.role,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=TokenResponse)
def login(user: LoginRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        user.password,
        existing_user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # The role goes straight into the token payload. Every protected
    # route can then check it via Depends(require_role(...)) without
    # hitting the database again on each request.
    access_token = create_access_token(
        data={
            "user_id": existing_user.id,
            "email": existing_user.email,
            "role": existing_user.role,
        }
    )

    return TokenResponse(
        access_token=access_token,
        user=existing_user,
    )
@router.post("/login/token")
def login_for_swagger(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    existing_user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not verify_password(
        form_data.password,
        existing_user.password,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        data={
            "user_id": existing_user.id,
            "email": existing_user.email,
            "role": existing_user.role,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Any logged-in user can call this to find out who the server
    thinks they are -- handy for the frontend to hydrate its auth
    state on refresh, and useful for you to sanity-check tokens
    with Swagger's "Authorize" button.
    """
    return current_user


@router.get("/admin/users", response_model=list[UserResponse])
def list_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.ADMIN)),
):
    """
    Example admin-only route: only a user whose role is "admin"
    can reach this. Everyone else gets a 403. Use this route as the
    template for locking down any other endpoint by role.
    """
    return db.query(User).all()
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.put("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check current password
    if not bcrypt.checkpw(
        data.current_password.encode("utf-8"),
        current_user.password.encode("utf-8")
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )

    # Validate new password
    if len(data.new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="New password must be at least 8 characters"
        )

    # Hash new password
    hashed_password = bcrypt.hashpw(
        data.new_password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    current_user.password = hashed_password
    db.commit()

    return {
        "message": "Password changed successfully"
    }