import uuid
from datetime import datetime

from pydantic import BaseModel


class SkinProfileIn(BaseModel):
    skin_type: str
    age_group: str
    skin_concerns: list[str] = []
    allergies: list[str] = []
    sensitivities: list[str] = []


class SkinProfileOut(SkinProfileIn):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True