from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class ConcernAnalysis(BaseModel):
    concern: str
    severity: str
    priority: int
    reasoning: str

class SkinAssessmentBase(BaseModel):
    prioritized_concerns: List[ConcernAnalysis]
    high_risk_factors: List[str] = []
    overall_health_summary: str
    season: str

class SkinAssessmentCreate(SkinAssessmentBase):
    pass

class SkinAssessmentResponse(SkinAssessmentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

class SkinScoreComponent(BaseModel):
    score: float
    impact: str

class SkinHealthScore(BaseModel):
    overall_score: float
    condition_score: SkinScoreComponent
    lifestyle_score: SkinScoreComponent
    sleep_score: SkinScoreComponent
    routine_score: SkinScoreComponent
    hydration_score: SkinScoreComponent
    evaluated_at: datetime
