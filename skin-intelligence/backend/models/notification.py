from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String, default="ROUTINE")  # ROUTINE, REPLENISHMENT, UV_ALERT, CYCLING, ASSESSMENT
    priority = Column(String, default="NORMAL")            # LOW, NORMAL, HIGH, URGENT
    
    is_read = Column(Boolean, default=False)
    is_dismissed = Column(Boolean, default=False)
    
    action_url = Column(String, nullable=True)             # e.g., "#routine", "#products", "#skincycle"
    action_label = Column(String, nullable=True)           # e.g., "View AM Routine", "Reorder Product"
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")


class NotificationSetting(Base):
    __tablename__ = "notification_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    am_reminder_enabled = Column(Boolean, default=True)
    am_reminder_time = Column(String, default="08:00")
    
    pm_reminder_enabled = Column(Boolean, default=True)
    pm_reminder_time = Column(String, default="21:00")
    
    midday_spf_reminder_enabled = Column(Boolean, default=True)
    midday_spf_time = Column(String, default="13:00")
    
    replenishment_alerts_enabled = Column(Boolean, default=True)
    cycling_phase_alerts_enabled = Column(Boolean, default=True)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notification_settings")


class ProductReplenishment(Base):
    __tablename__ = "product_replenishments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    product_name = Column(String, nullable=False)
    category = Column(String, default="Moisturizer")       # Cleanser, Serum, Sunscreen, Moisturizer, Treatment
    bottle_size_ml = Column(Integer, default=50)
    
    opened_date = Column(String, nullable=False)           # YYYY-MM-DD
    estimated_lifespan_days = Column(Integer, default=45)  # e.g., 30 for sunscreen, 60 for serum
    daily_usage_frequency = Column(Integer, default=1)     # 1 = once daily, 2 = AM & PM
    
    status = Column(String, default="GOOD")                # GOOD, LOW (<7 days), EMPTY, EXPIRED
    remaining_percentage = Column(Integer, default=100)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="product_replenishments")
