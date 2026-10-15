from datetime import datetime, date
from typing import List
from pydantic import BaseModel, Field, ConfigDict


class HydrationRecordBase(BaseModel):
    water_intake_ml: float = Field(..., ge=0, le=20000, description="Water intake in milliliters (ml)")
    record_date: date = Field(default_factory=date.today, description="Date of water intake entry")


class HydrationRecordCreate(HydrationRecordBase):
    pass


class HydrationRecordResponse(HydrationRecordBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HydrationSummaryResponse(BaseModel):
    records: List[HydrationRecordResponse]
    today_total_ml: float
    today_date: date
    total_records: int
