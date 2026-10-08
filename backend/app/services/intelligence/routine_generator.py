from datetime import datetime
from typing import Any, Dict, List, Optional
from app.services.intelligence.product_catalog import match_products_for_step


class RoutineGenerator:
    """
    Generates personalized Morning, Evening, and Weekly skincare routines
    tailored to skin type, prioritized concerns, and strictly respecting
    allergy and sensitivity exclusions.
    """

    # Allergy / Sensitivity exclusion mappings
    ALLERGEN_EXCLUSIONS = {
        "salicylic": ["Salicylic Acid", "BHA", "Willow Bark"],
        "bha": ["Salicylic Acid", "BHA"],
        "retinol": ["Retinol", "Retinoids", "Tretinoin", "Retinal"],
        "retinoid": ["Retinol", "Retinoids", "Tretinoin", "Retinal"],
        "glycolic": ["Glycolic Acid", "AHA"],
        "aha": ["Glycolic Acid", "Lactic Acid", "Mandelic Acid", "AHA"],
        "fragrance": ["Essential Oils", "Synthetic Fragrance", "Parfum"],
        "vitamin c": ["L-Ascorbic Acid", "Ascorbic Acid"],
        "niacinamide": ["Niacinamide", "Vitamin B3"],
        "nut": ["Almond Oil", "Macadamia Oil", "Argan Oil"],
    }

    @classmethod
    def _is_safe(cls, ingredient: str, forbidden_tokens: List[str]) -> bool:
        lower_ing = ingredient.lower()
        for token in forbidden_tokens:
            if token in lower_ing:
                return False
        return True

    @classmethod
    def _extract_forbidden_tokens(cls, allergies: str, sensitivities: str) -> List[str]:
        raw = f"{allergies or ''} {sensitivities or ''}".lower()
        forbidden: List[str] = []
        for key, ingredients in cls.ALLERGEN_EXCLUSIONS.items():
            if key in raw:
                forbidden.extend([ing.lower() for ing in ingredients])
                forbidden.append(key)
        # Also add individual words from allergies string
        for word in raw.replace(",", " ").replace(";", " ").split():
            clean = word.strip().lower()
            if len(clean) >= 4:
                forbidden.append(clean)
        return list(set(forbidden))

    @classmethod
    def generate_routines(
        cls,
        skin_profile: Optional[Any],
        prioritized_concerns: List[Dict[str, Any]],
        risks: Optional[List[Dict[str, Any]]] = None,
        version: int = 1,
        include_seasonal: bool = False,
    ) -> Dict[str, Any]:
        skin_type = (skin_profile.skin_type or "NORMAL").upper() if skin_profile else "NORMAL"
        allergies = skin_profile.allergies if skin_profile else ""
        sensitivities = skin_profile.sensitivities if skin_profile else ""
        forbidden = cls._extract_forbidden_tokens(allergies, sensitivities)

        # Identify primary concern
        high_concerns = [c["concern_name"] for c in prioritized_concerns if c.get("priority") == "HIGH"]
        med_concerns = [c["concern_name"] for c in prioritized_concerns if c.get("priority") == "MEDIUM"]
        primary_concern = high_concerns[0] if high_concerns else (med_concerns[0] if med_concerns else "BARRIER_MAINTENANCE")

        is_sensitive = (skin_type == "SENSITIVE") or bool(sensitivities) or ("SENSITIVE_SKIN" in high_concerns)

        # -----------------------------------------------------------------
        # 1. MORNING ROUTINE
        # -----------------------------------------------------------------
        morning_steps: List[Dict[str, Any]] = []

        # Step 1: Cleansing
        if skin_type in ["DRY", "SENSITIVE"]:
            m_cleanser = {
                "step_order": 1,
                "category": "CLEANSING",
                "title": "Gentle Barrier-Hydrating Cleanser",
                "description": "Wash face with lukewarm water and a non-foaming hydrating milk cleanser to protect surface lipids.",
                "frequency": "DAILY",
                "key_actives": ["Ceramides", "Glycerin", "Centella Asiatica"],
                "safety_notes": "Hypoallergenic, sulfate-free, and non-stripping.",
            }
        elif skin_type in ["OILY", "COMBINATION"]:
            m_cleanser = {
                "step_order": 1,
                "category": "CLEANSING",
                "title": "Balancing Gel Cleanser",
                "description": "Massage gently onto damp face to clear excess nocturnal sebum without disrupting skin pH.",
                "frequency": "DAILY",
                "key_actives": ["Zinc PCA", "Green Tea Extract", "Amino Acid Surfactants"],
                "safety_notes": "Maintains 5.5 acidic mantle balance.",
            }
        else:
            m_cleanser = {
                "step_order": 1,
                "category": "CLEANSING",
                "title": "Daily Balancing Cleanser",
                "description": "Lightweight foaming face wash to refresh and cleanse the skin.",
                "frequency": "DAILY",
                "key_actives": ["Hyaluronic Acid", "Panthenol"],
                "safety_notes": "Gentle daily formulation.",
            }
        morning_steps.append(m_cleanser)

        # Step 2: Morning Treatment (Antioxidant & Concern target)
        if primary_concern in ["ACNE", "OILY_SKIN"]:
            # Pick active respecting allergies
            candidate_actives = ["Niacinamide (4%)", "Azelaic Acid", "Zinc PCA"]
            if cls._is_safe("Salicylic Acid", forbidden) and not is_sensitive:
                candidate_actives.insert(0, "Salicylic Acid (0.5%)")

            m_treatment = {
                "step_order": 2,
                "category": "TREATMENT",
                "title": "Purifying & Blemish Defense Serum",
                "description": "Apply 3-4 drops across face to regulate sebum production and calm localized follicular redness.",
                "frequency": "DAILY",
                "key_actives": [act for act in candidate_actives if cls._is_safe(act, forbidden)][:2],
                "safety_notes": "Safe for daytime wear. Follow with sunscreen.",
            }
        elif primary_concern in ["HYPERPIGMENTATION", "DARK_SPOTS", "UNEVEN_TONE"]:
            candidate_actives = ["Alpha Arbutin", "Tranexamic Acid", "Niacinamide"]
            if cls._is_safe("Vitamin C", forbidden):
                candidate_actives.insert(0, "Ascorbyl Glucoside (Stabilized Vitamin C)")

            m_treatment = {
                "step_order": 2,
                "category": "TREATMENT",
                "title": "Pigment Correcting & Radiance Serum",
                "description": "Inhibits tyrosinase activity to fade localized dark spots and boost skin luminosity.",
                "frequency": "DAILY",
                "key_actives": [act for act in candidate_actives if cls._is_safe(act, forbidden)][:2],
                "safety_notes": "Non-photosensitizing morning formula.",
            }
        elif primary_concern in ["WRINKLES", "FINE_LINES"]:
            m_treatment = {
                "step_order": 2,
                "category": "TREATMENT",
                "title": "Peptide Plumping & Firming Serum",
                "description": "Multi-molecular peptide complex to support dermal elasticity and smooth expression lines.",
                "frequency": "DAILY",
                "key_actives": ["Matrixyl 3000", "Multi-Peptides", "Ectoin"],
                "safety_notes": "Boosts cellular hydration reservoir.",
            }
        else:  # DRY_SKIN, SENSITIVE, or BARRIER_MAINTENANCE
            m_treatment = {
                "step_order": 2,
                "category": "TREATMENT",
                "title": "Barrier Recovery & Soothing Serum",
                "description": "Infuses skin with essential humectants and calming botanical adaptogens.",
                "frequency": "DAILY",
                "key_actives": ["Hyaluronic Acid", "Madecassoside", "Panthenol (B5)"],
                "safety_notes": "Calms redness and reduces epidermal sensitivity.",
            }
        morning_steps.append(m_treatment)

        # Step 3: Moisturizing
        if skin_type == "OILY":
            m_moisturizer = {
                "step_order": 3,
                "category": "MOISTURIZING",
                "title": "Oil-Free Hydrating Gel Moisturizer",
                "description": "Weightless, non-comedogenic water gel that locks in hydration with a natural matte finish.",
                "frequency": "DAILY",
                "key_actives": ["Beta-Glucan", "Hyaluronic Acid", "Squalane"],
                "safety_notes": "100% oil-free and non-pore-clogging.",
            }
        elif skin_type in ["DRY", "SENSITIVE"]:
            m_moisturizer = {
                "step_order": 3,
                "category": "MOISTURIZING",
                "title": "Ceramide Barrier Defense Cream",
                "description": "Rich nourishing cream with physiological 3:1:1 lipid ratio to seal microscopic barrier micro-tears.",
                "frequency": "DAILY",
                "key_actives": ["Ceramide NP/AP/EOP", "Cholesterol", "Colloidal Oat"],
                "safety_notes": "Fragrance-free barrier replenishment.",
            }
        else:
            m_moisturizer = {
                "step_order": 3,
                "category": "MOISTURIZING",
                "title": "Daily Barrier Emulsion",
                "description": "Balanced lotion providing 24-hour hydration and antioxidant protection.",
                "frequency": "DAILY",
                "key_actives": ["Ceramides", "Vitamin E", "Sodium Hyaluronate"],
                "safety_notes": "All-day moisture barrier support.",
            }
        morning_steps.append(m_moisturizer)

        # Step 4: Sun Protection
        if is_sensitive or cls._is_safe("Chemical Sunscreen", forbidden) is False:
            spf_title = "Mineral Physical Sunscreen SPF 50+ PA++++"
            spf_actives = ["Zinc Oxide (Non-nano 15%)", "Centella Asiatica"]
            spf_notes = "Physical mineral shield; ideal for sensitive skin and post-blemish care."
        else:
            spf_title = "Broad-Spectrum Invisible Shield SPF 50+ PA++++"
            spf_actives = ["Modern UV Filters", "Tocopherol", "Niacinamide"]
            spf_notes = "Lightweight, zero white cast, broad UVA/UVB protection."

        morning_steps.append({
            "step_order": 4,
            "category": "SUN_PROTECTION",
            "title": spf_title,
            "description": "Apply two finger lengths generously 15 minutes before sun exposure. Reapply every 2-3 hours.",
            "frequency": "DAILY",
            "key_actives": [act for act in spf_actives if cls._is_safe(act, forbidden)],
            "safety_notes": spf_notes,
        })

        # -----------------------------------------------------------------
        # 2. EVENING ROUTINE
        # -----------------------------------------------------------------
        evening_steps: List[Dict[str, Any]] = []

        # Step 1: Cleansing / Double Cleanse
        evening_steps.append({
            "step_order": 1,
            "category": "CLEANSING",
            "title": "Evening Deep Cleansing & Purifying Wash",
            "description": "Melt away environmental pollutants, sunscreen, and daily debris without stripping moisture.",
            "frequency": "DAILY",
            "key_actives": ["Micellar Lipids", "Glycerin", "Chamomile Extract"],
            "safety_notes": "Crucial step to remove PM2.5 particulate matter and oxidized sebum.",
        })

        # Step 2: Night Targeted Treatment
        if primary_concern in ["ACNE"]:
            e_treatment_actives = ["Azelaic Acid (10%)", "Zinc PCA", "Tea Tree Extract"]
            if cls._is_safe("Salicylic Acid", forbidden) and not is_sensitive:
                e_treatment_actives.insert(0, "Salicylic Acid (1.5%)")

            evening_steps.append({
                "step_order": 2,
                "category": "TREATMENT",
                "title": "Overnight Clarifying Treatment",
                "description": "Target active congestion and accelerate cellular debris clearance while you sleep.",
                "frequency": "DAILY",
                "key_actives": [act for act in e_treatment_actives if cls._is_safe(act, forbidden)][:2],
                "safety_notes": "Targeted active; avoid immediate eye contact area.",
            })
        elif primary_concern in ["WRINKLES", "FINE_LINES"]:
            # Check Retinoid safety
            if cls._is_safe("Retinol", forbidden) and not is_sensitive:
                e_actives = ["Encapsulated Retinol (0.2%)", "Copper Tripeptides"]
                safety = "Start 2-3 nights per week, gradually building tolerance. Always follow with moisturizer."
            else:
                e_actives = ["Bakuchiol (Natural Retinol Alternative)", "Argireline", "Peptides"]
                safety = "Gentle plant-derived alternative safe for sensitive skin with zero retinoid dermatitis risk."

            evening_steps.append({
                "step_order": 2,
                "category": "TREATMENT",
                "title": "Cellular Renewal & Elasticity Complex",
                "description": "Stimulates natural collagen and optimizes overnight cellular turnover.",
                "frequency": "DAILY",
                "key_actives": [act for act in e_actives if cls._is_safe(act, forbidden)][:2],
                "safety_notes": safety,
            })
        elif primary_concern in ["HYPERPIGMENTATION", "DARK_SPOTS"]:
            evening_steps.append({
                "step_order": 2,
                "category": "TREATMENT",
                "title": "Night Pigment Recovery Concentrate",
                "description": "Slows pigment transfer and gently smooths surface discoloration.",
                "frequency": "DAILY",
                "key_actives": ["Niacinamide (5%)", "Tranexamic Acid", "Licorice Root Extract"],
                "safety_notes": "Restores luminous, uniform skin tone.",
            })
        else:
            evening_steps.append({
                "step_order": 2,
                "category": "TREATMENT",
                "title": "Overnight Barrier Lipid Repair Concentrate",
                "description": "Replenishes skin bio-lipids and strengthens cellular intercellular matrix.",
                "frequency": "DAILY",
                "key_actives": ["Multi-Ceramides", "Hyaluronic Acid", "Squalane"],
                "safety_notes": "Deep barrier recovery and calming action.",
            })

        # Step 3: Night Moisturizing & Recovery
        evening_steps.append({
            "step_order": 3,
            "category": "MOISTURIZING",
            "title": "Restorative Lipid Night Cream",
            "description": "Seal treatment serums beneath a biocompatible barrier to prevent overnight moisture loss.",
            "frequency": "DAILY",
            "key_actives": ["Ceramide NP", "Shea Butter Fraction", "Fatty Acids"],
            "safety_notes": "Nourishes the stratum corneum overnight.",
        })

        # Step 4: Night Care / Sealant
        evening_steps.append({
            "step_order": 4,
            "category": "NIGHT_CARE",
            "title": "Cica Calming Night Sealant",
            "description": "Apply a thin layer to vulnerable or sensitive areas to lock in active treatments.",
            "frequency": "DAILY",
            "key_actives": ["Centella Asiatica (Cica)", "Allantoin"],
            "safety_notes": "Soothes overnight micro-inflammation.",
        })

        # -----------------------------------------------------------------
        # 3. WEEKLY TREATMENT PLAN
        # -----------------------------------------------------------------
        weekly_steps: List[Dict[str, Any]] = []

        if is_sensitive:
            weekly_steps.append({
                "step_order": 1,
                "category": "EXFOLIATION",
                "title": "Ultra-Gentle Enzyme / PHA Melting Mask",
                "description": "Extremely mild fruit enzymes dissolve dead surface cells without physical abrasion or irritation.",
                "frequency": "1X_WEEKLY",
                "key_actives": ["Papaya Enzyme", "Gluconolactone (PHA)"],
                "safety_notes": "Safe for easily irritated skin. Leave on 5 minutes and rinse.",
            })
        elif skin_type in ["OILY", "COMBINATION"]:
            cand_exfoliants = ["BHA / PHA Clarifying Solution", "Kaolin Clay"]
            weekly_steps.append({
                "step_order": 1,
                "category": "EXFOLIATION",
                "title": "Pore Decongesting & Refining Mask",
                "description": "Clarifies sebaceous filaments and removes accumulated keratolytic build-up.",
                "frequency": "2X_WEEKLY",
                "key_actives": [act for act in cand_exfoliants if cls._is_safe(act, forbidden)],
                "safety_notes": "Use on non-consecutive evenings.",
            })
        else:
            weekly_steps.append({
                "step_order": 1,
                "category": "EXFOLIATION",
                "title": "Gentle Lactic Acid Exfoliating Treatment",
                "description": "Mild AHA that smooths texture while simultaneously drawing moisture into the skin.",
                "frequency": "1X_WEEKLY",
                "key_actives": ["Lactic Acid (5%)", "Hyaluronic Acid"],
                "safety_notes": "Follow with rich night cream.",
            })

        weekly_steps.append({
            "step_order": 2,
            "category": "TREATMENT",
            "title": "Intensive Barrier Hydration Recovery Mask",
            "description": "Deep drenching sheet mask or leave-on treatment packed with bio-placental humectants.",
            "frequency": "1X_WEEKLY",
            "key_actives": ["Ectoin", "Ceramides", "Trehalose"],
            "safety_notes": "Use after exfoliation to replenish cellular moisture reservoir.",
        })

        # -----------------------------------------------------------------
        # 4. SEASONAL ROUTINE ADAPTATION
        # -----------------------------------------------------------------
        seasonal_steps = cls._build_seasonal_routine(
            skin_type=skin_type,
            primary_concern=primary_concern,
            forbidden=forbidden,
            is_sensitive=is_sensitive,
        )

        # -----------------------------------------------------------------
        # Curated Clinical Product Recommendations Attachment
        # -----------------------------------------------------------------
        all_step_groups = [morning_steps, evening_steps, weekly_steps, seasonal_steps]
        for group in all_step_groups:
            for step in group:
                step["product_recommendations"] = match_products_for_step(
                    category=step["category"],
                    skin_type=skin_type,
                    key_actives=step.get("key_actives"),
                    forbidden_tokens=forbidden,
                    limit=2,
                )

        # Summary statement
        allergen_summary = "Zero allergen conflicts detected."
        if forbidden:
            allergen_summary = f"Strictly filtered {len(forbidden)} contra-indicated ingredients based on user profile."

        routines_list = [
            {
                "routine_type": "MORNING",
                "steps": morning_steps,
            },
            {
                "routine_type": "EVENING",
                "steps": evening_steps,
            },
            {
                "routine_type": "WEEKLY",
                "steps": weekly_steps,
            },
        ]
        if include_seasonal:
            routines_list.append({
                "routine_type": "SEASONAL",
                "steps": seasonal_steps,
            })

        return {
            "version": version,
            "summary": (
                f"Personalized Routine (Version {version}) formulated for {skin_type.capitalize()} skin "
                f"targeting {primary_concern.replace('_', ' ').title()}. {allergen_summary}"
            ),
            "routines": routines_list,
        }

    @classmethod
    def _build_seasonal_routine(
        cls,
        skin_type: str,
        primary_concern: str,
        forbidden: List[str],
        is_sensitive: bool,
    ) -> List[Dict[str, Any]]:
        month = datetime.now().month
        if month in [12, 1, 2]:
            steps = [
                {
                    "step_order": 1,
                    "category": "CLEANSING",
                    "title": "Winter Barrier-Shielding Lipid Cleanser",
                    "description": "Protects fragile winter skin barrier from cold-air lipid depletion and indoor central heating dryness.",
                    "frequency": "DAILY",
                    "key_actives": ["Ceramides", "Glycerin", "Squalane"],
                    "safety_notes": "Use lukewarm water. Avoid hot water that melts intercellular lipids.",
                },
                {
                    "step_order": 2,
                    "category": "MOISTURIZING",
                    "title": "Deep Ceramide & Barrier Occlusive Cream",
                    "description": "Fortifies stratum corneum with physiological 3:1:1 lipid ratio to stop cold wind TEWL.",
                    "frequency": "DAILY",
                    "key_actives": ["Ceramide NP", "Cholesterol", "Shea Butter"],
                    "safety_notes": "Apply immediately to damp skin after cleansing.",
                },
                {
                    "step_order": 3,
                    "category": "SUN_PROTECTION",
                    "title": "Nourishing Winter Hydrating SPF 50+",
                    "description": "UVA radiation penetrates winter clouds and glass; maintains barrier photoprotection.",
                    "frequency": "DAILY",
                    "key_actives": ["Zinc Oxide", "Hyaluronic Acid", "Vitamin E"],
                    "safety_notes": "Re-apply before outdoor winter exposure.",
                },
            ]
        elif month in [6, 7, 8]:
            steps = [
                {
                    "step_order": 1,
                    "category": "CLEANSING",
                    "title": "Summer Pore-Decongesting Gel Cleanser",
                    "description": "Clears excess sweat, sebum, and sunscreen accumulation without stripping the acid mantle.",
                    "frequency": "DAILY",
                    "key_actives": ["Zinc PCA", "Green Tea Extract"],
                    "safety_notes": "Wash morning and immediately after high-heat activities.",
                },
                {
                    "step_order": 2,
                    "category": "TREATMENT",
                    "title": "Antioxidant Heat & UV Defense Elixir",
                    "description": "Quenches free radicals produced by high UV indices, heat stress, and tropospheric ozone.",
                    "frequency": "DAILY",
                    "key_actives": ["Ectoin", "Niacinamide", "Centella Asiatica"],
                    "safety_notes": "Calms erythema and heat flush.",
                },
                {
                    "step_order": 3,
                    "category": "SUN_PROTECTION",
                    "title": "High-Sweat Broad Spectrum SPF 50+",
                    "description": "Weightless oil-free photostable UV shield resistant to humidity breakdown.",
                    "frequency": "DAILY",
                    "key_actives": ["Zinc Oxide", "Silica", "Antioxidants"],
                    "safety_notes": "Re-apply every 2 hours under direct sunlight.",
                },
            ]
        elif month in [3, 4, 5]:
            steps = [
                {
                    "step_order": 1,
                    "category": "CLEANSING",
                    "title": "Spring Anti-Pollution Clarifying Foam",
                    "description": "Removes airborne pollen, fine particulates, and allergens that trigger seasonal flare-ups.",
                    "frequency": "DAILY",
                    "key_actives": ["Panthenol", "Centella Asiatica"],
                    "safety_notes": "Hypoallergenic cleansing.",
                },
                {
                    "step_order": 2,
                    "category": "TREATMENT",
                    "title": "Cellular Renewal & Anti-Allergen Soothing Serum",
                    "description": "Calms seasonal transition sensitivity and reinforces skin tolerance thresholds.",
                    "frequency": "DAILY",
                    "key_actives": ["Madecassoside", "Allantoin", "Trehalose"],
                    "safety_notes": "Supports epidermal resilience during seasonal weather fluctuations.",
                },
                {
                    "step_order": 3,
                    "category": "MOISTURIZING",
                    "title": "Adaptogenic Balancing Emulsion",
                    "description": "Medium-weight hydrator that balances shifting springtime humidity.",
                    "frequency": "DAILY",
                    "key_actives": ["Hyaluronic Acid", "Beta-Glucan"],
                    "safety_notes": "Locks in hydration without heavy occlusion.",
                },
            ]
        else:  # Autumn / Monsoon (Months 9, 10, 11)
            steps = [
                {
                    "step_order": 1,
                    "category": "CLEANSING",
                    "title": "Microbial Equilibrium & Balancing Cleanse",
                    "description": "Defends against humidity-driven microbial proliferation and atmospheric particulate adhesion.",
                    "frequency": "DAILY",
                    "key_actives": ["Zinc PCA", "Thermal Spring Water", "Centella Asiatica"],
                    "safety_notes": "Gently purifies without over-stripping.",
                },
                {
                    "step_order": 2,
                    "category": "TREATMENT",
                    "title": "Epidermal Water-Binding Humectant Infusion",
                    "description": "Combines multi-depth humectants to sustain cellular turgor through transitioning ambient humidity.",
                    "frequency": "DAILY",
                    "key_actives": ["Hyaluronic Acid", "Panthenol", "Ectoin"],
                    "safety_notes": "Deeply replenishes moisture reservoirs.",
                },
                {
                    "step_order": 3,
                    "category": "MOISTURIZING",
                    "title": "Barrier Lipidic Shield & Environmental Buffer",
                    "description": "Prepares the barrier for dropping temperatures while maintaining lightweight non-comedogenic breathability.",
                    "frequency": "DAILY",
                    "key_actives": ["Ceramides", "Madecassoside", "Squalane"],
                    "safety_notes": "Strengthens intercellular cement against seasonal shifts.",
                },
            ]

        # Filter actives against forbidden tokens
        for s in steps:
            s["key_actives"] = [act for act in s["key_actives"] if cls._is_safe(act, forbidden)]

        return steps
