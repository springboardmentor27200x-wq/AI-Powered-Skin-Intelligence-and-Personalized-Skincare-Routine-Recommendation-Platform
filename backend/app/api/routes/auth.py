from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user, get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import settings
from app.models.user import User, UserProfile
from app.schemas.auth import (
    RegisterInput, TokenResponse, GoogleAuthInput,
    ForgotPasswordInput, VerifyOTPInput, ResetPasswordInput, PasswordResetResponse
)
from app.schemas.user import UserResponse
from app.services.email_service import (
    create_and_send_reset_otp, verify_reset_otp, execute_password_reset
)

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: RegisterInput, db: Session = Depends(get_db)):
    email_clean = (user_in.email or "").strip().lower()
    if not email_clean or "@" not in email_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid email address is required"
        )

    # Check duplicate email
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )

    # Validate password match
    if user_in.password != user_in.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )

    # Validate target role
    target_role = (user_in.role or "USER").upper().strip()
    if target_role == "ADMINISTRATOR":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrator accounts must be provisioned by existing administrators"
        )
    if target_role not in ["USER", "SKINCARE_CONSULTANT", "DERMATOLOGIST"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be USER, SKINCARE_CONSULTANT, or DERMATOLOGIST"
        )

    # Create new user
    new_user = User(
        email=email_clean,
        hashed_password=hash_password(user_in.password),
        role=target_role,
        auth_provider="local",
        is_active=True,
        is_verified=False
    )
    db.add(new_user)
    db.flush()  # Obtain new_user.id

    # Create corresponding profile
    new_profile = UserProfile(
        user_id=new_user.id,
        name=user_in.full_name
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    email_clean = (form_data.username or "").strip().lower()
    # Look up user by normalized email
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive"
        )

    # Update last login time
    user.last_login = datetime.utcnow()
    db.commit()

    # Generate JWT
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/google", response_model=TokenResponse)
def google_auth(auth_in: GoogleAuthInput, db: Session = Depends(get_db)):
    """Placeholder OAuth2 verification logic."""
    cred = (auth_in.credential or "").strip()
    if not cred:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google authentication credential is required"
        )
    email = f"google_{cred[:8]}@example.com".lower()
    name = "Google User"

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            hashed_password=hash_password(f"google_{uuid.uuid4().hex}"),  # Secure random dummy password
            role="USER",
            auth_provider="google",
            is_active=True,
            is_verified=True
        )
        db.add(user)
        db.flush()

        profile = UserProfile(
            user_id=user.id,
            name=name
        )
        db.add(profile)
        db.commit()
        db.refresh(user)

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}


# ── Password Reset with Email OTP ──────────────────────────────────────────

@router.post("/forgot-password", response_model=PasswordResetResponse, response_model_exclude_none=True)
def forgot_password(req: ForgotPasswordInput, db: Session = Depends(get_db)):
    """
    Initiates password reset by verifying email existence, generating a 6-digit OTP,
    and dispatching an OTP email (or logging to console in dev mode).
    """
    email_clean = (req.email or "").strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address. Please verify your email or register."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account is currently deactivated. Please contact support."
        )

    _, otp_code = create_and_send_reset_otp(db, email_clean, user)
    resp = {
        "success": True,
        "message": "A 6-digit verification code has been sent to your email address.",
    }
    # Only supply dev_otp in local offline testing when no SMTP host is configured
    if not settings.SMTP_HOST:
        resp["dev_otp"] = otp_code
    return resp


@router.post("/verify-otp", response_model=PasswordResetResponse)
def verify_otp_endpoint(req: VerifyOTPInput, db: Session = Depends(get_db)):
    """
    Validates a 6-digit OTP without resetting the password yet.
    Allows frontend to confirm OTP before prompting for new password.
    """
    email_clean = (req.email or "").strip().lower()
    is_valid, msg, _ = verify_reset_otp(db, email_clean, req.otp)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg
        )
    return {
        "success": True,
        "message": msg
    }


@router.post("/reset-password", response_model=PasswordResetResponse)
def reset_password(req: ResetPasswordInput, db: Session = Depends(get_db)):
    """
    Verifies OTP and resets user password to the new password.
    """
    if req.new_password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirmation password do not match."
        )

    if len(req.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )

    email_clean = (req.email or "").strip().lower()
    success, msg = execute_password_reset(db, email_clean, req.otp, req.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg
        )

    return {
        "success": True,
        "message": msg
    }

