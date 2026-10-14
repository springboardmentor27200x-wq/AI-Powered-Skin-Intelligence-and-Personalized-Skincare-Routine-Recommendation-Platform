import uuid
from datetime import datetime

from pydantic import BaseModel


class ClientListItemOut(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    skin_type: str | None
    latest_score: int | None


class ClientDetailOut(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    skin_type: str | None
    age_group: str | None
    skin_concerns: list[str]
    allergies: list[str]
    sensitivities: list[str]
    latest_assessment: dict | None
    assessment_history: list[dict]
    current_routine: dict | None