import uuid
from datetime import datetime

from pydantic import BaseModel
class SkinAssessmentOut(BaseModel):
    id: uuid.UUID
    score: int
    skin_condition_score: int | None
    lifestyle_score: int | None
    sleep_score: int | None
    routine_consistency_score: int | None
    hydration_score: int | None
    prioritized_concerns: list[str]
    risk_factors: list[str]
    created_at: datetime

    class Config:
        from_attributes = True
class TrendAnalyticsOut(BaseModel):
    current_score: int
    first_score: int
    change_since_first: int
    change_since_last: int | None
    trend: str  # improving | declining | stable
    average_score: float
    best_score: int
    worst_score: int
    assessments_count: int