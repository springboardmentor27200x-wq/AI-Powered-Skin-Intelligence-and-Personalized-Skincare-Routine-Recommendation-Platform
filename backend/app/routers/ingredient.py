from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.skin_profile import SkinProfile
from app.models.ingredient import Ingredient, IngredientConflict
from app.schemas.ingredient import IngredientOut, IngredientDetailOut, ConflictOut, IngredientSuitabilityOut
from app.services.ingredient_engine import assess_ingredient_suitability

router = APIRouter(prefix="/ingredients", tags=["ingredients"])


@router.get("", response_model=list[IngredientOut])
def list_ingredients(db: Session = Depends(get_db)):
    return db.query(Ingredient).order_by(Ingredient.category).all()


@router.get("/{ingredient_id}", response_model=IngredientDetailOut)
def get_ingredient(ingredient_id: str, db: Session = Depends(get_db)):
    ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found")

    conflict_rows = (
        db.query(Ingredient.name, IngredientConflict.reason)
        .join(IngredientConflict, IngredientConflict.conflicts_with_id == Ingredient.id)
        .filter(IngredientConflict.ingredient_id == ingredient_id)
        .all()
    )
    conflicts = [ConflictOut(name=name, reason=reason) for name, reason in conflict_rows]

    return IngredientDetailOut(
        id=ingredient.id, name=ingredient.name, category=ingredient.category,
        description=ingredient.description, benefits=ingredient.benefits,
        caution_notes=ingredient.caution_notes, conflicts=conflicts,
    )


@router.get("/me/suitability", response_model=list[IngredientSuitabilityOut])
def get_my_suitability(
    status_filter: str | None = Query(default=None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Create a skin profile first")

    ingredients = db.query(Ingredient).order_by(Ingredient.category).all()
    results = []
    for ing in ingredients:
        result_status, reasons = assess_ingredient_suitability(
            ing, profile.allergies or [], profile.sensitivities or [], profile.skin_type
        )
        if status_filter and result_status != status_filter:
            continue
        results.append(IngredientSuitabilityOut(
            ingredient_id=ing.id, name=ing.name, category=ing.category,
            status=result_status, reasons=reasons,
        ))

    order = {"avoid": 0, "caution": 1, "suitable": 2}
    results.sort(key=lambda r: order.get(r.status, 3))
    return results