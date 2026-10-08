"""
Ingredient Intelligence Module
==============================
Covers:
- Ingredient Analysis & Suitability Assessment
- Pairwise Ingredient Interaction Analysis (Conflicts & Synergies)
- Allergy & Sensitivity Detection
- Ingredient Education & Category Guides

8 Standard Categories:
1. Retinoids
2. Niacinamide
3. Vitamin C
4. Hyaluronic Acid
5. Salicylic Acid
6. Ceramides
7. Peptides
8. AHAs/BHAs
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional, Set, Tuple


# ==============================================================================
# 1. EDUCATIONAL KNOWLEDGE BASE: 8 CORE INGREDIENT CATEGORIES
# ==============================================================================

CATEGORIES_EDUCATION: Dict[str, Dict[str, Any]] = {
    "Retinoids": {
        "name": "Retinoids",
        "description": "Vitamin A derivatives that accelerate cellular turnover and stimulate deep collagen synthesis.",
        "benefits": [
            "Reduces fine lines and wrinkles",
            "Smooths uneven skin texture",
            "Prevents clogged pores and acne",
            "Fades stubborn post-inflammatory hyperpigmentation",
        ],
        "best_time": "Evening (PM)",
        "how_to_use": "Start 2–3 nights per week on dry skin. Follow with a ceramide moisturizer. Always wear SPF 50 the next morning.",
        "cautions": "Can cause initial purging, dryness, and flaking (retinization). Avoid during pregnancy or breastfeeding.",
        "hero_ingredients": ["Retinol", "Retinaldehyde", "Granactive Retinoid", "Adapalene"],
        "suitable_for": ["Normal", "Oily", "Combination", "Aging skin", "Acne-prone skin"],
    },
    "Niacinamide": {
        "name": "Niacinamide",
        "description": "Vitamin B3, a multifaceted water-soluble vitamin that regulates sebum, repairs the lipid barrier, and calms redness.",
        "benefits": [
            "Regulates excess sebum production",
            "Minimizes the appearance of enlarged pores",
            "Strengthens skin's lipid barrier",
            "Reduces blotchiness, redness, and inflammation",
        ],
        "best_time": "Morning (AM) & Evening (PM)",
        "how_to_use": "Apply 2–5 drops onto clean skin before heavier creams. Safe for daily morning and night use.",
        "cautions": "Concentrations above 10% can cause temporary flushing in hypersensitive skin.",
        "hero_ingredients": ["Niacinamide (Vitamin B3)", "Nicotinamide"],
        "suitable_for": ["All skin types", "Oily", "Sensitive", "Acne-prone", "Combination"],
    },
    "Vitamin C": {
        "name": "Vitamin C",
        "description": "A gold-standard antioxidant that neutralizes environmental free radicals, boosts collagen, and inhibits tyrosinase to fade dark spots.",
        "benefits": [
            "Brightens dull complexion",
            "Fades dark spots and UV sun damage",
            "Provides potent antioxidant defense against pollution",
            "Boosts sunscreen photoprotection",
        ],
        "best_time": "Morning (AM)",
        "how_to_use": "Apply in the morning onto clean skin before moisturizer and sunscreen for maximum environmental defense.",
        "cautions": "Pure L-Ascorbic Acid can sting sensitive skin and oxidizes when exposed to air/light. Store in a cool, dark place.",
        "hero_ingredients": ["L-Ascorbic Acid", "Ethyl Ascorbic Acid", "Ascorbyl Glucoside", "Sodium Ascorbyl Phosphate"],
        "suitable_for": ["Normal", "Dry", "Combination", "Hyperpigmentation-prone"],
    },
    "Hyaluronic Acid": {
        "name": "Hyaluronic Acid",
        "description": "A powerful humectant naturally found in skin that holds up to 1,000 times its weight in water.",
        "benefits": [
            "Delivers multi-depth epidermal hydration",
            "Instantly plumps fine dehydration lines",
            "Improves skin suppleness and elasticity",
            "Soothes irritated or parched skin",
        ],
        "best_time": "Morning (AM) & Evening (PM)",
        "how_to_use": "Always apply to slightly damp skin and lock in immediately with a moisturizer to seal hydration.",
        "cautions": "In very dry climates, applying to dry skin without a sealing moisturizer can draw moisture out of the dermis.",
        "hero_ingredients": ["Sodium Hyaluronate", "Hydrolyzed Hyaluronic Acid", "Sodium Hyaluronate Crosspolymer"],
        "suitable_for": ["All skin types", "Dry", "Dehydrated", "Sensitive"],
    },
    "Salicylic Acid": {
        "name": "Salicylic Acid",
        "description": "An oil-soluble Beta Hydroxy Acid (BHA) that penetrates inside pores to dissolve sebum plugs and exfoliate dead cells.",
        "benefits": [
            "Unclogs congested pores and dissolves blackheads",
            "Prevents and resolves active acne breakouts",
            "Calms swelling and inflamed blemishes",
            "Smooths bumpy skin texture",
        ],
        "best_time": "Morning (AM) or Evening (PM) (2–4x/week)",
        "how_to_use": "Use 2–4 times weekly after cleansing. Leave on or rinse off depending on formula. Always hydrate well after.",
        "cautions": "Avoid if allergic to Aspirin or salicylates. Can cause dryness if overused.",
        "hero_ingredients": ["Salicylic Acid (BHA)", "Betaine Salicylate", "Willow Bark Extract"],
        "suitable_for": ["Oily", "Combination", "Acne-prone", "Congested skin"],
    },
    "Ceramides": {
        "name": "Ceramides",
        "description": "Biomimetic waxy lipids that comprise over 50% of the natural stratum corneum intercellular matrix.",
        "benefits": [
            "Restores and strengthens compromised skin barriers",
            "Locks in moisture and prevents Transepidermal Water Loss (TEWL)",
            "Protects skin from environmental allergens and pathogens",
            "Relieves peeling, flaking, and stinging sensations",
        ],
        "best_time": "Morning (AM) & Evening (PM)",
        "how_to_use": "Use daily as a moisturizer step. Especially essential after applying active treatments like Retinoids or AHAs.",
        "cautions": "Extremely biocompatible with virtually zero risk of irritation.",
        "hero_ingredients": ["Ceramide NP", "Ceramide AP", "Ceramide EOP", "Phytosphingosine"],
        "suitable_for": ["All skin types", "Dry", "Sensitive", "Barrier-compromised", "Eczema-prone"],
    },
    "Peptides": {
        "name": "Peptides",
        "description": "Short chains of amino acids that act as cellular messengers, signaling skin fibroblasts to generate new collagen and elastin.",
        "benefits": [
            "Supports structural skin firmness and bounce",
            "Softens expression lines and wrinkles",
            "Accelerates epidermal repair and healing",
            "Non-irritating alternative or booster to retinoids",
        ],
        "best_time": "Morning (AM) & Evening (PM)",
        "how_to_use": "Apply serum after cleansing/toning and before heavy creams. Pairs seamlessly with Hyaluronic Acid and Niacinamide.",
        "cautions": "Copper peptides should not be mixed directly with strong direct acids (AHAs/BHAs) or pure L-Ascorbic Acid.",
        "hero_ingredients": ["Matrixyl 3000", "Copper Tripeptide-1", "Argireline (Acetyl Hexapeptide-8)", "Palmitoyl Tripeptide"],
        "suitable_for": ["All skin types", "Aging skin", "Sensitive skin", "Loss of firmness"],
    },
    "AHAs/BHAs": {
        "name": "AHAs/BHAs",
        "description": "Alpha Hydroxy Acids (water-soluble, surface exfoliants) and Beta Hydroxy Acids (oil-soluble pore exfoliants).",
        "benefits": [
            "Dissolves dull, dead surface skin cells",
            "Smooths rough texture and dry patches",
            "Fades superficial hyperpigmentation and sun spots",
            "Enhances absorption of subsequent skincare treatments",
        ],
        "best_time": "Evening (PM) (1–2x/week)",
        "how_to_use": "Introduce slowly 1–2 evenings per week. Do not combine with Retinoids in the same evening session.",
        "cautions": "Increases photosensitivity to UV radiation. Mandatory daily sunscreen use. Skip on sensitized or broken skin.",
        "hero_ingredients": ["Glycolic Acid (AHA)", "Lactic Acid (AHA)", "Mandelic Acid (AHA)", "Salicylic Acid (BHA)"],
        "suitable_for": ["Normal", "Dry (Lactic/Glycolic)", "Oily/Acne-prone (Salicylic)", "Dull skin"],
    },
}


# ==============================================================================
# 2. INGREDIENT DATABASE WITH CATEGORY MAPPINGS
# ==============================================================================

INGREDIENT_DB: Dict[str, Dict[str, Any]] = {
    "niacinamide": {
        "category": "Niacinamide",
        "display_name": "Niacinamide (Vitamin B3)",
        "benefits": ["Controls oil", "Improves barrier", "Reduces redness", "Fades dark spots", "Refines pores"],
        "good_for": ["acne", "oily skin", "hyperpigmentation", "dark spots", "redness", "sensitive skin", "enlarged pores"],
        "caution": "Start with 2–5% if skin is hypersensitive; high concentrations can cause temporary flushing",
        "avoid_if": [],
        "best_time": "AM & PM",
        "how_to_use": "Apply 2–3 drops after water-based toner, before moisturizer.",
    },
    "salicylic acid": {
        "category": "Salicylic Acid",
        "display_name": "Salicylic Acid (BHA)",
        "benefits": ["Unclogs deep pores", "Clears blackheads", "Reduces acne", "Smooths bumpy texture"],
        "good_for": ["acne", "oily skin", "pores", "blackheads", "congested skin"],
        "caution": "Can be drying; avoid if allergic to aspirin. Always follow with moisturizer",
        "avoid_if": ["very dry", "aspirin allergy", "reactive", "compromised barrier"],
        "best_time": "PM (2–3 nights/week)",
        "how_to_use": "Apply to clean, dry skin 2–3 evenings per week.",
    },
    "hyaluronic acid": {
        "category": "Hyaluronic Acid",
        "display_name": "Hyaluronic Acid",
        "benefits": ["Multi-depth hydration", "Plumps fine dehydration lines", "Supports barrier resilience", "Instant suppleness"],
        "good_for": ["dry skin", "dehydration", "fine lines", "sensitive skin", "dullness"],
        "caution": "Apply onto damp skin; seal with cream so it locks water inside",
        "avoid_if": [],
        "best_time": "AM & PM",
        "how_to_use": "Pat 2–3 drops onto damp skin right after cleansing/misting.",
    },
    "ceramides": {
        "category": "Ceramides",
        "display_name": "Ceramides (NP, AP, EOP)",
        "benefits": ["Repairs stratum corneum barrier", "Locks in moisture", "Soothes irritation", "Prevents moisture loss (TEWL)"],
        "good_for": ["dry skin", "sensitive skin", "redness", "barrier damage", "eczema", "flaking skin"],
        "caution": "Extremely safe and well-tolerated by virtually all skin types",
        "avoid_if": [],
        "best_time": "AM & PM",
        "how_to_use": "Use as a daily moisturizer cream morning and night.",
    },
    "retinol": {
        "category": "Retinoids",
        "display_name": "Retinol / Retinoids",
        "benefits": ["Accelerates cell renewal", "Reduces fine lines and wrinkles", "Improves skin firmness", "Clears adult acne"],
        "good_for": ["wrinkles", "fine lines", "acne", "uneven skin tone", "aging", "dullness"],
        "caution": "Introduce slowly (2 nights/week). Do not combine with AHAs/BHAs. Daily SPF 50 is mandatory",
        "avoid_if": ["sensitive", "pregnancy", "breastfeeding", "reactive", "open wounds"],
        "best_time": "PM only",
        "how_to_use": "Apply pea-sized amount to completely dry skin at night; follow with ceramide moisturizer.",
    },
    "vitamin c": {
        "category": "Vitamin C",
        "display_name": "Vitamin C (L-Ascorbic Acid)",
        "benefits": ["Brightens complexion", "Fades dark spots and sun damage", "Provides antioxidant shield", "Boosts collagen"],
        "good_for": ["hyperpigmentation", "dark spots", "dullness", "uneven skin tone", "sun damage"],
        "caution": "Can cause tingling on sensitive skin; store away from direct sunlight",
        "avoid_if": ["very sensitive", "reactive", "active eczema"],
        "best_time": "AM under SPF",
        "how_to_use": "Apply in morning before moisturizer and sunscreen for photoprotection synergy.",
    },
    "peptides": {
        "category": "Peptides",
        "display_name": "Peptides (Matrixyl & Signal Peptides)",
        "benefits": ["Stimulates collagen and elastin synthesis", "Improves skin firmness and elasticity", "Gentle anti-aging", "Supports skin barrier"],
        "good_for": ["fine lines", "wrinkles", "loss of firmness", "aging", "sensitive skin"],
        "caution": "Do not mix copper peptides directly with pure vitamin C or direct AHA/BHA exfoliants",
        "avoid_if": [],
        "best_time": "AM & PM",
        "how_to_use": "Layer serum after cleansing, before heavier creams.",
    },
    "glycolic acid": {
        "category": "AHAs/BHAs",
        "display_name": "Glycolic Acid (AHA)",
        "benefits": ["Surface cellular exfoliation", "Fades dark spots", "Smooths rough texture", "Improves natural glow"],
        "good_for": ["uneven skin tone", "hyperpigmentation", "rough texture", "dullness", "fine lines"],
        "caution": "Increases sun sensitivity; do not combine with Retinol in the same evening routine",
        "avoid_if": ["sensitive", "reactive", "broken barrier", "sunburned skin"],
        "best_time": "PM (1–2 nights/week)",
        "how_to_use": "Use 1–2 times weekly in the evening. Always wear SPF the next morning.",
    },
    "lactic acid": {
        "category": "AHAs/BHAs",
        "display_name": "Lactic Acid (AHA)",
        "benefits": ["Gentle surface exfoliation", "Natural humectant moisture attraction", "Brightens dull skin", "Smoother texture"],
        "good_for": ["dry skin", "dullness", "uneven texture", "hyperpigmentation", "mild sensitivity"],
        "caution": "Gentler than glycolic acid, but still requires daily sunscreen use",
        "avoid_if": ["very reactive", "compromised barrier"],
        "best_time": "PM (1–2 nights/week)",
        "how_to_use": "Apply in evening routine, followed by hydrating ceramide cream.",
    },
    "azelaic acid": {
        "category": "Niacinamide",
        "display_name": "Azelaic Acid",
        "benefits": ["Calms inflammatory redness", "Combats acne bacteria", "Fades post-inflammatory erythema", "Gentle on sensitive skin"],
        "good_for": ["acne", "redness", "rosacea", "hyperpigmentation", "sensitive skin"],
        "caution": "Can cause mild transient tingling during the first week of use",
        "avoid_if": [],
        "best_time": "AM or PM",
        "how_to_use": "Apply thin layer to affected zones before moisturizer.",
    },
    "centella": {
        "category": "Ceramides",
        "display_name": "Centella Asiatica (Cica)",
        "benefits": ["Calms acute redness", "Accelerates wound healing", "Soothes irritated skin", "Strengthens barrier"],
        "good_for": ["sensitive skin", "redness", "barrier damage", "acne inflammation", "reactive skin"],
        "caution": "Extremely soothing and suitable for compromised skin",
        "avoid_if": [],
        "best_time": "AM & PM",
        "how_to_use": "Use liberally whenever skin feels tight, hot, or irritated.",
    },
    "panthenol": {
        "category": "Ceramides",
        "display_name": "Panthenol (Pro-Vitamin B5)",
        "benefits": ["Deeply hydrates", "Relieves stinging and itchiness", "Enhances lipid barrier repair", "Skin conditioning"],
        "good_for": ["sensitive skin", "dry skin", "redness", "barrier damage"],
        "caution": "Safe and gentle daily ingredient",
        "avoid_if": [],
        "best_time": "AM & PM",
        "how_to_use": "Can be used morning and evening in toners, serums, or creams.",
    },
    "squalane": {
        "category": "Ceramides",
        "display_name": "Squalane (Biomimetic Lipid)",
        "benefits": ["Lightweight non-comedogenic hydration", "Locks in moisture without clogging pores", "Softens skin texture"],
        "good_for": ["dry skin", "dehydration", "sensitive skin", "combination skin"],
        "caution": "Non-greasy oil that mimics natural skin squalene",
        "avoid_if": [],
        "best_time": "AM & PM",
        "how_to_use": "Press 2–3 drops into skin as the final step of moisturizing.",
    },
}


# ==============================================================================
# 3. PAIRWISE INGREDIENT INTERACTION KNOWLEDGE BASE
# ==============================================================================

INTERACTION_RULES: List[Dict[str, Any]] = [
    {
        "pair": {"retinol", "glycolic acid"},
        "type": "Conflict / Caution",
        "severity": "High",
        "title": "Retinoids + AHAs/BHAs (Over-Exfoliation Risk)",
        "explanation": "Both accelerate epidermal cell turnover. Combining them in the same routine risks barrier degradation, extreme peeling, and erythema.",
        "action": "Do not layer together. Alternate nights (e.g. Retinol Mon/Wed/Fri, Glycolic Acid Tue/Sat).",
    },
    {
        "pair": {"retinol", "salicylic acid"},
        "type": "Conflict / Caution",
        "severity": "High",
        "title": "Retinoids + Salicylic Acid (Drying Conflict)",
        "explanation": "Simultaneous use can strip natural sebum and trigger severe dryness and reactive breakout flare-ups.",
        "action": "Use Salicylic Acid in the morning (or on alternate evenings) and Retinol at night.",
    },
    {
        "pair": {"retinol", "vitamin c"},
        "type": "Timing Separation",
        "severity": "Medium",
        "title": "Retinoids + Pure Vitamin C (pH & Irritation Conflict)",
        "explanation": "Pure L-Ascorbic Acid operates at low acidic pH (<3.5), whereas Retinol performs best at neutral pH. Layering simultaneously can provoke skin irritation.",
        "action": "Separate routines: Apply Vitamin C in the morning (for antioxidant protection) and Retinol at night (for repair).",
    },
    {
        "pair": {"glycolic acid", "vitamin c"},
        "type": "Timing Separation",
        "severity": "Medium",
        "title": "AHAs/BHAs + Vitamin C (Acid Overload)",
        "explanation": "Layering multiple direct acids simultaneously drops skin surface pH too low, causing stinging, redness, and compromise of the stratum corneum.",
        "action": "Apply Vitamin C in the morning and AHAs/BHAs in the evening, or on alternating days.",
    },
    {
        "pair": {"peptides", "glycolic acid"},
        "type": "Conflict / Caution",
        "severity": "Medium",
        "title": "Peptides + Direct Chemical Acids (Hydrolyzation)",
        "explanation": "Strong acids break down fragile peptide bonds, hydrolyzing and rendering signal peptides inactive.",
        "action": "Use peptides in routines without direct acids (e.g., Peptides AM, Exfoliating Acids PM).",
    },
    {
        "pair": {"niacinamide", "salicylic acid"},
        "type": "Synergy",
        "severity": "Beneficial",
        "title": "Niacinamide + Salicylic Acid (Pore & Sebum Power Duo)",
        "explanation": "Salicylic acid clears pores from deep within while Niacinamide regulates oil flow and calms surrounding redness.",
        "action": "Safe and highly effective when layered together in the same routine.",
    },
    {
        "pair": {"hyaluronic acid", "ceramides"},
        "type": "Synergy",
        "severity": "Beneficial",
        "title": "Hyaluronic Acid + Ceramides (Ultimate Moisture Seal)",
        "explanation": "Hyaluronic acid draws water into epidermal cells, while ceramides seal the lipid barrier to prevent water evaporation.",
        "action": "Apply Hyaluronic Acid onto damp skin, then seal immediately with a ceramide cream.",
    },
    {
        "pair": {"peptides", "retinol"},
        "type": "Synergy",
        "severity": "Beneficial",
        "title": "Peptides + Retinoids (Complementary Collagen Synthesis)",
        "explanation": "Retinol accelerates cell renewal while peptides supply amino acid signals to rebuild structural collagen.",
        "action": "Layer peptide serum before applying retinol, or use on alternate evenings for gentle anti-aging.",
    },
    {
        "pair": {"ceramides", "retinol"},
        "type": "Synergy",
        "severity": "Beneficial",
        "title": "Ceramides + Retinoids (Barrier Protection & Buffering)",
        "explanation": "Ceramides replenish the lipid matrix, mitigating retinoid dryness, flaking, and retinization irritation.",
        "action": "Apply ceramide cream after retinol (the 'sandwich method') to increase skin tolerance.",
    },
    {
        "pair": {"vitamin c", "niacinamide"},
        "type": "Synergy",
        "severity": "Beneficial",
        "title": "Vitamin C + Niacinamide (Advanced Brightening Duo)",
        "explanation": "Modern formulations target hyperpigmentation along multiple pathways: Vitamin C inhibits tyrosinase while Niacinamide blocks melanosome transfer.",
        "action": "Both can be used in your morning routine under sunscreen for maximum luminous clarity.",
    },
]


# ==============================================================================
# 4. ALLERGY & SENSITIVITY DETECTION RULES
# ==============================================================================

ALLERGEN_PATTERNS = [
    {
        "trigger": ["aspirin", "salicylate", "nsaid"],
        "flagged_ingredients": ["salicylic acid", "salicylic acid (bha)", "willow bark"],
        "severity": "High",
        "warning": "Salicylate Sensitivity: Cross-reactive with aspirin. Avoid Salicylic Acid (BHA). Consider Niacinamide or Azelaic Acid instead.",
    },
    {
        "trigger": ["retinoid", "retinol", "vitamin a"],
        "flagged_ingredients": ["retinol", "retinoids", "adapalene"],
        "severity": "High",
        "warning": "Retinoid Hypersensitivity: Avoid synthetic retinoids. Opt for Peptides or Bakuchiol as gentle collagen boosters.",
    },
    {
        "trigger": ["fragrance", "perfume", "parfum", "essential oil"],
        "flagged_ingredients": ["fragrance", "limonene", "linalool", "essential oils"],
        "severity": "Medium",
        "warning": "Fragrance Sensitivity: Ensure all cleansers, serums, and moisturizers are 100% fragrance-free to avoid contact dermatitis.",
    },
    {
        "trigger": ["nut", "almond", "tree nut"],
        "flagged_ingredients": ["mandelic acid", "almond oil", "argan oil"],
        "severity": "Medium",
        "warning": "Nut Allergy: Mandelic Acid is derived from bitter almonds; verify manufacturer sourcing or patch test before topical use.",
    },
    {
        "trigger": ["sensitive", "reactive", "eczema", "rosacea", "compromised barrier"],
        "flagged_ingredients": ["glycolic acid", "retinol"],
        "severity": "Medium",
        "warning": "Barrier Fragility Detected: High-strength AHAs and Retinoids may trigger stinging or redness. Prioritize Ceramides, Panthenol, and Centella.",
    },
]


def _normalize(text: str) -> str:
    return (text or "").lower().strip()


# ==============================================================================
# 5. ALLERGY DETECTION FUNCTION
# ==============================================================================

def detect_ingredient_allergies(
    profile: Dict[str, Any],
    ingredients_to_check: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """
    Checks user allergies and sensitivities against common skincare actives and allergens.
    """
    allergies = _normalize(profile.get("allergies") or "")
    sensitivities = _normalize(profile.get("sensitivities") or "")
    combined_user_text = f"{allergies} {sensitivities}"

    detected_warnings: List[Dict[str, Any]] = []

    for rule in ALLERGEN_PATTERNS:
        matches_user = any(t in combined_user_text for t in rule["trigger"])
        if matches_user:
            detected_warnings.append({
                "severity": rule["severity"],
                "warning": rule["warning"],
                "flagged_ingredients": rule["flagged_ingredients"],
            })

    return detected_warnings


# ==============================================================================
# 6. INGREDIENT INTERACTION ANALYSIS FUNCTION
# ==============================================================================

def analyze_ingredient_interactions(
    ingredients_list: List[str],
) -> Dict[str, Any]:
    """
    Analyzes a list of active ingredients for pairwise conflicts and synergies.
    """
    cleaned = [_normalize(i) for i in ingredients_list]

    conflicts = []
    synergies = []

    # Map each item to canonical keys in INTERACTION_RULES
    canonical_present = set()
    for item in cleaned:
        for key in INGREDIENT_DB.keys():
            if key in item or item in key:
                canonical_present.add(key)

    for rule in INTERACTION_RULES:
        pair = rule["pair"]
        if pair.issubset(canonical_present):
            entry = {
                "title": rule["title"],
                "type": rule["type"],
                "severity": rule["severity"],
                "explanation": rule["explanation"],
                "action": rule["action"],
            }
            if "conflict" in rule["type"].lower() or "separation" in rule["type"].lower():
                conflicts.append(entry)
            else:
                synergies.append(entry)

    return {
        "conflicts": conflicts,
        "synergies": synergies,
        "total_conflicts": len(conflicts),
        "total_synergies": len(synergies),
        "safety_status": "Attention Required" if conflicts else "Safe & Harmonious",
    }


# ==============================================================================
# 7. INGREDIENT SUITABILITY ASSESSMENT & INSIGHTS GENERATOR
# ==============================================================================

def assess_ingredient_suitability(
    ingredient_name: str,
    profile: Dict[str, Any],
    top_concerns: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Evaluates suitability score (0–100) and rationale for a single ingredient.
    """
    skin_type = _normalize(profile.get("skin_type") or "normal")
    raw_concerns = _normalize(profile.get("skin_concerns") or "")
    sensitivities = _normalize(profile.get("sensitivities") or "")
    allergies = _normalize(profile.get("allergies") or "")

    key = _normalize(ingredient_name)
    meta = INGREDIENT_DB.get(key)
    if not meta:
        for k, v in INGREDIENT_DB.items():
            if k in key or key in k:
                meta = v
                key = k
                break

    if not meta:
        return {
            "ingredient": ingredient_name.title(),
            "suitability_score": 50,
            "suitability_level": "Compatible",
            "reason": "Generally skin compatible",
            "benefits": ["Supports overall skin maintenance"],
            "caution": "Perform a 24h patch test before full face use.",
            "category": "Other",
        }

    # Build concern set
    concern_set = set()
    if top_concerns:
        for c in top_concerns:
            concern_set.add(_normalize(c))
    for c in ["acne", "hyperpigmentation", "dark spots", "dry skin", "oily skin",
              "sensitive skin", "redness", "wrinkles", "fine lines", "uneven skin tone",
              "dehydration", "dullness", "enlarged pores", "loss of firmness"]:
        if c in raw_concerns:
            concern_set.add(c)

    if skin_type == "oily":
        concern_set.add("oily skin")
    if skin_type == "dry":
        concern_set.add("dry skin")
    if skin_type == "sensitive" or "sensitive" in sensitivities or "reactive" in sensitivities:
        concern_set.add("sensitive skin")
        concern_set.add("redness")

    score = 50  # baseline
    matched_concerns = []

    for g in meta["good_for"]:
        if g in concern_set:
            score += 10
            matched_concerns.append(g)

    # Skin type bonuses
    if skin_type == "oily" and key in ["niacinamide", "salicylic acid", "azelaic acid"]:
        score += 15
    if skin_type == "dry" and key in ["hyaluronic acid", "ceramides", "panthenol", "squalane", "lactic acid"]:
        score += 15
    if skin_type == "sensitive" and key in ["ceramides", "centella", "panthenol", "peptides"]:
        score += 15

    # Check contraindications / sensitivities
    is_contraindicated = False
    for a in meta["avoid_if"]:
        if a in sensitivities or a in allergies or a in skin_type:
            is_contraindicated = True
            score -= 35

    score = max(10, min(100, score))

    if is_contraindicated:
        level = "Contraindicated / Avoid"
    elif score >= 80:
        level = "Highly Suitable"
    elif score >= 60:
        level = "Compatible"
    else:
        level = "Use With Caution"

    reason = "Targeted match for " + ", ".join(matched_concerns[:2]) if matched_concerns else "Supports overall skin health"

    return {
        "ingredient": meta.get("display_name", key.title()),
        "canonical_key": key,
        "category": meta.get("category", "General"),
        "suitability_score": score,
        "suitability_level": level,
        "reason": reason,
        "benefits": meta["benefits"],
        "caution": meta["caution"],
        "best_time": meta.get("best_time", "AM & PM"),
        "how_to_use": meta.get("how_to_use", ""),
    }


