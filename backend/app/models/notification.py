import uuid
from sqlalchemy import Column, Boolean, DateTime, ForeignKey, String, Enum as SAEnum, func
from sqlalchemy.orm import relationship
from sqlalchemy.types import Uuid
from app.db.database import Base
import enum

class NotificationCategory(str, enum.Enum):
    ROUTINE = "ROUTINE"
    REPLENISHMENT = "REPLENISHMENT"
    HYDRATION = "HYDRATION"
    SLEEP = "SLEEP"
    PROGRESS = "PROGRESS"
    PLATFORM = "PLATFORM"

class NotificationPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(SAEnum(NotificationCategory), nullable=False, default=NotificationCategory.PLATFORM)
    title = Column(String(200), nullable=False)
    message = Column(String(1000), nullable=False)
    priority = Column(SAEnum(NotificationPriority), nullable=False, default=NotificationPriority.MEDIUM)
    is_read = Column(Boolean, default=False, nullable=False)
    action_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    user = relationship("User", back_populates="notifications", lazy="select")

class NotificationPreference(Base):
    __tablename__ = "notification_preferences"
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    routine_reminders = Column(Boolean, default=True)
    hydration_reminders = Column(Boolean, default=True)
    sleep_reminders = Column(Boolean, default=True)
    product_replenishment = Column(Boolean, default=True)
    progress_alerts = Column(Boolean, default=True)
    platform_announcements = Column(Boolean, default=True)
    morning_time = Column(String(5), default="07:00")
    evening_time = Column(String(5), default="21:00")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    user = relationship("User", back_populates="notification_preference", lazy="select")
