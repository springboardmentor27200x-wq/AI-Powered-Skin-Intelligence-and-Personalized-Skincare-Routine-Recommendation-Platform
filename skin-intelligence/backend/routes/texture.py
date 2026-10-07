"""
Texture Analysis Routes — AI Skin Vision & Texture Scanner
-----------------------------------------------------------
Endpoints:
  POST /api/texture/analyze       — Single photo upload or camera snapshot
  POST /api/texture/analyze-multi — 3-Angle Facial Scan (Front, Left Turn, Right Turn)
  GET  /api/texture/history       — Past texture scans history for current user
  POST /api/texture/sync-profile  — Sync texture diagnosis with core user profile
"""

import json
import base64
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models.user import User
from models.skin_profile import SkinProfile
from models.skin_texture import SkinTextureAnalysis
from schemas import SkinTextureAnalysisOut
from utils.auth import get_current_user
from services.skin_texture_analyzer import SkinTextureAnalyzer

router = APIRouter(prefix="/api/texture", tags=["Skin Texture Vision Scanner"])


class Base64AnalyzeRequest(BaseModel):
    image_base64: str
    angle: Optional[str] = "front"


class MultiAngleAnalyzeRequest(BaseModel):
    front: str
    left: str
    right: str


def _clean_b64(b64_str: str) -> bytes:
    if "," in b64_str:
        b64_str = b64_str.split(",", 1)[1]
    return base64.b64decode(b64_str)


@router.post("/analyze", response_model=SkinTextureAnalysisOut)
async def analyze_skin_texture(
    file: Optional[UploadFile] = File(None),
    payload: Optional[Base64AnalyzeRequest] = Body(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    image_bytes = None

    if file and file.filename:
        image_bytes = await file.read()
    elif payload and payload.image_base64:
        try:
            image_bytes = _clean_b64(payload.image_base64)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid base64 image encoding."
            )

    if not image_bytes or len(image_bytes) < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid image provided. Please upload a clear photo of your skin."
        )

    try:
        results = SkinTextureAnalyzer.analyze_image_bytes(image_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Image texture processing error: {str(e)}"
        )

    diagnostics_str = json.dumps(results.get("diagnostics", {}))
    
    db_record = SkinTextureAnalysis(
        user_id=current_user.id,
        smoothness_score=results["smoothness_score"],
        roughness_score=results["roughness_score"],
        pore_visibility_score=results["pore_visibility_score"],
        pore_density_score=results["pore_density_score"],
        oiliness_shine_score=results["oiliness_shine_score"],
        redness_erythema_score=results["redness_erythema_score"],
        fine_lines_score=results["fine_lines_score"],
        overall_texture_score=results["overall_texture_score"],
        texture_type=results["texture_type"],
        primary_concern=results["primary_concern"],
        analysis_summary=results["analysis_summary"],
        diagnostics_json=diagnostics_str,
        heatmap_overlay_base64=results["overlays"].get("roughness_heatmap"),
        pore_overlay_base64=results["overlays"].get("pore_map"),
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)

    # Auto-synchronize and calibrate Skin Assessment module with the new texture score
    try:
        from routes.assessment import compute_and_save_assessment
        compute_and_save_assessment(current_user.id, db)
    except Exception as e:
        print(f"Auto-assessment sync note: {e}")

    return {
        **results,
        "id": db_record.id,
        "created_at": db_record.created_at,
    }


