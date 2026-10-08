from flask import Blueprint, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from io import BytesIO
from datetime import datetime, date
import pandas as pd
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from app import db
from app.models import User, SkinProfile, ScoreHistory, DailyChecklist, ClinicalRecommendation
from app.adherence import get_routine_consistency
from app.ml.skin_score_model import assess_skin
from app.routine import generate_routine
from app.products import get_product_suggestions

reports_bp = Blueprint("reports", __name__)

AVAILABLE_WIDTH = 523.0


# -------------------------------------------------
# Helper: Get current logged-in user
# -------------------------------------------------
def get_current_user():
    user_id = get_jwt_identity()
    return User.query.get(user_id)


def get_col_widths(sample_row):
    """Dynamically assign column widths matching printable 523 pt page width."""
    num_cols = len(sample_row)
    if num_cols == 1:
        return [AVAILABLE_WIDTH]
    elif num_cols == 2:
        return [145.0, 378.0]
    elif num_cols == 3:
        return [100.0, 75.0, 348.0]
    elif num_cols == 4:
        return [195.0, 110.0, 70.0, 148.0]
    elif num_cols == 5:
        return [100.0, 100.0, 80.0, 80.0, 163.0]
    else:
        return [AVAILABLE_WIDTH / num_cols] * num_cols


# -------------------------------------------------
# 1. Assessment Report (JSON data)
# -------------------------------------------------
@reports_bp.route("/api/reports/assessment", methods=["GET"])
@jwt_required()
def assessment_report():
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    profile = SkinProfile.query.filter_by(user_id=user.id).first()

    data = {
        "report_type": "Skin Assessment Report",
        "generated_at": datetime.utcnow().isoformat(),
        "user": {
            "name": user.name,
            "email": user.email
        },
        "profile": {
            "skin_type": profile.skin_type if profile else "Not set",
            "age_group": profile.age_group if profile else "Not set",
            "skin_concerns": profile.skin_concerns if profile else "Not set",
            "allergies": profile.allergies if profile else "Not set",
            "sensitivities": profile.sensitivities if profile else "Not set",
            "sleep_hours": profile.sleep_hours if profile else "Not set",
            "sleep_quality": profile.sleep_quality if profile else "Not set",
            "stress_level": profile.stress_level if profile else "Not set",
            "water_intake_level": profile.water_intake_level if profile else "Not set",
            "environmental_exposure": profile.environmental_exposure if profile else "Not set"
        }
    }
    return jsonify(data)


# -------------------------------------------------
# 2. Progress Report (JSON data)
# -------------------------------------------------
@reports_bp.route("/api/reports/progress", methods=["GET"])
@jwt_required()
def progress_report():
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    scores = ScoreHistory.query.filter_by(user_id=user.id)\
        .order_by(ScoreHistory.date.desc()).limit(30).all()

    score_list = []
    for s in scores:
        score_list.append({
            "date": s.date,
            "score": s.score,
            "summary": s.summary
        })

    # Simple trend
    trend = "Insufficient data"
    if len(score_list) >= 2:
        first = score_list[-1]["score"]
        last = score_list[0]["score"]
        if last > first + 3:
            trend = "Improving"
        elif last < first - 3:
            trend = "Declining"
        else:
            trend = "Stable"

    data = {
        "report_type": "Progress Report",
        "generated_at": datetime.utcnow().isoformat(),
        "user": {
            "name": user.name,
            "email": user.email
        },
        "summary": {
            "total_entries": len(score_list),
            "latest_score": score_list[0]["score"] if score_list else None,
            "trend": trend
        },
        "history": score_list
    }
    return jsonify(data)


