# AI Skin Intelligence and Personalized Skincare Planner

## 📌 Project Overview

**AI Skin Intelligence and Personalized Skincare Planner** is a full-stack web application developed as part of the Infosys Virtual Internship Program. It helps users organize their skincare routines using personal skin profiles, lifestyle information, facial image analysis, and personalized product recommendations.

The application combines rule-based skin assessment, image processing, product recommendation techniques, progress tracking, and dermatologist support in a single platform.

## 🎯 Objectives

- Analyze skin-related concerns using profile and lifestyle information.
- Calculate an explainable skin health score.
- Perform facial texture analysis using image processing techniques.
- Generate personalized morning, evening, and weekly skincare routines.
- Recommend suitable skincare products using TF-IDF and cosine similarity.
- Identify potential ingredient matches with user-reported allergies.
- Track skincare progress and routine consistency.
- Provide reminders and product replenishment notifications.
- Support dermatologist review and personalized routine prescriptions.

## ✨ Key Features

### 1. User Authentication
- User registration and login.
- JWT-based authentication.
- Secure password hashing using PBKDF2-HMAC-SHA-256.
- Role-based user categories.

### 2. Skin Profile Management
- Store skin type and age group.
- Record skin concerns, allergies, and sensitivities.
- Maintain personalized skincare information.

### 3. Lifestyle Tracking
- Record sleep duration and quality.
- Track daily water intake.
- Monitor UV exposure, pollution, and stress.
- Record sunscreen usage.

### 4. Skin Assessment
- Calculate a skin health score from 0 to 100.
- Evaluate multiple skin concerns.
- Display contributing lifestyle and skin factors.
- Provide understandable scoring explanations.

### 5. Facial Image Analysis
- Upload facial images or capture multiple facial angles.
- Analyze texture-related image characteristics.
- Estimate roughness, smoothness, pore visibility, shine, redness, and fine-line indicators.
- Generate image-based measurements using NumPy and Pillow.

### 6. Personalized Skincare Routine
- Generate morning and evening routines.
- Provide weekly skincare steps.
- Display product details, application instructions, and reasons for recommendations.

### 7. Product Recommendation
- Maintain a catalogue of 21 skincare products.
- Use TF-IDF vectorization and cosine similarity to rank relevant products.
- Match products with skin types and reported concerns.
- Flag ingredient matches against recorded allergies.

### 8. Progress Tracking
- Store previous skin assessment scores.
- Display progress trends and average scores.
- Track routine adherence and personal notes.

### 9. Notifications and Dermatologist Portal
- Support skincare reminders and skin-cycling guidance.
- Track product replenishment.
- Allow clinicians to review patient information and issue skincare routines.

## 🛠️ Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | Python, FastAPI, Uvicorn |
| Database | SQLite |
| ORM | SQLAlchemy |
| Authentication | JWT, PBKDF2-HMAC-SHA-256 |
| Image Processing | NumPy, Pillow |
| Recommendation System | Scikit-learn, TF-IDF, Cosine Similarity |
| Machine Learning Experiment | XGBoost, pandas, Scikit-learn |
| API Validation | Pydantic |
| API Testing | FastAPI TestClient |

## 🏗️ System Architecture

The application follows a client-server architecture.

1. **Frontend:** React provides the user interface for profile management, assessments, routines, and progress tracking.
2. **Backend API:** FastAPI handles HTTP requests, authentication, validation, and application workflows.
3. **Business Logic:** Separate modules perform skin scoring, image analysis, routine generation, and product recommendation.
4. **Database:** SQLAlchemy manages data persistence using SQLite.
5. **Analysis:** NumPy and Pillow process images, while Scikit-learn supports product ranking and offline machine-learning experiments.

## 📂 Main Modules

- Authentication and user management
- Skin profile management
- Lifestyle logging
- Skin assessment and scoring
- Facial texture analysis
- Skincare routine generation
- Product recommendation and ingredient checking
- Progress analytics
- Notifications and replenishment
- Dermatologist and prescription management

