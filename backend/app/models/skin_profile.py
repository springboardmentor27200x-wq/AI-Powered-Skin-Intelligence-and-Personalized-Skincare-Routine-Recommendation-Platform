import uuid
from sqlalchemy import Column, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import relationship
from sqlalchemy.types import Uuid
from app.db.database import Base


class UserSkinConcern(Base):
    __tablename__ = "user_skin_concerns"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    skin_profile_id = Column(Uuid, ForeignKey("skin_profiles.id", ondelete="CASCADE"), nullable=False)
    concern_id = Column(Uuid, ForeignKey("skin_concerns.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class SkinConcern(Base):
    __tablename__ = "skin_concerns"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    code = Column(String, unique=True, index=True, nullable=False)  # E.g. "ACNE"
    name = Column(String, nullable=False)  # E.g. "Acne"
    description = Column(Text, nullable=True)

    # Relationships
    skin_profiles = relationship("SkinProfile", secondary="user_skin_concerns", back_populates="concerns")


class SkinProfile(Base):
    __tablename__ = "skin_profiles"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    skin_type = Column(String, nullable=False)  # NORMAL, DRY, OILY, COMBINATION, SENSITIVE
    allergies = Column(Text, nullable=True)
    sensitivities = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="skin_profile")
    concerns = relationship("SkinConcern", secondary="user_skin_concerns", back_populates="skin_profiles")

