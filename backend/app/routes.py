from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import date

from app import db
from app.models import User, SkinProfile, DailyChecklist, ScoreHistory, ClinicalRecommendation, Product
from app.ml.progress_insights import generate_progress_insights
from app.adherence import get_routine_consistency
from app.ml.skin_score_model import assess_skin          # ← hybrid ML version
from app.routine import generate_routine
from app.products import get_product_suggestions
from app.ml.analytics_service import generate_user_analytics
from app.ml.ingredient_intelligence import (
    get_comprehensive_ingredient_intelligence,
    analyze_ingredient_interactions,
    assess_ingredient_suitability,
    CATEGORIES_EDUCATION,
)

main = Blueprint("main", __name__)

@main.route("/")
def home():
    return jsonify({"message": "AI Skin Intelligence API is running"})


@main.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "user")

    if not name or not email or not password:
        return jsonify({"error": "Name, email and password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 400

    user = User(
        name=name,
        email=email,
        password=generate_password_hash(password),
        role=role
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201


@main.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }), 200


@main.route("/api/user/account", methods=["GET"])
@jwt_required()
def get_user_account():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "created_at": user.created_at.strftime("%B %d, %Y") if user.created_at else ""
    }), 200


@main.route("/api/user/account", methods=["POST", "PUT"])
@jwt_required()
def update_user_account():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    data = request.get_json() or {}
    new_name = data.get("name")
    new_email = data.get("email")
    if new_name:
        user.name = new_name.strip()
    if new_email and new_email != user.email:
        existing = User.query.filter_by(email=new_email.strip()).first()
        if existing and existing.id != user.id:
            return jsonify({"error": "Email is already taken by another account"}), 400
        user.email = new_email.strip()
    db.session.commit()
    return jsonify({
        "message": "Account details updated successfully",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }), 200


@main.route("/api/user/change-password", methods=["POST"])
@jwt_required()
def change_password():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    data = request.get_json() or {}
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    if not current_password or not new_password:
        return jsonify({"error": "Both current and new password are required"}), 400
    if not check_password_hash(user.password, current_password):
        return jsonify({"error": "Incorrect current password"}), 400
    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters long"}), 400
    user.password = generate_password_hash(new_password)
    db.session.commit()
    return jsonify({"message": "Password changed successfully"}), 200


@main.route("/profile", methods=["POST"])
@jwt_required()
def create_or_update_profile():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    profile = SkinProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        profile = SkinProfile(user_id=user_id)
        db.session.add(profile)

    profile.skin_type = data.get("skin_type")
    profile.age_group = data.get("age_group")
    profile.skin_concerns = data.get("skin_concerns")
    profile.allergies = data.get("allergies")
    profile.sensitivities = data.get("sensitivities")
    profile.selected_dermatologist = data.get("selected_dermatologist")
    profile.sleep_hours = data.get("sleep_hours")
    profile.sleep_quality = data.get("sleep_quality")
    profile.stress_level = data.get("stress_level")
    profile.exercise_frequency = data.get("exercise_frequency")
    profile.water_intake_level = data.get("water_intake_level")
    profile.average_water_intake = data.get("average_water_intake")
    profile.environmental_exposure = data.get("environmental_exposure")

    db.session.commit()
    return jsonify({"message": "Skin profile saved successfully"}), 200


@main.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    profile = SkinProfile.query.filter_by(user_id=user_id).first()

    if not profile:
        return jsonify({"message": "No profile found"}), 404

    return jsonify({
        "skin_type": profile.skin_type or "",
        "age_group": profile.age_group or "",
        "skin_concerns": profile.skin_concerns or "",
        "allergies": profile.allergies or "",
        "sensitivities": profile.sensitivities or "",
        "selected_dermatologist": profile.selected_dermatologist or "",
        "sleep_hours": profile.sleep_hours or "",
        "sleep_quality": profile.sleep_quality or "",
        "stress_level": profile.stress_level or "",
        "exercise_frequency": profile.exercise_frequency or "",
        "water_intake_level": profile.water_intake_level or "",
        "average_water_intake": profile.average_water_intake or "",
        "environmental_exposure": profile.environmental_exposure or ""
    }), 200


