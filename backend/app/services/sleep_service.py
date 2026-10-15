from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.sleep import SleepRecord
from app.schemas.sleep import SleepRecordCreate, SleepRecordUpdate, SleepHistoryResponse, SleepRecordResponse
from app.repositories.sleep_repository import sleep_repository


class SleepService:
    def get_user_sleep_history(self, db: Session, user_id: int, limit: int = 30) -> SleepHistoryResponse:
        records = sleep_repository.get_user_records(db, user_id, limit=limit)
        avg_hours = sleep_repository.get_average_duration(db, user_id) or 0.0
        record_responses = [SleepRecordResponse.model_validate(r) for r in records]
        return SleepHistoryResponse(
            records=record_responses,
            average_duration=avg_hours,
            total_records=len(records)
        )

    def create_sleep_record(self, db: Session, user_id: int, record_in: SleepRecordCreate) -> SleepRecord:
        new_record = SleepRecord(
            user_id=user_id,
            sleep_duration_hours=record_in.sleep_duration_hours,
            sleep_quality=record_in.sleep_quality,
            bedtime=record_in.bedtime,
            wake_time=record_in.wake_time,
            sleep_consistency=record_in.sleep_consistency,
            record_date=record_in.record_date
        )
        return sleep_repository.create(db, new_record)

    def update_sleep_record(
        self, db: Session, user_id: int, record_id: int, record_in: SleepRecordUpdate
    ) -> SleepRecord:
        record = sleep_repository.get_by_id_and_user(db, record_id, user_id)
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sleep record not found.")

        if record_in.sleep_duration_hours is not None:
            record.sleep_duration_hours = record_in.sleep_duration_hours
        if record_in.sleep_quality is not None:
            record.sleep_quality = record_in.sleep_quality
        if record_in.bedtime is not None:
            record.bedtime = record_in.bedtime
        if record_in.wake_time is not None:
            record.wake_time = record_in.wake_time
        if record_in.sleep_consistency is not None:
            record.sleep_consistency = record_in.sleep_consistency
        if record_in.record_date is not None:
            record.record_date = record_in.record_date

        return sleep_repository.update(db, record)

    def delete_sleep_record(self, db: Session, user_id: int, record_id: int) -> None:
        record = sleep_repository.get_by_id_and_user(db, record_id, user_id)
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sleep record not found.")
        sleep_repository.delete(db, record)


sleep_service = SleepService()
