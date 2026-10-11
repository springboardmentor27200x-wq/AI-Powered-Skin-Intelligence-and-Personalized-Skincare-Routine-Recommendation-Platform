from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def ensure_schema():
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30), ADD COLUMN IF NOT EXISTS bio TEXT;"))
            conn.execute(text("ALTER TABLE skin_profiles ADD COLUMN IF NOT EXISTS climate_type VARCHAR(100) DEFAULT '', ADD COLUMN IF NOT EXISTS uv_index_exposure VARCHAR(50) DEFAULT '', ADD COLUMN IF NOT EXISTS region VARCHAR(120) DEFAULT '';"))
            conn.execute(text("ALTER TABLE hydration_logs ADD COLUMN IF NOT EXISTS glasses_of_water INTEGER DEFAULT 8, ADD COLUMN IF NOT EXISTS glasses INTEGER DEFAULT 8, ADD COLUMN IF NOT EXISTS notes TEXT;"))
            conn.execute(text("ALTER TABLE sleep_logs ADD COLUMN IF NOT EXISTS sleep_quality INTEGER DEFAULT 7, ADD COLUMN IF NOT EXISTS quality VARCHAR(30) DEFAULT 'Good', ADD COLUMN IF NOT EXISTS consistency INTEGER DEFAULT 7, ADD COLUMN IF NOT EXISTS bedtime VARCHAR(20), ADD COLUMN IF NOT EXISTS wakeup_time VARCHAR(20), ADD COLUMN IF NOT EXISTS notes TEXT;"))
            conn.execute(text("ALTER TABLE lifestyle_logs ADD COLUMN IF NOT EXISTS exercise_minutes INTEGER DEFAULT 30, ADD COLUMN IF NOT EXISTS diet_quality INTEGER DEFAULT 3, ADD COLUMN IF NOT EXISTS stress_level INTEGER DEFAULT 3, ADD COLUMN IF NOT EXISTS smoking BOOLEAN DEFAULT FALSE, ADD COLUMN IF NOT EXISTS alcohol BOOLEAN DEFAULT FALSE, ADD COLUMN IF NOT EXISTS sun_exposure_hours FLOAT DEFAULT 1.0, ADD COLUMN IF NOT EXISTS notes TEXT;"))
            conn.execute(text("ALTER TABLE routine_checklist_logs ADD COLUMN IF NOT EXISTS total_steps INTEGER DEFAULT 6, ADD COLUMN IF NOT EXISTS completion_rate FLOAT DEFAULT 0.0, ADD COLUMN IF NOT EXISTS completed_steps TEXT DEFAULT '[]';"))
            conn.execute(text("ALTER TABLE skin_assessments ADD COLUMN IF NOT EXISTS overall_score FLOAT DEFAULT 0.0, ADD COLUMN IF NOT EXISTS condition_score FLOAT DEFAULT 0.0, ADD COLUMN IF NOT EXISTS lifestyle_score FLOAT DEFAULT 0.0, ADD COLUMN IF NOT EXISTS sleep_score FLOAT DEFAULT 0.0, ADD COLUMN IF NOT EXISTS consistency_score FLOAT DEFAULT 0.0, ADD COLUMN IF NOT EXISTS hydration_score FLOAT DEFAULT 0.0, ADD COLUMN IF NOT EXISTS concern_priorities TEXT DEFAULT '[]', ADD COLUMN IF NOT EXISTS risk_factors TEXT DEFAULT '[]', ADD COLUMN IF NOT EXISTS recommendation_summary TEXT DEFAULT '';"))
            conn.execute(text("ALTER TABLE skincare_routines ADD COLUMN IF NOT EXISTS morning_routine TEXT DEFAULT '[]', ADD COLUMN IF NOT EXISTS evening_routine TEXT DEFAULT '[]', ADD COLUMN IF NOT EXISTS weekly_routine TEXT DEFAULT '[]', ADD COLUMN IF NOT EXISTS seasonal_routine TEXT DEFAULT '[]', ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();"))
            conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS price_tier VARCHAR(50) DEFAULT 'Mid-Range', ADD COLUMN IF NOT EXISTS suitability_score FLOAT DEFAULT 0.0, ADD COLUMN IF NOT EXISTS full_ingredients TEXT DEFAULT '', ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();"))
            conn.execute(text("ALTER TABLE progress_logs ADD COLUMN IF NOT EXISTS condition_rating INTEGER DEFAULT 7, ADD COLUMN IF NOT EXISTS active_concerns TEXT DEFAULT '[]', ADD COLUMN IF NOT EXISTS notes TEXT, ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500), ADD COLUMN IF NOT EXISTS skin_health_score_at_log FLOAT DEFAULT 75.0;"))
            try:
                conn.execute(text("ALTER TABLE progress_logs ALTER COLUMN skin_condition_rating DROP NOT NULL;"))
            except Exception:
                pass
            conn.execute(text("ALTER TABLE progress_logs ADD COLUMN IF NOT EXISTS skin_condition_rating INTEGER DEFAULT 7;"))
            conn.execute(text("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();"))
            conn.commit()
    except Exception as e:
        print("Schema migration notice:", e)

