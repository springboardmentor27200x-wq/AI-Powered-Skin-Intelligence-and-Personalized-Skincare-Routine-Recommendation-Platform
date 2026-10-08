from datetime import date
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from ..database import get_db
from ..dependencies import get_current_user
from ..models import (
    User,
    SkinProfile,
    Lifestyle,
    Sleep,
    SkinAssessment,
    SkincareRoutine,
    RoutineAdherence,
    Product,
    DailyCheckin,
    Notification,
)


router = APIRouter(
    prefix="/api/reports",
    tags=["Reports & Export"],
)


# =========================================================
# ACCESS CONTROL
# =========================================================

def check_user_access(current_user: User, user_id: int):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to access this user's reports.",
        )


# =========================================================
# HELPER
# =========================================================

def get_user_or_404(
    user_id: int,
    db: Session,
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    return user


# =========================================================
# 1. SKIN ASSESSMENT REPORT
# =========================================================

@router.get("/assessment/{user_id}")
def assessment_report(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_user_access(current_user, user_id)

    user = get_user_or_404(user_id, db)

    assessments = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == user_id)
        .order_by(SkinAssessment.id.desc())
        .all()
    )

    if not assessments:
        raise HTTPException(
            status_code=404,
            detail="No skin assessments found for this user.",
        )

    latest = assessments[0]

    return {
        "report_type": "Skin Assessment Report",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
        },
        "assessment": {
            "assessment_id": latest.id,
            "created_at": latest.created_at,
            "skin_score": latest.skin_score,
            "health_status": latest.health_status,
            "skin_condition_score": latest.skin_condition_score,
            "lifestyle_score": latest.lifestyle_score,
            "sleep_score": latest.sleep_score,
            "routine_consistency_score": latest.routine_consistency_score,
            "hydration_score": latest.hydration_score,
            "concerns": latest.concerns,
            "primary_concern": latest.primary_concern,
            "secondary_concerns": latest.secondary_concerns,
            "risk_factors": latest.risk_factors,
            "assessment_summary": latest.assessment_summary,
        },
        "assessment_history_count": len(assessments),
    }


# =========================================================
# 2. ROUTINE REPORT
# =========================================================

@router.get("/routine/{user_id}")
def routine_report(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_user_access(current_user, user_id)

    user = get_user_or_404(user_id, db)

    routines = (
        db.query(SkincareRoutine)
        .filter(SkincareRoutine.user_id == user_id)
        .order_by(SkincareRoutine.id.desc())
        .all()
    )

    if not routines:
        raise HTTPException(
            status_code=404,
            detail="No skincare routines found for this user.",
        )

    latest = routines[0]

    adherence_records = (
        db.query(RoutineAdherence)
        .filter(RoutineAdherence.user_id == user_id)
        .all()
    )

    total_adherence = len(adherence_records)

    completed_adherence = sum(
        1
        for record in adherence_records
        if record.completed
    )

    adherence_percentage = (
        round(
            (completed_adherence / total_adherence) * 100,
            2,
        )
        if total_adherence > 0
        else 0
    )

    return {
        "report_type": "Skincare Routine Report",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
        },
        "routine": {
            "routine_id": latest.id,
            "skin_type": latest.skin_type,
            "primary_concern": latest.primary_concern,
            "season": latest.season,
            "morning_routine": latest.morning_routine,
            "evening_routine": latest.evening_routine,
            "weekly_treatment": latest.weekly_treatment,
            "seasonal_recommendations": latest.seasonal_recommendations,
            "adaptive_updates": latest.adaptive_updates,
            "created_at": latest.created_at,
        },
        "adherence": {
            "total_records": total_adherence,
            "completed_records": completed_adherence,
            "adherence_percentage": adherence_percentage,
        },
    }


# =========================================================
# 3. PRODUCT RECOMMENDATION REPORT
# =========================================================

