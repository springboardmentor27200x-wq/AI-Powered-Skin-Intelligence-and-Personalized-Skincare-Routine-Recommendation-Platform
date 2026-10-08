from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Consultation
from ..schemas import ConsultationCreate, ConsultationResponse
from ..dependencies import get_current_user


router = APIRouter(
    prefix="/api/consultations",
    tags=["Consultations"]
)


# --------------------------------------------------
# CREATE CONSULTATION
# --------------------------------------------------
@router.post("/", response_model=ConsultationResponse)
def create_consultation(
    consultation: ConsultationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only consultants can create consultation records
    if current_user.role != "consultant":
        raise HTTPException(
            status_code=403,
            detail="Consultant access required"
        )

    # Make sure the consultant_id belongs to the logged-in consultant
    if consultation.consultant_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only create consultations as yourself"
        )

    # Check that the client exists
    client = db.query(User).filter(
        User.id == consultation.client_id
    ).first()

    if not client:
        raise HTTPException(
            status_code=404,
            detail="Client not found"
        )

    # Make sure the selected user is actually a normal client
    if client.role != "user":
        raise HTTPException(
            status_code=400,
            detail="Selected user is not a client"
        )

    new_consultation = Consultation(
        consultant_id=current_user.id,
        client_id=consultation.client_id,
        notes=consultation.notes,
        recommendations=consultation.recommendations,
        created_at=datetime.utcnow().isoformat()
    )

    db.add(new_consultation)
    db.commit()
    db.refresh(new_consultation)

    return new_consultation


# --------------------------------------------------
# GET CONSULTATIONS FOR A CLIENT
# --------------------------------------------------
@router.get("/client/{client_id}", response_model=list[ConsultationResponse])
def get_client_consultations(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only consultants and the client themselves can view
    # consultation records
    if current_user.role not in ["consultant", "user"]:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    # Normal users can only view their own consultations
    if current_user.role == "user" and current_user.id != client_id:
        raise HTTPException(
            status_code=403,
            detail="You can only view your own consultations"
        )

    client = db.query(User).filter(
        User.id == client_id
    ).first()

    if not client:
        raise HTTPException(
            status_code=404,
            detail="Client not found"
        )

    consultations = db.query(Consultation).filter(
        Consultation.client_id == client_id
    ).order_by(
        Consultation.id.desc()
    ).all()

    return consultations