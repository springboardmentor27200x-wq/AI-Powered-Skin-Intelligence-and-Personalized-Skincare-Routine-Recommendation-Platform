import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.product import (
    ProductCompareRequest,
    ProductComparisonResponse,
    ProductDetailOut,
    ProductRecommendationOut,
    RecommendationRequest,
)
from app.services.product_service import ProductService

router = APIRouter()


@router.get(
    "",
    response_model=List[ProductDetailOut],
    summary="Browse product catalog (paginated, filterable)",
)
def list_products(
    category: Optional[str] = Query(None, description="FACE_WASH | MOISTURIZER | SUNSCREEN | SERUM | TONER | TREATMENT | FACE_MASK"),
    budget_band: Optional[str] = Query(None, description="BUDGET | MODERATE | PREMIUM"),
    skip: int = Query(0, ge=0),
    limit: int = Query(30, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns the product catalog. All products come from the backend database.
    Supports filtering by category and budget tier.
    """
    return ProductService.list_products(db, category=category, budget_band=budget_band, skip=skip, limit=limit)


@router.get(
    "/recommendations",
    response_model=List[ProductRecommendationOut],
    summary="Get personalized product recommendations for the current user",
)
def get_recommendations(
    budget_band: Optional[str] = Query(None, description="BUDGET | MODERATE | PREMIUM"),
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Full safety-first recommendation pipeline:
    allergen check → sensitivity → budget → suitability scoring → ranking.
    Allergen conflicts are always EXCLUDED regardless of score.
    Returns recommended, alternative, and excluded products with explanations.
    """
    return ProductService.get_recommendations(db, current_user.id, budget_band=budget_band, category_filter=category)


@router.get(
    "/{product_id}",
    response_model=ProductDetailOut,
    summary="Get product detail by ID",
)
def get_product(
    product_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Full product detail including ingredients, skin types, and target concerns."""
    product = ProductService.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    return product


@router.post(
    "/compare",
    response_model=ProductComparisonResponse,
    summary="Compare up to 3 products side-by-side with profile matching",
)
def compare_products(
    body: ProductCompareRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns side-by-side comparison of up to 3 products.
    Each product includes its profile match score, reasons, and safety status.
    """
    if len(body.product_ids) < 2:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide at least 2 product IDs to compare.")
    return ProductService.compare_products(db, body.product_ids[:3], current_user.id, budget_band=body.budget_band)


@router.get(
    "/{product_id}/alternatives",
    response_model=List[ProductRecommendationOut],
    summary="Get alternative products in the same category that pass safety checks",
)
def get_alternatives(
    product_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns up to 5 alternative products in the same category.
    All alternatives pass the safety pipeline (allergen + interaction checks).
    """
    return ProductService.get_alternatives(db, product_id, current_user.id)
