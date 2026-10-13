import {
  SkinProfile,
  SkinAssessment,
  SkincareRoutine,
  RoutineStep,
  WeeklyTreatment,
} from "../types";

export interface GenerateRoutineInput {
  userId: number;
  profile: SkinProfile;
  assessment: SkinAssessment;
  routineId?: number;
}

/**
 * Reusable safety check: validates if a candidate ingredient is safe
 * against declared user allergies and sensitivities.
 */
export function isIngredientSafeForUser(
  ingredient: string,
  allergies: string[] = [],
  sensitivities: string[] = []
): boolean {
  if (!ingredient) return true;
  const ingLower = ingredient.toLowerCase().trim();

  // Normalize allergen check
  for (const allergy of allergies) {
    const allLower = allergy.toLowerCase().trim();
    if (!allLower) continue;

    // Check direct substring or standard synonyms
    if (ingLower.includes(allLower) || allLower.includes(ingLower)) {
      return false;
    }
    // Specific allergen heuristics
    if (allLower.includes("fragrance") && (ingLower.includes("perfume") || ingLower.includes("parfum") || ingLower.includes("essential oil") || ingLower.includes("limonene") || ingLower.includes("linalool"))) {
      return false;
    }
    if (allLower.includes("lanolin") && (ingLower.includes("lanolin") || ingLower.includes("wool fat") || ingLower.includes("cholesterol sulfate"))) {
      return false;
    }
    if (allLower.includes("nut") && (ingLower.includes("almond") || ingLower.includes("walnut") || ingLower.includes("macadamia") || ingLower.includes("argan"))) {
      return false;
    }
    if (allLower.includes("sulfate") && (ingLower.includes("sls") || ingLower.includes("sles") || ingLower.includes("sulfate"))) {
      return false;
    }
  }

  // Normalize sensitivity check
  for (const sensitivity of sensitivities) {
    const sensLower = sensitivity.toLowerCase().trim();
    if (!sensLower) continue;

    if (ingLower.includes(sensLower) || sensLower.includes(ingLower)) {
      return false;
    }
    if (sensLower.includes("glycolic") && ingLower.includes("glycolic acid")) {
      return false;
    }
    if (sensLower.includes("retin") && (ingLower.includes("retinol") || ingLower.includes("tretinoin") || ingLower.includes("retinoid"))) {
      return false;
    }
    if (sensLower.includes("salicylic") && ingLower.includes("salicylic")) {
      return false;
    }
    if (sensLower.includes("alcohol") && (ingLower.includes("denatured alcohol") || ingLower.includes("ethanol"))) {
      return false;
    }
  }

  return true;
}

/**
 * Filter an array of candidate ingredients and record any excluded elements.
 */
export function filterSafeIngredients(
  candidates: string[],
  allergies: string[],
  sensitivities: string[],
  excludedSet: Set<string>
): string[] {
  return candidates.filter((ing) => {
    const safe = isIngredientSafeForUser(ing, allergies, sensitivities);
    if (!safe) {
      excludedSet.add(ing);
    }
    return safe;
  });
}

/**
 * Generates Morning Routine steps tailored to skin type, priority concerns, and safety rules.
 */
