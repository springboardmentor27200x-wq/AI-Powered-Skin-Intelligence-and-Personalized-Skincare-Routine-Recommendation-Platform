from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SkinProfile, User
from ..schemas import SkinProfileCreate, SkinProfileResponse
from ..dependencies import get_current_user


router = APIRouter(
    prefix="/api/profile",
    tags=["Skin Profile"]
)


# =========================================================
# CREATE SKIN PROFILE
# =========================================================

@router.post("/", response_model=SkinProfileResponse)
def create_skin_profile(
    profile: SkinProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != profile.user_id and current_user.role not in ["admin", "consultant", "dermatologist"]:
        raise HTTPException(status_code=403, detail="You can only manage your own skin profile")
    # Make sure the requested user exists
    user = db.query(User).filter(
        User.id == profile.user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Prevent duplicate skin profiles
    existing_profile = db.query(SkinProfile).filter(
        SkinProfile.user_id == profile.user_id
    ).first()

    if existing_profile:
        raise HTTPException(
            status_code=400,
            detail="Skin profile already exists"
        )

    new_profile = SkinProfile(
        user_id=profile.user_id,
        skin_type=profile.skin_type,
        concerns=profile.concerns,
        sensitivity=profile.sensitivity,
        allergies=profile.allergies,
        budget_inr=profile.budget_inr
    )

    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    return new_profile


# =========================================================
# GET ALL PATIENTS
# Dermatologist only
# =========================================================

@router.get("/patients")
def get_all_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only dermatologists can access patient records
    if current_user.role not in ["dermatologist", "consultant"]:
       raise HTTPException(
        status_code=403,
        detail="Dermatologist or Consultant access required"
    )

    patients = db.query(User).filter(
        User.role == "user"
    ).all()

    return [
        {
            "id": patient.id,
            "name": patient.name,
            "email": patient.email,
        }
        for patient in patients
    ]


# =========================================================
# GET SKIN PROFILE BY USER ID
# =========================================================

@router.get("/{user_id}", response_model=SkinProfileResponse)
def get_skin_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != user_id and current_user.role not in ["admin", "consultant", "dermatologist"]:
        raise HTTPException(status_code=403, detail="You can only view your own skin profile")
    profile = db.query(SkinProfile).filter(
        SkinProfile.user_id == user_id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Skin profile not found"
        )

    return profile
