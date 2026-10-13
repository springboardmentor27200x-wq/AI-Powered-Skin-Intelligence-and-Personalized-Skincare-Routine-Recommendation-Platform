import { SkinProfile } from "../types";

export type Season = "summer" | "winter" | "spring" | "autumn" | "monsoon";

export interface SeasonalClimateImpact {
  season: Season;
  name: string;
  badge_color: string;
  temp_range: string;
  humidity_level: string;
  uv_index_range: string;
  climate_summary: string;
  skin_barrier_impact: string;
  tewl_risk: "Low" | "Moderate" | "High" | "Critical";
  sebum_effect: string;
  erythema_sensitivity: string;
}

export interface SeasonalStepAdjustment {
  step_number: number;
  routine_slot: "AM" | "PM" | "Weekly";
  category: string;
  title: string;
  standard_approach: string;
  seasonal_adaptation: string;
  clinical_rationale: string;
  recommended_actives: string[];
  ingredients_to_pause_or_buffer: string[];
}

export interface SeasonalProductSwap {
  id: number;
  name: string;
  brand: string;
  category: string;
  swap_from: string;
  swap_reason: string;
  season_benefit: string;
  price: number;
  key_actives: string[];
}

export interface SeasonalHabitTip {
  title: string;
  description: string;
  target_metric: string;
  category: "Photoprotection" | "Indoor Humidity" | "Hydration" | "Cleansing Protocol" | "Active Modulation";
}

export interface SeasonalRoutineProfile {
  season: Season;
  climate_impact: SeasonalClimateImpact;
  personalized_skin_note: string;
  barrier_stress_rating: "Normal" | "Moderate" | "Elevated" | "High";
  morning_adjustments: SeasonalStepAdjustment[];
  evening_adjustments: SeasonalStepAdjustment[];
  weekly_adjustments: SeasonalStepAdjustment[];
  recommended_swaps: SeasonalProductSwap[];
  lifestyle_climate_tips: SeasonalHabitTip[];
}

