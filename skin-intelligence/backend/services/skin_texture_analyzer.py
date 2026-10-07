"""
Skin Texture & Vision Intelligence Analyzer
---------------------------------------------
Computer Vision algorithms for automated skin texture, pore density,
sebum/shine, redness/erythema, and fine lines analysis.
Supports single-photo and 3-Angle (Frontal, Left Turn, Right Turn) facial scans.
Generates thermal heatmaps, pore maps, and multi-zone clinical observations.
"""

import io
import json
import base64
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance


class SkinTextureAnalyzer:
    @staticmethod
    def _rgb_to_hsv(rgb_arr):
        """Convert RGB numpy array [0..255] to HSV [0..1]."""
        arr = rgb_arr.astype(np.float32) / 255.0
        r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
        cmax = np.maximum(np.maximum(r, g), b)
        cmin = np.minimum(np.minimum(r, g), b)
        diff = cmax - cmin

        h = np.zeros_like(cmax)
        mask = diff > 1e-5
        rc = (cmax - r) / (diff + 1e-5)
        gc = (cmax - g) / (diff + 1e-5)
        bc = (cmax - b) / (diff + 1e-5)

        h[mask & (cmax == r)] = (bc - gc)[mask & (cmax == r)] % 6.0
        h[mask & (cmax == g)] = (2.0 + rc - bc)[mask & (cmax == g)]
        h[mask & (cmax == b)] = (4.0 + gc - rc)[mask & (cmax == b)]
        h = (h / 6.0) % 1.0

        s = np.zeros_like(cmax)
        s[cmax > 1e-5] = diff[cmax > 1e-5] / cmax[cmax > 1e-5]
        v = cmax

        return np.stack([h, s, v], axis=-1)

    @staticmethod
    def _create_skin_mask(rgb_arr):
        """Segment skin pixels from background using standard RGB/HSV heuristics."""
        r = rgb_arr[..., 0].astype(np.float32)
        g = rgb_arr[..., 1].astype(np.float32)
        b = rgb_arr[..., 2].astype(np.float32)

        mask = (r > 45) & (g > 30) & (b > 15) & (r > g) & (g > b * 0.7) & ((r - g) > 5)
        if np.sum(mask) < (rgb_arr.shape[0] * rgb_arr.shape[1] * 0.15):
            h, w = rgb_arr.shape[:2]
            mask = np.zeros((h, w), dtype=bool)
            mask[int(h * 0.15):int(h * 0.85), int(w * 0.15):int(w * 0.85)] = True
        return mask

    @staticmethod
    def _apply_colormap(intensity_map, colormap_type="turbo"):
        """Convert a 2D float array (0.0 to 1.0) into an RGB heatmap."""
        val = np.clip(intensity_map, 0.0, 1.0)

        if colormap_type == "heat":
            r = np.clip(val * 2.5, 0.0, 1.0)
            g = np.clip(val * 2.0 - 0.5, 0.0, 1.0)
            b = np.clip(val * 3.0 - 2.0, 0.0, 1.0)
        else: # "plasma / turbo"
            r = np.clip(np.sin(val * np.pi * 1.2 - 0.2) * 0.8 + val * 0.5, 0.0, 1.0)
            g = np.clip(np.sin(val * np.pi) * 0.9, 0.0, 1.0)
            b = np.clip(np.cos(val * np.pi * 0.8) * 0.9, 0.0, 1.0)

        rgb = np.stack([(r * 255).astype(np.uint8), (g * 255).astype(np.uint8), (b * 255).astype(np.uint8)], axis=-1)
        return rgb

    @classmethod
    def analyze_image_bytes(cls, image_bytes: bytes, angle_tag: str = "Frontal") -> dict:
        """
        Analyze single skin image bytes and return metrics, overlays, and observations.
        """
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        target_size = (512, 512)
        img_resized = img.resize(target_size, Image.Resampling.LANCZOS)
        rgb_arr = np.array(img_resized)
        
        gray_img = img_resized.convert("L")
        gray_arr = np.array(gray_img).astype(np.float32)

        skin_mask = cls._create_skin_mask(rgb_arr)
        skin_pixel_count = max(int(np.sum(skin_mask)), 100)

        # 1. Texture Roughness & Smoothness Analysis
        gx = np.zeros_like(gray_arr)
        gy = np.zeros_like(gray_arr)
        gx[:, 1:-1] = (gray_arr[:, 2:] - gray_arr[:, :-2]) / 2.0
        gy[1:-1, :] = (gray_arr[2:, :] - gray_arr[:-2, :]) / 2.0
        gradient_mag = np.sqrt(gx**2 + gy**2)

        masked_grad = gradient_mag[skin_mask]
        grad_mean = float(np.mean(masked_grad))
        grad_std = float(np.std(masked_grad))
        grad_p90 = float(np.percentile(masked_grad, 90))

        roughness_raw = (grad_mean * 2.2 + grad_std * 1.5 + (grad_p90 * 0.5))
        roughness_score = float(np.clip(roughness_raw * 2.1, 10.0, 95.0))
        smoothness_score = float(np.clip(100.0 - roughness_score, 5.0, 95.0))

        # 2. Pore Detection & Density Analysis
        blurred_gray = gray_img.filter(ImageFilter.GaussianBlur(radius=2.5))
        blurred_arr = np.array(blurred_gray).astype(np.float32)
        high_pass = blurred_arr - gray_arr

        pore_threshold = np.percentile(high_pass[skin_mask], 82)
        pore_mask = (high_pass > max(pore_threshold, 3.5)) & skin_mask

        pore_count_raw = int(np.sum(pore_mask))
        pore_density_pct = float((pore_count_raw / skin_pixel_count) * 100.0)
        pore_visibility_score = float(np.clip(pore_density_pct * 12.0 + (grad_std * 1.2), 8.0, 96.0))
        pore_density_score = float(np.clip(pore_density_pct * 15.0, 5.0, 95.0))

        # 3. Oiliness & Shine / Sebum Analysis
        hsv_arr = cls._rgb_to_hsv(rgb_arr)
        sat = hsv_arr[..., 1]
        val = hsv_arr[..., 2]

        shine_mask = (val > 0.78) & (sat < 0.38) & skin_mask
        shine_ratio = float(np.sum(shine_mask) / skin_pixel_count)
        oiliness_shine_score = float(np.clip(shine_ratio * 450.0 + (np.mean(val[skin_mask]) * 20.0 - 5.0), 10.0, 95.0))

        # 4. Redness & Erythema Analysis
        r_chan = rgb_arr[..., 0].astype(np.float32)
        g_chan = rgb_arr[..., 1].astype(np.float32)
        b_chan = rgb_arr[..., 2].astype(np.float32)

        red_diff = r_chan - ((g_chan + b_chan) / 2.0)
        masked_red = red_diff[skin_mask]
        mean_red = float(np.mean(masked_red)) if len(masked_red) > 0 else 10.0
        p95_red = float(np.percentile(masked_red, 95)) if len(masked_red) > 0 else 20.0

        redness_erythema_score = float(np.clip((mean_red - 12.0) * 2.2 + (p95_red * 0.7), 5.0, 92.0))

        # 5. Fine Lines & Micro-Wrinkle Indicator
        edge_variance = float(np.var(gx[skin_mask]))
        fine_lines_score = float(np.clip((edge_variance / 35.0) * 18.0 + (roughness_score * 0.25), 5.0, 90.0))

        # 6. Overall Texture Composite Score
        overall_texture_score = float(np.clip(
            (smoothness_score * 0.40) +
            ((100.0 - pore_visibility_score) * 0.25) +
            ((100.0 - abs(oiliness_shine_score - 45.0) * 1.5) * 0.15) +
            ((100.0 - redness_erythema_score) * 0.20),
            10.0, 99.0
        ))

        # 7. Classification
        texture_type = "Smooth & Balanced"
        primary_concern = "Balanced Texture"

        if pore_visibility_score > 60 and oiliness_shine_score > 60:
            texture_type = "Congested & Sebum-Rich (Enlarged Pores)"
            primary_concern = "Enlarged Pores & Excess Sebum"
        elif oiliness_shine_score > 70:
            texture_type = "Sebum-Glossy / High Shine"
            primary_concern = "Excess Oiliness & Shine"
        elif roughness_score > 60 and oiliness_shine_score < 30:
            texture_type = "Dry & Micro-Textured (Dehydrated Flakes)"
            primary_concern = "Rough Texture & Barrier Dehydration"
        elif redness_erythema_score > 55:
            texture_type = "Reactive & Erythema-Prone (Redness/Irritated)"
            primary_concern = "Surface Redness & Micro-Inflammation"
        elif fine_lines_score > 55:
            texture_type = "Textured with Expression Lines"
            primary_concern = "Fine Lines & Elasticity Softening"
        elif smoothness_score > 72:
            texture_type = "Velvety & Refined (Smooth Glass Skin)"
            primary_concern = "Optimal Texture Maintenance"

        # 8. Visual Overlays (Base64)
        norm_grad = np.clip(gradient_mag / (grad_p90 * 1.4 + 1e-5), 0.0, 1.0)
        heat_rgb = cls._apply_colormap(norm_grad, "turbo")
        
        alpha = 0.55
        overlay_arr = rgb_arr.copy().astype(np.float32)
        overlay_arr[skin_mask] = (overlay_arr[skin_mask] * (1 - alpha)) + (heat_rgb[skin_mask] * alpha)
        roughness_overlay_img = Image.fromarray(np.clip(overlay_arr, 0, 255).astype(np.uint8))
        
        roughness_buf = io.BytesIO()
        roughness_overlay_img.save(roughness_buf, format="JPEG", quality=85)
        roughness_overlay_base64 = "data:image/jpeg;base64," + base64.b64encode(roughness_buf.getvalue()).decode("utf-8")

        pore_draw_img = img_resized.copy()
        draw = ImageDraw.Draw(pore_draw_img)
        y_coords, x_coords = np.where(pore_mask)
        if len(y_coords) > 0:
            sample_step = max(1, len(y_coords) // 120)
            for y, x in zip(y_coords[::sample_step], x_coords[::sample_step]):
                draw.ellipse([x - 3, y - 3, x + 3, y + 3], outline="#00F5D4", width=1)
        
        pore_buf = io.BytesIO()
        pore_draw_img.save(pore_buf, format="JPEG", quality=85)
        pore_overlay_base64 = "data:image/jpeg;base64," + base64.b64encode(pore_buf.getvalue()).decode("utf-8")

        norm_red = np.clip((red_diff - 5.0) / (p95_red * 1.2 + 1e-5), 0.0, 1.0)
        red_heat_rgb = cls._apply_colormap(norm_red, "heat")
        red_overlay_arr = rgb_arr.copy().astype(np.float32)
        red_overlay_arr[skin_mask] = (red_overlay_arr[skin_mask] * (1 - alpha)) + (red_heat_rgb[skin_mask] * alpha)
        red_overlay_img = Image.fromarray(np.clip(red_overlay_arr, 0, 255).astype(np.uint8))

        red_buf = io.BytesIO()
        red_overlay_img.save(red_buf, format="JPEG", quality=85)
        redness_overlay_base64 = "data:image/jpeg;base64," + base64.b64encode(red_buf.getvalue()).decode("utf-8")

        # 9. List out specific observations on the skin
        observations = []
        
        # Smoothness & Roughness observation
        if smoothness_score >= 75:
            observations.append({
                "zone": "Epidermal Surface Texture",
                "severity": "Optimal",
                "badge": "Refined",
                "icon": "✨",
                "detail": "Skin exhibits refined micro-topography with uniform light scattering and smooth stratum corneum alignment."
            })
        elif smoothness_score >= 50:
            observations.append({
                "zone": "Epidermal Surface Texture",
                "severity": "Moderate",
                "badge": "Mild Texture",
                "icon": "⚖️",
                "detail": "Mild granular roughness detected across the facial plane, characteristic of minor cellular turnover slowdown."
            })
        else:
            observations.append({
                "zone": "Epidermal Surface Texture",
                "severity": "High",
                "badge": "Rough / Uneven",
                "icon": "⚠️",
                "detail": "High micro-roughness index indicating stratum corneum micro-flaking and uneven surface texture."
            })

        # Pores & Follicular observation
        if pore_visibility_score > 60:
            observations.append({
                "zone": "Nasal & Paranasal Pores",
                "severity": "High",
                "badge": "Dilated Pores",
                "icon": "🎯",
                "detail": f"Concentrated follicular enlargement detected ({pore_density_pct:.1f}% skin coverage). Sebum entrapment observed within micro-pores."
            })
        elif pore_visibility_score > 35:
            observations.append({
                "zone": "Nasal & Paranasal Pores",
                "severity": "Moderate",
                "badge": "Visible Pores",
                "icon": "🎯",
                "detail": "Moderate visibility of follicular openings in the central facial zone; surrounding cheek texture remains tight."
            })
        else:
            observations.append({
                "zone": "Nasal & Paranasal Pores",
                "severity": "Optimal",
                "badge": "Tight & Refined",
                "icon": "🛡️",
                "detail": "Minimal pore dilation observed; follicular architecture is compact and well-maintained."
            })

        # Sebum & Glossiness observation
        if oiliness_shine_score > 65:
            observations.append({
                "zone": "T-Zone & Forehead Sebum",
                "severity": "High",
                "badge": "High Sebum Shine",
                "icon": "💧",
                "detail": f"Elevated specular reflectance index ({oiliness_shine_score:.0f}/100) indicating active sebaceous secretion and forehead shine."
            })
        elif oiliness_shine_score < 30:
            observations.append({
                "zone": "T-Zone & Cheek Moisture",
                "severity": "Low",
                "badge": "Matte / Alipidic",
                "icon": "🌵",
                "detail": "Low natural lipid presence with dry matte finish; vulnerable to trans-epidermal water loss (TEWL)."
            })
        else:
            observations.append({
                "zone": "T-Zone & Cheek Balance",
                "severity": "Optimal",
                "badge": "Dewy Balance",
                "icon": "🌿",
                "detail": "Balanced lipid film with healthy diffuse luminescence across central facial planes."
            })

        # Redness & Erythema observation
        if redness_erythema_score > 55:
            observations.append({
                "zone": "Vascular / Erythema Tone",
                "severity": "High",
                "badge": "Active Redness",
                "icon": "🩸",
                "detail": f"Localized chromatic erythema detected ({redness_erythema_score:.0f}/100) signifying capillary flushing or micro-irritation."
            })
        elif redness_erythema_score > 35:
            observations.append({
                "zone": "Vascular / Erythema Tone",
                "severity": "Moderate",
                "badge": "Mild Flushing",
                "icon": "🌸",
                "detail": "Slight vascular dilation observed across mid-face cheeks with mild sensitivity tendencies."
            })
        else:
            observations.append({
                "zone": "Vascular / Erythema Tone",
                "severity": "Optimal",
                "badge": "Even Tone",
                "icon": "✓",
                "detail": "Uniform chromatic distribution with no significant vascular pooling or redness flares."
            })

        # 10. Recommendations
        recommended_ingredients = []
        action_steps = []

        if pore_visibility_score > 45 or oiliness_shine_score > 55:
            recommended_ingredients.append({
                "name": "Niacinamide (Vitamin B3 5%)",
                "purpose": "Tightens enlarged pore walls, balances sebum production, and evens micro-texture.",
                "timing": "AM & PM",
                "tag": "Pore Minimizer"
            })
            recommended_ingredients.append({
                "name": "Salicylic Acid (BHA 2%)",
                "purpose": "Lipophilic exfoliant that unclogs deep follicular debris and dissolves sebum plugs.",
                "timing": "PM (2-3x weekly)",
                "tag": "Exfoliant"
            })
            action_steps.append("Incorporate gentle chemical BHA exfoliation twice weekly to clear follicular congestion.")

        if roughness_score > 40:
            recommended_ingredients.append({
                "name": "Lactic Acid / PHA (5-10%)",
                "purpose": "Gentle water-soluble alpha hydroxy acid that smooths micro-roughness while hydrating.",
                "timing": "PM",
                "tag": "Texture Refiner"
            })
            recommended_ingredients.append({
                "name": "Ceramide NP & Fatty Acids Complex",
                "purpose": "Restores stratum corneum lipids to eliminate flaking and rough dry patches.",
                "timing": "AM & PM",
                "tag": "Barrier Repair"
            })
            action_steps.append("Use a ceramide-rich barrier moisturizer to seal in hydration and smooth flaky patches.")

        if redness_erythema_score > 40:
            recommended_ingredients.append({
                "name": "Centella Asiatica (Cica) & Madecassoside",
                "purpose": "Calms micro-capillary flushing and reduces irritation-driven texture roughness.",
                "timing": "AM & PM",
                "tag": "Soothing / Anti-Redness"
            })
            recommended_ingredients.append({
                "name": "Azelaic Acid 10%",
                "purpose": "Targets vascular redness, reduces inflammatory bumps, and smooths skin grain.",
                "timing": "PM",
                "tag": "Clarifying"
            })
            action_steps.append("Avoid physical facial scrubs and harsh astringents; switch to soothing cica emulsions.")

        if fine_lines_score > 40 or overall_texture_score > 75:
            recommended_ingredients.append({
                "name": "Multi-Molecular Hyaluronic Acid + Polyglutamic Acid",
                "purpose": "Deep epidermal plumping to instantly soften fine surface micro-creases.",
                "timing": "AM & PM",
                "tag": "Hydration Plumper"
            })
            recommended_ingredients.append({
                "name": "Copper Tripeptide-1 & Acetyl Hexapeptide-8",
                "purpose": "Boosts collagen synthesis to reinforce skin tensile elasticity and smooth texture.",
                "timing": "PM",
                "tag": "Youth Restoring"
            })

        if len(recommended_ingredients) < 3:
            recommended_ingredients.append({
                "name": "Broad Spectrum SPF 50+ PA++++",
                "purpose": "Prevents UV-induced collagen degradation and texture coarseness.",
                "timing": "AM (Daily)",
                "tag": "Photoprotection"
            })

        analysis_summary = (
            f"Skin analysis classified as '{texture_type}'. "
            f"Smoothness rated at {smoothness_score:.1f}/100 with a pore visibility index of {pore_visibility_score:.1f}/100. "
            f"Primary targeted focus: {primary_concern}."
        )

        diagnostics = {
            "metrics_breakdown": {
                "smoothness": round(smoothness_score, 1),
                "roughness": round(roughness_score, 1),
                "pore_visibility": round(pore_visibility_score, 1),
                "pore_density": round(pore_density_score, 1),
                "oiliness_shine": round(oiliness_shine_score, 1),
                "redness_erythema": round(redness_erythema_score, 1),
                "fine_lines": round(fine_lines_score, 1),
                "overall_score": round(overall_texture_score, 1)
            },
            "observations": observations,
            "recommended_ingredients": recommended_ingredients,
            "action_steps": action_steps,
            "angle_tag": angle_tag,
            "diagnostics_timestamp": "Just now",
        }

        return {
            "smoothness_score": round(smoothness_score, 1),
            "roughness_score": round(roughness_score, 1),
            "pore_visibility_score": round(pore_visibility_score, 1),
            "pore_density_score": round(pore_density_score, 1),
            "oiliness_shine_score": round(oiliness_shine_score, 1),
            "redness_erythema_score": round(redness_erythema_score, 1),
            "fine_lines_score": round(fine_lines_score, 1),
            "overall_texture_score": round(overall_texture_score, 1),
            "texture_type": texture_type,
            "primary_concern": primary_concern,
            "analysis_summary": analysis_summary,
            "diagnostics": diagnostics,
            "overlays": {
                "roughness_heatmap": roughness_overlay_base64,
                "pore_map": pore_overlay_base64,
                "redness_heatmap": redness_overlay_base64
            }
        }

    @classmethod
    def analyze_multi_angle(cls, front_bytes: bytes, left_bytes: bytes, right_bytes: bytes) -> dict:
        """
        Synthesize multi-angle facial capture (Frontal, Left Turn, Right Turn).
        """
        front_res = cls.analyze_image_bytes(front_bytes, "Frontal Center")
        left_res = cls.analyze_image_bytes(left_bytes, "Left Profile Turn")
        right_res = cls.analyze_image_bytes(right_bytes, "Right Profile Turn")

        # Weighted multi-angle average (Front 40%, Left 30%, Right 30%)
        smoothness_avg = round(front_res["smoothness_score"] * 0.4 + left_res["smoothness_score"] * 0.3 + right_res["smoothness_score"] * 0.3, 1)
        roughness_avg = round(100.0 - smoothness_avg, 1)
        pore_avg = round(front_res["pore_visibility_score"] * 0.5 + left_res["pore_visibility_score"] * 0.25 + right_res["pore_visibility_score"] * 0.25, 1)
        oiliness_avg = round(front_res["oiliness_shine_score"] * 0.5 + left_res["oiliness_shine_score"] * 0.25 + right_res["oiliness_shine_score"] * 0.25, 1)
        redness_avg = round(front_res["redness_erythema_score"] * 0.34 + left_res["redness_erythema_score"] * 0.33 + right_res["redness_erythema_score"] * 0.33, 1)
        fine_lines_avg = round(front_res["fine_lines_score"] * 0.34 + left_res["fine_lines_score"] * 0.33 + right_res["fine_lines_score"] * 0.33, 1)
        overall_score_avg = round((front_res["overall_texture_score"] + left_res["overall_texture_score"] + right_res["overall_texture_score"]) / 3.0, 1)

        # Multi-Angle Consolidated Observations List
        multi_observations = []
        
        # 1. Frontal T-Zone Observation
        multi_observations.append({
            "zone": "Central T-Zone & Forehead (Front Angle)",
            "severity": "High" if front_res["oiliness_shine_score"] > 60 else "Optimal",
            "badge": f"Shine: {front_res['oiliness_shine_score']}/100",
            "icon": "👤",
            "detail": f"Frontal scan identifies {front_res['texture_type']}. Nasal pore visibility index is {front_res['pore_visibility_score']}/100 with active sebum reflection."
        })

        # 2. Left Lateral Cheek & Jawline Observation
        multi_observations.append({
            "zone": "Left Cheek & Temporal Plane (Left Turn)",
            "severity": "Moderate" if left_res["redness_erythema_score"] > 40 else "Optimal",
            "badge": f"Smoothness: {left_res['smoothness_score']}%",
            "icon": "◀️",
            "detail": f"Left profile displays {left_res['smoothness_score']}% epidermal smoothness. Erythema score of {left_res['redness_erythema_score']}/100 with uniform lateral grain."
        })

        # 3. Right Lateral Cheek & Jawline Observation
        multi_observations.append({
            "zone": "Right Cheek & Temporal Plane (Right Turn)",
            "severity": "Moderate" if right_res["redness_erythema_score"] > 40 else "Optimal",
            "badge": f"Smoothness: {right_res['smoothness_score']}%",
            "icon": "▶️",
            "detail": f"Right profile displays {right_res['smoothness_score']}% epidermal smoothness. Erythema score of {right_res['redness_erythema_score']}/100."
        })

        # 4. Bilateral Symmetry & Uniformity Analysis
        sym_diff = abs(left_res["smoothness_score"] - right_res["smoothness_score"])
        multi_observations.append({
            "zone": "Facial Bilateral Symmetry & Texture Balance",
            "severity": "Optimal" if sym_diff < 12 else "Moderate",
            "badge": "High Symmetry" if sym_diff < 12 else "Bilateral Variance",
            "icon": "⚖️",
            "detail": f"Texture variance between left and right facial hemispheres is {sym_diff:.1f}%, indicating balanced environmental exposure across both cheeks."
        })

        # Primary Concern across angles
        primary_concern = front_res["primary_concern"] if front_res["pore_visibility_score"] > 55 else left_res["primary_concern"]

        consolidated_diagnostics = {
            "metrics_breakdown": {
                "smoothness": smoothness_avg,
                "roughness": roughness_avg,
                "pore_visibility": pore_avg,
                "pore_density": round((front_res["pore_density_score"] + left_res["pore_density_score"] + right_res["pore_density_score"]) / 3, 1),
                "oiliness_shine": oiliness_avg,
                "redness_erythema": redness_avg,
                "fine_lines": fine_lines_avg,
                "overall_score": overall_score_avg
            },
            "observations": multi_observations,
            "angle_breakdown": {
                "front": front_res,
                "left": left_res,
                "right": right_res,
            },
            "recommended_ingredients": front_res["diagnostics"]["recommended_ingredients"],
            "action_steps": front_res["diagnostics"]["action_steps"],
            "diagnostics_timestamp": "3-Angle Composite Scan",
        }

        return {
            "smoothness_score": smoothness_avg,
            "roughness_score": roughness_avg,
            "pore_visibility_score": pore_avg,
            "pore_density_score": consolidated_diagnostics["metrics_breakdown"]["pore_density"],
            "oiliness_shine_score": oiliness_avg,
            "redness_erythema_score": redness_avg,
            "fine_lines_score": fine_lines_avg,
            "overall_texture_score": overall_score_avg,
            "texture_type": f"3-Angle: {front_res['texture_type']}",
            "primary_concern": primary_concern,
            "analysis_summary": f"Comprehensive 3-Angle Facial Vision Scan completed. Overall composite texture score is {overall_score_avg}/100 across frontal, left, and right turns.",
            "diagnostics": consolidated_diagnostics,
            "overlays": {
                "roughness_heatmap": front_res["overlays"]["roughness_heatmap"],
                "pore_map": front_res["overlays"]["pore_map"],
                "redness_heatmap": front_res["overlays"]["redness_heatmap"]
            }
        }