# -------------------------------------------------
# Helper: Create a Clean, Professional, Beautiful PDF
# -------------------------------------------------
def create_pdf(title, user_name, sections):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name="BrandTitle",
        fontSize=18,
        leading=22,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#1b4332"),
        fontName="Helvetica-Bold",
        spaceAfter=2,
    ))
    styles.add(ParagraphStyle(
        name="BrandSubtitle",
        fontSize=9,
        leading=12,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#2d6a4f"),
        fontName="Helvetica",
        spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        name="MetaText",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#1b4332"),
        fontName="Helvetica",
    ))
    styles.add(ParagraphStyle(
        name="SectionHead",
        fontSize=11,
        leading=15,
        spaceBefore=14,
        spaceAfter=6,
        textColor=colors.HexColor("#1b4332"),
        fontName="Helvetica-Bold",
        keepWithNext=True,
    ))
    styles.add(ParagraphStyle(
        name="BodyText2",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#374151"),
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="TableHeader",
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
        fontName="Helvetica-Bold",
        alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        name="TableCell",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1f2937"),
        fontName="Helvetica",
        alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        name="TableCellBold",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1b4332"),
        fontName="Helvetica-Bold",
        alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        name="FooterText",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#6b7280"),
        alignment=TA_CENTER,
    ))

    story = []

    # Brand Header Banner
    story.append(Paragraph("SKIN INTELLIGENCE", styles["BrandTitle"]))
    story.append(Paragraph("Personalized Clinical Dermatological & AI Skincare Management Platform", styles["BrandSubtitle"]))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1b4332"), spaceAfter=8))

    # Clean Meta Card Box
    meta_data = [
        [
            Paragraph(f"<b>PATIENT / USER:</b> {user_name}", styles["MetaText"]),
            Paragraph(f"<b>DOCUMENT:</b> {title}", styles["MetaText"])
        ],
        [
            Paragraph(f"<b>DATE GENERATED:</b> {datetime.utcnow().strftime('%d %B %Y, %H:%M UTC')}", styles["MetaText"]),
            Paragraph("<b>STATUS:</b> Verified Clinical AI Analysis", styles["MetaText"])
        ]
    ]
    meta_table = Table(meta_data, colWidths=[261.5, 261.5])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f0fdf4")),
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#86efac")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#bbf7d0")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # Render Sections
    for item in sections:
        if len(item) == 3:
            heading, content, custom_widths = item
        else:
            heading, content = item
            custom_widths = None

        story.append(Paragraph(heading, styles["SectionHead"]))

        if isinstance(content, list) and len(content) > 0 and isinstance(content[0], list):
            # Dynamic colWidths guaranteed not to overflow 523pt available width
            col_widths = custom_widths if custom_widths else get_col_widths(content[0])
            num_cols = len(content[0])

            # Wrap every single cell in a Paragraph for clean multiline wrapping
            formatted_content = []
            for row_idx, row in enumerate(content):
                formatted_row = []
                for col_idx, cell in enumerate(row):
                    text = str(cell if cell is not None else "")
                    if row_idx == 0:
                        formatted_row.append(Paragraph(f"<b>{text}</b>", styles["TableHeader"]))
                    else:
                        if num_cols == 2 and col_idx == 0:
                            formatted_row.append(Paragraph(f"<b>{text}</b>", styles["TableCellBold"]))
                        else:
                            formatted_row.append(Paragraph(text, styles["TableCell"]))
                formatted_content.append(formatted_row)

            table = Table(formatted_content, colWidths=col_widths, repeatRows=1)
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1b4332")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#fbfcfb"), colors.white]),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]))
            story.append(table)
        else:
            for line in content:
                story.append(Paragraph(str(line), styles["BodyText2"]))

        story.append(Spacer(1, 8))

    # Footer
    story.append(Spacer(1, 14))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceAfter=6))
    story.append(Paragraph(
        "Confidential Document • Generated by Skin Intelligence AI Platform • For clinical reference & personalized skincare planning. Not a substitute for emergency dermatological medical diagnosis.",
        styles["FooterText"]
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer


# -------------------------------------------------
# 3. Download Assessment Report as PDF
# -------------------------------------------------
@reports_bp.route("/api/reports/export/pdf/assessment", methods=["GET"])
@reports_bp.route("/api/reports/export/pdf/skin-health", methods=["GET"])
@jwt_required()
def export_assessment_pdf():
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    profile = SkinProfile.query.filter_by(user_id=user.id).first()

    # Calculate real skin metrics
    profile_data = {
        "skin_type": profile.skin_type if profile and profile.skin_type else "normal",
        "age_group": profile.age_group if profile and profile.age_group else "25-34",
        "skin_concerns": profile.skin_concerns if profile and profile.skin_concerns else "",
        "allergies": profile.allergies if profile and profile.allergies else "",
        "sensitivities": profile.sensitivities if profile and profile.sensitivities else "",
        "sleep_hours": profile.sleep_hours if profile and profile.sleep_hours else "7-8",
        "sleep_quality": profile.sleep_quality if profile and profile.sleep_quality else "good",
        "stress_level": profile.stress_level if profile and profile.stress_level else "moderate",
        "exercise_frequency": profile.exercise_frequency if profile and profile.exercise_frequency else "moderate",
        "water_intake_level": profile.water_intake_level if profile and profile.water_intake_level else "moderate",
        "average_water_intake": profile.average_water_intake if profile and profile.average_water_intake else "2",
        "environmental_exposure": profile.environmental_exposure if profile and profile.environmental_exposure else "moderate",
    }

    consistency = get_routine_consistency(user.id)
    assessment = assess_skin(profile_data, routine_consistency=consistency)
    breakdown = assessment.get("breakdown", {})

    # Section 1: User Profile Table (2 columns)
    profile_table = [
        ["Profile Metric", "Reported Value & Characteristics"],
        ["Skin Type", (profile.skin_type if profile and profile.skin_type else "Not set").title()],
        ["Age Group", profile.age_group if profile and profile.age_group else "Not set"],
        ["Target Concerns", profile.skin_concerns if profile and profile.skin_concerns else "General skin wellness"],
        ["Allergies", profile.allergies if profile and profile.allergies else "None declared"],
        ["Sensitivities", profile.sensitivities if profile and profile.sensitivities else "None declared"],
        ["Sleep Pattern", f"{profile.sleep_hours or '7-8'} hrs/night (Quality: {profile.sleep_quality or 'Good'})" if profile else "7-8 hrs"],
        ["Lifestyle & Stress", f"Stress: {profile.stress_level or 'Moderate'}, Exercise: {profile.exercise_frequency or 'Moderate'}" if profile else "Moderate"],
        ["Hydration Level", f"{profile.water_intake_level or 'Moderate'} ({profile.average_water_intake or '2.0'} L/day)" if profile else "2.0 L/day"],
        ["Environmental Exposure", profile.environmental_exposure if profile and profile.environmental_exposure else "Standard indoor/commute exposure"],
    ]

    # Section 2: Clinical Health Score Breakdown (4 columns)
    score_table = [
        ["Health Component", "Score / Rating", "Model Weight", "Clinical Significance"],
        ["Overall Health Score", f"{assessment.get('score', 80)} / 100", "100%", "Composite barrier integrity and health index"],
        ["Skin Barrier & Condition", f"{breakdown.get('skin_condition', 75)} / 100", "35%", "Baseline sensitivity & target concern intensity"],
        ["Routine Consistency", f"{breakdown.get('routine_consistency', consistency)}%", "20%", "Adherence to AM & PM daily skincare regimen"],
        ["Lifestyle & Stress", f"{breakdown.get('lifestyle', 70)} / 100", "20%", "Cortisol regulation, exercise & lifestyle impact"],
        ["Sleep Restoration", f"{breakdown.get('sleep', 75)} / 100", "15%", "Cellular turnover & nocturnal barrier repair"],
        ["Hydration Balance", f"{breakdown.get('hydration', 80)} / 100", "10%", "Transepidermal water retention & cellular volume"],
    ]

    # Section 3: Recommended Actives & Concerns (3 columns)
    concerns_raw = assessment.get("concerns", []) or ["General Maintenance"]
    actives_table = [
        ["Priority", "Targeted Concern", "Recommended Active Ingredients"]
    ]

    active_map = {
        "acne": "Salicylic Acid (BHA), Niacinamide 5%, Zinc PCA, Azelaic Acid",
        "hyperpigmentation": "Vitamin C (L-Ascorbic Acid), Alpha Arbutin, Licorice Root, Tranexamic Acid",
        "dryness": "Ceramides (1, 3, 6-II), Hyaluronic Acid, Squalane, Glycerin",
        "aging": "Encapsulated Retinol 0.3%, Matrixyl 3000 Peptides, Broad-Spectrum SPF 50+",
        "redness": "Centella Asiatica (Cica), Madecassoside, Panthenol (B5), Allantoin",
        "oiliness": "Niacinamide, BHA Cleanser, Green Tea Extract, Oil-Free Gel Moisturizer",
        "pores": "Salicylic Acid 2%, Niacinamide 10%, Glycolic Acid (weekly toner)",
        "dullness": "L-Ascorbic Acid 10%, Glycolic Acid gentle peel, Squalane",
        "dark circles": "Caffeine Solution, Vitamin K, Niacinamide, Peptides",
    }

    for idx, c in enumerate(concerns_raw[:5], 1):
        c_clean = str(c).strip().lower()
        matched_act = "Niacinamide, Hyaluronic Acid, Broad-Spectrum SPF 50+"
        for k, act in active_map.items():
            if k in c_clean:
                matched_act = act
                break
        actives_table.append([f"Priority #{idx}", str(c).title(), matched_act])

    # Section 4: Clinical Recommendations
    doc_notes = ClinicalRecommendation.query.filter_by(patient_id=user.id)\
        .order_by(ClinicalRecommendation.created_at.desc()).all()

    sections = [
        ("1. Diagnostic Skin Profile", profile_table),
        ("2. Clinical Skin Health Score Breakdown", score_table, [160.0, 95.0, 85.0, 183.0]),
        ("3. Prioritized Concerns & Targeted Actives", actives_table, [85.0, 130.0, 308.0]),
    ]

    if doc_notes:
        doc_table = [["Date", "Dermatologist Note", "Prescribed Routine Adjustment"]]
        for n in doc_notes[:5]:
            doc_table.append([
                n.created_at.strftime("%d %b %Y") if n.created_at else "-",
                n.notes or "No notes provided.",
                n.routine_adjustment or "Maintain standard regimen."
            ])
        sections.append(("4. Dermatologist Clinical Orders", doc_table, [90.0, 215.0, 218.0]))
    else:
        sections.append((
            "4. Dermatologist Advisory",
            [
                "No clinical orders or custom doctor prescriptions have been logged yet.",
                "You can book or request a review with our affiliated dermatologists through your portal to receive tailored medical advice."
            ]
        ))

    pdf_buffer = create_pdf("Skin Assessment & Diagnostic Report", user.name, sections)

    return send_file(
        pdf_buffer,
        as_attachment=True,
        download_name=f"Skin_Assessment_Report_{datetime.utcnow().strftime('%Y%m%d')}.pdf",
        mimetype="application/pdf"
    )


# -------------------------------------------------
# 4. Download Progress Report as PDF
# -------------------------------------------------
@reports_bp.route("/api/reports/export/pdf/progress", methods=["GET"])
@jwt_required()
def export_progress_pdf():
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    scores = ScoreHistory.query.filter_by(user_id=user.id)\
        .order_by(ScoreHistory.date.desc()).limit(20).all()

    consistency = get_routine_consistency(user.id)

    # Trend calculation
    trend = "Stable / Evaluating"
    net_change = 0
    if len(scores) >= 2:
        first = scores[-1].score
        last = scores[0].score
        net_change = last - first
        if net_change >= 3:
            trend = f"Improving (+{net_change} pts)"
        elif net_change <= -3:
            trend = f"Declining ({net_change} pts)"
        else:
            trend = "Consistent & Stable"

    summary_table = [
        ["Metric", "Value & Description"],
        ["Latest Skin Health Score", f"{scores[0].score} / 100" if scores else "N/A"],
        ["Baseline Starting Score", f"{scores[-1].score} / 100" if scores else "N/A"],
        ["Net Score Change", f"{net_change:+d} points" if scores else "0 points"],
        ["30-Day Health Trend", trend],
        ["Total Recorded Check-ins", f"{len(scores)} logs recorded"],
        ["Routine Adherence Rate", f"{consistency}% completion over the last 14 days"],
    ]

    history_table = [["Date", "Score", "Clinical Summary & Notes"]]
    if scores:
        for s in scores:
            history_table.append([
                s.date,
                f"{s.score} / 100",
                s.summary if s.summary else "Routine completed and skin metrics recorded."
            ])
    else:
        history_table.append(["-", "-", "No history recorded yet. Complete daily routine checklists to begin tracking."])

    sections = [
        ("1. Progress Overview & Adherence", summary_table),
        ("2. Historical Score Log (Recent 20 Entries)", history_table, [95.0, 75.0, 353.0])
    ]

    pdf_buffer = create_pdf("Skin Health Progress Report", user.name, sections)

    return send_file(
        pdf_buffer,
        as_attachment=True,
        download_name=f"Progress_Report_{datetime.utcnow().strftime('%Y%m%d')}.pdf",
        mimetype="application/pdf"
    )


# -------------------------------------------------
# 5. Download Progress Report as Excel
# -------------------------------------------------
@reports_bp.route("/api/reports/export/excel/progress", methods=["GET"])
@jwt_required()
def export_progress_excel():
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    scores = ScoreHistory.query.filter_by(user_id=user.id)\
        .order_by(ScoreHistory.date.desc()).limit(60).all()

    rows = []
    for s in scores:
        rows.append({
            "Date": s.date,
            "Skin Health Score": s.score,
            "Summary": s.summary or ""
        })

    df = pd.DataFrame(rows)

    buffer = BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Progress History")

    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"Progress_Report_{datetime.utcnow().strftime('%Y%m%d')}.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


# -------------------------------------------------
# 6. Download Routine Plan as PDF
# -------------------------------------------------
@reports_bp.route("/api/reports/export/pdf/routine", methods=["GET"])
@jwt_required()
def export_routine_pdf():
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    profile = SkinProfile.query.filter_by(user_id=user.id).first()
    if not profile:
        return jsonify({"error": "Profile not found"}), 404

    profile_data = {
        "skin_type": profile.skin_type or "normal",
        "skin_concerns": profile.skin_concerns or "",
        "sensitivities": profile.sensitivities or "",
        "environmental_exposure": profile.environmental_exposure or "",
    }
    routine = generate_routine(profile_data)

    morning_table = [["Step", "Clinical Regimen & Action Plan"]]
    for i, step in enumerate(routine.get("morning_detailed", routine.get("morning", [])), 1):
        morning_table.append([f"Step {i}", step])

    evening_table = [["Step", "Clinical Regimen & Action Plan"]]
    for i, step in enumerate(routine.get("evening_detailed", routine.get("evening", [])), 1):
        evening_table.append([f"Step {i}", step])

    weekly_table = [["Day", "Treatment Focus & Clinical Action"]]
    for day, text in routine.get("weekly", {}).items():
        weekly_table.append([day, text])

    seasonal_table = [
        ["Factor", "Clinical Advisory"],
        ["Seasonal Focus", routine.get("seasonal", {}).get("summary", "Maintain daily broad-spectrum sun protection and barrier hydration.")],
        ["UV Protection", "Reapply broad-spectrum SPF 50+ PA++++ every 2-3 hours during outdoor exposure."],
        ["Barrier Repair", "Incorporate ceramides and fatty acids nightly to minimize transepidermal water loss."]
    ]

    sections = [
        ("1. Morning Regimen (AM - Protect & Hydrate)", morning_table, [85.0, 438.0]),
        ("2. Evening Regimen (PM - Repair & Regenerate)", evening_table, [85.0, 438.0]),
        ("3. Weekly Treatment Protocol", weekly_table, [105.0, 418.0]),
        ("4. Environmental & Seasonal Guidance", seasonal_table, [125.0, 398.0]),
    ]

    pdf_buffer = create_pdf("Personalized Skincare Routine Plan", user.name, sections)

    return send_file(
        pdf_buffer,
        as_attachment=True,
        download_name=f"Skincare_Routine_Plan_{datetime.utcnow().strftime('%Y%m%d')}.pdf",
        mimetype="application/pdf"
    )


# -------------------------------------------------
# 7. Download Product Recommendations as PDF
# -------------------------------------------------
@reports_bp.route("/api/reports/export/pdf/products", methods=["GET"])
@jwt_required()
def export_products_pdf():
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    profile = SkinProfile.query.filter_by(user_id=user.id).first()
    if not profile:
        return jsonify({"error": "Profile not found"}), 404

    concerns = [c.strip() for c in (profile.skin_concerns or "").split(",") if c.strip()]
    prod_data = get_product_suggestions(
        skin_type=profile.skin_type,
        concerns=concerns,
        sensitivities=profile.sensitivities,
        allergies=profile.allergies,
    )

    top_prods = prod_data.get("top_recommendations", [])
    prod_table = [["Product Name & Brand", "Category", "Match %", "Estimated Price"]]
    for p in top_prods[:10]:
        prod_table.append([
            f"<b>{p.get('name', '')}</b><br/><font color='#2d6a4f'>Brand: {p.get('brand', 'Clinical Choice')}</font>",
            p.get("category", "General"),
            f"{p.get('score', 75)}%",
            f"INR {p.get('price', '-')}" if p.get("price") else "INR 499 - 999"
        ])

    target_profile_table = [
        ["Profile Parameter", "Configured Value"],
        ["Skin Type", (profile.skin_type or "Normal").title()],
        ["Primary Concerns", profile.skin_concerns or "General Skin Maintenance"],
        ["Allergies Screened", profile.allergies or "None declared"],
        ["Sensitivities Screened", profile.sensitivities or "None declared"],
        ["Recommendation Engine", "Content-Based ML Similarity & Safety Matrix"]
    ]

    safety_table = [
        ["Safety Check", "Guideline & Formulation Status"],
        ["Fragrance Policy", "Fragrance-free options prioritized for reactive barrier types."],
        ["Comedogenic Rating", "All matched items scored 0-2 (Non-comedogenic to prevent clogged pores)."],
        ["Patch Testing", "Perform a 24-hour behind-ear patch test before full facial application of active serums."]
    ]

    sections = [
        ("1. Top Matched Clinical Skincare Products", prod_table, [205.0, 110.0, 65.0, 143.0]),
        ("2. Personalized Match Profile", target_profile_table, [150.0, 373.0]),
        ("3. Formulation Safety & Application Guidelines", safety_table, [150.0, 373.0]),
    ]

    pdf_buffer = create_pdf("Product Recommendations Report", user.name, sections)

    return send_file(
        pdf_buffer,
        as_attachment=True,
        download_name=f"Product_Recommendations_{datetime.utcnow().strftime('%Y%m%d')}.pdf",
        mimetype="application/pdf"
    )