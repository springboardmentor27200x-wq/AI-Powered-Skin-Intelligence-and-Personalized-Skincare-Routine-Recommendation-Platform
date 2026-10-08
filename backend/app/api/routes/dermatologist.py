from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, and_
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
    DirectoryConsultantSummary,
    ApproachRequest,
    ApproachConsultantRequest,
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
    current_user: User = Depends(require_role(["DERMATOLOGIST"]))
):
    """
    List all platform users with their skin profiles, concerns, latest scores,
    and active connection status with the authenticated dermatologist.
    Enables dermatologists to discover patients and proactively approach them.
    """
    users = db.query(User).filter(User.role == "USER", User.is_active == True).all()

    # Pre-fetch connections of current dermatologist
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


@router.get("/all-consultants", response_model=List[DirectoryConsultantSummary])
def list_all_consultants(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["DERMATOLOGIST"]))
):
    """
    List all registered Skincare Consultants on the platform so the dermatologist
    can discover, approach, and collaborate with them.
    """
    consultants = db.query(User).filter(
        User.role == "SKINCARE_CONSULTANT",
        User.is_active == True
    ).all()

    # Shared referred clients count
    referred_conns = db.query(ProfessionalConnection).filter(
        ProfessionalConnection.professional_id == current_user.id,
        ProfessionalConnection.referred_by_id.isnot(None)
    ).all()

    shared_counts = {}
    for rc in referred_conns:
        shared_counts[rc.referred_by_id] = shared_counts.get(rc.referred_by_id, 0) + 1

    summaries = []
    for c in consultants:
        # Active client count for this consultant
        active_count = db.query(ProfessionalConnection).filter(
            ProfessionalConnection.professional_id == c.id,
            ProfessionalConnection.status == "ACCEPTED"
        ).count()

        shared_count = shared_counts.get(c.id, 0)

        # Check direct colleague connection
        direct_conn = db.query(ProfessionalConnection).filter(
            or_(
                and_(ProfessionalConnection.user_id == c.id, ProfessionalConnection.professional_id == current_user.id),
                and_(ProfessionalConnection.user_id == current_user.id, ProfessionalConnection.professional_id == c.id),
            )
        ).first()

        if direct_conn:
            if direct_conn.status == "ACCEPTED":
                collab_status = "CONNECTED"
            elif direct_conn.status == "PENDING":
                collab_status = "PENDING"
            elif shared_count > 0:
                collab_status = "COLLABORATING"
            else:
                collab_status = "AVAILABLE"
        elif shared_count > 0:
            collab_status = "COLLABORATING"
        else:
            collab_status = "AVAILABLE"

        summaries.append(DirectoryConsultantSummary(
            user_id=c.id,
            name=c.profile.name if c.profile else c.email.split("@")[0],
            email=c.email,
            location=c.profile.location if c.profile else None,
            age_group=c.profile.age_group if c.profile else None,
            collaboration_status=collab_status,
            shared_clients_count=shared_count,
            active_clients_count=active_count,
            connection_id=direct_conn.id if direct_conn else None,
        ))

    return summaries