@router.get("/products/{user_id}")
def product_report(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_user_access(current_user, user_id)

    user = get_user_or_404(user_id, db)

    profile = (
        db.query(SkinProfile)
        .filter(SkinProfile.user_id == user_id)
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Skin profile not found for this user.",
        )

    products = db.query(Product).all()

    skin_type = (profile.skin_type or "").lower()
    concerns = (profile.concerns or "").lower()

    matched_products = []

    for product in products:

        product_skin_types = (
            product.skin_types or ""
        ).lower()

        product_concerns = (
            product.concerns or ""
        ).lower()

        skin_match = (
            skin_type
            and skin_type in product_skin_types
        )

        concern_match = False

        if concerns:
            concern_words = [
                item.strip()
                for item in concerns.replace(
                    ",",
                    " ",
                ).split()
                if item.strip()
            ]

            concern_match = any(
                word in product_concerns
                for word in concern_words
            )

        if skin_match or concern_match:
            matched_products.append(
                {
                    "id": product.id,
                    "name": product.name,
                    "brand": product.brand,
                    "category": product.category,
                    "price_inr": product.price_inr,
                    "rating": product.rating,
                    "ingredients": product.ingredients,
                    "skin_types": product.skin_types,
                    "concerns": product.concerns,
                    "description": product.description,
                    "allergens": product.allergens,
                    "source": product.source,
                }
            )

    matched_products = matched_products[:20]

    return {
        "report_type": "Product Recommendation Report",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
        },
        "skin_profile": {
            "skin_type": profile.skin_type,
            "concerns": profile.concerns,
            "sensitivity": profile.sensitivity,
            "allergies": profile.allergies,
            "budget_inr": profile.budget_inr,
        },
        "recommended_products": matched_products,
        "recommendation_count": len(matched_products),
    }


# =========================================================
# 4. PROGRESS REPORT
# =========================================================

@router.get("/progress/{user_id}")
def progress_report(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_user_access(current_user, user_id)

    user = get_user_or_404(user_id, db)

    checkins = (
        db.query(DailyCheckin)
        .filter(DailyCheckin.user_id == user_id)
        .order_by(DailyCheckin.date.asc())
        .all()
    )

    if not checkins:
        raise HTTPException(
            status_code=404,
            detail="No daily check-in records found.",
        )

    first = checkins[0]
    latest = checkins[-1]

    average_health = round(
        sum(
            item.skin_health_score
            for item in checkins
        )
        / len(checkins),
        2,
    )

    average_water = round(
        sum(
            item.water_intake_liters
            for item in checkins
        )
        / len(checkins),
        2,
    )

    average_sleep = round(
        sum(
            item.sleep_hours
            for item in checkins
        )
        / len(checkins),
        2,
    )

    completed_routines = sum(
        1
        for item in checkins
        if item.routine_completed
    )

    routine_completion_percentage = round(
        (
            completed_routines
            / len(checkins)
        )
        * 100,
        2,
    )

    score_change = round(
        latest.skin_health_score
        - first.skin_health_score,
        2,
    )

    return {
        "report_type": "Progress Report",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
        },
        "period": {
            "start_date": first.date,
            "end_date": latest.date,
            "total_checkins": len(checkins),
        },
        "summary": {
            "initial_skin_health_score": first.skin_health_score,
            "latest_skin_health_score": latest.skin_health_score,
            "score_change": score_change,
            "average_skin_health_score": average_health,
            "average_water_intake_liters": average_water,
            "average_sleep_hours": average_sleep,
            "routine_completion_percentage": routine_completion_percentage,
        },
        "daily_records": [
            {
                "date": item.date,
                "routine_completed": item.routine_completed,
                "water_intake_liters": item.water_intake_liters,
                "sleep_hours": item.sleep_hours,
                "skin_condition_rating": item.skin_condition_rating,
                "lifestyle_score": item.lifestyle_score,
                "hydration_score": item.hydration_score,
                "skin_health_score": item.skin_health_score,
            }
            for item in checkins
        ],
    }


