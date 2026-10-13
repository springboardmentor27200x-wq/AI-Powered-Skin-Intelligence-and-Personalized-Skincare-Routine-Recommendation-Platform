import {
  SkinProfile,
  LifestyleRecord,
  SleepRecord,
  SkinAssessment,
  PrioritizedConcern,
  RiskFactor,
} from "../types";
import { computeSkinHealthScore } from "./scoringService";

export interface GenerateAssessmentInput {
  userId: number;
  profile: SkinProfile;
  lifestyleRecords: LifestyleRecord[];
  sleepRecords: SleepRecord[];
  assessmentId?: number;
}

/**
 * Prioritizes skin concerns based on skin type, age, environmental exposure, lifestyle, and sleep.
 */
export function analyzeAndPrioritizeConcerns(
  profile: SkinProfile,
  lifestyleRecords: LifestyleRecord[],
  sleepRecords: SleepRecord[]
): PrioritizedConcern[] {
  const declaredConcerns = profile.skin_concerns || [];
  const skinType = profile.skin_type || "Normal";
  const ageGroup = profile.age_group || "25-34";

  const latestLifestyle = lifestyleRecords[0];
  const habitsStr = latestLifestyle
    ? (Array.isArray(latestLifestyle.lifestyle_habits)
        ? latestLifestyle.lifestyle_habits.join(" ")
        : String(latestLifestyle.lifestyle_habits)
      ).toLowerCase()
    : "";
  const envStr = latestLifestyle ? String(latestLifestyle.environmental_exposure || "").toLowerCase() : "";
  const waterIntake = latestLifestyle ? Number(latestLifestyle.water_intake) : 2.0;

  const latestSleep = sleepRecords[0];
  const sleepHours = latestSleep ? Number(latestSleep.sleep_hours) : 7.5;
  const sleepQuality = latestSleep ? String(latestSleep.sleep_quality).toLowerCase() : "good";

  const prioritized: PrioritizedConcern[] = [];
  const processedSet = new Set<string>();

  // Helper to add or upgrade a concern
  const addConcern = (
    concern: string,
    priority: "High" | "Medium" | "Low",
    severity: "Mild" | "Moderate" | "Severe",
    factors: string[],
    recommendation: string
  ) => {
    if (processedSet.has(concern)) return;
    processedSet.add(concern);
    prioritized.push({
      concern,
      priority,
      severity,
      contributing_factors: factors,
      recommendation,
    });
  };

  // 1. Acne / Blemishes Analysis
  const hasAcneDeclared = declaredConcerns.some((c) => c.toLowerCase().includes("acne"));
  if (hasAcneDeclared || skinType === "Oily") {
    const factors: string[] = [];
    if (skinType === "Oily" || skinType === "Combination") factors.push(`${skinType} sebum profile causing follicular congestion`);
    if (habitsStr.includes("stress")) factors.push("Elevated cortisol from chronic stress triggering lipid overproduction");
    if (sleepHours < 6.5 || sleepQuality === "poor") factors.push("Compromised nocturnal barrier repair and inflammatory response");
    if (habitsStr.includes("sugar") || habitsStr.includes("dairy")) factors.push("High glycemic diet promoting sebaceous inflammation");
    if (factors.length === 0) factors.push("Genetic predisposition and localized pore congestion");

    const isHigh = hasAcneDeclared && (skinType === "Oily" || habitsStr.includes("stress") || factors.length >= 2);
    addConcern(
      "Acne & Pore Congestion",
      isHigh ? "High" : "Medium",
      isHigh ? "Severe" : "Moderate",
      factors,
      "Incorporate Salicylic Acid (BHA 2%) and Niacinamide (4-5%) to decongest pores and regulate sebum without stripping lipids."
    );
  }

  // 2. Hyperpigmentation & Dark Spots Analysis
  const hasPigmentationDeclared = declaredConcerns.some(
    (c) => c.toLowerCase().includes("pigment") || c.toLowerCase().includes("dark spot")
  );
  if (hasPigmentationDeclared || envStr.includes("uv") || envStr.includes("sun")) {
    const factors: string[] = [];
    if (hasPigmentationDeclared) factors.push("Active post-inflammatory or photo-induced melanin deposition");
    if (envStr.includes("uv") || envStr.includes("sun") || envStr.includes("beach")) factors.push("Elevated environmental UV index accelerating tyrosinase enzyme activity");
    if (!habitsStr.includes("spf") && !habitsStr.includes("sunscreen")) factors.push("Insufficient daily broad-spectrum photoprotection");
    if (ageGroup === "35-44" || ageGroup === "45-54" || ageGroup === "55+") factors.push("Slower epidermal cell turnover prolonging hyperpigmented clusters");
    if (factors.length === 0) factors.push("Prior inflammatory breakout marks and sun exposure");

    const isHigh = hasPigmentationDeclared && (envStr.includes("uv") || factors.length >= 2);
    addConcern(
      "Hyperpigmentation & Dark Spots",
      isHigh ? "High" : "Medium",
      isHigh ? "Moderate" : "Mild",
      factors,
      "Deploy potent tyrosinase inhibitors (Alpha Arbutin, Vitamin C, Azelaic Acid) paired with mandatory Daily Broad-Spectrum SPF 50."
    );
  }

  // 3. Dryness / Dehydration Analysis
  const hasDrynessDeclared = declaredConcerns.some(
    (c) => c.toLowerCase().includes("dry") || c.toLowerCase().includes("dehydrat")
  );
  if (hasDrynessDeclared || skinType === "Dry" || waterIntake < 2.0) {
    const factors: string[] = [];
    if (skinType === "Dry") factors.push("Inherent lipid-depleted stratum corneum barrier");
    if (waterIntake < 2.0) factors.push(`Low daily systemic hydration (${waterIntake}L / day) reducing tissue turgor`);
    if (envStr.includes("ac") || envStr.includes("dry") || envStr.includes("air-conditioned")) factors.push("Artificial air-conditioning lowering ambient humidity and stripping moisture");
    if (sleepHours < 6.5) factors.push("Elevated transepidermal water loss (TEWL) during short sleep cycles");
    if (factors.length === 0) factors.push("Seasonal humidity drop and epidermal barrier thinning");

    const isHigh = (skinType === "Dry" || hasDrynessDeclared) && waterIntake < 2.0;
    addConcern(
      "Dryness & Dehydration",
      isHigh ? "High" : "Medium",
      isHigh ? "Moderate" : "Mild",
      factors,
      "Layer multi-molecular Hyaluronic Acid under rich Ceramide NP/AP/EOP formulations to lock in hydration and repair intercellular cement."
    );
  }

  // 4. Uneven Texture / Dullness Analysis
  const hasTextureDeclared = declaredConcerns.some(
    (c) => c.toLowerCase().includes("texture") || c.toLowerCase().includes("dull")
  );
  if (hasTextureDeclared || envStr.includes("pollution") || habitsStr.includes("smoking")) {
    const factors: string[] = [];
    if (hasTextureDeclared) factors.push("Accumulation of desquamated keratinocytes on skin surface");
    if (envStr.includes("pollution") || envStr.includes("urban")) factors.push("Micro-particulate urban air pollution inducing oxidative dullness");
    if (habitsStr.includes("caffeine") || habitsStr.includes("screen")) factors.push("Blue light oxidative stress and microcirculatory vasoconstriction");
    if (factors.length === 0) factors.push("Irregular cellular renewal rate");

    addConcern(
      "Uneven Skin Texture & Dullness",
      "Medium",
      "Moderate",
      factors,
      "Utilize gentle enzymatic or polyhydroxy acid (PHA) exfoliation 2x/week with antioxidant-rich serums to restore optical clarity."
    );
  }

  // 5. Fine Lines & Loss of Elasticity
  const hasAgingDeclared = declaredConcerns.some(
    (c) => c.toLowerCase().includes("wrinkle") || c.toLowerCase().includes("fine line") || c.toLowerCase().includes("aging")
  );
  if (hasAgingDeclared || ["35-44", "45-54", "55+"].includes(ageGroup)) {
    const factors: string[] = [];
    if (["35-44", "45-54", "55+"].includes(ageGroup)) factors.push(`Natural biological decrease in fibroblast collagen synthesis (${ageGroup})`);
    if (envStr.includes("uv") || envStr.includes("sun")) factors.push("Photo-aging matrix metalloproteinase activation from solar exposure");
    if (sleepHours < 7.0) factors.push("Decreased nocturnal growth hormone release during abbreviated deep sleep");
    if (factors.length === 0) factors.push("Repetitive micro-contractions and reduced dermal glycosaminoglycans");

    addConcern(
      "Fine Lines & Elasticity Loss",
      ["45-54", "55+"].includes(ageGroup) ? "High" : "Medium",
      "Moderate",
      factors,
      "Introduce Matrixyl 3000 / Copper Peptides in AM and encapsulated Retinaldehyde/Bakuchiol in PM to stimulate neocollagenesis."
    );
  }

  // 6. Redness & Sensitivity
  const hasRednessDeclared = declaredConcerns.some(
    (c) => c.toLowerCase().includes("red") || c.toLowerCase().includes("sensitiv") || c.toLowerCase().includes("rosacea")
  );
  if (hasRednessDeclared || skinType === "Sensitive" || (profile.sensitivities && profile.sensitivities.length > 0)) {
    const factors: string[] = [];
    if (skinType === "Sensitive") factors.push("Hyper-reactive cutaneous nerve fibers and weakened barrier threshold");
    if (profile.sensitivities && profile.sensitivities.length > 0) factors.push(`Known reactivity to: ${profile.sensitivities.join(", ")}`);
    if (profile.allergies && profile.allergies.length > 0) factors.push(`Immunological triggers: ${profile.allergies.join(", ")}`);
    if (envStr.includes("uv") || envStr.includes("pollution")) factors.push("Environmental flare triggers and oxidative barrier insults");
    if (factors.length === 0) factors.push("Transient vascular flushing and thin epidermal stratum");

    addConcern(
      "Redness & Cutaneous Sensitivity",
      skinType === "Sensitive" || hasRednessDeclared ? "High" : "Medium",
      "Moderate",
      factors,
      "Prioritize Centella Asiatica (Madecassoside), Panthenol (B5), and Colloidal Oat to downregulate cytokine inflammation."
    );
  }

  // Catch any other explicitly declared concerns
  declaredConcerns.forEach((concern) => {
    if (![...processedSet].some((p) => p.toLowerCase().includes(concern.toLowerCase()))) {
      addConcern(
        concern,
        "Medium",
        "Moderate",
        [`Directly reported by user profile during assessment`],
        `Targeted active balancing regimen calibrated for ${skinType} skin and ${concern.toLowerCase()}.`
      );
    }
  });

  // Sort: High priority first, then Medium, then Low
  const priorityOrder = { High: 3, Medium: 2, Low: 1 };
  prioritized.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

  return prioritized;
}

