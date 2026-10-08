from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


class LifestyleBase(BaseModel):
    physical_activity: Optional[str] = None  # SEDENTARY, MODERATE, ACTIVE
    smoking: Optional[str] = None  # NONE, LIGHT, HEAVY
    alcohol: Optional[str] = None  # NONE, LIGHT, HEAVY
    stress_level: Optional[int] = Field(None, ge=1, le=10, description="Stress level must be between 1 and 10")
    record_date: date = Field(default_factory=date.today)

    @field_validator("physical_activity")
    @classmethod
    def validate_activity(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        upper_v = v.upper()
        if upper_v not in {"SEDENTARY", "MODERATE", "ACTIVE"}:
            raise ValueError("physical_activity must be SEDENTARY, MODERATE, or ACTIVE")
        return upper_v

    @field_validator("smoking")
    @classmethod
    def validate_smoking(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        upper_v = v.upper()
        if upper_v not in {"NONE", "LIGHT", "HEAVY"}:
            raise ValueError("smoking must be NONE, LIGHT, or HEAVY")
        return upper_v

    @field_validator("alcohol")
    @classmethod
    def validate_alcohol(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        upper_v = v.upper()
        if upper_v not in {"NONE", "LIGHT", "HEAVY"}:
            raise ValueError("alcohol must be NONE, LIGHT, or HEAVY")
        return upper_v


class LifestyleCreate(LifestyleBase):
    pass


class LifestyleUpdate(BaseModel):
    physical_activity: Optional[str] = None
    smoking: Optional[str] = None
    alcohol: Optional[str] = None
    stress_level: Optional[int] = Field(None, ge=1, le=10)
    record_date: Optional[date] = None


class LifestyleResponse(LifestyleBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
