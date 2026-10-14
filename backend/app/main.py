from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import Base, engine

# Import models so SQLAlchemy registers them before create_all()
from app.models import (
    user,
    skin_profile,
    skin_concern,
    sleep_record,
    lifestyle_record,
    hydration_record,
    environmental_exposure_record,
    skin_assessment,
    routine,
    routine_adherence,
    ingredient,
    product,
    announcement,
    user_product
)
from app.routers import auth, admin, daily_log, skin_profile as skin_profile_router, assessment, routine as routine_router, adherence, ingredient as ingredient_router, product as product_router, client_view as client_view_router, client_note as client_note_router, report as report_router, notification as notification_router, user_product as user_product_router, admin_insights as admin_insights_router
app = FastAPI(
    title="AI Skin Intelligence & Personalized Skincare Planner"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Authentication
app.include_router(auth.router)

# Skin Profile
app.include_router(skin_profile_router.router)
app.include_router(daily_log.router)
app.include_router(admin.router)
app.include_router(assessment.router)
app.include_router(routine_router.router)
app.include_router(adherence.router)
app.include_router(ingredient_router.router)
app.include_router(product_router.router)
app.include_router(client_view_router.router)
app.include_router(client_note_router.router)
app.include_router(report_router.router)
app.include_router(notification_router.router)
app.include_router(user_product_router.router)
app.include_router(admin_insights_router.router)
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check():
    return {"status": "ok"}