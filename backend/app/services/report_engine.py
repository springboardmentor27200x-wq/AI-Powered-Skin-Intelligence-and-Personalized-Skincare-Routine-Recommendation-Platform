"""Reports & Export System — builds PDF and Excel files for the 5
report types the project plan lists. PDF uses reportlab, Excel uses
openpyxl. Each report pulls from data that's already real and tested
elsewhere in the app — nothing here recomputes scoring logic, it just
presents it.
"""
import io
from datetime import datetime

from openpyxl import Workbook
from openpyxl.styles import Font
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

TITLES = {
    "assessment": "Skin Assessment Report",
    "routine": "Routine Report",
    "products": "Product Recommendation Report",
    "progress": "Progress Report",
    "skin_health": "Skin Health Report",
}


def _pdf_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="ReportTitle", fontSize=20, leading=26, spaceAfter=10,
        textColor=colors.HexColor("#25543F"),
    ))
    styles.add(ParagraphStyle(
        name="ReportSubtitle", fontSize=11, leading=14, textColor=colors.HexColor("#6B6255"), spaceAfter=18,
    ))
    styles.add(ParagraphStyle(
        name="SectionHeading", fontSize=13, leading=17, spaceBefore=16, spaceAfter=6, textColor=colors.HexColor("#2F6B57"),
    ))
    return styles


def _pdf_header(story, styles, title, user_name):
    story.append(Paragraph(title, styles["ReportTitle"]))
    story.append(Paragraph(
        f"{user_name} · Generated {datetime.now().strftime('%B %d, %Y at %I:%M %p')}",
        styles["ReportSubtitle"],
    ))


def build_assessment_pdf(user_name: str, assessment) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    styles = _pdf_styles()
    story = []
    _pdf_header(story, styles, TITLES["assessment"], user_name)

    if not assessment:
        story.append(Paragraph("No assessment on file yet.", styles["Normal"]))
    else:
        story.append(Paragraph(f"Overall Score: {assessment.score} / 100", styles["SectionHeading"]))

        rows = [["Component", "Weight", "Score"],
                ["Skin Condition", "35%", str(assessment.skin_condition_score or "—")],
                ["Lifestyle", "20%", str(assessment.lifestyle_score or "—")],
                ["Sleep", "15%", str(assessment.sleep_score or "—")],
                ["Routine Consistency", "20%", str(assessment.routine_consistency_score or "—")],
                ["Hydration", "10%", str(assessment.hydration_score or "—")]]
        table = Table(rows, colWidths=[2.5 * inch, 1.5 * inch, 1.5 * inch])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EEF5F1")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#25543F")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D8CFC0")),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(table)

        story.append(Paragraph("Priority Concerns", styles["SectionHeading"]))
        concerns = ", ".join(assessment.prioritized_concerns) if assessment.prioritized_concerns else "None stated"
        story.append(Paragraph(concerns, styles["Normal"]))

        if assessment.risk_factors:
            story.append(Paragraph("Risk Factors", styles["SectionHeading"]))
            for r in assessment.risk_factors:
                story.append(Paragraph(f"• {r}", styles["Normal"]))

    doc.build(story)
    return buf.getvalue()


def build_routine_pdf(user_name: str, routine, steps) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    styles = _pdf_styles()
    story = []
    _pdf_header(story, styles, TITLES["routine"], user_name)

    if not routine:
        story.append(Paragraph("No routine generated yet.", styles["Normal"]))
    else:
        if routine.season:
            story.append(Paragraph(f"Season: {routine.season.title()}", styles["Normal"]))

        for time_label, time_key in (("Morning Routine", "morning"), ("Evening Routine", "evening")):
            story.append(Paragraph(time_label, styles["SectionHeading"]))
            rows = [["#", "Category", "Instruction", "Frequency"]]
            for s in [s for s in steps if s.time_of_day == time_key]:
                rows.append([str(s.step_order), s.category.replace("_", " ").title(), s.instruction, s.frequency.replace("_", "/")])
            table = Table(rows, colWidths=[0.3 * inch, 1.1 * inch, 3.6 * inch, 0.8 * inch])
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EEF5F1")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D8CFC0")),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]))
            story.append(table)

    doc.build(story)
    return buf.getvalue()


def build_products_pdf(user_name: str, products: list) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    styles = _pdf_styles()
    story = []
    _pdf_header(story, styles, TITLES["products"], user_name)

    if not products:
        story.append(Paragraph("No recommendations available — complete your skin profile first.", styles["Normal"]))
    else:
        rows = [["Product", "Category", "Price", "Score"]]
        for p in products[:20]:
            rows.append([p["name"], p["category"], f"₹{p['price']:.0f}", f"{p['score']}/100"])
        table = Table(rows, colWidths=[2.6 * inch, 1.4 * inch, 0.9 * inch, 0.9 * inch])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EEF5F1")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D8CFC0")),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(table)

    doc.build(story)
    return buf.getvalue()


