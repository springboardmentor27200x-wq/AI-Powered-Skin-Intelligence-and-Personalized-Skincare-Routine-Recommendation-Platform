import uuid
from sqlalchemy import Column, DateTime, ForeignKey, String, func, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.types import Uuid
from app.db.database import Base


class ProfessionalConnection(Base):
    __tablename__ = "professional_connections"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    professional_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    professional_type = Column(String, nullable=False)  # SKINCARE_CONSULTANT, DERMATOLOGIST
    status = Column(String, default="PENDING", nullable=False)  # PENDING, ACCEPTED, REJECTED, CANCELLED
    
    # Referral provenance (when a Consultant refers a Dermatologist to a client)
    referred_by_id = Column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    referral_notes = Column(String, nullable=True)
    referral_priority = Column(String, default="ROUTINE", nullable=True)  # ROUTINE, HIGH_PRIORITY, URGENT, PROFESSIONAL_APPROACH, COLLEAGUE_APPROACH
    initiator_id = Column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    requested_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    responded_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    client = relationship("User", foreign_keys=[user_id], back_populates="sent_connections")
    professional = relationship("User", foreign_keys=[professional_id], back_populates="received_connections")
    referrer = relationship("User", foreign_keys=[referred_by_id])
    initiator = relationship("User", foreign_keys=[initiator_id])

    __table_args__ = (
        Index("idx_user_professional", "user_id", "professional_id"),
        Index("idx_prof_status", "professional_id", "status"),
    )
