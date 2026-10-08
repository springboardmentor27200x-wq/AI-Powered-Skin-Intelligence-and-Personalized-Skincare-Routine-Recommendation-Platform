import uuid
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, JSON, String, Text, func
from sqlalchemy.orm import relationship
from sqlalchemy.types import Uuid
from app.db.database import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    sender_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    connection_id = Column(Uuid, ForeignKey("professional_connections.id", ondelete="SET NULL"), nullable=True, index=True)

    message = Column(Text, nullable=False)
    message_type = Column(String, default="TEXT", nullable=False)  # TEXT, REFERRAL, PRESCRIPTION, CLINICAL_NOTE, IMAGE
    meta_data = Column(JSON, nullable=True)  # Structured payload (e.g. referral details, actives list)
    
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_chat_messages")
    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="received_chat_messages")
    connection = relationship("ProfessionalConnection")

    __table_args__ = (
        Index("idx_chat_thread", "sender_id", "recipient_id", "created_at"),
        Index("idx_chat_recipient_unread", "recipient_id", "is_read"),
    )