def seed_default_accounts():
    from models import User
    from auth import hash_password
    db = SessionLocal()
    try:
        defaults = [
            {
                "email": "user@skinai.com",
                "name": "Demo User",
                "password_hash": hash_password("User@123"),
                "age": 25,
                "gender": "Female",
                "phone": "+1 (555) 111-2222",
                "bio": "Standard user profile for testing skin planner.",
                "role": "user",
            },
            {
                "email": "doctor@skinai.com",
                "name": "Dr. Sarah Chen, MD",
                "password_hash": hash_password("Doctor@123"),
                "age": 38,
                "gender": "Female",
                "phone": "+1 (555) 234-5678",
                "bio": "Board-certified Dermatologist specializing in clinical dermatology.",
                "role": "dermatologist",
            },
            {
                "email": "consultant@skinai.com",
                "name": "Emma Watson",
                "password_hash": hash_password("Consult@123"),
                "age": 29,
                "gender": "Female",
                "phone": "+1 (555) 345-6789",
                "bio": "Certified Skincare Specialist & Routine Consultant.",
                "role": "skincare_consultant",
            },
            {
                "email": "admin@skinai.com",
                "name": "System Administrator",
                "password_hash": hash_password("Admin@123"),
                "age": 35,
                "gender": "Female",
                "phone": "+1 (555) 100-2000",
                "bio": "Platform Superadmin",
                "role": "admin",
            },
            {
                "email": "dermatologist@skintelligence.com",
                "name": "Dr. Sarah Chen, MD",
                "password_hash": hash_password("derma123"),
                "age": 38,
                "gender": "Female",
                "phone": "+1 (555) 234-5678",
                "bio": "Board-certified Dermatologist.",
                "role": "dermatologist",
            },
            {
                "email": "admin@skintelligence.com",
                "name": "System Administrator",
                "password_hash": hash_password("admin123"),
                "age": 35,
                "gender": "Female",
                "phone": "+1 (555) 100-2000",
                "bio": "Platform Superadmin",
                "role": "admin",
            },
            {
                "email": "consultant@skintelligence.com",
                "name": "Emma Watson (Consultant)",
                "password_hash": hash_password("consultant123"),
                "age": 29,
                "gender": "Female",
                "phone": "+1 (555) 345-6789",
                "bio": "Certified Skincare Specialist & Routine Consultant.",
                "role": "skincare_consultant",
            },
        ]
        for item in defaults:
            existing = db.query(User).filter(User.email == item["email"]).first()
            if not existing:
                u = User(**item)
                db.add(u)
            else:
                existing.password_hash = item["password_hash"]
        db.commit()
    except Exception as e:
        print("Seed notice:", e)
    finally:
        db.close()
