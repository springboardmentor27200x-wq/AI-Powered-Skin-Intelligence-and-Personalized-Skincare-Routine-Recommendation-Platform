from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


class EnvironmentBase(BaseModel):
    uv_exposure: Optional[str] = None  # LOW, MODERATE, HIGH
    pollution_exposure: Optional[str] = None  # LOW, MODERATE, HIGH
    outdoor_time_minutes: int = Field(default=0, ge=0, description="Outdoor time must be non-negative")
    climate: Optional[str] = None  # DRY, HUMID, TEMPERATE, COLD, HOT
    record_date: date = Field(default_factory=date.today)

    @field_validator("uv_exposure")
    @classmethod
    def validate_uv(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        upper_v = v.upper()
        if upper_v not in {"LOW", "MODERATE", "HIGH"}:
            raise ValueError("uv_exposure must be LOW, MODERATE, or HIGH")
        return upper_v

    @field_validator("pollution_exposure")
    @classmethod
    def validate_pollution(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        upper_v = v.upper()
        if upper_v not in {"LOW", "MODERATE", "HIGH"}:
            raise ValueError("pollution_exposure must be LOW, MODERATE, or HIGH")
        return upper_v

    @field_validator("climate")
    @classmethod
    def validate_climate(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        upper_v = v.upper()
        if upper_v not in {"DRY", "HUMID", "TEMPERATE", "COLD", "HOT"}:
            raise ValueError("climate must be DRY, HUMID, TEMPERATE, COLD, or HOT")
        return upper_v


class EnvironmentCreate(EnvironmentBase):
    pass


class EnvironmentUpdate(BaseModel):
    uv_exposure: Optional[str] = None
    pollution_exposure: Optional[str] = None
    outdoor_time_minutes: Optional[int] = Field(None, ge=0)
    climate: Optional[str] = None
    record_date: Optional[date] = None


class EnvironmentResponse(EnvironmentBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
