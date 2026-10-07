from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base


class SkinProfile(Base):
    __tablename__ = "skin_profiles"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False
    )

    skin_type = Column(
        String(50),
        nullable=False
    )

    age_group = Column(
        String(50),
        nullable=False
    )

    # JSON lists of concerns, allergies, sensitivities
    skin_concerns = Column(
        JSON,
        nullable=False,
        default=list
    )

    allergies = Column(
        JSON,
        nullable=False,
        default=list
    )

    sensitivities = Column(
        JSON,
        nullable=False,
        default=list
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    user = relationship("User", back_populates="skin_profile")
