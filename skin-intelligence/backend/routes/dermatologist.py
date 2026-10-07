"""
Dermatologist & Clinical Specialist Routes
-------------------------------------------
Endpoints:
  GET  /api/dermatologist/patients              — List all patient profiles, assessments & texture scans
  GET  /api/dermatologist/catalog               — Query complete product catalog with clinical filters
  POST /api/dermatologist/prescribe             — Create a clinical routine & product prescription for a patient
  GET  /api/dermatologist/prescriptions/patient/{id} — View prescriptions for a patient
  GET  /api/dermatologist/my-prescription       — Patient endpoint to get active dermatologist prescription
"""

from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models.user import User, UserRole
from models.skin_profile import SkinProfile
from models.skin_assessment import SkinAssessment
from models.skin_texture import SkinTextureAnalysis
from models.product import Product
from models.dermatologist_prescription import DermatologistPrescription
from utils.auth import get_current_user

router = APIRouter(prefix="/api/dermatologist", tags=["Dermatologist Clinical Portal"])


class PrescribeRequest(BaseModel):
    patient_id: int
    diagnosis: str
    clinical_focus: Optional[str] = "Barrier Repair & Sebum Regulation"
    clinical_notes: Optional[str] = ""
    review_period_weeks: Optional[int] = 4
    prescribed_am_routine: List[dict]
    prescribed_pm_routine: List[dict]
    prescribed_treatments: Optional[List[dict]] = []


# ============================================================
# GET /api/dermatologist/patients
# ============================================================

@router.get("/patients")
def get_all_patients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns list of all patients with their profile, latest assessment, and AI texture scans.
    Accessible by DERMATOLOGIST, SKINCARE_CONSULTANT, and ADMIN.
    """
    users = db.query(User).filter(User.role == UserRole.USER).all()
    patients_data = []

    for u in users:
        profile = db.query(SkinProfile).filter(SkinProfile.user_id == u.id).first()
        latest_assessment = (
            db.query(SkinAssessment)
            .filter(SkinAssessment.user_id == u.id)
            .order_by(SkinAssessment.created_at.desc())
            .first()
        )
        latest_texture = (
            db.query(SkinTextureAnalysis)
            .filter(SkinTextureAnalysis.user_id == u.id)
            .order_by(SkinTextureAnalysis.created_at.desc())
            .first()
        )
        active_prescription = (
            db.query(DermatologistPrescription)
            .filter(DermatologistPrescription.patient_id == u.id)
            .order_by(DermatologistPrescription.created_at.desc())
            .first()
        )

        patients_data.append({
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "registered_at": u.created_at,
            "skin_type": profile.skin_type if profile else "Not Set",
            "age_group": profile.age_group if profile else "Not Set",
            "concerns": profile.skin_concerns if profile else [],
            "allergies": profile.allergies if profile else [],
            "sensitivities": profile.sensitivities if profile else [],
            "latest_assessment_score": latest_assessment.overall_score if latest_assessment else None,
            "latest_texture_score": latest_texture.overall_texture_score if latest_texture else None,
            "texture_type": latest_texture.texture_type if latest_texture else None,
            "texture_primary_concern": latest_texture.primary_concern if latest_texture else None,
            "has_prescription": active_prescription is not None,
            "last_prescription_date": active_prescription.created_at if active_prescription else None,
        })

    return patients_data


# ============================================================
# GET /api/dermatologist/catalog
# ============================================================

@router.get("/catalog")
def get_product_catalog(
    category: Optional[str] = None,
    product_type_tag: Optional[str] = None,
    concern: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Search and filter the complete dermatology and trendy product catalog.
    """
    query = db.query(Product).filter(Product.is_active == True)

    if category:
        query = query.filter(Product.category.ilike(f"%{category}%"))
    if product_type_tag:
        query = query.filter(Product.product_type_tag.ilike(f"%{product_type_tag}%"))
    if concern:
        # JSON containment or string match
        query = query.filter(Product.description.ilike(f"%{concern}%"))
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Product.name.ilike(search_fmt)) |
            (Product.brand.ilike(search_fmt)) |
            (Product.description.ilike(search_fmt))
        )

    products = query.order_by(Product.rating.desc(), Product.name.asc()).all()

    return [
        {
            "id": p.id,
            "name": p.name,
            "brand": p.brand,
            "category": p.category,
            "product_type_tag": p.product_type_tag,
            "price": p.price,
            "rating": p.rating,
            "image_url": p.image_url,
            "description": p.description,
            "how_to_use": p.how_to_use,
            "key_benefit": p.key_benefit,
            "ingredients": p.ingredients or [],
            "target_skin_types": p.target_skin_types or [],
            "target_concerns": p.target_concerns or [],
        }
        for p in products
    ]


# ============================================================
# POST /api/dermatologist/prescribe
# ============================================================

@router.post("/prescribe", status_code=status.HTTP_201_CREATED)
def prescribe_routine_to_patient(
    payload: PrescribeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create and store a personalized dermatologist prescription for a patient.
    """
    patient = db.query(User).filter(User.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient user not found.")

    doc_name = current_user.full_name
    if not doc_name.startswith("Dr."):
        doc_name = f"Dr. {doc_name} (Dermatology Specialist)"

    prescription = DermatologistPrescription(
        dermatologist_id=current_user.id,
        patient_id=payload.patient_id,
        dermatologist_name=doc_name,
        diagnosis=payload.diagnosis,
        clinical_notes=payload.clinical_notes,
        clinical_focus=payload.clinical_focus,
        review_period_weeks=payload.review_period_weeks or 4,
        prescribed_am_routine=payload.prescribed_am_routine,
        prescribed_pm_routine=payload.prescribed_pm_routine,
        prescribed_treatments=payload.prescribed_treatments or [],
    )
    db.add(prescription)
    db.commit()
    db.refresh(prescription)

    return {
        "message": f"Clinical prescription successfully issued for patient {patient.full_name}!",
        "prescription_id": prescription.id,
        "created_at": prescription.created_at,
    }


# ============================================================
# GET /api/dermatologist/my-prescription
# ============================================================

@router.get("/my-prescription")
def get_my_prescription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get the most recent dermatologist prescription for the currently logged in user.
    """
    prescription = (
        db.query(DermatologistPrescription)
        .filter(DermatologistPrescription.patient_id == current_user.id)
        .order_by(DermatologistPrescription.created_at.desc())
        .first()
    )
    if not prescription:
        return None

    return {
        "id": prescription.id,
        "dermatologist_name": prescription.dermatologist_name,
        "diagnosis": prescription.diagnosis,
        "clinical_focus": prescription.clinical_focus,
        "clinical_notes": prescription.clinical_notes,
        "review_period_weeks": prescription.review_period_weeks,
        "prescribed_am_routine": prescription.prescribed_am_routine or [],
        "prescribed_pm_routine": prescription.prescribed_pm_routine or [],
        "prescribed_treatments": prescription.prescribed_treatments or [],
        "created_at": prescription.created_at,
    }
