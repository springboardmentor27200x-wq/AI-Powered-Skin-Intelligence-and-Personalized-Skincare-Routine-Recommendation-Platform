from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user, get_db, require_role
from app.models.connection import ProfessionalConnection
from app.models.user import User, UserProfile
from app.models.skin_profile import SkinProfile, UserSkinConcern, SkinConcern
from app.models.lifestyle import LifestyleRecord
from app.models.sleep import SleepRecord
from app.models.hydration import HydrationRecord
from app.models.environment import EnvironmentalExposureRecord
from app.models.chat import ChatMessage
from app.models.notification import NotificationCategory, NotificationPriority
from app.services.notification_service import NotificationService
from app.schemas.connection import (
    ConnectedClientSummary,
    AuthorizedClientDetailResponse,
    CareCircleMember,
    DirectoryUserSummary,
    ApproachRequest,
    ConnectionResponse,
)
from app.schemas.skin_profile import SkinProfileResponse, SkinConcernResponse
from app.schemas.lifestyle import LifestyleResponse
from app.schemas.sleep import SleepResponse
from app.schemas.hydration import HydrationResponse
from app.schemas.environment import EnvironmentResponse
from app.api.routes.connections import _format_connection_response

router = APIRouter()


@router.get("/all-users", response_model=List[DirectoryUserSummary])
def list_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SKINCARE_CONSULTANT"]))
):
    """
    List all platform users with their skin profiles, concerns, latest scores,
    and active connection status with the authenticated consultant.
    Enables consultants to discover clients and proactively approach them.
    """
    users = db.query(User).filter(User.role == "USER", User.is_active == True).all()

    # Pre-fetch connections of current consultant
    connections = db.query(ProfessionalConnection).filter(
        ProfessionalConnection.professional_id == current_user.id
    ).all()
    conn_map = {c.user_id: c for c in connections}

    summaries = []
    from app.services.assessment_service import AssessmentService
    for u in users:
        conn = conn_map.get(u.id)
        status_val = conn.status if conn else "NOT_CONNECTED"
        conn_id = conn.id if conn else None
        ref_by = conn.referrer.profile.name if (conn and conn.referrer and conn.referrer.profile) else None
        ref_notes = conn.referral_notes if conn else None
        ref_priority = conn.referral_priority if conn else None

        skin_prof = db.query(SkinProfile).filter(SkinProfile.user_id == u.id).first()
        skin_type = skin_prof.skin_type if skin_prof else "Not specified"
        concerns_list = [c.name for c in skin_prof.concerns] if skin_prof and skin_prof.concerns else []

        latest_assessment = AssessmentService.get_latest_assessment(db, u.id)
        latest_score = latest_assessment.overall_score if latest_assessment else None

        last_lifestyle = db.query(LifestyleRecord).filter(
            LifestyleRecord.user_id == u.id
        ).order_by(LifestyleRecord.created_at.desc()).first()

        summaries.append(DirectoryUserSummary(
            user_id=u.id,
            name=u.profile.name if u.profile else u.email.split("@")[0],
            email=u.email,
            age_group=u.profile.age_group if u.profile else None,
            location=u.profile.location if u.profile else None,
            skin_type=skin_type,
            concerns=concerns_list,
            latest_score=latest_score,
            connection_status=status_val,
            connection_id=conn_id,
            referred_by_id=conn.referred_by_id if conn else None,
            referred_by_name=ref_by,
            referral_notes=ref_notes,
            referral_priority=ref_priority,
            last_activity=last_lifestyle.created_at if last_lifestyle else None,
        ))

    return summaries


