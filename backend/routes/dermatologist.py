"""
Dermatologist Dashboard — Milestone 4
Endpoints:
  GET  /api/dermatologist/patients             — list all patients (users with role=user)
  GET  /api/dermatologist/patients/{id}        — get patient detail with latest assessment
  POST /api/dermatologist/treatment            — submit a treatment report for a patient
  GET  /api/dermatologist/reports              — list all reports authored by this dermatologist
  GET  /api/dermatologist/reports/{patient_id} — reports for a specific patient
"""
import json
from datetime import datetime, date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from auth import get_current_user
from rbac import require_role
from models import User, SkinProfile, SkinAssessment, DermatologistReport, ProgressLog

router = APIRouter()


# ────────────────────────── Schemas ──────────────────────────

class PatientSummary(BaseModel):
    id: int
    name: str
    email: str
    age: int
    gender: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class LatestAssessmentOut(BaseModel):
    overall_score: Optional[float] = None
    skin_concerns: Optional[str] = None
    assessment_date: Optional[datetime] = None


class PatientDetailOut(BaseModel):
    patient: PatientSummary
    skin_profile: Optional[dict] = None
    latest_assessment: Optional[LatestAssessmentOut] = None
    progress_count: int = 0


class TreatmentReportIn(BaseModel):
    patient_id: int
    diagnosis: str
    treatment_plan: str
    prescribed_ingredients: List[str] = []
    avoid_ingredients: List[str] = []
    follow_up_date: Optional[date] = None
    notes: str = ""


class TreatmentReportOut(BaseModel):
    id: int
    patient_id: int
    diagnosis: str
    treatment_plan: str
    prescribed_ingredients: str
    avoid_ingredients: str
    follow_up_date: Optional[date]
    notes: str
    created_at: datetime

    class Config:
        from_attributes = True


# ────────────────────────── Routes ──────────────────────────

@router.get("/patients", response_model=List[PatientSummary])
def list_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patients = db.query(User).filter(User.role == "user").order_by(User.name).all()
    return patients


@router.get("/patients/{patient_id}", response_model=PatientDetailOut)
def get_patient_detail(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = db.query(User).filter(User.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Skin profile
    profile = patient.profile
    profile_dict = None
    if profile:
        profile_dict = {
            "skin_type": profile.skin_type,
            "age_group": profile.age_group,
            "skin_concerns": profile.skin_concerns,
            "allergies": profile.allergies,
            "climate_type": profile.climate_type,
        }

    # Latest assessment
    latest_assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == patient_id)
        .order_by(SkinAssessment.created_at.desc())
        .first()
    )
    assessment_out = None
    if latest_assessment:
        concerns_val = (profile.skin_concerns if profile else None) or latest_assessment.concern_priorities or "[]"
        assessment_out = LatestAssessmentOut(
            overall_score=latest_assessment.overall_score,
            skin_concerns=concerns_val,
            assessment_date=latest_assessment.created_at,
        )

    progress_count = db.query(ProgressLog).filter(ProgressLog.user_id == patient_id).count()

    return PatientDetailOut(
        patient=PatientSummary(
            id=patient.id,
            name=patient.name,
            email=patient.email,
            age=patient.age,
            gender=patient.gender,
            role=patient.role,
            created_at=patient.created_at,
        ),
        skin_profile=profile_dict,
        latest_assessment=assessment_out,
        progress_count=progress_count,
    )


@router.post("/treatment", response_model=TreatmentReportOut)
def create_treatment_report(
    payload: TreatmentReportIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = db.query(User).filter(User.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    report = DermatologistReport(
        dermatologist_id=current_user.id,
        patient_id=payload.patient_id,
        diagnosis=payload.diagnosis,
        treatment_plan=payload.treatment_plan,
        prescribed_ingredients=json.dumps(payload.prescribed_ingredients),
        avoid_ingredients=json.dumps(payload.avoid_ingredients),
        follow_up_date=payload.follow_up_date,
        notes=payload.notes,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/reports", response_model=List[TreatmentReportOut])
def list_my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reports = (
        db.query(DermatologistReport)
        .order_by(DermatologistReport.created_at.desc())
        .all()
    )
    return reports


@router.get("/my-treatment-plans", response_model=List[TreatmentReportOut])
def get_my_treatment_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Allow patients/users to view dermatologist reports prescribed for them."""
    reports = (
        db.query(DermatologistReport)
        .filter(DermatologistReport.patient_id == current_user.id)
        .order_by(DermatologistReport.created_at.desc())
        .all()
    )
    return reports
