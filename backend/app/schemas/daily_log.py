import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

SLEEP_QUALITY = ("poor", "fair", "good", "excellent")
LIFESTYLE_HABITS = ("smoking", "high_stress", "frequent_travel", "alcohol", "exercise", "none")
ENVIRONMENTAL_EXPOSURE = ("sun", "pollution", "ac_heat", "none")
ACTIVITY_LEVEL = ("low", "moderate", "high")
STRESS_LEVEL = ("low", "moderate", "high")


class DailyLogIn(BaseModel):
    log_date: date
    sleep_quality: str | None = None
    sleep_hours: Decimal | None = None
    water_intake_liters: Decimal | None = None
    activity_level: str | None = None
    stress_level: str | None = None
    diet_notes: str | None = None
    lifestyle_habits: list[str] = Field(default_factory=list)
    environmental_exposure: list[str] = Field(default_factory=list)
    notes: str | None = None


class DailyLogOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    log_date: date
    sleep_quality: str | None
    sleep_hours: Decimal | None
    water_intake_liters: Decimal | None
    activity_level: str | None
    stress_level: str | None
    diet_notes: str | None
    lifestyle_habits: list[str] | None
    environmental_exposure: list[str] | None
    notes: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True