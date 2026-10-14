from collections import defaultdict
from types import SimpleNamespace

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import require_roles
from app.models.ingredient import Ingredient
from app.models.product import Product, ProductIngredient
from app.models.skin_assessment import SkinAssessment
from app.models.skin_profile import SkinProfile
from app.models.user import User, UserRole
from app.routers.admin import platform_analytics, platform_stats
from app.schemas.admin_insights import RecommendationMonitoringOut
from app.services.recommendation_monitor import monitor_recommendations
from app.services.system_report_engine import build_system_excel, build_system_pdf

router = APIRouter(prefix="/admin", tags=["admin-insights"])

require_admin = require_roles(UserRole.administrator)

XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def _monitoring(db: Session) -> dict:
    """Load everything once (a handful of queries), then score in memory."""
    profiles = db.query(
        SkinProfile.user_id, SkinProfile.skin_type, SkinProfile.allergies, SkinProfile.sensitivities
    ).all()
    products = db.query(
        Product.id, Product.name, Product.category, Product.brand, Product.skin_types
    ).all()

    ingredients_by_product = defaultdict(list)
    rows = (
        db.query(ProductIngredient.product_id, Ingredient.name, Ingredient.category)
        .join(Ingredient, Ingredient.id == ProductIngredient.ingredient_id)
        .all()
    )
    for product_id, name, category in rows:
        ingredients_by_product[product_id].append(SimpleNamespace(name=name, category=category))

    # Latest assessment per user supplies their priority concerns (newest first, keep the first seen).
    concerns_by_user: dict = {}
    latest_first = (
        db.query(SkinAssessment.user_id, SkinAssessment.prioritized_concerns)
        .order_by(SkinAssessment.created_at.desc())
        .all()
    )
    for user_id, concerns in latest_first:
        concerns_by_user.setdefault(user_id, concerns or [])

    return monitor_recommendations(
        profiles=profiles,
        products=products,
        ingredients_by_product=ingredients_by_product,
        concerns_by_user=concerns_by_user,
    )


@router.get("/recommendations", response_model=RecommendationMonitoringOut)
def recommendation_monitoring(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """What the recommendation engine is recommending, platform-wide."""
    return _monitoring(db)


def _report_inputs(db: Session, admin: User):
    stats = platform_stats(db=db, admin=admin)
    analytics = platform_analytics(db=db, admin=admin)
    monitoring = RecommendationMonitoringOut(**_monitoring(db))
    return stats, analytics, monitoring


def _file(content: bytes, media_type: str, filename: str) -> Response:
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/reports/system/pdf")
def system_report_pdf(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    stats, analytics, monitoring = _report_inputs(db, admin)
    return _file(build_system_pdf(admin.full_name, stats, analytics, monitoring),
                 "application/pdf", "platform-system-report.pdf")


@router.get("/reports/system/excel")
def system_report_excel(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    stats, analytics, monitoring = _report_inputs(db, admin)
    return _file(build_system_excel(stats, analytics, monitoring), XLSX_TYPE, "platform-system-report.xlsx")