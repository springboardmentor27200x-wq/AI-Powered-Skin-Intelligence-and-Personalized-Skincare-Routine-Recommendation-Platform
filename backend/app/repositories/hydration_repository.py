from typing import Optional, List
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.hydration import HydrationRecord
from app.repositories.base import BaseRepository


class HydrationRepository(BaseRepository[HydrationRecord]):
    def __init__(self):
        super().__init__(HydrationRecord)

    def get_by_id_and_user(self, db: Session, record_id: int, user_id: int) -> Optional[HydrationRecord]:
        return db.query(HydrationRecord).filter(HydrationRecord.id == record_id, HydrationRecord.user_id == user_id).first()

    def get_user_records(self, db: Session, user_id: int, limit: int = 30) -> List[HydrationRecord]:
        return (
            db.query(HydrationRecord)
            .filter(HydrationRecord.user_id == user_id)
            .order_by(HydrationRecord.record_date.desc(), HydrationRecord.id.desc())
            .limit(limit)
            .all()
        )

    def get_user_records_for_date(self, db: Session, user_id: int, target_date: date) -> List[HydrationRecord]:
        return (
            db.query(HydrationRecord)
            .filter(HydrationRecord.user_id == user_id, HydrationRecord.record_date == target_date)
            .all()
        )

    def get_daily_total(self, db: Session, user_id: int, target_date: date) -> float:
        total = (
            db.query(func.sum(HydrationRecord.water_intake_ml))
            .filter(HydrationRecord.user_id == user_id, HydrationRecord.record_date == target_date)
            .scalar()
        )
        return float(total) if total is not None else 0.0


hydration_repository = HydrationRepository()
