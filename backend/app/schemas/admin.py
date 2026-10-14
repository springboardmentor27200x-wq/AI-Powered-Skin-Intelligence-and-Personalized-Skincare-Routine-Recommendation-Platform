import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.user import UserRole


class AdminUserOut(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UpdateUserRole(BaseModel):
    role: UserRole


class UpdateUserStatus(BaseModel):
    is_active: bool


class PlatformStats(BaseModel):
    total_users: int
    users_by_role: dict[str, int]
    active_users: int
    inactive_users: int
    total_skin_profiles: int
    total_daily_logs: int
class PlatformAnalyticsOut(BaseModel):
    total_assessments: int
    average_score: float | None
    total_routines: int
    total_ingredients: int
    total_products: int
    top_concern: str | None
    top_concern_count: int
    platform_adherence_rate: float | None