from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
import sqlite3
import json
import os


# =========================================================
# SKINAI BACKEND - MILESTONE 4
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "skinai.db")


app = FastAPI(
    title="SkinAI API",
    version="4.0",
    description="AI Skin Intelligence & Personalized Skincare Planner"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# =========================================================
# DATABASE
# =========================================================

def get_connection():

    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row

    return connection


def now_text():

    return datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )


def clean(value):

    if value is None:
        return ""

    return str(value).strip()


def normalize_text(value):

    return clean(value).lower()


def row_dict(row):

    if row is None:
        return None

    return dict(row)


def parse_json(value, default=None):

    if default is None:
        default = []

    if not value:
        return default

    try:
        return json.loads(value)

    except Exception:
        return default


def contains(text, words):

    text = normalize_text(text)

    return any(
        word in text
        for word in words
    )


# =========================================================
# DATABASE INITIALIZATION
# =========================================================

def init_db():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT DEFAULT 'User',
            created_at TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS skin_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            age INTEGER,
            skin_type TEXT,
            concern TEXT,
            sensitivity TEXT,
            updated_at TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS lifestyle (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            water TEXT,
            sleep TEXT,
            exercise TEXT,
            updated_at TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT,
            skin_health_score REAL DEFAULT 0,
            acne_score REAL DEFAULT 0,
            pigmentation_score REAL DEFAULT 0,
            dryness_score REAL DEFAULT 0,
            oiliness_score REAL DEFAULT 0,
            sensitivity_score REAL DEFAULT 0,
            risk_factors TEXT,
            priority_concern TEXT,
            ai_assessment TEXT,
            recommendations TEXT,
            created_at TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS shared_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT,
            user_name TEXT,
            assessment_id INTEGER,
            status TEXT DEFAULT 'Shared',
            dermatologist_name TEXT,
            dermatologist_recommendation TEXT,
            shared_at TEXT,
            reviewed_at TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ingredients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            purpose TEXT,
            suitable_skin TEXT,
            concerns TEXT,
            benefits TEXT,
            pros TEXT,
            cons TEXT,
            irritation TEXT,
            allergy_warning TEXT,
            interaction_notes TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            brand TEXT DEFAULT 'SkinAI',
            category TEXT,
            skin_type TEXT,
            concern TEXT,
            price REAL DEFAULT 0,
            description TEXT,
            ingredients TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS routine_tracking (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT,
            tracking_date TEXT,
            routine_type TEXT,
            completed INTEGER DEFAULT 0,
            morning_completed INTEGER DEFAULT 0,
            evening_completed INTEGER DEFAULT 0,
            notes TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS progress_tracking (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT,
            date TEXT,
            score REAL DEFAULT 0,
            concern TEXT,
            notes TEXT,
            created_at TEXT
        )
    """)

    connection.commit()
    connection.close()


# =========================================================
# REQUEST MODELS
# =========================================================

class RegisterRequest(BaseModel):

    name: str
    email: str
    password: str
    role: str = "User"


class LoginRequest(BaseModel):

    email: str
    password: str


class SkinProfileRequest(BaseModel):

    email: str
    age: Optional[int] = None
    skin_type: str = ""
    concern: str = ""
    sensitivity: str = ""


class LifestyleRequest(BaseModel):

    email: str
    water: str = ""
    sleep: str = ""
    exercise: str = ""


class AssessmentRequest(BaseModel):

    email: str


class ShareReportRequest(BaseModel):

    email: str
    assessment_id: Optional[int] = None
    dermatologist_name: str = ""


class ProductRecommendationRequest(BaseModel):

    email: str
    skin_type: str = ""
    concern: str = ""
    budget: Optional[float] = None
    # =========================================================
# ADDITIONAL REQUEST MODELS
# =========================================================

class IngredientAnalysisRequest(BaseModel):

    ingredient: str
    skin_type: str = ""
    sensitivity: str = ""


class IngredientInteractionRequest(BaseModel):

    ingredients: List[str] = []


class ProductCompareRequest(BaseModel):

    product_ids: List[int] = []


class RoutineTrackingRequest(BaseModel):

    email: str
    tracking_date: Optional[str] = None
    routine_type: Optional[str] = None
    completed: Optional[bool] = None
    morning_completed: Optional[bool] = None
    evening_completed: Optional[bool] = None
    notes: str = ""


class ProgressTrackingRequest(BaseModel):

    email: str
    date: Optional[str] = None
    score: float = 0
    concern: str = ""
    notes: str = ""


class DermatologistReviewRequest(BaseModel):

    report_id: int
    dermatologist_name: str = ""
    recommendation: str = ""


class ProfileUpdateRequest(BaseModel):

    email: str
    age: Optional[int] = None
    skin_type: str = ""
    concern: str = ""
    sensitivity: str = ""


# =========================================================
# DEFAULT INGREDIENTS
# =========================================================

DEFAULT_INGREDIENTS = [

    {
        "name": "Salicylic Acid",
        "purpose": "Helps unclog pores and control excess oil.",
        "suitable_skin": "Oily, Combination, Acne-prone",
        "concerns": "Acne, Blackheads, Oiliness",
        "benefits": "Pore cleansing and exfoliation",
        "pros": "Useful for acne-prone skin.",
        "cons": "May cause dryness if overused.",
        "irritation": "Possible dryness, redness or peeling.",
        "allergy_warning": "Stop use if a reaction occurs.",
        "interaction_notes": "Use carefully with other strong actives."
    },

    {
        "name": "Vitamin C",
        "purpose": "Antioxidant that supports brighter-looking skin.",
        "suitable_skin": "Most skin types",
        "concerns": "Pigmentation, Dullness, Uneven tone",
        "benefits": "Brightening and antioxidant support",
        "pros": "Supports an even-looking skin tone.",
        "cons": "Some formulas may irritate sensitive skin.",
        "irritation": "Possible stinging or redness.",
        "allergy_warning": "Check the complete product formula.",
        "interaction_notes": "Generally compatible with sunscreen."
    },

    {
        "name": "Niacinamide",
        "purpose": "Supports the skin barrier and oil control.",
        "suitable_skin": "Most skin types",
        "concerns": "Oiliness, Uneven tone",
        "benefits": "Barrier and oil-control support",
        "pros": "Generally well tolerated.",
        "cons": "High concentrations may irritate some users.",
        "irritation": "Possible redness or tingling.",
        "allergy_warning": "Stop use if irritation occurs.",
        "interaction_notes": "Generally compatible with many ingredients."
    },

    {
        "name": "Hyaluronic Acid",
        "purpose": "Helps attract and retain moisture.",
        "suitable_skin": "Dry, Normal, Combination, Oily",
        "concerns": "Dryness, Dehydration",
        "benefits": "Hydration support",
        "pros": "Lightweight hydration.",
        "cons": "Works best with a moisturizer.",
        "irritation": "Usually low.",
        "allergy_warning": "Check the complete formula.",
        "interaction_notes": "Generally compatible with most ingredients."
    },

    {
        "name": "Retinol",
        "purpose": "Supports cell turnover and skin texture.",
        "suitable_skin": "Acne-prone and photoaging concerns",
        "concerns": "Acne, Texture, Fine lines",
        "benefits": "Supports smoother-looking skin.",
        "pros": "Evidence-supported skincare active.",
        "cons": "May cause dryness and irritation.",
        "irritation": "Peeling, dryness or redness.",
        "allergy_warning": "Stop use for significant reactions.",
        "interaction_notes": "Avoid layering multiple strong actives."
    },

    {
        "name": "Ceramides",
        "purpose": "Supports the skin barrier and moisture retention.",
        "suitable_skin": "Most skin types, especially dry and sensitive",
        "concerns": "Dryness, Sensitivity",
        "benefits": "Barrier support and moisturization",
        "pros": "Useful for barrier-focused routines.",
        "cons": "Some products may feel heavy.",
        "irritation": "Usually low.",
        "allergy_warning": "Check the complete product formula.",
        "interaction_notes": "Generally compatible with active ingredients."
    }
]


# =========================================================
# DEFAULT PRODUCTS
# =========================================================

DEFAULT_PRODUCTS = [

    {
        "name": "Salicylic Acid Face Wash",
        "brand": "SkinAI",
        "category": "Cleanser",
        "skin_type": "Oily, Combination",
        "concern": "Acne, Oiliness",
        "price": 299,
        "description": "Cleanser for oily and acne-prone skin.",
        "ingredients": "Salicylic Acid"
    },

    {
        "name": "Gentle Hydrating Cleanser",
        "brand": "SkinAI",
        "category": "Cleanser",
        "skin_type": "Dry, Normal, Sensitive",
        "concern": "Dryness, Sensitivity",
        "price": 349,
        "description": "Gentle cleanser for barrier-friendly routines.",
        "ingredients": "Ceramides, Glycerin"
    },

    {
        "name": "Vitamin C Brightening Serum",
        "brand": "SkinAI",
        "category": "Serum",
        "skin_type": "Normal, Combination, Dry",
        "concern": "Pigmentation, Dullness",
        "price": 499,
        "description": "Brightening serum for uneven-looking tone.",
        "ingredients": "Vitamin C"
    },

    {
        "name": "Niacinamide Serum",
        "brand": "SkinAI",
        "category": "Serum",
        "skin_type": "Oily, Combination, Normal",
        "concern": "Oiliness, Uneven Tone",
        "price": 399,
        "description": "Lightweight serum for oil and barrier support.",
        "ingredients": "Niacinamide"
    },

    {
        "name": "Hyaluronic Acid Serum",
        "brand": "SkinAI",
        "category": "Serum",
        "skin_type": "Dry, Normal, Combination, Oily",
        "concern": "Dryness, Dehydration",
        "price": 449,
        "description": "Hydrating serum for dehydrated skin.",
        "ingredients": "Hyaluronic Acid"
    },

    {
        "name": "Ceramide Moisturizer",
        "brand": "SkinAI",
        "category": "Moisturizer",
        "skin_type": "Dry, Sensitive, Normal",
        "concern": "Dryness, Sensitivity",
        "price": 549,
        "description": "Barrier-supporting moisturizer.",
        "ingredients": "Ceramides, Hyaluronic Acid"
    },

    {
        "name": "Daily Sunscreen SPF 50",
        "brand": "SkinAI",
        "category": "Sunscreen",
        "skin_type": "All Skin Types",
        "concern": "Pigmentation, Sun Protection",
        "price": 599,
        "description": "Daily broad-spectrum sunscreen.",
        "ingredients": "UV Filters"
    }
]
# =========================================================
# DATABASE SEEDING
# =========================================================

def seed_ingredients():
    connection = get_connection()
    cursor = connection.cursor()

    for item in DEFAULT_INGREDIENTS:

        existing = cursor.execute(
            """
            SELECT id
            FROM ingredients
            WHERE lower(name)=?
            """,
            (item["name"].lower(),)
        ).fetchone()

        if existing:
            cursor.execute(
                """
                UPDATE ingredients
                SET
                    purpose=?,
                    suitable_skin=?,
                    concerns=?,
                    benefits=?,
                    pros=?,
                    cons=?,
                    irritation=?,
                    allergy_warning=?,
                    interaction_notes=?
                WHERE id=?
                """,
                (
                    item["purpose"],
                    item["suitable_skin"],
                    item["concerns"],
                    item["benefits"],
                    item["pros"],
                    item["cons"],
                    item["irritation"],
                    item["allergy_warning"],
                    item["interaction_notes"],
                    existing["id"]
                )
            )
        else:
            cursor.execute(
                """
                INSERT INTO ingredients
                (
                    name,
                    purpose,
                    suitable_skin,
                    concerns,
                    benefits,
                    pros,
                    cons,
                    irritation,
                    allergy_warning,
                    interaction_notes
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    item["name"],
                    item["purpose"],
                    item["suitable_skin"],
                    item["concerns"],
                    item["benefits"],
                    item["pros"],
                    item["cons"],
                    item["irritation"],
                    item["allergy_warning"],
                    item["interaction_notes"]
                )
            )

    connection.commit()
    connection.close()


def seed_products():
    connection = get_connection()
    cursor = connection.cursor()

    for item in DEFAULT_PRODUCTS:

        existing = cursor.execute(
            """
            SELECT id
            FROM products
            WHERE lower(name)=?
            """,
            (item["name"].lower(),)
        ).fetchone()

        if existing:
            cursor.execute(
                """
                UPDATE products
                SET
                    brand=?,
                    category=?,
                    skin_type=?,
                    concern=?,
                    price=?,
                    description=?,
                    ingredients=?
                WHERE id=?
                """,
                (
                    item["brand"],
                    item["category"],
                    item["skin_type"],
                    item["concern"],
                    item["price"],
                    item["description"],
                    item["ingredients"],
                    existing["id"]
                )
            )
        else:
            cursor.execute(
                """
                INSERT INTO products
                (
                    name,
                    brand,
                    category,
                    skin_type,
                    concern,
                    price,
                    description,
                    ingredients
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    item["name"],
                    item["brand"],
                    item["category"],
                    item["skin_type"],
                    item["concern"],
                    item["price"],
                    item["description"],
                    item["ingredients"]
                )
            )

    connection.commit()
    connection.close()


# =========================================================
# STARTUP
# =========================================================

@app.on_event("startup")
def startup_event():

    init_db()

    try:
        seed_ingredients()
        seed_products()
    except Exception as error:
        print("Seed error:", error)


# =========================================================
# BASIC API
# =========================================================

@app.get("/")
def root():

    return {
        "success": True,
        "message": "SkinAI Backend is running",
        "version": "4.0"
    }


@app.get("/health")
def health():

    return {
        "status": "healthy",
        "service": "SkinAI Backend",
        "version": "4.0"
    }


@app.get("/database-status")
def database_status():

    connection = get_connection()

    try:

        users = connection.execute(
            "SELECT COUNT(*) AS count FROM users"
        ).fetchone()["count"]

        assessments = connection.execute(
            "SELECT COUNT(*) AS count FROM assessments"
        ).fetchone()["count"]

        products = connection.execute(
            "SELECT COUNT(*) AS count FROM products"
        ).fetchone()["count"]

        ingredients = connection.execute(
            "SELECT COUNT(*) AS count FROM ingredients"
        ).fetchone()["count"]

        return {
            "success": True,
            "database": "SQLite",
            "connected": True,
            "users": users,
            "assessments": assessments,
            "products": products,
            "ingredients": ingredients
        }

    finally:
        connection.close()


# =========================================================
# REGISTER
# =========================================================

@app.post("/register")
def register(request: RegisterRequest):

    name = clean(request.name)
    email = clean(request.email).lower()
    password = clean(request.password)

    if not name or not email or not password:
        return {
            "success": False,
            "message": "All fields are required."
        }

    allowed_roles = [
        "User",
        "Dermatologist",
        "Consultant"
    ]

    role = request.role if request.role in allowed_roles else "User"

    connection = get_connection()

    try:

        existing = connection.execute(
            """
            SELECT id
            FROM users
            WHERE lower(email)=?
            """,
            (email,)
        ).fetchone()

        if existing:

            return {
                "success": False,
                "message": "Email already registered."
            }

        cursor = connection.execute(
            """
            INSERT INTO users
            (
                name,
                email,
                password,
                role,
                created_at
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                name,
                email,
                password,
                role,
                now_text()
            )
        )

        connection.commit()

        return {
            "success": True,
            "message": "Registration successful.",
            "user": {
                "id": cursor.lastrowid,
                "name": name,
                "email": email,
                "role": role
            }
        }

    finally:
        connection.close()
        # =========================================================
# LOGIN
# =========================================================

@app.post("/login")
def login(request: LoginRequest):

    email = clean(request.email).lower()
    password = clean(request.password)

    if not email or not password:
        return {
            "success": False,
            "message": "Email and password are required."
        }

    connection = get_connection()

    try:

        user = connection.execute(
            """
            SELECT id, name, email, role
            FROM users
            WHERE lower(email)=?
            AND password=?
            """,
            (email, password)
        ).fetchone()

        if not user:

            return {
                "success": False,
                "message": "Invalid email or password."
            }

        return {
            "success": True,
            "message": "Login successful.",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"]
            }
        }

    finally:
        connection.close()