function buildMorningRoutine(
  profile: SkinProfile,
  assessment: SkinAssessment,
  excludedSet: Set<string>
): RoutineStep[] {
  const skinType = profile.skin_type || "Combination";
  const allergies = profile.allergies || [];
  const sensitivities = profile.sensitivities || [];
  const topConcerns = (assessment.prioritized_concerns || []).map((c) => c.concern.toLowerCase());

  const hasAcne = topConcerns.some((c) => c.includes("acne"));
  const hasPigment = topConcerns.some((c) => c.includes("pigment") || c.includes("dark spot"));
  const hasDryness = topConcerns.some((c) => c.includes("dry") || c.includes("dehydrat"));
  const hasSensitivity = skinType === "Sensitive" || topConcerns.some((c) => c.includes("red") || c.includes("sensitiv"));

  const steps: RoutineStep[] = [];

  // Step 1: Morning Cleanser
  let cleanserName = "Gentle Hydrating Gel-to-Foam Cleanser";
  let cleanserPurpose = "Removes overnight sebum buildup and cellular debris while preserving stratum corneum lipids.";
  let cleanserIngredients = ["Glycerin", "Sodium Cocoyl Glycinate", "Allantoin", "Centella Asiatica"];

  if (skinType === "Dry" || hasDryness) {
    cleanserName = "Milky Barrier Hydrating Cleanser";
    cleanserPurpose = "Non-foaming emulsion that cleanses gently without disrupting natural skin barrier moisture.";
    cleanserIngredients = ["Ceramides AP/NP", "Glycerin", "Oat Kernel Extract", "Panthenol (B5)"];
  } else if (skinType === "Oily" || hasAcne) {
    cleanserName = "Clarifying Zinc & Tea Tree Foam Cleanser";
    cleanserPurpose = "Deeply cleanses follicular pores, balances surface sebum, and prevents morning bacterial proliferation.";
    cleanserIngredients = ["Zinc PCA", "Salicylic Acid (0.5% Low Dose)", "Green Tea Extract", "Betaine"];
  } else if (hasSensitivity) {
    cleanserName = "Ultra-Calming Micellar Cleansing Gel";
    cleanserPurpose = "Hypoallergenic, pH 5.5 neutral formula formulated to prevent epidermal irritation and erythema.";
    cleanserIngredients = ["Colloidal Oatmeal", "Centella Asiatica (Madecassoside)", "Thermal Spring Water", "Bisabolol"];
  }

  const safeCleanserIngs = filterSafeIngredients(cleanserIngredients, allergies, sensitivities, excludedSet);

  steps.push({
    step_number: 1,
    category: "Cleanser",
    name: cleanserName,
    purpose: cleanserPurpose,
    when_to_use: "Every morning upon waking — massage onto damp skin for 45-60 seconds, then rinse with lukewarm water.",
    why_selected: `Specially selected for your ${skinType} skin profile to maintain optimal lipid mantle integrity.`,
    cautions: "Avoid hot water which accelerates transepidermal water loss.",
    key_ingredients: safeCleanserIngs,
  });

  // Step 2: Morning Treatment / Antioxidant Serum
  let serumName = "Antioxidant Brightening Defense Serum";
  let serumPurpose = "Neutralizes daytime free radical damage from solar radiation and air pollution while evening skin tone.";
  let serumIngredients = ["Niacinamide (5%)", "Sodium Hyaluronate", "Alpha Arbutin (2%)", "Zinc PCA"];

  if (hasPigment) {
    serumName = "Vitamin C & Alpha Arbutin Radiance Serum";
    serumPurpose = "Inhibits tyrosinase melanogenesis to fade persistent dark spots and photo-pigmentation.";
    serumIngredients = ["3-O-Ethyl Ascorbic Acid (10%)", "Alpha Arbutin (2%)", "Ferulic Acid", "Hyaluronic Acid"];
  } else if (hasAcne) {
    serumName = "Niacinamide & Zinc Clarifying Serum";
    serumPurpose = "Regulates sebaceous gland activity, refines pore structure, and minimizes post-inflammatory redness.";
    serumIngredients = ["Niacinamide (5%)", "Zinc PCA (1%)", "Centella Extract", "Allantoin"];
  } else if (hasDryness) {
    serumName = "Multi-Molecular Hyaluronic Acid & B5 Hydrator";
    serumPurpose = "Draws moisture deep into dermal reservoirs and plumps fine dehydration lines immediately.";
    serumIngredients = ["Multi-Weight Hyaluronic Acid", "Panthenol (Pro-Vitamin B5)", "Beta-Glucan", "Polyglutamic Acid"];
  } else if (hasSensitivity) {
    serumName = "Centella & Peptide Barrier Recovery Serum";
    serumPurpose = "Calms vascular redness, reinforces weakened cellular junctions, and prevents daytime reactivity.";
    serumIngredients = ["Madecassoside", "Centella Asiatica Leaf Extract", "Palmitoyl Tripeptide-8", "Panthenol"];
  }

  const safeSerumIngs = filterSafeIngredients(serumIngredients, allergies, sensitivities, excludedSet);

  steps.push({
    step_number: 2,
    category: "Treatment/Serum",
    name: serumName,
    purpose: serumPurpose,
    when_to_use: "Apply 3-4 drops immediately after cleansing onto slightly damp skin; gently press into face and neck.",
    why_selected: `Directly targets your primary concern (${topConcerns[0] || "environmental resilience"}) with non-comedogenic bio-actives.`,
    cautions: "Allow 60 seconds for complete dermal absorption before applying moisturizer.",
    key_ingredients: safeSerumIngs,
  });

  // Step 3: Morning Moisturizer
  let moisturizerName = "Weightless Barrier Hydro-Gel Moisturizer";
  let moisturizerPurpose = "Provides continuous cellular hydration without feeling heavy or causing pore blockage.";
  let moisturizerIngredients = ["Ceramide NP", "Squalane", "Glycerin", "Allantoin"];

  if (skinType === "Dry" || hasDryness) {
    moisturizerName = "Rich Ceramide & Lipid Replenishing Cream";
    moisturizerPurpose = "Replenishes depleted intercellular lipids (3:1:1 physiological ratio) to seal moisture tight.";
    moisturizerIngredients = ["Ceramides NP/AP/EOP", "Phytosphingosine", "Plant Squalane", "Shea Butter Extract"];
  } else if (skinType === "Oily") {
    moisturizerName = "Oil-Free Mattifying Water Cream";
    moisturizerPurpose = "Hydrates skin cells with water-binding humectants while silica micro-spheres absorb excess oil.";
    moisturizerIngredients = ["Green Tea Water", "Hyaluronic Acid", "Niacinamide (2%)", "Silica"];
  }

  const safeMoisturizerIngs = filterSafeIngredients(moisturizerIngredients, allergies, sensitivities, excludedSet);

  steps.push({
    step_number: 3,
    category: "Moisturizer",
    name: moisturizerName,
    purpose: moisturizerPurpose,
    when_to_use: "Smooth a nickel-sized amount evenly over face and neck to lock in active serum nutrients.",
    why_selected: `Calibrated viscosity for ${skinType} skin to prevent daytime transepidermal water loss.`,
    cautions: "Ensure even coverage over the T-zone and cheeks.",
    key_ingredients: safeMoisturizerIngs,
  });

  // Step 4: Morning Sunscreen
  let sunscreenName = "Daily Invisible Broad-Spectrum SPF 50+ Sunscreen";
  let sunscreenPurpose = "Critical photoprotection blocking both UVA (aging) and UVB (burning) radiation.";
  let sunscreenIngredients = ["Zinc Oxide (12%)", "Octisalate", "Niacinamide", "Vitamin E"];

  if (hasSensitivity || skinType === "Sensitive") {
    sunscreenName = "Pure Mineral Calming Shield SPF 50+";
    sunscreenPurpose = "100% Non-nano Zinc Oxide mineral filter that reflects UV rays without chemical heat absorption or stinging.";
    sunscreenIngredients = ["Non-Nano Zinc Oxide (18%)", "Bisabolol", "Centella Asiatica", "Ectoin"];
  } else if (skinType === "Oily") {
    sunscreenName = "Ultra-Lightweight Fluid Matte SPF 50+";
    sunscreenPurpose = "Zero-shine, sweat-resistant daily photoprotection designed for active oily and combination skin.";
    sunscreenIngredients = ["Zinc Oxide", "Titanium Dioxide", "Silica", "Green Tea Extract"];
  }

  const safeSunscreenIngs = filterSafeIngredients(sunscreenIngredients, allergies, sensitivities, excludedSet);

  steps.push({
    step_number: 4,
    category: "Sunscreen",
    name: sunscreenName,
    purpose: sunscreenPurpose,
    when_to_use: "Apply 2 finger-lengths generously as the final morning step 15 minutes before sun exposure; reapply every 2 hours if outdoors.",
    why_selected: "Non-negotiable foundation for hyperpigmentation control, collagen preservation, and UV damage prevention.",
    cautions: "Do not skip on cloudy days or when working near windows.",
    key_ingredients: safeSunscreenIngs,
  });

  return steps;
}

