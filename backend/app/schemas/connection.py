from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from app.schemas.skin_profile import SkinConcernResponse, SkinProfileResponse
from app.schemas.lifestyle import LifestyleResponse
from app.schemas.sleep import SleepResponse
from app.schemas.hydration import HydrationResponse
from app.schemas.environment import EnvironmentResponse


class ConnectionCreate(BaseModel):
    professional_id: UUID


class ReferralCreate(BaseModel):
    client_id: UUID
    dermatologist_id: UUID
    referral_notes: str
    priority: Optional[str] = "ROUTINE"  # ROUTINE, HIGH_PRIORITY, URGENT


class PublicProfessionalResponse(BaseModel):
    id: UUID
    name: str
    email: str
    role: str
    location: Optional[str] = None
    age_group: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ConnectionPartySummary(BaseModel):
    id: UUID
    email: str
    role: str
    name: str
    location: Optional[str] = None
    age_group: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ConnectionResponse(BaseModel):
    id: UUID
    user_id: UUID
    professional_id: UUID
    professional_type: str
    status: str  # PENDING, ACCEPTED, REJECTED, CANCELLED
    
    # Referral provenance
    referred_by_id: Optional[UUID] = None
    referred_by_name: Optional[str] = None
    referral_notes: Optional[str] = None
    referral_priority: Optional[str] = None
    initiator_id: Optional[UUID] = None
    initiator_name: Optional[str] = None
    initiator_role: Optional[str] = None

    requested_at: datetime
    responded_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    client: Optional[ConnectionPartySummary] = None
    professional: Optional[ConnectionPartySummary] = None

    model_config = ConfigDict(from_attributes=True)


class ConnectedClientSummary(BaseModel):
    connection_id: UUID
    user_id: UUID
    name: str
    email: Optional[str] = None
    age_group: Optional[str] = None
    location: Optional[str] = None
    skin_type: Optional[str] = None
    concerns: List[str] = []
    connected_since: Optional[datetime] = None
    last_activity: Optional[datetime] = None

    # Referral provenance
    referred_by_id: Optional[UUID] = None
    referred_by_name: Optional[str] = None
    referral_notes: Optional[str] = None
    referral_priority: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CareCircleMember(BaseModel):
    connection_id: UUID
    user_id: UUID
    name: str
    email: str
    role: str  # SKINCARE_CONSULTANT, DERMATOLOGIST, USER
    care_role: str  # e.g., "Primary Consultant", "Attending Dermatologist", "Client"
    status: str
    location: Optional[str] = None
    connected_since: Optional[datetime] = None
    referred_by_name: Optional[str] = None
    referral_notes: Optional[str] = None
    unread_messages: int = 0

    model_config = ConfigDict(from_attributes=True)


class CareCircleResponse(BaseModel):
    client_id: UUID
    client_name: str
    primary_consultant: Optional[CareCircleMember] = None
    attending_dermatologist: Optional[CareCircleMember] = None
    all_members: List[CareCircleMember] = []

    model_config = ConfigDict(from_attributes=True)


class AuthorizedClientDetailResponse(BaseModel):
    user_id: UUID
    connection_id: Optional[UUID] = None
    status: str = "NOT_CONNECTED"
    connected_since: Optional[datetime] = None
    
    # Basic User Information
    name: str
    email: str
    age_group: Optional[str] = None
    location: Optional[str] = None

    # Care Circle details (co-managing professionals)
    referred_by_id: Optional[UUID] = None
    referred_by_name: Optional[str] = None
    referral_notes: Optional[str] = None
    referral_priority: Optional[str] = None
    collaborating_professionals: List[CareCircleMember] = []

    # Skin Profile Information
    skin_profile: Optional[SkinProfileResponse] = None
    concerns: List[SkinConcernResponse] = []
    
    # Telemetry Log Overviews (Read-Only)
    recent_lifestyle: Optional[LifestyleResponse] = None
    recent_sleep: Optional[SleepResponse] = None
    recent_hydration: Optional[HydrationResponse] = None
    recent_environment: Optional[EnvironmentResponse] = None

    # Clinical Intelligence & Care Details
    latest_assessment: Optional[Any] = None
    active_routine: Optional[Any] = None
    past_recommendations: List[Any] = []

    model_config = ConfigDict(from_attributes=True)


class DirectoryUserSummary(BaseModel):
    user_id: UUID
    name: str
    email: str
    age_group: Optional[str] = None
    location: Optional[str] = None
    skin_type: Optional[str] = None
    concerns: List[str] = []
    latest_score: Optional[int] = None
    connection_status: str  # "ACCEPTED", "PENDING", "NOT_CONNECTED"
    connection_id: Optional[UUID] = None
    referred_by_id: Optional[UUID] = None
    referred_by_name: Optional[str] = None
    referral_notes: Optional[str] = None
    referral_priority: Optional[str] = None
    last_activity: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DirectoryConsultantSummary(BaseModel):
    user_id: UUID
    name: str
    email: str
    location: Optional[str] = None
    age_group: Optional[str] = None
    collaboration_status: str  # "COLLABORATING", "CONNECTED", "AVAILABLE"
    shared_clients_count: int = 0
    active_clients_count: int = 0
    connection_id: Optional[UUID] = None

    model_config = ConfigDict(from_attributes=True)


class ApproachRequest(BaseModel):
    user_id: UUID
    intro_message: Optional[str] = None


class ApproachConsultantRequest(BaseModel):
    consultant_id: UUID
    intro_message: Optional[str] = None
