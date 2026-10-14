
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
    # Check permission
    if (
        current_user.id != profile.user_id
        and current_user.role not in [
            "admin",
            "consultant",
            "dermatologist"
        ]
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only manage your own skin profile"
        )

    # Check whether the user exists
    user = db.query(User).filter(
        User.id == profile.user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Prevent duplicate profiles
    existing_profile = db.query(SkinProfile).filter(
        SkinProfile.user_id == profile.user_id
    ).first()

    if existing_profile:
        raise HTTPException(
            status_code=400,
            detail="Skin profile already exists. Use PUT to update it."
        )

    # Create a new profile
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
# UPDATE EXISTING SKIN PROFILE
# =========================================================

@router.put("/{user_id}", response_model=SkinProfileResponse)
def update_skin_profile(
    user_id: int,
    profile: SkinProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check permission
    if (
        current_user.id != user_id
        and current_user.role not in [
            "admin",
            "consultant",
            "dermatologist"
        ]
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only manage your own skin profile"
        )

    # Ensure the URL and request body refer to the same user
    if profile.user_id != user_id:
        raise HTTPException(
            status_code=400,
            detail="User ID in request does not match the profile URL"
        )

    # Find the existing profile
    existing_profile = db.query(SkinProfile).filter(
        SkinProfile.user_id == user_id
    ).first()

    if not existing_profile:
        raise HTTPException(
            status_code=404,
            detail="Skin profile not found. Create a profile first."
        )

    # Update the existing profile
    existing_profile.skin_type = profile.skin_type
    existing_profile.concerns = profile.concerns
    existing_profile.sensitivity = profile.sensitivity
    existing_profile.allergies = profile.allergies
    existing_profile.budget_inr = profile.budget_inr

    db.commit()
    db.refresh(existing_profile)

    return existing_profile


# =========================================================
# GET ALL PATIENTS
# Consultant and Dermatologist
# =========================================================

@router.get("/patients")
def get_all_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only consultants and dermatologists can access patient lists
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
    # Check permission
    if (
        current_user.id != user_id
        and current_user.role not in [
            "admin",
            "consultant",
            "dermatologist"
        ]
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only view your own skin profile"
        )

    # Fetch the existing profile
    profile = db.query(SkinProfile).filter(
        SkinProfile.user_id == user_id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Skin profile not found"
        )

    return profile
