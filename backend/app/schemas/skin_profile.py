from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, field_validator


class SkinConcernResponse(BaseModel):
    id: UUID
    code: str
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class SkinProfileBase(BaseModel):
    skin_type: str
    allergies: Optional[str] = None
    sensitivities: Optional[str] = None

    @field_validator("skin_type")
    @classmethod
    def validate_skin_type(cls, v: str) -> str:
        valid_types = {"NORMAL", "DRY", "OILY", "COMBINATION", "SENSITIVE"}
        upper_v = v.upper()
        if upper_v not in valid_types:
            raise ValueError(f"skin_type must be one of {valid_types}")
        return upper_v


class SkinProfileCreate(SkinProfileBase):
    concerns: List[str] = []  # List of skin concern codes, e.g., ["ACNE", "DRY_SKIN"]


class SkinProfileUpdate(BaseModel):
    skin_type: Optional[str] = None
    allergies: Optional[str] = None
    sensitivities: Optional[str] = None
    concerns: Optional[List[str]] = None

    @field_validator("skin_type")
    @classmethod
    def validate_skin_type(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        valid_types = {"NORMAL", "DRY", "OILY", "COMBINATION", "SENSITIVE"}
        upper_v = v.upper()
        if upper_v not in valid_types:
            raise ValueError(f"skin_type must be one of {valid_types}")
        return upper_v


class SkinProfileResponse(SkinProfileBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    concerns: List[SkinConcernResponse] = []

    class Config:
        from_attributes = True
