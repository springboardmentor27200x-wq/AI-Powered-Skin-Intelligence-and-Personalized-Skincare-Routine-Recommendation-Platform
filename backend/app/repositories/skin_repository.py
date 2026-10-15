from typing import Optional
from sqlalchemy.orm import Session
from app.models.skin_profile import SkinProfile
from app.repositories.base import BaseRepository


class SkinRepository(BaseRepository[SkinProfile]):
    def __init__(self):
        super().__init__(SkinProfile)

    def get_by_user_id(self, db: Session, user_id: int) -> Optional[SkinProfile]:
        return db.query(SkinProfile).filter(SkinProfile.user_id == user_id).first()


skin_repository = SkinRepository()
