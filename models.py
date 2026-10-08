from sqlalchemy import Column, Integer, String,Float
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
class SkinProfile(Base):
    __tablename__ = "skin_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    skin_type = Column(String, nullable=True)
    skin_concerns = Column(String, nullable=True)
    sensitivity = Column(String, nullable=True)


class Lifestyle(Base):
    __tablename__ = "lifestyle"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    water_intake = Column(String, nullable=True)
    exercise = Column(String, nullable=True)
    smoking = Column(String, nullable=True)


class SleepTracking(Base):
    __tablename__ = "sleep_tracking"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    sleep_hours = Column(Float, nullable=True)
    sleep_quality = Column(String, nullable=True)

class SkinAssessment(Base):
    __tablename__ = "skin_assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    score = Column(Integer, nullable=False)
    primary_concern = Column(String, nullable=True)
    risk_level = Column(String, nullable=True)
    recommendation = Column(String, nullable=True)

class SkincareRoutine(Base):
    __tablename__ = "skincare_routines"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    morning_routine = Column(String, nullable=True)
    evening_routine = Column(String, nullable=True)
    weekly_treatment = Column(String, nullable=True)

class SkinProgress(Base):
    __tablename__ = "skin_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)

    progress_date = Column(String, nullable=False)
    skin_score = Column(Integer, nullable=False)
    routine_adherence = Column(Integer, nullable=False)

    improvement_score = Column(Integer, nullable=True)
    notes = Column(String, nullable=True)