"""
Routine Generator — Personalized Skincare Routine Module with Clinical Dermatology & Trendy Market Products
-------------------------------------------------------------------------------------------------------------
Generates evidence-based Morning (AM), Evening (PM), and Weekly routines based on:
  - Skin type & age group
  - Prioritized skin concerns (from AssessmentEngine)
  - AI Vision Skin Texture Analysis metrics (roughness, pore density, oiliness, redness, fine lines)
  - Specific matched Clinical Dermatology & Market Trendy products with step-by-step usage guidance
"""

from typing import Dict, List, Any, Optional
from datetime import datetime


# ============================================================
# INGREDIENT KNOWLEDGE BASE (Module 5 — Ingredient Intelligence)
# ============================================================

INGREDIENT_INFO = {
    "Salicylic Acid": {
        "category": "BHA Exfoliant",
        "benefits": "Unclogs pores, reduces acne, controls oil",
        "avoid_if": ["aspirin allergy"],
        "am_safe": True, "pm_safe": True,
    },
    "Niacinamide": {
        "category": "Vitamin B3",
        "benefits": "Minimizes pores, controls sebum, brightens, strengthens barrier",
        "avoid_if": [],
        "am_safe": True, "pm_safe": True,
    },
    "Vitamin C": {
        "category": "Antioxidant",
        "benefits": "Brightens skin, fades hyperpigmentation, boosts collagen",
        "avoid_if": [],
        "am_safe": True, "pm_safe": False,
        "note": "Best in AM — degrades in light and oxidizes at night",
    },
    "Hyaluronic Acid": {
        "category": "Humectant",
        "benefits": "Draws moisture into skin, plumps, reduces fine lines",
        "avoid_if": [],
        "am_safe": True, "pm_safe": True,
    },
    "Retinol": {
        "category": "Retinoid (Vitamin A)",
        "benefits": "Accelerates cell turnover, reduces wrinkles, fades dark spots",
        "avoid_if": ["pregnancy", "retinoid sensitivity"],
        "am_safe": False, "pm_safe": True,
        "note": "PM only — photosensitizing. Start 2x/week, increase gradually.",
    },
    "Ceramides": {
        "category": "Lipids / Barrier Repair",
        "benefits": "Restores skin barrier, locks in moisture, prevents water loss",
        "avoid_if": [],
        "am_safe": True, "pm_safe": True,
    },
    "Glycerin": {
        "category": "Humectant",
        "benefits": "Attracts and retains moisture, softens skin",
        "avoid_if": [],
        "am_safe": True, "pm_safe": True,
    },
    "Alpha Arbutin": {
        "category": "Brightening Agent",
        "benefits": "Inhibits melanin production, fades dark spots and hyperpigmentation",
        "avoid_if": [],
        "am_safe": True, "pm_safe": True,
    },
    "Glycolic Acid": {
        "category": "AHA Exfoliant",
        "benefits": "Exfoliates dead skin, brightens, improves texture and tone",
        "avoid_if": ["AHA sensitivity"],
        "am_safe": False, "pm_safe": True,
        "note": "PM only — increases sun sensitivity. Always follow with SPF next day.",
    },
    "Centella Asiatica": {
        "category": "Botanical / Soothing",
        "benefits": "Calms inflammation, promotes healing, strengthens barrier",
        "avoid_if": [],
        "am_safe": True, "pm_safe": True,
    },
    "Squalane": {
        "category": "Emollient",
        "benefits": "Deeply moisturizes, non-comedogenic, anti-inflammatory",
        "avoid_if": [],
        "am_safe": True, "pm_safe": True,
    },
    "Zinc Oxide": {
        "category": "Mineral UV Filter",
        "benefits": "Broad-spectrum UV protection, anti-inflammatory",
        "avoid_if": [],
        "am_safe": True, "pm_safe": False,
    },
    "Peptides": {
        "category": "Protein Fragments",
        "benefits": "Stimulate collagen synthesis, firm skin, reduce wrinkles",
        "avoid_if": [],
        "am_safe": True, "pm_safe": True,
    },
    "Azelaic Acid": {
        "category": "Multifunctional Acid",
        "benefits": "Reduces redness, kills acne bacteria, brightens, anti-inflammatory",
        "avoid_if": [],
        "am_safe": True, "pm_safe": True,
    },
    "Lactic Acid": {
        "category": "Gentle AHA",
        "benefits": "Mild exfoliation, hydrating, improves texture — gentle enough for sensitive skin",
        "avoid_if": [],
        "am_safe": False, "pm_safe": True,
    },
    "Tranexamic Acid": {
        "category": "Brightening Agent",
        "benefits": "Reduces hyperpigmentation and melasma, brightens complexion",
        "avoid_if": [],
        "am_safe": True, "pm_safe": True,
    },
}


