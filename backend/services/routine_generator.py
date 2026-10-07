import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from models import SkinProfile, SkinAssessment


def generate_personalized_routine(db: Session, user_id: int) -> Dict[str, Any]:
    """
    Generates a personalized skincare routine (Morning, Evening, Weekly, Seasonal)
    tailored to user's skin profile, concerns, climate, and assessment score.
    """
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == user_id).first()

    skin_type = profile.skin_type if profile else "Normal"
    concerns = json.loads(profile.skin_concerns or "[]") if profile else []
    sensitivities = profile.sensitivities if profile else ""
    climate = profile.climate_type if profile else "Temperate"
    uv_index = profile.uv_index_exposure if profile else "Moderate (3–5)"

    # 1. MORNING STEPS
    morning_steps = []

    # Step 1: Cleansing
    if skin_type in ["Dry", "Sensitive"]:
        morning_steps.append({
            "id": "m1",
            "step_number": 1,
            "name": "Gentle Hydrating Cleanser",
            "category": "Cleansing",
            "description": "Cleanse face with lukewarm water and a non-foaming hydrating cleanser to preserve natural lipids.",
            "key_ingredients": ["Ceramides", "Glycerin", "Centella Asiatica"],
            "frequency": "Daily Morning"
        })
    else:
        morning_steps.append({
            "id": "m1",
            "step_number": 1,
            "name": "Purifying Foam Cleanser",
            "category": "Cleansing",
            "description": "Wash away overnight sebum and impurities with a gentle balancing cleanser.",
            "key_ingredients": ["Green Tea Extract", "Niacinamide"],
            "frequency": "Daily Morning"
        })

    # Step 2: Treatment / Antioxidant Serum
    if "Acne" in concerns or "Oily Skin" in concerns:
        morning_steps.append({
            "id": "m2",
            "step_number": 2,
            "name": "Niacinamide & Zinc Clarifying Serum",
            "category": "Treatment",
            "description": "Apply 3-4 drops to regulate sebum secretion, minimize pores, and soothe active redness.",
            "key_ingredients": ["Niacinamide (5%)", "Zinc PCA", "Hyaluronic Acid"],
            "frequency": "Daily Morning"
        })
    elif "Hyperpigmentation" in concerns or "Dark Spots" in concerns or "Uneven Skin Tone" in concerns:
        morning_steps.append({
            "id": "m2",
            "step_number": 2,
            "name": "Vitamin C Brightening Antioxidant Serum",
            "category": "Treatment",
            "description": "Shield skin from free radicals and fade dark spots with stabilized L-Ascorbic Acid.",
            "key_ingredients": ["Vitamin C (10%)", "Ferulic Acid", "Vitamin E"],
            "frequency": "Daily Morning"
        })
    elif "Wrinkles" in concerns or "Fine Lines" in concerns:
        morning_steps.append({
            "id": "m2",
            "step_number": 2,
            "name": "Peptide & Collagen Plumping Serum",
            "category": "Treatment",
            "description": "Boost firming peptides and deep hydration to reduce appearance of fine lines.",
            "key_ingredients": ["Matrixyl 3000", "Copper Peptides", "Hyaluronic Acid"],
            "frequency": "Daily Morning"
        })
    else:
        morning_steps.append({
            "id": "m2",
            "step_number": 2,
            "name": "Hydrating Antioxidant Essence",
            "category": "Treatment",
            "description": "Pat lightly into skin to provide a moisture boost and environmental defense.",
            "key_ingredients": ["Hyaluronic Acid", "Panax Ginseng", "Panthenol"],
            "frequency": "Daily Morning"
        })

    # Step 3: Moisturizer
    if skin_type in ["Oily", "Combination"]:
        morning_steps.append({
            "id": "m3",
            "step_number": 3,
            "name": "Lightweight Oil-Free Gel Moisturizer",
            "category": "Moisturizing",
            "description": "Hydrate deeply without clogging pores or leaving greasy residue.",
            "key_ingredients": ["Hyaluronic Acid", "Aloe Vera", "Squalan"],
            "frequency": "Daily Morning"
        })
    else:
        morning_steps.append({
            "id": "m3",
            "step_number": 3,
            "name": "Barrier Repair Cream",
            "category": "Moisturizing",
            "description": "Lock in hydration and reinforce epidermal lipid barrier throughout the day.",
            "key_ingredients": ["Ceramides NP", "Cholesterol", "Fatty Acids"],
            "frequency": "Daily Morning"
        })

    # Step 4: Sun Protection
    morning_steps.append({
        "id": "m4",
        "step_number": 4,
        "name": "Broad-Spectrum Fluid Sunscreen (SPF 50+ PA++++),",
        "category": "Sun Protection",
        "description": "Apply generously 15 minutes before sun exposure to shield against UVA/UVB rays and photo-aging.",
        "key_ingredients": ["Zinc Oxide", "Tinosorb S", "Niacinamide"],
        "frequency": "Daily Morning"
    })

    # 2. EVENING STEPS
    evening_steps = []

    # Step 1: Cleansing
    evening_steps.append({
        "id": "e1",
        "step_number": 1,
        "name": "Double Cleansing (Cleansing Balm + Water Cleanser)",
        "category": "Cleansing",
        "description": "Melt away sunscreen, makeup, and urban pollutants with an emulsifying oil balm followed by a gentle cleanser.",
        "key_ingredients": ["Jojoba Seed Oil", "Sunflower Seed Oil", "Glycerin"],
        "frequency": "Daily Evening"
    })

    # Step 2: Night Treatment
    if "Acne" in concerns:
        evening_steps.append({
            "id": "e2",
            "step_number": 2,
            "name": "Salicylic Acid 2% BHA Pore Treatment",
            "category": "Exfoliation",
            "description": "Decongest pores and clear acne-causing bacteria overnight.",
            "key_ingredients": ["Salicylic Acid (BHA 2%)", "Tea Tree Extract", "Allantoin"],
            "frequency": "Alternate Evenings"
        })
    elif "Wrinkles" in concerns or "Fine Lines" in concerns or "Hyperpigmentation" in concerns:
        evening_steps.append({
            "id": "e2",
            "step_number": 2,
            "name": "Encapsulated Retinol Renewal Serum (0.3%)",
            "category": "Treatment",
            "description": "Accelerate cellular turnover, stimulate collagen production, and smooth skin texture.",
            "key_ingredients": ["Encapsulated Retinol", "Bakuchiol", "Squalane"],
            "frequency": "3x Weekly Evenings"
        })
    else:
        evening_steps.append({
            "id": "e2",
            "step_number": 2,
            "name": "Gentle AHA Lactic Acid 5% Resurfacing Treatment",
            "category": "Exfoliation",
            "description": "Mildly exfoliate dead skin cells to reveal radiant, smooth skin overnight.",
            "key_ingredients": ["Lactic Acid", "Licorice Root", "HA"],
            "frequency": "2x Weekly Evenings"
        })

    # Step 3: Night Care / Moisturizer
    evening_steps.append({
        "id": "e3",
        "step_number": 3,
        "name": "Deep Nourishing Night Cream",
        "category": "Night Care",
        "description": "Apply a rich, restorative night cream to support cellular repair while sleeping.",
        "key_ingredients": ["Peptides", "Shea Butter", "Madecassoside"],
        "frequency": "Daily Evening"
    })

    # 3. WEEKLY TREATMENTS
    weekly_treatments = [
        {
            "id": "w1",
            "day": "Wednesday",
            "name": "Hydrating & Soothing Sheet Mask",
            "category": "Face Masks",
            "description": "Apply for 15-20 minutes for intense moisture surge and redness relief.",
            "ingredients": ["Centella Asiatica", "Hyaluronic Acid", "Camellia Sinensis"]
        },
        {
            "id": "w2",
            "day": "Sunday",
            "name": "Pore Clarifying Clay & Charcoal Mask",
            "category": "Treatment Products",
            "description": "Draw out deep impurites, excess sebum, and detoxify skin pores.",
            "ingredients": ["Kaolin Clay", "Activated Charcoal", "Willow Bark Extract"]
        }
    ]

    # 4. SEASONAL ADVICE
    seasonal_advice = []
    if "humid" in climate.lower() or "tropical" in climate.lower():
        seasonal_advice.append({
            "title": "Humid / Tropical Climate Protocol",
            "advice": "Switch to lightweight gel textures to avoid pore congestion. Increase double cleansing frequency."
        })
    elif "dry" in climate.lower() or "arid" in climate.lower() or "cold" in climate.lower():
        seasonal_advice.append({
            "title": "Dry / Cold Climate Barrier Defense",
            "advice": "Incorporate facial oil or occlusive balm as final step at night to prevent moisture evaporation."
        })
    else:
        seasonal_advice.append({
            "title": "Balanced Climate Maintenance",
            "advice": "Adjust hydration levels based on indoor air conditioning or heating exposure."
        })

    if "high" in uv_index.lower() or "extreme" in uv_index.lower():
        seasonal_advice.append({
            "title": "High UV Radiation Warning",
            "advice": "Reapply sunscreen every 2 hours when outdoors. Wear wide-brimmed hat and UV-protective eyewear."
        })

    return {
        "morning_steps": morning_steps,
        "evening_steps": evening_steps,
        "weekly_treatments": weekly_treatments,
        "seasonal_advice": seasonal_advice,
    }
