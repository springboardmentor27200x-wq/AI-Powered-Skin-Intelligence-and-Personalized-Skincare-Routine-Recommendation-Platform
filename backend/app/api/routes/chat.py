from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, and_, desc
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user, get_db
from app.models.chat import ChatMessage
from app.models.connection import ProfessionalConnection
from app.models.user import User, UserProfile
from app.models.notification import NotificationCategory, NotificationPriority
from app.services.notification_service import NotificationService
from app.schemas.chat import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatConversationSummary,
    QuickResponseSuggestion,
)

router = APIRouter()


def _get_care_role_label(current_user: User, partner: User) -> str:
    if partner.role == "DERMATOLOGIST":
        return "Attending Clinical Dermatologist"
    elif partner.role == "SKINCARE_CONSULTANT":
        return "Primary Skincare Consultant"
    elif partner.role == "ADMINISTRATOR":
        return "Platform Administrator"
    elif current_user.role in ["SKINCARE_CONSULTANT", "DERMATOLOGIST"]:
        return "Care Circle Patient"
    return "Care Team Member"


def _verify_can_chat(db: Session, user1: User, user2: User) -> bool:
    """Verifies that user1 is authorized to chat with user2."""
    if user1.id == user2.id:
        return False
    if "ADMINISTRATOR" in [user1.role, user2.role]:
        return True

    # Allow professionals (Consultant / Dermatologist) to approach and chat with any user or colleague
    if user1.role in ["SKINCARE_CONSULTANT", "DERMATOLOGIST"] or user2.role in ["SKINCARE_CONSULTANT", "DERMATOLOGIST"]:
        return True

    # Check direct connection (Client <-> Professional)
    direct_conn = db.query(ProfessionalConnection).filter(
        or_(
            and_(ProfessionalConnection.user_id == user1.id, ProfessionalConnection.professional_id == user2.id),
            and_(ProfessionalConnection.user_id == user2.id, ProfessionalConnection.professional_id == user1.id)
        ),
        ProfessionalConnection.status.in_(["ACCEPTED", "PENDING"])
    ).first()
    if direct_conn:
        return True

    # Check professional-to-professional collaboration (e.g. Consultant referring to Dermatologist)
    if user1.role in ["SKINCARE_CONSULTANT", "DERMATOLOGIST"] and user2.role in ["SKINCARE_CONSULTANT", "DERMATOLOGIST"]:
        # If either referred a client to the other
        shared_referral = db.query(ProfessionalConnection).filter(
            or_(
                and_(ProfessionalConnection.referred_by_id == user1.id, ProfessionalConnection.professional_id == user2.id),
                and_(ProfessionalConnection.referred_by_id == user2.id, ProfessionalConnection.professional_id == user1.id)
            )
        ).first()
        if shared_referral:
            return True
        # If both are professionals, allow peer consultation
        return True

    # Check if there is existing message history
    has_history = db.query(ChatMessage).filter(
        or_(
            and_(ChatMessage.sender_id == user1.id, ChatMessage.recipient_id == user2.id),
            and_(ChatMessage.sender_id == user2.id, ChatMessage.recipient_id == user1.id)
        )
    ).first()
    return has_history is not None


# ─────────────────────────────────────────────────────────────
# CONVERSATIONS & CHANNELS
# ─────────────────────────────────────────────────────────────

