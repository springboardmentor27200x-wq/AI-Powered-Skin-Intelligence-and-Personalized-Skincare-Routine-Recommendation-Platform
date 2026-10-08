
from dotenv import load_dotenv

load_dotenv()  # Must run before anything reads os.getenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from . import models

from .routes.auth_routes import router as auth_router
from .routes.profile_routes import router as profile_router
from .routes.lifestyle_routes import router as lifestyle_router
from .routes.sleep_routes import router as sleep_router
from .routes import consultation_routes
from .routes import assessment_routes
from .routes import routine_routes
from .routes.ingredient_routes import router as ingredient_router
from .routes.product_routes import router as product_router
from .routes.progress_routes import router as progress_router
from .routes.routine_adherence_routes import router as routine_adherence_router
from .routes.checkin_routes import router as checkin_router
from .routes import notification_routes
from .routes import report_routes
from .routes import health_insights_routes
from .routes import consultation_request_routes
# =========================================================
# CREATE DATABASE TABLES
# =========================================================

Base.metadata.create_all(bind=engine)


# =========================================================
# ADDITIVE DATABASE MIGRATION
# =========================================================

from sqlalchemy import inspect, text

if "budget_inr" not in {
    column["name"]
    for column in inspect(engine).get_columns("skin_profiles")
}:
    with engine.begin() as connection:
        connection.execute(
            text(
                "ALTER TABLE skin_profiles "
                "ADD COLUMN budget_inr FLOAT"
            )
        )


# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="AI Skin Intelligence API",
    description="Backend API for personalized skincare",
    version="1.0.0",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# API ROUTERS
# =========================================================

app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(lifestyle_router)
app.include_router(sleep_router)

# Consultation
app.include_router(consultation_routes.router)

# Skin Assessment
app.include_router(assessment_routes.router)

# Personalized Routine
app.include_router(routine_routes.router)

# Ingredient Intelligence
app.include_router(ingredient_router)

# Product Recommendations
app.include_router(product_router)

# Progress Tracking
app.include_router(progress_router)

# Routine Adherence Tracking
app.include_router(routine_adherence_router)

# Daily Check-in
app.include_router(checkin_router)

# Notifications & Reminders
app.include_router(notification_routes.router)

# Reports & Export
app.include_router(report_routes.router)

app.include_router(health_insights_routes.router)
app.include_router(consultation_request_routes.router)
# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "message": "AI Skin Intelligence API is running!"
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy"
    }

