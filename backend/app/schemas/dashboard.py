from typing import Optional, List
from pydantic import BaseModel
from app.schemas.user import UserResponse
from app.schemas.skin_profile import SkinProfileResponse
from app.schemas.lifestyle import LifestyleResponse
from app.schemas.sleep import SleepRecordResponse
from app.schemas.hydration import HydrationRecordResponse


class ProfileCompletionStatus(BaseModel):
    completion_percentage: int
    skin_profile_completed: bool
    lifestyle_completed: bool
    has_sleep_records: bool
    has_hydration_records: bool
    missing_sections: List[str]


class ProgressTrendPoint(BaseModel):
    label: str
    score: int


class ProgressAnalyticsResponse(BaseModel):
    overall_skin_health_score: int
    skin_condition_score: int
    lifestyle_score: int
    sleep_score: int
    hydration_score: int
    trend: List[ProgressTrendPoint] = []
    alerts: List[str] = []
    summary: str


class DashboardSummaryResponse(BaseModel):
    user: UserResponse
    completion: ProfileCompletionStatus
    skin_profile: Optional[SkinProfileResponse] = None
    lifestyle: Optional[LifestyleResponse] = None
    recent_sleep: Optional[SleepRecordResponse] = None
    average_sleep_hours: Optional[float] = None
    today_hydration_ml: float = 0.0
    recent_hydration: List[HydrationRecordResponse] = []
