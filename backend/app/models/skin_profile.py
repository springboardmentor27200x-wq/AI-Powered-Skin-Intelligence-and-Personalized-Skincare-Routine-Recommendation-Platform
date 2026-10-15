from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class SkinProfile(Base):
    __tablename__ = "skin_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    skin_type = Column(String(50), nullable=False)
    age_group = Column(String(50), nullable=False)
    skin_concerns = Column(JSON, default=list, nullable=False)
    allergies = Column(Text, nullable=True)
    sensitivities = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="skin_profile")

    def __repr__(self):
        return f"<SkinProfile id={self.id} user_id={self.user_id} skin_type={self.skin_type}>"
