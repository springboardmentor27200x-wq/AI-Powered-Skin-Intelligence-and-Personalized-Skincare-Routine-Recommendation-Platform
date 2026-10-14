# AI Skin Intelligence & Personalized Skincare Planner

Foundational layer for the platform: database schema, backend authentication,
and the landing/login/register pages with role-based access for four roles —
**User**, **Skincare Consultant**, **Dermatologist**, **Administrator**.

## What's here

```
backend/     FastAPI + SQLAlchemy + JWT auth, PostgreSQL schema
frontend/    React (Vite) + Tailwind — landing page, login, register, dashboard
```

## Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # then edit DATABASE_URL / JWT_SECRET_KEY
```

Create the database (Postgres must be running):

```sql
CREATE DATABASE skin_intelligence;
```

Tables are created automatically on startup, or run `schema.sql` by hand:

```bash
psql -U postgres -d skin_intelligence -f schema.sql
```

Run the API:

```bash
uvicorn app.main:app --reload
```

- Docs: http://localhost:8000/docs
- `POST /auth/register` — creates an account. `role` accepts `user`,
  `skincare_consultant`, or `dermatologist` (administrator accounts aren't
  self-service — create one directly in the database or add a seed script
  once you're ready).
- `POST /auth/login-json` — JSON login used by the React app.
- `POST /auth/login` — same thing as an OAuth2 form (for the Swagger UI's
  "Authorize" button, or any client that expects the standard flow).
- `GET /auth/me` — current user, requires `Authorization: Bearer <token>`.

Role checks for future protected endpoints: import `require_roles` from
`app/deps.py`, e.g. `Depends(require_roles(UserRole.dermatologist))`.

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env            # points at the backend, defaults to :8000
npm run dev
```

Open http://localhost:5173.

## Notes

- Passwords are hashed with bcrypt; nothing is ever stored in plain text.
- JWTs are issued on register/login and carry the user's role, so future
  endpoints can gate access without an extra database lookup.
- The dashboard page is a placeholder per role — the real per-role modules
  (skin assessment, client lists, patient insights, admin tools) are the
  next milestones per the project plan.
