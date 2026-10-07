import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from models import SkinProfile, SleepLog, HydrationLog, LifestyleLog, RoutineChecklistLog


def calculate_skin_assessment(db: Session, user_id: int) -> Dict[str, Any]:
    """
    Evaluates skin health score using exact weighted formula:
    - Skin Condition Assessment (35%)
    - Lifestyle Habits (20%)
    - Sleep Quality (15%)
    - Routine Consistency (20%)
    - Hydration Level (10%)
    """
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == user_id).first()
    if not profile:
        # Default profile if not created yet
        concerns = []
        skin_type = "Normal"
        sensitivities = ""
        water_intake_target = 2.0
        sleep_qual = "Average"
        sun_exp = ""
        poll_exp = ""
        uv_exp = ""
    else:
        try:
            concerns = json.loads(profile.skin_concerns or "[]")
        except Exception:
            concerns = []
        skin_type = profile.skin_type
        sensitivities = profile.sensitivities or ""
        water_intake_target = profile.water_intake or 2.0
        sleep_qual = profile.sleep_quality or "Average"
        sun_exp = profile.sun_exposure or ""
        poll_exp = profile.pollution_exposure or ""
        uv_exp = profile.uv_index_exposure or ""

    # 1. Condition Score (35%)
    base_condition = 100.0
    base_condition -= len(concerns) * 7.5
    if skin_type.lower() == "sensitive" or "sensitive" in sensitivities.lower():
        base_condition -= 8.0
    if "high" in sun_exp.lower() or "extreme" in uv_exp.lower():
        base_condition -= 6.0
    if "high" in poll_exp.lower():
        base_condition -= 5.0
    condition_score = max(20.0, min(100.0, base_condition))

    # 2. Lifestyle Habits Score (20%)
    lifestyle_entry = (
        db.query(LifestyleLog)
        .filter(LifestyleLog.user_id == user_id)
        .order_by(LifestyleLog.log_date.desc())
        .first()
    )
    if lifestyle_entry:
        diet_score = (lifestyle_entry.diet_quality or 3) * 20.0  # 1-5 -> 20-100
        stress = lifestyle_entry.stress_level or 3
        stress_score = (6 - stress) * 20.0                      # 1->100, 5->20
        exercise_bonus = min(20.0, (lifestyle_entry.exercise_minutes or 0) / 30.0 * 10.0)
        smoke_pen = 20.0 if lifestyle_entry.smoking else 0.0
        alc_pen = 10.0 if lifestyle_entry.alcohol else 0.0
        raw_lifestyle = (diet_score + stress_score) / 2.0 + exercise_bonus - smoke_pen - alc_pen
        lifestyle_score = max(10.0, min(100.0, raw_lifestyle))
    else:
        lifestyle_score = 70.0  # Default neutral score

    # 3. Sleep Quality Score (15%)
    sleep_entry = (
        db.query(SleepLog)
        .filter(SleepLog.user_id == user_id)
        .order_by(SleepLog.log_date.desc())
        .first()
    )
    quality_map = {"Poor": 40.0, "Average": 65.0, "Good": 85.0, "Excellent": 100.0}
    qual_score = quality_map.get(sleep_qual, 70.0)
    if sleep_entry:
        hours = sleep_entry.sleep_hours
        if 7.0 <= hours <= 9.0:
            hrs_score = 100.0
        elif 6.0 <= hours < 7.0:
            hrs_score = 80.0
        elif 5.0 <= hours < 6.0:
            hrs_score = 60.0
        else:
            hrs_score = 45.0
        if sleep_entry.quality:
            qual_score = quality_map.get(sleep_entry.quality, qual_score)
        sleep_score = (hrs_score + qual_score) / 2.0
    else:
        sleep_score = qual_score

    # 4. Routine Consistency Score (20%)
    checklist_entries = (
        db.query(RoutineChecklistLog)
        .filter(RoutineChecklistLog.user_id == user_id)
        .order_by(RoutineChecklistLog.log_date.desc())
        .limit(7)
        .all()
    )
    if checklist_entries:
        avg_rate = sum(c.completion_rate for c in checklist_entries) / len(checklist_entries)
        consistency_score = max(30.0, min(100.0, avg_rate))
    else:
        consistency_score = 75.0  # Default starting consistency

    # 5. Hydration Level Score (10%)
    hydration_entry = (
        db.query(HydrationLog)
        .filter(HydrationLog.user_id == user_id)
        .order_by(HydrationLog.log_date.desc())
        .first()
    )
    intake = hydration_entry.water_litres if hydration_entry else water_intake_target
    hydration_score = min(100.0, (intake / 3.0) * 100.0)

    # Weighted Overall Score Calculation
    overall_score = round(
        (condition_score * 0.35) +
        (lifestyle_score * 0.20) +
        (sleep_score * 0.15) +
        (consistency_score * 0.20) +
        (hydration_score * 0.10),
        1
    )

    # Prioritized Concerns Analysis
    concern_priorities = []
    priority_order = ["Acne", "Sensitive Skin", "Wrinkles", "Hyperpigmentation", "Dark Spots", "Redness", "Dry Skin", "Oily Skin", "Uneven Skin Tone", "Fine Lines"]
    for c in priority_order:
        if c in concerns:
            severity = "High" if c in concerns[:2] else "Medium"
            concern_priorities.append({
                "concern": c,
                "priority": severity,
                "description": f"Focusing active botanical and clinical care to treat {c.lower()}."
            })
    for c in concerns:
        if c not in priority_order:
            concern_priorities.append({
                "concern": c,
                "priority": "Low",
                "description": f"Secondary focus for {c.lower()}."
            })

    # Risk Factor Analysis
    risk_factors = []
    if "high" in sun_exp.lower() or "extreme" in uv_exp.lower():
        risk_factors.append({
            "title": "UV Photo-aging & Pigmentation Risk",
            "level": "High",
            "recommendation": "Daily broad-spectrum SPF 50+ is mandatory with reapplication every 2 hours."
        })
    if hydration_score < 70.0:
        risk_factors.append({
            "title": "Skin Barrier Dehydration Risk",
            "level": "Medium",
            "recommendation": "Increase daily fluid intake to at least 2.5L-3.0L and use hyaluronic acid serums."
        })
    if lifestyle_entry and (lifestyle_entry.stress_level or 0) >= 4:
        risk_factors.append({
            "title": "Cortisol & Stress Flare-Up Risk",
            "level": "High",
            "recommendation": "Incorporate soothing antioxidants (Niacinamide, Centella Asiatica) and sleep hygiene."
        })
    if skin_type.lower() in ["dry", "sensitive"]:
        risk_factors.append({
            "title": "Transepidermal Water Loss (TEWL)",
            "level": "Medium",
            "recommendation": "Use ceramide-rich barrier repair creams morning and night."
        })

    if not risk_factors:
        risk_factors.append({
            "title": "Optimal Skin Maintenance",
            "level": "Low",
            "recommendation": "Maintain your balanced routine, hydration, and daily sun protection."
        })

    summary = (
        f"Your overall Skin Health Score is {overall_score}/100. "
        f"Condition: {round(condition_score, 1)}, Lifestyle: {round(lifestyle_score, 1)}, "
        f"Sleep: {round(sleep_score, 1)}, Consistency: {round(consistency_score, 1)}, Hydration: {round(hydration_score, 1)}."
    )

    return {
        "overall_score": overall_score,
        "condition_score": round(condition_score, 1),
        "lifestyle_score": round(lifestyle_score, 1),
        "sleep_score": round(sleep_score, 1),
        "consistency_score": round(consistency_score, 1),
        "hydration_score": round(hydration_score, 1),
        "concern_priorities": concern_priorities,
        "risk_factors": risk_factors,
        "recommendation_summary": summary,
    }
