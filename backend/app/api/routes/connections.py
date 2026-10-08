from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user, get_db, require_role
from app.models.connection import ProfessionalConnection
from app.models.user import User, UserProfile
from app.models.chat import ChatMessage
from app.models.notification import NotificationCategory, NotificationPriority
from app.services.notification_service import NotificationService
from app.schemas.connection import (
    ConnectionCreate,
    ConnectionResponse,
    ConnectionPartySummary,
    ReferralCreate,
    CareCircleResponse,
    CareCircleMember,
)

router = APIRouter()


def _format_connection_response(conn: ProfessionalConnection) -> ConnectionResponse:
    client_summary = None
    if conn.client:
        client_summary = ConnectionPartySummary(
            id=conn.client.id,
            email=conn.client.email,
            role=conn.client.role,
            name=conn.client.profile.name if conn.client.profile else conn.client.email.split("@")[0],
            location=conn.client.profile.location if conn.client.profile else None,
            age_group=conn.client.profile.age_group if conn.client.profile else None,
        )

    prof_summary = None
    if conn.professional:
        prof_summary = ConnectionPartySummary(
            id=conn.professional.id,
            email=conn.professional.email,
            role=conn.professional.role,
            name=conn.professional.profile.name if conn.professional.profile else conn.professional.email.split("@")[0],
            location=conn.professional.profile.location if conn.professional.profile else None,
            age_group=conn.professional.profile.age_group if conn.professional.profile else None,
        )

    referrer_name = None
    if conn.referrer:
        referrer_name = conn.referrer.profile.name if conn.referrer.profile else conn.referrer.email.split("@")[0]

    initiator_name = None
    initiator_role = None
    if getattr(conn, "initiator", None):
        initiator_name = conn.initiator.profile.name if conn.initiator.profile else conn.initiator.email.split("@")[0]
        initiator_role = conn.initiator.role
    elif getattr(conn, "initiator_id", None):
        if client_summary and client_summary.id == conn.initiator_id:
            initiator_name = client_summary.name
            initiator_role = client_summary.role
        elif prof_summary and prof_summary.id == conn.initiator_id:
            initiator_name = prof_summary.name
            initiator_role = prof_summary.role

    return ConnectionResponse(
        id=conn.id,
        user_id=conn.user_id,
        professional_id=conn.professional_id,
        professional_type=conn.professional_type,
        status=conn.status,
        referred_by_id=conn.referred_by_id,
        referred_by_name=referrer_name,
        referral_notes=conn.referral_notes,
        referral_priority=conn.referral_priority,
        initiator_id=getattr(conn, "initiator_id", None),
        initiator_name=initiator_name,
        initiator_role=initiator_role,
        requested_at=conn.requested_at,
        responded_at=conn.responded_at,
        created_at=conn.created_at,
        updated_at=conn.updated_at,
        client=client_summary,
        professional=prof_summary,
    )


# ─────────────────────────────────────────────────────────────
# USER ENDPOINTS
# ─────────────────────────────────────────────────────────────

@router.post("", response_model=ConnectionResponse, status_code=status.HTTP_201_CREATED)
def create_connection_request(
    data: ConnectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["USER"]))
):
    """
    USER sends a connection request to a Consultant or Dermatologist.
    Enforces that target is an active professional and prevents duplicate pending/accepted requests.
    """
    if current_user.id == data.professional_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot connect to yourself"
        )

    # Check target user
    target_prof = db.query(User).filter(
        User.id == data.professional_id,
        User.is_active == True
    ).first()

    if not target_prof:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professional not found"
        )

    if target_prof.role not in ["SKINCARE_CONSULTANT", "DERMATOLOGIST"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Connection target must be a Skincare Consultant or Dermatologist"
        )

    # Check for existing active/pending connection
    existing = db.query(ProfessionalConnection).filter(
        ProfessionalConnection.user_id == current_user.id,
        ProfessionalConnection.professional_id == data.professional_id,
        ProfessionalConnection.status.in_(["PENDING", "ACCEPTED"])
    ).first()

    if existing:
        if existing.status == "PENDING":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A pending connection request already exists for this professional"
            )
        elif existing.status == "ACCEPTED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are already connected to this professional"
            )

    new_connection = ProfessionalConnection(
        user_id=current_user.id,
        professional_id=data.professional_id,
        professional_type=target_prof.role,
        status="PENDING",
        initiator_id=current_user.id,
        referral_priority="USER_REQUEST",
        requested_at=datetime.now(timezone.utc)
    )
    db.add(new_connection)
    db.commit()
    db.refresh(new_connection)

    # Send in-app notification to professional
    user_name = current_user.profile.name if current_user.profile else current_user.email.split("@")[0]
    NotificationService.create_notification(
        db,
        user_id=data.professional_id,
        title="New Connection Request",
        message=f"{user_name} sent you a connection request to join their care team.",
        category=NotificationCategory.PLATFORM,
        priority=NotificationPriority.MEDIUM,
    )

    return _format_connection_response(new_connection)


