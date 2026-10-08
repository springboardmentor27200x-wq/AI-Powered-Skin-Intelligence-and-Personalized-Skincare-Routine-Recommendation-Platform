from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


class SleepBase(BaseModel):
    duration_minutes: Optional[int] = Field(None, ge=0, description="Duration in minutes cannot be negative")
    quality: Optional[str] = None  # POOR, FAIR, GOOD, EXCELLENT
    bedtime: Optional[str] = Field(None, pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$", description="Bedtime must be in HH:MM format")
    wake_time: Optional[str] = Field(None, pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$", description="Wake time must be in HH:MM format")
    record_date: date = Field(default_factory=date.today)

    @field_validator("quality")
    @classmethod
    def validate_quality(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        upper_v = v.upper()
        if upper_v not in {"POOR", "FAIR", "GOOD", "EXCELLENT"}:
            raise ValueError("quality must be POOR, FAIR, GOOD, or EXCELLENT")
        return upper_v


class SleepCreate(SleepBase):
    pass


class SleepUpdate(BaseModel):
    duration_minutes: Optional[int] = Field(None, ge=0)
    quality: Optional[str] = None
    bedtime: Optional[str] = Field(None, pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    wake_time: Optional[str] = Field(None, pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    record_date: Optional[date] = None


class SleepResponse(SleepBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
