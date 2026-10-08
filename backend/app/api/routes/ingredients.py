import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.ingredient import (
    IngredientBrief,
    IngredientDetailOut,
    InteractionCheckRequest,
    InteractionCheckResponse,
    SuitabilityRequest,
    SuitabilityResult,
)
from app.services.ingredient_service import IngredientService

router = APIRouter()


@router.get(
    "",
    response_model=List[IngredientBrief],
    summary="List / search ingredients",
)
def list_ingredients(
    search: Optional[str] = Query(None, description="Search by name or alias"),
    category: Optional[str] = Query(None, description="Filter by category (e.g. NIACINAMIDE, RETINOIDS)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns all active ingredients, optionally filtered by name search or category.
    Uses the canonical ingredient knowledge base seeded at DB initialization.
    """
    # Seed interactions on first access if needed
    IngredientService.seed_interactions_if_empty(db)
    return IngredientService.list_ingredients(db, search=search, category=category, skip=skip, limit=limit)


@router.get(
    "/{ingredient_id}",
    response_model=IngredientDetailOut,
    summary="Get ingredient detail and education content",
)
def get_ingredient(
    ingredient_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Full ingredient detail including education content, suitability notes, and cautions."""
    ingredient = IngredientService.get_ingredient(db, ingredient_id)
    if not ingredient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found.")
    return ingredient


@router.post(
    "/suitability",
    response_model=SuitabilityResult,
    summary="Evaluate ingredient suitability for the current user",
)
def evaluate_suitability(
    body: SuitabilityRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Evaluates an ingredient against the user's skin profile, concerns, and declared allergies.
    Allergen conflicts are always UNSUITABLE — this cannot be overridden.
    """
    return IngredientService.evaluate_suitability(db, body.ingredient_id, current_user.id)


@router.post(
    "/interactions",
    response_model=InteractionCheckResponse,
    summary="Check interactions between a set of ingredient names",
)
def check_interactions(
    body: InteractionCheckRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Checks all known interaction rules between the provided ingredient names.
    Returns interaction type, severity, and recommendations.
    """
    return IngredientService.check_interactions(db, body.ingredient_names)