@router.post("/approach-user", response_model=ConnectionResponse)
def approach_user(
    payload: ApproachRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SKINCARE_CONSULTANT"]))
):
    """
    Consultant proactively approaches a user to offer skincare consultation.
    Sends a connection request (PENDING status) and notifies the acceptor user with the custom message.
    """
    target_user = db.query(User).filter(User.id == payload.user_id, User.is_active == True).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if target_user.role != "USER":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can only approach platform users")

    conn = db.query(ProfessionalConnection).filter(
        ProfessionalConnection.user_id == payload.user_id,
        ProfessionalConnection.professional_id == current_user.id
    ).first()

    now = datetime.now(timezone.utc)
    consultant_name = current_user.profile.name if current_user.profile else current_user.email.split("@")[0]
    user_name = target_user.profile.name if target_user.profile else target_user.email.split("@")[0]
    intro = payload.intro_message or f"Hello {user_name}! I am {consultant_name}, your platform Skincare Consultant. I reviewed your skin assessment and concerns, and would love to connect with you to guide your routine, analyze ingredient compatibility, and monitor your progress."

    if conn:
        if conn.status == "ACCEPTED":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You are already connected to this user.")
        if conn.status == "PENDING":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A connection request is already pending with this user.")
        conn.status = "PENDING"
        conn.initiator_id = current_user.id
        conn.referral_notes = intro
        conn.referral_priority = "PROFESSIONAL_APPROACH"
        conn.requested_at = now
        conn.responded_at = None
    else:
        conn = ProfessionalConnection(
            user_id=payload.user_id,
            professional_id=current_user.id,
            professional_type="SKINCARE_CONSULTANT",
            status="PENDING",
            initiator_id=current_user.id,
            referral_notes=intro,
            referral_priority="PROFESSIONAL_APPROACH",
            requested_at=now,
            responded_at=None,
        )
        db.add(conn)

    db.commit()
    db.refresh(conn)

    # Send Notification to the acceptor (target user)
    NotificationService.create_notification(
        db,
        user_id=payload.user_id,
        title=f"New Connection Request from {consultant_name} (Skincare Consultant)",
        message=f"You received a connection request from Skincare Consultant {consultant_name}. Message: \"{intro}\"",
        category=NotificationCategory.PLATFORM,
        priority=NotificationPriority.HIGH,
        action_url="/connections",
    )

    # Initial Chat message recorded in thread
    msg = ChatMessage(
        sender_id=current_user.id,
        recipient_id=payload.user_id,
        connection_id=conn.id,
        message=intro,
        message_type="TEXT"
    )
    db.add(msg)
    db.commit()

    return _format_connection_response(conn)


@router.get("/clients", response_model=List[ConnectedClientSummary])
def list_connected_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SKINCARE_CONSULTANT"]))
):
    """
    List all clients who have an active, ACCEPTED connection with the authenticated consultant.
    """
    connections = db.query(ProfessionalConnection).filter(
        ProfessionalConnection.professional_id == current_user.id,
        ProfessionalConnection.status == "ACCEPTED"
    ).all()

    client_summaries = []
    for conn in connections:
        client = conn.client
        if not client:
            continue

        # Fetch skin profile & concerns
        skin_prof = db.query(SkinProfile).filter(SkinProfile.user_id == client.id).first()
        skin_type = skin_prof.skin_type if skin_prof else "Not specified"
        concerns_list = [c.name for c in skin_prof.concerns] if skin_prof and skin_prof.concerns else []

        # Recent activity timestamp
        last_lifestyle = db.query(LifestyleRecord).filter(
            LifestyleRecord.user_id == client.id
        ).order_by(LifestyleRecord.created_at.desc()).first()

        referrer_name = conn.referrer.profile.name if (conn.referrer and conn.referrer.profile) else None

        client_summaries.append(ConnectedClientSummary(
            connection_id=conn.id,
            user_id=client.id,
            name=client.profile.name if client.profile else client.email.split("@")[0],
            email=client.email,
            age_group=client.profile.age_group if client.profile else None,
            location=client.profile.location if client.profile else None,
            skin_type=skin_type,
            concerns=concerns_list,
            connected_since=conn.responded_at or conn.requested_at,
            last_activity=last_lifestyle.created_at if last_lifestyle else conn.responded_at,
            referred_by_id=conn.referred_by_id,
            referred_by_name=referrer_name,
            referral_notes=conn.referral_notes,
            referral_priority=conn.referral_priority,
        ))

    return client_summaries


@router.get("/clients/{user_id}", response_model=AuthorizedClientDetailResponse)
def get_authorized_client_detail(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SKINCARE_CONSULTANT"]))
):
    """
    Retrieve comprehensive client details.
    Restricted to active accepted clients.
    """
    target_user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )

    # Check connection relationship
    connection = db.query(ProfessionalConnection).filter(
        ProfessionalConnection.user_id == user_id,
        ProfessionalConnection.professional_id == current_user.id
    ).first()

    if not connection or connection.status != "ACCEPTED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Client has not authorized this consultant to view their profile."
        )

    return _build_user_detail_response(db, target_user, current_user, connection)


@router.get("/inspect-user/{user_id}", response_model=AuthorizedClientDetailResponse)
def inspect_user_dossier(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SKINCARE_CONSULTANT", "ADMINISTRATOR"]))
):
    """
    Allows a Skincare Consultant to inspect any platform user's skin profile,
    conditions, allergies, sensitivities, latest assessment scores, active routine,
    and wellness telemetry so they have all details required to evaluate and cure problems.
    """
    target_user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    connection = db.query(ProfessionalConnection).filter(
        ProfessionalConnection.user_id == user_id,
        ProfessionalConnection.professional_id == current_user.id
    ).first()

    return _build_user_detail_response(db, target_user, current_user, connection)


