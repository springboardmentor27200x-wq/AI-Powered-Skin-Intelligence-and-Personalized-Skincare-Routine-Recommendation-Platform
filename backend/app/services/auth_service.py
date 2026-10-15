from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserResponse
from app.schemas.token import Token
from app.repositories.user_repository import user_repository
from app.core.security import get_password_hash, verify_password, create_access_token


class AuthService:
    def register_user(self, db: Session, user_in: UserCreate) -> User:
        # Check if email is already registered
        existing_user = user_repository.get_by_email(db, user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists."
            )

        # Disallow self-registering as ADMINISTRATOR
        if user_in.role == UserRole.ADMINISTRATOR:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Registering as an administrator is not permitted."
            )

        role = user_in.role or UserRole.USER

        new_user = User(
            full_name=user_in.full_name.strip(),
            email=user_in.email.lower().strip(),
            password_hash=get_password_hash(user_in.password),
            role=role,
            is_active=True
        )
        return user_repository.create(db, new_user)

    def authenticate_user(self, db: Session, email: str, password: str) -> User:
        user = user_repository.get_by_email(db, email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={"WWW-Authenticate": "Bearer"}
            )
        if not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={"WWW-Authenticate": "Bearer"}
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user account."
            )
        return user

    def generate_user_token(self, user: User) -> Token:
        access_token = create_access_token(subject=str(user.id))
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )


auth_service = AuthService()
