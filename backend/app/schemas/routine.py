from datetime import date, datetime
from typing import Dict, List

from pydantic import BaseModel, Field


class RoutineStepToggle(BaseModel):
    completed: bool


class RoutineDayProgress(BaseModel):
    record_date: date
    completed_steps: int
    total_steps: int
    adherence_percentage: float


class RoutinePlanResponse(BaseModel):
    id: int
    routine: Dict[str, List[str]]
    assessment_score: int
    summary: str
    created_at: datetime
    completed_step_keys: List[str] = Field(default_factory=list)
    today_completed_steps: int
    today_total_steps: int
    recent_progress: List[RoutineDayProgress] = Field(default_factory=list)