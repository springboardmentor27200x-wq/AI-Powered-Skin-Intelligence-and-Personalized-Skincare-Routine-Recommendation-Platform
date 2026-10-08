from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class HydrationBase(BaseModel):
    water_intake_ml: int = Field(default=0, ge=0, description="Water intake must be non-negative")
    target_water_ml: int = Field(default=2000, ge=0, description="Target water intake must be non-negative")
    record_date: date = Field(default_factory=date.today)


class HydrationCreate(HydrationBase):
    pass


class HydrationUpdate(BaseModel):
    water_intake_ml: Optional[int] = Field(None, ge=0)
    target_water_ml: Optional[int] = Field(None, ge=0)
    record_date: Optional[date] = None


class HydrationResponse(HydrationBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
