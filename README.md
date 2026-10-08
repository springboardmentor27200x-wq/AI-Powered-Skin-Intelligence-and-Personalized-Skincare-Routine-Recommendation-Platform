# DermaGenie - AI Skincare Assistant

DermaGenie is an AI-powered skincare assistant that provides personalized skin insights, skincare routines, product recommendations, progress tracking, health analytics, reminders, and reports.

The platform combines Artificial Intelligence, Machine Learning, FastAPI, React, and database technologies to provide users with personalized skincare guidance based on their skin profile, lifestyle, sleep, hydration, routine consistency, and skincare concerns.

---

## 🌟 Project Overview

Skincare recommendations are often generic and may not consider an individual's skin type, lifestyle, sleep, hydration, skincare routine, or specific concerns.

DermaGenie addresses this problem by analyzing user-specific information and generating personalized skincare insights and recommendations.

The system provides:

- AI-based skin concern prediction
- Skin health scoring
- Personalized skincare routines
- Product recommendations
- Ingredient intelligence
- Lifestyle and sleep tracking
- Routine adherence tracking
- Progress monitoring
- Health analytics
- Notifications and reminders
- Consultation management
- Skin assessment reports
- PDF and Excel report exports

---

## 🎯 Objectives

The main objectives of DermaGenie are:

1. Provide personalized skincare recommendations.
2. Analyze user skin conditions and concerns.
3. Generate a comprehensive skin health score.
4. Predict possible skin concerns using Machine Learning.
5. Create personalized morning and evening skincare routines.
6. Recommend suitable skincare products.
7. Track lifestyle, sleep, hydration, and skincare habits.
8. Monitor skincare progress over time.
9. Provide useful reminders and notifications.
10. Generate downloadable skincare reports.

---

# 🚀 Key Features

## 👤 User Management

- User registration and login
- JWT-based authentication
- Password security using bcrypt
- Role-based access control
- User profile management

### Supported Roles

- User
- Skincare Consultant
- Dermatologist
- Administrator

---

## 🧴 Skin Profile Management

Users can maintain information such as:

- Skin type
- Skin concerns
- Sensitivity
- Age
- Skin preferences
- Budget
- Other skincare-related information

---

## 🤖 AI & Machine Learning

DermaGenie uses Machine Learning to predict skin concerns based on user information.

The ML system uses features related to:

- Age
- Skin type
- Skin sensitivity
- Lifestyle
- Sleep
- Stress
- Physical activity
- Hydration
- Skincare habits

The trained Machine Learning model is stored using Joblib.

### ML Model

```text
backend/ml_model/
└── skin_concern_model.joblib
