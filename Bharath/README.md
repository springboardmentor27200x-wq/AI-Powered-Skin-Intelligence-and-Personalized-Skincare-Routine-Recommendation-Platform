# SkinIntel - AI Skincare Planner

A full-stack personalized skincare intelligence platform featuring MongoDB document persistence, JWT authentication, Role-Based Access Control (RBAC), predictive skin health scoring grounded in a 1,200-record clinical dataset, and an advanced **Ingredient Intelligence & Product Recommendation Engine (Milestone 3)**.

---

## 1. Project Milestones

### Milestone 1: Core Profile & Tracking Architecture
- MongoDB database persistence with fallback high-performance in-memory document engine.
- JWT authentication with Bcrypt password encryption.
- Role-Based Access Control (`USER` and `ADMIN`).
- Comprehensive Skin Profile configuration (skin types, Fitzpatrick phototypes, concerns, allergens, sensitivities).
- Daily time-series tracking for hydration (liters), lifestyle habits, UV/pollution exposure, and nightly sleep quality.

### Milestone 2: Skin Health Scoring & Predictive Dynamic Routines
- Multi-dimensional skin health scoring engine ($0-100\%$) across barrier, condition, hydration, lifestyle, and sleep sub-scores.
- **1,200-Record Clinical Dermatology Dataset** (`/data/skincare_clinical_dataset.xlsx` and `.csv`).
- **Distance-Weighted $k$-NN with Gaussian RBF Kernel** ($k=9, \gamma=0.035, R^2=0.912$) finding the top analogous clinical patient outcomes.
- Personalized Dynamic Routine Generator (AM/PM routines and weekly treatments) with allergen exclusion filters.

### Milestone 3: Ingredient Intelligence & Product Recommendation Engine
- **Ingredient Intelligence Module**:
  - Scientific encyclopedia of 75+ dermatological ingredients with INCI registries, biological mechanisms, pH ranges, safety scores, and comedogenic indices (0 to 5).
  - Active contraindication detection (e.g. Retinol + AHA/BHA, Benzoyl Peroxide + Pure Vitamin C, Acid + Copper Peptide hydrolysis).
  - Golden synergy detection (e.g. Vitamin C + Ferulic Acid + Vitamin E, Niacinamide + Ceramides, Salicylic Acid + Zinc PCA).
  - **INCI Formulation Safety Scanner**: Paste raw cosmetic ingredient decks for instant safety scoring ($0-100\%$), comedogenic pore-clogging risk meter, allergen quarantine, and conflict checks.
- **Product Recommendation Engine**:
  - Curated catalog of 32+ dermatological formulations across 7 categories (Cleansers, Toners, Serums, Moisturizers, Sunscreens SPF 50+, Exfoliants, Eye Creams).
  - Algorithmic Product Match Scoring ($0-100\%$) tailored to user skin type, target concerns, barrier resiliency, predicted active, and allergen exclusion.
- **My Skincare Shelf & Routine Product Tracking**:
  - Users can maintain active products on their virtual shelf and map formulas directly to AM/PM routine steps.
  - Real-time Routine Conflict Checker: Alerts users if assigned products clash or if morning routines lack photoprotective SPF.
- **Daily Routine Adherence Tracker & Skin Tolerance Logger**:
  - Check off daily morning and evening routine completion.
  - Log skin reaction and tolerance (Calm & Radiant, Hydrated, Mild Tingling, Slight Redness, Flaking, Breakout).
  - Streak tracking (Current streak, 30-day adherence rate, history logs).

---

## 2. Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React, Motion
- **Backend**: Node.js & Express API server with MongoDB document database layer
- **Database**: MongoDB (Collections: `users`, `skin_profiles`, `lifestyle_records`, `sleep_records`, `skin_assessments`, `skincare_routines`, `products`, `ingredients`, `user_shelves`, `routine_logs`)
- **Authentication**: JWT (JSON Web Tokens) with Bcrypt password hashing
- **Security**: Role-Based Access Control supporting `USER` and `ADMIN`

---

## 3. MongoDB Collections & Documents

- **`users`**: User records with unique email, hashed password, role (`USER` | `ADMIN`), and timestamps.
- **`skin_profiles`**: 1-to-1 skin configuration with skin type, age group, concerns, allergies, and sensitivities.
- **`lifestyle_records`**: Time-series daily lifestyle logs (habits, water intake in liters, environmental exposure).
- **`sleep_records`**: Time-series sleep entries (hours slept, sleep quality).
- **`skin_assessments`**: Skin health assessments with $k$-NN clinical case matches and barrier predictions.
- **`skincare_routines`**: Personalized morning, evening, and weekly routine plans.
- **`products`**: Curated product catalog with full INCI ingredients, prices, ratings, and routine slots.
- **`ingredients`**: Scientific active knowledge base with contraindication & synergy matrices.
- **`user_shelves`**: User's saved shelf items mapped to AM/PM routine slots with opening dates.
- **`routine_logs`**: Daily routine adherence logs with skin tolerance reactions and streaks.

---

## 4. Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
npm start
```