# =========================================================
# USERS - ADMIN
# =========================================================

@app.get("/users")
def get_users():

    connection = get_connection()

    try:

        records = connection.execute(
            """
            SELECT
                id,
                name,
                email,
                role,
                created_at
            FROM users
            ORDER BY id DESC
            """
        ).fetchall()

        return {
            "success": True,
            "users": [row_dict(row) for row in records]
        }

    finally:
        connection.close()


# =========================================================
# SKIN PROFILE
# =========================================================

@app.post("/skin-profile")
def save_skin_profile(request: SkinProfileRequest):

    email = clean(request.email)

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Email is required."
        )

    connection = get_connection()

    try:

        existing = connection.execute(
            """
            SELECT id
            FROM skin_profiles
            WHERE lower(email)=?
            """,
            (email.lower(),)
        ).fetchone()

        if existing:

            connection.execute(
                """
                UPDATE skin_profiles
                SET
                    age=?,
                    skin_type=?,
                    concern=?,
                    sensitivity=?
                WHERE id=?
                """,
                (
                    request.age,
                    clean(request.skin_type),
                    clean(request.concern),
                    clean(request.sensitivity),
                    existing["id"]
                )
            )

        else:

            connection.execute(
                """
                INSERT INTO skin_profiles
                (
                    email,
                    age,
                    skin_type,
                    concern,
                    sensitivity
                )
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    email,
                    request.age,
                    clean(request.skin_type),
                    clean(request.concern),
                    clean(request.sensitivity)
                )
            )

        connection.commit()

        return {
            "success": True,
            "message": "Skin profile saved successfully."
        }

    finally:
        connection.close()


@app.get("/skin-profile/{email}")
def get_skin_profile(email: str):

    connection = get_connection()

    try:

        profile = connection.execute(
            """
            SELECT *
            FROM skin_profiles
            WHERE lower(email)=?
            ORDER BY id DESC
            LIMIT 1
            """,
            (email.lower(),)
        ).fetchone()

        if not profile:

            return {
                "success": True,
                "profile": None
            }

        return {
            "success": True,
            "profile": row_dict(profile)
        }

    finally:
        connection.close()


# =========================================================
# LIFESTYLE
# =========================================================

@app.post("/lifestyle")
def save_lifestyle(request: LifestyleRequest):

    email = clean(request.email)

    connection = get_connection()

    try:

        existing = connection.execute(
            """
            SELECT id
            FROM lifestyle
            WHERE lower(email)=?
            """,
            (email.lower(),)
        ).fetchone()

        if existing:

            connection.execute(
                """
                UPDATE lifestyle
                SET
                    water=?,
                    sleep=?,
                    exercise=?
                WHERE id=?
                """,
                (
                    clean(request.water),
                    clean(request.sleep),
                    clean(request.exercise),
                    existing["id"]
                )
            )

        else:

            connection.execute(
                """
                INSERT INTO lifestyle
                (
                    email,
                    water,
                    sleep,
                    exercise
                )
                VALUES (?, ?, ?, ?)
                """,
                (
                    email,
                    clean(request.water),
                    clean(request.sleep),
                    clean(request.exercise)
                )
            )

        connection.commit()

        return {
            "success": True,
            "message": "Lifestyle information saved successfully."
        }

    finally:
        connection.close()


@app.get("/lifestyle/{email}")
def get_lifestyle(email: str):

    connection = get_connection()

    try:

        lifestyle = connection.execute(
            """
            SELECT *
            FROM lifestyle
            WHERE lower(email)=?
            ORDER BY id DESC
            LIMIT 1
            """,
            (email.lower(),)
        ).fetchone()

        return {
            "success": True,
            "lifestyle": row_dict(lifestyle)
            if lifestyle else None
        }

    finally:
        connection.close()
        # =========================================================
# ASSESSMENT - SAVE
# =========================================================

@app.post("/assessment")
def save_assessment(request: AssessmentRequest):

    email = clean(request.email)

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Email is required."
        )

    connection = get_connection()

    try:

        profile = connection.execute(
            """
            SELECT *
            FROM skin_profiles
            WHERE lower(email)=?
            ORDER BY id DESC
            LIMIT 1
            """,
            (email.lower(),)
        ).fetchone()

        lifestyle = connection.execute(
            """
            SELECT *
            FROM lifestyle
            WHERE lower(email)=?
            ORDER BY id DESC
            LIMIT 1
            """,
            (email.lower(),)
        ).fetchone()

        if not profile:

            return {
                "success": False,
                "message": "Please complete your skin profile first."
            }

        skin_type = clean(profile["skin_type"])
        concern = clean(profile["concern"])
        sensitivity = clean(profile["sensitivity"])

        score = 70

        if skin_type:
            score += 5

        if concern:
            score += 5

        if sensitivity.lower() in [
            "low",
            "normal"
        ]:
            score += 5

        if lifestyle:

            water = normalize_text(lifestyle["water"])
            sleep = normalize_text(lifestyle["sleep"])
            exercise = normalize_text(lifestyle["exercise"])

            if contains(water, ["2", "3", "good", "adequate"]):
                score += 3

            if contains(sleep, ["7", "8", "9", "good"]):
                score += 3

            if contains(exercise, ["yes", "regular", "daily"]):
                score += 2

        score = min(score, 100)

        priority = "Medium"

        if contains(
            concern,
            ["acne", "severe", "pigmentation", "dark spots"]
        ):
            priority = "High"

        elif contains(
            concern,
            ["dryness", "oiliness", "dullness"]
        ):
            priority = "Medium"

        else:
            priority = "Low"

        assessment_data = {
            "skin_type": skin_type,
            "concern": concern,
            "sensitivity": sensitivity,
            "priority": priority,
            "skin_health_score": score,
            "risk_factors": [
                "Irregular skincare routine"
                if not lifestyle
                else "Lifestyle monitoring required"
            ],
            "morning_routine": [
                "Gentle cleanser",
                "Recommended serum",
                "Moisturizer",
                "Broad-spectrum sunscreen SPF 30+"
            ],
            "evening_routine": [
                "Gentle cleanser",
                "Targeted treatment",
                "Moisturizer"
            ],
            "weekly_plan": [
                "Follow routine consistently",
                "Maintain hydration",
                "Track skin changes"
            ],
            "recommendation": (
                "Maintain a consistent skincare routine "
                "and monitor your skin progress."
            )
        }

        cursor = connection.execute(
            """
            INSERT INTO assessments
            (
                email,
                skin_type,
                concern,
                sensitivity,
                score,
                priority,
                assessment_data,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                email,
                skin_type,
                concern,
                sensitivity,
                score,
                priority,
                json.dumps(assessment_data),
                now_text()
            )
        )

        connection.commit()

        return {
            "success": True,
            "message": "Assessment saved successfully.",
            "assessment_id": cursor.lastrowid,
            "assessment": assessment_data
        }

    finally:
        connection.close()


