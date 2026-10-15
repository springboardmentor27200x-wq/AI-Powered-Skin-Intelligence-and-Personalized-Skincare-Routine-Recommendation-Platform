from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.skin_profile import router as skin_router
from app.routers.lifestyle import router as lifestyle_router
from app.routers.sleep import router as sleep_router
from app.routers.hydration import router as hydration_router
from app.routers.dashboard import router as dashboard_router
from app.routers.admin import router as admin_router
from app.routers.assessment import router as assessment_router
from app.routers.recommendations import router as recommendations_router
from app.routers.routines import router as routines_router
from app.routers.reports import router as reports_router

__all__ = [
    "auth_router",
    "users_router",
    "skin_router",
    "lifestyle_router",
    "sleep_router",
    "hydration_router",
    "dashboard_router",
    "admin_router",
    "assessment_router",
    "recommendations_router",
    "routines_router",
    "reports_router",
]