@router.post("/approach-user", response_model=ConnectionResponse)
def approach_patient(
    payload: ApproachRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["DERMATOLOGIST"]))
):
    """
    Dermatologist proactively approaches a user to offer clinical consultation.
    Creates a PENDING connection request, notifies the patient with custom message,
    and records an introductory chat message in the thread.
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
    derma_name = current_user.profile.name if current_user.profile else current_user.email.split("@")[0]
    user_name = target_user.profile.name if target_user.profile else target_user.email.split("@")[0]
    intro = payload.intro_message or f"Hello {user_name}! I am Dr. {derma_name}, clinical dermatologist. I reviewed your skin assessment scores and profile. I am here to provide medical oversight, analyze any severe concerns, and support your skin health journey. Feel free to message me anytime!"

    if conn:
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
            professional_type="DERMATOLOGIST",
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
        title=f"New Connection Request from Dr. {derma_name} (Dermatologist)",
        message=f"You received a connection request from Dermatologist Dr. {derma_name}. Message: \"{intro}\"",
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


@router.post("/approach-consultant")
def approach_consultant(
    payload: ApproachConsultantRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["DERMATOLOGIST"]))
):
    """
    Dermatologist initiates contact with a Skincare Consultant colleague for care circle collaboration.
    Creates a PENDING connection request, notifies the consultant with custom message,
    and records an introductory peer message.
    """
    consultant = db.query(User).filter(
        User.id == payload.consultant_id,
        User.role == "SKINCARE_CONSULTANT",
        User.is_active == True
    ).first()

    if not consultant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consultant not found")

    derma_name = current_user.profile.name if current_user.profile else current_user.email.split("@")[0]
    consultant_name = consultant.profile.name if consultant.profile else consultant.email.split("@")[0]
    intro = payload.intro_message or f"Hello {consultant_name}! I am Dr. {derma_name}, clinical dermatologist. I am reaching out to establish a direct collaborative referral channel with you. Whenever you have clients needing clinical diagnosis, active prescriptions, or severe concern review, please feel free to refer them to me or consult me directly!"

    # Record connection between dermatologist and consultant
    conn = db.query(ProfessionalConnection).filter(
        or_(
            and_(ProfessionalConnection.user_id == payload.consultant_id, ProfessionalConnection.professional_id == current_user.id),
            and_(ProfessionalConnection.user_id == current_user.id, ProfessionalConnection.professional_id == payload.consultant_id),
        )
    ).first()

    now = datetime.now(timezone.utc)
    if conn:
        conn.status = "PENDING"
        conn.initiator_id = current_user.id
        conn.referral_notes = intro
        conn.referral_priority = "COLLEAGUE_APPROACH"
        conn.requested_at = now
        conn.responded_at = None
    else:
        conn = ProfessionalConnection(
            user_id=payload.consultant_id,
            professional_id=current_user.id,
            professional_type="SKINCARE_CONSULTANT",
            status="PENDING",
            initiator_id=current_user.id,
            referral_notes=intro,
            referral_priority="COLLEAGUE_APPROACH",
            requested_at=now,
            responded_at=None,
        )
        db.add(conn)

    db.commit()
    db.refresh(conn)

    # Send Notification to the acceptor (consultant)
    NotificationService.create_notification(
        db,
        user_id=payload.consultant_id,
        title=f"New Colleague Connection Request from Dr. {derma_name} (Dermatologist)",
        message=f"You received a connection request from Dermatologist Dr. {derma_name}. Message: \"{intro}\"",
        category=NotificationCategory.PLATFORM,
        priority=NotificationPriority.HIGH,
        action_url="/consultant",
    )

    # Introductory Peer Message
    msg = ChatMessage(
        sender_id=current_user.id,
        recipient_id=payload.consultant_id,
        connection_id=conn.id,
        message=intro,
        message_type="TEXT"
    )
    db.add(msg)
    db.commit()

    return {
        "success": True,
        "message": f"Connection request sent to consultant {consultant_name}",
        "partner_id": str(consultant.id),
        "partner_name": consultant_name,
        "connection_id": str(conn.id),
        "status": "PENDING",
    }


@router.get("/patients", response_model=List[ConnectedClientSummary])
def list_connected_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["DERMATOLOGIST"]))
):
    """
    List all patients who have an active, ACCEPTED connection with the authenticated dermatologist.
    """
    connections = db.query(ProfessionalConnection).filter(
        ProfessionalConnection.professional_id == current_user.id,
        ProfessionalConnection.status == "ACCEPTED"
    ).all()

    patient_summaries = []
    for conn in connections:
        patient = conn.client
        if not patient:
            continue

        # Fetch skin profile & concerns
        skin_prof = db.query(SkinProfile).filter(SkinProfile.user_id == patient.id).first()
        skin_type = skin_prof.skin_type if skin_prof else "Not specified"
        concerns_list = [c.name for c in skin_prof.concerns] if skin_prof and skin_prof.concerns else []

        # Recent activity timestamp
        last_lifestyle = db.query(LifestyleRecord).filter(
            LifestyleRecord.user_id == patient.id
        ).order_by(LifestyleRecord.created_at.desc()).first()

        referrer_name = conn.referrer.profile.name if (conn.referrer and conn.referrer.profile) else None

        patient_summaries.append(ConnectedClientSummary(
            connection_id=conn.id,
            user_id=patient.id,
            name=patient.profile.name if patient.profile else patient.email.split("@")[0],
            email=patient.email,
            age_group=patient.profile.age_group if patient.profile else None,
            location=patient.profile.location if patient.profile else None,
            skin_type=skin_type,
            concerns=concerns_list,
            connected_since=conn.responded_at or conn.requested_at,
            last_activity=last_lifestyle.created_at if last_lifestyle else conn.responded_at,
            referred_by_id=conn.referred_by_id,
            referred_by_name=referrer_name,
            referral_notes=conn.referral_notes,
            referral_priority=conn.referral_priority,
        ))

    return patient_summaries


@router.get("/patients/{user_id}", response_model=AuthorizedClientDetailResponse)
def get_authorized_patient_detail(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["DERMATOLOGIST"]))
):
    """
    Retrieve comprehensive patient details.
    Restricted to active accepted patients.
    """
    target_user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    # Check connection relationship
    connection = db.query(ProfessionalConnection).filter(
        ProfessionalConnection.user_id == user_id,
        ProfessionalConnection.professional_id == current_user.id
    ).first()

    if not connection or connection.status != "ACCEPTED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Patient has not authorized this dermatologist to view their clinical data."
        )

    return _build_patient_detail_response(db, target_user, current_user, connection)


@router.get("/inspect-user/{user_id}", response_model=AuthorizedClientDetailResponse)
def inspect_user_dossier(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["DERMATOLOGIST", "ADMINISTRATOR"]))
):
    """
    Allows a Dermatologist to inspect any platform user's clinical skin profile,
    conditions, allergies, sensitivities, latest assessment scores, active routine,
    and wellness telemetry so they have all details required to evaluate and cure problems.
    """
    target_user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    connection = db.query(ProfessionalConnection).filter(
        ProfessionalConnection.user_id == user_id,
        ProfessionalConnection.professional_id == current_user.id
    ).first()

    return _build_patient_detail_response(db, target_user, current_user, connection)


def _build_patient_detail_response(
    db: Session,
    target_user: User,
    current_user: User,
    connection: Optional[ProfessionalConnection] = None
) -> AuthorizedClientDetailResponse:
    user_id = target_user.id

    # Fetch skin profile
    skin_prof = db.query(SkinProfile).filter(SkinProfile.user_id == user_id).first()
    skin_prof_data = SkinProfileResponse.model_validate(skin_prof) if skin_prof else None
    concerns_data = [SkinConcernResponse.model_validate(c) for c in skin_prof.concerns] if skin_prof and skin_prof.concerns else []

    # Fetch recent telemetry logs
    recent_lifestyle = db.query(LifestyleRecord).filter(
        LifestyleRecord.user_id == user_id
    ).order_by(LifestyleRecord.created_at.desc()).first()

    recent_sleep = db.query(SleepRecord).filter(
        SleepRecord.user_id == user_id
    ).order_by(SleepRecord.created_at.desc()).first()

    recent_hydration = db.query(HydrationRecord).filter(
        HydrationRecord.user_id == user_id
    ).order_by(HydrationRecord.created_at.desc()).first()

    recent_environment = db.query(EnvironmentalExposureRecord).filter(
        EnvironmentalExposureRecord.user_id == user_id
    ).order_by(EnvironmentalExposureRecord.created_at.desc()).first()

    # Fetch latest clinical assessment
    from app.services.assessment_service import AssessmentService
    from app.schemas.assessment import SkinAssessmentResponse
    latest_assessment_obj = AssessmentService.get_latest_assessment(db, user_id)
    latest_assessment_data = None
    if latest_assessment_obj:
        try:
            latest_assessment_data = SkinAssessmentResponse.model_validate(latest_assessment_obj)
        except Exception:
            pass

    # Fetch active routine plan
    from app.services.routine_service import RoutineService
    active_routine_data = RoutineService.get_active_routine_plan(db, user_id)

    # Fetch past recommendations
    from app.models.professional_recommendation import ProfessionalRecommendation
    recs_obj = (
        db.query(ProfessionalRecommendation)
        .filter(ProfessionalRecommendation.patient_id == user_id)
        .order_by(ProfessionalRecommendation.created_at.desc())
        .all()
    )
    past_recs = []
    for r in recs_obj:
        prof_name = r.professional.profile.name if (r.professional and r.professional.profile) else "Clinical Professional"
        past_recs.append({
            "id": str(r.id),
            "title": r.title,
            "clinical_notes": r.clinical_notes,
            "prescribed_actives": r.prescribed_actives or [],
            "recommended_products": r.recommended_products or [],
            "contraindications": r.contraindications or [],
            "follow_up_weeks": r.follow_up_weeks,
            "professional_name": prof_name,
            "professional_role": r.professional.role if r.professional else "DERMATOLOGIST",
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    # Fetch other co-managing care team members for this patient (e.g. referring consultant)
    co_managing = db.query(ProfessionalConnection).filter(
        ProfessionalConnection.user_id == user_id,
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
            care_role="Primary Skincare Consultant" if p.role == "SKINCARE_CONSULTANT" else "Clinical Specialist",
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
