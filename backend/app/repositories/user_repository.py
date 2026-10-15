from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email.lower().strip()).first()

    def get_by_id(self, db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    def get_users_list(self, db: Session, skip: int = 0, limit: int = 100) -> Tuple[List[User], int]:
        total = db.query(User).count()
        users = db.query(User).order_by(User.id.asc()).offset(skip).limit(limit).all()
        return users, total


user_repository = UserRepository()
