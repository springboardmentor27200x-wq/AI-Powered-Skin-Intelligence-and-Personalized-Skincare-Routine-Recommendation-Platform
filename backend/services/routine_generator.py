import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from models import SkinProfile, SkinAssessment


# Master routine templates customized per skin type
SKIN_TYPE_ROUTINES: Dict[str, Dict[str, Any]] = {
    "Oily": {
        "morning_steps": [
            {
                "id": "m1",
                "step_number": 1,
                "name": "Salicylic Acid Purifying Foam Cleanser",
                "category": "Cleansing",
                "description": "Dissolve excess nocturnal sebum, decongest pores, and prevent comedones without over-drying.",
                "key_ingredients": ["Salicylic Acid (BHA 2%)", "Zinc PCA", "Tea Tree Extract"],
                "frequency": "Daily Morning",
            },
            {
                "id": "m2",
                "step_number": 2,
                "name": "Niacinamide 10% + Zinc 1% Oil-Control Serum",
                "category": "Treatment",
                "description": "Regulates sebum production, tightens enlarged pores, and calms surface redness.",
                "key_ingredients": ["Niacinamide 10%", "Zinc PCA 1%", "Hyaluronic Acid"],
                "frequency": "Daily Morning",
            },
            {
                "id": "m3",
                "step_number": 3,
                "name": "Oil-Free Mattifying Water Gel Hydrator",
                "category": "Moisturizing",
                "description": "Featherlight, non-comedogenic gel offering essential oil-free hydration with an all-day shine-free matte finish.",
                "key_ingredients": ["Green Tea Extract", "Aloe Barbadensis", "Centella Asiatica"],
                "frequency": "Daily Morning",
            },
            {
                "id": "m4",
                "step_number": 4,
                "name": "Mattifying Dry-Touch Sunscreen SPF 50+ PA++++",
                "category": "Sun Protection",
                "description": "Sebum-absorbing, invisible matte UV shield that guards against photo-aging without clogging pores.",
                "key_ingredients": ["Micronized Silica", "Zinc Oxide", "Tinosorb S"],
                "frequency": "Daily Morning",
            },
        ],
        "evening_steps": [
            {
                "id": "e1",
                "step_number": 1,
                "name": "Deep Pore Charcoal Double Cleanse",
                "category": "Cleansing",
                "description": "Melt sebum, SPF, and urban pollutants with clarifying cleansing oil followed by charcoal foam wash.",
                "key_ingredients": ["Activated Charcoal", "Jojoba Oil", "Willow Bark Extract"],
                "frequency": "Daily Evening",
            },
            {
                "id": "e2",
                "step_number": 2,
                "name": "BHA 2% Pore Clarifying Exfoliant Treatment",
                "category": "Exfoliation",
                "description": "Penetrates deep into lipid-filled pores to dissolve dead skin cell glue and clear active breakouts.",
                "key_ingredients": ["Salicylic Acid 2%", "Allantoin", "Licorice Root"],
                "frequency": "Alternate Evenings",
            },
            {
                "id": "e3",
                "step_number": 3,
                "name": "Barrier Recovery Night Calming Gel",
                "category": "Night Care",
                "description": "Soothes stressed skin overnight, replenishing natural moisture without pore occlusion.",
                "key_ingredients": ["Panthenol (Vitamin B5)", "Madecassoside", "Trehalose"],
                "frequency": "Daily Evening",
            },
        ],
        "weekly_treatments": [
            {
                "id": "w1",
                "day": "Wednesday",
                "name": "Kaolin Clay & Charcoal Detoxifying Mask",
                "category": "Face Masks",
                "description": "Draws out deep-seated impurities, absorbs trapped sebum, and refines facial skin texture.",
                "ingredients": ["Kaolin Clay", "Activated Charcoal", "Tea Tree Leaf Oil"],
            },
            {
                "id": "w2",
                "day": "Sunday",
                "name": "BHA Clarity Micro-Peel Scrub",
                "category": "Treatment Products",
                "description": "Gentle chemical and physical resurfacing to eliminate stubborn blackheads and smooth skin.",
                "ingredients": ["Salicylic Acid 1.5%", "Biodegradable Cellulose", "Niacinamide"],
            },
        ],
        "seasonal_advice": [
            {
                "title": "Humid / Summer Season Sebum Control",
                "advice": "Keep blotting papers on hand. Use water-gel moisturizers and avoid heavy occlusives in high humidity.",
            },
            {
                "title": "Winter Barrier Safeguard",
                "advice": "Don't over-cleanse when indoor heaters dry out skin; compensate with hyaluronic acid hydration serums.",
            },
        ],
    },
    "Dry": {
        "morning_steps": [
            {
                "id": "m1",
                "step_number": 1,
                "name": "Ceramide Hydrating Cream-to-Milk Cleanser",
                "category": "Cleansing",
                "description": "Non-foaming lipid-replenishing wash that sweeps away overnight impurities without compromising moisture.",
                "key_ingredients": ["Ceramides (NP, AP, EOP)", "Colloidal Oatmeal", "Glycerin"],
                "frequency": "Daily Morning",
            },
            {
                "id": "m2",
                "step_number": 2,
                "name": "Multi-Molecular Hyaluronic Acid & B5 Plumping Serum",
                "category": "Treatment",
                "description": "Binds up to 1000x its weight in water to restore bounce, alleviate tightness, and smooth micro-creases.",
                "key_ingredients": ["Hyaluronic Acid (Low & High MW)", "Panthenol 5%", "Polyglutamic Acid"],
                "frequency": "Daily Morning",
            },
            {
                "id": "m3",
                "step_number": 3,
                "name": "Deep Moisture Lipid Barrier Cream",
                "category": "Moisturizing",
                "description": "Velvety emollient cream that seals epidermal gaps, locks in hydration, and restores suppleness all day.",
                "key_ingredients": ["Squalane 5%", "Shea Butter", "Phytosterols", "Ceramides"],
                "frequency": "Daily Morning",
            },
            {
                "id": "m4",
                "step_number": 4,
                "name": "Nourishing Dewy Finish Sunscreen SPF 50+ PA++++",
                "category": "Sun Protection",
                "description": "Intensely hydrating broad-spectrum sunscreen that prevents UV-induced moisture depletion and leaves a healthy dewy glow.",
                "key_ingredients": ["Hyaluronic Acid", "Tinosorb M", "Vitamin E (Tocopherol)"],
                "frequency": "Daily Morning",
            },
        ],
        "evening_steps": [
            {
                "id": "e1",
                "step_number": 1,
                "name": "Nourishing Oat & Squalane Cleansing Balm",
                "category": "Cleansing",
                "description": "Silky oil balm that dissolves makeup and waterproof SPF without stripping natural protective lipids.",
                "key_ingredients": ["Plant Squalane", "Sweet Almond Oil", "Oat Kernel Extract"],
                "frequency": "Daily Evening",
            },
            {
                "id": "e2",
                "step_number": 2,
                "name": "Lactic Acid 5% Gentle AHA Resurfacing Treatment",
                "category": "Exfoliation",
                "description": "Mild lactic acid gently lifts dry, flaky surface dead cells while simultaneously binding water into the skin.",
                "key_ingredients": ["Lactic Acid 5%", "Licorice Root Extract", "Sodium Hyaluronate"],
                "frequency": "2x Weekly Evenings",
            },
            {
                "id": "e3",
                "step_number": 3,
                "name": "Intense Ceramide & Peptide Night Recovery Cream",
                "category": "Night Care",
                "description": "Rich restorative nocturnal therapy that repairs the compromised stratum corneum and prevents trans-epidermal water loss.",
                "key_ingredients": ["Ceramide Complex", "Copper Peptides", "Shea Butter", "Marula Oil"],
                "frequency": "Daily Evening",
            },
        ],
        "weekly_treatments": [
            {
                "id": "w1",
                "day": "Tuesday",
                "name": "Honey & Ceramide Ultra-Nourishing Mask",
                "category": "Face Masks",
                "description": "Infuses parched, flaky skin with rich natural humectants and restorative bee propolis.",
                "ingredients": ["Manuka Honey Extract", "Propolis", "Ceramides NP"],
            },
            {
                "id": "w2",
                "day": "Saturday",
                "name": "Overnight Intense Moisture Slugging Pack",
                "category": "Treatment Products",
                "description": "Occlusive recovery treatment layered overnight to lock in maximum lipid nourishment.",
                "ingredients": ["100% Sugarcane Squalane", "Phytosterols", "Tocopherol"],
            },
        ],
        "seasonal_advice": [
            {
                "title": "Winter Barrier Defense Protocol",
                "advice": "Use a room humidifier and apply facial oil over your night cream to curb harsh indoor heating evaporation.",
            },
            {
                "title": "Summer Sun Hydration",
                "advice": "Switch to a lighter ceramide cream during daytime heat, but reapply dewy SPF diligently every 2 hours.",
            },
        ],
    },
    "Sensitive": {
        "morning_steps": [
            {
                "id": "m1",
                "step_number": 1,
                "name": "Hypoallergenic Calming Milk Cleanser",
                "category": "Cleansing",
                "description": "Ultra-mild, non-irritating, pH 5.5 cleanser free of fragrance, parabens, and sulfates.",
                "key_ingredients": ["Centella Asiatica (Cica)", "Chamomile Extract", "Allantoin"],
                "frequency": "Daily Morning",
            },
            {
                "id": "m2",
                "step_number": 2,
                "name": "Cica & Madecassoside Barrier Soothing Serum",
                "category": "Treatment",
                "description": "Immediate anti-inflammatory relief to eliminate erythema, stinging, and cutaneous sensitivity.",
                "key_ingredients": ["Centella Asiatica 80%", "Madecassoside", "Beta-Glucan"],
                "frequency": "Daily Morning",
            },
            {
                "id": "m3",
                "step_number": 3,
                "name": "Colloidal Oat & Ceramide Barrier Relief Cream",
                "category": "Moisturizing",
                "description": "Clinically proven soothing formula that reinforces weak skin barriers and locks out irritants.",
                "key_ingredients": ["Colloidal Oatmeal 1%", "Ceramide NP", "Panthenol (Pro-Vitamin B5)"],
                "frequency": "Daily Morning",
            },
            {
                "id": "m4",
                "step_number": 4,
                "name": "100% Mineral Zinc Oxide Gentle Sunscreen SPF 50+ PA++++",
                "category": "Sun Protection",
                "description": "Zero chemical filters. Calming mineral zinc formula that sits safely atop the skin barrier to deflect UV rays without stinging.",
                "key_ingredients": ["Micronized Zinc Oxide 18%", "Bisabolol", "Vitamin E"],
                "frequency": "Daily Morning",
            },
        ],
        "evening_steps": [
            {
                "id": "e1",
                "step_number": 1,
                "name": "Ultra-Mild Micellar Cleansing Milk",
                "category": "Cleansing",
                "description": "Frictionless cleanser that sweeps away sunscreen and pollutants without tugging or stripping reactive skin.",
                "key_ingredients": ["Cucumber Fruit Extract", "Vegetable Glycerin", "Rosa Centifolia Flower Water"],
                "frequency": "Daily Evening",
            },
            {
                "id": "e2",
                "step_number": 2,
                "name": "Azelaic Acid 10% Calming & Anti-Redness Suspension",
                "category": "Treatment",
                "description": "Gentle dermatological treatment to reduce facial redness, even flushing, and calm rosacea-prone vessels.",
                "key_ingredients": ["Azelaic Acid 10%", "Niacinamide 2%", "Licorice Root Extract"],
                "frequency": "Alternate Evenings",
            },
            {
                "id": "e3",
                "step_number": 3,
                "name": "Centella Recovery Cica Sleeping Balm",
                "category": "Night Care",
                "description": "Protective overnight balm that wraps reactive skin in a hypoallergenic shield for overnight skin recovery.",
                "key_ingredients": ["Asiaticoside", "Madecassic Acid", "Squalane"],
                "frequency": "Daily Evening",
            },
        ],
        "weekly_treatments": [
            {
                "id": "w1",
                "day": "Wednesday",
                "name": "Aloe Vera & Cucumber Calming Jelly Mask",
                "category": "Face Masks",
                "description": "Instantly reduces skin temperature, relieves burning sensations, and replenishes pure hydration.",
                "ingredients": ["Organic Aloe Barbadensis", "Cucumber Extract", "Allantoin"],
            },
            {
                "id": "w2",
                "day": "Sunday",
                "name": "Thermal Spring Water Restorative Compress",
                "category": "Treatment Products",
                "description": "Mineral-rich thermal water soak to alleviate reactive tightness and fortify cutaneous resistance.",
                "ingredients": ["French Thermal Spring Water", "Panthenol", "Bisabolol"],
            },
        ],
        "seasonal_advice": [
            {
                "title": "Seasonal Weather Shift Alert",
                "advice": "Sudden weather changes trigger barrier inflammation. Keep patch-testing new formulas and stay fragrance-free.",
            },
            {
                "title": "Sun & Heat Protection",
                "advice": "Avoid hot showers and direct sun exposure. Carry thermal spring spray to cool skin when ambient heat spikes.",
            },
        ],
    },
    "Combination": {
        "morning_steps": [
            {
                "id": "m1",
                "step_number": 1,
                "name": "Amino Acid Balancing Gel Cleanser",
                "category": "Cleansing",
                "description": "Removes T-zone excess sebum effectively while keeping the delicate cheeks soft, cushioned, and hydrated.",
                "key_ingredients": ["Sodium Cocoyl Glycinate", "Green Tea Extract", "Glycerin"],
                "frequency": "Daily Morning",
            },
            {
                "id": "m2",
                "step_number": 2,
                "name": "Niacinamide 5% & B5 Dual-Action Balancing Serum",
                "category": "Treatment",
                "description": "Normalizes sebum on forehead and nose while infusing moisture into drier cheek zones.",
                "key_ingredients": ["Niacinamide 5%", "Pro-Vitamin B5", "Witch Hazel"],
                "frequency": "Daily Morning",
            },
            {
                "id": "m3",
                "step_number": 3,
                "name": "Hydro-Light Balancing Emulsion",
                "category": "Moisturizing",
                "description": "Zoned-action hydrator: provides weightless hydration on the T-zone and comforting moisture on cheeks.",
                "key_ingredients": ["Centella Asiatica", "Sodium Hyaluronate", "Squalane"],
                "frequency": "Daily Morning",
            },
            {
                "id": "m4",
                "step_number": 4,
                "name": "Hybrid Invisible Sunscreen Fluid SPF 50+ PA++++",
                "category": "Sun Protection",
                "description": "Lightweight fluid SPF offering non-sticky, non-shiny broad-spectrum protection for mixed skin types.",
                "key_ingredients": ["Uvinul A Plus", "Tinosorb S", "Niacinamide"],
                "frequency": "Daily Morning",
            },
        ],
        "evening_steps": [
            {
                "id": "e1",
                "step_number": 1,
                "name": "Balancing Jojoba Oil-to-Milk Double Cleanse",
                "category": "Cleansing",
                "description": "Melts pore-clogging sebum from the nose and chin without leaving cheek residue.",
                "key_ingredients": ["Jojoba Seed Oil", "Camellia Extract", "Betaine"],
                "frequency": "Daily Evening",
            },
            {
                "id": "e2",
                "step_number": 2,
                "name": "Zone-Targeted BHA/AHA Chemical Exfoliant",
                "category": "Exfoliation",
                "description": "Apply BHA to oily T-Zone to clarify pores; apply mild Mandelic Acid to cheeks for smooth cellular renewal.",
                "key_ingredients": ["Salicylic Acid 1% (T-Zone)", "Mandelic Acid 3% (Cheeks)"],
                "frequency": "2-3x Weekly Evenings",
            },
            {
                "id": "e3",
                "step_number": 3,
                "name": "Adaptive Lipid Night Cream",
                "category": "Night Care",
                "description": "Formulated to adaptively nourish drier perimeter zones while keeping central pore zones fresh and clear.",
                "key_ingredients": ["Ceramide NP", "Green Tea Extract", "Sodium Hyaluronate"],
                "frequency": "Daily Evening",
            },
        ],
        "weekly_treatments": [
            {
                "id": "w1",
                "day": "Thursday",
                "name": "Dual Multi-Masking: Clay on T-Zone + Hydrating Gel on Cheeks",
                "category": "Face Masks",
                "description": "Targeted multi-masking protocol addressing conflicting needs of combination skin in one session.",
                "ingredients": ["Kaolin Clay (Forehead/Nose)", "Aloe & Hyaluronic Gel (Cheeks)"],
            },
            {
                "id": "w2",
                "day": "Sunday",
                "name": "Papaya Enzyme Gentle Resurfacing Polish",
                "category": "Treatment Products",
                "description": "Fruit enzyme polish that gently dissolves rough texture without irritating either oily or dry facial zones.",
                "ingredients": ["Papaya Enzyme (Papain)", "Rice Powder", "Glycerin"],
            },
        ],
        "seasonal_advice": [
            {
                "title": "Summer T-Zone Control",
                "advice": "Use a light gel moisturizer all over in summer, adding an extra drop of serum only to dry cheek areas.",
            },
            {
                "title": "Winter Cheek Nourishment",
                "advice": "Layer a richer cream onto cheekbones during winter while maintaining lightweight hydration on the nose/forehead.",
            },
        ],
    },
    "Normal": {
        "morning_steps": [
            {
                "id": "m1",
                "step_number": 1,
                "name": "Refreshing Botanical Gel Cleanser",
                "category": "Cleansing",
                "description": "Maintains optimal skin balance (pH 5.5) while washing away morning oils and awakening the skin.",
                "key_ingredients": ["Green Tea Extract", "Panthenol", "Vegetable Glycerin"],
                "frequency": "Daily Morning",
            },
            {
                "id": "m2",
                "step_number": 2,
                "name": "Vitamin C 15% Brightening & Glow Serum",
                "category": "Treatment",
                "description": "Potent dermatological antioxidant shield that neutralizes free radicals, boosts radiance, and preserves youthful elasticity.",
                "key_ingredients": ["L-Ascorbic Acid 15%", "Ferulic Acid 0.5%", "Vitamin E"],
                "frequency": "Daily Morning",
            },
            {
                "id": "m3",
                "step_number": 3,
                "name": "Peptide Radiance Daily Moisturizer",
                "category": "Moisturizing",
                "description": "Silky daily hydrator promoting cellular turnover, optimal hydration, and sustained firm skin barrier.",
                "key_ingredients": ["Matrixyl 3000 Peptides", "Sodium Hyaluronate", "Squalane"],
                "frequency": "Daily Morning",
            },
            {
                "id": "m4",
                "step_number": 4,
                "name": "Invisible Water-Gel Sunscreen SPF 50+ PA++++",
                "category": "Sun Protection",
                "description": "Ultralight, refreshing sun shield providing high-grade photo-protection against UVA/UVB and HEV light.",
                "key_ingredients": ["Ethylhexyl Triazone", "Niacinamide", "Hyaluronic Acid"],
                "frequency": "Daily Morning",
            },
        ],
        "evening_steps": [
            {
                "id": "e1",
                "step_number": 1,
                "name": "Gentle Camellia Micellar Double Cleanse",
                "category": "Cleansing",
                "description": "Gently purifies skin of cosmetic pigments, airborne dirt, and sunscreen while nourishing epidermal lipids.",
                "key_ingredients": ["Camellia Seed Oil", "Rosa Damascena Water", "Glycerin"],
                "frequency": "Daily Evening",
            },
            {
                "id": "e2",
                "step_number": 2,
                "name": "Encapsulated Retinol 0.3% Cellular Renewal Serum",
                "category": "Treatment",
                "description": "Gold-standard anti-aging active promoting collagen synthesis, refined skin texture, and youthful tone.",
                "key_ingredients": ["Encapsulated Retinol 0.3%", "Bakuchiol", "Tocopherol"],
                "frequency": "3x Weekly Evenings",
            },
            {
                "id": "e3",
                "step_number": 3,
                "name": "Restorative Ceramide Peptide Night Cream",
                "category": "Night Care",
                "description": "Nourishing overnight therapy that optimizes cellular repair and delivers firm, rested skin by morning.",
                "key_ingredients": ["Ceramides NP", "Tripeptides", "Shea Butter"],
                "frequency": "Daily Evening",
            },
        ],
        "weekly_treatments": [
            {
                "id": "w1",
                "day": "Wednesday",
                "name": "Radiance Vitamin C Peel-Off Glow Mask",
                "category": "Face Masks",
                "description": "Clarifies surface dullness and infuses deep antioxidant illumination for radiant glass skin.",
                "ingredients": ["L-Ascorbic Acid", "Citrus Junos Fruit Extract", "Hyaluronic Acid"],
            },
            {
                "id": "w2",
                "day": "Sunday",
                "name": "Hydrating Rose Water Hydrogel Sheet Mask",
                "category": "Treatment Products",
                "description": "Intense hydration surge soothing dermal layers and locking in vital micronutrients.",
                "ingredients": ["Rose Damascena Distillate", "Hyaluronic Acid", "Niacinamide"],
            },
        ],
        "seasonal_advice": [
            {
                "title": "Year-Round Maintenance Strategy",
                "advice": "Your balanced skin responds well to active ingredients. Focus on consistency and lifelong sunscreen protection.",
            },
            {
                "title": "Seasonal Transitioning",
                "advice": "Switch to lighter water gels in hot humid weather and increase peptide creams when winter winds arrive.",
            },
        ],
    },
}