@router.post("/analyze-multi", response_model=SkinTextureAnalysisOut)
async def analyze_multi_angle_skin_texture(
    payload: MultiAngleAnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        front_bytes = _clean_b64(payload.front)
        left_bytes = _clean_b64(payload.left)
        right_bytes = _clean_b64(payload.right)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid base64 encoding in multi-angle payload."
        )

    try:
        results = SkinTextureAnalyzer.analyze_multi_angle(front_bytes, left_bytes, right_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Multi-angle skin processing error: {str(e)}"
        )

    diagnostics_str = json.dumps(results.get("diagnostics", {}))
    
    db_record = SkinTextureAnalysis(
        user_id=current_user.id,
        smoothness_score=results["smoothness_score"],
        roughness_score=results["roughness_score"],
        pore_visibility_score=results["pore_visibility_score"],
        pore_density_score=results["pore_density_score"],
        oiliness_shine_score=results["oiliness_shine_score"],
        redness_erythema_score=results["redness_erythema_score"],
        fine_lines_score=results["fine_lines_score"],
        overall_texture_score=results["overall_texture_score"],
        texture_type=results["texture_type"],
        primary_concern=results["primary_concern"],
        analysis_summary=results["analysis_summary"],
        diagnostics_json=diagnostics_str,
        heatmap_overlay_base64=results["overlays"].get("roughness_heatmap"),
        pore_overlay_base64=results["overlays"].get("pore_map"),
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)

    # Auto-synchronize and calibrate Skin Assessment module with the new multi-angle texture score
    try:
        from routes.assessment import compute_and_save_assessment
        compute_and_save_assessment(current_user.id, db)
    except Exception as e:
        print(f"Auto-assessment sync note: {e}")

    return {
        **results,
        "id": db_record.id,
        "created_at": db_record.created_at,
    }


@router.get("/history", response_model=List[SkinTextureAnalysisOut])
def get_texture_history(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    records = (
        db.query(SkinTextureAnalysis)
        .filter(SkinTextureAnalysis.user_id == current_user.id)
        .order_by(SkinTextureAnalysis.created_at.desc())
        .limit(limit)
        .all()
    )
    
    out_list = []
    for r in records:
        diag = {}
        if r.diagnostics_json:
            try:
                diag = json.loads(r.diagnostics_json)
            except Exception:
                pass

        out_list.append({
            "id": r.id,
            "smoothness_score": r.smoothness_score,
            "roughness_score": r.roughness_score,
            "pore_visibility_score": r.pore_visibility_score,
            "pore_density_score": r.pore_density_score,
            "oiliness_shine_score": r.oiliness_shine_score,
            "redness_erythema_score": r.redness_erythema_score,
            "fine_lines_score": r.fine_lines_score,
            "overall_texture_score": r.overall_texture_score,
            "texture_type": r.texture_type,
            "primary_concern": r.primary_concern,
            "analysis_summary": r.analysis_summary,
            "diagnostics": diag,
            "overlays": {
                "roughness_heatmap": r.heatmap_overlay_base64 or "",
                "pore_map": r.pore_overlay_base64 or ""
            },
            "created_at": r.created_at
        })
    return out_list


@router.post("/sync-profile")
def sync_texture_with_profile(
    scan_id: int = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scan = (
        db.query(SkinTextureAnalysis)
        .filter(SkinTextureAnalysis.id == scan_id, SkinTextureAnalysis.user_id == current_user.id)
        .first()
    )
    if not scan:
        raise HTTPException(status_code=404, detail="Scan record not found.")

    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Skin profile not found.")

    if scan.oiliness_shine_score > 65:
        inferred_type = "Oily"
    elif scan.roughness_score > 55 and scan.oiliness_shine_score < 30:
        inferred_type = "Dry"
    elif scan.redness_erythema_score > 50:
        inferred_type = "Sensitive"
    elif scan.oiliness_shine_score > 50 and scan.roughness_score > 35:
        inferred_type = "Combination"
    else:
        inferred_type = "Normal"

    profile.skin_type = inferred_type
    
    current_concerns = profile.skin_concerns or []
    if scan.primary_concern and scan.primary_concern not in current_concerns:
        current_concerns.append(scan.primary_concern)
    profile.skin_concerns = current_concerns

    db.commit()
    return {"message": "Skin profile updated with texture insights", "skin_type": inferred_type}
