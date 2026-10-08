from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class IngredientBase(BaseModel):
    name: str
    category: str
    comedogenic_rating: int
    irritancy_level: str
    safety_status: str
    description: str
    user_suitability: Optional[str] = None
    allergy_alert: Optional[bool] = False
    interactions: Optional[List[str]] = []

class ProductBase(BaseModel):
    name: str
    brand: str
    category: str
    key_ingredients: List[str]
    price_range: str
    suitability: List[str]  # e.g. ["OILY", "ACNE_PRONE"]

class ProductRecommendation(BaseModel):
    product: ProductBase
    suitability_score: int
    match_reason: str
    price_estimate: str
    alternatives: Optional[List[dict]] = []

class ProductRecommendationResponse(BaseModel):
    user_id: int
    recommended_products: List[ProductRecommendation]
    generated_at: datetime
