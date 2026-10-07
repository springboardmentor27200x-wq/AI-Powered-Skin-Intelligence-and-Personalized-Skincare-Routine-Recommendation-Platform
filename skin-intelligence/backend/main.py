from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from database import engine, Base
from models import User, SkinProfile, LifestyleLog, SkinAssessment, SkincareRoutine
from routes.auth import router as auth_router
from routes.profile import router as profile_router
from routes.lifestyle import router as lifestyle_router
from routes.assessment import router as assessment_router
from routes.routine import router as routine_router
from routes.product import router as product_router
from routes.progress import router as progress_router
from routes.texture import router as texture_router
from routes.dermatologist import router as dermatologist_router
from routes.notification import router as notification_router
from routes.report import router as report_router
from routes.admin import router as admin_router

# ============================================================
# CREATE FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="AI Skin Intelligence & Personalized Skincare Planner",
    description=(
        "Backend API for the AI Skin Intelligence project.\n\n"
        "**Milestone 1:** Authentication, Skin Profile Management, Lifestyle Tracking\n\n"
        "**Milestone 2:** Skin Assessment Engine, Personalized Routine Generator, Skin Health Scoring\n\n"
        "**Milestone 3:** Product Intelligence & Progress Tracking\n\n"
        "**Vision Intelligence:** 3-Angle Facial Texture Scanner & Diagnostics\n\n"
        "**Module 10:** Notification & Reminder System\n\n"
        "**Module 11:** Reports & Exports"
    ),
    version="3.4.0"
)


# ============================================================
# CONFIGURE CORS MIDDLEWARE
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# CREATE DATABASE TABLES
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# REGISTER ROUTERS
# ============================================================

app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(lifestyle_router)
app.include_router(assessment_router)   # Module 3: Skin Assessment Engine
app.include_router(routine_router)      # Module 4: Personalized Routine Generator
app.include_router(product_router)      # Milestone 3: Product Intelligence
app.include_router(progress_router)     # Milestone 3: Progress Tracking
app.include_router(texture_router)      # Vision AI: Skin Texture Scanner
app.include_router(dermatologist_router) # Clinical Specialist & Patient Portal
app.include_router(notification_router)  # Module 10: Notification & Reminder System
app.include_router(report_router)        # Module 11: Reports & Exports
app.include_router(admin_router)         # Admin Dashboard


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "AI Skin Intelligence API is running",
        "version": "2.0.0",
        "milestone": "Milestone 2 — Assessment Engine & Routine Generator",
        "docs": "/docs",
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():
    return {"status": "healthy"}


# ============================================================
# DATABASE CONNECTION TEST
# ============================================================

@app.get("/database-test")
def database_test():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            return {"database": "connected", "result": result.scalar()}
    except Exception as e:
        return {"database": "connection failed", "error": str(e)}