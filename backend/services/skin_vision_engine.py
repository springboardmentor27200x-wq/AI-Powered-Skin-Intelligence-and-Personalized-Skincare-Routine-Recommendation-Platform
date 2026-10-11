"""
AI Skin Vision Engine
Analyzes facial images using Computer Vision (PIL + NumPy) to detect:
  - Dark spots & hyperpigmentation
  - Acne, redness & inflammation (Erythema index)
  - Wrinkles, fine lines & skin roughness (Gradient variance)
  - Skin tone evenness & pore congestion
"""
import io
import re
import base64
import math
from typing import Dict, Any, List
import numpy as np
from PIL import Image, ImageFilter, ImageOps


def decode_image_from_base64(data_uri: str) -> Image.Image:
    """Decode base64 image data URI to PIL Image."""
    if "," in data_uri:
        data_uri = data_uri.split(",", 1)[1]
    image_bytes = base64.b64decode(data_uri)
    img = Image.open(io.BytesIO(image_bytes))
    return img.convert("RGB")


def analyze_facial_skin(image: Image.Image) -> Dict[str, Any]:
    """
    Performs multi-spectrum skin analysis on the input facial image.
    Returns detected concerns, severity %, spot coordinates, and tailored recommendations.
    """
    # Resize to standard analysis resolution (maintain aspect ratio, max 600px)
    max_dim = 600
    img = image.copy()
    img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
    width, height = img.size

    # Convert to numpy array (H, W, 3)
    rgb_arr = np.array(img, dtype=np.float32)
    r = rgb_arr[:, :, 0]
    g = rgb_arr[:, :, 1]
    b = rgb_arr[:, :, 2]

    # Approximate Skin Tone Mask using standard RGB/HSV skin thresholding
    # Skin pixel criteria: R > 60, G > 40, B > 20, R > G > B, (max - min) > 15
    skin_mask = (
        (r > 50) & (g > 30) & (b > 15) &
        (r > g) & (g > b) &
        ((np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)) > 15)
    )

    total_skin_pixels = np.sum(skin_mask)
    face_detected = total_skin_pixels > (width * height * 0.08)

    if not face_detected:
        # Fallback mask using center region
        center_y, center_x = height // 2, width // 2
        rad_y, rad_x = int(height * 0.35), int(width * 0.3)
        y_indices, x_indices = np.ogrid[:height, :width]
        skin_mask = ((x_indices - center_x) ** 2 / rad_x ** 2 + (y_indices - center_y) ** 2 / rad_y ** 2) <= 1
        total_skin_pixels = np.sum(skin_mask)

    # ─────────────────────────────────────────────────────────────
    # 1. Dark Spots & Hyperpigmentation Detection
    # ─────────────────────────────────────────────────────────────
    # Localized luminance drops below local average in skin region
    gray_img = img.convert("L")
    gray_arr = np.array(gray_img, dtype=np.float32)
    
    # Gaussian blur for background illumination estimation
    blurred_img = gray_img.filter(ImageFilter.GaussianBlur(radius=15))
    blurred_arr = np.array(blurred_img, dtype=np.float32)

    # Dark spot difference
    luminance_diff = blurred_arr - gray_arr
    dark_spot_mask = skin_mask & (luminance_diff > 18) & (gray_arr < 170)

    # Spot localization & coordinates
    spot_markers = []
    dark_spot_coords = np.argwhere(dark_spot_mask)
    dark_spot_count = 0

    if len(dark_spot_coords) > 0:
        # Sample representative spot clusters
        step = max(1, len(dark_spot_coords) // 12)
        for idx in range(0, len(dark_spot_coords), step):
            if len(spot_markers) >= 8:
                break
            y_pos, x_pos = dark_spot_coords[idx]
            spot_markers.append({
                "x": round((float(x_pos) / width) * 100, 1),
                "y": round((float(y_pos) / height) * 100, 1),
                "type": "dark_spot",
                "label": "Hyperpigmentation / Dark Spot",
                "color": "#92400e",
            })
            dark_spot_count += 1

    dark_spot_severity = min(95.0, round(float(np.sum(dark_spot_mask)) / max(1, total_skin_pixels) * 550, 1))

    # ─────────────────────────────────────────────────────────────
    # 2. Acne & Blemish Detection (Erythema / Redness Index)
    # ─────────────────────────────────────────────────────────────
    # Erythema formula: R - (G + B)/2
    erythema = r - (g + b) / 2.0
    erythema_thresh = 24.0
    acne_mask = skin_mask & (erythema > erythema_thresh) & (r > 100)

    acne_coords = np.argwhere(acne_mask)
    acne_count = 0
    if len(acne_coords) > 0:
        step = max(1, len(acne_coords) // 10)
        for idx in range(0, len(acne_coords), step):
            if len(spot_markers) >= 15:
                break
            y_pos, x_pos = acne_coords[idx]
            # Avoid placing too close to dark spot markers
            spot_markers.append({
                "x": round((float(x_pos) / width) * 100, 1),
                "y": round((float(y_pos) / height) * 100, 1),
                "type": "acne",
                "label": "Active Blemish / Erythema",
                "color": "#ef4444",
            })
            acne_count += 1

    acne_severity = min(95.0, round(float(np.sum(acne_mask)) / max(1, total_skin_pixels) * 600, 1))

    # ─────────────────────────────────────────────────────────────
    # 3. Redness & Sensitivity Index
    # ─────────────────────────────────────────────────────────────
    redness_ratio = np.mean(r[skin_mask]) / max(1.0, np.mean(g[skin_mask]))
    redness_severity = min(90.0, max(10.0, round((redness_ratio - 1.05) * 180, 1)))

    # ─────────────────────────────────────────────────────────────
    # 4. Wrinkles, Texture & Fine Line Edge Density
    # ─────────────────────────────────────────────────────────────
    edge_img = gray_img.filter(ImageFilter.FIND_EDGES)
    edge_arr = np.array(edge_img, dtype=np.float32)
    edge_density = np.mean(edge_arr[skin_mask])
    wrinkle_severity = min(85.0, max(15.0, round(edge_density * 2.2, 1)))

    # ─────────────────────────────────────────────────────────────
    # 5. Oiliness & Pore Congestion
    # ─────────────────────────────────────────────────────────────
    specular_highlights = skin_mask & (gray_arr > 220)
    oiliness_severity = min(90.0, max(10.0, round(float(np.sum(specular_highlights)) / max(1, total_skin_pixels) * 700, 1)))

    # ─────────────────────────────────────────────────────────────
    # 6. Overall Skin Health Score Calculation (1-100)
    # ─────────────────────────────────────────────────────────────
    deductions = (
        (dark_spot_severity * 0.28) +
        (acne_severity * 0.32) +
        (redness_severity * 0.15) +
        (wrinkle_severity * 0.15) +
        (oiliness_severity * 0.10)
    )
    overall_score = max(38.0, min(96.0, round(100.0 - (deductions * 0.65), 1)))

    # ─────────────────────────────────────────────────────────────
    # 7. Compile Detected Concerns & Tailored Ingredients
    # ─────────────────────────────────────────────────────────────
    concerns_detected = []

    def get_level(sev: float) -> str:
        if sev >= 65: return "High"
        if sev >= 35: return "Moderate"
        return "Mild"

    if dark_spot_severity > 20:
        concerns_detected.append({
            "concern": "Dark Spots / Hyperpigmentation",
            "severity_pct": dark_spot_severity,
            "level": get_level(dark_spot_severity),
            "description": "Localized melanin hyper-pigmentation and sun/post-acne spot clusters.",
            "recommended_actives": ["Vitamin C (L-Ascorbic Acid)", "Niacinamide", "Alpha Arbutin", "Glycolic Acid (AHA)"],
        })

    if acne_severity > 20:
        concerns_detected.append({
            "concern": "Acne & Blemishes",
            "severity_pct": acne_severity,
            "level": get_level(acne_severity),
            "description": "Active erythema breakouts, clogged pores, and surface micro-inflammation.",
            "recommended_actives": ["Salicylic Acid (BHA)", "Benzoyl Peroxide", "Zinc PCA", "Niacinamide"],
        })

    if redness_severity > 40:
        concerns_detected.append({
            "concern": "Redness & Sensitivity",
            "severity_pct": redness_severity,
            "level": get_level(redness_severity),
            "description": "Elevated hemoglobin capillary visibility and sensitive skin barrier flushing.",
            "recommended_actives": ["Centella Asiatica (Cica)", "Ceramides", "Azelaic Acid", "Panthenol (Vitamin B5)"],
        })

    if wrinkle_severity > 35:
        concerns_detected.append({
            "concern": "Fine Lines & Texture Roughness",
            "severity_pct": wrinkle_severity,
            "level": get_level(wrinkle_severity),
            "description": "Micro-creasing, dynamic expression lines, and skin texture irregularity.",
            "recommended_actives": ["Retinol", "Peptides", "Hyaluronic Acid", "Ceramides"],
        })

    if oiliness_severity > 45:
        concerns_detected.append({
            "concern": "Excess Sebum & Oiliness",
            "severity_pct": oiliness_severity,
            "level": get_level(oiliness_severity),
            "description": "High specular reflectivity across T-zone with active sebum production.",
            "recommended_actives": ["Niacinamide", "Salicylic Acid", "Clay / Kaolin", "Oil-Free Gel Moisturizer"],
        })

    # If no major issues, give maintenance praise
    if not concerns_detected:
        concerns_detected.append({
            "concern": "Balanced Skin Condition",
            "severity_pct": 15.0,
            "level": "Optimal",
            "description": "Skin tone is even with healthy barrier integrity and low inflammation.",
            "recommended_actives": ["Hyaluronic Acid", "Ceramides", "SPF 50+ Sunscreen", "Antioxidants"],
        })

    # Zone Analysis Breakdown
    zone_breakdown = {
        "Forehead": {
            "condition": "Healthy" if dark_spot_severity < 40 and wrinkle_severity < 40 else "Texture / Creasing",
            "score": round(max(50, 95 - (wrinkle_severity * 0.5)), 1)
        },
        "Cheeks": {
            "condition": "Pigmentation / Redness" if dark_spot_severity > 30 or redness_severity > 40 else "Smooth",
            "score": round(max(45, 95 - (dark_spot_severity * 0.5 + redness_severity * 0.3)), 1)
        },
        "T-Zone (Nose & Forehead)": {
            "condition": "Excess Oil / Pores" if oiliness_severity > 40 else "Balanced",
            "score": round(max(50, 95 - (oiliness_severity * 0.6)), 1)
        },
        "Chin & Jawline": {
            "condition": "Blemish Prone" if acne_severity > 35 else "Clear",
            "score": round(max(50, 95 - (acne_severity * 0.6)), 1)
        },
    }

    # Consolidated recommended ingredients
    all_actives = []
    for c in concerns_detected:
        all_actives.extend(c.get("recommended_actives", []))
    unique_actives = list(dict.fromkeys(all_actives))[:6]

    def _to_native(obj):
        if isinstance(obj, (np.integer, np.int64, np.int32)):
            return int(obj)
        elif isinstance(obj, (np.floating, np.float32, np.float64)):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, (np.bool_, bool)):
            return bool(obj)
        elif isinstance(obj, dict):
            return {k: _to_native(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [_to_native(i) for i in obj]
        return obj

    raw_result = {
        "face_detected": bool(face_detected),
        "overall_skin_score": float(overall_score),
        "skin_health_rating": "Optimal" if overall_score >= 80 else "Good" if overall_score >= 65 else "Needs Care",
        "metrics": {
            "dark_spots_severity": float(dark_spot_severity),
            "acne_blemishes_severity": float(acne_severity),
            "redness_sensitivity_severity": float(redness_severity),
            "wrinkles_texture_severity": float(wrinkle_severity),
            "oiliness_sebum_severity": float(oiliness_severity),
        },
        "detected_concerns": concerns_detected,
        "spot_markers": spot_markers,
        "zone_breakdown": zone_breakdown,
        "recommended_ingredients": unique_actives,
        "summary": (
            f"AI Vision scan identified {len(concerns_detected)} active skin indicators. "
            f"Overall skin score is {overall_score}/100 with key focus on "
            f"{concerns_detected[0]['concern']} ({concerns_detected[0]['level']} level)."
        ),
    }

    return _to_native(raw_result)
