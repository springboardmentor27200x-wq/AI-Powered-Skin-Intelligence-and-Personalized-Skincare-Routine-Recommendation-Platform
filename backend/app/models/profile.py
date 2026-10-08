import enum
import json
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.db.session import Base

class SkinTypeEnum(str, enum.Enum):
    OILY = "OILY"
    DRY = "DRY"
    COMBINATION = "COMBINATION"
    SENSITIVE = "SENSITIVE"
    NORMAL = "NORMAL"

class SkinProfile(Base):
    __tablename__ = "skin_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    age = Column(Integer, default=25, nullable=False)
    age_group = Column(String(50), default="25-34", nullable=False)
    skin_type = Column(Enum(SkinTypeEnum), nullable=False)
    oil_characteristics = Column(String(255), default="Moderate T-Zone sebum", nullable=False)
    
    _concerns = Column("concerns", Text, default="[]", nullable=False)
    _allergies = Column("allergies", Text, default="[]", nullable=False)
    _sensitivities = Column("sensitivities", Text, default="[]", nullable=False)
    _skin_goals = Column("skin_goals", Text, default="[]", nullable=False)
    
    working_routine = Column(String(100), default="Desk/Screen work indoors", nullable=False)
    exercise_frequency = Column(String(100), default="3-4 times a week", nullable=False)
    exercise_duration_mins = Column(Integer, default=30, nullable=False)
    stress_level = Column(Integer, default=5, nullable=False)
    
    baseline_water_intake_ml = Column(Integer, default=2000, nullable=False)
    baseline_sleep_hours = Column(Float, default=7.5, nullable=False)
    sun_exposure_level = Column(String(50), default="Moderate (1-3 hours)", nullable=False)
    climate_type = Column(String(50), default="Temperate", nullable=False)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="skin_profile")

    @property
    def concerns(self):
        try:
            return json.loads(self._concerns) if self._concerns else []
        except Exception:
            return []

    @concerns.setter
    def concerns(self, value):
        self._concerns = json.dumps(value if isinstance(value, list) else [])

    @property
    def allergies(self):
        try:
            return json.loads(self._allergies) if self._allergies else []
        except Exception:
            return []

    @allergies.setter
    def allergies(self, value):
        self._allergies = json.dumps(value if isinstance(value, list) else [])

    @property
    def sensitivities(self):
        try:
            return json.loads(self._sensitivities) if self._sensitivities else []
        except Exception:
            return []

    @sensitivities.setter
    def sensitivities(self, value):
        self._sensitivities = json.dumps(value if isinstance(value, list) else [])

    @property
    def skin_goals(self):
        try:
            return json.loads(self._skin_goals) if self._skin_goals else []
        except Exception:
            return []

    @skin_goals.setter
    def skin_goals(self, value):
        self._skin_goals = json.dumps(value if isinstance(value, list) else [])
