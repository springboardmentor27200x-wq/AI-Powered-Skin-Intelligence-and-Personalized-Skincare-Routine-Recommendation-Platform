# AI Skin Intelligence & Personalized Skincare Planner — Milestone 1

Milestone 1 only: project setup, authentication, user profile, skin profile, lifestyle/sleep/hydration/environmental exposure tracking.

## Stack
- Frontend: React + JavaScript + CSS
- Backend: Python + FastAPI
- Database: PostgreSQL
- Authentication: JWT
- API testing: Postman / FastAPI Swagger
- Development: VS Code, Git/GitHub

## Backend setup
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Create `backend/.env` from `.env.example`.

## Frontend setup
```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env` from `.env.example`.

## PostgreSQL
Create a database named `skin_intelligence` and set the connection string in `backend/.env`.

## API
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/users/me`
- POST `/api/profile`
- GET `/api/profile`
- PUT `/api/profile`

Swagger: `http://127.0.0.1:8000/docs`

## Milestone 1 workflow
Home → Register → Login → JWT → Dashboard → Skin Profile → Lifestyle/Sleep/Water/Environment → PostgreSQL → View/Edit → Logout

## Explicitly excluded
No AI diagnosis, skin score, routine generation, product/ingredient recommendation, analytics, charts, doctor/consultant/admin dashboards, notifications, reports, or ML models.
