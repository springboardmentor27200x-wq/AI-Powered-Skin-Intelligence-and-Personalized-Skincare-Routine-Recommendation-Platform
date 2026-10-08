import uuid
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, func
from sqlalchemy.orm import relationship
from sqlalchemy.types import Uuid
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="USER", nullable=False)  # USER, SKINCARE_CONSULTANT, DERMATOLOGIST, ADMINISTRATOR
    auth_provider = Column(String, default="local", nullable=False)  # local, google
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    skin_profile = relationship("SkinProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    lifestyle_records = relationship("LifestyleRecord", back_populates="user", cascade="all, delete-orphan")
    sleep_records = relationship("SleepRecord", back_populates="user", cascade="all, delete-orphan")
    hydration_records = relationship("HydrationRecord", back_populates="user", cascade="all, delete-orphan")
    environmental_exposure_records = relationship("EnvironmentalExposureRecord", back_populates="user", cascade="all, delete-orphan")
    sent_connections = relationship("ProfessionalConnection", foreign_keys="[ProfessionalConnection.user_id]", back_populates="client", cascade="all, delete-orphan")
    received_connections = relationship("ProfessionalConnection", foreign_keys="[ProfessionalConnection.professional_id]", back_populates="professional", cascade="all, delete-orphan")
    assessments = relationship("SkinAssessment", back_populates="user", cascade="all, delete-orphan", order_by="desc(SkinAssessment.created_at)")
    routines = relationship("Routine", back_populates="user", cascade="all, delete-orphan", order_by="desc(Routine.created_at)")
    routine_adherence_records = relationship("RoutineAdherenceRecord", back_populates="user", cascade="all, delete-orphan", order_by="desc(RoutineAdherenceRecord.created_at)")
    given_recommendations = relationship("ProfessionalRecommendation", foreign_keys="[ProfessionalRecommendation.professional_id]", back_populates="professional", cascade="all, delete-orphan", order_by="desc(ProfessionalRecommendation.created_at)")
    received_recommendations = relationship("ProfessionalRecommendation", foreign_keys="[ProfessionalRecommendation.patient_id]", back_populates="patient", cascade="all, delete-orphan", order_by="desc(ProfessionalRecommendation.created_at)")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan", order_by="desc(Notification.created_at)")
    notification_preference = relationship("NotificationPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    sent_chat_messages = relationship("ChatMessage", foreign_keys="[ChatMessage.sender_id]", back_populates="sender", cascade="all, delete-orphan", order_by="asc(ChatMessage.created_at)")
    received_chat_messages = relationship("ChatMessage", foreign_keys="[ChatMessage.recipient_id]", back_populates="recipient", cascade="all, delete-orphan", order_by="asc(ChatMessage.created_at)")



class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    name = Column(String, nullable=False)
    age_group = Column(String, nullable=True)  # E.g. "UNDER_18", "18_24", "25_34", "35_44", "45_54", "55_OVER"
    location = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="profile")