# =========================================================
# 5. SKIN HEALTH REPORT
# =========================================================

@router.get("/health/{user_id}")
def health_report(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_user_access(current_user, user_id)

    user = get_user_or_404(user_id, db)

    profile = (
        db.query(SkinProfile)
        .filter(SkinProfile.user_id == user_id)
        .first()
    )

    assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == user_id)
        .order_by(SkinAssessment.id.desc())
        .first()
    )

    lifestyle = (
        db.query(Lifestyle)
        .filter(Lifestyle.user_id == user_id)
        .order_by(Lifestyle.id.desc())
        .first()
    )

    sleep = (
        db.query(Sleep)
        .filter(Sleep.user_id == user_id)
        .order_by(Sleep.date.desc())
        .first()
    )

    checkins = (
        db.query(DailyCheckin)
        .filter(DailyCheckin.user_id == user_id)
        .order_by(DailyCheckin.date.desc())
        .all()
    )

    routine_adherence = (
        db.query(RoutineAdherence)
        .filter(
            RoutineAdherence.user_id == user_id
        )
        .all()
    )

    total_adherence = len(routine_adherence)

    completed_adherence = sum(
        1
        for record in routine_adherence
        if record.completed
    )

    adherence_percentage = (
        round(
            (
                completed_adherence
                / total_adherence
            )
            * 100,
            2,
        )
        if total_adherence
        else 0
    )

    latest_checkin = (
        checkins[0]
        if checkins
        else None
    )

    return {
        "report_type": "Skin Health Report",
        "generated_date": str(date.today()),
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
        },
        "skin_profile": (
            {
                "skin_type": profile.skin_type,
                "concerns": profile.concerns,
                "sensitivity": profile.sensitivity,
                "allergies": profile.allergies,
                "budget_inr": profile.budget_inr,
            }
            if profile
            else None
        ),
        "assessment": (
            {
                "skin_score": assessment.skin_score,
                "health_status": assessment.health_status,
                "skin_condition_score": assessment.skin_condition_score,
                "lifestyle_score": assessment.lifestyle_score,
                "sleep_score": assessment.sleep_score,
                "routine_consistency_score": assessment.routine_consistency_score,
                "hydration_score": assessment.hydration_score,
                "primary_concern": assessment.primary_concern,
                "risk_factors": assessment.risk_factors,
                "assessment_summary": assessment.assessment_summary,
            }
            if assessment
            else None
        ),
        "lifestyle": (
            {
                "water_intake": lifestyle.water_intake,
                "exercise_minutes": lifestyle.exercise_minutes,
                "stress_level": lifestyle.stress_level,
            }
            if lifestyle
            else None
        ),
        "sleep": (
            {
                "sleep_hours": sleep.sleep_hours,
                "sleep_quality": sleep.sleep_quality,
                "date": sleep.date,
            }
            if sleep
            else None
        ),
        "routine_adherence": {
            "total_records": total_adherence,
            "completed_records": completed_adherence,
            "completion_percentage": adherence_percentage,
        },
        "latest_checkin": (
            {
                "date": latest_checkin.date,
                "skin_health_score": latest_checkin.skin_health_score,
                "skin_condition_rating": latest_checkin.skin_condition_rating,
                "water_intake_liters": latest_checkin.water_intake_liters,
                "sleep_hours": latest_checkin.sleep_hours,
                "routine_completed": latest_checkin.routine_completed,
            }
            if latest_checkin
            else None
        ),
    }


# =========================================================
# PDF HELPER
# =========================================================

