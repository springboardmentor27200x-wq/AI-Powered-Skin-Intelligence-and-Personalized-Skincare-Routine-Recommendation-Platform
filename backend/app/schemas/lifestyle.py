from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class LifestyleBase(BaseModel):
    physical_activity: str = Field(..., description="Sedentary, Light, Moderate, High")
    smoking: str = Field(..., description="Never, Occasionally, Regularly")
    alcohol_consumption: str = Field(..., description="None, Occasionally, Frequently")
    screen_time_hours: float = Field(..., ge=0, le=24, description="Screen time in hours per day")
    outdoor_exposure: str = Field(..., description="Low (<1 hr), Moderate (1-3 hrs), High (3+ hrs)")
    pollution_exposure: Optional[str] = Field(None, description="Low, Moderate, High")
    sun_exposure: Optional[str] = Field(None, description="Low, Moderate, High")
    environment_type: Optional[str] = Field(None, description="Indoor, Outdoor, Mixed, AC / Heated")


class LifestyleCreate(LifestyleBase):
    pass


class LifestyleUpdate(BaseModel):
    physical_activity: Optional[str] = None
    smoking: Optional[str] = None
    alcohol_consumption: Optional[str] = None
    screen_time_hours: Optional[float] = Field(None, ge=0, le=24)
    outdoor_exposure: Optional[str] = None
    pollution_exposure: Optional[str] = None
    sun_exposure: Optional[str] = None
    environment_type: Optional[str] = None


class LifestyleResponse(LifestyleBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