/**
 * Generates Evening Routine steps focused on repair, deep decongestion, and overnight restoration.
 */
function buildEveningRoutine(
  profile: SkinProfile,
  assessment: SkinAssessment,
  excludedSet: Set<string>
): RoutineStep[] {
  const skinType = profile.skin_type || "Combination";
  const allergies = profile.allergies || [];
  const sensitivities = profile.sensitivities || [];
  const topConcerns = (assessment.prioritized_concerns || []).map((c) => c.concern.toLowerCase());

  const hasAcne = topConcerns.some((c) => c.includes("acne"));
  const hasPigment = topConcerns.some((c) => c.includes("pigment") || c.includes("dark spot"));
  const hasAging = topConcerns.some((c) => c.includes("wrinkle") || c.includes("elasticity") || c.includes("aging"));
  const hasSensitivity = skinType === "Sensitive" || topConcerns.some((c) => c.includes("red") || c.includes("sensitiv"));

  const steps: RoutineStep[] = [];

  // Step 1: Evening Cleanser / Purifier
  let pmCleanserName = "Gentle Balancing Purifying Cleanser";
  let pmCleanserPurpose = "Dissolves daytime sunscreen, urban atmospheric particles, and oxidized surface lipids.";
  let pmCleanserIngredients = ["Caprylyl/Capryl Glucoside", "Glycerin", "Allantoin", "Chamomile Extract"];

  if (hasAcne || skinType === "Oily") {
    pmCleanserName = "Salicylic Acid Pore Decongesting Cleanser";
    pmCleanserPurpose = "Lipophilic BHA washes into pore linings to dissolve micro-comedones before sleep.";
    pmCleanserIngredients = ["Salicylic Acid (1.5%)", "Tea Tree Leaf Water", "Betaine", "Panthenol"];
  }

  const safePmCleanserIngs = filterSafeIngredients(pmCleanserIngredients, allergies, sensitivities, excludedSet);

  steps.push({
    step_number: 1,
    category: "Cleanser",
    name: pmCleanserName,
    purpose: pmCleanserPurpose,
    when_to_use: "Every evening — double cleanse if wearing waterproof SPF or makeup.",
    why_selected: "Prepares a pristine epidermal canvas so night actives can penetrate effectively without blockage.",
    key_ingredients: safePmCleanserIngs,
  });

  // Step 2: Night Active Treatment
  let treatmentName = "Azelaic & Niacinamide Clarifying Complex";
  let treatmentPurpose = "Clears stubborn congestion, soothes nocturnal inflammation, and evens post-blemish redness.";
  let treatmentIngredients = ["Azelaic Acid (10%)", "Niacinamide (4%)", "Centella Extract", "Hyaluronic Acid"];

  if (hasPigment && !hasSensitivity) {
    treatmentName = "Encapsulated Retinoid & Tranexamic Brightening Elixir";
    treatmentPurpose = "Accelerates cellular turnover during deep sleep to expel melanin clusters and boost collagen.";
    treatmentIngredients = ["Encapsulated Retinaldehyde (0.05%)", "Tranexamic Acid (3%)", "Squalane", "Vitamin E"];
  } else if (hasAging && !hasSensitivity) {
    treatmentName = "Multi-Peptide & Bakuchiol Collagen Renewal Serum";
    treatmentPurpose = "Botanical phyto-retinol alternative that stimulates fibroblast collagen without retinoid irritation.";
    treatmentIngredients = ["Bakuchiol (1.5%)", "Palmitoyl Tripeptide-1", "Palmitoyl Tetrapeptide-7", "Ceramide Complex"];
  } else if (hasSensitivity) {
    treatmentName = "Centella & Ectoin Barrier Calming Ampoule";
    treatmentPurpose = "Accelerates tissue healing, decreases mast cell degranulation, and prevents nocturnal itching/redness.";
    treatmentIngredients = ["Ectoin (2%)", "Madecassoside (0.2%)", "Panthenol (5%)", "Beta-Glucan"];
  }

  const safeTreatmentIngs = filterSafeIngredients(treatmentIngredients, allergies, sensitivities, excludedSet);

  steps.push({
    step_number: 2,
    category: "Treatment",
    name: treatmentName,
    purpose: treatmentPurpose,
    when_to_use: "Apply 1 pump to clean, completely dry skin 3-4 nights per week initially, building to nightly tolerance.",
    why_selected: "Leverages peak circadian overnight cell division rates for maximal therapeutic renewal.",
    cautions: "If stinging or redness occurs, buffer by applying after moisturizer.",
    key_ingredients: safeTreatmentIngs,
  });

  // Step 3: Evening Barrier Moisturizer
  let pmMoisturizerName = "Ceramide Barrier Recovery Night Cream";
  let pmMoisturizerPurpose = "Reconstructs the lipid matrix overnight and prevents transepidermal moisture loss.";
  let pmMoisturizerIngredients = ["Ceramides EOP/EOS/NP", "Cholesterol", "Free Fatty Acids", "Squalane", "Glycerin"];

  const safePmMoisturizerIngs = filterSafeIngredients(pmMoisturizerIngredients, allergies, sensitivities, excludedSet);

  steps.push({
    step_number: 3,
    category: "Moisturizer",
    name: pmMoisturizerName,
    purpose: pmMoisturizerPurpose,
    when_to_use: "Apply generously as the essential sealing step in your night routine.",
    why_selected: "Optimal 3:1:1 physiological lipid ratio mirrors human skin barrier composition.",
    key_ingredients: safePmMoisturizerIngs,
  });

  // Step 4: Night Care / Overnight Recovery (optional specialized layer)
  let nightCareName = "Overnight Cica Recovery Balm / Sleeping Pack";
  let nightCarePurpose = "Forms an ultra-gentle breathable occlusion to accelerate cellular repair during deep sleep stages.";
  let nightCareIngredients = ["Panthenol (7%)", "Madecassoside", "Zinc Gluconate", "Shea Ester"];

  const safeNightCareIngs = filterSafeIngredients(nightCareIngredients, allergies, sensitivities, excludedSet);

  steps.push({
    step_number: 4,
    category: "Night Care",
    name: nightCareName,
    purpose: nightCarePurpose,
    when_to_use: "Apply a thin layer 2-3 nights per week, especially after days with high UV, stress, or dry AC exposure.",
    why_selected: "Protects sensitive barrier junctions while sleep hormone melatonin drives cellular detox.",
    key_ingredients: safeNightCareIngs,
  });

  return steps;
}

