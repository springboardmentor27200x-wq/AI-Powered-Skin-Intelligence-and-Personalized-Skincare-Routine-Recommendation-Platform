from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.skin_profile import SkinProfile
from app.schemas.skin_profile import SkinProfileCreate, SkinProfileUpdate
from app.repositories.skin_repository import skin_repository


class SkinService:
    def get_profile(self, db: Session, user_id: int) -> Optional[SkinProfile]:
        return skin_repository.get_by_user_id(db, user_id)

    def create_or_update_profile(
        self, db: Session, user_id: int, profile_in: SkinProfileCreate
    ) -> SkinProfile:
        existing = skin_repository.get_by_user_id(db, user_id)
        if existing:
            existing.skin_type = profile_in.skin_type
            existing.age_group = profile_in.age_group
            existing.skin_concerns = profile_in.skin_concerns
            existing.allergies = profile_in.allergies
            existing.sensitivities = profile_in.sensitivities
            return skin_repository.update(db, existing)
        else:
            new_profile = SkinProfile(
                user_id=user_id,
                skin_type=profile_in.skin_type,
                age_group=profile_in.age_group,
                skin_concerns=profile_in.skin_concerns,
                allergies=profile_in.allergies,
                sensitivities=profile_in.sensitivities
            )
            return skin_repository.create(db, new_profile)

    def patch_profile(
        self, db: Session, user_id: int, profile_in: SkinProfileUpdate
    ) -> SkinProfile:
        existing = skin_repository.get_by_user_id(db, user_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Skin profile not found. Please create one first."
            )
        if profile_in.skin_type is not None:
            existing.skin_type = profile_in.skin_type
        if profile_in.age_group is not None:
            existing.age_group = profile_in.age_group
        if profile_in.skin_concerns is not None:
            existing.skin_concerns = profile_in.skin_concerns
        if profile_in.allergies is not None:
            existing.allergies = profile_in.allergies
        if profile_in.sensitivities is not None:
            existing.sensitivities = profile_in.sensitivities

        return skin_repository.update(db, existing)


skin_service = SkinService()
