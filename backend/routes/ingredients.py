import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, Ingredient, SkinProfile
from schemas import IngredientResponse, FormulaAnalysisRequest, FormulaAnalysisResponse
from auth import get_current_user
from services.ingredient_engine import seed_ingredients_db, analyze_formula

router = APIRouter()


def serialize_ingredient(ing: Ingredient) -> dict:
    return {
        "id": ing.id,
        "name": ing.name,
        "category": ing.category,
        "description": ing.description,
        "key_benefits": json.loads(ing.key_benefits or "[]"),
        "suitable_skin_types": json.loads(ing.suitable_skin_types or "[]"),
        "conflicting_ingredients": json.loads(ing.conflicting_ingredients or "[]"),
        "synergistic_ingredients": json.loads(ing.synergistic_ingredients or "[]"),
        "allergen_warning": ing.allergen_warning or "",
    }


@router.get("", response_model=List[IngredientResponse])
def get_ingredients_catalog(db: Session = Depends(get_db)):
    seed_ingredients_db(db)
    items = db.query(Ingredient).all()
    return [serialize_ingredient(i) for i in items]


@router.post("/analyze", response_model=FormulaAnalysisResponse)
def analyze_custom_formula(
    data: FormulaAnalysisRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == user.id).first()
    result = analyze_formula(db, data.ingredients_text, profile)
    return result