@main.route("/dermatologists", methods=["GET"])
@jwt_required()
def get_dermatologists():
    all_users = User.query.all()
    result = []
    for doc in all_users:
        if (doc.role or "").strip().lower() == "dermatologist":
            result.append({
                "id": doc.id,
                "name": doc.name,
                "email": doc.email
            })
    return jsonify(result), 200


@main.route("/assessment", methods=["GET"])
@jwt_required()
def get_assessment():
    user_id = int(get_jwt_identity())
    profile = SkinProfile.query.filter_by(user_id=user_id).first()

    if not profile:
        return jsonify({"error": "Please complete your Skin Profile first"}), 404

    today = date.today().isoformat()
    consistency = get_routine_consistency(user_id, days=7)

    profile_data = {
        "skin_type": profile.skin_type,
        "age_group": profile.age_group,
        "skin_concerns": profile.skin_concerns,
        "allergies": profile.allergies,
        "sensitivities": profile.sensitivities,
        "sleep_hours": profile.sleep_hours,
        "sleep_quality": profile.sleep_quality,
        "stress_level": profile.stress_level,
        "exercise_frequency": profile.exercise_frequency,
        "water_intake_level": profile.water_intake_level,
        "average_water_intake": profile.average_water_intake,
        "environmental_exposure": profile.environmental_exposure,
    }

    # 1. Skin assessment (hybrid ML + weighted)
    assessment = assess_skin(profile_data, routine_consistency=consistency)

    # 2. Personalized routine
    routine = generate_routine(profile_data, assessment.get("concerns"))

    # 3. Product recommendations
    raw_concerns = assessment.get("concerns") or profile_data.get("skin_concerns") or []
    if isinstance(raw_concerns, str):
        concerns_list = [c.strip() for c in raw_concerns.split(",") if c.strip()]
    else:
        concerns_list = raw_concerns

    products = get_product_suggestions(
        skin_type=profile_data.get("skin_type"),
        concerns=concerns_list,
        budget=None,
        sensitivities=profile_data.get("sensitivities"),
        allergies=profile_data.get("allergies")
    )

    # 4. Ingredient insights (comes from the new ML module inside assess_skin)
    ingredient_insights = assessment.get("ingredient_insights", [])

    # 5. Save score history (once per day)
    existing = ScoreHistory.query.filter_by(user_id=user_id, date=today).first()
    if not existing:
        db.session.add(ScoreHistory(
            user_id=user_id,
            score=assessment["score"],
            summary=assessment.get("summary", ""),
            date=today
        ))
        db.session.commit()

    return jsonify({
        "assessment": assessment,
        "routine": routine,
        "products": products,
        "ingredient_insights": ingredient_insights,
        "ingredient_intelligence": assessment.get("ingredient_intelligence", {}),
    }), 200

@main.route("/checklist", methods=["GET"])
@jwt_required()
def get_checklist():
    user_id = int(get_jwt_identity())
    today = date.today().isoformat()

    items = DailyChecklist.query.filter_by(user_id=user_id, date=today).all()
    profile = SkinProfile.query.filter_by(user_id=user_id).first()

    profile_data = {}
    if profile:
        profile_data = {
            "skin_type": profile.skin_type,
            "skin_concerns": profile.skin_concerns or "",
            "sensitivities": profile.sensitivities or "",
            "allergies": profile.allergies or "",
            "environmental_exposure": profile.environmental_exposure or "",
        }

    routine = generate_routine(profile_data) if profile_data else {}

    if not items and profile:
        for step in routine.get("morning", []):
            db.session.add(DailyChecklist(
                user_id=user_id,
                date=today,
                item=step,
                period="morning",
                is_completed=False
            ))

        for step in routine.get("evening", []):
            db.session.add(DailyChecklist(
                user_id=user_id,
                date=today,
                item=step,
                period="evening",
                is_completed=False
            ))

        db.session.commit()
        items = DailyChecklist.query.filter_by(user_id=user_id, date=today).all()

    result = {
        "date": today,
        "morning": [],
        "evening": [],
        "weekly": routine.get("weekly", {}),
        "seasonal": routine.get("seasonal", {}),
        "categories": routine.get("categories", {}),
        "adaptive_note": routine.get("adaptive_note", ""),
        "primary_concern": routine.get("primary_concern"),
    }
    for item in items:
        entry = {
            "id": item.id,
            "item": item.item,
            "is_completed": item.is_completed
        }
        if item.period == "morning":
            result["morning"].append(entry)
        else:
            result["evening"].append(entry)

    return jsonify(result), 200