def create_pdf(title: str, sections: list):
    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()

    story = []

    story.append(
        Paragraph(
            title,
            styles["Title"],
        )
    )

    story.append(Spacer(1, 20))

    for section_title, rows in sections:

        story.append(
            Paragraph(
                section_title,
                styles["Heading2"],
            )
        )

        story.append(Spacer(1, 8))

        table_data = [
            ["Field", "Value"]
        ]

        for field, value in rows:
            if value is None:
                value = "Not available"

            table_data.append(
                [
                    str(field),
                    str(value),
                ]
            )

        table = Table(
            table_data,
            colWidths=[
                2.2 * inch,
                4.5 * inch,
            ],
        )

        table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.HexColor("#2E7D6F"),
                    ),
                    (
                        "TEXTCOLOR",
                        (0, 0),
                        (-1, 0),
                        colors.white,
                    ),
                    (
                        "FONTNAME",
                        (0, 0),
                        (-1, 0),
                        "Helvetica-Bold",
                    ),
                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.grey,
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "TOP",
                    ),
                    (
                        "ALIGN",
                        (0, 0),
                        (-1, -1),
                        "LEFT",
                    ),
                    (
                        "FONTNAME",
                        (0, 1),
                        (-1, -1),
                        "Helvetica",
                    ),
                ]
            )
        )

        story.append(table)
        story.append(Spacer(1, 20))

    document.build(story)

    buffer.seek(0)

    return buffer


# =========================================================
# 6. HEALTH REPORT PDF
# =========================================================

@router.get("/health/{user_id}/pdf")
def health_report_pdf(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_user_access(current_user, user_id)

    data = health_report(
        user_id=user_id,
        db=db,
        current_user=current_user,
    )

    sections = []

    sections.append(
        (
            "User Information",
            [
                ("Name", data["user"]["name"]),
                ("Email", data["user"]["email"]),
                ("Generated Date", data["generated_date"]),
            ],
        )
    )

    if data["skin_profile"]:
        sections.append(
            (
                "Skin Profile",
                list(
                    data["skin_profile"].items()
                ),
            )
        )

    if data["assessment"]:
        sections.append(
            (
                "Skin Assessment",
                list(
                    data["assessment"].items()
                ),
            )
        )

    if data["lifestyle"]:
        sections.append(
            (
                "Lifestyle",
                list(
                    data["lifestyle"].items()
                ),
            )
        )

    if data["sleep"]:
        sections.append(
            (
                "Sleep",
                list(
                    data["sleep"].items()
                ),
            )
        )

    sections.append(
        (
            "Routine Adherence",
            list(
                data["routine_adherence"].items()
            ),
        )
    )

    if data["latest_checkin"]:
        sections.append(
            (
                "Latest Check-in",
                list(
                    data["latest_checkin"].items()
                ),
            )
        )

    pdf = create_pdf(
        "AI Skin Intelligence - Skin Health Report",
        sections,
    )

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="skin_health_report_{user_id}.pdf"'
            )
        },
    )


# =========================================================
# 7. ASSESSMENT REPORT PDF
# =========================================================

@router.get("/assessment/{user_id}/pdf")
def assessment_report_pdf(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_user_access(current_user, user_id)

    data = assessment_report(
        user_id=user_id,
        db=db,
        current_user=current_user,
    )

    sections = [
        (
            "User Information",
            list(data["user"].items()),
        ),
        (
            "Assessment",
            list(data["assessment"].items()),
        ),
    ]

    pdf = create_pdf(
        "AI Skin Intelligence - Skin Assessment Report",
        sections,
    )

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="skin_assessment_report_{user_id}.pdf"'
            )
        },
    )


# =========================================================
# EXCEL HELPER
# =========================================================

