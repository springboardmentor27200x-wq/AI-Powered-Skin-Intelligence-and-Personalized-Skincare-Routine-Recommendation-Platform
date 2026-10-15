# 🌿 AI Skin Intelligence & Personalized Skincare Planner

> **Milestones 1–4: Skin Assessment, Recommendations, Analytics & Reports** | Internship Project

A professional full-stack skincare intelligence platform built with FastAPI, React, and SQLite/PostgreSQL. The foundation includes secure authentication, role-based access, and tracking workflows, and it has been enhanced to match the product brief from the skincare planner PDF with a weighted skin assessment engine, ingredient intelligence, personalized product suggestions, and dashboard progress analytics.

---

## 📋 Table of Contents

1. [Project Objective](#project-objective)
2. [Milestone 1 Scope](#milestone-1-scope)
3. [Features](#features)
4. [Architecture](#architecture)
5. [Tech Stack](#tech-stack)
6. [Database Schema](#database-schema)
7. [Project Structure](#project-structure)
8. [Prerequisites](#prerequisites)
9. [Installation & Setup](#installation--setup)
10. [Running the Application](#running-the-application)
11. [Demo Accounts](#demo-accounts)
12. [API Documentation](#api-documentation)
13. [User Roles & RBAC](#user-roles--rbac)
14. [Running Tests](#running-tests)
15. [Future Milestone Roadmap](#future-milestone-roadmap)

---

## Project Objective

Build the secure, modular foundation of an AI-powered skincare platform where users can:

- Register and log in securely with JWT-based authentication
- Access the application according to their assigned role
- Create and manage a detailed skin profile
- Record daily lifestyle information
- Record sleep duration, quality, and patterns
- Record daily hydration (water intake)
- View a comprehensive personal dashboard summarizing all data

Milestones 2 and 3 extend the foundation with weighted skin scoring, personalized routine generation, ingredient and product intelligence, and saved daily routine progress.

---

## Milestone 1 Scope

### ✅ Implemented Capabilities

| Area | Feature |
|---|---|
| Authentication | JWT registration, login, token refresh, protected routes |
| Role-Based Access Control | USER, SKINCARE_CONSULTANT, DERMATOLOGIST, ADMINISTRATOR |
| Skin Profile | Create / view / edit skin type, age group, concerns, allergies, sensitivities |
| Lifestyle Tracking | Physical activity, smoking, alcohol, screen time, outdoor & environmental exposure |
| Sleep Tracking | Duration, quality, bedtime, wake time, consistency — full CRUD with date records |
| Hydration Tracking | Daily water intake records with full CRUD |
| Skin Assessment | Weighted assessment engine with concern prioritization, score breakdown, and routine generation |
| Routine Tracking | Persistent per-user plans, daily checklist, and 7-day adherence history |
| Ingredient Intelligence | Suitability analysis, allergy screening, and active-ingredient interaction cautions |
| Product Recommendations | Ranked product matches with hard allergy and budget exclusions |
| Dashboard | Profile completion, health scores, trends, and wellness alerts |
| Admin Panel | Administrator-only user directory listing all registered accounts |
| API Documentation | Auto-generated Swagger/OpenAPI at `/docs` |
| Backend Tests | 27 passing `pytest` integration tests covering all core flows |
| Seed Data | 4 demo persona accounts for immediate evaluation |

### ❌ Intentionally Deferred to Future Milestones

- Skin image analysis or computer vision
- Machine learning model training or external AI integrations
- PDF or Excel report export generation
- Cloud deployment hardening and production hosting
- Advanced multi-tenant analytics and historical cohort comparisons

---

## Features

### 🔐 Authentication & Security
- Secure password hashing with `bcrypt` (direct, no passlib dependency issues)
- JWT access tokens with configurable expiration
- Protected API endpoints via FastAPI dependencies
- Role-based authorization guard (`require_role()` dependency)
- Email uniqueness enforcement at database level
- Registration blocked from self-assigning ADMINISTRATOR role

### 👤 User & Role Management
- Four system roles: `USER`, `SKINCARE_CONSULTANT`, `DERMATOLOGIST`, `ADMINISTRATOR`
- Role persisted in JWT claims and verified server-side on every protected request
- Administrator-only user directory endpoint

### 🧴 Skin Profile
- Comprehensive skin type selection (Normal, Dry, Oily, Combination, Sensitive)
- Age group selection
- Multi-select skin concerns (Acne, Hyperpigmentation, Dark Spots, Wrinkles, etc.)
- Free-text allergies and sensitivities fields
- One-to-one relationship with user

### 🏃 Lifestyle Tracking
- Physical activity level (Sedentary → High)
- Smoking and alcohol habits
- Screen time (hours/day)
- Outdoor and environmental exposure details
- One-to-one relationship with user

### 😴 Sleep Tracking
- Daily sleep records with duration, quality, bedtime, wake time
- Sleep consistency rating
- Many-to-one relationship (multiple records per user)

### 💧 Hydration Tracking
- Daily water intake in ml
- Date-stamped records
- Many-to-one relationship (multiple records per user)

### 📊 Dashboard
- Dynamic profile completion score (Skin 40%, Lifestyle 30%, Sleep 15%, Hydration 15%)
- Welcome banner with user name and role
- Summary cards for all data categories
- Quick-action buttons linking to each tracking section

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                       │
│           Vite + React 18 + Tailwind CSS                │
│        React Router + Axios + Context API               │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP / REST  (Vite proxy → selected API port)
┌───────────────────────▼─────────────────────────────────┐
│                  FastAPI REST API                        │
│          Routers → Services → Repositories              │
│             JWT Auth + RBAC Middleware                   │
└───────────────────────┬─────────────────────────────────┘
                        │ SQLAlchemy ORM
┌───────────────────────▼─────────────────────────────────┐
│              Database (SQLite / PostgreSQL)              │
│    users │ skin_profiles │ lifestyle_profiles           │
│          │ sleep_records │ hydration_records            │
└─────────────────────────────────────────────────────────┘
```

### Layered Backend Design

```
Router Layer      →  HTTP routing, request/response serialization
Service Layer     →  Business logic, validation, orchestration
Repository Layer  →  Database queries, data access patterns
Model Layer       →  SQLAlchemy ORM entity definitions
Schema Layer      →  Pydantic v2 request/response DTOs
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend Framework | React | 18.x |
| Frontend Build | Vite | 5.x |
| Frontend Styling | Tailwind CSS | 3.x |
| Frontend Routing | React Router DOM | 6.x |
| HTTP Client | Axios | 1.x |
| Icon Library | Lucide React | latest |
| Backend Framework | FastAPI | 0.115.x |
| Backend Language | Python | 3.11 |
| ORM | SQLAlchemy | 2.x |
| Data Validation | Pydantic | v2 |
| Authentication | python-jose (JWT) + bcrypt | latest |
| Database (dev) | SQLite | built-in |
| Database (prod) | PostgreSQL | 14+ |
| Package Manager | uv | 0.12+ |
| Test Runner | pytest + httpx | latest |

---

## Database Schema

```
users
├── id              INTEGER PRIMARY KEY
├── full_name       VARCHAR NOT NULL
├── email           VARCHAR UNIQUE NOT NULL
├── password_hash   VARCHAR NOT NULL
├── role            ENUM (USER, SKINCARE_CONSULTANT, DERMATOLOGIST, ADMINISTRATOR)
├── is_active       BOOLEAN DEFAULT TRUE
├── created_at      DATETIME
└── updated_at      DATETIME

skin_profiles
├── id              INTEGER PRIMARY KEY
├── user_id         INTEGER FK → users.id (UNIQUE)
├── skin_type       VARCHAR (normal/dry/oily/combination/sensitive)
├── age_group       VARCHAR
├── skin_concerns   JSON  (array of strings)
├── allergies       TEXT
├── sensitivities   TEXT
├── created_at      DATETIME
└── updated_at      DATETIME

lifestyle_profiles
├── id              INTEGER PRIMARY KEY
├── user_id         INTEGER FK → users.id (UNIQUE)
├── physical_activity    VARCHAR
├── smoking              VARCHAR
├── alcohol_consumption  VARCHAR
├── screen_time          FLOAT  (hours/day)
├── outdoor_exposure     VARCHAR
├── environmental_exposure TEXT
├── created_at      DATETIME
└── updated_at      DATETIME

sleep_records
├── id              INTEGER PRIMARY KEY
├── user_id         INTEGER FK → users.id
├── sleep_duration_hours FLOAT
├── sleep_quality   VARCHAR (poor/fair/good/excellent)
├── bedtime         VARCHAR
├── wake_time       VARCHAR
├── sleep_consistency VARCHAR
├── record_date     DATE
└── created_at      DATETIME

hydration_records
├── id              INTEGER PRIMARY KEY
├── user_id         INTEGER FK → users.id
├── water_intake_ml INTEGER
├── record_date     DATE
└── created_at      DATETIME
```

---

## Project Structure

```
AI Skin Intelligence & Personalized Skincare Planner/
├── .gitignore
├── README.md
│
├── backend/
│   ├── .env.example
│   ├── .env                    # ← create from .env.example
│   ├── pyproject.toml
│   ├── requirements.txt
│   ├── skincare.db             # ← auto-created on first run
│   │
│   ├── app/
│   │   ├── main.py             # FastAPI app + lifespan + CORS
│   │   ├── core/
│   │   │   ├── config.py       # Pydantic Settings
│   │   │   ├── database.py     # SQLAlchemy engine + get_db
│   │   │   └── security.py     # bcrypt + JWT
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── skin_profile.py
│   │   │   ├── lifestyle.py
│   │   │   ├── sleep.py
│   │   │   └── hydration.py
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── token.py
│   │   │   ├── skin_profile.py
│   │   │   ├── lifestyle.py
│   │   │   ├── sleep.py
│   │   │   ├── hydration.py
│   │   │   └── dashboard.py
│   │   ├── repositories/
│   │   │   ├── base.py
│   │   │   ├── user_repository.py
│   │   │   ├── skin_repository.py
│   │   │   ├── lifestyle_repository.py
│   │   │   ├── sleep_repository.py
│   │   │   └── hydration_repository.py
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── user_service.py
│   │   │   ├── skin_service.py
│   │   │   ├── lifestyle_service.py
│   │   │   ├── sleep_service.py
│   │   │   ├── hydration_service.py
│   │   │   └── dashboard_service.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── skin_profile.py
│   │   │   ├── lifestyle.py
│   │   │   ├── sleep.py
│   │   │   ├── hydration.py
│   │   │   ├── dashboard.py
│   │   │   └── admin.py
│   │   └── dependencies/
│   │       ├── auth.py
│   │       └── database.py
│   │
│   ├── scripts/
│   │   └── seed_data.py
│   │
│   └── tests/
│       ├── conftest.py
│       ├── test_auth.py
│       ├── test_rbac.py
│       ├── test_skin_profile.py
│       ├── test_lifestyle.py
│       ├── test_sleep.py
│       ├── test_hydration.py
│       └── test_dashboard.py
│
└── frontend/
    ├── .env.example
    ├── .env                    # ← create from .env.example
    ├── package.json
    ├── vite.config.js          # Proxy: /api → localhost:8000
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    │
    └── src/
        ├── main.jsx            # ReactDOM entry
        ├── App.jsx             # BrowserRouter + Providers
        ├── index.css           # Tailwind directives
        │
        ├── routes/
        │   ├── AppRoutes.jsx   # Route tree
        │   └── ProtectedRoute.jsx
        │
        ├── context/
        │   ├── AuthContext.jsx
        │   └── NotificationContext.jsx
        │
        ├── hooks/
        │   ├── useAuth.js
        │   └── useNotification.js
        │
        ├── services/
        │   ├── api.js          # Axios instance + interceptors
        │   ├── authService.js
        │   ├── skinService.js
        │   ├── lifestyleService.js
        │   ├── sleepService.js
        │   ├── hydrationService.js
        │   ├── dashboardService.js
        │   └── adminService.js
        │
        ├── utils/
        │   ├── constants.js
        │   └── formatters.js
        │
        ├── components/
        │   ├── common/
        │   │   ├── Button.jsx
        │   │   ├── Input.jsx
        │   │   ├── Select.jsx
        │   │   ├── Card.jsx
        │   │   ├── Badge.jsx
        │   │   ├── ProgressBar.jsx
        │   │   ├── Modal.jsx
        │   │   ├── LoadingSpinner.jsx
        │   │   └── Alert.jsx
        │   ├── layout/
        │   │   ├── Navbar.jsx
        │   │   ├── Sidebar.jsx
        │   │   ├── Footer.jsx
        │   │   └── AppLayout.jsx
        │   └── dashboard/
        │       ├── WelcomeBanner.jsx
        │       ├── ProfileCompletionCard.jsx
        │       ├── SkinSummaryCard.jsx
        │       ├── LifestyleSummaryCard.jsx
        │       ├── SleepSummaryCard.jsx
        │       ├── HydrationSummaryCard.jsx
        │       └── QuickActions.jsx
        │
        └── pages/
            ├── LandingPage.jsx
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── DashboardPage.jsx
            ├── SkinProfilePage.jsx
            ├── LifestylePage.jsx
            ├── SleepPage.jsx
            ├── HydrationPage.jsx
            ├── SettingsPage.jsx
            ├── AdminUsersPage.jsx
            └── NotFoundPage.jsx
```

---

## Prerequisites

Ensure the following are installed:

| Tool | Minimum Version | Check |
|---|---|---|
| Node.js | 18.x | `node --version` |
| npm | 9.x | `npm --version` |
| Python | 3.11 | `python --version` |
| uv (Python PM) | 0.12+ | `uv --version` |
| Git | any | `git --version` |

> **Windows users**: PowerShell commands use `npm.cmd` and `npx.cmd` instead of `npm` / `npx`.

---

## Installation & Setup

### 1. Clone / Open the Repository

```bash
# Navigate to project root
cd "AI Skin Intelligence & Personalized Skincare Planner"
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment and install dependencies
uv sync

# Copy environment file
copy .env.example .env   # Windows
cp .env.example .env     # macOS/Linux

# Edit .env if needed (defaults work out of the box with SQLite)
```

**Default `.env` for local development:**

```env
DATABASE_URL=sqlite:///./skincare.db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
FRONTEND_URL=http://localhost:5173
```

### 3. Seed Demo Data

```bash
# From backend/ directory
& "$HOME\.local\bin\uv.exe" run python scripts/seed_data.py   # Windows
uv run python scripts/seed_data.py                            # macOS/Linux
```

### 4. Frontend Setup

```bash
cd ../frontend

# Copy environment file
copy .env.example .env   # Windows
cp .env.example .env     # macOS/Linux

# Install dependencies
npm.cmd install   # Windows
npm install       # macOS/Linux
```

---

## Running the Application

### Start the Application on Windows

```bash
powershell -ExecutionPolicy Bypass -File .\scripts\start-dev.ps1
```

The launcher selects free ports for both services and prints the URLs. It starts the API and Vite proxy together, so occupied ports cannot silently send requests to another service.

### Start the Services Manually (macOS/Linux)

Start the backend from `backend/`:

```bash
uv run uvicorn app.main:app --reload --port 8001
```

Then start the frontend from `frontend/` in a second terminal:

```bash
npm run dev -- --port 5173
```

The frontend defaults to **http://localhost:5173** and proxies `/api` to **http://localhost:8001**. Vite exits with an error if the requested frontend port is occupied instead of silently switching ports.

### Run the Containerized Stack

```powershell
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
docker compose up --build
```

The frontend is served at **http://localhost:8080** and the API at **http://localhost:8001**. The Compose stack routes `/api` through Nginx and uses PostgreSQL with a persistent volume. Override host ports with `FRONTEND_PORT` and `BACKEND_PORT` if those ports are already in use. Replace the example JWT secret before exposing this stack beyond local development.

---

## Demo Accounts

The seed script creates these ready-to-use accounts:

| Role | Email | Password | Access |
|---|---|---|---|
| Regular User | `user@demo.com` | `Password123!` | Full user workflow |
| Skincare Consultant | `consultant@demo.com` | `Password123!` | Role exists, auth works |
| Dermatologist | `derm@demo.com` | `Password123!` | Role exists, auth works |
| Administrator | `admin@demo.com` | `Password123!` | User directory access |

> ⚠️ These credentials are for **development and demonstration only**. Change all secrets before any production deployment.

The **Login page** also includes one-click demo fill buttons for instant access during evaluation.

---

## API Documentation

Once the backend is running, interactive API documentation is available at:

| Interface | URL |
|---|---|
| **Swagger UI** | http://localhost:8001/api/docs |
| **ReDoc** | http://localhost:8001/api/redoc |
| **OpenAPI JSON** | http://localhost:8001/api/openapi.json |

### API Endpoint Summary

```
Authentication:
  POST   /api/auth/register         Register new user account
  POST   /api/auth/login            Login and receive JWT token
  GET    /api/auth/me               Get current authenticated user

Users:
  GET    /api/users/me              Get own profile
  PUT    /api/users/me              Update own name/email
  PUT    /api/users/me/password     Change password

Skin Profile:
  GET    /api/skin-profile          Get own skin profile
  POST   /api/skin-profile          Create skin profile
  PUT    /api/skin-profile          Update skin profile

Lifestyle:
  GET    /api/lifestyle             Get lifestyle profile
  POST   /api/lifestyle             Create lifestyle profile
  PUT    /api/lifestyle             Update lifestyle profile

Sleep:
  GET    /api/sleep                 List all sleep records
  POST   /api/sleep                 Create new sleep record
  PUT    /api/sleep/{id}            Update specific sleep record
  DELETE /api/sleep/{id}            Delete specific sleep record

Hydration:
  GET    /api/hydration             List all hydration records
  POST   /api/hydration             Create new hydration record
  PUT    /api/hydration/{id}        Update specific hydration record
  DELETE /api/hydration/{id}        Delete specific hydration record

Dashboard:
  GET    /api/dashboard/summary     Full dashboard summary + completion %
  GET    /api/dashboard/progress    Current scores and saved assessment history

Reports:
  GET    /api/reports/progress?format=pdf   Download PDF progress report
  GET    /api/reports/progress?format=xlsx  Download Excel progress report

Administration:
  GET    /api/admin/users           All users (ADMINISTRATOR only)
```

All protected endpoints require the `Authorization: Bearer <token>` header.

---

## User Roles & RBAC

### Role Overview

```
ADMINISTRATOR
  └── Access to /api/admin/users
  └── All USER capabilities

DERMATOLOGIST
  └── Role exists, JWT auth works
  └── Dashboard access (Milestone 2: clinical view)

SKINCARE_CONSULTANT
  └── Role exists, JWT auth works
  └── Dashboard access (Milestone 2: consultant view)

USER  (primary Milestone 1 role)
  └── Manage own skin profile
  └── Manage own lifestyle profile
  └── Manage own sleep records
  └── Manage own hydration records
  └── View personal dashboard
  └── Update account settings
```

### RBAC Implementation

- Roles are stored in the `users.role` database column
- Role is embedded in the JWT payload at login
- Every protected route uses `get_current_user` dependency to decode & verify the token
- Role-restricted routes additionally use `require_role([UserRole.ADMINISTRATOR])` dependency
- Registration endpoint rejects `ADMINISTRATOR` role selection by non-admins

---

## Running Tests

```bash
cd backend

# Windows
& "$HOME\.local\bin\uv.exe" run pytest tests/ -v

# macOS/Linux
uv run pytest tests/ -v
```

**27 tests across 11 test modules:**

| Module | Tests |
|---|---|
| `test_auth.py` | Registration, login, duplicate email, invalid credentials |
| `test_rbac.py` | Protected endpoint access, role authorization |
| `test_skin_profile.py` | Create and update skin profile |
| `test_lifestyle.py` | Create and update lifestyle profile |
| `test_sleep.py` | Create sleep record, list records |
| `test_hydration.py` | Create hydration record, list records |
| `test_dashboard.py` | Dashboard summary, profile completion calculation |
| `test_assessment.py` | Weighted assessment score and routine generation |
| `test_recommendations.py` | Ingredient compatibility, allergy filtering, product ranking |
| `test_routines.py` | Saved plans, daily checklist, adherence history |
| `test_reports.py` | Authenticated PDF/XLSX exports and download validation |

---

## Milestone Roadmap

### Milestone 2 — Skin Assessment & Routine Generation (Implemented)
- Weighted skin assessment with score breakdown and prioritized concerns
- Personalized morning, evening, and weekly routines
- Lifestyle, sleep, hydration, and routine consistency inputs

### Milestone 3 — Product Intelligence & Progress Tracking (Implemented)
- Ingredient suitability and active-ingredient compatibility analysis
- Allergy- and budget-aware product recommendations
- Persisted routine checklist with daily completion and 7-day adherence
- Dashboard progress scoring and analytics

### Milestone 4 — Analytics, Reports & Container Deployment
- Dashboard visualizes persisted assessment history instead of estimated trend points
- Authenticated PDF and Excel progress reports
- Docker Compose stack with Nginx frontend, FastAPI backend, and PostgreSQL persistence
- CI workflow runs backend tests, frontend build, and container builds
- Cloud-provider deployment, image comparison, and reminder notifications remain future work

---

## License

This project is an internship demonstration project. All code is for educational purposes.

---

*Milestones 1–4 implemented for local use. Production cloud hosting and reminder notifications require deployment-specific configuration.*
