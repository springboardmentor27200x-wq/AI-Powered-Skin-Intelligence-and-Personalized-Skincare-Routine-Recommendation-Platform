from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class SleepRecordBase(BaseModel):
    sleep_duration_hours: float = Field(..., ge=0, le=24, description="Sleep duration in hours")
    sleep_quality: str = Field(..., description="Poor, Fair, Good, Excellent")
    bedtime: Optional[str] = Field(None, description="Bedtime in HH:MM format e.g. 23:00")
    wake_time: Optional[str] = Field(None, description="Wake time in HH:MM format e.g. 07:00")
    sleep_consistency: Optional[str] = Field(None, description="Consistent, Inconsistent, Variable")
    record_date: date = Field(default_factory=date.today, description="Date of sleep entry")


class SleepRecordCreate(SleepRecordBase):
    pass


class SleepRecordUpdate(BaseModel):
    sleep_duration_hours: Optional[float] = Field(None, ge=0, le=24)
    sleep_quality: Optional[str] = None
    bedtime: Optional[str] = None
    wake_time: Optional[str] = None
    sleep_consistency: Optional[str] = None
    record_date: Optional[date] = None


class SleepRecordResponse(SleepRecordBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SleepHistoryResponse(BaseModel):
    records: List[SleepRecordResponse]
    average_duration: float
    total_records: int
