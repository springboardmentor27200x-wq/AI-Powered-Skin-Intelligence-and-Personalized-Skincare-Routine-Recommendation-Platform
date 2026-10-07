import enum

from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base


class UserRole(str, enum.Enum):
    USER = "USER"
    SKINCARE_CONSULTANT = "SKINCARE_CONSULTANT"
    DERMATOLOGIST = "DERMATOLOGIST"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    full_name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    role = Column(
        Enum(UserRole),
        nullable=False,
        default=UserRole.USER
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    skin_profile = relationship("SkinProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    lifestyle_logs = relationship("LifestyleLog", back_populates="user", cascade="all, delete-orphan")
    skin_assessments = relationship("SkinAssessment", back_populates="user", cascade="all, delete-orphan", order_by="SkinAssessment.created_at.desc()")
    skincare_routines = relationship("SkincareRoutine", back_populates="user", cascade="all, delete-orphan", order_by="SkincareRoutine.created_at.desc()")
    texture_analyses = relationship("SkinTextureAnalysis", back_populates="user", cascade="all, delete-orphan", order_by="SkinTextureAnalysis.created_at.desc()")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan", order_by="Notification.created_at.desc()")
    notification_settings = relationship("NotificationSetting", back_populates="user", uselist=False, cascade="all, delete-orphan")
    product_replenishments = relationship("ProductReplenishment", back_populates="user", cascade="all, delete-orphan", order_by="ProductReplenishment.created_at.desc()")