@router.get("/my", response_model=List[ConnectionResponse])
def get_my_connections(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["USER"]))
):
    """
    Get all connection requests initiated by the current USER (pending, accepted, rejected, cancelled).
    """
    connections = db.query(ProfessionalConnection).filter(
        ProfessionalConnection.user_id == current_user.id
    ).order_by(ProfessionalConnection.created_at.desc()).all()

    return [_format_connection_response(c) for c in connections]


@router.patch("/{id}/cancel", response_model=ConnectionResponse)
def cancel_or_disconnect(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["USER"]))
):
    """
    USER cancels a pending connection request or disconnects from an accepted professional.
    Immediately revokes professional access.
    """
    conn = db.query(ProfessionalConnection).filter(
        ProfessionalConnection.id == id,
        ProfessionalConnection.user_id == current_user.id
    ).first()

    if not conn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )

    if conn.status not in ["PENDING", "ACCEPTED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel a connection with status '{conn.status}'"
        )

    conn.status = "CANCELLED"
    conn.responded_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(conn)

    return _format_connection_response(conn)


# ─────────────────────────────────────────────────────────────
# MULTI-PARTY REFERRAL ENDPOINT: CONSULTANT ADDS DERMATOLOGIST
# ─────────────────────────────────────────────────────────────

@router.post("/refer", response_model=ConnectionResponse, status_code=status.HTTP_201_CREATED)
def refer_dermatologist_to_client(
    payload: ReferralCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SKINCARE_CONSULTANT", "ADMINISTRATOR"]))
):
    """
    Allows a Skincare Consultant to refer and connect a Dermatologist directly to an active client.
    This creates an authorized connection linking the client to the dermatologist with referral notes,
    notifies both parties, and introduces them via initial Care Circle clinical messages.
    """
    # 1. Verify consultant has an active ACCEPTED connection with client
    client_conn = db.query(ProfessionalConnection).filter(
        ProfessionalConnection.user_id == payload.client_id,
        ProfessionalConnection.professional_id == current_user.id,
        ProfessionalConnection.status == "ACCEPTED"
    ).first()

    if not client_conn and current_user.role != "ADMINISTRATOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only refer dermatologists to clients with whom you have an active, accepted connection."
        )

    client = db.query(User).filter(User.id == payload.client_id, User.is_active == True).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    # 2. Verify target is an active Dermatologist
    derma = db.query(User).filter(
        User.id == payload.dermatologist_id,
        User.role == "DERMATOLOGIST",
        User.is_active == True
    ).first()
    if not derma:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target dermatologist not found or is inactive."
        )

    client_name = client.profile.name if client.profile else client.email.split("@")[0]
    consultant_name = current_user.profile.name if current_user.profile else current_user.email.split("@")[0]
    derma_name = derma.profile.name if derma.profile else derma.email.split("@")[0]

    # 3. Check if connection already exists between client and dermatologist
    existing_conn = db.query(ProfessionalConnection).filter(
        ProfessionalConnection.user_id == payload.client_id,
        ProfessionalConnection.professional_id == payload.dermatologist_id
    ).first()

    priority = payload.priority or "ROUTINE"

    if existing_conn:
        existing_conn.status = "ACCEPTED"
        existing_conn.referred_by_id = current_user.id
        existing_conn.referral_notes = payload.referral_notes
        existing_conn.referral_priority = priority
        existing_conn.responded_at = datetime.now(timezone.utc)
        target_conn = existing_conn
    else:
        target_conn = ProfessionalConnection(
            user_id=payload.client_id,
            professional_id=payload.dermatologist_id,
            professional_type="DERMATOLOGIST",
            status="ACCEPTED",
            referred_by_id=current_user.id,
            referral_notes=payload.referral_notes,
            referral_priority=priority,
            requested_at=datetime.now(timezone.utc),
            responded_at=datetime.now(timezone.utc),
        )
        db.add(target_conn)

    db.commit()
    db.refresh(target_conn)

    # 4. Trigger in-app notifications to Client and Dermatologist
    NotificationService.create_notification(
        db,
        user_id=payload.client_id,
        title=f"Dermatologist Referral: Dr. {derma_name}",
        message=f"Your skincare consultant {consultant_name} has referred your care case to Dr. {derma_name}. Referral reason: {payload.referral_notes}",
        category=NotificationCategory.PLATFORM,
        priority=NotificationPriority.HIGH,
    )

    NotificationService.create_notification(
        db,
        user_id=payload.dermatologist_id,
        title=f"New Patient Referral from {consultant_name}",
        message=f"Consultant {consultant_name} referred patient {client_name} ({client.email}) to your care circle. Priority: {priority}. Rationale: {payload.referral_notes}",
        category=NotificationCategory.PLATFORM,
        priority=NotificationPriority.HIGH,
    )

    # 5. Create introductory WhatsApp-style Care Circle messages
    # Msg 1: From Consultant to Dermatologist
    referral_msg = ChatMessage(
        sender_id=current_user.id,
        recipient_id=payload.dermatologist_id,
        connection_id=target_conn.id,
        message=f"📋 Clinical Patient Referral: I have referred patient {client_name} to your care circle.\nPriority: {priority}\nClinical Rationale: {payload.referral_notes}",
        message_type="REFERRAL",
        meta_data={
            "client_id": str(payload.client_id),
            "client_name": client_name,
            "referral_notes": payload.referral_notes,
            "priority": priority,
            "consultant_name": consultant_name,
        }
    )
    db.add(referral_msg)

    # Msg 2: From Consultant to Client
    client_notice_msg = ChatMessage(
        sender_id=current_user.id,
        recipient_id=payload.client_id,
        connection_id=client_conn.id if client_conn else target_conn.id,
        message=f"✨ Care Circle Update: I have connected your profile with Dr. {derma_name} (Clinical Dermatologist) to review your active routine and clinical assessments. Both of us will now collaborate on your skin progress.",
        message_type="REFERRAL",
        meta_data={
            "dermatologist_id": str(payload.dermatologist_id),
            "dermatologist_name": derma_name,
            "referral_notes": payload.referral_notes,
        }
    )
    db.add(client_notice_msg)

    db.commit()

    return _format_connection_response(target_conn)


