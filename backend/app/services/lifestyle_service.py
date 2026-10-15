from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.lifestyle import LifestyleProfile
from app.schemas.lifestyle import LifestyleCreate, LifestyleUpdate
from app.repositories.lifestyle_repository import lifestyle_repository


class LifestyleService:
    def get_profile(self, db: Session, user_id: int) -> Optional[LifestyleProfile]:
        return lifestyle_repository.get_by_user_id(db, user_id)

    def create_or_update_profile(
        self, db: Session, user_id: int, lifestyle_in: LifestyleCreate
    ) -> LifestyleProfile:
        existing = lifestyle_repository.get_by_user_id(db, user_id)
        if existing:
            existing.physical_activity = lifestyle_in.physical_activity
            existing.smoking = lifestyle_in.smoking
            existing.alcohol_consumption = lifestyle_in.alcohol_consumption
            existing.screen_time_hours = lifestyle_in.screen_time_hours
            existing.outdoor_exposure = lifestyle_in.outdoor_exposure
            existing.pollution_exposure = lifestyle_in.pollution_exposure
            existing.sun_exposure = lifestyle_in.sun_exposure
            existing.environment_type = lifestyle_in.environment_type
            return lifestyle_repository.update(db, existing)
        else:
            new_lifestyle = LifestyleProfile(
                user_id=user_id,
                physical_activity=lifestyle_in.physical_activity,
                smoking=lifestyle_in.smoking,
                alcohol_consumption=lifestyle_in.alcohol_consumption,
                screen_time_hours=lifestyle_in.screen_time_hours,
                outdoor_exposure=lifestyle_in.outdoor_exposure,
                pollution_exposure=lifestyle_in.pollution_exposure,
                sun_exposure=lifestyle_in.sun_exposure,
                environment_type=lifestyle_in.environment_type,
            )
            return lifestyle_repository.create(db, new_lifestyle)

    def patch_profile(
        self, db: Session, user_id: int, lifestyle_in: LifestyleUpdate
    ) -> LifestyleProfile:
        existing = lifestyle_repository.get_by_user_id(db, user_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lifestyle profile not found. Please create one first."
            )
        if lifestyle_in.physical_activity is not None:
            existing.physical_activity = lifestyle_in.physical_activity
        if lifestyle_in.smoking is not None:
            existing.smoking = lifestyle_in.smoking
        if lifestyle_in.alcohol_consumption is not None:
            existing.alcohol_consumption = lifestyle_in.alcohol_consumption
        if lifestyle_in.screen_time_hours is not None:
            existing.screen_time_hours = lifestyle_in.screen_time_hours
        if lifestyle_in.outdoor_exposure is not None:
            existing.outdoor_exposure = lifestyle_in.outdoor_exposure
        if lifestyle_in.pollution_exposure is not None:
            existing.pollution_exposure = lifestyle_in.pollution_exposure
        if lifestyle_in.sun_exposure is not None:
            existing.sun_exposure = lifestyle_in.sun_exposure
        if lifestyle_in.environment_type is not None:
            existing.environment_type = lifestyle_in.environment_type

        return lifestyle_repository.update(db, existing)


lifestyle_service = LifestyleService()