def create_excel(
    title: str,
    sections: list,
):
    workbook = Workbook()

    worksheet = workbook.active
    worksheet.title = "Report"

    worksheet["A1"] = title
    worksheet["A1"].font = Font(
        bold=True,
        size=16,
    )

    row_number = 3

    for section_title, rows in sections:

        worksheet.cell(
            row=row_number,
            column=1,
            value=section_title,
        )

        worksheet.cell(
            row=row_number,
            column=1,
        ).font = Font(
            bold=True,
            size=12,
        )

        row_number += 1

        worksheet.cell(
            row=row_number,
            column=1,
            value="Field",
        )

        worksheet.cell(
            row=row_number,
            column=2,
            value="Value",
        )

        for column in range(1, 3):
            cell = worksheet.cell(
                row=row_number,
                column=column,
            )

            cell.font = Font(
                bold=True,
            )

            cell.fill = PatternFill(
                fill_type="solid",
                fgColor="2E7D6F",
            )

            cell.font = Font(
                bold=True,
                color="FFFFFF",
            )

        row_number += 1

        for field, value in rows:

            worksheet.cell(
                row=row_number,
                column=1,
                value=str(field),
            )

            worksheet.cell(
                row=row_number,
                column=2,
                value=(
                    str(value)
                    if value is not None
                    else "Not available"
                ),
            )

            row_number += 1

        row_number += 2

    worksheet.column_dimensions["A"].width = 35
    worksheet.column_dimensions["B"].width = 70

    for row in worksheet.iter_rows():
        for cell in row:
            cell.alignment = Alignment(
                vertical="top",
                wrap_text=True,
            )

    buffer = BytesIO()

    workbook.save(buffer)

    buffer.seek(0)

    return buffer


# =========================================================
# 8. PROGRESS REPORT EXCEL
# =========================================================

@router.get("/progress/{user_id}/excel")
def progress_report_excel(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_user_access(current_user, user_id)

    data = progress_report(
        user_id=user_id,
        db=db,
        current_user=current_user,
    )

    sections = [
        (
            "User Information",
            list(data["user"].items()),
        ),
        (
            "Period",
            list(data["period"].items()),
        ),
        (
            "Progress Summary",
            list(data["summary"].items()),
        ),
    ]

    daily_rows = []

    for record in data["daily_records"]:
        daily_rows.append(
            (
                record["date"],
                (
                    f"Routine: {record['routine_completed']}, "
                    f"Water: {record['water_intake_liters']} L, "
                    f"Sleep: {record['sleep_hours']} h, "
                    f"Skin Score: {record['skin_health_score']}"
                ),
            )
        )

    sections.append(
        (
            "Daily Progress",
            daily_rows,
        )
    )

    excel_file = create_excel(
        "AI Skin Intelligence - Progress Report",
        sections,
    )

    return StreamingResponse(
        excel_file,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition": (
                f'attachment; filename="progress_report_{user_id}.xlsx"'
            )
        },
    )


# =========================================================
# 9. HEALTH REPORT EXCEL
# =========================================================

@router.get("/health/{user_id}/excel")
def health_report_excel(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_user_access(current_user, user_id)

    data = health_report(
        user_id=user_id,
        db=db,
        current_user=current_user,
    )

    sections = [
        (
            "User Information",
            list(data["user"].items()),
        ),
    ]

    if data["skin_profile"]:
        sections.append(
            (
                "Skin Profile",
                list(data["skin_profile"].items()),
            )
        )

    if data["assessment"]:
        sections.append(
            (
                "Skin Assessment",
                list(data["assessment"].items()),
            )
        )

    if data["lifestyle"]:
        sections.append(
            (
                "Lifestyle",
                list(data["lifestyle"].items()),
            )
        )

    if data["sleep"]:
        sections.append(
            (
                "Sleep",
                list(data["sleep"].items()),
            )
        )

    sections.append(
        (
            "Routine Adherence",
            list(data["routine_adherence"].items()),
        )
    )

    if data["latest_checkin"]:
        sections.append(
            (
                "Latest Check-in",
                list(data["latest_checkin"].items()),
            )
        )

    excel_file = create_excel(
        "AI Skin Intelligence - Skin Health Report",
        sections,
    )

    return StreamingResponse(
        excel_file,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition": (
                f'attachment; filename="skin_health_report_{user_id}.xlsx"'
            )
        },
    )


# =========================================================
# 10. AUTOMATED HEALTH INSIGHTS
# =========================================================

