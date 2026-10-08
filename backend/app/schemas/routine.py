from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class ProductRecommendation(BaseModel):
    product_type: str
    product_name: str
    reason: str

class RoutineStep(BaseModel):
    step_name: str
    recommendation: ProductRecommendation

class SkincareRoutineBase(BaseModel):
    season: str
    target_concern: str
    morning_routine: List[RoutineStep]
    evening_routine: List[RoutineStep]
    weekly_treatment: str

class SkincareRoutineCreate(SkincareRoutineBase):
    pass

class SkincareRoutineResponse(SkincareRoutineBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
