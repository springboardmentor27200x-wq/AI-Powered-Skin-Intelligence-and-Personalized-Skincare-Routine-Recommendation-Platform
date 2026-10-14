from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.models.skin_concern import SkinConcern, UserSkinConcern
from app.db.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.skin_profile import SkinProfile
from app.models.skin_assessment import SkinAssessment
from app.models.routine import Routine, RoutineStep
from app.models.product import Product
from app.services.assessment_engine import compute_trend_analysis
from app.services.report_engine import (
    build_assessment_pdf, build_assessment_excel,
    build_routine_pdf,
    build_products_pdf, build_products_excel,
    build_progress_pdf, build_progress_excel,
    build_skin_health_pdf,
)
# Reuses the exact same per-product scoring used by /products/me/recommendations —
# not reimplemented here.
from app.routers.product import _score_for_user, _to_detail, _latest_concerns

router = APIRouter(prefix="/reports", tags=["reports"])


def _file_response(content: bytes, media_type: str, filename: str) -> Response:
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _latest_assessment(db: Session, user_id):
    return (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == user_id)
        .order_by(SkinAssessment.created_at.desc())
        .first()
    )


def _routine_and_steps(db: Session, user_id):
    routine = db.query(Routine).filter(Routine.user_id == user_id).first()
    if not routine:
        return None, []
    steps = (
        db.query(RoutineStep)
        .filter(RoutineStep.routine_id == routine.id)
        .order_by(RoutineStep.time_of_day, RoutineStep.step_order)
        .all()
    )
    return routine, steps


def _scored_products(db: Session, current_user: User, limit: int = 20) -> list[dict]:
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Create a skin profile first")

    prioritized_concerns = _latest_concerns(db, current_user.id)
    products = db.query(Product).all()

    results = []
    for product in products:
        score, reasons, ingredients = _score_for_user(db, product, profile, prioritized_concerns)
        detail = _to_detail(product, ingredients)
        results.append({**detail.model_dump(), "score": score, "reasons": reasons})

    results.sort(key=lambda r: r["score"], reverse=True)
    return results[:limit]


# ---- Skin Assessment Report ----

@router.get("/assessment/pdf")
def assessment_report_pdf(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assessment = _latest_assessment(db, current_user.id)
    pdf = build_assessment_pdf(current_user.full_name, assessment)
    return _file_response(pdf, "application/pdf", "skin-assessment-report.pdf")


@router.get("/assessment/excel")
def assessment_report_excel(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assessment = _latest_assessment(db, current_user.id)
    xlsx = build_assessment_excel(assessment)
    return _file_response(xlsx, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                           "skin-assessment-report.xlsx")


# ---- Routine Report ----

@router.get("/routine/pdf")
def routine_report_pdf(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    routine, steps = _routine_and_steps(db, current_user.id)
    pdf = build_routine_pdf(current_user.full_name, routine, steps)
    return _file_response(pdf, "application/pdf", "routine-report.pdf")


# ---- Product Recommendation Report ----

@router.get("/products/pdf")
def products_report_pdf(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    products = _scored_products(db, current_user)
    pdf = build_products_pdf(current_user.full_name, products)
    return _file_response(pdf, "application/pdf", "product-recommendations.pdf")


@router.get("/products/excel")
def products_report_excel(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    products = _scored_products(db, current_user)
    xlsx = build_products_excel(products)
    return _file_response(xlsx, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                           "product-recommendations.xlsx")


# ---- Progress Report ----

@router.get("/progress/pdf")
def progress_report_pdf(
    limit: int = Query(default=30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    history = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == current_user.id)
        .order_by(SkinAssessment.created_at.desc())
        .limit(limit)
        .all()
    )
    analytics = compute_trend_analysis(history) if history else None
    pdf = build_progress_pdf(current_user.full_name, analytics, history)
    return _file_response(pdf, "application/pdf", "progress-report.pdf")


@router.get("/progress/excel")
def progress_report_excel(
    limit: int = Query(default=30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    history = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == current_user.id)
        .order_by(SkinAssessment.created_at.desc())
        .limit(limit)
        .all()
    )
    xlsx = build_progress_excel(history)
    return _file_response(xlsx, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                           "progress-report.xlsx")


# ---- Skin Health Report (combined) ----

@router.get("/skin-health/pdf")
def skin_health_report_pdf(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    concerns = [
        name for (name,) in (
            db.query(SkinConcern.name)
            .join(UserSkinConcern, UserSkinConcern.skin_concern_id == SkinConcern.id)
            .filter(UserSkinConcern.user_id == current_user.id)
            .all()
        )
    ]
    assessment = _latest_assessment(db, current_user.id)
    routine, steps = _routine_and_steps(db, current_user.id)

    history = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == current_user.id)
        .order_by(SkinAssessment.created_at.desc())
        .limit(30)
        .all()
    )
    analytics = compute_trend_analysis(history) if history else None

    pdf = build_skin_health_pdf(current_user.full_name, profile, concerns, assessment, routine, steps, analytics)
    return _file_response(pdf, "application/pdf", "skin-health-report.pdf")
