from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_active_user
from app.schemas.recommendations import (
    IngredientAnalysisInput,
    IngredientAnalysisResult,
    ProductRecommendationInput,
    ProductRecommendationResult,
)
from app.services.recommendation_service import analyze_ingredients, generate_product_recommendations

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.post("/ingredient-analysis", response_model=IngredientAnalysisResult)
def analyze_user_ingredients(
    payload: IngredientAnalysisInput,
    current_user=Depends(get_current_active_user),
):
    """Evaluate ingredient suitability for the user's skin profile and concerns."""
    return analyze_ingredients(payload)


@router.post("/products", response_model=ProductRecommendationResult)
def get_product_recommendations(
    payload: ProductRecommendationInput,
    current_user=Depends(get_current_active_user),
):
    """Return personalized product recommendations based on skin type, concerns, and budget."""
    return generate_product_recommendations(payload)
