import uuid
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import relationship
from sqlalchemy.types import Uuid
from app.db.database import Base


class SkinAssessment(Base):
    __tablename__ = "skin_assessments"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    overall_score = Column(Integer, nullable=False)  # 0 - 100
    status = Column(String, default="COMPLETED", nullable=False)  # COMPLETED, IN_PROGRESS
    summary = Column(Text, nullable=True)
    # AI/ML metadata
    assessment_mode = Column(String(30), default="AI_ASSISTED", nullable=True)  # AI_ASSISTED | RULE_BASED_FALLBACK
    ai_model_version = Column(String(20), nullable=True)  # e.g. v1.0
    ai_concern_predictions = Column(JSON, nullable=True)   # raw ML concern probabilities
    ai_risk_predictions = Column(JSON, nullable=True)      # raw ML risk probabilities

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="assessments")
    concerns = relationship("AssessmentConcern", back_populates="assessment", cascade="all, delete-orphan")
    risk_factors = relationship("RiskFactor", back_populates="assessment", cascade="all, delete-orphan")
    scores = relationship("SkinScore", back_populates="assessment", uselist=False, cascade="all, delete-orphan")
    routines = relationship("Routine", back_populates="assessment", cascade="all, delete-orphan")

    @property
    def ai_analysis(self):
        return {
            "assessment_mode": self.assessment_mode or "AI_ASSISTED",
            "model_version": self.ai_model_version or "v1.0",
            "concern_predictions": self.ai_concern_predictions or [],
            "risk_predictions": self.ai_risk_predictions or [],
            "disclaimer": "AI-assisted skin concern assessment. Not a medical diagnosis.",
        }



class AssessmentConcern(Base):
    __tablename__ = "assessment_concerns"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    assessment_id = Column(Uuid, ForeignKey("skin_assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    concern_name = Column(String, nullable=False)  # e.g., "ACNE", "HYPERPIGMENTATION"
    priority = Column(String, nullable=False)  # HIGH, MEDIUM, LOW
    severity = Column(Integer, nullable=False)  # 0 - 100
    confidence = Column(Float, default=0.9, nullable=False)
    reasons = Column(JSON, nullable=True)  # List[str] of rationale
    ml_probability = Column(Float, nullable=True)    # AI model probability (0-1)
    assessment_mode = Column(String(30), nullable=True)  # AI_ASSISTED | RULE_BASED_FALLBACK

    # Relationships
    assessment = relationship("SkinAssessment", back_populates="concerns")


class RiskFactor(Base):
    __tablename__ = "risk_factors"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    assessment_id = Column(Uuid, ForeignKey("skin_assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    factor_type = Column(String, nullable=False)  # STRESS, SLEEP, HYDRATION, LIFESTYLE, ENVIRONMENT
    factor_name = Column(String, nullable=False)
    impact_level = Column(String, nullable=False)  # HIGH, MODERATE, LOW
    impact_score = Column(Integer, default=0, nullable=False)  # Penalty points deducted
    description = Column(Text, nullable=True)
    ml_probability = Column(Float, nullable=True)    # AI model probability (0-1)
    assessment_mode = Column(String(30), nullable=True)  # AI_ASSISTED | RULE_BASED_FALLBACK

    # Relationships
    assessment = relationship("SkinAssessment", back_populates="risk_factors")


class SkinScore(Base):
    __tablename__ = "skin_scores"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    assessment_id = Column(Uuid, ForeignKey("skin_assessments.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    skin_condition_score = Column(Integer, nullable=False)  # 35% weight
    lifestyle_score = Column(Integer, nullable=False)  # 20% weight
    sleep_score = Column(Integer, nullable=False)  # 15% weight
    routine_consistency_score = Column(Integer, default=50, nullable=False)  # 20% weight, baseline 50
    hydration_score = Column(Integer, nullable=False)  # 10% weight
    overall_score = Column(Integer, nullable=False)  # Weighted sum (0 - 100)
    explanation = Column(JSON, nullable=True)  # Detailed breakdown & strong/weak areas

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    assessment = relationship("SkinAssessment", back_populates="scores")
