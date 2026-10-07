from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.skin_profile import SkinProfile
from schemas import SkinProfileCreate, SkinProfileOut
from utils.auth import get_current_user

router = APIRouter(prefix="/api/profile", tags=["Skin Profile"])


@router.get("", response_model=SkinProfileOut)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skin profile not created yet"
        )
    return profile


@router.post("", response_model=SkinProfileOut)
def create_or_update_profile(
    profile_in: SkinProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    
    if profile:
        # Update existing record
        profile.skin_type = profile_in.skin_type
        profile.age_group = profile_in.age_group
        profile.skin_concerns = profile_in.skin_concerns
        profile.allergies = profile_in.allergies
        profile.sensitivities = profile_in.sensitivities
    else:
        # Create new record
        profile = SkinProfile(
            user_id=current_user.id,
            skin_type=profile_in.skin_type,
            age_group=profile_in.age_group,
            skin_concerns=profile_in.skin_concerns,
            allergies=profile_in.allergies,
            sensitivities=profile_in.sensitivities
        )
        db.add(profile)
        
    db.commit()
    db.refresh(profile)
    return profile