## 🚀 Installation and Setup

### Prerequisites

- Python 3.10 or a compatible version
- Node.js and npm
- Git

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_PROJECT_FOLDER>
```

Replace the placeholders with your actual GitHub repository URL and project folder name.

### 2. Start the Backend

Navigate to the backend directory:

```bash
cd backend
```

Create and activate a virtual environment.

**Windows:**

```bash
python -m venv venv
venv\Scripts\activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI application:

```bash
uvicorn main:app --reload
```

If your FastAPI entry-point filename or module differs, replace `main:app` with the correct module and application variable used in your project.

The API documentation is generally available at:

```text
http://127.0.0.1:8000/docs
```

### 3. Start the Frontend

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Open the local URL displayed in your terminal to access the application.

**Note:** The commands above assume your repository contains separate `backend` and `frontend` directories and a backend `requirements.txt` file. Adjust the paths and commands to match your actual project structure.

## 🧪 Testing

The project report documents functional testing of the following workflows:

- API health check and database connectivity.
- User registration and valid login.
- Invalid-password rejection.
- Unauthorized access rejection for protected endpoints.
- Skin profile creation and lifestyle logging.
- Skin assessment and score generation.
- Routine generation and product recommendation workflows.
- Progress tracking and dermatologist prescription views.

The recorded API demonstration returned a skin health score of 49.0 for its sample assessment. Results depend on the test inputs and should not be interpreted as clinical validation.

## 🤖 Machine Learning Experiment

A separate offline experiment uses a synthetic dataset containing 10,000 samples to explore skin health score prediction and classification of four skin concerns.

The experiment uses XGBoost regression and classification models with Scikit-learn preprocessing pipelines.

**Important:** These models are experimental and are not integrated into the live assessment engine. The live assessment uses rule-based scoring, and the product recommender uses TF-IDF and cosine similarity.

## 🔮 Future Enhancements

- Improve facial image analysis using validated machine-learning models.
- Evaluate prediction models using real, consented, professionally annotated datasets.
- Strengthen backend role-based authorization.
- Add OAuth-based social authentication.
- Expand the product catalogue and recommendation criteria.
- Introduce cloud deployment and production database support.
- Add email or push notifications.
- Improve automated testing and continuous integration.

## 🔐 Security and Privacy

- Passwords are hashed instead of being stored as plain text.
- JWT tokens are used to authenticate protected API requests.
- User profiles and skincare information should be handled securely.
- Production deployment should include secure secret management, restricted CORS settings, and server-side authorization checks.

## ⚠️ Disclaimer

This application is intended for skincare planning and educational purposes only. Facial image measurements and generated scores are heuristic estimates, not medical diagnoses. Product recommendations and ingredient matching do not guarantee safety or suitability. Consult a qualified dermatologist for persistent skin concerns, suspected allergies, or medical advice.

## 👩‍💻 Internship Information

**Program:** Infosys Virtual Internship  
**Project Title:** AI Skin Intelligence and Personalized Skincare Planner  
**Mentor:** Harshitha  
**Submitted by:** Anusuyadevi N

## 📚 References

1. Chen, T. and Guestrin, C. “XGBoost: A Scalable Tree Boosting System.” ACM SIGKDD, 2016.
2. Pedregosa, F. et al. “Scikit-learn: Machine Learning in Python.” Journal of Machine Learning Research, 2011.
3. Salton, G. and Buckley, C. “Term-weighting Approaches in Automatic Text Retrieval.” Information Processing & Management, 1988.
4. Fielding, R. T. *Architectural Styles and the Design of Network-based Software Architectures*, 2000.
5. Jones, M., Bradley, J., and Sakimura, N. “JSON Web Token (JWT).” RFC 7519, 2015.
6. Harris, C. R. et al. “Array Programming with NumPy.” Nature, 2020.

---

**Developed as part of the Infosys Virtual Internship Program.**
