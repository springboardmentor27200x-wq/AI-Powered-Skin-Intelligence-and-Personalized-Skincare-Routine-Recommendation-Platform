from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import User, SkinProfile, SkinAssessment

from ..services.ingredient_engine import (
    analyze_ingredients,
    get_ingredient_education,
    analyze_ingredient_interactions,
)


router = APIRouter(
    prefix="/api/ingredients",
    tags=["Ingredient Intelligence"]
)


# =========================================================
# 1. GET PERSONALIZED INGREDIENT RECOMMENDATIONS
# =========================================================

@router.get("/{user_id}")
def get_ingredient_recommendations(
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
                detail="You can only view your own ingredient recommendations"
            )

    elif current_user.role not in [
        "consultant",
        "dermatologist",
        "admin",
    ]:

        raise HTTPException(
            status_code=403,
            detail="Ingredient recommendation access denied"
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
    # GET LATEST SKIN ASSESSMENT
    # -----------------------------------------------------

    assessment = db.query(SkinAssessment).filter(
        SkinAssessment.user_id == user_id
    ).order_by(
        SkinAssessment.id.desc()
    ).first()

    if not assessment:
        raise HTTPException(
            status_code=404,
            detail=(
                "Skin assessment not found. "
                "Please complete a skin assessment first."
            )
        )


    # -----------------------------------------------------
    # RUN INGREDIENT INTELLIGENCE
    # -----------------------------------------------------

    result = analyze_ingredients(

        primary_concern=assessment.primary_concern,

        skin_type=skin_profile.skin_type,

        sensitivity=skin_profile.sensitivity,

        allergies=skin_profile.allergies,

    )


    # -----------------------------------------------------
    # RETURN RESULT
    # -----------------------------------------------------

    return result


# =========================================================
# 2. INGREDIENT EDUCATION
# =========================================================

@router.get("/education/{ingredient}")
def ingredient_education(
    ingredient: str,
    current_user: User = Depends(get_current_user),
):

    result = get_ingredient_education(ingredient)

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Ingredient not found"
        )

    return result


# =========================================================
# 3. INGREDIENT INTERACTION ANALYSIS
# =========================================================

@router.post("/interactions")
def ingredient_interactions(
    ingredients: list[str],
    current_user: User = Depends(get_current_user),
):

    if not ingredients:
        raise HTTPException(
            status_code=400,
            detail="Please provide at least one ingredient"
        )

    return {
        "ingredients": ingredients,
        "interactions": analyze_ingredient_interactions(
            ingredients
        )
    }