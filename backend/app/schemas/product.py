from __future__ import annotations
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel


class ProductBrief(BaseModel):
    id: UUID
    name: str
    brand: Optional[str] = None
    category: str
    price: Optional[float] = None
    currency: str = "INR"
    budget_band: str
    image_url: Optional[str] = None
    skin_types: Optional[List[str]] = None
    target_concerns: Optional[List[str]] = None

    model_config = {"from_attributes": True}


class ProductDetailOut(BaseModel):
    id: UUID
    name: str
    brand: Optional[str] = None
    category: str
    description: Optional[str] = None
    price: Optional[float] = None
    currency: str = "INR"
    size: Optional[str] = None
    product_url: Optional[str] = None
    image_url: Optional[str] = None
    ingredients: Optional[List[str]] = None
    active_ingredients: Optional[List[str]] = None
    skin_types: Optional[List[str]] = None
    target_concerns: Optional[List[str]] = None
    sensitivity_flags: Optional[List[str]] = None
    budget_band: str
    is_available: bool

    model_config = {"from_attributes": True}


class ProductRecommendationOut(BaseModel):
    """
    A recommended (or excluded) product returned by the recommendation engine.
    Includes explainability fields (reasons, safety_status).
    """
    product: ProductDetailOut
    recommendation_status: str          # RECOMMENDED | EXCLUDED | ALTERNATIVE
    match_score: Optional[int] = None   # 0-100 "Profile Match"
    reasons: List[str] = []
    safety_status: Optional[str] = None  # SAFE | ALLERGEN_CONFLICT | CAUTION
    exclusion_reason: Optional[str] = None

    model_config = {"from_attributes": True}


class ProductComparisonItem(BaseModel):
    product: ProductDetailOut
    match_score: Optional[int] = None
    reasons: List[str] = []
    safety_status: Optional[str] = None
    exclusion_reason: Optional[str] = None


class ProductComparisonResponse(BaseModel):
    products: List[ProductComparisonItem]


class ProductCompareRequest(BaseModel):
    product_ids: List[UUID]
    budget_band: Optional[str] = None   # BUDGET | MODERATE | PREMIUM


class RecommendationRequest(BaseModel):
    budget_band: Optional[str] = None   # BUDGET | MODERATE | PREMIUM
    category_filter: Optional[str] = None
