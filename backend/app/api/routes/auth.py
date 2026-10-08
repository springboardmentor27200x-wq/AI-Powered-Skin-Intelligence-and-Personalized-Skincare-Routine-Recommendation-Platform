from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user, get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User, UserProfile
from app.schemas.auth import RegisterInput, TokenResponse, GoogleAuthInput
from app.schemas.user import UserResponse

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
