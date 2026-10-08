import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, JSON, String, Text, func
from sqlalchemy.orm import relationship
from sqlalchemy.types import Uuid
from app.db.database import Base


class ProfessionalRecommendation(Base):
    __tablename__ = "professional_recommendations"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    connection_id = Column(Uuid, ForeignKey("professional_connections.id", ondelete="CASCADE"), nullable=True, index=True)
    professional_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    patient_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String, nullable=False)
    clinical_notes = Column(Text, nullable=False)
    prescribed_actives = Column(JSON, nullable=True)  # List[str]
    recommended_products = Column(JSON, nullable=True)  # List[Dict[str, Any]]
    contraindications = Column(JSON, nullable=True)  # List[str]
    follow_up_weeks = Column(Integer, default=4, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    connection = relationship("ProfessionalConnection")
    professional = relationship("User", foreign_keys=[professional_id], back_populates="given_recommendations")
    patient = relationship("User", foreign_keys=[patient_id], back_populates="received_recommendations")

    __table_args__ = (
        Index("idx_patient_created", "patient_id", "created_at"),
        Index("idx_prof_created", "professional_id", "created_at"),
    )
