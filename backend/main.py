from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine, ensure_schema, seed_default_accounts

from routes.auth import router as auth_router
from routes.users import router as users_router
from routes.profile import router as profile_router
from routes.sleep import router as sleep_router
from routes.hydration import router as hydration_router
from routes.lifestyle import router as lifestyle_router
from routes.assessment import router as assessment_router
from routes.routine import router as routine_router
from routes.ingredients import router as ingredients_router
from routes.products import router as products_router
from routes.progress import router as progress_router
from routes.notifications import router as notifications_router
from routes.dermatologist import router as dermatologist_router
from routes.reports import router as reports_router

import models
Base.metadata.create_all(bind=engine)
ensure_schema()
seed_default_accounts()

app = FastAPI(
    title="AI Skin Intelligence Platform — Complete System",
    version="4.0.0",
    description=(
        "AI-powered skincare intelligence platform. "
        "Complete platform: Auth, Skin Profile, Assessment Engine, Routine Generator, "
        "Ingredient Intelligence, Product Recommendations, Progress Tracking, "
        "Notifications, Dermatologist Dashboard, Reports & Export, AI Face Scanner."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,            prefix="/api/auth",            tags=["Authentication"])
app.include_router(users_router,           prefix="/api/users",           tags=["Users"])
app.include_router(profile_router,         prefix="/api/profile",         tags=["Skin Profile"])
app.include_router(sleep_router,           prefix="/api/sleep",           tags=["Sleep Tracking"])
app.include_router(hydration_router,       prefix="/api/hydration",       tags=["Hydration Tracking"])
app.include_router(lifestyle_router,       prefix="/api/lifestyle",       tags=["Lifestyle Tracking"])
app.include_router(assessment_router,      prefix="/api/assessment",      tags=["Skin Assessment & AI Scanner"])
app.include_router(routine_router,         prefix="/api/routine",         tags=["Skincare Routine"])
app.include_router(ingredients_router,     prefix="/api/ingredients",     tags=["Ingredient Intelligence"])
app.include_router(products_router,        prefix="/api/products",        tags=["Product Recommendations"])
app.include_router(progress_router,        prefix="/api/progress",        tags=["Progress Tracking"])
app.include_router(notifications_router,   prefix="/api/notifications",   tags=["Notifications"])
app.include_router(dermatologist_router,   prefix="/api/dermatologist",   tags=["Dermatologist"])
app.include_router(reports_router,         prefix="/api/reports",         tags=["Reports & Export"])


@app.get("/")
def root():
    return {"message": "AI Skin Intelligence API — Complete Platform Running", "status": "healthy"}


@app.get("/health")
def health():
    return {"status": "healthy"}