export const SEASONS_DATA: Record<Season, SeasonalClimateImpact> = {
  summer: {
    season: "summer",
    name: "Summer / High Heat & UV",
    badge_color: "amber",
    temp_range: "26°C – 38°C (78°F – 100°F)",
    humidity_level: "High (65% – 85%)",
    uv_index_range: "Peak 8 – 11+ (Very High to Extreme)",
    climate_summary:
      "Intense solar ultraviolet radiation (UVA & UVB), ambient heat, and accelerated sweat production trigger hyper-seborrhea, follicular dilation, oxidative lipid peroxidation, and water-resistant SPF buildup.",
    skin_barrier_impact:
      "Increased perspiration alters skin surface pH, while elevated temperatures thin sebum, increasing follicular occlusion and inflammatory acne flares.",
    tewl_risk: "Moderate",
    sebum_effect: "Significantly Increased (+10% secretion per 1°C ambient increase)",
    erythema_sensitivity: "High (Photoreactive & Sunburn Risk)",
  },
  winter: {
    season: "winter",
    name: "Winter / Cold & Low Humidity",
    badge_color: "cyan",
    temp_range: "-5°C – 10°C (23°F – 50°F)",
    humidity_level: "Very Low (15% – 35%)",
    uv_index_range: "Low 1 – 3 (UVA Still Persistent)",
    climate_summary:
      "Sub-zero winds combined with dry forced-air indoor heating severely deplete stratum corneum moisture reservoirs, causing intercellular lipid matrix fracture and impaired enzymatic desquamation.",
    skin_barrier_impact:
      "Transepidermal water loss (TEWL) reaches peak annual levels; epidermal ceramide synthesis slows, prompting micro-fissures, stinging, and retinoid irritation.",
    tewl_risk: "Critical",
    sebum_effect: "Substantially Decreased (Viscous, sluggish lipid flow)",
    erythema_sensitivity: "High (Cold Wind & Vasodilation Flushing)",
  },
  spring: {
    season: "spring",
    name: "Spring / Transition & High Pollen",
    badge_color: "emerald",
    temp_range: "12°C – 22°C (54°F – 72°F)",
    humidity_level: "Moderate (45% – 60%)",
    uv_index_range: "Moderate 4 – 7 (Rising Steadily)",
    climate_summary:
      "Rapidly fluctuating barometric pressures, rising temperature transitions, and airborne tree/grass pollen allergens induce intermittent contact dermatitis, histamine flares, and barrier instability.",
    skin_barrier_impact:
      "Skin transitions out of winter lethargy; reactive micro-inflammation and histamine responses require soothing antioxidants and barrier stabilization.",
    tewl_risk: "Moderate",
    sebum_effect: "Gradually Normalizing",
    erythema_sensitivity: "Moderate (Seasonal Allergen Sensitivity)",
  },
  autumn: {
    season: "autumn",
    name: "Autumn / Post-Summer Barrier Recovery",
    badge_color: "orange",
    temp_range: "10°C – 20°C (50°F – 68°F)",
    humidity_level: "Declining (40% – 55%)",
    uv_index_range: "Moderate 3 – 5",
    climate_summary:
      "Falling ambient temperatures and drying winds arrive after months of cumulative summer UV photo-damage. Subclinical melanocyte activation requires non-irritating tyrosinase inhibitors and barrier strengthening.",
    skin_barrier_impact:
      "The prime physiological window to reverse solar hyperpigmentation, exfoliate dead keratinocytes, and replenish ceramide lipid reserves before freezing temperatures.",
    tewl_risk: "Moderate",
    sebum_effect: "Decreasing Steadily",
    erythema_sensitivity: "Moderate",
  },
  monsoon: {
    season: "monsoon",
    name: "Monsoon / Humid Wet & Tropical",
    badge_color: "indigo",
    temp_range: "24°C – 32°C (75°F – 90°F)",
    humidity_level: "Extremely High (80% – 95%)",
    uv_index_range: "High 6 – 9 (Penetrates Cloud Cover)",
    climate_summary:
      "Near-saturation ambient humidity paired with persistent perspiration fosters fungal acne (Malassezia folliculitis), closed comedones, and bacterial proliferation beneath heavy topical formulations.",
    skin_barrier_impact:
      "Keratin hydration saturation compromises stratum corneum tight junctions; requires antibacterial, light water-gel matrices and zero heavy occlusives.",
    tewl_risk: "Low",
    sebum_effect: "Very High & Sweat-Emulsified",
    erythema_sensitivity: "Low to Moderate",
  },
};

/**
 * Generates an algorithmic seasonal routine profile customized to the user's skin profile.
 */