# =========================================================
# GET USER ASSESSMENTS
# =========================================================

@app.get("/assessment/{email}")
def get_assessment(email: str):

    connection = get_connection()

    try:

        records = connection.execute(
            """
            SELECT *
            FROM assessments
            WHERE lower(email)=?
            ORDER BY id DESC
            """,
            (email.lower(),)
        ).fetchall()

        result = []

        for record in records:

            item = row_dict(record)

            item["assessment_data"] = parse_json(
                item.get("assessment_data"),
                {}
            )

            result.append(item)

        return {
            "success": True,
            "assessments": result
        }

    finally:
        connection.close()


# =========================================================
# ALL ASSESSMENTS - ADMIN
# =========================================================

@app.get("/assessments")
def get_all_assessments():

    connection = get_connection()

    try:

        records = connection.execute(
            """
            SELECT
                id,
                email,
                skin_type,
                concern,
                sensitivity,
                score,
                priority,
                assessment_data,
                created_at
            FROM assessments
            ORDER BY id DESC
            """
        ).fetchall()

        assessments = []

        for record in records:

            item = row_dict(record)

            item["assessment_data"] = parse_json(
                item.get("assessment_data"),
                {}
            )

            assessments.append(item)

        return {
            "success": True,
            "assessments": assessments
        }

    finally:
        connection.close()


