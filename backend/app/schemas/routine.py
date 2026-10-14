import uuid
from datetime import datetime

from pydantic import BaseModel


class RoutineStepOut(BaseModel):
    id: uuid.UUID
    time_of_day: str
    step_order: int
    category: str
    instruction: str
    reason: str | None
    frequency: str

    class Config:
        from_attributes = True


class RoutineOut(BaseModel):
    id: uuid.UUID
    generated_at: datetime
    based_on_assessment_id: uuid.UUID | None
    season: str | None
    morning: list[RoutineStepOut]
    evening: list[RoutineStepOut]

    class Config:
        from_attributes = True