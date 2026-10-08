from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


class RoutineStepResponse(BaseModel):
    id: uuid.UUID
    step_order: int
    category: str
    title: str
    description: Optional[str] = None
    frequency: str
    key_actives: Optional[List[str]] = None
    safety_notes: Optional[str] = None
    product_recommendations: Optional[List[Dict[str, Any]]] = None

    model_config = ConfigDict(from_attributes=True)


class RoutineResponse(BaseModel):
    id: uuid.UUID
    routine_type: str  # MORNING, EVENING, WEEKLY, SEASONAL
    version: int
    is_active: bool
    summary: Optional[str] = None
    created_at: datetime
    steps: List[RoutineStepResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class FullRoutinePlanResponse(BaseModel):
    version: int
    is_active: bool
    summary: Optional[str] = None
    generated_at: datetime
    morning: Optional[RoutineResponse] = None
    evening: Optional[RoutineResponse] = None
    weekly: Optional[RoutineResponse] = None
    seasonal: Optional[RoutineResponse] = None
    adherence_score: Optional[int] = None
    today_completed_step_ids: Optional[List[str]] = None

    model_config = ConfigDict(from_attributes=True)