# =========================================================
# LATEST RECOMMENDATION
# =========================================================

@app.get("/recommendations/{email}")
def get_recommendations(email: str):

    connection = get_connection()

    try:

        record = connection.execute(
            """
            SELECT *
            FROM assessments
            WHERE lower(email)=?
            ORDER BY id DESC
            LIMIT 1
            """,
            (email.lower(),)
        ).fetchone()

        if not record:

            return {
                "success": True,
                "recommendations": None
            }

        data = parse_json(
            record["assessment_data"],
            {}
        )

        return {
            "success": True,
            "recommendations": data
        }

    finally:
        connection.close()
        # =========================================================
# SHARE REPORT
# =========================================================

@app.post("/share-report")
def share_report(request: ShareReportRequest):

    email = clean(request.email)

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Email is required."
        )

    connection = get_connection()

    try:

        assessment = None

        if request.assessment_id:

            assessment = connection.execute(
                """
                SELECT *
                FROM assessments
                WHERE id=?
                AND lower(email)=?
                """,
                (
                    request.assessment_id,
                    email.lower()
                )
            ).fetchone()

        if not assessment:

            assessment = connection.execute(
                """
                SELECT *
                FROM assessments
                WHERE lower(email)=?
                ORDER BY id DESC
                LIMIT 1
                """,
                (email.lower(),)
            ).fetchone()

        if not assessment:

            return {
                "success": False,
                "message": "No assessment found to share."
            }

        dermatologist_name = clean(
            request.dermatologist_name
        )

        if not dermatologist_name:
            dermatologist_name = "SkinAI Dermatologist"

        cursor = connection.execute(
            """
            INSERT INTO shared_reports
            (
                email,
                assessment_id,
                dermatologist_name,
                status,
                shared_at
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                email,
                assessment["id"],
                dermatologist_name,
                "Shared",
                now_text()
            )
        )

        connection.commit()

        return {
            "success": True,
            "message": "Report shared successfully.",
            "report_id": cursor.lastrowid,
            "status": "Shared"
        }

    finally:
        connection.close()


# =========================================================
# SHARED REPORT DETAILS
# =========================================================

@app.get("/shared-report/{report_id}")
def get_shared_report(report_id: int):

    connection = get_connection()

    try:

        report = connection.execute(
            """
            SELECT
                sr.*,
                a.skin_type,
                a.concern,
                a.sensitivity,
                a.score,
                a.priority,
                a.assessment_data,
                a.created_at AS assessment_date
            FROM shared_reports sr
            LEFT JOIN assessments a
                ON sr.assessment_id = a.id
            WHERE sr.id=?
            """,
            (report_id,)
        ).fetchone()

        if not report:

            return {
                "success": False,
                "message": "Shared report not found."
            }

        data = row_dict(report)

        data["assessment_data"] = parse_json(
            data.get("assessment_data"),
            {}
        )

        return {
            "success": True,
            "report": data
        }

    finally:
        connection.close()


# =========================================================
# DERMATOLOGIST REPORTS
# =========================================================

@app.get("/dermatologist-reports")
def dermatologist_reports():

    connection = get_connection()

    try:

        records = connection.execute(
            """
            SELECT
                sr.id AS report_id,
                sr.email,
                sr.dermatologist_name,
                sr.status,
                sr.shared_at,

                a.skin_type,
                a.concern,
                a.sensitivity,
                a.score,
                a.priority,
                a.assessment_data,
                a.created_at

            FROM shared_reports sr

            LEFT JOIN assessments a
                ON sr.assessment_id = a.id

            ORDER BY sr.id DESC
            """
        ).fetchall()

        reports = []

        for record in records:

            item = row_dict(record)

            item["assessment_data"] = parse_json(
                item.get("assessment_data"),
                {}
            )

            reports.append(item)

        return {
            "success": True,
            "reports": reports
        }

    finally:
        connection.close()


# =========================================================
# USER SHARED REPORTS
# =========================================================

@app.get("/user-reports/{email}")
def user_reports(email: str):

    connection = get_connection()

    try:

        records = connection.execute(
            """
            SELECT
                sr.id AS report_id,
                sr.email,
                sr.dermatologist_name,
                sr.status,
                sr.shared_at,

                a.skin_type,
                a.concern,
                a.sensitivity,
                a.score,
                a.priority,
                a.assessment_data,
                a.created_at

            FROM shared_reports sr

            LEFT JOIN assessments a
                ON sr.assessment_id = a.id

            WHERE lower(sr.email)=?

            ORDER BY sr.id DESC
            """,
            (email.lower(),)
        ).fetchall()

        reports = []

        for record in records:

            item = row_dict(record)

            item["assessment_data"] = parse_json(
                item.get("assessment_data"),
                {}
            )

            reports.append(item)

        return {
            "success": True,
            "reports": reports
        }

    finally:
        connection.close()


# =========================================================
# DERMATOLOGIST REVIEW
# =========================================================

@app.post("/dermatologist-review")
def dermatologist_review(
    request: DermatologistReviewRequest
):

    connection = get_connection()

    try:

        report = connection.execute(
            """
            SELECT id
            FROM shared_reports
            WHERE id=?
            """,
            (request.report_id,)
        ).fetchone()

        if not report:

            return {
                "success": False,
                "message": "Report not found."
            }

        connection.execute(
            """
            UPDATE shared_reports
            SET
                status=?,
                dermatologist_name=?
            WHERE id=?
            """,
            (
                "Reviewed",
                clean(request.dermatologist_name)
                or "SkinAI Dermatologist",
                request.report_id
            )
        )

        connection.commit()

        return {
            "success": True,
            "message": "Report reviewed successfully.",
            "status": "Reviewed",
            "recommendation": clean(
                request.recommendation
            )
        }

    finally:
        connection.close()
        # =========================================================
# INGREDIENT INTELLIGENCE
# =========================================================

@app.get("/ingredients")
def get_ingredients():

    connection = get_connection()

    try:

        records = connection.execute(
            """
            SELECT *
            FROM ingredients
            ORDER BY name ASC
            """
        ).fetchall()

        return {
            "success": True,
            "ingredients": [
                row_dict(record)
                for record in records
            ]
        }

    finally:
        connection.close()


@app.post("/ingredient-analysis")
def ingredient_analysis(
    request: IngredientAnalysisRequest
):

    ingredient_name = clean(request.ingredient)

    if not ingredient_name:

        return {
            "success": False,
            "message": "Ingredient is required."
        }

    connection = get_connection()

    try:

        ingredient = connection.execute(
            """
            SELECT *
            FROM ingredients
            WHERE lower(name) LIKE ?
            LIMIT 1
            """,
            (f"%{ingredient_name.lower()}%",)
        ).fetchone()

        if not ingredient:

            return {
                "success": False,
                "message": "Ingredient information not available."
            }

        result = row_dict(ingredient)

        sensitivity = normalize_text(
            request.sensitivity
        )

        if sensitivity in [
            "high",
            "sensitive",
            "very sensitive"
        ]:

            result["sensitivity_note"] = (
                "Patch testing and cautious introduction "
                "are recommended for sensitive skin."
            )

        else:

            result["sensitivity_note"] = (
                "Introduce new active ingredients gradually."
            )

        return {
            "success": True,
            "ingredient": result
        }

    finally:
        connection.close()


@app.post("/ingredient-interaction")
def ingredient_interaction(
    request: IngredientInteractionRequest
):

    ingredients = [
        normalize_text(item)
        for item in request.ingredients
        if clean(item)
    ]

    warnings = []

    strong_actives = [
        "retinol",
        "salicylic acid",
        "glycolic acid",
        "benzoyl peroxide"
    ]

    strong_count = sum(
        1
        for item in ingredients
        if any(
            active in item
            for active in strong_actives
        )
    )

    if strong_count >= 2:

        warnings.append(
            "Multiple strong active ingredients "
            "may increase irritation."
        )

    if "retinol" in ingredients and "salicylic acid" in ingredients:

        warnings.append(
            "Retinol and Salicylic Acid may be irritating "
            "when layered together."
        )

    if "retinol" in ingredients and "glycolic acid" in ingredients:

        warnings.append(
            "Retinol and Glycolic Acid can increase "
            "the risk of dryness and irritation."
        )

    if not warnings:

        warnings.append(
            "No major interaction was identified "
            "from the selected ingredients."
        )

    return {
        "success": True,
        "ingredients": ingredients,
        "warnings": warnings
    }


# =========================================================
# PRODUCTS
# =========================================================

@app.get("/products")
def get_products():

    connection = get_connection()

    try:

        records = connection.execute(
            """
            SELECT *
            FROM products
            ORDER BY id DESC
            """
        ).fetchall()

        return {
            "success": True,
            "products": [
                row_dict(record)
                for record in records
            ]
        }

    finally:
        connection.close()


@app.get("/products/{product_id}")
def get_product(product_id: int):

    connection = get_connection()

    try:

        product = connection.execute(
            """
            SELECT *
            FROM products
            WHERE id=?
            """,
            (product_id,)
        ).fetchone()

        if not product:

            return {
                "success": False,
                "message": "Product not found."
            }

        return {
            "success": True,
            "product": row_dict(product)
        }

    finally:
        connection.close()


# =========================================================
# PRODUCT RECOMMENDATIONS
# =========================================================

@app.post("/product-recommendations")
def product_recommendations(
    request: ProductRecommendationRequest
):

    skin_type = normalize_text(request.skin_type)
    concern = normalize_text(request.concern)

    connection = get_connection()

    try:

        records = connection.execute(
            """
            SELECT *
            FROM products
            ORDER BY id DESC
            """
        ).fetchall()

        recommendations = []

        for record in records:

            product = row_dict(record)

            score = 50

            product_skin = normalize_text(
                product.get("skin_type")
            )

            product_concern = normalize_text(
                product.get("concern")
            )

            if (
                skin_type
                and (
                    skin_type in product_skin
                    or "all skin" in product_skin
                )
            ):
                score += 25

            if concern and concern in product_concern:
                score += 20

            price = float(
                product.get("price") or 0
            )

            if (
                request.budget is not None
                and price > request.budget
            ):
                continue

            ingredients = normalize_text(
                product.get("ingredients")
            )

            if request.email:

                profile = connection.execute(
                    """
                    SELECT sensitivity
                    FROM skin_profiles
                    WHERE lower(email)=?
                    ORDER BY id DESC
                    LIMIT 1
                    """,
                    (request.email.lower(),)
                ).fetchone()

                if profile:

                    sensitivity = normalize_text(
                        profile["sensitivity"]
                    )

                    strong_ingredients = [
                        "salicylic acid",
                        "retinol",
                        "benzoyl peroxide",
                        "glycolic acid"
                    ]

                    if sensitivity in [
                        "high",
                        "sensitive",
                        "very sensitive"
                    ]:

                        if any(
                            item in ingredients
                            for item in strong_ingredients
                        ):
                            score -= 15
                        else:
                            score += 5

            score = max(
                0,
                min(score, 100)
            )

            product["recommendation_score"] = score

            if score >= 70:

                recommendations.append(product)

        recommendations.sort(
            key=lambda item:
            item["recommendation_score"],
            reverse=True
        )

        return {
            "success": True,
            "recommendations": recommendations[:10]
        }

    finally:
        connection.close()
        # =========================================================
# PRODUCT COMPARE
# =========================================================

@app.post("/product-compare")
def product_compare(request: ProductCompareRequest):

    if not request.product_ids:
        return {
            "success": False,
            "message": "Please select products to compare."
        }

    connection = get_connection()

    try:

        placeholders = ",".join(
            ["?"] * len(request.product_ids)
        )

        records = connection.execute(
            f"""
            SELECT *
            FROM products
            WHERE id IN ({placeholders})
            ORDER BY id ASC
            """,
            request.product_ids
        ).fetchall()

        return {
            "success": True,
            "products": [
                row_dict(record)
                for record in records
            ]
        }

    finally:
        connection.close()


# =========================================================
# PERSONALIZED PRODUCTS
# =========================================================

@app.get("/personalized-products/{email}")
def personalized_products(email: str):

    connection = get_connection()

    try:

        profile = connection.execute(
            """
            SELECT *
            FROM skin_profiles
            WHERE lower(email)=?
            ORDER BY id DESC
            LIMIT 1
            """,
            (email.lower(),)
        ).fetchone()

        if not profile:

            return {
                "success": True,
                "products": []
            }

        skin_type = clean(
            profile["skin_type"]
        )

        concern = clean(
            profile["concern"]
        )

        records = connection.execute(
            """
            SELECT *
            FROM products
            ORDER BY id DESC
            """
        ).fetchall()

        products = []

        for record in records:

            product = row_dict(record)

            score = 50

            product_skin = normalize_text(
                product.get("skin_type")
            )

            product_concern = normalize_text(
                product.get("concern")
            )

            if (
                normalize_text(skin_type)
                and (
                    normalize_text(skin_type)
                    in product_skin
                    or "all skin" in product_skin
                )
            ):
                score += 25

            if (
                normalize_text(concern)
                and normalize_text(concern)
                in product_concern
            ):
                score += 20

            product["recommendation_score"] = min(
                score,
                100
            )

            products.append(product)

        products.sort(
            key=lambda item:
            item["recommendation_score"],
            reverse=True
        )

        return {
            "success": True,
            "products": products[:10]
        }

    finally:
        connection.close()


# =========================================================
# ROUTINE TRACKING
# =========================================================

@app.post("/routine-tracking")
def save_routine_tracking(
    request: RoutineTrackingRequest
):

    email = clean(request.email)

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Email is required."
        )

    tracking_date = (
        clean(request.tracking_date)
        or date.today().isoformat()
    )

    connection = get_connection()

    try:

        existing = connection.execute(
            """
            SELECT id
            FROM routine_tracking
            WHERE lower(email)=?
            AND tracking_date=?
            AND routine_type=?
            """,
            (
                email.lower(),
                tracking_date,
                clean(request.routine_type)
            )
        ).fetchone()

        completed = (
            1
            if request.completed
            else 0
        )

        if request.morning_completed:
            completed = 1

        if request.evening_completed:
            completed = 1

        if existing:

            connection.execute(
                """
                UPDATE routine_tracking
                SET
                    completed=?,
                    notes=?
                WHERE id=?
                """,
                (
                    completed,
                    clean(request.notes),
                    existing["id"]
                )
            )

            record_id = existing["id"]

        else:

            cursor = connection.execute(
                """
                INSERT INTO routine_tracking
                (
                    email,
                    tracking_date,
                    routine_type,
                    completed,
                    notes
                )
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    email,
                    tracking_date,
                    clean(request.routine_type),
                    completed,
                    clean(request.notes)
                )
            )

            record_id = cursor.lastrowid

        connection.commit()

        return {
            "success": True,
            "message": "Routine tracking saved.",
            "tracking_id": record_id
        }

    finally:
        connection.close()


