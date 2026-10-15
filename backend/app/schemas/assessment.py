from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class AssessmentInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    age: int = Field(..., ge=0, description="User's age in years")
    skin_type: str = Field(..., description="Skin type identifier (e.g., 'dry', 'oily', 'combination')")
    concerns: List[str] = Field(..., description="List of skin concerns (e.g., ['acne', 'wrinkles'])")
    allergies: List[str] = Field(default_factory=list, description="Known ingredient allergies")
    budget: Optional[float] = Field(None, ge=0, description="Maximum budget for recommended products")
    sleep_quality: Optional[str] = Field(
        default=None,
        description="Sleep quality rating such as poor, fair, good, or excellent",
    )
    hydration_level: Optional[str] = Field(
        default=None,
        description="Hydration status such as low, moderate, or high",
    )
    lifestyle_score: Optional[int] = Field(default=None, ge=0, le=100, description="Lifestyle score from 0 to 100")
    routine_consistency: Optional[int] = Field(default=None, ge=0, le=100, description="Routine consistency score from 0 to 100")


class AssessmentResult(BaseModel):
    score: float = Field(..., description="Weighted overall skin health score (0-100)")
    breakdown: Dict[str, float] = Field(..., description="Weighted component scores used in the final calculation")
    priority_concerns: List[str] = Field(default_factory=list, description="Most important skin concerns to address first")
    recommendations: List[str] = Field(default_factory=list, description="Personalized skincare recommendations")
    routine: Dict[str, List[str]] = Field(default_factory=dict, description="Suggested morning, evening, and weekly routine")
    summary: str = Field(..., description="High-level assessment summary for the user")


class RoutineStep(BaseModel):
    step_number: int = Field(..., description="Order of the step")
    product_id: str = Field(..., description="Product identifier")
    description: str = Field(..., description="Instruction for this step")


class RoutineResult(BaseModel):
    steps: List[RoutineStep] = Field(..., description="Ordered routine steps")
