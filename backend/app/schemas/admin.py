from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from app.schemas.user import UserResponse


class AdminPlatformStats(BaseModel):
    total_users: int
    users_count: int
    consultants_count: int
    dermatologists_count: int
    administrators_count: int
    active_users_count: int
    pending_connections_count: int
    accepted_connections_count: int
    # Milestone 4 Platform Telemetry
    total_assessments: int = 0
    total_routines: int = 0
    total_recommendations: int = 0
    total_reports: int = 0
    total_notifications: int = 0


class AdminUserStatusUpdate(BaseModel):
    is_active: bool


class AdminUserRoleUpdate(BaseModel):
    role: str  # USER, SKINCARE_CONSULTANT, DERMATOLOGIST, ADMINISTRATOR


class SystemHealthResponse(BaseModel):
    status: str
    backend_api: str
    database: str
    auth_service: str
    timestamp: datetime
