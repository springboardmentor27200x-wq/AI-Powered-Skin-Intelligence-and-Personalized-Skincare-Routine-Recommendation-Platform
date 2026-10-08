from sqlalchemy.orm import Session

from ..models import (
    User,
    SkinAssessment,
    Lifestyle,
    Sleep,
    DailyCheckin,
    RoutineAdherence,
)


def generate_health_insights(
    db: Session,
    user_id: int,
):
    """
    Generate personalized health insights for a user
    using the latest available skin, lifestyle, sleep,
    hydration, routine and check-in data.
    """

    # =========================================================
    # GET USER
    # =========================================================

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        return []


    # =========================================================
    # GET LATEST SKIN ASSESSMENT
    # =========================================================

    assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == user_id)
        .order_by(SkinAssessment.id.desc())
        .first()
    )


    # =========================================================
    # GET LATEST LIFESTYLE
    # =========================================================

    lifestyle = (
        db.query(Lifestyle)
        .filter(Lifestyle.user_id == user_id)
        .order_by(Lifestyle.id.desc())
        .first()
    )


    # =========================================================
    # GET LATEST SLEEP
    # =========================================================

    sleep = (
        db.query(Sleep)
        .filter(Sleep.user_id == user_id)
        .order_by(Sleep.date.desc())
        .first()
    )


    # =========================================================
    # GET LATEST CHECK-IN
    # =========================================================

    checkin = (
        db.query(DailyCheckin)
        .filter(DailyCheckin.user_id == user_id)
        .order_by(DailyCheckin.date.desc())
        .first()
    )


    # =========================================================
    # GET ROUTINE ADHERENCE
    # =========================================================

    routine_records = (
        db.query(RoutineAdherence)
        .filter(RoutineAdherence.user_id == user_id)
        .all()
    )


    # =========================================================
    # CHECK WHETHER DATA EXISTS
    # =========================================================

    if not assessment and not lifestyle and not sleep and not checkin:
        return []


    insights = []


    # =========================================================
    # 1. SKIN HEALTH INSIGHT
    # =========================================================

    skin_score = None

    if assessment and assessment.skin_score is not None:
        skin_score = assessment.skin_score

    elif checkin and checkin.skin_health_score is not None:
        skin_score = checkin.skin_health_score


    if skin_score is not None:

        if skin_score >= 80:

            insights.append({
                "category": "Skin Health",
                "status": "Excellent",
                "priority": "low",
                "score": skin_score,
                "message": (
                    "Your skin health score is excellent. "
                    "Continue following your skincare routine "
                    "and maintaining healthy lifestyle habits."
                ),
            })

        elif skin_score >= 60:

            insights.append({
                "category": "Skin Health",
                "status": "Good",
                "priority": "medium",
                "score": skin_score,
                "message": (
                    "Your skin health is in a good range. "
                    "Continue your skincare routine and "
                    "focus on consistency."
                ),
            })

        else:

            insights.append({
                "category": "Skin Health",
                "status": "Needs Improvement",
                "priority": "high",
                "score": skin_score,
                "message": (
                    "Your skin health score indicates that "
                    "some areas need improvement. Pay attention "
                    "to skincare consistency, hydration, sleep "
                    "and lifestyle habits."
                ),
            })


    # =========================================================
    # 2. HYDRATION INSIGHT
    # =========================================================

    water_intake = None

    if checkin and checkin.water_intake_liters is not None:
        water_intake = checkin.water_intake_liters

    elif lifestyle and lifestyle.water_intake is not None:
        water_intake = lifestyle.water_intake


    if water_intake is not None:

        if water_intake < 1.5:

            insights.append({
                "category": "Hydration",
                "status": "Low",
                "priority": "high",
                "value": water_intake,
                "message": (
                    f"Your recent water intake is "
                    f"{water_intake} L. Try to increase your "
                    "daily hydration gradually."
                ),
            })

        elif water_intake < 2.0:

            insights.append({
                "category": "Hydration",
                "status": "Moderate",
                "priority": "medium",
                "value": water_intake,
                "message": (
                    f"Your recent water intake is "
                    f"{water_intake} L. Increasing hydration "
                    "may support overall skin health."
                ),
            })

        else:

            insights.append({
                "category": "Hydration",
                "status": "Good",
                "priority": "low",
                "value": water_intake,
                "message": (
                    "Your recent hydration level is good. "
                    "Continue maintaining consistent water intake."
                ),
            })


    # =========================================================
    # 3. SLEEP INSIGHT
    # =========================================================

    sleep_hours = None

    if checkin and checkin.sleep_hours is not None:
        sleep_hours = checkin.sleep_hours

    elif sleep and sleep.sleep_hours is not None:
        sleep_hours = sleep.sleep_hours


    if sleep_hours is not None:

        if sleep_hours < 6:

            insights.append({
                "category": "Sleep",
                "status": "Poor",
                "priority": "high",
                "value": sleep_hours,
                "message": (
                    f"You recently recorded {sleep_hours} hours "
                    "of sleep. Improving sleep duration may "
                    "support skin recovery and overall wellbeing."
                ),
            })

        elif sleep_hours < 7:

            insights.append({
                "category": "Sleep",
                "status": "Below Recommended",
                "priority": "medium",
                "value": sleep_hours,
                "message": (
                    f"You recently recorded {sleep_hours} hours "
                    "of sleep. Try to maintain a more consistent "
                    "sleep schedule."
                ),
            })

        elif sleep_hours <= 9:

            insights.append({
                "category": "Sleep",
                "status": "Good",
                "priority": "low",
                "value": sleep_hours,
                "message": (
                    "Your recent sleep duration is in a healthy "
                    "range. Continue maintaining a consistent "
                    "sleep schedule."
                ),
            })

        else:

            insights.append({
                "category": "Sleep",
                "status": "High",
                "priority": "medium",
                "value": sleep_hours,
                "message": (
                    "Your recent sleep duration is relatively high. "
                    "Focus on maintaining a consistent sleep routine "
                    "and monitoring how you feel."
                ),
            })


    # =========================================================
    # 4. STRESS INSIGHT
    # =========================================================

    if lifestyle and lifestyle.stress_level is not None:

        stress = lifestyle.stress_level

        if stress >= 8:

            insights.append({
                "category": "Stress",
                "status": "High",
                "priority": "high",
                "value": stress,
                "message": (
                    "Your reported stress level is high. "
                    "Consider relaxation activities, regular "
                    "exercise and adequate sleep."
                ),
            })

        elif stress >= 5:

            insights.append({
                "category": "Stress",
                "status": "Moderate",
                "priority": "medium",
                "value": stress,
                "message": (
                    "Your reported stress level is moderate. "
                    "Try to include regular relaxation and "
                    "stress-management activities."
                ),
            })

        else:

            insights.append({
                "category": "Stress",
                "status": "Low",
                "priority": "low",
                "value": stress,
                "message": (
                    "Your reported stress level is low. "
                    "Continue maintaining healthy lifestyle habits."
                ),
            })


    # =========================================================
    # 5. EXERCISE INSIGHT
    # =========================================================

    if lifestyle and lifestyle.exercise_minutes is not None:

        exercise = lifestyle.exercise_minutes

        if exercise < 20:

            insights.append({
                "category": "Physical Activity",
                "status": "Low",
                "priority": "medium",
                "value": exercise,
                "message": (
                    "Your recent physical activity is low. "
                    "Regular movement can support overall health "
                    "and healthy lifestyle habits."
                ),
            })

        elif exercise < 30:

            insights.append({
                "category": "Physical Activity",
                "status": "Moderate",
                "priority": "low",
                "value": exercise,
                "message": (
                    "You are getting some physical activity. "
                    "Try to gradually increase consistency."
                ),
            })

        else:

            insights.append({
                "category": "Physical Activity",
                "status": "Good",
                "priority": "low",
                "value": exercise,
                "message": (
                    "Your physical activity level is good. "
                    "Continue maintaining regular activity."
                ),
            })


    # =========================================================
    # 6. ROUTINE ADHERENCE INSIGHT
    # =========================================================

    if routine_records:

        total_records = len(routine_records)

        completed_records = sum(
            1
            for record in routine_records
            if record.completed
        )

        adherence_percentage = (
            completed_records / total_records
        ) * 100


        if adherence_percentage < 50:

            insights.append({
                "category": "Skincare Routine",
                "status": "Low Consistency",
                "priority": "high",
                "value": round(adherence_percentage, 2),
                "message": (
                    f"Your skincare routine adherence is "
                    f"{round(adherence_percentage, 2)}%. "
                    "Try to follow your routine more consistently."
                ),
            })

        elif adherence_percentage < 80:

            insights.append({
                "category": "Skincare Routine",
                "status": "Moderate Consistency",
                "priority": "medium",
                "value": round(adherence_percentage, 2),
                "message": (
                    f"Your skincare routine adherence is "
                    f"{round(adherence_percentage, 2)}%. "
                    "Improving consistency may help you achieve "
                    "better long-term results."
                ),
            })

        else:

            insights.append({
                "category": "Skincare Routine",
                "status": "Excellent Consistency",
                "priority": "low",
                "value": round(adherence_percentage, 2),
                "message": (
                    f"Your skincare routine adherence is "
                    f"{round(adherence_percentage, 2)}%. "
                    "Excellent consistency—keep it up."
                ),
            })


    # =========================================================
    # 7. OVERALL RECOMMENDATION
    # =========================================================

    high_priority_count = sum(
        1
        for insight in insights
        if insight["priority"] == "high"
    )


    if high_priority_count >= 3:

        overall_message = (
            "Several areas of your health routine need attention. "
            "Focus first on hydration, sleep, stress management "
            "and skincare consistency."
        )

        overall_status = "Needs Attention"

    elif high_priority_count >= 1:

        overall_message = (
            "Your overall health routine is progressing, but "
            "some areas could be improved. Follow the "
            "high-priority recommendations consistently."
        )

        overall_status = "Moderate"

    else:

        overall_message = (
            "Your current health habits are generally on track. "
            "Continue maintaining consistent skincare and "
            "healthy lifestyle habits."
        )

        overall_status = "Good"


    return {
        "user_id": user_id,
        "overall_status": overall_status,
        "overall_message": overall_message,
        "total_insights": len(insights),
        "high_priority_count": high_priority_count,
        "insights": insights,
    }