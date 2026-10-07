from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine

from routes.auth import router as auth_router
from routes.users import router as users_router
from routes.profile import router as profile_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Skin Intelligence — Milestone 1", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users_router, prefix="/api/users", tags=["Users"])
app.include_router(profile_router, prefix="/api/profile", tags=["Skin Profile"])

@app.get("/")
def root():
    return {"message": "AI Skin Intelligence API — Milestone 1"}
