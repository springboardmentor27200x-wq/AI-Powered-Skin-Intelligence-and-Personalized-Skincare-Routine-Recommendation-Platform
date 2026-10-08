from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import User, ConsultationRequest, Consultation
from ..schemas import (
    ConsultationRequestCreate,
    ConsultationRequestResponse,
    ConsultationRequestRespond,
)
from ..dependencies import get_current_user


router = APIRouter(
    prefix="/api/consultation-requests",
    tags=["Consultation Requests"],
)


# ==========================================================
# SEND CONSULTATION REQUEST
# ==========================================================

@router.post(
    "/",
    response_model=ConsultationRequestResponse,
)
def create_consultation_request(
    request: ConsultationRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # ------------------------------------------------------
    # Only normal users can send consultation requests
    # ------------------------------------------------------

    if current_user.role != "user":
        raise HTTPException(
            status_code=403,
            detail="Only users can send consultation requests",
        )

    # ------------------------------------------------------
    # Find available professional
    #
    # We select the professional with the fewest pending
    # consultation requests.
    # ------------------------------------------------------

    professional = (
        db.query(
            User,
            func.count(ConsultationRequest.id).label("pending_count"),
        )
        .outerjoin(
            ConsultationRequest,
            (
                ConsultationRequest.professional_id == User.id
            )
            & (
                ConsultationRequest.status == "pending"
            ),
        )
        .filter(
            User.role == request.professional_role
        )
        .group_by(User.id)
        .order_by(
            func.count(ConsultationRequest.id).asc(),
            User.id.asc(),
        )
        .first()
    )

    if not professional:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No {request.professional_role} is currently "
                "available. Please try again later."
            ),
        )

    selected_professional = professional[0]

    # ------------------------------------------------------
    # Prevent sending request to yourself
    # ------------------------------------------------------

    if selected_professional.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot send a consultation request to yourself",
        )

    # ------------------------------------------------------
    # Prevent duplicate pending request
    # ------------------------------------------------------

    existing_request = db.query(
        ConsultationRequest
    ).filter(
        ConsultationRequest.client_id == current_user.id,
        ConsultationRequest.professional_id == selected_professional.id,
        ConsultationRequest.status == "pending",
    ).first()

    if existing_request:
        raise HTTPException(
            status_code=400,
            detail=(
                "You already have a pending consultation request "
                "with an available professional."
            ),
        )

    # ------------------------------------------------------
    # Create consultation request
    # ------------------------------------------------------

    new_request = ConsultationRequest(
        client_id=current_user.id,
        professional_id=selected_professional.id,
        professional_role=selected_professional.role,
        request_message=request.request_message,
        status="pending",
        created_at=datetime.utcnow().isoformat(),
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return new_request


# ==========================================================
# GET MY SENT REQUESTS
# ==========================================================

@router.get(
    "/my-requests",
    response_model=list[ConsultationRequestResponse],
)
def get_my_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if current_user.role != "user":
        raise HTTPException(
            status_code=403,
            detail="Only users can view their consultation requests",
        )

    requests = (
        db.query(ConsultationRequest)
        .filter(
            ConsultationRequest.client_id == current_user.id
        )
        .order_by(
            ConsultationRequest.id.desc()
        )
        .all()
    )

    return requests


# ==========================================================
# GET RECEIVED REQUESTS
# ==========================================================

@router.get(
    "/received",
    response_model=list[ConsultationRequestResponse],
)
def get_received_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if current_user.role not in [
        "consultant",
        "dermatologist",
    ]:
        raise HTTPException(
            status_code=403,
            detail="Professional access required",
        )

    requests = (
        db.query(ConsultationRequest)
        .filter(
            ConsultationRequest.professional_id == current_user.id
        )
        .order_by(
            ConsultationRequest.id.desc()
        )
        .all()
    )

    return requests


# ==========================================================
# ACCEPT REQUEST
# ==========================================================

@router.put(
    "/{request_id}/accept",
    response_model=ConsultationRequestResponse,
)
def accept_consultation_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if current_user.role not in [
        "consultant",
        "dermatologist",
    ]:
        raise HTTPException(
            status_code=403,
            detail="Professional access required",
        )

    consultation_request = (
        db.query(ConsultationRequest)
        .filter(
            ConsultationRequest.id == request_id
        )
        .first()
    )

    if not consultation_request:
        raise HTTPException(
            status_code=404,
            detail="Consultation request not found",
        )

    if consultation_request.professional_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only manage requests sent to you",
        )

    if consultation_request.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="This request has already been processed",
        )

    consultation_request.status = "accepted"
    consultation_request.responded_at = (
        datetime.utcnow().isoformat()
    )

    db.commit()
    db.refresh(consultation_request)

    return consultation_request


