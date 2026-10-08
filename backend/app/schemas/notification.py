import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.notification import NotificationCategory, NotificationPriority

class NotificationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    category: NotificationCategory
    title: str
    message: str
    priority: NotificationPriority
    is_read: bool
    action_url: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    total: int
    unread_count: int

class UnreadCountResponse(BaseModel):
    unread_count: int

class NotificationPreferenceResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    routine_reminders: bool
    hydration_reminders: bool
    sleep_reminders: bool
    product_replenishment: bool
    progress_alerts: bool
    platform_announcements: bool
    morning_time: str
    evening_time: str
    class Config:
        from_attributes = True

class NotificationPreferenceUpdate(BaseModel):
    routine_reminders: Optional[bool] = None
    hydration_reminders: Optional[bool] = None
    sleep_reminders: Optional[bool] = None
    product_replenishment: Optional[bool] = None
    progress_alerts: Optional[bool] = None
    platform_announcements: Optional[bool] = None
    morning_time: Optional[str] = None
    evening_time: Optional[str] = None
