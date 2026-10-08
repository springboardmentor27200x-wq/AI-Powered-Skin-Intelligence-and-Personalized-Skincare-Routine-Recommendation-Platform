from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.profiles import router as profiles_router
from app.api.v1.tracking import router as tracking_router
from app.api.v1.assessment import router as assessment_router
from app.api.v1.routine import router as routine_router
from app.api.v1.products import router as products_router
from app.api.v1.progress import router as progress_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.exports import router as exports_router
from app.api.v1.consultant import router as consultant_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication & RBAC"])
api_router.include_router(users_router, prefix="/users", tags=["User Management"])
api_router.include_router(profiles_router, prefix="/profiles", tags=["Skin Profile Management"])
api_router.include_router(tracking_router, prefix="/tracking", tags=["Lifestyle & Sleep Tracking"])
api_router.include_router(assessment_router, prefix="/assessment", tags=["Skin Assessment & Scoring"])
api_router.include_router(routine_router, prefix="/routine", tags=["Routine Generation"])
api_router.include_router(products_router, prefix="/products", tags=["Product Intelligence"])
api_router.include_router(progress_router, prefix="/progress", tags=["Progress Analytics"])

api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboards"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(exports_router, prefix="/exports", tags=["Exports"])
api_router.include_router(consultant_router, prefix="/consultant", tags=["Consultant Dashboard"])
