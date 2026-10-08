from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db

from ..models import (
    User,
    SkinProfile,
    Lifestyle,
    Sleep,
    SkinAssessment,
)

from ..schemas import SkinAssessmentResponse

from ..dependencies import get_current_user

from ..services.skin_scoring import calculate_skin_health
from ..services.skin_concern_engine import analyze_skin_concerns

# ML MODEL
from ..ml_service import predict_skin_concern


router = APIRouter(
    prefix="/api/assessment",
    tags=["Skin Assessment"]
)


# =========================================================
# CREATE SKIN ASSESSMENT
# =========================================================

@router.post(
    "/{user_id}",
    response_model=SkinAssessmentResponse
)
def create_skin_assessment(
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
                detail="You can only assess your own skin"
            )

    elif current_user.role not in [
        "consultant",
        "dermatologist",
        "admin",
    ]:

        raise HTTPException(
            status_code=403,
            detail="Assessment access denied"
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
            detail="User not found"
        )


    # -----------------------------------------------------
    # GET SKIN PROFILE
    # -----------------------------------------------------

    skin_profile = db.query(SkinProfile).filter(
        SkinProfile.user_id == user_id
    ).first()

    if not skin_profile:
        raise HTTPException(
            status_code=404,
            detail=(
                "Skin profile not found. "
                "Please create a skin profile first."
            )
        )


    # -----------------------------------------------------
    # GET LATEST LIFESTYLE RECORD
    # -----------------------------------------------------

    lifestyle = db.query(Lifestyle).filter(
        Lifestyle.user_id == user_id
    ).order_by(
        Lifestyle.id.desc()
    ).first()


    # -----------------------------------------------------
    # GET LATEST SLEEP RECORD
    # -----------------------------------------------------

    sleep = db.query(Sleep).filter(
        Sleep.user_id == user_id
    ).order_by(
        Sleep.id.desc()
    ).first()


    # -----------------------------------------------------
    # EXTRACT LIFESTYLE DATA
    # -----------------------------------------------------

    exercise_minutes = (
        lifestyle.exercise_minutes
        if lifestyle
        else 0
    )

    stress_level = (
        lifestyle.stress_level
        if lifestyle
        else 5
    )

    water_intake = (
        lifestyle.water_intake
        if lifestyle
        else 0
    )


    # -----------------------------------------------------
    # EXTRACT SLEEP DATA
    # -----------------------------------------------------

    sleep_hours = (
        sleep.sleep_hours
        if sleep
        else 0
    )

    sleep_quality = (
        sleep.sleep_quality
        if sleep
        else 0
    )


    # =====================================================
    # ML SKIN CONCERN PREDICTION
    # =====================================================

    # The current User model may not contain age.
    # Therefore, use 25 as a fallback.

    age = getattr(user, "age", 25)


    # -----------------------------------------------------
    # DETERMINE HYDRATION CATEGORY
    # -----------------------------------------------------

    if water_intake >= 3:

        hydration = "High"

    elif water_intake >= 1.5:

        hydration = "Medium"

    else:

        hydration = "Low"


    # -----------------------------------------------------
    # RUN MACHINE LEARNING MODEL
    # -----------------------------------------------------

    ml_predicted_concern = None
    ml_confidence = None

    try:

        ml_result = predict_skin_concern(
            age=age,
            skin_type=skin_profile.skin_type,
            sensitivity=skin_profile.sensitivity,
            hydration=hydration,
            stress_level=stress_level,
            sleep_quality=sleep_quality,
            physical_activity=exercise_minutes,
            water_intake=water_intake,
        )

        # ml_service.py returns a dictionary
        ml_predicted_concern = ml_result["concern"]

        ml_confidence = ml_result["confidence"]

    except Exception as e:

        print(
            "ML prediction failed:",
            str(e)
        )


    # =====================================================
    # ROUTINE CONSISTENCY
    # =====================================================

    routine_completed_days = 0

    total_tracking_days = 0


    # =====================================================
    # RUN SKIN SCORING ENGINE
    # =====================================================

    scoring_result = calculate_skin_health(

        skin_type=skin_profile.skin_type,

        concerns=skin_profile.concerns,

        sensitivity=skin_profile.sensitivity,

        allergies=skin_profile.allergies,

        exercise_minutes=exercise_minutes,

        stress_level=stress_level,

        sleep_hours=sleep_hours,

        sleep_quality=sleep_quality,

        routine_completed_days=routine_completed_days,

        total_tracking_days=total_tracking_days,

        water_intake=water_intake,

    )


    # =====================================================
    # RUN EXISTING CONCERN ANALYSIS ENGINE
    # =====================================================

    concern_result = analyze_skin_concerns(

        concerns=skin_profile.concerns,

        sensitivity=skin_profile.sensitivity,

        allergies=skin_profile.allergies,

        exercise_minutes=exercise_minutes,

        stress_level=stress_level,

        sleep_hours=sleep_hours,

        sleep_quality=sleep_quality,

        water_intake=water_intake,

    )


    # =====================================================
    # FORMAT DETECTED CONCERNS
    # =====================================================

    detected_concerns = concern_result[
        "detected_concerns"
    ]


    if detected_concerns:

        concerns_text = ", ".join(

            item["concern"]

            for item in detected_concerns

        )

    else:

        concerns_text = (
            "No major concerns identified"
        )


    # =====================================================
    # PRIMARY CONCERN
    # =====================================================

    primary_concern = concern_result[
        "primary_concern"
    ]


    # =====================================================
    # SECONDARY CONCERNS
    # =====================================================

    secondary_concerns_list = concern_result[
        "secondary_concerns"
    ]


    secondary_concerns = (

        ", ".join(
            secondary_concerns_list
        )

        if secondary_concerns_list

        else ""

    )


    # =====================================================
    # RISK FACTORS
    # =====================================================

    risk_factors_list = concern_result[
        "risk_factors"
    ]


    risk_factors = (

        ", ".join(
            risk_factors_list
        )

        if risk_factors_list

        else
        "No significant risk factors identified"

    )


    # =====================================================
    # COMBINE ML PREDICTION WITH ASSESSMENT
    # =====================================================

    if ml_predicted_concern:

        # If the existing concern engine did not
        # identify a primary concern, use ML prediction.

        if not primary_concern:

            primary_concern = ml_predicted_concern


        # Add ML prediction to detected concerns
        # if it isn't already present.

        if (
            ml_predicted_concern.lower()
            not in concerns_text.lower()
        ):

            if (
                concerns_text
                == "No major concerns identified"
            ):

                concerns_text = (
                    ml_predicted_concern
                )

            else:

                concerns_text = (
                    concerns_text
                    + ", "
                    + ml_predicted_concern
                )


    # =====================================================
    # ML CONFIDENCE TEXT
    # =====================================================

    if (
        ml_predicted_concern
        and ml_confidence is not None
    ):

        ml_text = (
            f"ML predicted concern: "
            f"{ml_predicted_concern}. "
            f"ML confidence: "
            f"{round(ml_confidence * 100, 2)}%."
        )

    else:

        ml_text = (
            "ML prediction was unavailable."
        )


    # =====================================================
    # CREATE ASSESSMENT SUMMARY
    # =====================================================

    assessment_summary = (

        f"Overall skin health score is "
        f"{scoring_result['skin_score']}/100. "

        f"Health status: "
        f"{scoring_result['health_status']}. "

        f"Primary concern: "
        f"{primary_concern or 'None identified'}. "

        f"{ml_text} "

        f"Risk factors were analyzed using the "
        f"user's skin profile, lifestyle and "
        f"sleep information."

    )


    # =====================================================
    # SAVE ASSESSMENT
    # =====================================================

    assessment = SkinAssessment(

        user_id=user_id,

        skin_condition_score=(
            scoring_result[
                "skin_condition_score"
            ]
        ),

        lifestyle_score=(
            scoring_result[
                "lifestyle_score"
            ]
        ),

        sleep_score=(
            scoring_result[
                "sleep_score"
            ]
        ),

        routine_consistency_score=(
            scoring_result[
                "routine_consistency_score"
            ]
        ),

        hydration_score=(
            scoring_result[
                "hydration_score"
            ]
        ),

        skin_score=(
            scoring_result[
                "skin_score"
            ]
        ),

        health_status=(
            scoring_result[
                "health_status"
            ]
        ),

        concerns=concerns_text,

        primary_concern=primary_concern,

        secondary_concerns=secondary_concerns,

        risk_factors=risk_factors,

        assessment_summary=assessment_summary,

        created_at=datetime.utcnow().isoformat(),

    )


    # =====================================================
    # SAVE TO DATABASE
    # =====================================================

    db.add(assessment)

    db.commit()

    db.refresh(assessment)


    # =====================================================
    # RETURN RESULT
    # =====================================================

    return assessment


# =========================================================
# GET LATEST ASSESSMENT
# =========================================================

@router.get(
    "/{user_id}",
    response_model=SkinAssessmentResponse
)
def get_skin_assessment(

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
                    "your own assessment"
                )

            )

    elif current_user.role not in [

        "consultant",
        "dermatologist",
        "admin",

    ]:

        raise HTTPException(

            status_code=403,

            detail="Assessment access denied"

        )


    # -----------------------------------------------------
    # GET LATEST ASSESSMENT
    # -----------------------------------------------------

    assessment = db.query(
        SkinAssessment
    ).filter(

        SkinAssessment.user_id == user_id

    ).order_by(

        SkinAssessment.id.desc()

    ).first()


    # -----------------------------------------------------
    # CHECK ASSESSMENT
    # -----------------------------------------------------

    if not assessment:

        raise HTTPException(

            status_code=404,

            detail="No skin assessment found"

        )


    # -----------------------------------------------------
    # RETURN ASSESSMENT
    # -----------------------------------------------------

    return assessment