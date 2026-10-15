from typing import Tuple, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user import UserUpdate, UserPasswordChange
from app.repositories.user_repository import user_repository
from app.core.security import verify_password, get_password_hash


class UserService:
    def get_user_by_id(self, db: Session, user_id: int) -> User:
        user = user_repository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        return user

    def update_user_profile(self, db: Session, current_user: User, user_in: UserUpdate) -> User:
        if user_in.email and user_in.email.lower().strip() != current_user.email:
            existing = user_repository.get_by_email(db, user_in.email)
            if existing and existing.id != current_user.id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already taken.")
            current_user.email = user_in.email.lower().strip()

        if user_in.full_name:
            current_user.full_name = user_in.full_name.strip()

        return user_repository.update(db, current_user)

    def change_user_password(self, db: Session, current_user: User, pwd_in: UserPasswordChange) -> User:
        if not verify_password(pwd_in.current_password, current_user.password_hash):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")

        current_user.password_hash = get_password_hash(pwd_in.new_password)
        return user_repository.update(db, current_user)

    def get_all_users(self, db: Session, skip: int = 0, limit: int = 100) -> Tuple[List[User], int]:
        return user_repository.get_users_list(db, skip=skip, limit=limit)


user_service = UserService()
