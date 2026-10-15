from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
import app.models  # Ensure all models are registered with Base metadata
from app.routers import (
    auth_router,
    users_router,
    skin_router,
    lifestyle_router,
    sleep_router,
    hydration_router,
    dashboard_router,
    admin_router,
    assessment_router,
    recommendations_router,
    routines_router,
    reports_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on application startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend REST API for AI Skin Intelligence & Personalized Skincare Planner (assessment, recommendation, and analytics enhancements)",
    version="1.1.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
    openapi_tags=[
        {"name": "Authentication", "description": "User registration, login, and token generation"},
        {"name": "Users", "description": "User account management and password updates"},
        {"name": "Skin Profile", "description": "Skin type, age group, concerns, and sensitivities"},
        {"name": "Lifestyle", "description": "Physical activity, smoking, alcohol, screen time, and exposure tracking"},
        {"name": "Sleep", "description": "Sleep duration, quality, schedule, and history records"},
        {"name": "Hydration", "description": "Daily water intake logging and hydration history"},
        {"name": "Dashboard", "description": "Aggregated user metrics and profile completion status"},
        {"name": "Administration", "description": "Administrator user management and role overview"},
    ]
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for easy development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers with prefix
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(skin_router, prefix=settings.API_V1_STR)
app.include_router(lifestyle_router, prefix=settings.API_V1_STR)
app.include_router(sleep_router, prefix=settings.API_V1_STR)
app.include_router(hydration_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(assessment_router, prefix=settings.API_V1_STR)
app.include_router(recommendations_router, prefix=settings.API_V1_STR)
app.include_router(routines_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)


@app.get("/", status_code=status.HTTP_200_OK, tags=["General"])
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "version": "1.0.0",
        "docs": f"{settings.API_V1_STR}/docs",
        "milestone": "Milestones 1-4: assessment, routine tracking, analytics, and reports"
    }


@app.get(f"{settings.API_V1_STR}/health", status_code=status.HTTP_200_OK, tags=["General"])
def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "database": "connected"
    }
