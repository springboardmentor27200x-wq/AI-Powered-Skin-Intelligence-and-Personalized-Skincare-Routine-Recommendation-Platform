from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(50), nullable=False)
    role = Column(String(30), nullable=False, default="user")
    created_at = Column(DateTime, default=datetime.utcnow)
    profile = relationship("SkinProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

class SkinProfile(Base):
    __tablename__ = "skin_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    skin_type = Column(String(30), nullable=False)
    age_group = Column(String(50), nullable=False)
    skin_concerns = Column(Text, default="")
    allergies = Column(Text, default="")
    sensitivities = Column(Text, default="")
    lifestyle_habits = Column(Text, default="")
    sleep_quality = Column(String(30), nullable=False)
    water_intake = Column(Float, nullable=False)
    sun_exposure = Column(String(100), default="")
    pollution_exposure = Column(String(100), default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("User", back_populates="profile")