def generate_personalized_routine(db: Session, user_id: int) -> Dict[str, Any]:
    """
    Generates a personalized skincare routine (Morning, Evening, Weekly, Seasonal)
    tailored strictly to user's skin profile, concerns, climate, and sensitivity.
    """
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == user_id).first()
    if not profile:
        skin_type = "Normal"
        concerns = []
        sensitivities = ""
        climate = "Temperate"
        uv_index = "Moderate (3–5)"
    else:
        skin_type = profile.skin_type or "Normal"
        try:
            concerns = json.loads(profile.skin_concerns or "[]")
        except Exception:
            concerns = []
        sensitivities = profile.sensitivities or ""
        climate = profile.climate_type or "Temperate"
        uv_index = profile.uv_index_exposure or "Moderate (3–5)"

    # Base routine chosen strictly by skin type
    base = SKIN_TYPE_ROUTINES.get(skin_type, SKIN_TYPE_ROUTINES["Normal"])

    # Clone the base routine structure to avoid modifying globals
    import copy
    morning_steps = copy.deepcopy(base["morning_steps"])
    evening_steps = copy.deepcopy(base["evening_steps"])
    weekly_treatments = copy.deepcopy(base["weekly_treatments"])
    seasonal_advice = copy.deepcopy(base["seasonal_advice"])

    # Dynamic Concern Enhancements
    concerns_lower = [c.lower() for c in concerns]

    # Concern 1: Acne / Breakouts
    if any("acne" in c or "breakout" in c or "blemish" in c for c in concerns_lower):
        if skin_type != "Oily":
            # Add spot clarifier for non-oily skins dealing with acne
            morning_steps.insert(2, {
                "id": "m_acne_booster",
                "step_number": 3,
                "name": "Targeted BHA / Tea Tree Acne Spot Treatment",
                "category": "Targeted Treatment",
                "description": "Apply sparingly onto active blemishes to reduce swelling and clear bacteria without drying surrounding skin.",
                "key_ingredients": ["Salicylic Acid (BHA 1.5%)", "Tea Tree Leaf Oil", "Allantoin"],
                "frequency": "Daily Morning & Evening",
            })
            # Re-index step numbers
            for idx, s in enumerate(morning_steps):
                s["step_number"] = idx + 1

    # Concern 2: Hyperpigmentation / Dark Spots / Melasma
    if any("dark spot" in c or "pigment" in c or "uneven" in c or "melasma" in c for c in concerns_lower):
        # Enhance morning treatment or add evening brightener
        evening_steps.insert(1, {
            "id": "e_pigment_booster",
            "step_number": 2,
            "name": "Tranexamic Acid & Alpha Arbutin Dark Spot Corrector",
            "category": "Pigment Corrector",
            "description": "Clinical targeted serum inhibiting melanin synthesis to systematically fade post-acne marks and sun spots.",
            "key_ingredients": ["Tranexamic Acid 3%", "Alpha Arbutin 2%", "Licorice Root"],
            "frequency": "Nightly Treatment",
        })
        for idx, s in enumerate(evening_steps):
            s["step_number"] = idx + 1

    # Concern 3: Wrinkles / Fine Lines / Loss of Elasticity
    if any("wrinkle" in c or "fine line" in c or "aging" in c or "elasticity" in c for c in concerns_lower):
        morning_steps.insert(2, {
            "id": "m_wrinkle_booster",
            "step_number": 3,
            "name": "Copper Peptide & Matrixyl Firming Booster",
            "category": "Anti-Aging Booster",
            "description": "Deeply stimulates dermal fibroblast activity and supports collagen matrix density to diminish expression lines.",
            "key_ingredients": ["Copper Tripeptide-1", "Matrixyl Synthe-6", "Hyaluronic Acid"],
            "frequency": "Daily Morning",
        })
        for idx, s in enumerate(morning_steps):
            s["step_number"] = idx + 1

    # Concern 4: Redness / Rosacea / Extreme Sensitivity
    if any("redness" in c or "rosacea" in c or "irritat" in c for c in concerns_lower):
        if skin_type != "Sensitive":
            morning_steps.insert(1, {
                "id": "m_redness_booster",
                "step_number": 2,
                "name": "Centella Asiatica & Mugwort Calming Ampoule",
                "category": "Anti-Redness",
                "description": "Soothes cutaneous flush, constricts dilated micro-capillaries, and diminishes surface redness rapidly.",
                "key_ingredients": ["Centella Asiatica 85%", "Artemisia (Mugwort)", "Panthenol"],
                "frequency": "Daily Morning",
            })
            for idx, s in enumerate(morning_steps):
                s["step_number"] = idx + 1

    # Climate Adjustments
    if "humid" in climate.lower() or "tropical" in climate.lower():
        seasonal_advice.append({
            "title": "Climate Alert: High Humidity Environment",
            "advice": "Elevated humidity increases sebum production. Consider lighter water-based hydrators and increase cleansing frequency.",
        })
    elif "arid" in climate.lower() or "dry" in climate.lower() or "cold" in climate.lower():
        seasonal_advice.append({
            "title": "Climate Alert: Low Humidity & Cold Winds",
            "advice": "Low humidity accelerates transepidermal water loss. Reinforce moisture barrier with lipid-rich creams and room humidifiers.",
        })

    if "high" in uv_index.lower() or "extreme" in uv_index.lower():
        seasonal_advice.append({
            "title": "UV Warning: High Radiation Zone",
            "advice": "Extreme UV detected. Reapply broad-spectrum sunscreen every 2 hours and wear UV-protective sunglasses and wide-brimmed hats.",
        })

    return {
        "morning_steps": morning_steps,
        "evening_steps": evening_steps,
        "weekly_treatments": weekly_treatments,
        "seasonal_advice": seasonal_advice,
    }
