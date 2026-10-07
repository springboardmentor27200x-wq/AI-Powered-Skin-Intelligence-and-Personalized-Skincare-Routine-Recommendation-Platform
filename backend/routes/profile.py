import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, SkinProfile
from schemas import ProfileRequest, ProfileResponse
from auth import get_current_user

router = APIRouter()

def serialize(profile):
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "skin_type": profile.skin_type,
        "age_group": profile.age_group,
        "skin_concerns": json.loads(profile.skin_concerns or "[]"),
        "allergies": profile.allergies,
        "sensitivities": profile.sensitivities,
        "lifestyle_habits": profile.lifestyle_habits,
        "sleep_quality": profile.sleep_quality,
        "water_intake": profile.water_intake,
        "sun_exposure": profile.sun_exposure,
        "pollution_exposure": profile.pollution_exposure,
    }

@router.post("", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
def create_profile(data: ProfileRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if db.query(SkinProfile).filter(SkinProfile.user_id == user.id).first():
        raise HTTPException(status_code=409, detail="Skin profile already exists")
    profile = SkinProfile(
        user_id=user.id,
        skin_type=data.skin_type,
        age_group=data.age_group,
        skin_concerns=json.dumps(data.skin_concerns),
        allergies=data.allergies,
        sensitivities=data.sensitivities,
        lifestyle_habits=data.lifestyle_habits,
        sleep_quality=data.sleep_quality,
        water_intake=data.water_intake,
        sun_exposure=data.sun_exposure,
        pollution_exposure=data.pollution_exposure,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return serialize(profile)

@router.get("", response_model=ProfileResponse)
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Skin profile not found")
    return serialize(profile)

@router.put("", response_model=ProfileResponse)
def update_profile(data: ProfileRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Skin profile not found")
    profile.skin_type = data.skin_type
    profile.age_group = data.age_group
    profile.skin_concerns = json.dumps(data.skin_concerns)
    profile.allergies = data.allergies
    profile.sensitivities = data.sensitivities
    profile.lifestyle_habits = data.lifestyle_habits
    profile.sleep_quality = data.sleep_quality
    profile.water_intake = data.water_intake
    profile.sun_exposure = data.sun_exposure
    profile.pollution_exposure = data.pollution_exposure
    db.commit()
    db.refresh(profile)
    return serialize(profile)