def _build_user_detail_response(
    db: Session,
    target_user: User,
    current_user: User,
    connection: Optional[ProfessionalConnection] = None
) -> AuthorizedClientDetailResponse:
    # Fetch skin profile
    skin_prof = db.query(SkinProfile).filter(SkinProfile.user_id == target_user.id).first()
    skin_prof_data = SkinProfileResponse.model_validate(skin_prof) if skin_prof else None
    concerns_data = [SkinConcernResponse.model_validate(c) for c in skin_prof.concerns] if skin_prof and skin_prof.concerns else []

    # Fetch recent telemetry logs
    recent_lifestyle = db.query(LifestyleRecord).filter(
        LifestyleRecord.user_id == target_user.id
    ).order_by(LifestyleRecord.created_at.desc()).first()

    recent_sleep = db.query(SleepRecord).filter(
        SleepRecord.user_id == target_user.id
    ).order_by(SleepRecord.created_at.desc()).first()

    recent_hydration = db.query(HydrationRecord).filter(
        HydrationRecord.user_id == target_user.id
    ).order_by(HydrationRecord.created_at.desc()).first()

    recent_environment = db.query(EnvironmentalExposureRecord).filter(
        EnvironmentalExposureRecord.user_id == target_user.id
    ).order_by(EnvironmentalExposureRecord.created_at.desc()).first()

    # Fetch latest clinical assessment
    from app.services.assessment_service import AssessmentService
    from app.schemas.assessment import SkinAssessmentResponse
    latest_assessment_obj = AssessmentService.get_latest_assessment(db, target_user.id)
    latest_assessment_data = None
    if latest_assessment_obj:
        try:
            latest_assessment_data = SkinAssessmentResponse.model_validate(latest_assessment_obj)
        except Exception:
            pass

    # Fetch active routine plan
    from app.services.routine_service import RoutineService
    active_routine_data = RoutineService.get_active_routine_plan(db, target_user.id)

    # Fetch past recommendations
    from app.models.professional_recommendation import ProfessionalRecommendation
    recs_obj = (
        db.query(ProfessionalRecommendation)
        .filter(ProfessionalRecommendation.patient_id == target_user.id)
        .order_by(ProfessionalRecommendation.created_at.desc())
        .all()
    )
    past_recs = []
    for r in recs_obj:
        prof_name = r.professional.profile.name if (r.professional and r.professional.profile) else "Skincare Consultant"
        past_recs.append({
            "id": str(r.id),
            "title": r.title,
            "clinical_notes": r.clinical_notes,
            "prescribed_actives": r.prescribed_actives or [],
            "recommended_products": r.recommended_products or [],
            "contraindications": r.contraindications or [],
            "follow_up_weeks": r.follow_up_weeks,
            "professional_name": prof_name,
            "professional_role": r.professional.role if r.professional else "SKINCARE_CONSULTANT",
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    # Fetch other co-managing care team members for this client
    co_managing = db.query(ProfessionalConnection).filter(
        ProfessionalConnection.user_id == target_user.id,
        ProfessionalConnection.status == "ACCEPTED",
        ProfessionalConnection.professional_id != current_user.id
    ).all()

    collaborators = []
    for cm in co_managing:
        p = cm.professional
        if not p:
            continue
        p_name = p.profile.name if p.profile else p.email.split("@")[0]
        collaborators.append(CareCircleMember(
            connection_id=cm.id,
            user_id=p.id,
            name=p_name,
            email=p.email,
            role=p.role,
            care_role="Attending Dermatologist" if p.role == "DERMATOLOGIST" else "Consultant Colleague",
            status=cm.status,
            location=p.profile.location if p.profile else None,
            connected_since=cm.responded_at or cm.requested_at,
            referral_notes=cm.referral_notes,
            unread_messages=0
        ))

    referrer_name = connection.referrer.profile.name if (connection and connection.referrer and connection.referrer.profile) else None

    return AuthorizedClientDetailResponse(
        user_id=target_user.id,
        connection_id=connection.id if connection else None,
        status=connection.status if connection else "NOT_CONNECTED",
        connected_since=(connection.responded_at or connection.requested_at) if connection else None,
        name=target_user.profile.name if target_user.profile else target_user.email.split("@")[0],
        email=target_user.email,
        age_group=target_user.profile.age_group if target_user.profile else None,
        location=target_user.profile.location if target_user.profile else None,
        referred_by_id=connection.referred_by_id if connection else None,
        referred_by_name=referrer_name,
        referral_notes=connection.referral_notes if connection else None,
        referral_priority=connection.referral_priority if connection else None,
        collaborating_professionals=collaborators,
        skin_profile=skin_prof_data,
        concerns=concerns_data,
        recent_lifestyle=LifestyleResponse.model_validate(recent_lifestyle) if recent_lifestyle else None,
        recent_sleep=SleepResponse.model_validate(recent_sleep) if recent_sleep else None,
        recent_hydration=HydrationResponse.model_validate(recent_hydration) if recent_hydration else None,
        recent_environment=EnvironmentResponse.model_validate(recent_environment) if recent_environment else None,
        latest_assessment=latest_assessment_data,
        active_routine=active_routine_data,
        past_recommendations=past_recs,
    )