@app.get("/routine-tracking/{email}")
def get_routine_tracking(email: str):

    connection = get_connection()

    try:

        records = connection.execute(
            """
            SELECT *
            FROM routine_tracking
            WHERE lower(email)=?
            ORDER BY tracking_date DESC, id DESC
            """,
            (email.lower(),)
        ).fetchall()

        return {
            "success": True,
            "tracking": [
                row_dict(record)
                for record in records
            ]
        }

    finally:
        connection.close()
        # =========================================================
# PROGRESS TRACKING
# =========================================================

@app.post("/progress-tracking")
def save_progress_tracking(
    request: ProgressTrackingRequest
):

    email = clean(request.email)

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Email is required."
        )

    progress_date = (
        clean(request.date)
        or date.today().isoformat()
    )

    connection = get_connection()

    try:

        cursor = connection.execute(
            """
            INSERT INTO progress_tracking
            (
                email,
                date,
                score,
                concern,
                notes
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                email,
                progress_date,
                float(request.score or 0),
                clean(request.concern),
                clean(request.notes)
            )
        )

        connection.commit()

        return {
            "success": True,
            "message": "Progress saved successfully.",
            "progress_id": cursor.lastrowid
        }

    finally:
        connection.close()


@app.get("/progress-tracking/{email}")
def get_progress_tracking(email: str):

    connection = get_connection()

    try:

        records = connection.execute(
            """
            SELECT *
            FROM progress_tracking
            WHERE lower(email)=?
            ORDER BY date DESC, id DESC
            """,
            (email.lower(),)
        ).fetchall()

        return {
            "success": True,
            "progress": [
                row_dict(record)
                for record in records
            ]
        }

    finally:
        connection.close()


# =========================================================
# PROGRESS ANALYSIS
# =========================================================

@app.get("/progress-analysis/{email}")
def progress_analysis(email: str):

    connection = get_connection()

    try:

        records = connection.execute(
            """
            SELECT *
            FROM progress_tracking
            WHERE lower(email)=?
            ORDER BY date ASC, id ASC
            """,
            (email.lower(),)
        ).fetchall()

        if not records:

            return {
                "success": True,
                "total_records": 0,
                "average_score": 0,
                "first_score": 0,
                "latest_score": 0,
                "improvement": 0,
                "trend": "No data"
            }

        scores = [
            float(record["score"] or 0)
            for record in records
        ]

        first_score = scores[0]
        latest_score = scores[-1]

        average_score = round(
            sum(scores) / len(scores),
            2
        )

        improvement = round(
            latest_score - first_score,
            2
        )

        if improvement > 2:
            trend = "Improving"
        elif improvement < -2:
            trend = "Needs Attention"
        else:
            trend = "Stable"

        return {
            "success": True,
            "total_records": len(records),
            "average_score": average_score,
            "first_score": first_score,
            "latest_score": latest_score,
            "improvement": improvement,
            "trend": trend
        }

    finally:
        connection.close()


# =========================================================
# DASHBOARD SUMMARY
# =========================================================

@app.get("/dashboard/{email}")
def dashboard_summary(email: str):

    connection = get_connection()

    try:

        user = connection.execute(
            """
            SELECT id, name, email, role
            FROM users
            WHERE lower(email)=?
            """,
            (email.lower(),)
        ).fetchone()

        profile = connection.execute(
            """
            SELECT *
            FROM skin_profiles
            WHERE lower(email)=?
            ORDER BY id DESC
            LIMIT 1
            """,
            (email.lower(),)
        ).fetchone()

        lifestyle = connection.execute(
            """
            SELECT *
            FROM lifestyle
            WHERE lower(email)=?
            ORDER BY id DESC
            LIMIT 1
            """,
            (email.lower(),)
        ).fetchone()

        assessment = connection.execute(
            """
            SELECT *
            FROM assessments
            WHERE lower(email)=?
            ORDER BY id DESC
            LIMIT 1
            """,
            (email.lower(),)
        ).fetchone()

        routine_total = connection.execute(
            """
            SELECT COUNT(*) AS count
            FROM routine_tracking
            WHERE lower(email)=?
            """,
            (email.lower(),)
        ).fetchone()["count"]

        routine_completed = connection.execute(
            """
            SELECT COUNT(*) AS count
            FROM routine_tracking
            WHERE lower(email)=?
            AND completed=1
            """,
            (email.lower(),)
        ).fetchone()["count"]

        progress_count = connection.execute(
            """
            SELECT COUNT(*) AS count
            FROM progress_tracking
            WHERE lower(email)=?
            """,
            (email.lower(),)
        ).fetchone()["count"]

        score = 0

        if assessment:
            score = float(
                assessment["score"] or 0
            )

        adherence = 0

        if routine_total:
            adherence = round(
                (routine_completed / routine_total) * 100
            )

        return {
            "success": True,
            "user": row_dict(user)
            if user else None,
            "profile": row_dict(profile)
            if profile else None,
            "lifestyle": row_dict(lifestyle)
            if lifestyle else None,
            "skin_health_score": score,
            "routine_adherence": adherence,
            "routine_records": routine_total,
            "progress_records": progress_count,
            "latest_assessment": (
                row_dict(assessment)
                if assessment else None
            )
        }

    finally:
        connection.close()
        # =========================================================
# ADMIN ANALYTICS
# =========================================================

@app.get("/admin/analytics")
def admin_analytics():

    connection = get_connection()

    try:

        total_users = connection.execute(
            """
            SELECT COUNT(*) AS count
            FROM users
            WHERE lower(role)='user'
            """
        ).fetchone()["count"]

        total_dermatologists = connection.execute(
            """
            SELECT COUNT(*) AS count
            FROM users
            WHERE lower(role)='dermatologist'
            """
        ).fetchone()["count"]

        total_consultants = connection.execute(
            """
            SELECT COUNT(*) AS count
            FROM users
            WHERE lower(role)='consultant'
            """
        ).fetchone()["count"]

        total_admins = connection.execute(
            """
            SELECT COUNT(*) AS count
            FROM users
            WHERE lower(role)='admin'
            """
        ).fetchone()["count"]

        total_assessments = connection.execute(
            """
            SELECT COUNT(*) AS count
            FROM assessments
            """
        ).fetchone()["count"]

        average_score = connection.execute(
            """
            SELECT AVG(score) AS average
            FROM assessments
            """
        ).fetchone()["average"]

        shared_reports = connection.execute(
            """
            SELECT COUNT(*) AS count
            FROM shared_reports
            """
        ).fetchone()["count"]

        reviewed_reports = connection.execute(
            """
            SELECT COUNT(*) AS count
            FROM shared_reports
            WHERE lower(status)='reviewed'
            """
        ).fetchone()["count"]

        routine_records = connection.execute(
            """
            SELECT COUNT(*) AS count
            FROM routine_tracking
            """
        ).fetchone()["count"]

        progress_records = connection.execute(
            """
            SELECT COUNT(*) AS count
            FROM progress_tracking
            """
        ).fetchone()["count"]

        return {
            "success": True,
            "users": {
                "total_users": total_users,
                "dermatologists": total_dermatologists,
                "consultants": total_consultants,
                "admins": total_admins
            },
            "platform": {
                "total_assessments": total_assessments,
                "average_skin_score": round(
                    float(average_score or 0),
                    2
                ),
                "shared_reports": shared_reports,
                "reviewed_reports": reviewed_reports,
                "routine_records": routine_records,
                "progress_records": progress_records
            }
        }

    finally:
        connection.close()

# =========================================================
# RECOMMENDATION ISSUE REPORTING
# =========================================================

@app.post("/recommendation-issues")
def create_recommendation_issue(request: dict):

    connection = get_connection()

    try:

        email = str(request.get("email", "")).strip()
        issue_type = str(
            request.get("issue_type", "Other")
        ).strip()
        description = str(
            request.get("description", "")
        ).strip()

        if not email:
            return {
                "success": False,
                "message": "User email is required."
            }

        if not description:
            return {
                "success": False,
                "message": "Issue description is required."
            }

        # Create table if it does not exist
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS recommendation_issues (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT,
                issue_type TEXT,
                description TEXT,
                status TEXT DEFAULT 'Open',
                created_at TEXT
            )
            """
        )

        connection.execute(
            """
            INSERT INTO recommendation_issues
            (
                email,
                issue_type,
                description,
                status,
                created_at
            )
            VALUES (?, ?, ?, 'Open', ?)
            """,
            (
                email,
                issue_type,
                description,
                datetime.now().strftime(
                    "%Y-%m-%d %H:%M:%S"
                )
            )
        )

        connection.commit()

        return {
            "success": True,
            "message": "Recommendation issue reported successfully."
        }

    except Exception as error:

        return {
            "success": False,
            "message": str(error)
        }

    finally:

        connection.close()