# ==========================================================
# REJECT REQUEST
# ==========================================================

@router.put(
    "/{request_id}/reject",
    response_model=ConsultationRequestResponse,
)
def reject_consultation_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if current_user.role not in [
        "consultant",
        "dermatologist",
    ]:
        raise HTTPException(
            status_code=403,
            detail="Professional access required",
        )

    consultation_request = (
        db.query(ConsultationRequest)
        .filter(
            ConsultationRequest.id == request_id
        )
        .first()
    )

    if not consultation_request:
        raise HTTPException(
            status_code=404,
            detail="Consultation request not found",
        )

    if consultation_request.professional_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only manage requests sent to you",
        )

    if consultation_request.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="This request has already been processed",
        )

    consultation_request.status = "rejected"
    consultation_request.responded_at = (
        datetime.utcnow().isoformat()
    )

    db.commit()
    db.refresh(consultation_request)

    return consultation_request


# ==========================================================
# ADD PROFESSIONAL RESPONSE
# ==========================================================

@router.put(
    "/{request_id}/respond",
)
def respond_to_consultation_request(
    request_id: int,
    response: ConsultationRequestRespond,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # ------------------------------------------------------
    # Only professionals can respond
    # ------------------------------------------------------

    if current_user.role not in [
        "consultant",
        "dermatologist",
    ]:
        raise HTTPException(
            status_code=403,
            detail="Professional access required",
        )

    # ------------------------------------------------------
    # Find request
    # ------------------------------------------------------

    consultation_request = (
        db.query(ConsultationRequest)
        .filter(
            ConsultationRequest.id == request_id
        )
        .first()
    )

    if not consultation_request:
        raise HTTPException(
            status_code=404,
            detail="Consultation request not found",
        )

    # ------------------------------------------------------
    # Make sure this professional owns the request
    # ------------------------------------------------------

    if consultation_request.professional_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only respond to requests sent to you",
        )

    # ------------------------------------------------------
    # Request must be accepted first
    # ------------------------------------------------------

    if consultation_request.status != "accepted":
        raise HTTPException(
            status_code=400,
            detail="Consultation request must be accepted first",
        )

    # ------------------------------------------------------
    # Create consultation history record
    # ------------------------------------------------------

    new_consultation = Consultation(
        consultant_id=current_user.id,
        client_id=consultation_request.client_id,
        notes=response.notes,
        recommendations=response.recommendations,
        created_at=datetime.utcnow().isoformat(),
    )

    db.add(new_consultation)

    # ------------------------------------------------------
    # Mark request completed
    # ------------------------------------------------------

    consultation_request.status = "completed"
    consultation_request.responded_at = (
        datetime.utcnow().isoformat()
    )

    db.commit()

    db.refresh(new_consultation)
    db.refresh(consultation_request)

    return {
        "message": "Consultation response saved successfully",
        "request_id": consultation_request.id,
        "consultation_id": new_consultation.id,
        "status": consultation_request.status,
        "notes": new_consultation.notes,
        "recommendations": new_consultation.recommendations,
    }