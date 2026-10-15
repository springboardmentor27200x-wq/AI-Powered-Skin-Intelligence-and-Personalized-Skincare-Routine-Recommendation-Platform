from typing import Optional
from sqlalchemy.orm import Session
from app.models.lifestyle import LifestyleProfile
from app.repositories.base import BaseRepository


class LifestyleRepository(BaseRepository[LifestyleProfile]):
    def __init__(self):
        super().__init__(LifestyleProfile)

    def get_by_user_id(self, db: Session, user_id: int) -> Optional[LifestyleProfile]:
        return db.query(LifestyleProfile).filter(LifestyleProfile.user_id == user_id).first()


lifestyle_repository = LifestyleRepository()
