from datetime import date
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.hydration import HydrationRecord
from app.schemas.hydration import (
    HydrationRecordCreate,
    HydrationRecordResponse,
    HydrationSummaryResponse,
)
from app.repositories.hydration_repository import hydration_repository


class HydrationService:
    def get_hydration_summary(self, db: Session, user_id: int, limit: int = 30) -> HydrationSummaryResponse:
        records = hydration_repository.get_user_records(db, user_id, limit=limit)
        today = date.today()
        today_total = hydration_repository.get_daily_total(db, user_id, today)
        record_responses = [HydrationRecordResponse.model_validate(r) for r in records]
        return HydrationSummaryResponse(
            records=record_responses,
            today_total_ml=today_total,
            today_date=today,
            total_records=len(records)
        )

    def create_hydration_record(
        self, db: Session, user_id: int, record_in: HydrationRecordCreate
    ) -> HydrationRecord:
        new_record = HydrationRecord(
            user_id=user_id,
            water_intake_ml=record_in.water_intake_ml,
            record_date=record_in.record_date
        )
        return hydration_repository.create(db, new_record)

    def update_hydration_record(
        self, db: Session, user_id: int, record_id: int, water_intake_ml: float, record_date: date
    ) -> HydrationRecord:
        record = hydration_repository.get_by_id_and_user(db, record_id, user_id)
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hydration record not found.")

        record.water_intake_ml = water_intake_ml
        record.record_date = record_date
        return hydration_repository.update(db, record)

    def delete_hydration_record(self, db: Session, user_id: int, record_id: int) -> None:
        record = hydration_repository.get_by_id_and_user(db, record_id, user_id)
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hydration record not found.")
        hydration_repository.delete(db, record)


hydration_service = HydrationService()
