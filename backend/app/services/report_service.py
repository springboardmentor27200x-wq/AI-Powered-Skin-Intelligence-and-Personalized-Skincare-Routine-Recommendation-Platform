"""
DermaIQ Report & Export Service — Module 11
===========================================
Generates structured clinical skincare reports in PDF, Excel, and JSON formats.
Includes:
- 1. Skin Assessment Report
- 2. Routine Report
- 3. Product Recommendation Report
- 4. Progress Report
- 5. 5-Pillar Skin Health Report
Enforces clinical disclaimers, clear AI-generated labels, and professional styling.
"""
from __future__ import annotations

import io
import uuid
from datetime import datetime, date, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.user import User
from app.models.assessment import SkinAssessment, AssessmentConcern, RiskFactor, SkinScore
from app.models.skin_profile import SkinProfile
from app.models.routine import Routine, RoutineStep
from app.models.product import ProductRecommendation, Product
from app.models.progress import ProgressSnapshot
from app.models.report import ReportRecord, ReportType, ExportFormat
from app.services.routine_service import RoutineService
from app.services.progress_service import ProgressService
from app.services.intelligence import summary_engine


class ReportService:

    @classmethod
    async def gather_report_data(
        cls,
        db: Session,
        user: User,
        report_type: ReportType,
        assessment_id: Optional[uuid.UUID] = None,
        include_ai_summary: bool = True,
    ) -> Dict[str, Any]:
        """
        Compiles all clinical data required for the given report type.
        """
        # 1. User & Skin Profile Context
        profile_name = user.profile.name if user.profile else user.email.split("@")[0]
        skin_prof = db.query(SkinProfile).filter(SkinProfile.user_id == user.id).first()
        skin_type = skin_prof.skin_type if skin_prof else "Not Specified"
        
        allergies_raw = skin_prof.allergies if skin_prof and skin_prof.allergies else []
        if isinstance(allergies_raw, str):
            allergies = [a.strip() for a in allergies_raw.split(",") if a.strip()]
        elif isinstance(allergies_raw, list):
            allergies = allergies_raw
        else:
            allergies = []

        sensitivities_raw = skin_prof.sensitivities if skin_prof and skin_prof.sensitivities else []
        if isinstance(sensitivities_raw, str):
            sensitivities = [s.strip() for s in sensitivities_raw.split(",") if s.strip()]
        elif isinstance(sensitivities_raw, list):
            sensitivities = sensitivities_raw
        else:
            sensitivities = []

        # 2. Assessment
        if assessment_id:
            assessment = db.query(SkinAssessment).filter(
                SkinAssessment.id == assessment_id,
                SkinAssessment.user_id == user.id,
            ).first()
        else:
            assessment = (
                db.query(SkinAssessment)
                .filter(SkinAssessment.user_id == user.id, SkinAssessment.status == "COMPLETED")
                .order_by(desc(SkinAssessment.created_at))
                .first()
            )

        overall_score = assessment.overall_score if assessment else 0
        scores_data: Dict[str, Any] = {}
        concerns_data: List[Dict[str, Any]] = []
        risks_data: List[Dict[str, Any]] = []

        if assessment:
            if assessment.scores:
                sc = assessment.scores
                scores_data = {
                    "overall_score": assessment.overall_score,
                    "skin_condition_score": sc.skin_condition_score,
                    "lifestyle_score": sc.lifestyle_score,
                    "sleep_score": sc.sleep_score,
                    "routine_consistency_score": sc.routine_consistency_score,
                    "hydration_score": sc.hydration_score,
                }
            for c in (assessment.concerns or []):
                concerns_data.append({
                    "concern_name": c.concern_name,
                    "priority": c.priority,
                    "severity": c.severity,
                    "confidence": round(float(c.confidence), 2) if c.confidence else 0.85,
                    "reasons": c.reasons or [],
                })
            for r in (assessment.risk_factors or []):
                risks_data.append({
                    "factor_type": r.factor_type,
                    "factor_name": r.factor_name,
                    "impact_level": r.impact_level,
                    "description": r.description or "",
                })

        # 3. Routines
        routines = (
            db.query(Routine)
            .filter(Routine.user_id == user.id, Routine.is_active == True)
            .order_by(Routine.routine_type)
            .all()
        )
        routine_steps_data: List[Dict[str, Any]] = []
        for r in routines:
            for s in r.steps:
                routine_steps_data.append({
                    "routine_type": r.routine_type,
                    "step_order": s.step_order,
                    "category": s.category,
                    "title": s.title,
                    "frequency": s.frequency,
                    "key_actives": s.key_actives or [],
                    "safety_notes": s.safety_notes or "",
                })

        # 4. Products
        recs = (
            db.query(ProductRecommendation)
            .filter(ProductRecommendation.user_id == user.id)
            .order_by(desc(ProductRecommendation.created_at))
            .limit(10)
            .all()
        )
        products_data: List[Dict[str, Any]] = []
        for rec in recs:
            p = rec.product
            score = getattr(rec, "match_score", None) or getattr(rec, "suitability_score", 85)
            matching_reasons = getattr(rec, "reasons", None) or getattr(rec, "matching_reasons", []) or []
            products_data.append({
                "product_name": p.name if p else "Curated Active",
                "brand": p.brand if p else "DermaIQ Selected",
                "category": p.category if p else "Skincare Active",
                "suitability_score": score,
                "matching_reasons": matching_reasons,
                "price": float(p.price) if p and p.price else None,
            })

        # 5. Adherence & Progress History
        target_uid = uuid.UUID(str(user.id))
        adherence_stats = ProgressService.get_adherence_stats(db, target_uid)
        history_items = ProgressService.get_assessment_history(db, target_uid, limit=5)

        # 6. AI Summary
        ai_summary_text = ""
        if include_ai_summary:
            summary_ctx = {
                "report_type": report_type.value.replace("_", " ").title(),
                "overall_score": overall_score,
                "user_name": profile_name,
                "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
                "scores": scores_data,
                "concerns": concerns_data,
            }
            try:
                ai_summary_text = await summary_engine.generate_report_executive_summary(summary_ctx)
            except Exception:
                ai_summary_text = summary_engine._rule_report_executive_summary(summary_ctx)

        title_map = {
            ReportType.SKIN_ASSESSMENT: "Clinical Skin Assessment Report",
            ReportType.PERSONALIZED_ROUTINE: "Personalized Regimen & Routine Report",
            ReportType.PRODUCT_RECOMMENDATION: "Product Suitability & Compatibility Report",
            ReportType.PROGRESS_LONGITUDINAL: "Longitudinal Progress & Adherence Report",
            ReportType.COMPREHENSIVE_5PILLAR: "Comprehensive 5-Pillar Skin Health Report",
        }

        return {
            "report_type": report_type.value,
            "title": title_map.get(report_type, "DermaIQ Skincare Intelligence Report"),
            "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
            "user_name": profile_name,
            "user_email": user.email,
            "skin_type": skin_type,
            "allergies": allergies,
            "sensitivities": sensitivities,
            "overall_score": overall_score,
            "scores": scores_data,
            "concerns": concerns_data,
            "risks": risks_data,
            "routine_steps": routine_steps_data,
            "products": products_data,
            "adherence": adherence_stats.model_dump() if adherence_stats else {},
            "history": [h.model_dump() for h in history_items],
            "ai_summary": ai_summary_text,
            "disclaimer": (
                "IMPORTANT MEDICAL DISCLAIMER: This report contains AI-generated skincare intelligence "
                "and personalized wellness insights. It is provided for informational and planning purposes "
                "only and does NOT constitute medical diagnosis, advice, or treatment. Users with persistent, "
                "painful, or severe dermatological conditions should seek direct clinical evaluation from a qualified dermatologist."
            ),
        }

    # ── PDF Generation ────────────────────────────────────────────────────────

    @classmethod
    def generate_pdf(cls, data: Dict[str, Any]) -> io.BytesIO:
        """
        Creates a high-quality clinical PDF document with DermaIQ branding,
        styled tables, score metrics, and clear disclaimers.
        """
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.lib.units import inch
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
        )
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36,
        )

        styles = getSampleStyleSheet()

        # Custom Brand Styles
        brand_color = colors.HexColor("#8b7355")
        dark_text = colors.HexColor("#2c2417")
        light_bg = colors.HexColor("#faf8f5")
        border_color = colors.HexColor("#e8e4dc")

        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=dark_text,
        )
        subtitle_style = ParagraphStyle(
            "DocSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=brand_color,
        )
        heading_style = ParagraphStyle(
            "DocHeading",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=17,
            textColor=dark_text,
            spaceBefore=12,
            spaceAfter=6,
        )
        body_style = ParagraphStyle(
            "DocBody",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=13,
            textColor=dark_text,
        )
        summary_style = ParagraphStyle(
            "DocSummary",
            parent=styles["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#4a3e2e"),
        )
        disclaimer_style = ParagraphStyle(
            "DocDisclaimer",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=10,
            textColor=colors.HexColor("#7a6d5d"),
        )

        story = []

        # Header Banner
        header_table = Table(
            [
                [
                    Paragraph("<b>DERMAIQ INTELLIGENCE</b>", title_style),
                    Paragraph(f"<b>Generated:</b> {data['generated_at']}", subtitle_style),
                ],
                [
                    Paragraph(f"<b>{data['title']}</b>", subtitle_style),
                    Paragraph(f"<b>Patient:</b> {data['user_name']}", body_style),
                ],
            ],
            colWidths=[3.8 * inch, 3.4 * inch],
        )
        header_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 8))
        story.append(HRFlowable(width="100%", thickness=1.5, color=brand_color, spaceBefore=4, spaceAfter=10))

        # Executive Summary Box
        if data.get("ai_summary"):
            summary_content = [
                Paragraph("<b>EXECUTIVE CLINICAL BRIEFING</b>", heading_style),
                Paragraph(data["ai_summary"].replace("\n", "<br/>"), summary_style),
            ]
            summary_box = Table(
                [[summary_content]],
                colWidths=[7.2 * inch],
            )
            summary_box.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), light_bg),
                ("BOX", (0, 0), (-1, -1), 1, border_color),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ]))
            story.append(summary_box)
            story.append(Spacer(1, 12))

        # 5-Pillar Score Breakdown Table
        scores = data.get("scores", {})
        if scores:
            story.append(Paragraph("<b>5-Pillar Skin Health Evaluation</b>", heading_style))
            score_rows = [
                [
                    Paragraph("<b>Pillar Metric</b>", body_style),
                    Paragraph("<b>Score (0-100)</b>", body_style),
                    Paragraph("<b>Official Weight</b>", body_style),
                    Paragraph("<b>Contribution</b>", body_style),
                ],
                [
                    Paragraph("Skin Condition", body_style),
                    Paragraph(str(scores.get("skin_condition_score", "N/A")), body_style),
                    Paragraph("35%", body_style),
                    Paragraph(f"{scores.get('skin_condition_score', 0) * 0.35:.1f}", body_style),
                ],
                [
                    Paragraph("Routine Consistency", body_style),
                    Paragraph(str(scores.get("routine_consistency_score", "N/A")), body_style),
                    Paragraph("20%", body_style),
                    Paragraph(f"{scores.get('routine_consistency_score', 0) * 0.20:.1f}", body_style),
                ],
                [
                    Paragraph("Lifestyle Habits", body_style),
                    Paragraph(str(scores.get("lifestyle_score", "N/A")), body_style),
                    Paragraph("20%", body_style),
                    Paragraph(f"{scores.get('lifestyle_score', 0) * 0.20:.1f}", body_style),
                ],
                [
                    Paragraph("Sleep Quality", body_style),
                    Paragraph(str(scores.get("sleep_score", "N/A")), body_style),
                    Paragraph("15%", body_style),
                    Paragraph(f"{scores.get('sleep_score', 0) * 0.15:.1f}", body_style),
                ],
                [
                    Paragraph("Hydration Balance", body_style),
                    Paragraph(str(scores.get("hydration_score", "N/A")), body_style),
                    Paragraph("10%", body_style),
                    Paragraph(f"{scores.get('hydration_score', 0) * 0.10:.1f}", body_style),
                ],
                [
                    Paragraph("<b>Composite Score</b>", body_style),
                    Paragraph(f"<b>{data.get('overall_score', 0)}/100</b>", body_style),
                    Paragraph("100%", body_style),
                    Paragraph(f"<b>{data.get('overall_score', 0):.1f}</b>", body_style),
                ],
            ]
            score_table = Table(score_rows, colWidths=[2.8 * inch, 1.4 * inch, 1.4 * inch, 1.6 * inch])
            score_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eee8de")),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("GRID", (0, 0), (-1, -1), 0.5, border_color),
                ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#f5f0e8")),
            ]))
            story.append(score_table)
            story.append(Spacer(1, 10))

        # Identified Concerns Table
        concerns = data.get("concerns", [])
        if concerns:
            story.append(Paragraph("<b>Identified Skin Concerns & Priorities</b>", heading_style))
            c_rows = [[
                Paragraph("<b>Concern</b>", body_style),
                Paragraph("<b>Priority</b>", body_style),
                Paragraph("<b>Severity (1-5)</b>", body_style),
                Paragraph("<b>AI Confidence</b>", body_style),
            ]]
            for c in concerns:
                c_rows.append([
                    Paragraph(c.get("concern_name", "").title(), body_style),
                    Paragraph(c.get("priority", "MEDIUM"), body_style),
                    Paragraph(str(c.get("severity", 3)), body_style),
                    Paragraph(f"{c.get('confidence', 0.85) * 100:.0f}%", body_style),
                ])
            c_table = Table(c_rows, colWidths=[2.8 * inch, 1.4 * inch, 1.4 * inch, 1.6 * inch])
            c_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eee8de")),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("GRID", (0, 0), (-1, -1), 0.5, border_color),
            ]))
            story.append(c_table)
            story.append(Spacer(1, 10))

        # Personalized Routine Steps Table
        steps = data.get("routine_steps", [])
        if steps:
            story.append(Paragraph("<b>Personalized Routine Protocol</b>", heading_style))
            r_rows = [[
                Paragraph("<b>Routine</b>", body_style),
                Paragraph("<b>Step</b>", body_style),
                Paragraph("<b>Category</b>", body_style),
                Paragraph("<b>Step Title & Actives</b>", body_style),
            ]]
            for s in steps[:8]:
                actives = ", ".join(s.get("key_actives", []))
                active_str = f"<br/><font color='#8b7355'>Actives: {actives}</font>" if actives else ""
                r_rows.append([
                    Paragraph(s.get("routine_type", "DAILY"), body_style),
                    Paragraph(str(s.get("step_order", 1)), body_style),
                    Paragraph(s.get("category", "CARE").replace("_", " ").title(), body_style),
                    Paragraph(f"<b>{s.get('title', '')}</b>{active_str}", body_style),
                ])
            r_table = Table(r_rows, colWidths=[1.4 * inch, 0.7 * inch, 1.7 * inch, 3.4 * inch])
            r_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eee8de")),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("GRID", (0, 0), (-1, -1), 0.5, border_color),
            ]))
            story.append(r_table)
            story.append(Spacer(1, 10))

        # Product Recommendations Table
        products = data.get("products", [])
        if products:
            story.append(Paragraph("<b>Recommended Formulations & Actives</b>", heading_style))
            p_rows = [[
                Paragraph("<b>Product</b>", body_style),
                Paragraph("<b>Brand</b>", body_style),
                Paragraph("<b>Category</b>", body_style),
                Paragraph("<b>Suitability</b>", body_style),
            ]]
            for p in products[:6]:
                p_rows.append([
                    Paragraph(p.get("product_name", ""), body_style),
                    Paragraph(p.get("brand", ""), body_style),
                    Paragraph(p.get("category", ""), body_style),
                    Paragraph(f"{p.get('suitability_score', 0)}%", body_style),
                ])
            p_table = Table(p_rows, colWidths=[2.8 * inch, 1.6 * inch, 1.6 * inch, 1.2 * inch])
            p_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eee8de")),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("GRID", (0, 0), (-1, -1), 0.5, border_color),
            ]))
            story.append(p_table)
            story.append(Spacer(1, 10))

        # Disclaimer Box (Footer)
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=0.8, color=border_color, spaceBefore=4, spaceAfter=8))
        story.append(Paragraph(data["disclaimer"], disclaimer_style))

        doc.build(story)
        buffer.seek(0)
        return buffer

    # ── Excel Generation ──────────────────────────────────────────────────────

    @classmethod
    def generate_excel(cls, data: Dict[str, Any]) -> io.BytesIO:
        """
        Creates a structured multi-sheet Excel workbook:
        Sheet 1: Summary & Patient Overview
        Sheet 2: Skin Assessment & Concerns
        Sheet 3: 5-Pillar Score Model
        Sheet 4: Personalized Routine
        Sheet 5: Product Recommendations
        Sheet 6: Progress & Adherence
        """
        from openpyxl import Workbook
        from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
        from openpyxl.utils import get_column_letter

        wb = Workbook()
        # Remove default sheet
        if wb.active is not None:
            wb.remove(wb.active)

        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        title_font = Font(name="Calibri", size=14, bold=True, color="2C2417")
        bold_font = Font(name="Calibri", size=11, bold=True)
        normal_font = Font(name="Calibri", size=10)

        header_fill = PatternFill(start_color="8B7355", end_color="8B7355", fill_type="solid")
        sub_fill = PatternFill(start_color="F5F0E8", end_color="F5F0E8", fill_type="solid")
        thin_border = Border(
            left=Side(style="thin", color="E8E4DC"),
            right=Side(style="thin", color="E8E4DC"),
            top=Side(style="thin", color="E8E4DC"),
            bottom=Side(style="thin", color="E8E4DC"),
        )

        def auto_fit(ws):
            for col in ws.columns:
                max_len = 0
                col_letter = get_column_letter(col[0].column)
                for cell in col:
                    val = str(cell.value or "")
                    if len(val) > max_len:
                        max_len = len(val)
                ws.column_dimensions[col_letter].width = max(max_len + 3, 12)

        # ── Sheet 1: Summary ──────────────────────────────────────────────────
        ws1 = wb.create_sheet(title="Executive Summary")
        ws1.append(["DermaIQ Intelligence & Personalized Skincare Planner"])
        ws1["A1"].font = title_font
        ws1.append([data["title"]])
        ws1["A2"].font = bold_font
        ws1.append(["Generated At:", data["generated_at"]])
        ws1.append(["Patient Name:", data["user_name"]])
        ws1.append(["Patient Email:", data["user_email"]])
        ws1.append(["Skin Type:", data["skin_type"]])
        ws1.append(["Overall Skin Score:", f"{data.get('overall_score', 0)}/100"])
        ws1.append([])
        ws1.append(["Clinical Executive Summary:"])
        ws1["A9"].font = bold_font
        ws1.append([data.get("ai_summary", "Clinical assessment generated by DermaIQ.")])
        ws1.append([])
        ws1.append(["Medical Disclaimer:"])
        ws1["A12"].font = bold_font
        ws1.append([data["disclaimer"]])
        auto_fit(ws1)

        # ── Sheet 2: Skin Assessment ──────────────────────────────────────────
        ws2 = wb.create_sheet(title="Skin Assessment")
        ws2.append(["Concern Name", "Priority", "Severity (1-5)", "Confidence"])
        for col_idx in range(1, 5):
            cell = ws2.cell(row=1, column=col_idx)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center")

        for c in data.get("concerns", []):
            ws2.append([
                c.get("concern_name", "").title(),
                c.get("priority", "MEDIUM"),
                c.get("severity", 3),
                f"{c.get('confidence', 0.85) * 100:.0f}%",
            ])
            for col_idx in range(1, 5):
                ws2.cell(row=ws2.max_row, column=col_idx).border = thin_border
        auto_fit(ws2)

        # ── Sheet 3: Skin Health Score ────────────────────────────────────────
        ws3 = wb.create_sheet(title="Skin Health Score")
        ws3.append(["Pillar", "Score (0-100)", "Official Weight", "Weighted Contribution"])
        for col_idx in range(1, 5):
            cell = ws3.cell(row=1, column=col_idx)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center")

        scores = data.get("scores", {})
        pillars = [
            ("Skin Condition", scores.get("skin_condition_score", 0), 0.35),
            ("Routine Consistency", scores.get("routine_consistency_score", 0), 0.20),
            ("Lifestyle Habits", scores.get("lifestyle_score", 0), 0.20),
            ("Sleep Quality", scores.get("sleep_score", 0), 0.15),
            ("Hydration Balance", scores.get("hydration_score", 0), 0.10),
        ]
        for name, val, w in pillars:
            ws3.append([name, val, f"{w*100:.0f}%", round(val * w, 1)])
            for col_idx in range(1, 5):
                ws3.cell(row=ws3.max_row, column=col_idx).border = thin_border

        ws3.append(["Composite Total", data.get("overall_score", 0), "100%", data.get("overall_score", 0)])
        for col_idx in range(1, 5):
            c = ws3.cell(row=ws3.max_row, column=col_idx)
            c.font = bold_font
            c.fill = sub_fill
            c.border = thin_border
        auto_fit(ws3)

        # ── Sheet 4: Routine Protocol ─────────────────────────────────────────
        ws4 = wb.create_sheet(title="Routine Protocol")
        ws4.append(["Routine Type", "Step Order", "Category", "Title", "Frequency", "Key Actives", "Safety Notes"])
        for col_idx in range(1, 8):
            cell = ws4.cell(row=1, column=col_idx)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center")

        for s in data.get("routine_steps", []):
            ws4.append([
                s.get("routine_type", "DAILY"),
                s.get("step_order", 1),
                s.get("category", "").title(),
                s.get("title", ""),
                s.get("frequency", "DAILY"),
                ", ".join(s.get("key_actives", [])),
                s.get("safety_notes", ""),
            ])
            for col_idx in range(1, 8):
                ws4.cell(row=ws4.max_row, column=col_idx).border = thin_border
        auto_fit(ws4)

        # ── Sheet 5: Products ─────────────────────────────────────────────────
        ws5 = wb.create_sheet(title="Product Recommendations")
        ws5.append(["Product Name", "Brand", "Category", "Suitability Score", "Matching Reasons", "Price ($)"])
        for col_idx in range(1, 7):
            cell = ws5.cell(row=1, column=col_idx)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center")

        for p in data.get("products", []):
            ws5.append([
                p.get("product_name", ""),
                p.get("brand", ""),
                p.get("category", ""),
                f"{p.get('suitability_score', 0)}%",
                "; ".join(p.get("matching_reasons", [])),
                p.get("price"),
            ])
            for col_idx in range(1, 7):
                ws5.cell(row=ws5.max_row, column=col_idx).border = thin_border
        auto_fit(ws5)

        # ── Sheet 6: Progress & History ───────────────────────────────────────
        ws6 = wb.create_sheet(title="Progress & Adherence")
        adh = data.get("adherence", {})
        ws6.append(["Adherence Metric", "Value"])
        ws6["A1"].font = header_font
        ws6["A1"].fill = header_fill
        ws6["B1"].font = header_font
        ws6["B1"].fill = header_fill

        ws6.append(["Today Completion", f"{adh.get('today_completed', 0)}/{adh.get('today_total', 0)} ({adh.get('today_percent', 0)}%)"])
        ws6.append(["Week Completion", f"{adh.get('week_completed', 0)}/{adh.get('week_total', 0)} ({adh.get('week_percent', 0)}%)"])
        ws6.append(["Day Streak", f"{adh.get('streak_days', 0)} consecutive days"])
        ws6.append([])

        ws6.append(["Assessment History"])
        ws6.cell(row=ws6.max_row, column=1).font = bold_font
        ws6.append(["Assessment Date", "Overall Score", "Top Concerns"])
        for col_idx in range(1, 4):
            c = ws6.cell(row=ws6.max_row, column=col_idx)
            c.font = header_font
            c.fill = header_fill

        for h in data.get("history", []):
            ws6.append([
                h.get("date", ""),
                h.get("overall_score", 0),
                ", ".join(h.get("top_concerns", [])),
            ])
        auto_fit(ws6)

        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        return buffer

    # ── Report Audit Record Creation ──────────────────────────────────────────

    @classmethod
    def record_export(
        cls,
        db: Session,
        user_id: uuid.UUID,
        report_type: ReportType,
        export_format: ExportFormat,
        title: str,
        assessment_id: Optional[uuid.UUID] = None,
        generated_by_id: Optional[uuid.UUID] = None,
    ) -> ReportRecord:
        record = ReportRecord(
            user_id=user_id,
            generated_by_id=generated_by_id or user_id,
            report_type=report_type,
            export_format=export_format,
            title=title,
            assessment_id=assessment_id,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @classmethod
    def get_report_history(cls, db: Session, user_id: uuid.UUID, limit: int = 50) -> List[ReportRecord]:
        return (
            db.query(ReportRecord)
            .filter(ReportRecord.user_id == user_id)
            .order_by(desc(ReportRecord.created_at))
            .limit(limit)
            .all()
        )