/**
 * Extracts and categorizes risk factors from lifestyle, sleep, environmental, and sensitivity metrics.
 */
export function identifyRiskFactors(
  profile: SkinProfile,
  lifestyleRecords: LifestyleRecord[],
  sleepRecords: SleepRecord[]
): RiskFactor[] {
  const risks: RiskFactor[] = [];

  const latestLifestyle = lifestyleRecords[0];
  const habitsStr = latestLifestyle
    ? (Array.isArray(latestLifestyle.lifestyle_habits)
        ? latestLifestyle.lifestyle_habits.join(" ")
        : String(latestLifestyle.lifestyle_habits)
      ).toLowerCase()
    : "";
  const envStr = latestLifestyle ? String(latestLifestyle.environmental_exposure || "").toLowerCase() : "";
  const waterIntake = latestLifestyle ? Number(latestLifestyle.water_intake) : 2.0;

  const latestSleep = sleepRecords[0];
  const sleepHours = latestSleep ? Number(latestSleep.sleep_hours) : 7.5;
  const sleepQuality = latestSleep ? String(latestSleep.sleep_quality).toLowerCase() : "good";

  // Hydration Risk
  if (waterIntake < 1.8) {
    risks.push({
      factor: `Sub-optimal Daily Water Intake (${waterIntake}L)`,
      impact: "Triggers transepidermal dehydration, reduces cellular nutrient delivery, and impairs barrier elasticity.",
      category: "Hydration",
      severity: waterIntake < 1.5 ? "High" : "Medium",
    });
  }

  // Environmental UV / Pollution
  if (envStr.includes("uv") || envStr.includes("sun")) {
    risks.push({
      factor: "High Solar UV Exposure",
      impact: "Accelerates photo-damage, upregulates melanin synthesis, and degrades dermal collagen fibers.",
      category: "Environment",
      severity: "High",
    });
  }
  if (envStr.includes("pollution") || envStr.includes("urban")) {
    risks.push({
      factor: "Urban Atmospheric Micro-Pollution",
      impact: "Particulate matter penetrates pore canals, generating free radicals and clogging pores.",
      category: "Environment",
      severity: "Medium",
    });
  }
  if (envStr.includes("air-conditioned") || envStr.includes("dry ac")) {
    risks.push({
      factor: "Dry Air-Conditioned Environment",
      impact: "Continuous dry air circulation leaches surface moisture from the stratum corneum.",
      category: "Environment",
      severity: "Low",
    });
  }

  // Sleep Risks
  if (sleepHours < 6.5) {
    risks.push({
      factor: `Short Sleep Duration (${sleepHours} hrs)`,
      impact: "Suppresses nocturnal epidermal cell turnover and increases inflammatory skin markers.",
      category: "Sleep",
      severity: sleepHours < 5.5 ? "High" : "Medium",
    });
  }
  if (sleepQuality === "poor" || sleepQuality === "fair") {
    risks.push({
      factor: `Restless / ${sleepQuality.toUpperCase()} Sleep Quality`,
      impact: "Elevates circulating cortisol, impairing natural wound healing and overnight collagen rebuilding.",
      category: "Sleep",
      severity: sleepQuality === "poor" ? "High" : "Medium",
    });
  }

  // Lifestyle Risks
  if (habitsStr.includes("stress")) {
    risks.push({
      factor: "Chronic Psychological Stress",
      impact: "Increases substance P and cortisol levels, triggering inflammatory breakout cycles.",
      category: "Lifestyle",
      severity: "High",
    });
  }
  if (habitsStr.includes("smoking") || habitsStr.includes("nicotine")) {
    risks.push({
      factor: "Nicotine / Smoke Exposure",
      impact: "Vasoconstriction restricts microvascular blood flow and destroys elastin synthesis.",
      category: "Lifestyle",
      severity: "High",
    });
  }
  if (habitsStr.includes("caffeine") || habitsStr.includes("screen")) {
    risks.push({
      factor: "High Stimulant & Late Screen Exposure",
      impact: "Increases oxidative strain and disrupts biological circadian rhythm of skin cells.",
      category: "Lifestyle",
      severity: "Low",
    });
  }

  // Allergies & Sensitivities
  if (profile.allergies && profile.allergies.length > 0) {
    risks.push({
      factor: `Declared Allergens: ${profile.allergies.join(", ")}`,
      impact: "Immediate potential for contact dermatitis or histaminic flare-ups if triggered.",
      category: "Sensitivity",
      severity: "High",
    });
  }
  if (profile.sensitivities && profile.sensitivities.length > 0) {
    risks.push({
      factor: `Known Sensitivities: ${profile.sensitivities.join(", ")}`,
      impact: "Risk of chemical barrier disruption and stinging sensations upon active application.",
      category: "Sensitivity",
      severity: "Medium",
    });
  }

  return risks;
}

