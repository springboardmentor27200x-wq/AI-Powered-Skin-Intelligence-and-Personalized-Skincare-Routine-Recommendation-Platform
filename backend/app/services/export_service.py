import csv
import io
from fastapi.responses import StreamingResponse

class ExportService:
    @staticmethod
    def export_reports(db, user_id: int, format: str):
        # Fetch data for report (Assessments + Scores + Routines + Profiles)
        assessments = list(db["skin_assessments"].find({"user_id": user_id}))
        scores = list(db["skin_scores"].find({"user_id": user_id}))
        routines = list(db["skin_routines"].find({"user_id": user_id}))
        profile = db["skin_profiles"].find_one({"user_id": user_id}) or {}
        
        if format == "csv" or format == "excel":
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["Category", "Date", "Details"])
            
            # Skin Profile & Health Reports
            writer.writerow(["Profile (Skin Health)", str(profile.get("updated_at", "")), f"Skin Type: {profile.get('skin_type')}, Concerns: {', '.join(profile.get('concerns', []))}"])
            
            # Assessment Reports
            for a in assessments:
                writer.writerow(["Assessment", str(a.get("created_at")), a.get("overall_health_summary")])
            
            # Progress Reports (Scores)
            for s in scores:
                writer.writerow(["Progress (Score)", str(s.get("evaluated_at")), f"Score: {s.get('overall_score')}"])
                
            # Routine & Recommendation Reports
            for r in routines:
                writer.writerow(["Routine & Recommendations", str(r.get("created_at")), f"Steps: {len(r.get('morning_steps', []))} AM, {len(r.get('evening_steps', []))} PM"])
            
            output.seek(0)
            return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=skiniq_report_{user_id}.csv"})
        
        elif format == "pdf":
            # Returning as text/plain for simplicity since real PDF generation requires external libs
            text = f"SKIN HEALTH & PROGRESS REPORT (User ID: {user_id})\n=================================================\n\n"
            
            text += "1. SKIN PROFILE & HEALTH REPORT:\n"
            text += f"Skin Type: {profile.get('skin_type', 'N/A')}\n"
            text += f"Concerns: {', '.join(profile.get('concerns', []))}\n\n"
            
            text += "2. ASSESSMENT REPORTS:\n"
            for a in assessments:
                text += f"- {a.get('created_at')}: {a.get('overall_health_summary')}\n"
            
            text += "\n3. PROGRESS REPORTS (SCORES):\n"
            for s in scores:
                text += f"- {s.get('evaluated_at')}: Overall Score {s.get('overall_score')}/100\n"
                
            text += "\n4. ROUTINE & PRODUCT RECOMMENDATION REPORTS:\n"
            for r in routines:
                text += f"- {r.get('created_at')}: Prescribed {len(r.get('morning_steps', []))} AM products, {len(r.get('evening_steps', []))} PM products\n"
                
            return StreamingResponse(iter([text]), media_type="text/plain", headers={"Content-Disposition": f"attachment; filename=skiniq_report_{user_id}.txt"})
            
export_service = ExportService()
