from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict
from app.models.tracking import SleepQualityEnum

class LifestyleLogBase(BaseModel):
    log_date: Optional[date] = None
    working_routine: str = "Desk/Screen work indoors"
    exercise_frequency: str = "3-4 times a week"
    exercise_minutes: int = Field(30, ge=0)
    stress_level: int = Field(5, ge=1, le=10)
    diet_quality_score: int = Field(7, ge=1, le=10)
    alcohol_units: int = Field(0, ge=0)
    smoking_status: str = "Non-smoker"
    notes: Optional[str] = None

class LifestyleLogCreate(LifestyleLogBase):
    pass

class LifestyleLogResponse(LifestyleLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    log_date: date
    created_at: datetime

class SleepLogBase(BaseModel):
    log_date: Optional[date] = None
    sleep_duration_hours: float = Field(7.5, ge=0.0, le=24.0)
    sleep_quality: SleepQualityEnum = SleepQualityEnum.GOOD
    wake_feeling: str = "Good & Refreshed"
    deep_sleep_hours: Optional[float] = Field(2.0, ge=0.0, le=24.0)
    bedtime: Optional[str] = "23:00"
    wake_time: Optional[str] = "07:00"
    notes: Optional[str] = None

class SleepLogCreate(SleepLogBase):
    pass

class SleepLogResponse(SleepLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    log_date: date
    created_at: datetime

class HydrationLogBase(BaseModel):
    log_date: Optional[date] = None
    water_amount_ml: int = Field(250, ge=0)
    target_ml: int = Field(2500, ge=500)
    glasses_count: int = Field(1, ge=0)

class HydrationLogCreate(HydrationLogBase):
    pass

class HydrationLogResponse(HydrationLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    log_date: date
    created_at: datetime

class EnvironmentLogBase(BaseModel):
    log_date: Optional[date] = None
    sun_exposure_hours: float = Field(2.0, ge=0.0)
    uv_index: float = Field(4.0, ge=0.0)
    dust_pollution_exposure: str = "Moderate"
    weather_condition: str = "Cold & Dry"
    pollution_aqi: int = Field(45, ge=0)
    humidity_percent: float = Field(55.0, ge=0.0, le=100.0)

class EnvironmentLogCreate(EnvironmentLogBase):
    pass

class EnvironmentLogResponse(EnvironmentLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    log_date: date
    created_at: datetime

class DailyTrackingSummary(BaseModel):
    date: date
    hydration_total_ml: int
    hydration_target_ml: int
    hydration_percentage: float
    sleep_hours: float
    sleep_quality: str
    wake_feeling: str
    stress_level: int
    exercise_minutes: int
    working_routine: str
    diet_quality_score: int
    uv_index: float
    sun_exposure_hours: float
    dust_pollution_exposure: str
    weather_condition: str
    lifestyle_impact_score: float