# ─────────────────────────────────────────────────────────────
# UNIFIED CARE CIRCLE ENDPOINT
# ─────────────────────────────────────────────────────────────

@router.get("/care-circle", response_model=CareCircleResponse)
def get_care_circle(
    client_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the unified care circle (Client, Primary Consultant, Attending Dermatologist, Collaborators).
    - If called by USER: returns their own care circle.
    - If called by Professional: can specify client_id to inspect that client's co-managing care circle.
    """
    target_client_id = current_user.id
    if current_user.role in ["SKINCARE_CONSULTANT", "DERMATOLOGIST", "ADMINISTRATOR"]:
        if client_id:
            target_client_id = client_id
        else:
            # If no client specified, fallback to current user
            target_client_id = current_user.id

    client = db.query(User).filter(User.id == target_client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    client_name = client.profile.name if client.profile else client.email.split("@")[0]

    # Find active connections for this client
    conns = db.query(ProfessionalConnection).filter(
        ProfessionalConnection.user_id == target_client_id,
        ProfessionalConnection.status == "ACCEPTED"
    ).all()

    primary_consultant = None
    attending_dermatologist = None
    all_members = []

    for c in conns:
        prof = c.professional
        if not prof:
            continue
        p_name = prof.profile.name if prof.profile else prof.email.split("@")[0]
        referrer_name = c.referrer.profile.name if (c.referrer and c.referrer.profile) else None

        # Count unread messages from this professional
        unread_count = db.query(ChatMessage).filter(
            ChatMessage.sender_id == prof.id,
            ChatMessage.recipient_id == current_user.id,
            ChatMessage.is_read == False
        ).count()

        member = CareCircleMember(
            connection_id=c.id,
            user_id=prof.id,
            name=p_name,
            email=prof.email,
            role=prof.role,
            care_role="Primary Skincare Consultant" if prof.role == "SKINCARE_CONSULTANT" else "Attending Dermatologist",
            status=c.status,
            location=prof.profile.location if prof.profile else None,
            connected_since=c.responded_at or c.requested_at,
            referred_by_name=referrer_name,
            referral_notes=c.referral_notes,
            unread_messages=unread_count,
        )
        all_members.append(member)

        if prof.role == "SKINCARE_CONSULTANT" and not primary_consultant:
            primary_consultant = member
        elif prof.role == "DERMATOLOGIST" and not attending_dermatologist:
            attending_dermatologist = member

    return CareCircleResponse(
        client_id=client.id,
        client_name=client_name,
        primary_consultant=primary_consultant,
        attending_dermatologist=attending_dermatologist,
        all_members=all_members,
    )


# ─────────────────────────────────────────────────────────────
# PROFESSIONAL ENDPOINTS
# ─────────────────────────────────────────────────────────────

@router.get("/requests", response_model=List[ConnectionResponse])
def get_incoming_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["USER", "SKINCARE_CONSULTANT", "DERMATOLOGIST"]))
):
    """
    Retrieves all pending incoming connection requests where current_user is the target (acceptor).
    """
    requests = db.query(ProfessionalConnection).filter(
        ProfessionalConnection.status == "PENDING",
        or_(
            and_(ProfessionalConnection.professional_id == current_user.id, ProfessionalConnection.initiator_id != current_user.id),
            and_(ProfessionalConnection.user_id == current_user.id, ProfessionalConnection.initiator_id != current_user.id),
            # Fallback for requests created without explicit initiator_id
            and_(ProfessionalConnection.professional_id == current_user.id, ProfessionalConnection.initiator_id == None)
        )
    ).order_by(ProfessionalConnection.requested_at.desc()).all()

    return [_format_connection_response(r) for r in requests]


@router.patch("/{id}/accept", response_model=ConnectionResponse)
def accept_connection_request(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["USER", "SKINCARE_CONSULTANT", "DERMATOLOGIST"]))
):
    """
    Accept an incoming connection request. Accessible to the acceptor (client user or professional).
    Establishes an active authorized connection.
    """
    conn = db.query(ProfessionalConnection).filter(
        ProfessionalConnection.id == id,
        or_(
            ProfessionalConnection.professional_id == current_user.id,
            ProfessionalConnection.user_id == current_user.id
        )
    ).first()

    if not conn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection request not found"
        )

    # Initiator cannot accept their own request
    if conn.initiator_id and conn.initiator_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot accept a connection request that you initiated."
        )

    if conn.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot accept request with status '{conn.status}'"
        )

    conn.status = "ACCEPTED"
    conn.responded_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(conn)

    # Notify requester
    requester_id = conn.initiator_id or (conn.user_id if current_user.id == conn.professional_id else conn.professional_id)
    current_user_name = current_user.profile.name if current_user.profile else current_user.email.split("@")[0]
    role_label = current_user.role.replace('_', ' ').title()
    NotificationService.create_notification(
        db,
        user_id=requester_id,
        title="Connection Request Accepted!",
        message=f"{current_user_name} ({role_label}) has accepted your connection request.",
        category=NotificationCategory.PLATFORM,
        priority=NotificationPriority.HIGH,
        action_url="/messages" if current_user.role == "USER" else "/connections",
    )

    return _format_connection_response(conn)


@router.patch("/{id}/reject", response_model=ConnectionResponse)
def reject_connection_request(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["USER", "SKINCARE_CONSULTANT", "DERMATOLOGIST"]))
):
    """
    Reject an incoming connection request addressed to the current user.
    """
    conn = db.query(ProfessionalConnection).filter(
        ProfessionalConnection.id == id,
        or_(
            ProfessionalConnection.professional_id == current_user.id,
            ProfessionalConnection.user_id == current_user.id
        )
    ).first()

    if not conn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection request not found"
        )

    if conn.initiator_id and conn.initiator_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot reject a request you initiated yourself. Use cancel instead."
        )

    if conn.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reject request with status '{conn.status}'"
        )

    conn.status = "REJECTED"
    conn.responded_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(conn)

    # Notify requester
    requester_id = conn.initiator_id or (conn.user_id if current_user.id == conn.professional_id else conn.professional_id)
    current_user_name = current_user.profile.name if current_user.profile else current_user.email.split("@")[0]
    NotificationService.create_notification(
        db,
        user_id=requester_id,
        title="Connection Request Declined",
        message=f"{current_user_name} declined your connection request.",
        category=NotificationCategory.PLATFORM,
        priority=NotificationPriority.MEDIUM,
    )

    return _format_connection_response(conn)
