from datetime import datetime
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import get_current_user, get_db
from app.models.connection import ProfessionalConnection
from app.models.notification import NotificationCategory, NotificationPriority
from app.models.professional_recommendation import ProfessionalRecommendation
from app.models.user import User, UserProfile
from app.schemas.recommendation import (
    ProfessionalRecommendationCreate,
    ProfessionalRecommendationResponse,
)
from app.services.notification_service import NotificationService

router = APIRouter()


@router.post(
    "",
    response_model=ProfessionalRecommendationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create clinical advisory recommendation for connected patient",
)
def create_professional_recommendation(
    payload: ProfessionalRecommendationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Allows a Dermatologist or Skincare Consultant to prescribe clinical notes,
    recommended actives, product regimens, and contraindication guidance to a patient.
    """
    if current_user.role not in ["DERMATOLOGIST", "SKINCARE_CONSULTANT", "ADMINISTRATOR"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only verified Dermatologists, Skincare Consultants, or Admins can submit clinical recommendations.",
        )

    patient = db.query(User).filter(User.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found.",
        )

    # Check connection if professional is not admin
    connection_id = None
    if current_user.role != "ADMINISTRATOR":
        conn = (
            db.query(ProfessionalConnection)
            .filter(
                ProfessionalConnection.professional_id == current_user.id,
                ProfessionalConnection.user_id == payload.patient_id,
                ProfessionalConnection.status == "ACCEPTED",
            )
            .first()
        )
        if conn:
            connection_id = conn.id

    rec = ProfessionalRecommendation(
        connection_id=connection_id,
        professional_id=current_user.id,
        patient_id=payload.patient_id,
        title=payload.title,
        clinical_notes=payload.clinical_notes,
        prescribed_actives=payload.prescribed_actives or [],
        recommended_products=payload.recommended_products or [],
        contraindications=payload.contraindications or [],
        follow_up_weeks=payload.follow_up_weeks or 4,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    prof_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    prof_name = prof_profile.name if prof_profile else (current_user.email.split("@")[0].capitalize())

    role_label = (
        "Dermatologist"
        if current_user.role == "DERMATOLOGIST"
        else ("Skincare Consultant" if current_user.role == "SKINCARE_CONSULTANT" else "Clinical Specialist")
    )
    NotificationService.create_notification(
        db=db,
        user_id=payload.patient_id,
        title=f"New Prescription Regimen: {rec.title}",
        message=f"{role_label} {prof_name} has prescribed an updated clinical skincare regimen for you.",
        category=NotificationCategory.PLATFORM,
        priority=NotificationPriority.HIGH,
        action_url="/dashboard",
    )

    return ProfessionalRecommendationResponse(
        id=rec.id,
        connection_id=rec.connection_id,
        professional_id=rec.professional_id,
        patient_id=rec.patient_id,
        professional_name=prof_name,
        professional_role=current_user.role,
        title=rec.title,
        clinical_notes=rec.clinical_notes,
        prescribed_actives=rec.prescribed_actives,
        recommended_products=rec.recommended_products,
        contraindications=rec.contraindications,
        follow_up_weeks=rec.follow_up_weeks,
        created_at=rec.created_at,
    )


@router.get(
    "/my",
    response_model=List[ProfessionalRecommendationResponse],
    summary="Get all clinical recommendations received by current patient",
)
def get_my_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns clinical advisories and doctor prescriptions submitted for the logged-in user.
    """
    recs = (
        db.query(ProfessionalRecommendation)
        .options(
            joinedload(ProfessionalRecommendation.professional).joinedload(User.profile)
        )
        .filter(ProfessionalRecommendation.patient_id == current_user.id)
        .order_by(desc(ProfessionalRecommendation.created_at))
        .all()
    )

    results = []
    for r in recs:
        p_name = None
        p_role = None
        if r.professional:
            p_role = r.professional.role
            if r.professional.profile:
                p_name = r.professional.profile.name
            else:
                p_name = r.professional.email.split("@")[0].capitalize()

        results.append(
            ProfessionalRecommendationResponse(
                id=r.id,
                connection_id=r.connection_id,
                professional_id=r.professional_id,
                patient_id=r.patient_id,
                professional_name=p_name or "Dermatologist Advisory",
                professional_role=p_role or "DERMATOLOGIST",
                title=r.title,
                clinical_notes=r.clinical_notes,
                prescribed_actives=r.prescribed_actives or [],
                recommended_products=r.recommended_products or [],
                contraindications=r.contraindications or [],
                follow_up_weeks=r.follow_up_weeks,
                created_at=r.created_at,
            )
        )
    return results


@router.get(
    "/patient/{patient_id}",
    response_model=List[ProfessionalRecommendationResponse],
    summary="Get recommendations for a specific patient (for connected doctor)",
)
def get_patient_recommendations(
    patient_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Allows a doctor or consultant to view previously issued recommendations for their patient.
    """
    if current_user.role not in ["DERMATOLOGIST", "SKINCARE_CONSULTANT", "ADMINISTRATOR"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to dermatologists and consultants.",
        )

    recs = (
        db.query(ProfessionalRecommendation)
        .options(
            joinedload(ProfessionalRecommendation.professional).joinedload(User.profile)
        )
        .filter(ProfessionalRecommendation.patient_id == patient_id)
        .order_by(desc(ProfessionalRecommendation.created_at))
        .all()
    )

    results = []
    for r in recs:
        p_name = None
        p_role = None
        if r.professional:
            p_role = r.professional.role
            if r.professional.profile:
                p_name = r.professional.profile.name
            else:
                p_name = r.professional.email.split("@")[0].capitalize()

        results.append(
            ProfessionalRecommendationResponse(
                id=r.id,
                connection_id=r.connection_id,
                professional_id=r.professional_id,
                patient_id=r.patient_id,
                professional_name=p_name or "Clinical Consultant",
                professional_role=p_role or "DERMATOLOGIST",
                title=r.title,
                clinical_notes=r.clinical_notes,
                prescribed_actives=r.prescribed_actives or [],
                recommended_products=r.recommended_products or [],
                contraindications=r.contraindications or [],
                follow_up_weeks=r.follow_up_weeks,
                created_at=r.created_at,
            )
        )
    return results


from pydantic import BaseModel as _PydanticBase


class PatientInquiryCreate(_PydanticBase):
    professional_id: uuid.UUID
    title: Optional[str] = None
    subject: Optional[str] = None
    message: str


@router.post(
    "/inquiry",
    response_model=ProfessionalRecommendationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit patient clinical inquiry to connected professional",
)
def submit_patient_inquiry(
    payload: PatientInquiryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Allows a patient to submit an inquiry, clinical question, or routine update request
    to their connected Dermatologist or Skincare Consultant.
    """
    # Verify active connection
    conn = (
        db.query(ProfessionalConnection)
        .filter(
            ProfessionalConnection.user_id == current_user.id,
            ProfessionalConnection.professional_id == payload.professional_id,
            ProfessionalConnection.status == "ACCEPTED",
        )
        .first()
    )
    if not conn:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must have an accepted connection with this professional to send inquiries.",
        )

    topic = payload.title or payload.subject or "Clinical Inquiry"
    # Record inquiry in recommendations log
    rec = ProfessionalRecommendation(
        connection_id=conn.id,
        professional_id=payload.professional_id,
        patient_id=current_user.id,
        title=f"[Patient Inquiry] {topic}",
        clinical_notes=payload.message,
        prescribed_actives=[],
        recommended_products=[],
        contraindications=[],
        follow_up_weeks=1,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    patient_name = current_user.profile.name if current_user.profile else current_user.email.split("@")[0]

    return ProfessionalRecommendationResponse(
        id=rec.id,
        connection_id=rec.connection_id,
        professional_id=rec.professional_id,
        patient_id=rec.patient_id,
        professional_name=f"Inquiry from {patient_name}",
        professional_role="PATIENT_INQUIRY",
        title=rec.title,
        clinical_notes=rec.clinical_notes,
        prescribed_actives=[],
        recommended_products=[],
        contraindications=[],
        follow_up_weeks=1,
        created_at=rec.created_at,
    )