# =========================================================
# ADMIN VIEW RECOMMENDATION ISSUES
# =========================================================

@app.get("/admin/recommendation-issues")
def get_recommendation_issues():

    connection = get_connection()

    try:

        # Create table if it does not exist
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS recommendation_issues (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT,
                issue_type TEXT,
                description TEXT,
                status TEXT DEFAULT 'Open',
                created_at TEXT
            )
            """
        )

        issues = connection.execute(
            """
            SELECT
                id,
                email,
                issue_type,
                description,
                status,
                created_at
            FROM recommendation_issues
            ORDER BY id DESC
            """
        ).fetchall()

        return {
            "success": True,
            "issues": [
                row_dict(issue)
                for issue in issues
            ]
        }

    finally:

        connection.close()
# =========================================================
# ADMIN RECENT ACTIVITY
# =========================================================

@app.get("/admin/recent-activity")
def admin_recent_activity():

    connection = get_connection()

    try:

        assessments = connection.execute(
            """
            SELECT
                id,
                email,
                skin_type,
                concern,
                score,
                priority,
                created_at
            FROM assessments
            ORDER BY id DESC
            LIMIT 10
            """
        ).fetchall()

        reports = connection.execute(
            """
            SELECT
                id,
                email,
                dermatologist_name,
                status,
                shared_at
            FROM shared_reports
            ORDER BY id DESC
            LIMIT 10
            """
        ).fetchall()

        return {
            "success": True,
            "recent_assessments": [
                row_dict(item)
                for item in assessments
            ],
            "recent_reports": [
                row_dict(item)
                for item in reports
            ]
        }

    finally:
        connection.close()


# =========================================================
# ADMIN RECOMMENDATION STATUS
# =========================================================

@app.get("/admin/recommendation-status")
def recommendation_status():

    connection = get_connection()

    try:

        total_products = connection.execute(
            """
            SELECT COUNT(*) AS count
            FROM products
            """
        ).fetchone()["count"]

        total_ingredients = connection.execute(
            """
            SELECT COUNT(*) AS count
            FROM ingredients
            """
        ).fetchone()["count"]

        total_assessments = connection.execute(
            """
            SELECT COUNT(*) AS count
            FROM assessments
            """
        ).fetchone()["count"]

        return {
            "success": True,
            "engine_status": "Operational",
            "personalization": "Active",
            "safety_checks": "Enabled",
            "products_available": total_products,
            "ingredients_available": total_ingredients,
            "assessments_processed": total_assessments
        }

    finally:
        connection.close()


# =========================================================
# PLATFORM SYSTEM STATUS
# =========================================================

@app.get("/admin/system-status")
def admin_system_status():

    database_connected = False

    connection = None

    try:

        connection = get_connection()

        connection.execute(
            "SELECT 1"
        ).fetchone()

        database_connected = True

    except Exception:

        database_connected = False

    finally:

        if connection:
            connection.close()

    return {
        "success": True,
        "frontend": "Operational",
        "backend": "Operational",
        "database": (
            "Connected"
            if database_connected
            else "Disconnected"
        ),
        "recommendation_engine": "Operational",
        "api_version": "4.0"
    }


# =========================================================
# FINAL HEALTH CHECK
# =========================================================

@app.get("/admin/health")
def admin_health():

    return {
        "success": True,
        "status": "healthy",
        "platform": "SkinAI",
        "milestone": "Milestone 4",
        "services": {
            "authentication": "Operational",
            "assessment": "Operational",
            "recommendations": "Operational",
            "ingredient_intelligence": "Operational",
            "product_recommendations": "Operational",
            "routine_tracking": "Operational",
            "progress_tracking": "Operational",
            "reports": "Operational",
            "dermatologist_support": "Operational",
            "admin_analytics": "Operational"
        }
    }


# =========================================================
# APPLICATION START
# =========================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )