from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class IngredientAnalysisInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    skin_type: str = Field(..., description="Target skin type for the ingredient evaluation")
    concerns: List[str] = Field(default_factory=list, description="Skin concerns to target")
    allergies: List[str] = Field(default_factory=list, description="Known ingredient allergens")
    ingredients: List[str] = Field(default_factory=list, description="Ingredient names to evaluate")


class IngredientAnalysisResult(BaseModel):
    score: float = Field(..., description="Ingredient safety and suitability score from 0-100")
    safe_ingredients: List[str] = Field(default_factory=list, description="Ingredients that fit the skin profile")
    avoid_ingredients: List[str] = Field(default_factory=list, description="Ingredients that may trigger irritation or allergies")
    neutral_ingredients: List[str] = Field(default_factory=list, description="Ingredients with limited or neutral fit")
    interactions: List["IngredientInteraction"] = Field(default_factory=list)
    summary: str = Field(..., description="Human-readable summary of ingredient suitability")


class IngredientInteraction(BaseModel):
    ingredients: List[str]
    severity: str
    guidance: str


class ProductRecommendationInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    skin_type: str = Field(..., description="User skin type")
    concerns: List[str] = Field(default_factory=list, description="User skin concerns")
    allergies: List[str] = Field(default_factory=list, description="Known allergens or irritants")
    budget: Optional[float] = Field(None, ge=0, description="Budget available for products")
    preferences: List[str] = Field(default_factory=list, description="Optional brand or product preferences")


class ProductRecommendationItem(BaseModel):
    name: str
    category: str
    price: float
    match_score: float
    why: str


class ProductRecommendationResult(BaseModel):
    recommendations: List[ProductRecommendationItem] = Field(default_factory=list)
    summary: str = Field(..., description="Overall recommendation summary")