@main.route("/ingredient-intelligence", methods=["GET", "POST"])
@jwt_required()
def ingredient_intelligence_endpoint():
    user_id = int(get_jwt_identity())
    profile = SkinProfile.query.filter_by(user_id=user_id).first()

    profile_data = {}
    if profile:
        profile_data = {
            "skin_type": profile.skin_type,
            "skin_concerns": profile.skin_concerns or "",
            "sensitivities": profile.sensitivities or "",
            "allergies": profile.allergies or "",
        }

    if request.method == "POST":
        data = request.get_json() or {}
        custom_ingredients = data.get("ingredients") or []
        overrides = data.get("profile") or {}
        merged_profile = {**profile_data, **overrides}

        interactions = analyze_ingredient_interactions(custom_ingredients)
        evaluated = [
            assess_ingredient_suitability(ing, merged_profile)
            for ing in custom_ingredients
        ]

        return jsonify({
            "tested_ingredients": custom_ingredients,
            "suitability": evaluated,
            "interactions": interactions,
            "categories_education": CATEGORIES_EDUCATION,
        }), 200

    # GET: return comprehensive profile intelligence
    full_intelligence = get_comprehensive_ingredient_intelligence(profile_data)
    return jsonify(full_intelligence), 200


@main.route("/checklist/toggle/<int:item_id>", methods=["POST"])
@jwt_required()
def toggle_checklist_item(item_id):
    user_id = int(get_jwt_identity())
    item = DailyChecklist.query.filter_by(id=item_id, user_id=user_id).first()

    if not item:
        return jsonify({"error": "Item not found"}), 404

    item.is_completed = not item.is_completed
    db.session.commit()

    return jsonify({
        "id": item.id,
        "is_completed": item.is_completed
    }), 200

@main.route("/progress", methods=["GET"])
@jwt_required()
def get_progress():
    user_id = int(get_jwt_identity())
    today = date.today().isoformat()

    history = ScoreHistory.query.filter_by(user_id=user_id).order_by(ScoreHistory.date.asc()).all()

    scores = []
    for h in history:
        scores.append({
            "date": h.date,
            "score": h.score,
            "summary": h.summary
        })

    latest = scores[-1]["score"] if scores else None
    first = scores[0]["score"] if scores else None
    change = (latest - first) if (latest is not None and first is not None) else 0

    checklist_items = DailyChecklist.query.filter_by(user_id=user_id, date=today).all()
    total = len(checklist_items)
    completed = len([i for i in checklist_items if i.is_completed])
    adherence = round((completed / total) * 100) if total else 0

    # New: AI progress insights
    insights = generate_progress_insights(
        history=scores,
        today_adherence=adherence,
        latest_score=latest,
    )

    comparison = {
        "baseline_date": scores[0]["date"] if scores else "Day 1",
        "baseline_score": first if first is not None else 0,
        "current_date": scores[-1]["date"] if scores else "Today",
        "current_score": latest if latest is not None else 0,
        "improvement_points": change,
        "percentage_change": round(((latest - first) / first) * 100, 1) if (first and latest and first > 0) else 0,
        "status": "Significant Improvement" if change >= 5 else "Needs Attention" if change <= -5 else "Consistent & Stable"
    }

    return jsonify({
        "history": scores,
        "latest_score": latest,
        "first_score": first,
        "change": change,
        "today_adherence": adherence,
        "today_completed": completed,
        "today_total": total,
        "insights": insights,
        "comparison": comparison
    }), 200

@main.route("/analytics", methods=["GET"])
@jwt_required()
def get_analytics():
    user_id = int(get_jwt_identity())
    days = request.args.get("days", 30, type=int)
    days = max(7, min(days, 90))  # safety bounds

    # Score history
    history_rows = (
        ScoreHistory.query
        .filter_by(user_id=user_id)
        .order_by(ScoreHistory.date.asc())
        .all()
    )
    score_history = [
        {"date": h.date, "score": h.score, "summary": h.summary}
        for h in history_rows
    ]

    # Checklist items (for adherence / engagement)
    checklist_rows = DailyChecklist.query.filter_by(user_id=user_id).all()
    checklist_items = [
        {
            "date": item.date,
            "is_completed": bool(item.is_completed),
        }
        for item in checklist_rows
    ]

    analytics = generate_user_analytics(
        score_history=score_history,
        checklist_items=checklist_items,
        days_window=days,
    )

    return jsonify({
        "user_id": user_id,
        "analytics": analytics,
    }), 200


