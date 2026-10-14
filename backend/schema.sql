-- AI Skin Intelligence & Personalized Skincare Planner
-- Core schema: users, role-based access, skin profile, and daily tracking
-- Target: PostgreSQL 14+

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM (
    'user',
    'skincare_consultant',
    'dermatologist',
    'administrator'
);

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       VARCHAR(120)  NOT NULL,
    email           VARCHAR(255)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    role            user_role     NOT NULL DEFAULT 'user',
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- SKIN PROFILE
-- ============================================================

CREATE TABLE skin_profiles (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    skin_type               VARCHAR(30),
    age_group               VARCHAR(20),
    allergies               TEXT[],
    sensitivities           TEXT[],
    lifestyle_habits        TEXT[],
    sleep_quality           VARCHAR(20),
    water_intake_liters     NUMERIC(3,1),
    environmental_exposure  TEXT[],
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_skin_profiles_updated_at
BEFORE UPDATE ON skin_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE skin_concerns (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name    VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE user_skin_concerns (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skin_concern_id  UUID NOT NULL REFERENCES skin_concerns(id) ON DELETE CASCADE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_skin_concern UNIQUE (user_id, skin_concern_id)
);

CREATE INDEX idx_user_skin_concerns_user_id ON user_skin_concerns(user_id);

-- ============================================================
-- DAILY TRACKING
-- ============================================================

CREATE TABLE sleep_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date        DATE NOT NULL,
    sleep_quality   VARCHAR(20),
    sleep_hours     NUMERIC(3,1),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_sleep_records_user_date UNIQUE (user_id, log_date)
);
CREATE INDEX idx_sleep_records_user_date ON sleep_records(user_id, log_date DESC);
CREATE TRIGGER trg_sleep_records_updated_at BEFORE UPDATE ON sleep_records FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE lifestyle_records (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date           DATE NOT NULL,
    activity_level     VARCHAR(20),
    stress_level       VARCHAR(20),
    diet_notes         TEXT,
    lifestyle_habits   TEXT[],
    notes              TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_lifestyle_records_user_date UNIQUE (user_id, log_date)
);
CREATE INDEX idx_lifestyle_records_user_date ON lifestyle_records(user_id, log_date DESC);
CREATE TRIGGER trg_lifestyle_records_updated_at BEFORE UPDATE ON lifestyle_records FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE hydration_records (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date              DATE NOT NULL,
    water_intake_liters   NUMERIC(3,1),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_hydration_records_user_date UNIQUE (user_id, log_date)
);
CREATE INDEX idx_hydration_records_user_date ON hydration_records(user_id, log_date DESC);
CREATE TRIGGER trg_hydration_records_updated_at BEFORE UPDATE ON hydration_records FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE environmental_exposure_records (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date                 DATE NOT NULL,
    environmental_exposure   TEXT[],
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_env_exposure_records_user_date UNIQUE (user_id, log_date)
);
CREATE INDEX idx_env_exposure_records_user_date ON environmental_exposure_records(user_id, log_date DESC);
CREATE TRIGGER trg_env_exposure_records_updated_at BEFORE UPDATE ON environmental_exposure_records FOR EACH ROW EXECUTE FUNCTION set_updated_at();