@router.get("/conversations", response_model=List[ChatConversationSummary])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns WhatsApp-style conversation list with latest messages, unread counts,
    and care team roles for all connected contacts.
    """
    partner_ids = set()

    # 1. Connected users via ProfessionalConnection
    if current_user.role == "USER":
        conns = db.query(ProfessionalConnection).filter(
            ProfessionalConnection.user_id == current_user.id,
            ProfessionalConnection.status.in_(["ACCEPTED", "PENDING"])
        ).all()
        for c in conns:
            partner_ids.add(c.professional_id)
    else:
        # Professional: add connected clients
        conns = db.query(ProfessionalConnection).filter(
            ProfessionalConnection.professional_id == current_user.id,
            ProfessionalConnection.status.in_(["ACCEPTED", "PENDING"])
        ).all()
        for c in conns:
            partner_ids.add(c.user_id)
            if c.referred_by_id and c.referred_by_id != current_user.id:
                partner_ids.add(c.referred_by_id)

        # Also add any referrals consultant made to other dermatologists
        if current_user.role == "SKINCARE_CONSULTANT":
            made_referrals = db.query(ProfessionalConnection).filter(
                ProfessionalConnection.referred_by_id == current_user.id
            ).all()
            for r in made_referrals:
                partner_ids.add(r.professional_id)

    # 2. Any user with whom there is message history
    msgs = db.query(ChatMessage.sender_id, ChatMessage.recipient_id).filter(
        or_(ChatMessage.sender_id == current_user.id, ChatMessage.recipient_id == current_user.id)
    ).all()
    for s_id, r_id in msgs:
        partner_ids.add(r_id if s_id == current_user.id else s_id)

    # Remove self if present
    partner_ids.discard(current_user.id)

    conversations = []
    for p_id in partner_ids:
        partner = db.query(User).filter(User.id == p_id, User.is_active == True).first()
        if not partner:
            continue

        p_name = partner.profile.name if partner.profile else partner.email.split("@")[0]
        care_role = _get_care_role_label(current_user, partner)

        # Connection status & referral details
        conn = db.query(ProfessionalConnection).filter(
            or_(
                and_(ProfessionalConnection.user_id == current_user.id, ProfessionalConnection.professional_id == p_id),
                and_(ProfessionalConnection.user_id == p_id, ProfessionalConnection.professional_id == current_user.id)
            )
        ).first()

        status_label = conn.status if conn else "ACCEPTED"
        referrer_name = conn.referrer.profile.name if (conn and conn.referrer and conn.referrer.profile) else None

        # Fetch last message
        last_msg = db.query(ChatMessage).filter(
            or_(
                and_(ChatMessage.sender_id == current_user.id, ChatMessage.recipient_id == p_id),
                and_(ChatMessage.sender_id == p_id, ChatMessage.recipient_id == current_user.id)
            )
        ).order_by(ChatMessage.created_at.desc()).first()

        # Count unread messages from this partner
        unread_count = db.query(ChatMessage).filter(
            ChatMessage.sender_id == p_id,
            ChatMessage.recipient_id == current_user.id,
            ChatMessage.is_read == False
        ).count()

        conversations.append(ChatConversationSummary(
            partner_id=partner.id,
            partner_name=p_name,
            partner_email=partner.email,
            partner_role=partner.role,
            partner_location=partner.profile.location if partner.profile else None,
            partner_age_group=partner.profile.age_group if partner.profile else None,
            care_team_role=care_role,
            connection_status=status_label,
            connection_id=conn.id if conn else None,
            referred_by_name=referrer_name,
            last_message=last_msg.message if last_msg else None,
            last_message_type=last_msg.message_type if last_msg else None,
            last_message_at=last_msg.created_at if last_msg else None,
            last_message_sender_id=last_msg.sender_id if last_msg else None,
            unread_count=unread_count,
        ))

    # Sort conversations by last message timestamp descending
    conversations.sort(
        key=lambda c: c.last_message_at or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True
    )

    return conversations


# ─────────────────────────────────────────────────────────────
# MESSAGE THREAD (GET & POST)
# ─────────────────────────────────────────────────────────────

@router.get("/{partner_id}/messages", response_model=List[ChatMessageResponse])
def get_thread_messages(
    partner_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns full chronological message history with partner.
    Automatically marks incoming messages from partner as read.
    """
    partner = db.query(User).filter(User.id == partner_id, User.is_active == True).first()
    if not partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat partner not found.")

    if not _verify_can_chat(db, current_user, partner):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to message this user without an active Care Team connection."
        )

    # Fetch messages
    messages = db.query(ChatMessage).filter(
        or_(
            and_(ChatMessage.sender_id == current_user.id, ChatMessage.recipient_id == partner_id),
            and_(ChatMessage.sender_id == partner_id, ChatMessage.recipient_id == current_user.id)
        )
    ).order_by(ChatMessage.created_at.asc()).all()

    # Mark unread incoming messages as read
    now_utc = datetime.now(timezone.utc)
    unread_msgs = [m for m in messages if m.recipient_id == current_user.id and not m.is_read]
    if unread_msgs:
        for m in unread_msgs:
            m.is_read = True
            m.read_at = now_utc
        db.commit()

    return messages


