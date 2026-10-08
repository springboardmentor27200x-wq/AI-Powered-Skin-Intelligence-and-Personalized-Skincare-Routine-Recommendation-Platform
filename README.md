# 🌿 AI Skin Intelligence & Personalized Skincare Planner

An AI-powered skincare intelligence platform that analyzes a user's skin profile, lifestyle habits, sleep quality, environmental exposure, and skin concerns to create clinically grounded personalized routines, active ingredient intelligence, and machine learning product recommendations.

---

## 🌟 Key Features & Implemented Modules

### 1. User Authentication & Role-Based Access Control (RBAC)
- Secure JWT-based registration and login.
- Four distinct user roles:
  - **User**: General consumer taking skin assessments and tracking progress.
  - **Skincare Consultant**: Reviews client profiles and advises routines.
  - **Dermatologist**: Clinical oversight, diagnosis insights, and prescription adjustments.
  - **Administrator**: System analytics, product catalog monitoring, and user role management.

### 2. Multi-Factor Skin Assessment Engine
- Clinical 5-Factor Weighted Scoring Model:
  $$\text{Skin Health Score} = \text{Condition}(35\%) + \text{Lifestyle}(20\%) + \text{Sleep}(15\%) + \text{Consistency}(20\%) + \text{Hydration}(10\%)$$
- **Hybrid Machine Learning refinement** using Ridge Regression (`skin_score_model.joblib`).
- **Concern Prioritization**: Evaluates 10 core skin concerns (Acne, Hyperpigmentation, Dark Spots, Dry Skin, Oily Skin, Sensitive Skin, Wrinkles, Fine Lines, Redness, Uneven Skin Tone).
- **Risk Factor Identification**: Flags barrier damage, sun damage, and sensitivity triggers.

### 3. Machine Learning Product Recommendation Engine
- **Content-Based Filtering (Cosine Similarity)** built with Scikit-learn.
- Real catalog of 5,000+ lines categorized into Face Wash, Toner, Serum, Moisturizer, Sunscreen, Treatment Products, and Face Masks.
- Suitability scoring ($0$ to $100\%$) and explanation of why ingredients matched.
- **Side-by-Side Product Comparison tool** (compare up to 4 products at once).
- Budget-based recommendations (`Budget`, `Mid`, `Premium`).

### 4. Ingredient Intelligence Module
- Evidence-based active ingredient analysis (Niacinamide, Salicylic Acid, Hyaluronic Acid, Ceramides, Retinol, Vitamin C, Alpha Arbutin, Centella, Panthenol, Azelaic Acid, Squalane, Glycerin).
- Explains benefits, caution notes, and checks user allergies and sensitivities.

### 5. Personalized Routine Generator & Checklist
- Automated Morning (AM) & Evening (PM) step-by-step routines.
- Weekly treatment calendar (exfoliation nights, active retinol nights, recovery days).
- Live weather & seasonal adjustments (UV index, temperature, humidity via Open-Meteo).
- Interactive daily checklist to log routine completion and build consistency streaks.

### 6. Progress Tracking & Clinical Analytics
- Historical skin health score logs.
- AI trend analysis (`Improving`, `Stable`, `Declining`).
- Next 10–14 day predicted skin score and targeted habits recommendations.

### 7. Notification & Reminder System
- Morning and evening routine reminder prompts.
- Daily water intake and hydration alerts.
- Product replenishment alerts before bottles run empty.
- Doctor clinical recommendation notifications.

### 8. Reports & Clinical Export System
- **Skin Assessment Report** (Downloadable PDF)
- **Personalized Routine Plan** (Downloadable PDF)
- **Product Recommendations Report** (Downloadable PDF)
- **Progress History Spreadsheet** (Downloadable Excel `.xlsx` and PDF)

---

## 🚀 How to Run the Project (For Beginners)

### Option A: Running Locally on Your Machine

#### 1. Start the Backend Server (Terminal 1)
```powershell
cd c:\Users\adithraj\skin-intelligence\backend
python run.py
```
> The API will start at: `http://127.0.0.1:5000`

#### 2. Start the Frontend Web App (Terminal 2)
```powershell
cd c:\Users\adithraj\skin-intelligence\frontend
npm run dev
```
> Open your browser at: `http://localhost:5173`

---

### Option B: Running with Docker (One-Click Launch)
Make sure Docker Desktop is running, then run in the project root:
```bash
docker-compose up --build
```
> This starts PostgreSQL, the Flask backend, and the React frontend automatically.

---

## 👥 How to Test Each Role

1. **User Role**:
   - Register a regular account at `/register` with role **User**.
   - Complete your **Skin Profile** questionnaire.
   - View your **Skin Analysis**, **Routines**, **Products**, and **Progress**.

2. **Dermatologist / Consultant Role**:
   - Register or assign an account as **Dermatologist** or **Consultant**.
   - A new **🩺 Doctor Portal** link will appear in your sidebar.
   - Browse the patient registry, view complete clinical files, and write clinical notes / routine adjustments.

3. **Administrator Role**:
   - Register or promote an account to **Administrator**.
   - A new **🛡️ Admin Portal** link will appear in your sidebar.
   - View system statistics, distribution of reported skin concerns, and manage user accounts and roles.

---

## 📡 API Endpoint Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/register` | Register a new user |
| `POST` | `/login` | Authenticate user & receive JWT |
| `GET` / `POST` | `/profile` | Retrieve or update user skin profile |
| `GET` | `/assessment` | Complete AI skin analysis, score, routines, and product suggestions |
| `GET` | `/checklist` | Get today's morning & evening routine checklist |
| `POST` | `/checklist/toggle/<id>` | Mark a checklist step as completed / pending |
| `GET` | `/progress` | Get score history, improvement delta, and trend insights |
| `GET` | `/api/notifications` | Get routine, hydration, and replenishment reminders |
| `GET` | `/api/reports/export/pdf/assessment` | Export Skin Assessment Report (PDF) |
| `GET` | `/api/reports/export/pdf/routine` | Export Routine Plan (PDF) |
| `GET` | `/api/reports/export/pdf/products` | Export Product Recommendations (PDF) |
| `GET` | `/api/reports/export/excel/progress` | Export Progress History (Excel) |
| `GET` | `/api/doctor/patients` | Clinical patient list for Dermatologists & Consultants |
| `POST` | `/api/doctor/patient/<id>/note` | Save doctor treatment recommendation |
| `GET` | `/api/admin/stats` | Platform analytics and concern distribution |
| `GET` | `/api/admin/users` | Admin user management list |
| `POST` | `/api/admin/user/<id>/role` | Change user role (RBAC) |
