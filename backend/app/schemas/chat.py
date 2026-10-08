from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class ChatMessageCreate(BaseModel):
    message: str
    message_type: Optional[str] = "TEXT"  # TEXT, REFERRAL, PRESCRIPTION, CLINICAL_NOTE, IMAGE
    meta_data: Optional[Dict[str, Any]] = None


class ChatMessageResponse(BaseModel):
    id: UUID
    sender_id: UUID
    recipient_id: UUID
    connection_id: Optional[UUID] = None
    message: str
    message_type: str
    meta_data: Optional[Dict[str, Any]] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatConversationSummary(BaseModel):
    partner_id: UUID
    partner_name: str
    partner_email: str
    partner_role: str
    partner_location: Optional[str] = None
    partner_age_group: Optional[str] = None
    care_team_role: str  # e.g., "Primary Skincare Consultant", "Attending Clinical Dermatologist", "Client Patient"
    connection_status: str  # ACCEPTED, PENDING
    connection_id: Optional[UUID] = None
    referred_by_name: Optional[str] = None
    last_message: Optional[str] = None
    last_message_type: Optional[str] = None
    last_message_at: Optional[datetime] = None
    last_message_sender_id: Optional[UUID] = None
    unread_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class QuickResponseSuggestion(BaseModel):
    id: str
    label: str
    text: str
    category: str
