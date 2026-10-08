from typing import Any, Dict, List, Optional


CLINICAL_PRODUCT_CATALOG: List[Dict[str, Any]] = [
    # -------------------------------------------------------------------------
    # CLEANSERS
    # -------------------------------------------------------------------------
    {
        "id": "prod-cl-01",
        "name": "Hydrating Facial Cleanser",
        "brand": "CeraVe",
        "category": "CLEANSING",
        "skin_types": ["DRY", "NORMAL", "SENSITIVE"],
        "key_actives": ["Ceramides", "Hyaluronic Acid", "Glycerin"],
        "allergens_present": [],
        "texture": "Non-foaming lotion",
        "price_tier": "$",
        "clinical_rating": 4.8,
        "certifications": ["Dermatologist Tested", "Fragrance-Free", "National Eczema Association Approved"],
        "clinical_summary": "Replenishes essential ceramides (1, 3, 6-II) and restores cutaneous hydrolipidic barrier.",
    },
    {
        "id": "prod-cl-02",
        "name": "Effaclar Purifying Foaming Gel",
        "brand": "La Roche-Posay",
        "category": "CLEANSING",
        "skin_types": ["OILY", "COMBINATION", "ACNE_PRONE"],
        "key_actives": ["Zinc PCA", "Thermal Spring Water"],
        "allergens_present": [],
        "texture": "Clarifying micro-gel",
        "price_tier": "$$",
        "clinical_rating": 4.7,
        "certifications": ["Non-Comedogenic", "Soap-Free", "Alcohol-Free"],
        "clinical_summary": "Reduces excess sebum secretion by 16% without disrupting epidermal acid mantle (pH 5.5).",
    },
    {
        "id": "prod-cl-03",
        "name": "Tolérance Extremely Gentle Cleanser",
        "brand": "Avène",
        "category": "CLEANSING",
        "skin_types": ["SENSITIVE", "DRY"],
        "key_actives": ["D-Sensinose", "Avène Thermal Spring Water"],
        "allergens_present": [],
        "texture": "Ultra-light soothing gel-lotion",
        "price_tier": "$$",
        "clinical_rating": 4.9,
        "certifications": ["Sterile Cosmetics", "Preservative-Free", "Fragrance-Free"],
        "clinical_summary": "Formulated specifically for reactive and hypersensitive skin to suppress post-wash neuro-sensory redness.",
    },
    {
        "id": "prod-cl-04",
        "name": "Balancing Gel-to-Foam Cleanser",
        "brand": "Bioderma",
        "category": "CLEANSING",
        "skin_types": ["NORMAL", "COMBINATION"],
        "key_actives": ["Amino Acid Surfactants", "Panthenol"],
        "allergens_present": [],
        "texture": "Gentle foaming gel",
        "price_tier": "$",
        "clinical_rating": 4.6,
        "certifications": ["Ophthalmologist Tested", "Physiological pH"],
        "clinical_summary": "Physiological cleansing base designed for daily impurity removal with minimal stratum corneum lipid extraction.",
    },

    # -------------------------------------------------------------------------
    # TREATMENTS & SERUMS
    # -------------------------------------------------------------------------
    {
        "id": "prod-tr-01",
        "name": "C E Ferulic Combination Antioxidant Treatment",
        "brand": "SkinCeuticals",
        "category": "TREATMENT",
        "skin_types": ["NORMAL", "DRY", "COMBINATION"],
        "key_actives": ["L-Ascorbic Acid (15%)", "Alpha Tocopherol (1%)", "Ferulic Acid (0.5%)"],
        "allergens_present": ["vitamin c", "ascorbic acid"],
        "texture": "Aqueous active serum",
        "price_tier": "$$$",
        "clinical_rating": 4.9,
        "certifications": ["Duke Patent Formulation", "Clinically Proven Free Radical Neutralization"],
        "clinical_summary": "Gold-standard daytime antioxidant serum delivering 8x environmental photo-protection and collagen synthesis stimulation.",
    },
    {
        "id": "prod-tr-02",
        "name": "Niacinamide 10% + Zinc 1% High-Strength Mineral Blemish Formula",
        "brand": "The Ordinary",
        "category": "TREATMENT",
        "skin_types": ["OILY", "COMBINATION", "NORMAL"],
        "key_actives": ["Niacinamide (10%)", "Zinc PCA (1%)"],
        "allergens_present": ["niacinamide"],
        "texture": "Viscous aqueous serum",
        "price_tier": "$",
        "clinical_rating": 4.6,
        "certifications": ["Vegan", "Cruelty-Free", "Silicone-Free"],
        "clinical_summary": "Regulates sebaceous pore congestion, balances surface sheen, and calms acne-induced erythema.",
    },
    {
        "id": "prod-tr-03",
        "name": "Tranexamic Acid 5% Discoloration Defense Serum",
        "brand": "Naturium",
        "category": "TREATMENT",
        "skin_types": ["NORMAL", "DRY", "OILY", "COMBINATION"],
        "key_actives": ["Tranexamic Acid (5%)", "Kojic Acid", "Niacinamide"],
        "allergens_present": ["niacinamide"],
        "texture": "Lightweight emulsion serum",
        "price_tier": "$$",
        "clinical_rating": 4.7,
        "certifications": ["Dermatologist Formulated", "Fragrance-Free", "Paraben-Free"],
        "clinical_summary": "Inhibits plasmin-mediated melanogenesis to target stubborn UV hyperpigmentation, melasma, and post-inflammatory erythema.",
    },
    {
        "id": "prod-tr-04",
        "name": "Great Barrier Relief Restorative Serum",
        "brand": "KraveBeauty",
        "category": "TREATMENT",
        "skin_types": ["DRY", "SENSITIVE", "NORMAL"],
        "key_actives": ["Tamanu Oil", "Ceramides", "Niacinamide (2%)", "Rosa Canina"],
        "allergens_present": ["nut", "niacinamide"],
        "texture": "Conditioning milky serum",
        "price_tier": "$$",
        "clinical_rating": 4.8,
        "certifications": ["Hypoallergenic", "Reef-Safe", "Fragrance-Free"],
        "clinical_summary": "Emergency repair complex designed to soothe chemical exfoliation damage, windburn, and compromised epidermal permeability.",
    },
    {
        "id": "prod-tr-05",
        "name": "Azelaic Acid 10% Suspension",
        "brand": "The Ordinary",
        "category": "TREATMENT",
        "skin_types": ["SENSITIVE", "OILY", "COMBINATION"],
        "key_actives": ["Azelaic Acid (10%)"],
        "allergens_present": [],
        "texture": "Lightweight cream-gel",
        "price_tier": "$",
        "clinical_rating": 4.7,
        "certifications": ["Non-Comedogenic", "Fragrance-Free"],
        "clinical_summary": "Multi-action brightening and anti-microbial agent highly effective for rosacea prone, acneic, and red sensitive skin.",
    },
    {
        "id": "prod-tr-06",
        "name": "Crystal Retinal 3 Stable Retinal Night Serum",
        "brand": "Medik8",
        "category": "TREATMENT",
        "skin_types": ["NORMAL", "DRY", "COMBINATION"],
        "key_actives": ["Retinaldehyde (0.03%)", "Hyaluronic Acid", "Vitamin E"],
        "allergens_present": ["retinol", "retinoid"],
        "texture": "Encapsulated silk serum",
        "price_tier": "$$$",
        "clinical_rating": 4.9,
        "certifications": ["Time-Release Technology", "Direct Retinoic Precursor"],
        "clinical_summary": "Converts 11x faster than standard retinol with patented crystal encapsulation to accelerate dermal remodeling with minimal irritation.",
    },

    # -------------------------------------------------------------------------
    # MOISTURIZERS & BARRIER OCCLUSIVES
    # -------------------------------------------------------------------------
    {
        "id": "prod-mo-01",
        "name": "Toleriane Double Repair Face Moisturizer",
        "brand": "La Roche-Posay",
        "category": "MOISTURIZING",
        "skin_types": ["NORMAL", "DRY", "SENSITIVE", "COMBINATION"],
        "key_actives": ["Ceramide-3", "Niacinamide", "Glycerin", "Thermal Water"],
        "allergens_present": ["niacinamide"],
        "texture": "Lightweight cream",
        "price_tier": "$$",
        "clinical_rating": 4.8,
        "certifications": ["Dermatologist Tested", "Non-Comedogenic", "Fragrance-Free"],
        "clinical_summary": "Rebalances the cutaneous microbiome and provides 48-hour continuous barrier hydration.",
    },
    {
        "id": "prod-mo-02",
        "name": "Moisturizing Cream with MVE Technology",
        "brand": "CeraVe",
        "category": "MOISTURIZING",
        "skin_types": ["DRY", "NORMAL"],
        "key_actives": ["3 Essential Ceramides", "Hyaluronic Acid", "Cholesterol"],
        "allergens_present": [],
        "texture": "Rich barrier balm",
        "price_tier": "$",
        "clinical_rating": 4.8,
        "certifications": ["National Eczema Association", "Fragrance-Free"],
        "clinical_summary": "Controlled multivesicular emulsion delivery provides prolonged biomimetic lipid release.",
    },
    {
        "id": "prod-mo-03",
        "name": "Hydro Boost Hyaluronic Acid Water Gel",
        "brand": "Neutrogena",
        "category": "MOISTURIZING",
        "skin_types": ["OILY", "COMBINATION"],
        "key_actives": ["Purified Hyaluronic Acid", "Trehalose", "Amino Acids"],
        "allergens_present": [],
        "texture": "Ultra-light oil-free water gel",
        "price_tier": "$",
        "clinical_rating": 4.6,
        "certifications": ["100% Oil-Free", "Non-Comedogenic"],
        "clinical_summary": "High-velocity humectant quenching that hydrates oily and acne-prone skin without pore occlusion.",
    },
    {
        "id": "prod-mo-04",
        "name": "Cicalfate+ Restorative Protective Cream",
        "brand": "Avène",
        "category": "MOISTURIZING",
        "skin_types": ["SENSITIVE", "DRY"],
        "key_actives": ["C+Restore Postbiotic", "Copper-Zinc Sulfate Complex"],
        "allergens_present": [],
        "texture": "Rich protective paste",
        "price_tier": "$$",
        "clinical_rating": 4.9,
        "certifications": ["Safe for Post-Procedure", "Hypoallergenic", "Fragrance-Free"],
        "clinical_summary": "Creates a breathable semi-occlusive dressing effect over damaged, irritated, or chapped skin to accelerate recovery.",
    },

    # -------------------------------------------------------------------------
    # SUN PROTECTION (SPF)
    # -------------------------------------------------------------------------
    {
        "id": "prod-spf-01",
        "name": "UV Clear Broad-Spectrum SPF 46",
        "brand": "EltaMD",
        "category": "SUN_PROTECTION",
        "skin_types": ["SENSITIVE", "OILY", "ACNE_PRONE", "COMBINATION"],
        "key_actives": ["Transparent Zinc Oxide (9%)", "Niacinamide (5%)", "Hyaluronic Acid"],
        "allergens_present": ["niacinamide"],
        "texture": "Silky transparent fluid",
        "price_tier": "$$$",
        "clinical_rating": 4.9,
        "certifications": ["Skin Cancer Foundation Recommended", "Non-Comedogenic", "Fragrance-Free"],
        "clinical_summary": "The #1 dermatologist-dispensed mineral hybrid sunscreen formulated to calm acne, rosacea, and hyperpigmentation.",
    },
    {
        "id": "prod-spf-02",
        "name": "Anthelios Ultra-Light Fluid Sunscreen SPF 60",
        "brand": "La Roche-Posay",
        "category": "SUN_PROTECTION",
        "skin_types": ["NORMAL", "OILY", "COMBINATION"],
        "key_actives": ["Cell-Ox Shield Technology", "Senna Alata Extract", "Silica"],
        "allergens_present": [],
        "texture": "Invisible matte fluid",
        "price_tier": "$$",
        "clinical_rating": 4.8,
        "certifications": ["Water Resistant (80 mins)", "Fast Absorbing", "Fragrance-Free"],
        "clinical_summary": "Broad-spectrum UVA/UVB filter system paired with powerful cellular antioxidant complex for high UV index climates.",
    },
    {
        "id": "prod-spf-03",
        "name": "Eryfotona Actinica Ultralight Mineral Sunscreen SPF 50+",
        "brand": "ISDIN",
        "category": "SUN_PROTECTION",
        "skin_types": ["NORMAL", "DRY", "SENSITIVE"],
        "key_actives": ["Zinc Oxide (11%)", "DNA Repairsomes (Plankton Extract)", "Vitamin E"],
        "allergens_present": [],
        "texture": "Featherlight 100% mineral emulsion",
        "price_tier": "$$$",
        "clinical_rating": 4.9,
        "certifications": ["Dermatologist Approved", "Actinic Damage Repair Certified"],
        "clinical_summary": "Patented mineral shield delivering topical DNA Repairsomes that help correct past actinic sun damage.",
    },

    # -------------------------------------------------------------------------
    # EXFOLIATION & MASKS
    # -------------------------------------------------------------------------
    {
        "id": "prod-ex-01",
        "name": "Skin Perfecting 2% BHA Liquid Exfoliant",
        "brand": "Paula's Choice",
        "category": "EXFOLIATION",
        "skin_types": ["OILY", "COMBINATION", "NORMAL"],
        "key_actives": ["Salicylic Acid (2%)", "Green Tea Leaf Extract"],
        "allergens_present": ["salicylic", "bha"],
        "texture": "Rapid-penetrating liquid toner",
        "price_tier": "$$",
        "clinical_rating": 4.8,
        "certifications": ["Clinically Proven", "Fragrance-Free", "Non-Abrasive"],
        "clinical_summary": "Lipophilic BHA dissolves built-up dead skin within pore lining, drastically minimizing blackheads and enlarged pores.",
    },
    {
        "id": "prod-ex-02",
        "name": "Calm Down 4% PHA + BHA Liquid",
        "brand": "Geek & Gorgeous",
        "category": "EXFOLIATION",
        "skin_types": ["SENSITIVE", "DRY", "NORMAL"],
        "key_actives": ["Gluconolactone (3.2%)", "Lactobionic Acid (0.8%)", "BHA (0.8%)"],
        "allergens_present": ["salicylic", "bha"],
        "texture": "Soothing aqueous toner",
        "price_tier": "$",
        "clinical_rating": 4.7,
        "certifications": ["Fragrance-Free", "Cruelty-Free"],
        "clinical_summary": "Polyhydroxy acids offer molecularly larger, slow-release exfoliation that strengthens sensitive skin while gently smoothing texture.",
    },
    {
        "id": "prod-ex-03",
        "name": "Papaya Enzyme Clarifying Mask",
        "brand": "Elemis",
        "category": "EXFOLIATION",
        "skin_types": ["SENSITIVE", "DRY"],
        "key_actives": ["Papain Enzymes", "Bladderwrack Extract", "Milk Protein"],
        "allergens_present": [],
        "texture": "Velvety botanical cream mask",
        "price_tier": "$$$",
        "clinical_rating": 4.7,
        "certifications": ["Dermatologist Approved", "Non-Abrasive"],
        "clinical_summary": "Natural proteolytic fruit enzymes digest dead keratin without mechanical friction, ideal for reactive skin.",
    },

    # -------------------------------------------------------------------------
    # NIGHT CARE & RECOVERY
    # -------------------------------------------------------------------------
    {
        "id": "prod-nc-01",
        "name": "Skin Renewing Night Cream",
        "brand": "CeraVe",
        "category": "NIGHT_CARE",
        "skin_types": ["DRY", "NORMAL", "COMBINATION"],
        "key_actives": ["Biomimetic Peptides", "Ceramides", "Niacinamide", "Hyaluronic Acid"],
        "allergens_present": ["niacinamide"],
        "texture": "Rich restorative night cream",
        "price_tier": "$$",
        "clinical_rating": 4.8,
        "certifications": ["Non-Comedogenic", "Fragrance-Free"],
        "clinical_summary": "Supplements nocturnal epidermal cell turnover and reinforces dermal matrix elasticity during circadian repair hours.",
    },
    {
        "id": "prod-nc-02",
        "name": "Cica Sleeping Mask",
        "brand": "Laneige",
        "category": "NIGHT_CARE",
        "skin_types": ["SENSITIVE", "DRY", "NORMAL"],
        "key_actives": ["Forest Yeast Extract", "Panthenol", "Shea Butter"],
        "allergens_present": ["nut"],
        "texture": "Comforting cocoon cream",
        "price_tier": "$$",
        "clinical_rating": 4.7,
        "certifications": ["Dermatologically Tested", "Hypoallergenic"],
        "clinical_summary": "Patented Forest Yeast active provides 111.9% greater barrier recovery efficacy than madecassoside during sleep.",
    },
]