@router.get("/health/{user_id}/insights")
def health_insights(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_user_access(current_user, user_id)

    user = get_user_or_404(user_id, db)

    assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == user_id)
        .order_by(SkinAssessment.id.desc())
        .first()
    )

    lifestyle = (
        db.query(Lifestyle)
        .filter(Lifestyle.user_id == user_id)
        .order_by(Lifestyle.id.desc())
        .first()
    )

    sleep = (
        db.query(Sleep)
        .filter(Sleep.user_id == user_id)
        .order_by(Sleep.date.desc())
        .first()
    )

    checkin = (
        db.query(DailyCheckin)
        .filter(DailyCheckin.user_id == user_id)
        .order_by(DailyCheckin.date.desc())
        .first()
    )

    if not assessment and not lifestyle and not sleep and not checkin:
        raise HTTPException(
            status_code=404,
            detail="Not enough health data available to generate insights.",
        )

    insights = []

    # -----------------------------------------------------
    # SKIN HEALTH
    # -----------------------------------------------------

    skin_score = None
    health_status = "Not Available"

    if assessment:
        skin_score = assessment.skin_score
        health_status = assessment.health_status

        if skin_score >= 80:
            insights.append({
                "category": "Skin Health",
                "status": "Excellent",
                "message": (
                    "Your current skin health score is excellent. "
                    "Continue following your skincare routine consistently."
                ),
            })

        elif skin_score >= 60:
            insights.append({
                "category": "Skin Health",
                "status": "Good",
                "message": (
                    "Your skin health is in a good range. "
                    "Continue your routine and maintain healthy lifestyle habits."
                ),
            })

        else:
            insights.append({
                "category": "Skin Health",
                "status": "Needs Improvement",
                "message": (
                    "Your skin health score indicates that some areas "
                    "may need improvement. Review your skincare routine, "
                    "hydration, sleep and lifestyle habits."
                ),
            })

    # -----------------------------------------------------
    # HYDRATION
    # -----------------------------------------------------

    water = None

    if checkin:
        water = checkin.water_intake_liters
    elif lifestyle:
        water = lifestyle.water_intake

    if water is not None:

        if water < 2.0:
            insights.append({
                "category": "Hydration",
                "status": "Needs Improvement",
                "message": (
                    "Your recent water intake is below the project's "
                    "2-liter daily target."
                ),
            })

        else:
            insights.append({
                "category": "Hydration",
                "status": "Good",
                "message": (
                    "Your recent hydration level is on track "
                    "with the project's daily target."
                ),
            })

    # -----------------------------------------------------
    # SLEEP
    # -----------------------------------------------------

    sleep_hours = None

    if checkin:
        sleep_hours = checkin.sleep_hours
    elif sleep:
        sleep_hours = sleep.sleep_hours

    if sleep_hours is not None:

        if sleep_hours < 7:
            insights.append({
                "category": "Sleep",
                "status": "Needs Improvement",
                "message": (
                    "Your recent sleep duration is below the project's "
                    "7-hour target. Try to maintain a consistent sleep schedule."
                ),
            })

        elif sleep_hours <= 9:
            insights.append({
                "category": "Sleep",
                "status": "Good",
                "message": (
                    "Your recent sleep duration is within the "
                    "project's recommended range."
                ),
            })

        else:
            insights.append({
                "category": "Sleep",
                "status": "Review",
                "message": (
                    "Your recorded sleep duration is above the project's "
                    "typical recommended range."
                ),
            })

    # -----------------------------------------------------
    # LIFESTYLE
    # -----------------------------------------------------

    if lifestyle:

        if lifestyle.stress_level >= 8:
            insights.append({
                "category": "Stress",
                "status": "High",
                "message": (
                    "Your recorded stress level is high. "
                    "Consider incorporating relaxation, exercise "
                    "and consistent sleep into your routine."
                ),
            })

        elif lifestyle.stress_level >= 5:
            insights.append({
                "category": "Stress",
                "status": "Moderate",
                "message": (
                    "Your recorded stress level is moderate. "
                    "Continue monitoring stress and maintaining "
                    "healthy daily habits."
                ),
            })

        else:
            insights.append({
                "category": "Stress",
                "status": "Good",
                "message": (
                    "Your recorded stress level is relatively low."
                ),
            })

        if lifestyle.exercise_minutes >= 30:
            insights.append({
                "category": "Exercise",
                "status": "Good",
                "message": (
                    "Your recorded exercise activity is at least 30 minutes."
                ),
            })

        else:
            insights.append({
                "category": "Exercise",
                "status": "Needs Improvement",
                "message": (
                    "Your recorded exercise activity is below 30 minutes. "
                    "Consider gradually increasing daily physical activity."
                ),
            })

    # -----------------------------------------------------
    # ROUTINE
    # -----------------------------------------------------

    if checkin:

        if checkin.routine_completed:
            insights.append({
                "category": "Skincare Routine",
                "status": "Completed",
                "message": (
                    "Your latest skincare routine was marked as completed. "
                    "Keep maintaining consistency."
                ),
            })

        else:
            insights.append({
                "category": "Skincare Routine",
                "status": "Needs Attention",
                "message": (
                    "Your latest skincare routine was not marked as completed. "
                    "Consistency can help maintain progress."
                ),
            })

    # -----------------------------------------------------
    # OVERALL RECOMMENDATION
    # -----------------------------------------------------

    needs_improvement = [
        item
        for item in insights
        if item["status"] in (
            "Needs Improvement",
            "Needs Attention",
            "High",
        )
    ]

    if needs_improvement:

        focus_areas = [
            item["category"]
            for item in needs_improvement
        ]

        overall_recommendation = (
            "Focus on improving: "
            + ", ".join(focus_areas)
            + ". Continue monitoring your skin health "
            + "and maintaining your skincare routine."
        )

    else:

        overall_recommendation = (
            "Your current health indicators are generally on track. "
            "Continue maintaining your skincare routine, hydration, "
            "sleep and healthy lifestyle habits."
        )

    return {
        "report_type": "Automated Health Insights",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
        },
        "skin_health_score": skin_score,
        "health_status": health_status,
        "insights": insights,
        "overall_recommendation": overall_recommendation,
    }


