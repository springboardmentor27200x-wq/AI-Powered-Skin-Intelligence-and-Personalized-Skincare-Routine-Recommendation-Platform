import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base


class UserRole(str, enum.Enum):
    USER = "USER"
    SKINCARE_CONSULTANT = "SKINCARE_CONSULTANT"
    DERMATOLOGIST = "DERMATOLOGIST"
    ADMINISTRATOR = "ADMINISTRATOR"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    skin_profile = relationship("SkinProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    lifestyle_profile = relationship("LifestyleProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    sleep_records = relationship("SleepRecord", back_populates="user", cascade="all, delete-orphan", order_by="desc(SleepRecord.record_date)")
    hydration_records = relationship("HydrationRecord", back_populates="user", cascade="all, delete-orphan", order_by="desc(HydrationRecord.record_date)")

    def __repr__(self):
        return f"<User id={self.id} email={self.email} role={self.role}>"