def match_products_for_step(
    category: str,
    skin_type: str,
    key_actives: Optional[List[str]],
    forbidden_tokens: List[str],
    limit: int = 2,
) -> List[Dict[str, Any]]:
    """
    Selects top clinical product matches for a routine step, strictly
    eliminating any products containing user allergens and sorting by compatibility.
    """
    matched: List[Dict[str, Any]] = []
    category_upper = category.upper()
    skin_type_upper = skin_type.upper()
    actives_lower = [a.lower() for a in (key_actives or [])]

    # Map routine step categories to product catalog categories
    cat_mapping = {
        "CLEANSING": ["CLEANSING"],
        "TREATMENT": ["TREATMENT", "EXFOLIATION"],
        "MOISTURIZING": ["MOISTURIZING"],
        "SUN_PROTECTION": ["SUN_PROTECTION"],
        "NIGHT_CARE": ["NIGHT_CARE", "MOISTURIZING"],
        "EXFOLIATION": ["EXFOLIATION", "TREATMENT"],
    }
    allowed_cats = cat_mapping.get(category_upper, [category_upper])

    for prod in CLINICAL_PRODUCT_CATALOG:
        if prod["category"] not in allowed_cats:
            continue

        # Strict allergy check
        is_allergen_free = True
        for allergen in prod["allergens_present"]:
            for token in forbidden_tokens:
                if token in allergen or allergen in token:
                    is_allergen_free = False
                    break
            if not is_allergen_free:
                break

        if not is_allergen_free:
            continue

        # Calculate compatibility match score (85 - 99%)
        score = 85
        if skin_type_upper in [st.upper() for st in prod["skin_types"]]:
            score += 8

        # Bonus for overlapping key actives
        for pa in prod["key_actives"]:
            for ka in actives_lower:
                if any(k in pa.lower() for k in ka.split()):
                    score += 4
                    break

        score = min(99, score)

        matched.append({
            "id": prod["id"],
            "name": prod["name"],
            "brand": prod["brand"],
            "category": prod["category"],
            "key_actives": prod["key_actives"],
            "texture": prod["texture"],
            "price_tier": prod["price_tier"],
            "clinical_rating": prod["clinical_rating"],
            "certifications": prod["certifications"],
            "clinical_summary": prod["clinical_summary"],
            "match_score": score,
            "allergen_tested": True,
        })

    # Sort descending by match score
    matched.sort(key=lambda x: x["match_score"], reverse=True)
    return matched[:limit]
