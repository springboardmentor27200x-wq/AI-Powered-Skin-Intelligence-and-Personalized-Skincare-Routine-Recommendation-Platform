from __future__ import annotations
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel


class IngredientBrief(BaseModel):
    """Compact card representation for list/search views."""
    id: UUID
    name: str
    category: str
    common_uses: Optional[str] = None
    suitability_notes: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


class IngredientDetailOut(BaseModel):
    """Full ingredient detail including education content and interactions."""
    id: UUID
    name: str
    normalized_name: str
    category: str
    description: Optional[str] = None
    common_uses: Optional[str] = None
    suitability_notes: Optional[str] = None
    caution_notes: Optional[str] = None
    education_content: Optional[str] = None
    aliases: Optional[List[str]] = None
    suitable_for: Optional[List[str]] = None
    caution_for: Optional[List[str]] = None
    avoid_for: Optional[List[str]] = None
    target_concerns: Optional[List[str]] = None

    model_config = {"from_attributes": True}


class SuitabilityResult(BaseModel):
    """
    Result of evaluating an ingredient against a user's skin profile.
    Status: suitable | conditionally_suitable | unsuitable | unknown
    """
    ingredient_id: UUID
    ingredient_name: str
    status: str                         # suitable | conditionally_suitable | unsuitable | unknown
    reasons: List[str] = []
    warnings: List[str] = []
    supporting_factors: List[str] = []

    model_config = {"from_attributes": True}


class InteractionResult(BaseModel):
    """A single interaction rule between two ingredients."""
    ingredient_a: str
    ingredient_b: str
    interaction_type: str               # CAUTION | AVOID | SEQUENCE | SEPARATE | SYNERGY
    severity: str                       # LOW | MODERATE | HIGH
    recommendation: str
    description: Optional[str] = None


class InteractionCheckResponse(BaseModel):
    """Response for batch interaction check on a list of ingredient names."""
    checked: List[str]
    interactions: List[InteractionResult]
    has_conflicts: bool


class SuitabilityRequest(BaseModel):
    ingredient_id: UUID


class InteractionCheckRequest(BaseModel):
    ingredient_names: List[str]         # Normalized names to check
