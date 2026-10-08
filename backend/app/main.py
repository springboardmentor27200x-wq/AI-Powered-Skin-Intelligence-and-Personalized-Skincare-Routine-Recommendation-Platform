from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import (
    auth, users, skin_profile, lifestyle, sleep, hydration, environment,
    professionals, connections, consultant, dermatologist, admin,
    assessments, routines, recommendations,
    # Milestone 3
    ingredients, products, progress,
    # Live Weather Telemetry
    weather,
    # Milestone 4
    notifications, reports,
    # Care Circle Chat & Messaging
    chat,
)

app = FastAPI(
    title="DermaIQ Intelligence & Personalized Skincare Planner",
    description=(
        "Backend API for DermaIQ Intelligence & Personalized Skincare Planner.\n"
        "Covers Milestone 1 (Auth, Profiles, Habits Telemetry) & Milestone 2 "
        "(Skin Assessment, Concern Prioritization, 5-Pillar Scoring, and Personalized Routine Planning).\n\n"
        "**Medical Disclaimer:** This platform provides skincare information and personalized "
        "wellness guidance. It is not a substitute for professional medical diagnosis or treatment. "
        "Users with severe, persistent, or concerning skin concerns should consult a qualified dermatologist."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
import time
from collections import defaultdict
from threading import Lock
from app.db.base import Base
from app.db.database import engine

# Ensure newly declared tables exist
Base.metadata.create_all(bind=engine)

logger = logging.getLogger(__name__)

# CORS Middleware Configuration (Must be registered first to handle all origins and preflight requests)
cors_origins = list(settings.CORS_ORIGINS) if settings.CORS_ORIGINS else ["http://localhost:5173", "http://127.0.0.1:5173"]
if "http://localhost:5173" not in cors_origins:
    cors_origins.append("http://localhost:5173")
if "http://127.0.0.1:5173" not in cors_origins:
    cors_origins.append("http://127.0.0.1:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "content-disposition"],
)

# Standard Security Headers Middleware (Always passes through call_next so CORS headers are preserved)
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=getattr(exc, "headers", None) or {},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    clean_errors = []
    for err in errors:
        loc = err.get("loc", [])
        field = loc[-1] if loc else "field"
        clean_errors.append(f"{field}: {err.get('msg', 'invalid input')}")
    return JSONResponse(
        status_code=422,
        content={"detail": "; ".join(clean_errors) if clean_errors else "Validation failed"},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception during {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."},
    )

# Include Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(skin_profile.router, prefix="/api/v1/skin-profile", tags=["Skin Profile"])
app.include_router(lifestyle.router, prefix="/api/v1/lifestyle", tags=["Lifestyle Tracking"])
app.include_router(sleep.router, prefix="/api/v1/sleep", tags=["Sleep Tracking"])
app.include_router(hydration.router, prefix="/api/v1/hydration", tags=["Hydration Tracking"])
app.include_router(environment.router, prefix="/api/v1/environment", tags=["Environmental Exposure Tracking"])
app.include_router(professionals.router, prefix="/api/v1/professionals", tags=["Professional Discovery"])
app.include_router(connections.router, prefix="/api/v1/connections", tags=["Connections"])
app.include_router(consultant.router, prefix="/api/v1/consultant", tags=["Consultant Desk"])
app.include_router(dermatologist.router, prefix="/api/v1/dermatologist", tags=["Dermatologist Board"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin Operations"])
app.include_router(assessments.router, prefix="/api/v1/assessments", tags=["Skin Assessment"])
app.include_router(routines.router, prefix="/api/v1/routines", tags=["Skincare Routines"])
app.include_router(recommendations.router, prefix="/api/v1/recommendations", tags=["Clinical Recommendations"])
# Milestone 3
app.include_router(ingredients.router, prefix="/api/v1/ingredients", tags=["Ingredient Intelligence"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Product Recommendations"])
app.include_router(progress.router, prefix="/api/v1/progress", tags=["Progress Tracking"])
app.include_router(weather.router, prefix="/api/v1", tags=["Weather & Environmental Telemetry"])
# Milestone 4
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["Notification Center"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["Reports & Exports"])
# Care Circle Chat & Messaging
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Care Circle Chat"])



@app.get("/health", tags=["Health"])
def health_check():
    """Simple API health check endpoint."""
    return {"status": "healthy", "service": "DermaIQ Intelligence API"}