def generate_ingredient_insights(
    profile: Dict[str, Any],
    top_concerns: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """
    Preserved & enhanced function called by assess_skin.
    Returns prioritized top recommended ingredients.
    """
    evaluated = []
    for key in INGREDIENT_DB.keys():
        res = assess_ingredient_suitability(key, profile, top_concerns)
        if "avoid" not in res["suitability_level"].lower():
            evaluated.append(res)

    # Sort by suitability score descending
    evaluated.sort(key=lambda x: x["suitability_score"], reverse=True)

    # Return top 6 items formatted for frontend display
    results = []
    for item in evaluated[:6]:
        results.append({
            "ingredient": item["ingredient"],
            "category": item["category"],
            "reason": item["reason"],
            "benefits": item["benefits"][:3],
            "caution": item["caution"],
            "suitability_score": item["suitability_score"],
            "suitability_level": item["suitability_level"],
            "best_time": item["best_time"],
        })

    return results


# ==============================================================================
# 8. COMPREHENSIVE INGREDIENT INTELLIGENCE SUITE
# ==============================================================================

def get_comprehensive_ingredient_intelligence(
    profile: Dict[str, Any],
    top_concerns: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Returns full analysis across all 8 categories, interaction matrix,
    allergy detection, and educational guide.
    """
    # 1. Evaluate all DB ingredients
    all_evaluated = []
    active_keys = []
    for key in INGREDIENT_DB.keys():
        eval_item = assess_ingredient_suitability(key, profile, top_concerns)
        all_evaluated.append(eval_item)
        if eval_item["suitability_score"] >= 65:
            active_keys.append(key)

    # 2. Pairwise interaction analysis among top-matching actives
    top_keys = [
        item.get("canonical_key") for item in sorted(all_evaluated, key=lambda x: x["suitability_score"], reverse=True)[:6]
        if item.get("canonical_key")
    ]
    combined_actives = list(set(active_keys + top_keys))
    interactions = analyze_ingredient_interactions(combined_actives)

    # Attach curated interaction reference rules for education
    interactions["curated_rules"] = [
        {
            "title": r["title"],
            "type": r["type"],
            "severity": r["severity"],
            "explanation": r["explanation"],
            "action": r["action"],
        }
        for r in INTERACTION_RULES
    ]

    # 3. Allergy detection against user profile
    allergy_warnings = detect_ingredient_allergies(profile)

    # 4. Group evaluated ingredients by category
    by_category = {}
    for cat_name in CATEGORIES_EDUCATION.keys():
        by_category[cat_name] = [
            item for item in all_evaluated if item.get("category") == cat_name
        ]

    # Top recommendations
    top_rec = sorted(all_evaluated, key=lambda x: x["suitability_score"], reverse=True)[:6]

    return {
        "top_recommended": top_rec,
        "all_analyzed": all_evaluated,
        "by_category": by_category,
        "categories_education": CATEGORIES_EDUCATION,
        "interactions": interactions,
        "allergy_warnings": allergy_warnings,
        "categories_list": list(CATEGORIES_EDUCATION.keys()),
    }