from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.db.session import get_db
from app.schemas.product import ProductRecommendationResponse, IngredientBase
from app.services.product_service import product_service
from app.services.profile_service import profile_service
from app.core.dependencies import get_current_user

router = APIRouter()

@router.get("/recommendations", response_model=ProductRecommendationResponse, summary="Get personalized product recommendations")
def get_product_recommendations(
    max_budget: float = None,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    profile = profile_service.get_profile_by_user_id(db, current_user["id"])
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skin profile not found. Please complete profile first.")
    
    recommendations = product_service.recommend_products(current_user["id"], profile, max_budget=max_budget)
    return recommendations

@router.post("/compare", summary="Compare multiple products")
def compare_products(req: dict, current_user: dict = Depends(get_current_user)):
    return product_service.compare_products(req.get("product_names", []))

@router.get("/ingredients", response_model=List[IngredientBase], summary="Get ingredient intelligence catalog")
def get_ingredients(
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    profile = profile_service.get_profile_by_user_id(db, current_user["id"])
    return product_service.get_all_ingredients(profile)
