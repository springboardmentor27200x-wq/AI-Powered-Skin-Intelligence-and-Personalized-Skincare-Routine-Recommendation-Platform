from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.models.profile import SkinTypeEnum

class SkinProfileBase(BaseModel):
    age: int = Field(25, ge=1, le=120, description="Exact age of the person")
    age_group: str = "25-34"
    skin_type: SkinTypeEnum
    oil_characteristics: str = "Moderate T-Zone sebum"
    concerns: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    sensitivities: List[str] = Field(default_factory=list)
    skin_goals: List[str] = Field(default_factory=list)
    working_routine: str = "Desk/Screen work indoors"
    exercise_frequency: str = "3-4 times a week"
    exercise_duration_mins: int = 30
    stress_level: int = Field(5, ge=1, le=10)
    baseline_water_intake_ml: int = 2000
    baseline_sleep_hours: float = 7.5
    sun_exposure_level: str = "Moderate (1-3 hours)"
    climate_type: str = "Temperate"
    notes: Optional[str] = None

class SkinProfileCreate(SkinProfileBase):
    pass

class SkinProfileUpdate(BaseModel):
    age: Optional[int] = None
    age_group: Optional[str] = None
    skin_type: Optional[SkinTypeEnum] = None
    oil_characteristics: Optional[str] = None
    concerns: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    sensitivities: Optional[List[str]] = None
    skin_goals: Optional[List[str]] = None
    working_routine: Optional[str] = None
    exercise_frequency: Optional[str] = None
    exercise_duration_mins: Optional[int] = None
    stress_level: Optional[int] = None
    baseline_water_intake_ml: Optional[int] = None
    baseline_sleep_hours: Optional[float] = None
    sun_exposure_level: Optional[str] = None
    climate_type: Optional[str] = None
    notes: Optional[str] = None

class SkinProfileResponse(SkinProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