# ============================================================
# Doctor & Consultant Endpoints (Milestone 4 - Role Dashboards)
# ============================================================

@main.route("/api/doctor/patients", methods=["GET"])
@jwt_required()
def get_doctor_patients():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or (current_user.role or "").lower() not in ["dermatologist", "consultant", "admin"]:
        return jsonify({"error": "Unauthorized. Professional access required."}), 403

    patients = User.query.filter(User.role == "user").all()
    result = []
    for p in patients:
        profile = SkinProfile.query.filter_by(user_id=p.id).first()
        latest_score = ScoreHistory.query.filter_by(user_id=p.id).order_by(ScoreHistory.date.desc()).first()

        result.append({
            "id": p.id,
            "name": p.name,
            "email": p.email,
            "created_at": p.created_at.strftime("%Y-%m-%d") if p.created_at else "",
            "skin_type": profile.skin_type if profile else "Not completed",
            "skin_concerns": profile.skin_concerns if profile else "None",
            "latest_score": latest_score.score if latest_score else None,
            "has_profile": bool(profile),
        })

    return jsonify({"patients": result, "total": len(result)}), 200


@main.route("/api/doctor/patient/<int:patient_id>", methods=["GET"])
@jwt_required()
def get_patient_detail(patient_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or (current_user.role or "").lower() not in ["dermatologist", "consultant", "admin"]:
        return jsonify({"error": "Unauthorized."}), 403

    patient = User.query.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    profile = SkinProfile.query.filter_by(user_id=patient.id).first()
    history = ScoreHistory.query.filter_by(user_id=patient.id).order_by(ScoreHistory.date.desc()).limit(15).all()
    recommendations = ClinicalRecommendation.query.filter_by(patient_id=patient.id).order_by(ClinicalRecommendation.created_at.desc()).all()

    doctor_notes = [
        {
            "id": r.id,
            "doctor_id": r.doctor_id,
            "notes": r.notes,
            "routine_adjustment": r.routine_adjustment,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else "",
        }
        for r in recommendations
    ]

    profile_dict = {
        "skin_type": profile.skin_type if profile else "—",
        "age_group": profile.age_group if profile else "—",
        "skin_concerns": profile.skin_concerns if profile else "—",
        "allergies": profile.allergies if profile else "None",
        "sensitivities": profile.sensitivities if profile else "None",
        "sleep_hours": profile.sleep_hours if profile else "—",
        "sleep_quality": profile.sleep_quality if profile else "—",
        "stress_level": profile.stress_level if profile else "—",
        "water_intake_level": profile.water_intake_level if profile else "—",
        "environmental_exposure": profile.environmental_exposure if profile else "—",
    } if profile else None

    return jsonify({
        "patient": {
            "id": patient.id,
            "name": patient.name,
            "email": patient.email,
        },
        "profile": profile_dict,
        "score_history": [{"date": h.date, "score": h.score, "summary": h.summary} for h in history],
        "clinical_notes": doctor_notes
    }), 200


@main.route("/api/doctor/patient/<int:patient_id>/note", methods=["POST"])
@jwt_required()
def add_patient_clinical_note(patient_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or (current_user.role or "").lower() not in ["dermatologist", "consultant", "admin"]:
        return jsonify({"error": "Unauthorized."}), 403

    data = request.get_json() or {}
    notes = data.get("notes")
    adjustment = data.get("routine_adjustment")

    if not notes:
        return jsonify({"error": "Clinical notes are required"}), 400

    rec = ClinicalRecommendation(
        patient_id=patient_id,
        doctor_id=current_user_id,
        notes=notes,
        routine_adjustment=adjustment
    )
    db.session.add(rec)
    db.session.commit()

    return jsonify({"message": "Clinical recommendation saved successfully"}), 201


# ============================================================
# Admin Portal Endpoints (Milestone 4 - System & User Management)
# ============================================================

@main.route("/api/admin/stats", methods=["GET"])
@jwt_required()
def get_admin_stats():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or (current_user.role or "").lower() != "admin":
        return jsonify({"error": "Admin access required."}), 403

    total_users = User.query.count()
    total_derm = User.query.filter(User.role.ilike("dermatologist")).count()
    total_consultants = User.query.filter(User.role.ilike("consultant")).count()
    total_profiles = SkinProfile.query.count()
    total_scores = ScoreHistory.query.count()
    all_scores = [s.score for s in ScoreHistory.query.all()]
    avg_score = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0
    total_products = Product.query.count()

    profiles = SkinProfile.query.all()
    from collections import Counter
    concern_counter = Counter()
    for p in profiles:
        if p.skin_concerns:
            for c in p.skin_concerns.split(","):
                cleaned = c.strip().title()
                if cleaned:
                    concern_counter[cleaned] += 1

    return jsonify({
        "stats": {
            "total_users": total_users,
            "total_dermatologists": total_derm,
            "total_consultants": total_consultants,
            "profiles_created": total_profiles,
            "total_assessments": total_scores,
            "average_skin_score": avg_score,
            "catalog_products": total_products,
        },
        "top_concerns": dict(concern_counter.most_common(6))
    }), 200


@main.route("/api/admin/users", methods=["GET"])
@jwt_required()
def get_admin_users():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or (current_user.role or "").lower() != "admin":
        return jsonify({"error": "Admin access required."}), 403

    users = User.query.order_by(User.id.asc()).all()
    user_list = []
    for u in users:
        has_prof = bool(SkinProfile.query.filter_by(user_id=u.id).first())
        user_list.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "created_at": u.created_at.strftime("%Y-%m-%d") if u.created_at else "",
            "has_profile": has_prof,
        })

    return jsonify({"users": user_list}), 200


