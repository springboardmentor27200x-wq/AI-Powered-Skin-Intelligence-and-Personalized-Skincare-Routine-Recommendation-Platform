import uuid
from datetime import date, datetime

from pydantic import BaseModel


class AdherenceIn(BaseModel):
    log_date: date
    morning_completed: bool
    evening_completed: bool


class AdherenceOut(BaseModel):
    id: uuid.UUID
    log_date: date
    morning_completed: bool
    evening_completed: bool
    updated_at: datetime

    class Config:
        from_attributes = True