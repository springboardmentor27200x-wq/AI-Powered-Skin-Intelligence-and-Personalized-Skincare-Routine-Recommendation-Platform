from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
import pandas as pd
import io
from fpdf import FPDF
from datetime import datetime

from database import get_db
from models.user import User
from models.skin_assessment import SkinAssessment
from utils.auth import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports & Exports"])

@router.get("/assessment/pdf", response_class=Response)
def export_assessment_pdf(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate and return a PDF report of the latest skin assessment."""
    assessment = db.query(SkinAssessment).filter(SkinAssessment.user_id == current_user.id).order_by(SkinAssessment.created_at.desc()).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="No assessments found to export.")

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, txt="Skin Intelligence - Assessment Report", ln=True, align='C')
    
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, txt=f"User: {current_user.full_name}", ln=True)
    pdf.cell(200, 10, txt=f"Date: {assessment.created_at.strftime('%Y-%m-%d %H:%M')}", ln=True)
    
    pdf.cell(200, 10, txt=f"Overall Score: {assessment.overall_score}/100", ln=True)
    
    pdf.ln(10)
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(200, 10, txt="Score Breakdown:", ln=True)
    pdf.set_font("Arial", size=12)
    for key, value in assessment.score_breakdown.items():
        pdf.cell(200, 10, txt=f"- {key}: {value}", ln=True)
        
    pdf.ln(10)
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(200, 10, txt="Concern Analysis:", ln=True)
    pdf.set_font("Arial", size=12)
    for concern in assessment.concern_analysis:
        pdf.cell(200, 10, txt=f"- {concern.get('concern')}: {concern.get('severity')}", ln=True)

    # Output to byte string
    pdf_bytes = bytes(pdf.output())
    
    headers = {
        'Content-Disposition': 'attachment; filename="assessment_report.pdf"'
    }
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)


@router.get("/assessment/excel", response_class=Response)
def export_assessment_excel(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate and return an Excel report of all skin assessments."""
    assessments = db.query(SkinAssessment).filter(SkinAssessment.user_id == current_user.id).order_by(SkinAssessment.created_at.desc()).all()
    
    if not assessments:
        raise HTTPException(status_code=404, detail="No assessments found to export.")

    data = []
    for a in assessments:
        data.append({
            "Date": a.created_at.strftime('%Y-%m-%d %H:%M'),
            "Overall Score": a.overall_score,
            "Skin Condition Score": a.score_breakdown.get('skin_condition'),
            "Lifestyle Score": a.score_breakdown.get('lifestyle_impact'),
            "Concerns": ", ".join([c.get('concern', '') for c in a.concern_analysis]) if a.concern_analysis else "None"
        })
        
    df = pd.DataFrame(data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Assessments')
    
    output.seek(0)
    
    headers = {
        'Content-Disposition': 'attachment; filename="assessments_history.xlsx"'
    }
    return Response(content=output.read(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers=headers)

from models.skincare_routine import SkincareRoutine
from models.progress import ProgressLog

@router.get("/routine/pdf", response_class=Response)
def export_routine_pdf(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    routine = db.query(SkincareRoutine).filter(SkincareRoutine.user_id == current_user.id).order_by(SkincareRoutine.created_at.desc()).first()
    if not routine:
        raise HTTPException(status_code=404, detail="No routine found.")

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, txt="Personalized Skincare Routine", ln=True, align='C')
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, txt=f"User: {current_user.full_name}", ln=True)
    pdf.ln(5)
    
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(200, 10, txt="Morning Routine:", ln=True)
    pdf.set_font("Arial", size=12)
    for step in routine.morning_routine:
        pdf.cell(200, 10, txt=f"- {step.get('step')}: {step.get('product_type')} ({step.get('instruction')})", ln=True)
        
    pdf.ln(5)
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(200, 10, txt="Evening Routine:", ln=True)
    pdf.set_font("Arial", size=12)
    for step in routine.evening_routine:
        pdf.cell(200, 10, txt=f"- {step.get('step')}: {step.get('product_type')} ({step.get('instruction')})", ln=True)

    pdf_bytes = bytes(pdf.output())
    headers = {'Content-Disposition': 'attachment; filename="skincare_routine.pdf"'}
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)

@router.get("/progress/pdf", response_class=Response)
def export_progress_pdf(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    progress_logs = db.query(ProgressLog).filter(ProgressLog.user_id == current_user.id).order_by(ProgressLog.date_logged.desc()).limit(10).all()
    if not progress_logs:
        raise HTTPException(status_code=404, detail="No progress logs found.")

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, txt="Skin Progress Report", ln=True, align='C')
    pdf.set_font("Arial", size=12)
    
    for log in progress_logs:
        pdf.cell(200, 10, txt=f"Date: {log.date_logged.strftime('%Y-%m-%d')} | Health Score: {log.skin_health_score}/100 | Adherence: {log.routine_adherence}%", ln=True)
        if log.notes:
            pdf.cell(200, 10, txt=f"Notes: {log.notes}", ln=True)
        pdf.ln(2)

    pdf_bytes = bytes(pdf.output())
    headers = {'Content-Disposition': 'attachment; filename="progress_report.pdf"'}
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)