@router.post("/{partner_id}/messages", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    partner_id: UUID,
    payload: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sends a WhatsApp-style message to a connected Care Team contact.
    Dispatches real-time in-app notification to the recipient.
    """
    partner = db.query(User).filter(User.id == partner_id, User.is_active == True).first()
    if not partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat recipient not found.")

    if not _verify_can_chat(db, current_user, partner):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must have an authorized connection to send messages to this user."
        )

    # Find connection id if exists
    conn = db.query(ProfessionalConnection).filter(
        or_(
            and_(ProfessionalConnection.user_id == current_user.id, ProfessionalConnection.professional_id == partner_id),
            and_(ProfessionalConnection.user_id == partner_id, ProfessionalConnection.professional_id == current_user.id)
        )
    ).first()

    new_msg = ChatMessage(
        sender_id=current_user.id,
        recipient_id=partner_id,
        connection_id=conn.id if conn else None,
        message=payload.message.strip(),
        message_type=payload.message_type or "TEXT",
        meta_data=payload.meta_data,
        is_read=False,
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)

    # In-app notification to recipient
    sender_name = current_user.profile.name if current_user.profile else current_user.email.split("@")[0]
    NotificationService.create_notification(
        db,
        user_id=partner_id,
        title=f"Message from {sender_name}",
        message=payload.message[:100] + ("..." if len(payload.message) > 100 else ""),
        category=NotificationCategory.PLATFORM,
        priority=NotificationPriority.MEDIUM,
    )

    return new_msg


@router.patch("/{partner_id}/read")
def mark_thread_read(
    partner_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Explicitly marks all unread incoming messages from partner as read.
    """
    now_utc = datetime.now(timezone.utc)
    count = db.query(ChatMessage).filter(
        ChatMessage.sender_id == partner_id,
        ChatMessage.recipient_id == current_user.id,
        ChatMessage.is_read == False
    ).update({"is_read": True, "read_at": now_utc})
    db.commit()

    return {"status": "success", "marked_read": count}


# ─────────────────────────────────────────────────────────────
# QUICK CLINICAL CHIPS
# ─────────────────────────────────────────────────────────────

@router.get("/suggestions", response_model=List[QuickResponseSuggestion])
def get_quick_response_chips(current_user: User = Depends(get_current_user)):
    """
    Returns role-aware quick-response clinical prompt chips for instant chat replies.
    """
    if current_user.role == "SKINCARE_CONSULTANT":
        return [
            QuickResponseSuggestion(
                id="c1",
                label="Barrier Repair Check",
                text="Please monitor your skin barrier over the next 48 hours. If you feel any tingling, pause active serums and focus on ceramide hydration.",
                category="Advisory"
            ),
            QuickResponseSuggestion(
                id="c2",
                label="Sunscreen Reminder",
                text="Ensure you are reapplying broad-spectrum SPF 50 every 2 hours when outdoors to prevent post-inflammatory hyperpigmentation.",
                category="Sun Protection"
            ),
            QuickResponseSuggestion(
                id="c3",
                label="Retinoid Tolerance",
                text="Start using the prescribed retinoid active 2 nights per week using the sandwich moisturization technique.",
                category="Actives"
            ),
            QuickResponseSuggestion(
                id="c4",
                label="Weekly Log Request",
                text="Could you log your daily hydration and sleep in the DermaIQ tracker so we can correlate changes with your skin indices?",
                category="Tracking"
            ),
        ]
    elif current_user.role == "DERMATOLOGIST":
        return [
            QuickResponseSuggestion(
                id="d1",
                label="Prescription Regimen",
                text="I have reviewed your clinical assessment scores and formulated a targeted medical regimen. Check the prescription card in your chat.",
                category="Prescription"
            ),
            QuickResponseSuggestion(
                id="d2",
                label="Inflammation Protocol",
                text="Given the active redness observed, please pause all chemical exfoliants (AHA/BHA) and switch to a gentle non-foaming cleanser.",
                category="Clinical"
            ),
            QuickResponseSuggestion(
                id="d3",
                label="Follow-Up Review",
                text="Let's schedule a clinical check-in in 3 weeks to evaluate your skin tolerance and adjust active dosages.",
                category="Review"
            ),
            QuickResponseSuggestion(
                id="d4",
                label="Consultant Collaboration",
                text="I have coordinated with your skincare consultant to align on your morning and evening routine steps.",
                category="Care Circle"
            ),
        ]
    else:  # USER
        return [
            QuickResponseSuggestion(
                id="u1",
                label="Mild Irritation",
                text="I experienced some mild redness and stinging after my evening routine yesterday.",
                category="Inquiry"
            ),
            QuickResponseSuggestion(
                id="u2",
                label="Routine Question",
                text="Should I apply my hyaluronic acid serum before or after my active treatment step?",
                category="Question"
            ),
            QuickResponseSuggestion(
                id="u3",
                label="Skin Progress Update",
                text="My skin texture is noticeably smoother this week and hydration feels balanced!",
                category="Progress"
            ),
            QuickResponseSuggestion(
                id="u4",
                label="Product Compatibility",
                text="Could you review if my new sunscreen is compatible with my active routine?",
                category="Compatibility"
            ),
        ]