class RoutineGenerator:
    """
    Generates personalized morning, evening, and weekly skincare routines
    linking real dermatology and trendy products with clinical how-to-use instructions.
    """

    def __init__(
        self,
        profile: Dict[str, Any],
        concern_analysis: List[Dict[str, Any]],
        allergies: Optional[List[str]] = None,
        sensitivities: Optional[List[str]] = None,
        texture_data: Optional[Dict[str, Any]] = None,
    ):
        self.skin_type = profile.get("skin_type", "Normal")
        self.age_group = profile.get("age_group", "25-34")
        self.concern_analysis = concern_analysis  # sorted by score descending
        self.allergies = [a.lower() for a in (allergies or [])]
        self.sensitivities = [s.lower() for s in (sensitivities or [])]
        self.texture_data = texture_data or {}

        # Extract top concerns by severity
        self.critical_concerns = [
            c["concern"] for c in concern_analysis if c.get("severity") == "Critical"
        ]
        self.moderate_concerns = [
            c["concern"] for c in concern_analysis if c.get("severity") == "Moderate"
        ]
        self.all_concerns = self.critical_concerns + self.moderate_concerns

        # Fallback to profile skin concerns if no critical/moderate concerns in analysis
        if not self.all_concerns and profile.get("skin_concerns"):
            self.all_concerns = [str(c) for c in profile.get("skin_concerns", [])]

        # Is skin sensitive?
        self.is_sensitive = (
            self.skin_type.lower() == "sensitive"
            or "Sensitive Skin" in self.all_concerns
            or len(self.sensitivities) >= 2
            or float(self.texture_data.get("redness_erythema_score", 0)) > 40
        )

    # ----------------------------------------------------------
    # PUBLIC: generate all routines
    # ----------------------------------------------------------

    def generate_all(self) -> Dict[str, Any]:
        return {
            "morning_routine": self.generate_morning_routine(),
            "evening_routine": self.generate_evening_routine(),
            "weekly_treatments": self.generate_weekly_treatments(),
            "seasonal_tips": self.get_seasonal_tips(),
            "ingredient_highlights": self._get_key_ingredients_summary(),
        }

    # ----------------------------------------------------------
    # MORNING ROUTINE
    # ----------------------------------------------------------

    def generate_morning_routine(self) -> List[Dict[str, Any]]:
        steps = []
        step_num = 1

        # Step 1: Cleanser
        steps.append(self._morning_cleanser(step_num))
        step_num += 1

        # Step 2: Toner / Essence
        toner = self._morning_toner(step_num)
        if toner:
            steps.append(toner)
            step_num += 1

        # Step 3: Treatment Serum (antioxidant / texture corrective)
        serum = self._morning_serum(step_num)
        if serum:
            steps.append(serum)
            step_num += 1

        # Step 4: Moisturizer
        steps.append(self._morning_moisturizer(step_num))
        step_num += 1

        # Step 5: Sunscreen (always last, non-negotiable)
        steps.append(self._morning_sunscreen(step_num))

        return steps

    def _morning_cleanser(self, step: int) -> Dict:
        st = self.skin_type.lower()
        oiliness = float(self.texture_data.get("oiliness_shine_score", 35))
        
        if st in ("oily", "combination") or oiliness > 50:
            return {
                "step": step,
                "name": "Purifying Sebum & Pore Cleanser",
                "product_type": "Dermatology Clinical Cleanser",
                "product_name": "La Roche-Posay Effaclar Purifying Foaming Gel",
                "brand": "La Roche-Posay",
                "price": "$$",
                "rating": 4.8,
                "image_url": "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=600&auto=format&fit=crop",
                "key_ingredients": ["Zinc PCA", "Thermal Spring Water", "Citric Acid"],
                "why": "Formulated with clinical Zinc PCA to clear overnight sebum build-up and dissolve impurities trapped inside enlarged pores.",
                "application": "Lather a dime-sized amount with lukewarm water between palms. Gently massage across facial T-zone for 60 seconds. Rinse thoroughly.",
                "texture_benefit": f"Targets {oiliness:.1f}% sebum shine and clears pore clusters without stripping lipid barrier.",
                "frequency": "Every Morning",
            }
        elif self.is_sensitive:
            return {
                "step": step,
                "name": "Soothing Barrier Micellar Cleanser",
                "product_type": "Dermatology Clinical Micellar",
                "product_name": "Bioderma Sensibio H2O Micellar Water",
                "brand": "Bioderma",
                "price": "$$",
                "rating": 4.9,
                "image_url": "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=600&auto=format&fit=crop",
                "key_ingredients": ["Biomimetic Fatty Acid Esters", "Cucumber Extract", "Rhamnose"],
                "why": "Dermatological micellar solution that captures impurities and micro-particles while respecting reactive vascular barrier.",
                "application": "Soak a soft cotton pad and gently swipe across face and neck. No harsh rubbing or rinsing required.",
                "texture_benefit": "Formulated for high erythema / redness zones to prevent friction irritation.",
                "frequency": "Every Morning",
            }
        else:
            return {
                "step": step,
                "name": "Hydrating Barrier Cleanser",
                "product_type": "Dermatology Clinical Cleanser",
                "product_name": "CeraVe Hydrating Facial Cleanser",
                "brand": "CeraVe",
                "price": "$$",
                "rating": 4.9,
                "image_url": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=600&auto=format&fit=crop",
                "key_ingredients": ["Ceramides 1, 3, 6-II", "Hyaluronic Acid", "Glycerin"],
                "why": "Restores protective lipid matrix while gently lifting overnight dead skin cells and moisture loss.",
                "application": "Dispense 1-2 pumps onto damp hands. Work over face in circular motions for 45-60 seconds. Rinse with lukewarm water.",
                "texture_benefit": "Infuses essential ceramides directly into micro-rough epidermal areas.",
                "frequency": "Every Morning",
            }

    def _morning_toner(self, step: int) -> Optional[Dict]:
        redness = float(self.texture_data.get("redness_erythema_score", 15))
        roughness = float(self.texture_data.get("roughness_score", 30))

        if redness > 30 or self.is_sensitive:
            return {
                "step": step,
                "name": "Soothing & Anti-Redness Toner",
                "product_type": "Market-Trendy K-Beauty Essence",
                "product_name": "Anua Heartleaf 77% Soothing Toner",
                "brand": "Anua",
                "price": "$$",
                "rating": 4.8,
                "image_url": "https://images.unsplash.com/photo-1599305090598-fe179d501227?q=80&w=600&auto=format&fit=crop",
                "key_ingredients": ["Heartleaf Extract 77%", "Centella Asiatica", "Panthenol"],
                "why": "77% Korean Heartleaf extract calms facial flushing, suppresses micro-inflammation, and balances skin pH balance.",
                "application": "Pour 4-5 drops onto palms. Gently press and pat over face until fully absorbed. Layer twice on reactive cheek areas.",
                "texture_benefit": f"Cools and reduces {redness:.1f}% vascular erythema detected in camera scan.",
                "frequency": "Every Morning",
            }
        elif roughness > 40 or "Dry Skin" in self.all_concerns:
            return {
                "step": step,
                "name": "Glass-Skin Mucin Smoothing Essence",
                "product_type": "Market-Trendy Cult Essence",
                "product_name": "CosRx Advanced Snail 96 Mucin Power Essence",
                "brand": "CosRx",
                "price": "$$",
                "rating": 4.9,
                "image_url": "https://images.unsplash.com/photo-1599305090598-fe179d501227?q=80&w=600&auto=format&fit=crop",
                "key_ingredients": ["Snail Secretion Filtrate 96.3%", "Sodium Hyaluronate", "Allantoin", "Panthenol"],
                "why": "96.3% snail mucin filtrate fills micro-crevices, repairs cellular hydration, and leaves a silky glass-skin barrier.",
                "application": "Pump 2-3 times onto fingertips. Smooth across face and pat gently for 30 seconds until bouncy finish is achieved.",
                "texture_benefit": f"Smoothes {roughness:.1f}% surface roughness and restores epidermal elasticity.",
                "frequency": "Every Morning",
            }
        return None

    def _morning_serum(self, step: int) -> Optional[Dict]:
        pores = float(self.texture_data.get("pore_visibility_score", 25))
        oiliness = float(self.texture_data.get("oiliness_shine_score", 35))

        if any(c in self.all_concerns for c in ["Hyperpigmentation", "Dark Spots", "Uneven Skin Tone"]):
            return {
                "step": step,
                "name": "Clinical High-Potency Antioxidant Shield",
                "product_type": "Dermatology Clinical Serum",
                "product_name": "SkinCeuticals C E Ferulic Antioxidant Serum",
                "brand": "SkinCeuticals",
                "price": "$$$$",
                "rating": 4.9,
                "image_url": "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=600&auto=format&fit=crop",
                "key_ingredients": ["15% L-Ascorbic Acid (Vitamin C)", "1% Alpha Tocopherol", "0.5% Ferulic Acid"],
                "why": "The premier gold-standard clinical antioxidant. Neutralizes free radical damage from UV rays and pollution while accelerating melanin fading.",
                "application": "Apply 4-5 drops to a completely dry face and neck immediately after cleansing/toning. Press in gently and allow 60 seconds to absorb.",
                "texture_benefit": "Clinically proven to brighten tone and prevent collagen degradation from UV exposure.",
                "frequency": "Every Morning (Crucial for Daytime Protection)",
            }
        elif "Acne" in self.all_concerns or pores > 40 or oiliness > 50:
            return {
                "step": step,
                "name": "Pore-Minimizing & Sebum Control Serum",
                "product_type": "Market-Trendy Blemish Formula",
                "product_name": "The Ordinary Niacinamide 10% + Zinc 1%",
                "brand": "The Ordinary",
                "price": "$",
                "rating": 4.7,
                "image_url": "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=600&auto=format&fit=crop",
                "key_ingredients": ["Niacinamide 10%", "Zinc PCA 1%"],
                "why": "High-purity Niacinamide tightens visible pore walls, balances sebum production, and strengthens lipid synthesis.",
                "application": "Apply 2-3 drops to full face before heavier creams. Smooth over T-zone and congested cheek areas.",
                "texture_benefit": f"Targets {pores:.1f}% pore visibility and regulates active oil shine.",
                "frequency": "Every Morning",
            }
        else:
            return {
                "step": step,
                "name": "Multi-Molecular Deep Hydration Serum",
                "product_type": "Market-Trendy K-Beauty Serum",
                "product_name": "Torriden DIVE-IN Low Molecular Hyaluronic Acid Serum",
                "brand": "Torriden",
                "price": "$$",
                "rating": 4.9,
                "image_url": "https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=600&auto=format&fit=crop",
                "key_ingredients": ["5D Complex Hyaluronic Acid", "D-Panthenol", "Madecassoside"],
                "why": "5 different molecular weights of Hyaluronic Acid penetrate to deep dermal layers for weightless, all-day hydration.",
                "application": "Dispense 3-4 drops onto face. Pat gently for 20 seconds. Layer over damp skin for maximum plumping.",
                "texture_benefit": "Restores intracellular water volume and eliminates dehydration micro-cracks.",
                "frequency": "Every Morning",
            }

    def _morning_moisturizer(self, step: int) -> Dict:
        st = self.skin_type.lower()
        if self.is_sensitive:
            return {
                "step": step,
                "name": "Restorative Barrier Defense Cream",
                "product_type": "Dermatology Clinical Cream",
                "product_name": "Avene Cicalfate+ Restorative Protective Cream",
                "brand": "Avene",
                "price": "$$",
                "rating": 4.8,
                "image_url": "https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=600&auto=format&fit=crop",
                "key_ingredients": ["C+-Restore Postbiotic", "Copper-Zinc Sulfate Complex", "Thermal Spring Water"],
                "why": "Provides a breathable protective film that accelerates barrier recovery and calms stinging or tingling sensations.",
                "application": "Warm a blueberry-sized amount between clean fingertips and press gently into face and neck.",
                "texture_benefit": "Halts transepidermal water loss and calms vascular reactivity.",
                "frequency": "Every Morning",
            }
        elif st == "dry" or "Dry Skin" in self.all_concerns:
            return {
                "step": step,
                "name": "Triple Lipid-Peptide Barrier Cream",
                "product_type": "Dermatology Clinical Barrier Cream",
                "product_name": "Skinfix Barrier+ Triple Lipid-Peptide Cream",
                "brand": "Skinfix",
                "price": "$$$",
                "rating": 4.9,
                "image_url": "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=600&auto=format&fit=crop",
                "key_ingredients": ["Triple Lipid Complex (Ceramides, Fatty Acids, Cholesterol)", "Active Nutripeptides"],
                "why": "Replenishes exact 3:1:1 physiological ratio of epidermal lipids to seal moisture reservoirs and firm skin.",
                "application": "Press 1-2 pumps onto face and neck with gentle upward strokes until absorbed.",
                "texture_benefit": "Eliminates flaking and smoothens surface roughness.",
                "frequency": "Every Morning",
            }
        else:
            return {
                "step": step,
                "name": "Dewy Antioxidant Moisture Cream",
                "product_type": "Market-Trendy Luxury Cream",
                "product_name": "Tatcha The Dewy Skin Cream",
                "brand": "Tatcha",
                "price": "$$$$",
                "rating": 4.9,
                "image_url": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600&auto=format&fit=crop",
                "key_ingredients": ["Japanese Purple Rice", "Hadasei-3 Trinity", "Hyaluronic Acid"],
                "why": "Rich in anthocyanin antioxidants to defend against pollution while providing a soft-focus luminous finish.",
                "application": "Massage a pearl-sized amount into face, neck, and decolletage in upward motions.",
                "texture_benefit": "Enhances micro-smoothness and imparts long-lasting radiant glow.",
                "frequency": "Every Morning",
            }

    def _morning_sunscreen(self, step: int) -> Dict:
        if self.is_sensitive or "Acne" in self.all_concerns:
            return {
                "step": step,
                "name": "Dermatologist #1 Broad-Spectrum SPF 46",
                "product_type": "Dermatology Clinical Sunscreen",
                "product_name": "EltaMD UV Clear Broad-Spectrum SPF 46",
                "brand": "EltaMD",
                "price": "$$$",
                "rating": 4.9,
                "image_url": "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=600&auto=format&fit=crop",
                "key_ingredients": ["Zinc Oxide 9.0%", "High-Purity Niacinamide 5.0%", "Hyaluronic Acid"],
                "why": "Transparent micronized zinc oxide blocks UVA/UVB rays without clogging pores. Niacinamide actively calms acne and erythema.",
                "application": "Apply two full finger-lengths to face and neck 15 minutes before sun exposure. Reapply every 2 hours when outdoors.",
                "texture_benefit": "Zero white cast, non-comedogenic shield that prevents sun-induced rough texture and dark spots.",
                "frequency": "Every Morning (Non-Negotiable)",
            }
        else:
            return {
                "step": step,
                "name": "Organic Rice + Probiotics Sunscreen SPF 50+",
                "product_type": "Market-Trendy Viral Sunscreen",
                "product_name": "Beauty of Joseon Relief Sun: Rice + Probiotics SPF 50+",
                "brand": "Beauty of Joseon",
                "price": "$$",
                "rating": 4.9,
                "image_url": "https://images.unsplash.com/photo-1643185539104-3622eb1f0ff6?q=80&w=600&auto=format&fit=crop",
                "key_ingredients": ["Rice Extract 30%", "Grain Fermented Probiotics", "Niacinamide 2%"],
                "why": "Weightless lotion that blends seamlessly with no greasiness or eye stinging. Probiotics nurture skin microbiome.",
                "application": "Smooth evenly over entire face and neck as the final morning step. Works beautifully as a makeup primer.",
                "texture_benefit": "Feeds skin with fermented amino acids to support daytime skin barrier.",
                "frequency": "Every Morning",
            }

    # ----------------------------------------------------------
    # EVENING ROUTINE
    # ----------------------------------------------------------

    def generate_evening_routine(self) -> List[Dict[str, Any]]:
        steps = []
        step_num = 1

        # Step 1: Double Cleanse (PM Purifier)
        steps.append({
            "step": step_num,
            "name": "PM Deep Pore & Makeup Cleanse",
            "product_type": "Dermatology Clinical Cleanser",
            "product_name": "CeraVe Hydrating Facial Cleanser",
            "brand": "CeraVe",
            "price": "$$",
            "rating": 4.9,
            "image_url": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=600&auto=format&fit=crop",
            "key_ingredients": ["Ceramides 1, 3, 6-II", "Hyaluronic Acid", "Glycerin"],
            "why": "Thoroughly lifts daytime SPF, airborne pollution particles, and accumulated sebum without stripping lipids.",
            "application": "Massage into damp skin for 60 seconds with emphasis on jawline, hairline, and nose folds. Rinse with lukewarm water.",
            "texture_benefit": "Prepares skin surface for maximum absorption of evening active treatments.",
            "frequency": "Every Evening",
        })
        step_num += 1

        # Step 2: Night Corrective Treatment (BHA Exfoliant OR Retinol OR Tranexamic Acid)
        roughness = float(self.texture_data.get("roughness_score", 30))
        pores = float(self.texture_data.get("pore_visibility_score", 25))
        fine_lines = float(self.texture_data.get("fine_lines_score", 10))

        if "Acne" in self.all_concerns or pores > 40 or roughness > 45:
            steps.append({
                "step": step_num,
                "name": "Clinical Liquid BHA Pore Exfoliant",
                "product_type": "Dermatology Clinical Exfoliant",
                "product_name": "Paula's Choice 2% BHA Liquid Exfoliant",
                "brand": "Paula's Choice",
                "price": "$$$",
                "rating": 4.9,
                "image_url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop",
                "key_ingredients": ["Salicylic Acid 2%", "Green Tea Extract", "Methylpropanediol"],
                "why": "Oil-soluble salicylic acid dissolves hardened sebum plugs inside pore linings and dissolves dead surface cell cement.",
                "application": "Pour a dime-sized amount onto fingers or cotton pad. Gently sweep across face. Do not rinse off. Start 2-3 nights/week, building to nightly.",
                "texture_benefit": f"Dramatically refines {roughness:.1f}% roughness and clears deep pore congestion.",
                "frequency": "Nightly (or alternate nights for sensitive skin)",
            })
            step_num += 1
        elif any(c in self.all_concerns for c in ["Wrinkles", "Fine Lines"]) or fine_lines > 30:
            steps.append({
                "step": step_num,
                "name": "Cellular Renewal Pure Retinol Serum",
                "product_type": "Market-Trendy Night Active",
                "product_name": "The Ordinary Retinol 0.5% in Squalane",
                "brand": "The Ordinary",
                "price": "$",
                "rating": 4.7,
                "image_url": "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=600&auto=format&fit=crop",
                "key_ingredients": ["Pure Retinol 0.5%", "Plant-Derived Squalane", "Jojoba Seed Oil"],
                "why": "Signals fibroblasts to synthesize new collagen and accelerates epidermal cell turnover during sleep cycles.",
                "application": "Apply 2-3 drops to dry skin after cleansing. Avoid eye contours. Start 2x weekly and increase frequency as tolerance builds.",
                "texture_benefit": f"Visibly softens {fine_lines:.1f}% micro-creasing and fine expression lines.",
                "frequency": "PM Only (2-3 nights per week initially)",
            })
            step_num += 1
        elif any(c in self.all_concerns for c in ["Hyperpigmentation", "Dark Spots"]):
            steps.append({
                "step": step_num,
                "name": "Clinical Dark Spot Discoloration Corrector",
                "product_type": "Dermatology Clinical Treatment",
                "product_name": "SkinCeuticals Discoloration Defense",
                "brand": "SkinCeuticals",
                "price": "$$$$",
                "rating": 4.8,
                "image_url": "https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=600&auto=format&fit=crop",
                "key_ingredients": ["3% Tranexamic Acid", "1% Kojic Acid", "5% Niacinamide", "HEPES"],
                "why": "Multi-phase inhibitor that blocks tyrosinase and prevents melanosome transfer to surface keratinocytes.",
                "application": "Apply 3-5 drops to affected hyperpigmentation zones and gently press into skin until absorbed.",
                "texture_benefit": "Fades post-inflammatory hyperpigmentation and evens skin tone.",
                "frequency": "Every Evening",
            })
            step_num += 1

        # Step 3: Night Barrier Repair & Recovery Cream
        steps.append({
            "step": step_num,
            "name": "Overnight Barrier Lipid Repair Cream",
            "product_type": "Dermatology Clinical Barrier Cream",
            "product_name": "Skinfix Barrier+ Triple Lipid-Peptide Cream",
            "brand": "Skinfix",
            "price": "$$$",
            "rating": 4.9,
            "image_url": "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=600&auto=format&fit=crop",
            "key_ingredients": ["Triple Lipid Complex", "Nutripeptides", "Ceramide NP", "Shea Butter"],
            "why": "Provides an occlusive lipid blanket that prevents overnight moisture evaporation and fuels cellular repair during deep sleep.",
            "application": "Warm 1-2 pumps between palms and press firmly into face and neck as the final sealing step.",
            "texture_benefit": "Restores epidermal elasticity and seals in active treatment serums.",
            "frequency": "Every Evening (Last Step)",
        })

        return steps

    # ----------------------------------------------------------
    # WEEKLY TREATMENTS
    # ----------------------------------------------------------

    def generate_weekly_treatments(self) -> List[Dict[str, Any]]:
        treatments = []

        # Chemical Peel / AHA Polish
        treatments.append({
            "name": "Clinical AHA/BHA Dual-Step Resurfacing Peel",
            "product_type": "Dermatology Clinical Peel Pads",
            "product_name": "Dr. Dennis Gross Alpha Beta Universal Daily Peel",
            "brand": "Dr. Dennis Gross",
            "frequency": "1-2 times weekly (e.g. Wednesday & Sunday evenings)",
            "duration": "5 minutes leave-on",
            "key_ingredients": ["Glycolic Acid", "Lactic Acid", "Salicylic Acid", "Malic Acid", "Resveratrol"],
            "why": "Dissolves compacted surface keratinocytes to reveal ultra-smooth, radiant glass-skin texture underneath.",
            "application": "Apply Step 1 pad on clean dry skin. Wait 2 minutes. Follow with Step 2 neutralizing pad. Do not rinse.",
            "texture_benefit": "Rapidly smooths textured patches and accelerates cellular turnover.",
        })

        # Deep Hydration & Calming Recovery
        treatments.append({
            "name": "Overnight Postbiotic Barrier Mask & Reset",
            "product_type": "Dermatology Clinical Recovery Balm",
            "product_name": "Avene Cicalfate+ Restorative Protective Cream",
            "brand": "Avene",
            "frequency": "2 times weekly (or whenever skin feels tight/irritated)",
            "duration": "Overnight Leave-On",
            "key_ingredients": ["C+-Restore Postbiotic", "Copper-Zinc Sulfate", "Thermal Spring Water"],
            "why": "Restores disrupted microflora and strengthens skin defense mechanisms following active acid treatments.",
            "application": "Slather a slightly thicker layer across face before sleep as an intensive sleeping recovery mask.",
            "texture_benefit": "Calms erythema and replenishes deep moisture reserves.",
        })

        return treatments

    # ----------------------------------------------------------
    # SEASONAL & INGREDIENT HIGHLIGHTS
    # ----------------------------------------------------------

    def get_seasonal_tips(self) -> List[Dict[str, str]]:
        month = datetime.now().month
        if month in (12, 1, 2):
            season = "Winter"
        elif month in (3, 4, 5):
            season = "Spring"
        elif month in (6, 7, 8):
            season = "Summer"
        else:
            season = "Autumn"

        tips_db = {
            "Winter": [
                {"season": "Winter", "tip": "Upgrade to Lipid Barrier Creams", "detail": "Cold air and indoor heating accelerate trans-epidermal water loss. Switch to ceramide-rich creams like Skinfix Barrier+."},
                {"season": "Winter", "tip": "Moderate Acid Exfoliation", "detail": "Reduce high-strength chemical peels to once weekly to avoid compromising moisture barrier in dry weather."},
            ],
            "Spring": [
                {"season": "Spring", "tip": "Incorporate Brightening Antioxidants", "detail": "Boost daytime Vitamin C to protect against rising UV radiation and seasonal environmental allergens."},
                {"season": "Spring", "tip": "Gentle Exfoliation Reset", "detail": "Use gentle BHA/Lactic acid twice weekly to shed winter dryness and smooth new epidermal texture."},
            ],
            "Summer": [
                {"season": "Summer", "tip": "Double-Down on SPF 50+ Reapplication", "detail": "Reapply broad-spectrum sunscreen every 2 hours when outdoors. Use oil-free, non-comedogenic formulas like EltaMD UV Clear."},
                {"season": "Summer", "tip": "Regulate Sebum Flow with Niacinamide", "detail": "High heat stimulates sebaceous glands. Apply 10% Niacinamide morning and night to keep pores clear."},
            ],
            "Autumn": [
                {"season": "Autumn", "tip": "Repair Post-Summer UV Sun Damage", "detail": "Incorporate Tranexamic Acid or Vitamin C to fade summer dark spots and restore even skin tone."},
                {"season": "Autumn", "tip": "Introduce Night Retinoids", "detail": "Autumn is the optimal season to start pure Retinol treatments to stimulate collagen synthesis before winter."},
            ],
        }
        return tips_db.get(season, tips_db["Summer"])

    def _get_key_ingredients_summary(self) -> List[Dict[str, Any]]:
        highlights = []
        for name, info in INGREDIENT_INFO.items():
            highlights.append({
                "ingredient": name,
                "category": info.get("category", "Skincare Active"),
                "benefits": info.get("benefits", ""),
                "note": info.get("note", ""),
            })
        return highlights[:8]