def build_progress_pdf(user_name: str, analytics, history: list) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    styles = _pdf_styles()
    story = []
    _pdf_header(story, styles, TITLES["progress"], user_name)

    if not analytics:
        story.append(Paragraph("No assessment history yet.", styles["Normal"]))
    else:
        story.append(Paragraph(
            f"Current Score: {analytics['current_score']} · Trend: {analytics['trend'].title()} · "
            f"Change since first: {analytics['change_since_first']:+d}",
            styles["SectionHeading"],
        ))
        story.append(Paragraph(
            f"Average: {analytics['average_score']} · Best: {analytics['best_score']} · Worst: {analytics['worst_score']} · "
            f"Based on {analytics['assessments_count']} assessments",
            styles["Normal"],
        ))

        story.append(Paragraph("Score History", styles["SectionHeading"]))
        rows = [["Date", "Score"]]
        for a in history:
            rows.append([a.created_at.strftime("%b %d, %Y"), str(a.score)])
        table = Table(rows, colWidths=[2.5 * inch, 1.5 * inch])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EEF5F1")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D8CFC0")),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(table)

    doc.build(story)
    return buf.getvalue()
def build_skin_health_pdf(user_name: str, profile, concerns: list[str], assessment, routine, steps, analytics) -> bytes:
    """The combined report — assessment + routine + progress in one file."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    styles = _pdf_styles()
    story = []
    _pdf_header(story, styles, TITLES["skin_health"], user_name)

    story.append(Paragraph("Skin Profile", styles["SectionHeading"]))
    if profile:
        story.append(Paragraph(
            f"Skin type: {profile.skin_type} · Age group: {profile.age_group} · "
            f"Concerns: {', '.join(concerns) if concerns else '—'}",
            styles["Normal"],
        ))
    else:
        story.append(Paragraph("No skin profile on file.", styles["Normal"]))

    story.append(Paragraph("Current Score", styles["SectionHeading"]))
    if assessment:
        story.append(Paragraph(f"{assessment.score} / 100", styles["Normal"]))
        if assessment.risk_factors:
            for r in assessment.risk_factors:
                story.append(Paragraph(f"• {r}", styles["Normal"]))
    else:
        story.append(Paragraph("No assessment on file.", styles["Normal"]))

    if analytics:
        story.append(Paragraph("Progress", styles["SectionHeading"]))
        story.append(Paragraph(
            f"Trend: {analytics['trend'].title()} · Change since first: {analytics['change_since_first']:+d} · "
            f"Average: {analytics['average_score']}",
            styles["Normal"],
        ))

    story.append(Paragraph("Routine Summary", styles["SectionHeading"]))
    if routine and steps:
        morning_count = len([s for s in steps if s.time_of_day == "morning"])
        evening_count = len([s for s in steps if s.time_of_day == "evening"])
        story.append(Paragraph(
            f"{morning_count} morning steps, {evening_count} evening steps"
            f"{f' · {routine.season.title()} routine' if routine.season else ''}",
            styles["Normal"],
        ))
    else:
        story.append(Paragraph("No routine generated yet.", styles["Normal"]))

    doc.build(story)
    return buf.getvalue()


# ---------- Excel builders ----------

def _style_header_row(ws, row_num, num_cols):
    for col in range(1, num_cols + 1):
        cell = ws.cell(row=row_num, column=col)
        cell.font = Font(bold=True, color="25543F")


def build_assessment_excel(assessment) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.title = "Assessment"
    ws.append(["Component", "Weight", "Score"])
    _style_header_row(ws, 1, 3)
    if assessment:
        ws.append(["Skin Condition", "35%", assessment.skin_condition_score])
        ws.append(["Lifestyle", "20%", assessment.lifestyle_score])
        ws.append(["Sleep", "15%", assessment.sleep_score])
        ws.append(["Routine Consistency", "20%", assessment.routine_consistency_score])
        ws.append(["Hydration", "10%", assessment.hydration_score])
        ws.append([])
        ws.append(["Overall Score", "", assessment.score])
        ws.append(["Priority Concerns", ", ".join(assessment.prioritized_concerns)])
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def build_progress_excel(history: list) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.title = "Progress History"
    ws.append(["Date", "Score"])
    _style_header_row(ws, 1, 2)
    for a in history:
        ws.append([a.created_at.strftime("%Y-%m-%d"), a.score])
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def build_products_excel(products: list) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.title = "Product Recommendations"
    ws.append(["Product", "Brand", "Category", "Price", "Score", "Why"])
    _style_header_row(ws, 1, 6)
    for p in products:
        ws.append([p["name"], p.get("brand", ""), p["category"], p["price"], p["score"], "; ".join(p.get("reasons", []))])
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()