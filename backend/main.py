from scoring_engine import calculate_skin_health_score
from product_engine import get_product_recommendations
from fastapi import FastAPI, Depends, HTTPException, Response, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from ingredient_engine import generate_safe_ingredient_recommendations
from risk_engine import analyze_skin_risks
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
import os

from database import engine, Base, get_db
import models
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    generate_verification_token
)
from email_service import send_verification_email


# ============================================================
# APP
# ============================================================

app = FastAPI()
bearer_scheme = HTTPBearer(auto_error=False)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST MODELS
# ============================================================

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str


class SkinProfileRequest(BaseModel):
    skin_type: str | None = None
    concerns: str | None = None
    allergies: str | None = None
    exercise: str | None = None
    stress: str | None = None
    sun_exposure: str | None = None
    pollution_exposure: str | None = None
    environment: str | None = None
    sleep: str | None = None
    water_intake: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class ProgressEntryRequest(BaseModel):
    routine_adherence: int | None = None
    notes: str | None = None


class ConsultationResponseRequest(BaseModel):
    recommendations: Optional[str] = None
    ingredient_guidance: Optional[str] = None
    morning_routine: Optional[str] = None
    night_routine: Optional[str] = None
    precautions: Optional[str] = None
    follow_up_notes: Optional[str] = None


class AssignConsultationRequest(BaseModel):
    dermatologist_id: int
class UpdateUserRoleRequest(BaseModel):
    role: str

# ============================================================
# AUTHENTICATION
# ============================================================

def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):
    token = credentials.credentials if credentials else None

    if not token:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        secret_key = os.getenv("SECRET_KEY")
        algorithm = os.getenv("ALGORITHM", "HS256")

        if not secret_key:
            raise HTTPException(
                status_code=500,
                detail="SECRET_KEY is not configured."
            )

        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token"
            )

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )

    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid user ID in authentication token"
        )

    user = db.query(models.User).filter(models.User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


def require_role(current_user, allowed_roles):
    # The role is read from the database, not from frontend input.
    role = getattr(current_user, "role", "user")

    if role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to perform this action."
        )


# ============================================================
# CONSULTATION SERIALIZATION
# ============================================================

def consultation_to_dict(item):
    return {
        "id": item.id,
        "user_id": item.user_id,
        "dermatologist_id": item.dermatologist_id,
        "status": item.status,
        "assessment": {
            "skin_type": item.skin_type,
            "concerns": item.concerns,
            "age_group": item.age_group,
            "allergies": item.allergies,
            "exercise": item.exercise,
            "stress": item.stress,
            "sun_exposure": item.sun_exposure,
            "pollution_exposure": item.pollution_exposure,
            "environment": item.environment,
            "sleep": item.sleep,
            "water_intake": item.water_intake,
        },
        "recommendations": item.recommendations,
        "ingredient_guidance": item.ingredient_guidance,
        "morning_routine": item.morning_routine,
        "night_routine": item.night_routine,
        "precautions": item.precautions,
        "follow_up_notes": item.follow_up_notes,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    }


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {"message": "SkinSense API is running"}


# ============================================================
# SIGNUP
# ============================================================

@app.post("/signup")
async def signup(user: SignupRequest, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password),
        email_verified=False,
        auth_provider="email",
        role="user"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    verification_token = generate_verification_token()
    verification_record = models.EmailVerificationToken(
        user_id=new_user.id,
        token=verification_token,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=30)
    )
    db.add(verification_record)
    db.commit()

    

    verification_link = f"http://localhost:5174/?token={verification_token}"
    
    verification_link = f"http://localhost:5174/?token={verification_token}"

    try:
        email_response = await send_verification_email(
            user.email,
            verification_link
        )
        print("Verification email response:", email_response)

    except Exception as e:
        print(f"Verification email could not be sent: {repr(e)}")

    return {
        "message": "User registered successfully. Please check your email to verify your account.",
        "user_id": new_user.id
    }