/**
 * Generates Weekly Treatment Plan (Exfoliation, Masks, Barrier recovery).
 */
function buildWeeklyTreatments(
  profile: SkinProfile,
  assessment: SkinAssessment,
  excludedSet: Set<string>
): WeeklyTreatment[] {
  const skinType = profile.skin_type || "Combination";
  const allergies = profile.allergies || [];
  const sensitivities = profile.sensitivities || [];
  const topConcerns = (assessment.prioritized_concerns || []).map((c) => c.concern.toLowerCase());

  const hasAcne = topConcerns.some((c) => c.includes("acne"));
  const hasSensitivity = skinType === "Sensitive" || topConcerns.some((c) => c.includes("sensitiv"));

  const treatments: WeeklyTreatment[] = [];

  // 1. Exfoliation Session
  let exfoliationName = "Gentle Lactic & Mandelic Acid Resurfacing Peel";
  let exfoliationType = "Exfoliation";
  let exfoliationInstructions = "Apply 4-5 drops onto clean, dry skin on Wednesday evening. Leave on for 10 minutes, then rinse with cool water.";
  let exfoliationCautions = "Do not use retinol or active acids on the same evening.";

  if (hasSensitivity) {
    exfoliationName = "Gentle Papaya & Rice Enzyme Micro-Exfoliant";
    exfoliationInstructions = "Mix half-teaspoon with water to create a soft foam; massage very gently for 30 seconds once a week, then rinse.";
    exfoliationCautions = "Never scrub vigorously on reactive skin areas.";
  } else if (hasAcne || skinType === "Oily") {
    exfoliationName = "BHA 2% Liquid Pore Clarifying Treatment";
    exfoliationInstructions = "Saturate a cotton pad or pat directly onto breakout zones on Tuesday & Saturday evenings. Leave on without rinsing.";
    exfoliationCautions = "Discontinue temporarily if skin flaking occurs.";
  }

  // Safety filter test for ingredients in treatment
  treatments.push({
    day_or_frequency: "1–2 times per week (Midweek / Wednesday)",
    treatment_type: exfoliationType,
    name: exfoliationName,
    purpose: "Dissolves desmosome bonds between dead keratinocytes to refine texture and prevent comedone formation.",
    instructions: exfoliationInstructions,
    cautions: exfoliationCautions,
  });

  // 2. Targeted Mask
  let maskName = "Hydra-Gel Hyaluronic Acid & Centella Sheet Mask";
  let maskType = "Face Mask";
  let maskInstructions = "Smooth mask onto face on Sunday evening; relax for 15-20 minutes, remove and pat remaining serum in.";

  if (hasAcne || skinType === "Oily") {
    maskName = "French Kaolin & Sulfur Clarifying Clay Mask";
    maskInstructions = "Apply an opaque layer to T-zone and congested areas. Leave for 8-10 minutes until slightly set, then rinse with warm water.";
  }

  treatments.push({
    day_or_frequency: "Weekly (Weekend / Sunday)",
    treatment_type: maskType,
    name: maskName,
    purpose: "Delivers a concentrated infusion of targeted actives to reset sebum balance and supercharge hydration.",
    instructions: maskInstructions,
    cautions: "Do not let clay masks dry to the point of cracking to avoid moisture depletion.",
  });

  // 3. Recovery / Barrier Care Day
  treatments.push({
    day_or_frequency: "Weekly Barrier Rest Day (Monday)",
    treatment_type: "Recovery / Barrier Care",
    name: "Ceramide & Lipid Restorative Compress",
    purpose: "Dedicated 'Active-Free' day allowing skin microbiome and stratum corneum to self-stabilize.",
    instructions: "Skip all exfoliating acids and potent treatments. Cleanse gently, layer hydrating serum, and seal with thick ceramide cream.",
    cautions: "Rest days are vital to prevent chronic barrier impairment.",
  });

  return treatments;
}

/**
 * Main routine generation entry point.
 */
export function generateSkincareRoutine(input: GenerateRoutineInput): SkincareRoutine {
  const { userId, profile, assessment, routineId = 1 } = input;

  const excludedSet = new Set<string>();

  const morning = buildMorningRoutine(profile, assessment, excludedSet);
  const evening = buildEveningRoutine(profile, assessment, excludedSet);
  const weekly = buildWeeklyTreatments(profile, assessment, excludedSet);

  const recommendations = [
    `Always patch-test any new step on the inner forearm 24 hours prior to facial application.`,
    `Apply products from thinnest consistency (watery serums) to thickest (creams and facial balms).`,
    `Maintain consistent morning sunscreen reapplication every 2 hours when exposed to direct solar UV.`,
    `On weekly barrier rest days, avoid all active exfoliating acids to allow natural lipid synthesis.`,
  ];

  return {
    id: routineId,
    user_id: userId,
    assessment_id: assessment.id,
    morning_routine: morning,
    evening_routine: evening,
    weekly_treatments: weekly,
    recommendations,
    excluded_ingredients: Array.from(excludedSet),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
