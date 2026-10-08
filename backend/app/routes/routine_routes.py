from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import (
    User,
    SkinProfile,
    SkinAssessment,
    SkincareRoutine,
)
from ..schemas import SkincareRoutineResponse
from ..services.routine_generator import generate_personalized_routine


router = APIRouter(
    prefix="/api/routines",
    tags=["Personalized Skincare Routine"],
)


# =========================================================
# CREATE PERSONALIZED ROUTINE
# =========================================================

@router.post(
    "/{user_id}",
    response_model=SkincareRoutineResponse
)
def create_personalized_routine(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # -----------------------------------------------------
    # SECURITY
    # -----------------------------------------------------

    if current_user.role == "user":

        if current_user.id != user_id:
            raise HTTPException(
                status_code=403,
                detail=(
                    "You can only generate "
                    "your own skincare routine"
                ),
            )

    elif current_user.role not in [
        "consultant",
        "dermatologist",
        "admin",
    ]:

        raise HTTPException(
            status_code=403,
            detail="Routine access denied",
        )


    # -----------------------------------------------------
    # CHECK USER
    # -----------------------------------------------------

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )


    # -----------------------------------------------------
    # GET SKIN PROFILE
    # -----------------------------------------------------

    skin_profile = (
        db.query(SkinProfile)
        .filter(
            SkinProfile.user_id == user_id
        )
        .first()
    )

    if not skin_profile:
        raise HTTPException(
            status_code=404,
            detail=(
                "Skin profile not found. "
                "Please create a skin profile first."
            ),
        )


    # -----------------------------------------------------
    # GET LATEST SKIN ASSESSMENT
    # -----------------------------------------------------

    assessment = (
        db.query(SkinAssessment)
        .filter(
            SkinAssessment.user_id == user_id
        )
        .order_by(
            SkinAssessment.id.desc()
        )
        .first()
    )

    if not assessment:
        raise HTTPException(
            status_code=404,
            detail=(
                "Skin assessment not found. "
                "Please complete a skin assessment first."
            ),
        )


    # =====================================================
    # GET PRIMARY CONCERN
    # =====================================================

    primary_concern = assessment.primary_concern


    # -----------------------------------------------------
    # FALLBACK
    # -----------------------------------------------------

    if not primary_concern:

        primary_concern = "Normal/None"


    # =====================================================
    # SEASON
    # =====================================================

    # Currently using Summer as the project default.
    # This can later be made dynamic using location/date.

    season = "Summer"


    # =====================================================
    # GENERATE PERSONALIZED ROUTINE
    # =====================================================

    routine = generate_personalized_routine(

        skin_type=skin_profile.skin_type,

        primary_concern=primary_concern,

        season=season,

        risk_factors=assessment.risk_factors,

    )


    # =====================================================
    # CONVERT MORNING ROUTINE TO TEXT
    # =====================================================

    morning_routine = "\n".join(

        f"{index + 1}. {step}"

        for index, step
        in enumerate(
            routine["morning_routine"]
        )

    )


    # =====================================================
    # CONVERT EVENING ROUTINE TO TEXT
    # =====================================================

    evening_routine = "\n".join(

        f"{index + 1}. {step}"

        for index, step
        in enumerate(
            routine["evening_routine"]
        )

    )


    # =====================================================
    # SAVE PERSONALIZED ROUTINE
    # =====================================================

    new_routine = SkincareRoutine(

        user_id=user_id,

        skin_type=skin_profile.skin_type,

        primary_concern=primary_concern,

        season=season,

        morning_routine=morning_routine,

        evening_routine=evening_routine,

        weekly_treatment=(
            routine["weekly_treatment"]
        ),

        seasonal_recommendations=(
            routine[
                "seasonal_recommendations"
            ]
        ),

        adaptive_updates=(
            routine["adaptive_updates"]
        ),

        created_at=datetime.utcnow().isoformat(),

    )


    # =====================================================
    # SAVE TO DATABASE
    # =====================================================

    db.add(new_routine)

    db.commit()

    db.refresh(new_routine)


    # =====================================================
    # RETURN ROUTINE
    # =====================================================

    return new_routine


# =========================================================
# GET LATEST PERSONALIZED ROUTINE
# =========================================================

@router.get(
    "/{user_id}",
    response_model=SkincareRoutineResponse
)
def get_personalized_routine(

    user_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),

):

    # -----------------------------------------------------
    # SECURITY
    # -----------------------------------------------------

    if current_user.role == "user":

        if current_user.id != user_id:

            raise HTTPException(

                status_code=403,

                detail=(
                    "You can only view "
                    "your own skincare routine"
                ),

            )

    elif current_user.role not in [

        "consultant",
        "dermatologist",
        "admin",

    ]:

        raise HTTPException(

            status_code=403,

            detail="Routine access denied",

        )


    # -----------------------------------------------------
    # GET LATEST ROUTINE
    # -----------------------------------------------------

    routine = (

        db.query(
            SkincareRoutine
        )

        .filter(
            SkincareRoutine.user_id == user_id
        )

        .order_by(
            SkincareRoutine.id.desc()
        )

        .first()

    )


    # -----------------------------------------------------
    # CHECK ROUTINE
    # -----------------------------------------------------

    if not routine:

        raise HTTPException(

            status_code=404,

            detail="No skincare routine found",

        )


    # -----------------------------------------------------
    # RETURN ROUTINE
    # -----------------------------------------------------

    return routine