# ============================================================
# 11. UNIFIED HEALTH DASHBOARD
# ============================================================

@router.get("/health/{user_id}/dashboard")
def get_health_dashboard(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return a complete health dashboard summary for a user.
    """

    check_user_access(current_user, user_id)

    # IMPORTANT:
    # get_user_or_404 expects (user_id, db)
    user = get_user_or_404(user_id, db)

    # --------------------------------------------------------
    # Latest health data
    # --------------------------------------------------------

    latest_assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == user_id)
        .order_by(SkinAssessment.id.desc())
        .first()
    )

    latest_lifestyle = (
        db.query(Lifestyle)
        .filter(Lifestyle.user_id == user_id)
        .order_by(Lifestyle.id.desc())
        .first()
    )

    latest_sleep = (
        db.query(Sleep)
        .filter(Sleep.user_id == user_id)
        .order_by(Sleep.id.desc())
        .first()
    )

    latest_checkin = (
        db.query(DailyCheckin)
        .filter(DailyCheckin.user_id == user_id)
        .order_by(DailyCheckin.id.desc())
        .first()
    )

    # --------------------------------------------------------
    # Skin health
    # --------------------------------------------------------

    skin_health_score = None
    health_status = "No data"

    if latest_checkin:
        skin_health_score = latest_checkin.skin_health_score

        if skin_health_score is not None:

            if skin_health_score >= 80:
                health_status = "Excellent"

            elif skin_health_score >= 60:
                health_status = "Good"

            else:
                health_status = "Needs Improvement"

    # --------------------------------------------------------
    # Hydration
    # --------------------------------------------------------

    hydration = None

    if latest_lifestyle:

        water_intake = latest_lifestyle.water_intake or 0

        hydration = {
            "water_intake_liters": water_intake,
            "target_liters": 2.5,
            "status": (
                "Needs Improvement"
                if water_intake < 2.0
                else "Good"
            ),
        }

    # --------------------------------------------------------
    # Sleep
    # --------------------------------------------------------

    sleep_data = None

    if latest_sleep:

        sleep_hours = latest_sleep.sleep_hours or 0

        if sleep_hours < 7:
            sleep_status = "Needs Improvement"

        elif sleep_hours <= 9:
            sleep_status = "Good"

        else:
            sleep_status = "Review"

        sleep_data = {
            "sleep_hours": sleep_hours,
            "sleep_quality": latest_sleep.sleep_quality,
            "recommended_hours": 7,
            "status": sleep_status,
        }

    # --------------------------------------------------------
    # Lifestyle
    # --------------------------------------------------------

    lifestyle_data = None

    if latest_lifestyle:

        stress_level = latest_lifestyle.stress_level or 0
        exercise_minutes = latest_lifestyle.exercise_minutes or 0

        if stress_level >= 8:
            stress_status = "High"

        elif stress_level >= 5:
            stress_status = "Moderate"

        else:
            stress_status = "Good"

        lifestyle_data = {
            "water_intake": latest_lifestyle.water_intake,
            "exercise_minutes": exercise_minutes,
            "stress_level": stress_level,
            "stress_status": stress_status,
            "exercise_status": (
                "Good"
                if exercise_minutes >= 30
                else "Needs Improvement"
            ),
        }

    # --------------------------------------------------------
    # Routine
    # --------------------------------------------------------

    routine = None

    if latest_checkin:

        routine = {
            "completed": latest_checkin.routine_completed,
            "status": (
                "Completed"
                if latest_checkin.routine_completed
                else "Needs Attention"
            ),
        }

    # --------------------------------------------------------
    # Recent progress
    # --------------------------------------------------------

    recent_checkins = (
        db.query(DailyCheckin)
        .filter(DailyCheckin.user_id == user_id)
        .order_by(DailyCheckin.id.desc())
        .limit(2)
        .all()
    )

    progress = {
        "trend": "No data",
        "latest_score": skin_health_score,
        "previous_score": None,
    }

    if len(recent_checkins) >= 2:

        latest_score = recent_checkins[0].skin_health_score or 0
        previous_score = recent_checkins[1].skin_health_score or 0

        progress["latest_score"] = latest_score
        progress["previous_score"] = previous_score

        if latest_score > previous_score:
            progress["trend"] = "Improving"

        elif latest_score < previous_score:
            progress["trend"] = "Needs Attention"

        else:
            progress["trend"] = "Stable"

    # --------------------------------------------------------
    # Unread notifications
    # --------------------------------------------------------

    unread_notifications = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.is_read == False,
        )
        .order_by(Notification.id.desc())
        .all()
    )

    # --------------------------------------------------------
    # Final response
    # --------------------------------------------------------

    return {
        "report_type": "Unified Health Dashboard",

        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        },

        "health_summary": {
            "skin_health_score": skin_health_score,
            "health_status": health_status,
        },

        "skin_assessment": (
            {
                "id": latest_assessment.id,
                "skin_score": latest_assessment.skin_score,
                "health_status": latest_assessment.health_status,
                "primary_concern": latest_assessment.primary_concern,
            }
            if latest_assessment
            else None
        ),

        "hydration": hydration,

        "sleep": sleep_data,

        "lifestyle": lifestyle_data,

        "routine": routine,

        "progress": progress,

        "notifications": {
            "unread_count": len(unread_notifications),

            "items": [
                {
                    "id": notification.id,
                    "notification_type": notification.notification_type,
                    "title": notification.title,
                    "message": notification.message,
                    "created_at": notification.created_at,
                }
                for notification in unread_notifications
            ],
        },
    }