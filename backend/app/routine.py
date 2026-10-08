from app.ml.seasonal_tips import generate_seasonal_tips
from app.ml.concern_prioritizer import prioritize_concerns


def generate_routine(profile, concerns=None):
    """
    Personalized Routine Generator
    Uses ranked concerns + seasonal tips for smarter recommendations.
    """
    skin_type = (profile.get("skin_type") or "normal").lower()
    env = (profile.get("environmental_exposure") or "").lower()
    sensitivities = (profile.get("sensitivities") or "").lower()

    # Get ranked concerns (highest severity first)
    concern_result = prioritize_concerns(profile)
    ranked = concern_result.get("ranked_concerns", [])
    top_concerns = [c["concern"].lower() for c in ranked[:3]]

    # Fallback to old concerns list if needed
    if not top_concerns and concerns:
        top_concerns = [c.lower() for c in concerns]

    concerns_text = " ".join(top_concerns)
    sensitive = (
        skin_type == "sensitive"
        or "sensitive" in concerns_text
        or "easily irritated" in sensitivities
        or "reactive" in sensitivities
    )

    primary = top_concerns[0] if top_concerns else ""

    # ===== Morning =====
    morning = [
        "Cleansing: Gentle cleanser suited to your skin type",
        "Treatment: Targeted serum for your main concern",
        "Moisturizing: Lightweight moisturizer",
        "Sun Protection: Broad spectrum SPF 50",
    ]

    if skin_type == "oily" or "acne" in concerns_text:
        morning[0] = "Cleansing: Gentle foaming / salicylic acid cleanser"
        morning[1] = "Treatment: Niacinamide serum"
        morning[2] = "Moisturizing: Oil-free gel moisturizer"
    elif skin_type == "dry" or "dry skin" in concerns_text:
        morning[0] = "Cleansing: Creamy hydrating cleanser"
        morning[1] = "Treatment: Hyaluronic acid serum"
        morning[2] = "Moisturizing: Ceramide cream"
    elif sensitive:
        morning[0] = "Cleansing: Fragrance-free gentle cleanser"
        morning[1] = "Treatment: Soothing serum (centella / panthenol)"
        morning[2] = "Moisturizing: Barrier-repair cream"

    # Override treatment based on highest severity concern
    if primary in ["acne"]:
        morning[1] = "Treatment: Niacinamide or azelaic acid serum"
    elif primary in ["hyperpigmentation", "dark spots", "uneven skin tone"]:
        morning[1] = "Treatment: Vitamin C or alpha arbutin serum"
    elif primary in ["dry skin", "dehydration"]:
        morning[1] = "Treatment: Hyaluronic acid + panthenol serum"
    elif primary in ["redness", "sensitive skin"]:
        morning[1] = "Treatment: Centella / madecassoside soothing serum"
    elif primary in ["fine lines", "wrinkles"]:
        morning[1] = "Treatment: Antioxidant serum (Vitamin C / peptides)"

    # ===== Evening =====
    evening = [
        "Cleansing: Gentle cleanser (double cleanse if wearing sunscreen)",
        "Treatment: Night treatment for your main concern",
        "Moisturizing: Nourishing night moisturizer",
        "Night Care: Optional occlusive on dry patches",
    ]

    if primary in ["acne"]:
        evening[1] = "Treatment: Benzoyl peroxide or adapalene (2-3 nights/week to start)"
    elif primary in ["wrinkles", "fine lines"]:
        evening[1] = "Treatment: Retinol serum (2-3 nights/week to start)"
    elif primary in ["hyperpigmentation", "dark spots", "uneven skin tone"]:
        evening[1] = "Treatment: Niacinamide or alpha arbutin serum"
    elif primary in ["dry skin", "dehydration"]:
        evening[1] = "Treatment: Hydrating serum + facial oil"
    elif sensitive or primary in ["redness", "sensitive skin"]:
        evening[1] = "Treatment: Barrier-repair serum (no strong acids)"
        evening[3] = "Night Care: Avoid strong acids and fragrance"

    if sensitive:
        evening[3] = "Night Care: Avoid strong acids and fragrance"

    # Keep simple list format for checklist
    morning_steps = [m.split(": ", 1)[-1] if ": " in m else m for m in morning]
    evening_steps = [e.split(": ", 1)[-1] if ": " in e else e for e in evening]

    # ===== Weekly plan =====
    weekly = {
        "Monday": "Focus: Cleansing + moisturizer only (recovery day)",
        "Tuesday": "Exfoliation: Gentle chemical exfoliant (skip if sensitive/irritated)",
        "Wednesday": "Treatment: Use your main night treatment",
        "Thursday": "Moisturizing: Hydrating mask",
        "Friday": "Treatment: Use your main night treatment",
        "Saturday": "Exfoliation: Gentle exfoliant OR mask (not both)",
        "Sunday": "Night Care: Recovery + extra moisturizer",
    }

    if sensitive:
        weekly["Tuesday"] = "Skip exfoliation. Use soothing moisturizer only"
        weekly["Saturday"] = "Soothing mask. No acids or retinol"

    if "acne" in concerns_text:
        weekly["Wednesday"] = "Acne treatment night"
        weekly["Friday"] = "Acne treatment night"

    if primary in ["wrinkles", "fine lines"] or "wrinkles" in concerns_text or "fine lines" in concerns_text:
        weekly["Wednesday"] = "Retinol night"
        weekly["Friday"] = "Retinol night"

    if primary in ["hyperpigmentation", "dark spots"]:
        weekly["Thursday"] = "Pigmentation focus: antioxidant + hydrating mask"

    # ===== Seasonal (from new module) =====
    seasonal_data = generate_seasonal_tips(profile)
    season = {
        "season": seasonal_data.get("season", "current").title(),
        "tips": [t["tip"] for t in seasonal_data.get("tips", [])],
        "summary": seasonal_data.get("summary", ""),
    }

    categories = {
        "Cleansing": morning[0],
        "Exfoliation": weekly["Tuesday"],
        "Treatment": morning[1],
        "Moisturizing": morning[2],
        "Sun Protection": morning[3],
        "Night Care": evening[-1],
    }

    adaptive_note = (
        f"Routine prioritized for: {', '.join(concern_result.get('top_concerns', [])[:3]) or 'general skin health'}. "
        "Updates automatically when your profile, concerns, or checklist consistency change."
    )

    return {
        "morning": morning_steps,
        "evening": evening_steps,
        "morning_detailed": morning,
        "evening_detailed": evening,
        "weekly": weekly,
        "seasonal": season,
        "categories": categories,
        "adaptive_note": adaptive_note,
        "primary_concern": primary.title() if primary else None,
    }