@main.route("/api/admin/user/<int:target_user_id>/role", methods=["PUT", "POST"])
@jwt_required()
def update_user_role(target_user_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or (current_user.role or "").lower() != "admin":
        return jsonify({"error": "Admin access required."}), 403

    data = request.get_json() or {}
    new_role = (data.get("role") or "").strip().lower()
    if new_role not in ["user", "consultant", "dermatologist", "admin"]:
        return jsonify({"error": "Invalid role."}), 400

    target = User.query.get(target_user_id)
    if not target:
        return jsonify({"error": "User not found."}), 404

    target.role = new_role
    db.session.commit()

    return jsonify({"message": f"User role updated to {new_role} successfully"}), 200


@main.route("/api/admin/user/<int:target_user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(target_user_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or (current_user.role or "").lower() != "admin":
        return jsonify({"error": "Admin access required."}), 403

    if current_user_id == target_user_id:
        return jsonify({"error": "Cannot delete your own admin account."}), 400

    target = User.query.get(target_user_id)
    if not target:
        return jsonify({"error": "User not found."}), 404

    SkinProfile.query.filter_by(user_id=target.id).delete()
    DailyChecklist.query.filter_by(user_id=target.id).delete()
    ScoreHistory.query.filter_by(user_id=target.id).delete()
    ClinicalRecommendation.query.filter((ClinicalRecommendation.patient_id == target.id) | (ClinicalRecommendation.doctor_id == target.id)).delete()
    db.session.delete(target)
    db.session.commit()

    return jsonify({"message": "User deleted successfully"}), 200


# ============================================================
# Notification & Reminder System (Milestone 3 / Module 10)
# ============================================================

@main.route("/api/notifications", methods=["GET"])
@jwt_required()
def get_user_notifications():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"notifications": [], "unread_count": 0}), 200

    today = date.today().isoformat()
    notifications = []

    # 1. Routine Reminders (Morning & Evening)
    checklist_items = DailyChecklist.query.filter_by(user_id=user_id, date=today).all()
    morning_pending = [i for i in checklist_items if i.period == "morning" and not i.is_completed]
    evening_pending = [i for i in checklist_items if i.period == "evening" and not i.is_completed]

    if morning_pending:
        notifications.append({
            "id": "routine-morning",
            "type": "routine",
            "title": "☀️ Morning Routine Reminder",
            "message": f"You have {len(morning_pending)} morning skincare step(s) pending for today.",
            "link": "/checklist",
            "priority": "high",
            "time": "Today",
        })

    if evening_pending:
        notifications.append({
            "id": "routine-evening",
            "type": "routine",
            "title": "🌙 Evening Routine Reminder",
            "message": f"Complete your {len(evening_pending)} evening step(s) before bed to aid skin recovery.",
            "link": "/checklist",
            "priority": "medium",
            "time": "Today",
        })

    # 2. Hydration Reminder
    profile = SkinProfile.query.filter_by(user_id=user_id).first()
    if profile and (profile.water_intake_level or "").lower() == "low":
        notifications.append({
            "id": "hydration-alert",
            "type": "hydration",
            "title": "💧 Hydration Reminder",
            "message": "Your profile indicates low water intake. Drink 2-3 liters today to maintain skin barrier health.",
            "link": "/profile",
            "priority": "medium",
            "time": "Daily Prompt",
        })

    # 3. Product Replenishment Alert
    notifications.append({
        "id": "replenish-spf",
        "type": "replenishment",
        "title": "🛍️ Product Replenishment Alert",
        "message": "Check your daily Sunscreen and Cleanser levels to ensure consistent active coverage.",
        "link": "/products",
        "priority": "low",
        "time": "Regimen Tracker",
    })

    # 4. Sleep Reminder (Nocturnal Cellular Repair)
    sleep_val = (profile.sleep_hours if profile else "7-8") or "7-8"
    if "less than" in sleep_val.lower() or "5" in sleep_val:
        notifications.append({
            "id": "sleep-alert",
            "type": "sleep",
            "title": "😴 Sleep & Recovery Reminder",
            "message": "Cellular skin renewal peaks between 11 PM and 4 AM. Aim for 7-8 hours of sleep tonight to boost barrier repair.",
            "link": "/profile",
            "priority": "medium",
            "time": "Evening Prompt",
        })
    else:
        notifications.append({
            "id": "sleep-reminder",
            "type": "sleep",
            "title": "😴 Night Recovery Reminder",
            "message": "Restful sleep aids nocturnal cellular turnover and collagen regeneration.",
            "link": "/checklist",
            "priority": "low",
            "time": "Tonight",
        })

    # 5. Progress Alert
    latest_score_row = ScoreHistory.query.filter_by(user_id=user_id).order_by(ScoreHistory.date.desc()).first()
    first_score_row = ScoreHistory.query.filter_by(user_id=user_id).order_by(ScoreHistory.date.asc()).first()
    if latest_score_row and first_score_row and latest_score_row.id != first_score_row.id:
        delta = latest_score_row.score - first_score_row.score
        trend_text = f"+{delta} pts gain" if delta > 0 else f"{delta} pts delta" if delta < 0 else "steady"
        notifications.append({
            "id": "progress-alert",
            "type": "progress",
            "title": "📈 Skin Progress Update",
            "message": f"Your current score is {latest_score_row.score}/100 ({trend_text} from baseline). View your full improvement analytics.",
            "link": "/progress",
            "priority": "medium",
            "time": "Progress Engine",
        })
    else:
        notifications.append({
            "id": "progress-alert",
            "type": "progress",
            "title": "📈 Progress Tracking Active",
            "message": "Track your daily routine consistency to unlock longitudinal skin progress analytics.",
            "link": "/progress",
            "priority": "low",
            "time": "Daily Milestone",
        })

    # 6. Platform Notification
    notifications.append({
        "id": "platform-system",
        "type": "platform",
        "title": "🛡️ Platform System Notice",
        "message": "Skin Intelligence AI models and seasonal weather integrations are active and running.",
        "link": "/dashboard",
        "priority": "low",
        "time": "System",
    })

    # 7. Doctor Clinical Recommendation Alerts
    recent_doc_notes = ClinicalRecommendation.query.filter_by(patient_id=user_id).order_by(ClinicalRecommendation.created_at.desc()).limit(2).all()
    for doc_note in recent_doc_notes:
        notifications.append({
            "id": f"doctor-note-{doc_note.id}",
            "type": "clinical",
            "title": "🩺 New Clinical Recommendation",
            "message": doc_note.notes[:90] + ("..." if len(doc_note.notes) > 90 else ""),
            "link": "/assessment",
            "priority": "high",
            "time": doc_note.created_at.strftime("%b %d") if doc_note.created_at else "Recent",
        })

    return jsonify({
        "notifications": notifications,
        "unread_count": len(notifications),
    }), 200