# ============================================================
# EMAIL VERIFICATION
# ============================================================

@app.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    verification_record = db.query(models.EmailVerificationToken).filter(
        models.EmailVerificationToken.token == token
    ).first()

    if not verification_record:
        raise HTTPException(status_code=400, detail="Invalid verification token")

    expires_at = verification_record.expires_at
    now = datetime.now(timezone.utc)
    # Support databases that return timezone-naive datetimes.
    if expires_at.tzinfo is None:
        now = now.replace(tzinfo=None)

    if expires_at < now:
        db.delete(verification_record)
        db.commit()
        raise HTTPException(
            status_code=400,
            detail="Verification token has expired"
        )

    user = db.query(models.User).filter(
        models.User.id == verification_record.user_id
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.email_verified = True
    db.delete(verification_record)
    db.commit()

    return {"message": "Email verified successfully"}


# ============================================================
# LOGIN
# ============================================================


@app.post("/login")
def login(user: LoginRequest, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if existing_user.auth_provider != "email":
        raise HTTPException(
            status_code=400,
            detail="This account uses Google Login. Please continue with Google."
        )

    if not existing_user.password_hash:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(user.password, existing_user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Require email verification only for normal users.
    user_role = (existing_user.role or "user").strip().lower()

    if user_role == "user" and not existing_user.email_verified:
        raise HTTPException(
            status_code=403,
            detail="Please verify your email before logging in."
        )

    access_token = create_access_token({
        "sub": str(existing_user.id),
        "email": existing_user.email
    })

    response = Response(
        content='{"message":"Login successful"}',
        media_type="application/json"
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60 * 60
    )

    response.headers["X-User-Role"] = user_role

    return response


# ============================================================
# CURRENT USER
# ============================================================

@app.get("/me")
def get_me(current_user=Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": getattr(current_user, "role", "user")
    }


# ============================================================
# SAVE SKIN PROFILE + HEALTH SCORE
# ============================================================

@app.post("/profile")
def save_profile(
    profile: SkinProfileRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing_profile = db.query(models.SkinProfile).filter(
        models.SkinProfile.user_id == current_user.id
    ).first()

    if existing_profile:
        existing_profile.skin_type = profile.skin_type
        existing_profile.concerns = profile.concerns
        existing_profile.allergies = profile.allergies
        existing_profile.exercise = profile.exercise
        existing_profile.stress = profile.stress
        existing_profile.sun_exposure = profile.sun_exposure
        existing_profile.pollution_exposure = profile.pollution_exposure
        existing_profile.environment = profile.environment
        existing_profile.sleep = profile.sleep
        existing_profile.water_intake = profile.water_intake
    else:
        new_profile = models.SkinProfile(
            user_id=current_user.id,
            skin_type=profile.skin_type,
            concerns=profile.concerns,
            allergies=profile.allergies,
            exercise=profile.exercise,
            stress=profile.stress,
            sun_exposure=profile.sun_exposure,
            pollution_exposure=profile.pollution_exposure,
            environment=profile.environment,
            sleep=profile.sleep,
            water_intake=profile.water_intake
        )
        db.add(new_profile)

    db.commit()

    concerns_list = [
        concern.strip()
        for concern in (profile.concerns or "").split(",")
        if concern.strip()
    ]

    scores = calculate_skin_health_score(
        concerns=concerns_list,
        exercise=profile.exercise,
        stress=profile.stress,
        sleep=profile.sleep,
        water=profile.water_intake,
        routine_consistency=100
    )

    new_score = models.SkinHealthScore(
        user_id=current_user.id,
        skin_condition_score=scores["skin_condition_score"],
        lifestyle_score=scores["lifestyle_score"],
        sleep_score=scores["sleep_score"],
        routine_consistency_score=scores["routine_consistency_score"],
        hydration_score=scores["hydration_score"],
        overall_score=scores["overall_score"]
    )
    db.add(new_score)
    db.commit()
    db.refresh(new_score)

    return {
        "message": "Skin profile and health score saved successfully",
        "scores": scores
    }


# ============================================================
# LOGOUT
# ============================================================

@app.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="lax"
    )
    return {"message": "Logged out successfully"}


# ============================================================
# HEALTH SCORE
# ============================================================

@app.get("/health-score")
def get_health_score(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    latest_score = db.query(models.SkinHealthScore).filter(
        models.SkinHealthScore.user_id == current_user.id
    ).order_by(models.SkinHealthScore.created_at.desc()).first()

    if not latest_score:
        raise HTTPException(status_code=404, detail="No skin health score found.")

    return {
        "skin_condition_score": latest_score.skin_condition_score,
        "lifestyle_score": latest_score.lifestyle_score,
        "sleep_score": latest_score.sleep_score,
        "routine_consistency_score": latest_score.routine_consistency_score,
        "hydration_score": latest_score.hydration_score,
        "overall_score": latest_score.overall_score,
        "created_at": latest_score.created_at
    }


# ============================================================
# RISK ANALYSIS
# ============================================================

@app.get("/risk-analysis")
def get_risk_analysis(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.SkinProfile).filter(
        models.SkinProfile.user_id == current_user.id
    ).first()

    if not profile:
        return {"prioritized_concerns": [], "risk_factors": []}

    concerns_list = [
        concern.strip()
        for concern in (profile.concerns or "").split(",")
        if concern.strip()
    ]

    return analyze_skin_risks(
        concerns=concerns_list,
        skin_type=profile.skin_type,
        sun_exposure=profile.sun_exposure,
        pollution_exposure=profile.pollution_exposure,
        environment=profile.environment,
        exercise=profile.exercise,
        stress=profile.stress,
        sleep=profile.sleep,
        water=profile.water_intake
    )


# ============================================================
# INGREDIENT RECOMMENDATIONS
# ============================================================

@app.get("/ingredient-recommendations")
def get_ingredient_recommendations(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.SkinProfile).filter(
        models.SkinProfile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="No SkinProfile found for the logged-in user."
        )

    concerns_list = [
        concern.strip()
        for concern in (profile.concerns or "").split(",")
        if concern.strip()
    ]

    print("SKIN TYPE:", profile.skin_type)
    print("CONCERNS:", profile.concerns)

    return generate_safe_ingredient_recommendations(
        skin_type=profile.skin_type,
        concerns=concerns_list,
        allergies=profile.allergies,
        sensitivity=""
    )


# ============================================================
# PRODUCT RECOMMENDATIONS
# ============================================================

@app.get("/product-recommendations")
def product_recommendations(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.SkinProfile).filter(
        models.SkinProfile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="No SkinProfile found for the logged-in user."
        )

    concerns_list = [
        concern.strip()
        for concern in (profile.concerns or "").split(",")
        if concern.strip()
    ]

    ingredient_results = generate_safe_ingredient_recommendations(
        skin_type=profile.skin_type,
        concerns=concerns_list,
        allergies=profile.allergies,
        sensitivity=""
    )

    safe_ingredients = ingredient_results.get("safe", [])

    recommendations = get_product_recommendations(
        skin_type=profile.skin_type,
        concerns=concerns_list,
        safe_ingredients=safe_ingredients
    )

    return {"recommendations": recommendations}


# ============================================================
# PROGRESS - CREATE ENTRY
# ============================================================

@app.post("/progress")
def create_progress_entry(
    progress: ProgressEntryRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    latest_score = db.query(models.SkinHealthScore).filter(
        models.SkinHealthScore.user_id == current_user.id
    ).order_by(models.SkinHealthScore.created_at.desc()).first()

    if not latest_score:
        raise HTTPException(
            status_code=404,
            detail="No skin health score found. Complete your assessment first."
        )

    if progress.routine_adherence is not None and not (
        0 <= progress.routine_adherence <= 100
    ):
        raise HTTPException(
            status_code=400,
            detail="Routine adherence must be between 0 and 100."
        )

    new_entry = models.ProgressEntry(
        user_id=current_user.id,
        skin_score=latest_score.overall_score,
        routine_adherence=progress.routine_adherence,
        notes=progress.notes
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)

    return {
        "message": "Progress entry saved successfully",
        "progress": {
            "id": new_entry.id,
            "skin_score": new_entry.skin_score,
            "routine_adherence": new_entry.routine_adherence,
            "notes": new_entry.notes,
            "created_at": new_entry.created_at
        }
    }


# ============================================================
# PROGRESS - GET HISTORY
# ============================================================

@app.get("/progress")
def get_progress(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entries = db.query(models.ProgressEntry).filter(
        models.ProgressEntry.user_id == current_user.id
    ).order_by(models.ProgressEntry.created_at.asc()).all()

    return {
        "progress": [
            {
                "id": entry.id,
                "skin_score": entry.skin_score,
                "routine_adherence": entry.routine_adherence,
                "notes": entry.notes,
                "created_at": entry.created_at
            }
            for entry in entries
        ]
    }


# ============================================================
# DERMATOLOGIST CONSULTATION APIs
# ============================================================

# USER: Request a consultation using the saved assessment
@app.post("/consultations")
def request_consultation(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.SkinProfile).filter(
        models.SkinProfile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=400,
            detail="Complete your skin assessment first."
        )

    consultation = models.DermatologistConsultation(
        user_id=current_user.id,
        status="requested",
        skin_type=profile.skin_type,
        concerns=profile.concerns,
        age_group=getattr(profile, "age_group", None),
        allergies=profile.allergies,
        exercise=profile.exercise,
        stress=profile.stress,
        sun_exposure=profile.sun_exposure,
        pollution_exposure=profile.pollution_exposure,
        environment=profile.environment,
        sleep=profile.sleep,
        water_intake=profile.water_intake,
    )
    db.add(consultation)
    db.commit()
    db.refresh(consultation)

    return {
        "message": "Consultation requested successfully.",
        "consultation": consultation_to_dict(consultation)
    }


# USER: View only their own consultations
@app.get("/consultations/my")
def my_consultations(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = db.query(models.DermatologistConsultation).filter(
        models.DermatologistConsultation.user_id == current_user.id
    ).order_by(models.DermatologistConsultation.created_at.desc()).all()

    return {"consultations": [consultation_to_dict(item) for item in items]}


# ADMIN: View all consultation requests
@app.get("/admin/consultations")
def admin_consultations(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_role(current_user, ["admin", "consultant"])
    items = db.query(models.DermatologistConsultation).order_by(
        models.DermatologistConsultation.created_at.desc()
    ).all()

    return {"consultations": [consultation_to_dict(item) for item in items]}


# ADMIN: List dermatologist accounts
@app.get("/admin/dermatologists")
def list_dermatologists(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_role(current_user, ["admin", "consultant"])
    dermatologists = db.query(models.User).filter(
        models.User.role == "dermatologist"
    ).all()

    return {
        "dermatologists": [
            {"id": item.id, "name": item.name, "email": item.email}
            for item in dermatologists
        ]
    }


# ADMIN: Assign a request to a dermatologist
@app.put("/admin/consultations/{consultation_id}/assign")
def assign_consultation(
    consultation_id: int,
    data: AssignConsultationRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_role(current_user, ["admin", "consultant"])
    dermatologist = db.query(models.User).filter(
        models.User.id == data.dermatologist_id
    ).first()

    if not dermatologist or getattr(dermatologist, "role", "user") != "dermatologist":
        raise HTTPException(
            status_code=400,
            detail="The selected account is not a dermatologist."
        )

    item = db.query(models.DermatologistConsultation).filter(
        models.DermatologistConsultation.id == consultation_id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Consultation not found.")

    item.dermatologist_id = dermatologist.id
    item.status = "assigned"
    db.commit()
    db.refresh(item)

    return {
        "message": "Consultation assigned successfully.",
        "consultation": consultation_to_dict(item)
    }


# DERMATOLOGIST: View only consultations assigned to them
@app.get("/dermatologist/consultations")
def dermatologist_consultations(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_role(current_user, ["dermatologist"])

    items = db.query(models.DermatologistConsultation).filter(
        models.DermatologistConsultation.dermatologist_id == current_user.id
    ).order_by(models.DermatologistConsultation.created_at.asc()).all()

    return {"consultations": [consultation_to_dict(item) for item in items]}


# DERMATOLOGIST: Save personalized guidance for an assigned user
@app.put("/dermatologist/consultations/{consultation_id}/respond")
def respond_to_consultation(
    consultation_id: int,
    data: ConsultationResponseRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_role(current_user, ["dermatologist"])

    item = db.query(models.DermatologistConsultation).filter(
        models.DermatologistConsultation.id == consultation_id,
        models.DermatologistConsultation.dermatologist_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Assigned consultation not found."
        )

    if not any([
        data.recommendations,
        data.ingredient_guidance,
        data.morning_routine,
        data.night_routine,
        data.precautions,
        data.follow_up_notes,
    ]):
        raise HTTPException(
            status_code=400,
            detail="Please enter at least one recommendation."
        )

    item.recommendations = data.recommendations
    item.ingredient_guidance = data.ingredient_guidance
    item.morning_routine = data.morning_routine
    item.night_routine = data.night_routine
    item.precautions = data.precautions
    item.follow_up_notes = data.follow_up_notes
    item.status = "completed"

    db.commit()
    db.refresh(item)

    return {
        "message": "Consultation response saved successfully.",
        "consultation": consultation_to_dict(item)
    }

# ============================================================
# ADMIN OVERVIEW + USER MANAGEMENT
# ============================================================

@app.get("/admin/overview")
def admin_overview(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_role(current_user, ["admin"])

    total_users = db.query(models.User).count()

    total_dermatologists = db.query(models.User).filter(
        models.User.role == "dermatologist"
    ).count()

    total_consultants = db.query(models.User).filter(
        models.User.role == "consultant"
    ).count()

    total_assessments = db.query(models.SkinProfile).count()

    pending_consultations = db.query(
        models.DermatologistConsultation
    ).filter(
        models.DermatologistConsultation.status.in_(
            ["requested", "pending"]
        )
    ).count()

    return {
        "total_users": total_users,
        "total_dermatologists": total_dermatologists,
        "total_consultants": total_consultants,
        "total_assessments": total_assessments,
        "pending_consultations": pending_consultations
    }


@app.get("/admin/users")
def admin_list_users(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_role(current_user, ["admin"])

    users = db.query(models.User).order_by(
        models.User.id.desc()
    ).all()

    return {
        "users": [
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role or "user",
                "email_verified": bool(user.email_verified)
            }
            for user in users
        ]
    }


@app.put("/admin/users/{user_id}/role")
def admin_update_user_role(
    user_id: int,
    data: UpdateUserRoleRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_role(current_user, ["admin"])

    allowed_roles = {
        "user",
        "dermatologist",
        "consultant",
        "admin"
    }

    new_role = data.role.strip().lower()

    if new_role not in allowed_roles:
        raise HTTPException(
            status_code=400,
            detail="Invalid role."
        )

    if user_id == current_user.id and new_role != "admin":
        raise HTTPException(
            status_code=400,
            detail="You cannot remove your own admin role."
        )

    user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    user.role = new_role
    db.commit()
    db.refresh(user)

    return {
        "message": "User role updated successfully.",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "email_verified": bool(user.email_verified)
        }
    }
