# AI-Powered Skin Intelligence & Personalized Skincare Routine Recommendation Platform

An intelligent, multi-dimensional digital healthcare platform designed to combine clinical dermatological science with lifestyle, sleep, hydration, and environmental tracking to provide personalized skincare intelligence and tailored routines.

---

## 🌟 Overview

The **AI-Powered Skin Intelligence and Personalized Skincare Routine Recommendation Platform** provides an end-to-end ecosystem for understanding and improving skin health. By evaluating an individual's unique skin type, active concerns, environmental stressors, lifestyle habits, and product compatibility, the system generates custom regimens, tracks longitudinal skin progress, and enables seamless collaboration between patients, skincare consultants, and certified dermatologists.

---

## 🚀 Key Features

### 1. 💬 SkinAI Assistant (Interactive AI Chat)
- 24/7 intelligent skincare assistant powered by dermatology science and cosmetic formulation knowledge.
- Instant guidance on active acne, barrier repair, anti-aging protocols, sunscreen use, ingredient interactions, and personalized routines.
- Pre-configured suggestion chips and real-time response generation.

### 2. 🧬 Comprehensive Skin Profiling
- Identification of Fitzpatrick skin type, oiliness, sensitivity, and barrier status.
- Tracking of primary and secondary skin concerns (acne, hyperpigmentation, redness, fine lines, pores).
- Monitoring of environmental context (UV exposure, climate humidity, pollution indices).

### 3. 🌿 Personalized Skincare Routine Planner
- Dynamic step-by-step Morning (AM), Evening (PM), and Weekly treatments tailored to skin barrier tolerance.
- Routine adherence rate tracking with streak calculation to promote habit consistency.
- Step-by-step guidance on application order and wait times.

### 4. 🧴 Product Recommendations & ⚗️ Ingredient Intelligence
- Curated product matching based on active concerns and skin profile.
- Cosmetic ingredient analyzer identifying beneficial actives, comedogenicity ratings, allergens, and chemical conflicts.

### 5. 📊 Longitudinal Progress Tracking & Skin Health Score
- Weighted multi-factorial **Skin Health Score** (routine adherence, sleep quality, hydration levels, skin condition logs, and stress metrics).
- 30-day activity calendar with daily ratings, adherence visualizer, and consistency streaks.

### 6. 💧 Sleep, Hydration & Lifestyle Monitoring
- Water intake logging against personalized daily goals (e.g., 3.0 L).
- Sleep quality tracking and circadian rhythm alignment.
- Stress and diet monitoring to assess their direct impacts on skin inflammation.

### 7. 🩺 Multi-Role Collaboration & Dashboards
- **User Dashboard:** Daily vitals, active routine, progress streaks, and quick actions.
- **Dermatologist Dashboard:** Clinical patient directory, medical notes, diagnostic logs, and treatment oversight.
- **Skincare Consultant Portal:** Client assessments and recommendation reviews.
- **Administrator Console:** Role management, system health metrics, and user controls.

### 8. 📋 Clinical Reports & Notifications
- Exportable clinical skincare diagnostic reports.
- Automated daily reminders for routine steps, hydration goals, and sleep schedules.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 7, React Router DOM 7, Framer Motion, Axios, Modern Responsive CSS |
| **Backend** | Python 3, FastAPI, SQLAlchemy ORM, Pydantic V2, Uvicorn |
| **Security & Auth** | JWT (JSON Web Tokens), bcrypt password hashing, Role-Based Access Control (RBAC) |
| **Database** | PostgreSQL |
| **Styling & UI** | Cream-white & sage-green aesthetic, modern left sidebar navigation, smooth card transitions |

---

## 📁 Project Architecture

```
skin-intelligence/
├── backend/
│   ├── main.py                  # FastAPI application entry point & CORS
│   ├── database.py              # PostgreSQL database engine & session factory
│   ├── models.py                # SQLAlchemy ORM models (Users, Profiles, Routines, Logs)
│   ├── schemas.py               # Pydantic V2 validation models
│   ├── routes/
│   │   ├── users.py             # Authentication & role management
│   │   ├── profile.py           # Skin profile CRUD
│   │   ├── routine.py           # Routine planning & completion tracking
│   │   ├── assessment.py        # Diagnostic evaluation & scoring
│   │   ├── products.py          # Recommendations catalog
│   │   ├── ingredients.py       # Formula & conflict analysis
│   │   ├── progress.py          # Activity logs, streaks & analytics
│   │   ├── sleep.py             # Sleep intelligence
│   │   ├── hydration.py         # Hydration tracker
│   │   ├── lifestyle.py         # Stress, diet & fitness tracking
│   │   ├── dermatologist.py     # Clinical dermatologist portal
│   │   ├── notifications.py     # Daily reminder system
│   │   └── reports.py           # Report generation & exports
│   └── services/
│       ├── routine_generator.py # Dynamic skincare regimen algorithm
│       └── skin_vision_engine.py# Vision analysis & marker extraction
└── frontend/
    ├── src/
    │   ├── App.jsx              # Application shell & protected routing
    │   ├── styles.css           # Global theme, layout & animation styles
    │   ├── components/
    │   │   ├── Sidebar.jsx      # Left sidebar navigation with role badges
    │   │   └── NotificationCenter.jsx # Real-time notification dropdown
    │   ├── pages/
    │   │   ├── Home.jsx         # Premium landing page
    │   │   ├── AISkinChat.jsx   # SkinAI interactive assistant
    │   │   ├── Dashboard.jsx    # Unified user dashboard
    │   │   ├── SkinProfile.jsx  # Profile configuration
    │   │   ├── RoutinePlanner.jsx # AM/PM regimen planner
    │   │   ├── ProgressTracker.jsx # Calendar & adherence analytics
    │   │   ├── SkinAssessment.jsx # Questionnaire & skin scoring
    │   │   ├── ProductRecommendations.jsx # Product catalog
    │   │   ├── IngredientIntelligence.jsx # Ingredient checker
    │   │   ├── ReportsExport.jsx # Diagnostic report viewer
    │   │   └── dermatologist/   # Clinical dermatologist view
    │   └── services/
    │       └── api.js           # Centralized Axios API client
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- PostgreSQL database

---

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   Copy `.env.example` to `.env` and set your database connection details and secret key:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/skin_intelligence
   SECRET_KEY=your_secure_jwt_secret_key
   ```

5. Start the backend API server:
   ```bash
   uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```

   Interactive API documentation (Swagger UI) is available at:
   `http://127.0.0.1:8000/docs`

---

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8000/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

   The application will be accessible at:
   `http://localhost:5173`

---

## 🔒 Security & Privacy

- **Data Encryption & Hashing:** User passwords securely hashed using `bcrypt`.
- **Stateless Authentication:** Secure token-based session handling via JWT.
- **Role-Based Access Control (RBAC):** Strict separation of privileges across Users, Skincare Consultants, Dermatologists, and Administrators.
- **Privacy First:** User health observations and tracking metrics are stored securely with zero unauthorized third-party access.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