export function generateSeasonalRoutine(
  season: Season,
  profile: SkinProfile | null
): SeasonalRoutineProfile {
  const skinType = profile?.skin_type || "Oily";
  const primaryConcerns = profile?.skin_concerns || ["Acne", "Compromised Barrier"];
  const climate = SEASONS_DATA[season];

  let personalized_skin_note = "";
  let barrier_stress_rating: "Normal" | "Moderate" | "Elevated" | "High" = "Moderate";

  // Skin type specific clinical logic
  if (season === "summer") {
    if (skinType === "Oily" || skinType === "Combination") {
      personalized_skin_note =
        "Your natural sebum output will peak this season. Standard rich creams will induce follicular congestion. Switch to aqueous gel matrices, double cleanse at night to fully dissolve water-resistant SPF, and harness Niacinamide 2-5% to regulate sebocyte lipid production.";
      barrier_stress_rating = "Elevated";
    } else if (skinType === "Dry") {
      personalized_skin_note =
        "While humidity prevents excessive dryness, UV radiation and air conditioning will degrade natural moisturizing factors (NMF). Use a lightweight hyaluronic acid serum followed by a fluid lotion with antioxidant Vitamin C.";
      barrier_stress_rating = "Moderate";
    } else {
      personalized_skin_note =
        "Focus on broad-spectrum photoprotection and lightweight antioxidant defense. Keep formulations non-occlusive while guarding against sweat-induced barrier disruption.";
      barrier_stress_rating = "Moderate";
    }
  } else if (season === "winter") {
    if (skinType === "Dry" || skinType === "Sensitive") {
      personalized_skin_note =
        "Critical TEWL phase: Ambient indoor humidity below 30% will draw water directly out of your living epidermis. Eliminate foaming sulfate cleansers, introduce multi-ceramide barrier balms, and sandwich active retinoids between layers of lipid cream.";
      barrier_stress_rating = "High";
    } else if (skinType === "Oily" || skinType === "Combination") {
      personalized_skin_note =
        "Cold weather thickens sebum, preventing smooth pore drainage while low indoor humidity dries the surface layer. Avoid over-stripping with harsh washes; switch to a gentle non-foaming hydrating wash and apply ceramide gel-creams.";
      barrier_stress_rating = "Elevated";
    } else {
      personalized_skin_note =
        "Winter requires boosting barrier lipid ratios (Ceramides 3:1:1 Cholesterol : Free Fatty Acids). Shield cheekbones and periorbital tissue from freezing wind chill.";
      barrier_stress_rating = "Moderate";
    }
  } else if (season === "spring") {
    personalized_skin_note =
      "Spring pollen and sudden temperature shifts trigger reactive erythema and histamine release. Calm the micro-environment with Centella Asiatica, Allantoin, and Ectoin while gently clearing winter dead cells with low-percentage PHAs.";
    barrier_stress_rating = "Moderate";
  } else if (season === "autumn") {
    personalized_skin_note =
      "Post-summer UV damage has stimulated melanogenesis. This is the optimal clinical window for Tranexamic Acid and Azelaic Acid to fade hyperpigmentation while pre-loading your barrier with squalane and barrier lipids ahead of winter.";
    barrier_stress_rating = "Normal";
  } else {
    // Monsoon
    personalized_skin_note =
      "Extreme humidity (>85%) creates an ideal breeding ground for Malassezia yeast and follicular pore occlusion. Avoid all heavy oils, Shea butter, and petrolatum; rely strictly on light gel textures with Zinc PCA and Salicylic Acid.";
    barrier_stress_rating = "Elevated";
  }

  // Morning Adjustments
  const morning_adjustments: SeasonalStepAdjustment[] = [
    {
      step_number: 1,
      routine_slot: "AM",
      category: "Cleanser",
      title: season === "winter" ? "Gentle Hydrating Cream Cleanser" : "Light Clarifying Gel Cleanse",
      standard_approach: "Standard gentle cleansing",
      seasonal_adaptation:
        season === "winter"
          ? "Switch to a lipid-sparing, non-foaming cleansing lotion or lukewarm water rinse to preserve delicate stratum corneum lipids."
          : season === "summer" || season === "monsoon"
          ? "Use a mild amino-acid gel cleanser with 0.5% Salicylic Acid to dissolve overnight sebum and sweat without stripping."
          : "Mild pH 5.5 balanced balancing cleanser to sweep away overnight debris and pollen.",
      clinical_rationale:
        season === "winter"
          ? "Water-only or non-surfactant morning wash prevents stripping fragile ceramide bilayers."
          : "Dissolves oxidized sebum and prevents comedogenesis in high ambient temperatures.",
      recommended_actives:
        season === "winter"
          ? ["Ceramides", "Colloidal Oat", "Glycerin"]
          : ["Zinc PCA", "Salicylic Acid 0.5%", "Green Tea Extract"],
      ingredients_to_pause_or_buffer: season === "winter" ? ["Sodium Laureth Sulfate", "Alcohol Denat"] : ["Heavy Mineral Oils"],
    },
    {
      step_number: 2,
      routine_slot: "AM",
      category: "Antioxidant Serum",
      title: season === "summer" ? "High-Potency Vitamin C + Ferulic Photoprotection" : "Barrier Defense Hydration Serum",
      standard_approach: "Daily active serum",
      seasonal_adaptation:
        season === "summer"
          ? "Apply 15% L-Ascorbic Acid + 0.5% Ferulic Acid. This provides an eight-fold increase in photoprotection against solar UV reactive oxygen species (ROS)."
          : season === "winter"
          ? "Switch from high-strength pure L-Ascorbic Acid (which can sting in dry winter air) to Sodium Ascorbyl Phosphate or 5% Niacinamide paired with Panthenol B5."
          : "Apply 10% Niacinamide + Centella Asiatica to reinforce barrier resilience against fluctuating spring temperatures.",
      clinical_rationale:
        season === "summer"
          ? "Topical antioxidants neutralize the 45% of UV-generated free radicals that sunscreen filters cannot block alone."
          : "Minimizes barrier stinging while suppressing winter inflammatory pathways.",
      recommended_actives:
        season === "summer"
          ? ["Ascorbic Acid 15%", "Ferulic Acid", "Alpha-Tocopherol"]
          : ["Niacinamide", "Panthenol (Pro-Vitamin B5)", "Beta-Glucan"],
      ingredients_to_pause_or_buffer: season === "summer" ? ["High-strength Glycolic Acid in AM"] : ["Fragrance", "Essential Oils"],
    },
    {
      step_number: 3,
      routine_slot: "AM",
      category: "Moisturizer",
      title: season === "summer" || season === "monsoon" ? "Oil-Free Water Gel Hydrator" : "Rich Barrier Ceramide Cream",
      standard_approach: "Standard barrier moisturizer",
      seasonal_adaptation:
        season === "summer" || season === "monsoon"
          ? "Swap thick cream for an ultra-sheer aqueous gel formulation with Hyaluronic Acid, Polyglutamic Acid, and Centella."
          : season === "winter"
          ? "Upgrade to a physiological lipid repair cream containing Ceramides, Cholesterol, and Free Fatty Acids in a 3:1:1 molar ratio."
          : "Lightweight moisturizing emulsion balancing light humectants with squalane barrier protection.",
      clinical_rationale:
        season === "summer" || season === "monsoon"
          ? "Prevents sweat pore occlusion and shininess while maintaining cellular turgor."
          : "Physiologically seals stratum corneum against dry indoor radiator heating.",
      recommended_actives:
        season === "summer" || season === "monsoon"
          ? ["Centella Asiatica", "Polyglutamic Acid", "Hyaluronic Acid"]
          : ["Ceramide NP", "Ceramide AP", "Cholesterol", "Phytosphingosine"],
      ingredients_to_pause_or_buffer:
        season === "summer" || season === "monsoon" ? ["Shea Butter", "Petrolatum", "Myristyl Myristate"] : [],
    },
    {
      step_number: 4,
      routine_slot: "AM",
      category: "Sunscreen",
      title: season === "summer" ? "Broad Spectrum SPF 50+ PA++++ (Water-Resistant)" : "Hydrating Dewy Broad Spectrum SPF 50",
      standard_approach: "Standard SPF 30-50",
      seasonal_adaptation:
        season === "summer"
          ? "Mandatory 80-minute water/sweat-resistant SPF 50+ with photostable modern organic filters (Tinosorb S, Uvinul A Plus) or micronized Zinc Oxide. Reapply every 2 hours."
          : season === "winter"
          ? "Nourishing, hydrating fluid SPF 50. UVA rays (which penetrate clouds and window glass to degrade dermal elastin) remain stable throughout winter months."
          : "Non-sticky daily mineral or fluid sunscreen with anti-pollution and pollen-shielding polymer film.",
      clinical_rationale:
        season === "summer"
          ? "Prevents acute erythema (sunburn) and long-term DNA thymine dimer formation under peak solar irradiation."
          : "Maintains ongoing photoprotection while soothing dry winter windburn.",
      recommended_actives: ["Zinc Oxide", "Tinosorb S", "Uvinul A Plus", "Ectoin"],
      ingredients_to_pause_or_buffer: ["Oxybenzone (Photoreactive / Allergenic)"],
    },
  ];

  // Evening Adjustments
  const evening_adjustments: SeasonalStepAdjustment[] = [
    {
      step_number: 1,
      routine_slot: "PM",
      category: "Double Cleanse",
      title: season === "summer" || season === "monsoon" ? "Thorough Oil-to-Milk Double Cleanse" : "Nourishing Balm First Cleanse",
      standard_approach: "Standard night cleanse",
      seasonal_adaptation:
        season === "summer" || season === "monsoon"
          ? "Mandatory 2-step cleansing: Light non-comedogenic oil/micellar water first to break down water-resistant sunscreen and sweat salts, followed by a gentle gel wash."
          : season === "winter"
          ? "Nourishing oat lipid balm followed by a creamy milk wash that leaves an emollient film to buffer against dry night air."
          : "Gentle balancing oil cleanse followed by a mild foam cleanse.",
      clinical_rationale:
        "Water-resistant SPF cannot be removed by water or mild cleansers alone, causing micro-comedones if left on skin overnight.",
      recommended_actives:
        season === "summer"
          ? ["Jojoba Oil", "Caprylic/Capric Triglyceride", "Decyl Glucoside"]
          : ["Colloidal Oat Oil", "Squalane", "Tocopherol"],
      ingredients_to_pause_or_buffer: ["Harsh Physical Walnut Scrubs"],
    },
    {
      step_number: 2,
      routine_slot: "PM",
      category: "Target Active / Retinoid",
      title: season === "winter" ? "Sandwich-Method Buffered Retinoid" : "Clarifying BHA / Retinoid Protocol",
      standard_approach: "Nightly active treatment",
      seasonal_adaptation:
        season === "winter"
          ? "Reduce Retinoid frequency to 3 nights/week. Apply a thin layer of moisturizer first ('Sandwich Method') to prevent retinoid-induced eczema and severe flaking."
          : season === "summer"
          ? "Retinoids are photosensitizing; ensure strict nighttime-only application. Alternate with 2% Salicylic Acid on non-retinoid nights to keep pores clear."
          : "Standard alternating active schedule (Retinoid 3-4x/week, soothing barrier repair on alternate nights).",
      clinical_rationale:
        season === "winter"
          ? "Buffering slows trans-epidermal penetration rate of retinoic acid, blunting the inflammatory receptor cascade."
          : "Combats accelerated follicular hyperkeratinization driven by sweat and heat.",
      recommended_actives:
        season === "winter"
          ? ["Retinol 0.2%", "Bakuchiol", "Ceramides"]
          : ["Encapsulated Retinal", "Salicylic Acid 2%", "Niacinamide 4%"],
      ingredients_to_pause_or_buffer: season === "winter" ? ["High-percentage Glycolic Acid (10%+)"] : [],
    },
    {
      step_number: 3,
      routine_slot: "PM",
      category: "Night Sealant / Barrier Lock",
      title: season === "winter" ? "Intense Barrier Slugging / Recovery Balm" : "Lightweight Restorative Gel-Emulsion",
      standard_approach: "Standard night cream",
      seasonal_adaptation:
        season === "winter"
          ? "Lock in overnight hydration with a rich occlusive layer containing squalane, ceramides, or targeted petrolatum slugging on high-friction zones (cheeks and nose)."
          : season === "summer" || season === "monsoon"
          ? "Use a fast-absorbing barrier repair emulsion with Cica (Centella) and Madecassoside that restores the acid mantle without trapping sweat."
          : "Medium weight night cream rich in phytosterols and panthenol.",
      clinical_rationale:
        season === "winter"
          ? "Overnight heating systems reduce ambient humidity to desert levels (<20%), accelerating nocturnal TEWL."
          : "Permits natural skin respiration and perspiration without forming sweat traps.",
      recommended_actives:
        season === "winter"
          ? ["Squalane", "Ceramide EOP", "Cholesterol", "Allantoin"]
          : ["Centella Asiatica", "Madecassoside", "Sodium Hyaluronate"],
      ingredients_to_pause_or_buffer:
        season === "summer" || season === "monsoon" ? ["Heavy Occlusive Petroleum Wax", "Lanolin"] : [],
    },
  ];

  // Weekly Treatments
  const weekly_adjustments: SeasonalStepAdjustment[] = [
    {
      step_number: 1,
      routine_slot: "Weekly",
      category: "Deep Clarification / Pore Refining",
      title: season === "summer" ? "Kaolin & Charcoal Clay Pore Detox (1-2x/week)" : "Gentle Enzyme Peeling (1x/week)",
      standard_approach: "Weekly exfoliation",
      seasonal_adaptation:
        season === "summer" || season === "monsoon"
          ? "Apply a mineral kaolin/bentonite clay mask with tea tree or sulfur for 10 minutes to adsorb excess sebum and clear congested pores."
          : season === "winter"
          ? "Avoid granular physical scrubs or drying clay masks. Use gentle fruit enzyme exfoliants (Papain, Bromelain) or low-strength Lactic Acid (5%)."
          : "Gentle PHA (Gluconolactone 4%) exfoliation to sweep away dull winter cells without triggering spring allergies.",
      clinical_rationale:
        season === "summer" || season === "monsoon"
          ? "Extracts sebum plugs before they oxidize into open comedones (blackheads)."
          : "Enzymatic proteolysis breaks desmosomes without stripping the depleted lipid bilayer.",
      recommended_actives:
        season === "summer"
          ? ["Kaolin Clay", "Zinc Oxide", "Salicylic Acid"]
          : ["Papain", "Bromelain", "Lactic Acid 5%"],
      ingredients_to_pause_or_buffer: season === "winter" ? ["Bentonite Clay", "Micro-bead Scrubs"] : [],
    },
    {
      step_number: 2,
      routine_slot: "Weekly",
      category: "Barrier & Hydration Infusion",
      title: season === "summer" ? "Soothing Centella Hydrogel Calming Treatment" : "Deep Ceramide Overnight Lipid Sleeping Pack",
      standard_approach: "Weekly hydration mask",
      seasonal_adaptation:
        season === "summer"
          ? "Post-sun restorative treatment: Use chilled Centella Asiatica or Aloe vera hydrogel to downregulate UV-induced IL-1alpha and COX-2 inflammatory enzymes."
          : season === "winter"
          ? "Overnight deep moisture mask with 5 Ceramides, Shea Olein, and Polyglutamic Acid to reverse cumulative micro-flaking."
          : "Nourishing antioxidant green tea sheet mask to soothe seasonal pollen exposure.",
      clinical_rationale:
        season === "summer"
          ? "Immediate cutaneous thermal cooling dampens erythema and prevents delayed melanogenesis."
          : "Sustained 8-hour occlusion repairs cracked intercellular lipid architecture.",
      recommended_actives:
        season === "summer"
          ? ["Centella Asiatica", "Allantoin", "Cucumber Extract", "Panthenol"]
          : ["Ceramide Complex", "Squalane", "Oat Beta-Glucan"],
      ingredients_to_pause_or_buffer: [],
    },
  ];

  // Recommended Swaps from Catalog
  const recommended_swaps: SeasonalProductSwap[] =
    season === "summer" || season === "monsoon"
      ? [
          {
            id: 104,
            name: "Hydro-Barrier Water Gel Cream",
            brand: "DermaPure Labs",
            category: "Moisturizer",
            swap_from: "Heavy Ceramide Barrier Balm",
            swap_reason: "Heavy creams trap perspiration and trigger comedones during high summer humidity.",
            season_benefit: "Featherlight gel matrix delivers 72h hydration with zero pore occlusion.",
            price: 28.0,
            key_actives: ["Hyaluronic Acid", "Centella Asiatica", "Polyglutamic Acid"],
          },
          {
            id: 105,
            name: "Antioxidant UV Fluid SPF 50+ PA++++",
            brand: "SolarShield Rx",
            category: "Sunscreen",
            swap_from: "Dewy Standard Day Moisturizer",
            swap_reason: "Peak summer UV index (8-11+) demands broad-spectrum water-resistant photoprotection.",
            season_benefit: "Non-greasy, water-resistant matte finish that stays photostable through sweat.",
            price: 32.0,
            key_actives: ["Zinc Oxide", "Tinosorb S", "Vitamin E", "Ectoin"],
          },
          {
            id: 103,
            name: "Niacinamide 10% + Zinc 1% Pore Clarifier",
            brand: "DermaPure Labs",
            category: "Serum",
            swap_from: "Heavy Oil Serums",
            swap_reason: "Controls sebocyte hyperactivity provoked by elevated ambient temperatures.",
            season_benefit: "Reduces sebum excretion rate by up to 28% while fading post-sun blemish marks.",
            price: 24.0,
            key_actives: ["Niacinamide 10%", "Zinc PCA 1%"],
          },
        ]
      : season === "winter"
      ? [
          {
            id: 102,
            name: "Intensive 5-Ceramide Lipid Barrier Cream",
            brand: "BioBarrier Clinical",
            category: "Moisturizer",
            swap_from: "Lightweight Summer Gel Cream",
            swap_reason: "Sub-zero cold and dry radiator heat trigger critical transepidermal water loss.",
            season_benefit: "Restores physiological 3:1:1 lipid ratio to seal skin against dry air and wind chill.",
            price: 38.0,
            key_actives: ["Ceramides 1, 3, 6-II", "Cholesterol", "Free Fatty Acids", "Colloidal Oatmeal"],
          },
          {
            id: 101,
            name: "Gentle Cream-to-Milk Hydrating Cleanser",
            brand: "DermaPure Labs",
            category: "Cleanser",
            swap_from: "Foaming Salicylic Acid Gel Cleanser",
            swap_reason: "Foaming surfactants strip delicate winter barrier lipids, causing burning and redness.",
            season_benefit: "Cleanses thoroughly while depositing a protective layer of colloidal oats and glycerin.",
            price: 22.0,
            key_actives: ["Colloidal Oat Extract", "Glycerin", "Allantoin"],
          },
          {
            id: 107,
            name: "Multi-Molecular Hyaluronic Acid + B5 Quench",
            brand: "DermaPure Labs",
            category: "Serum",
            swap_from: "High-Strength Exfoliating Acid Serum",
            swap_reason: "Prevents acute winter xerosis and dehydration lines before active treatment.",
            season_benefit: "Penetrates 5 epidermal depths to rebuild depleted stratum corneum water tanks.",
            price: 29.0,
            key_actives: ["Sodium Hyaluronate (5 weights)", "Panthenol 5%", "Madecassoside"],
          },
        ]
      : [
          // Spring & Autumn
          {
            id: 106,
            name: "Phyto-Centella Calming Recovery Essence",
            brand: "BioBarrier Clinical",
            category: "Toner",
            swap_from: "Astringent Alcohol Toner",
            swap_reason: "Protects against seasonal pollen, rapid weather transitions, and airborne allergens.",
            season_benefit: "Instantly lowers skin surface temperature and downregulates histamine redness.",
            price: 26.0,
            key_actives: ["Centella Asiatica 84%", "Madecassoside", "Allantoin", "Panthenol"],
          },
          {
            id: 108,
            name: "Tranexamic Acid 3% + Niacinamide Brightener",
            brand: "DermaPure Labs",
            category: "Serum",
            swap_from: "Aggressive Chemical Peels",
            swap_reason: "Safely fades post-summer solar lentigines and UV hyperpigmentation without barrier trauma.",
            season_benefit: "Inhibits plasmin and melanin synthesis for an even, luminous complexion.",
            price: 34.0,
            key_actives: ["Tranexamic Acid 3%", "Niacinamide 5%", "Licorice Root Extract"],
          },
        ];

  // Environmental Habits & Climate Tips
  const lifestyle_climate_tips: SeasonalHabitTip[] =
    season === "summer"
      ? [
          {
            category: "Photoprotection",
            title: "Strict 2-Hour Reapplication & UV Peak Window",
            description:
              "UV Index peaks between 11:00 AM and 3:30 PM. Reapply sunscreen every 2 hours if outdoors, or immediately after sweating or swimming. Wear broad-brimmed hats with UPF 50+ rating.",
            target_metric: "SPF 50+ Reapplied 3x / day",
          },
          {
            category: "Cleansing Protocol",
            title: "Lukewarm Post-Sweat Rinse",
            description:
              "Sweat contains sodium chloride and lactic acid that can irritate follicular ostia if left on skin. Rinse face with lukewarm (never hot) water immediately after vigorous exercise or beach outings.",
            target_metric: "Rinse within 15 mins of workout",
          },
          {
            category: "Hydration",
            title: "Electrolyte Replenishment",
            description:
              "Cutaneous micro-circulation loses essential potassium and magnesium through perspiration. Increase daily water intake to 2.5 - 3.0 Liters with added electrolytes to support cellular skin turgor.",
            target_metric: "2.8 - 3.2 Liters / day",
          },
        ]
      : season === "winter"
      ? [
          {
            category: "Indoor Humidity",
            title: "Maintain 45%–55% Ambient Indoor Humidity",
            description:
              "Forced indoor heating drops room humidity below 25%, turning ambient air into a moisture sponge that strips skin. Run an ultrasonic cool-mist humidifier in the bedroom throughout the night.",
            target_metric: "45% – 55% Relative Humidity",
          },
          {
            category: "Cleansing Protocol",
            title: "Avoid Steaming Hot Showers on Facial Skin",
            description:
              "Hot water dissolves the intercellular lipid bilayer (ceramides and cholesterol), inducing immediate micro-tears and erythema. Wash face strictly with lukewarm water.",
            target_metric: "Water temp < 36°C (96°F)",
          },
          {
            category: "Active Modulation",
            title: "Retinoid 'Sandwich Method' Protection",
            description:
              "Apply moisturizer first, wait 5 minutes, apply retinoid, then top with a second thin layer of barrier cream. This buffers the trans-epidermal flux rate to prevent winter retinoid dermatitis.",
            target_metric: "3x / week buffered",
          },
        ]
      : [
          {
            category: "Photoprotection",
            title: "Rising UV Index Vigilance",
            description:
              "Spring and Autumn sun feels deceptive due to cooler winds, but UVA radiation penetrates deeply. Maintain daily broad-spectrum SPF 50 even on overcast days.",
            target_metric: "Daily SPF 50 every morning",
          },
          {
            category: "Indoor Humidity",
            title: "Transition Barrier Hydration",
            description:
              "Air conditioning or transitional heating creates micro-climates. Keep a soothing thermal water or Centella mist at your desk to calm sudden facial tightness.",
            target_metric: "Hydration mist 2x daily",
          },
        ];

  return {
    season,
    climate_impact: climate,
    personalized_skin_note,
    barrier_stress_rating,
    morning_adjustments,
    evening_adjustments,
    weekly_adjustments,
    recommended_swaps,
    lifestyle_climate_tips,
  };
}