/**
 * Creates the complete comprehensive Skin Assessment document.
 */
export function generateSkinAssessment(input: GenerateAssessmentInput): SkinAssessment {
  const { userId, profile, lifestyleRecords, sleepRecords, assessmentId = 1 } = input;

  const rawConcerns = profile.skin_concerns || [];
  const prioritizedConcerns = analyzeAndPrioritizeConcerns(profile, lifestyleRecords, sleepRecords);
  const riskFactors = identifyRiskFactors(profile, lifestyleRecords, sleepRecords);
  const scoreBreakdown = computeSkinHealthScore(profile, rawConcerns, lifestyleRecords, sleepRecords);

  const topConcernsStr = prioritizedConcerns
    .filter((c) => c.priority === "High" || c.priority === "Medium")
    .map((c) => c.concern)
    .slice(0, 3)
    .join(", ");

  const summary = `Comprehensive assessment for ${profile.skin_type || "Combination"} skin (${profile.age_group || "Adult"}). Primary focal areas identified: ${topConcernsStr || "General Barrier Maintenance"}. Your overall skin health index is ${scoreBreakdown.overall_score}/100 (${scoreBreakdown.score_category}). ${riskFactors.length} environmental & lifestyle risk factors are actively monitored to safeguard your skin barrier.`;

  return {
    id: assessmentId,
    user_id: userId,
    overall_score: scoreBreakdown.overall_score,
    condition_score: scoreBreakdown.condition_score,
    lifestyle_score: scoreBreakdown.lifestyle_score,
    sleep_score: scoreBreakdown.sleep_score,
    hydration_score: scoreBreakdown.hydration_score,
    routine_score: scoreBreakdown.routine_score,
    score_category: scoreBreakdown.score_category,
    score_explanation: scoreBreakdown.score_explanation,
    skin_type: profile.skin_type || "Combination",
    age_group: profile.age_group || "25-34",
    concerns: rawConcerns,
    prioritized_concerns: prioritizedConcerns,
    risk_factors: riskFactors,
    assessment_summary: summary,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
