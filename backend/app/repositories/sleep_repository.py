from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.sleep import SleepRecord
from app.repositories.base import BaseRepository


class SleepRepository(BaseRepository[SleepRecord]):
    def __init__(self):
        super().__init__(SleepRecord)

    def get_by_id_and_user(self, db: Session, record_id: int, user_id: int) -> Optional[SleepRecord]:
        return db.query(SleepRecord).filter(SleepRecord.id == record_id, SleepRecord.user_id == user_id).first()

    def get_user_records(self, db: Session, user_id: int, limit: int = 30) -> List[SleepRecord]:
        return (
            db.query(SleepRecord)
            .filter(SleepRecord.user_id == user_id)
            .order_by(SleepRecord.record_date.desc(), SleepRecord.id.desc())
            .limit(limit)
            .all()
        )

    def get_most_recent(self, db: Session, user_id: int) -> Optional[SleepRecord]:
        return (
            db.query(SleepRecord)
            .filter(SleepRecord.user_id == user_id)
            .order_by(SleepRecord.record_date.desc(), SleepRecord.id.desc())
            .first()
        )

    def get_average_duration(self, db: Session, user_id: int) -> Optional[float]:
        avg = (
            db.query(func.avg(SleepRecord.sleep_duration_hours))
            .filter(SleepRecord.user_id == user_id)
            .scalar()
        )
        return round(float(avg), 1) if avg is not None else None


sleep_repository = SleepRepository()
