from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class SkinProfileBase(BaseModel):
    skin_type: str = Field(..., description="Skin type: Normal, Dry, Oily, Combination, Sensitive")
    age_group: str = Field(..., description="Age group: Under 18, 18-24, 25-34, 35-44, 45-54, 55+")
    skin_concerns: List[str] = Field(default_factory=list, description="List of skin concerns")
    allergies: Optional[str] = Field(None, description="Known skin/ingredient allergies")
    sensitivities: Optional[str] = Field(None, description="Known skin sensitivities")


class SkinProfileCreate(SkinProfileBase):
    pass


class SkinProfileUpdate(BaseModel):
    skin_type: Optional[str] = None
    age_group: Optional[str] = None
    skin_concerns: Optional[List[str]] = None
    allergies: Optional[str] = None
    sensitivities: Optional[str] = None


class SkinProfileResponse(SkinProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
