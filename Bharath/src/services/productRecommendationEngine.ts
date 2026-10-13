import {
  Product,
  ProductRecommendation,
  SkinProfile,
  SkinAssessment,
} from "../types";
import { CLINICAL_PRODUCT_CATALOG } from "./productData";
import { checkUserContraindication, normalizeName } from "./ingredientIntelligenceService";

export interface RecommendationEngineInput {
  profile: SkinProfile | null;
  assessment: SkinAssessment | null;
  catalog?: Product[];
}

/**
 * Computes personalized product recommendations with clinical match score (0-100),
 * safety guarantee checks, and target concern justifications.
 */
export function generatePersonalizedRecommendations(
  input: RecommendationEngineInput
): ProductRecommendation[] {
  const { profile, assessment } = input;
  const catalog = input.catalog || CLINICAL_PRODUCT_CATALOG;

  const skinType = profile?.skin_type || "Combination";
  const concerns = profile?.skin_concerns || [];
  const allergies = profile?.allergies || [];
  const sensitivities = profile?.sensitivities || [];

  const predictedActive =
    assessment?.prediction_meta?.predicted_primary_active || "Niacinamide";
  const barrierState =
    assessment?.prediction_meta?.predicted_barrier_state ||
    (assessment?.condition_score && assessment.condition_score < 70
      ? "Compromised"
      : "Resilient");

  const recommendations: ProductRecommendation[] = catalog.map((product) => {
    let score = 50; // Base score
    const matchReasons: string[] = [];
    const concernsAddressed: string[] = [];
    const flaggedAllergens: string[] = [];
    const flaggedSensitivities: string[] = [];

    // 1. HARD SAFETY CHECK: Allergies & Sensitivities
    for (const ing of product.inci_ingredients) {
      const allergenHit = checkUserContraindication(ing, allergies);
      if (allergenHit && !flaggedAllergens.includes(allergenHit)) {
        flaggedAllergens.push(allergenHit);
      }

      const sensHit = checkUserContraindication(ing, sensitivities);
      if (sensHit && !flaggedSensitivities.includes(sensHit)) {
        flaggedSensitivities.push(sensHit);
      }
    }

    const hasAllergen = flaggedAllergens.length > 0;
    const hasSensitivity = flaggedSensitivities.length > 0;

    if (hasAllergen) {
      // Automatic penalty and safety quarantine
      score = 0;
      matchReasons.push(`Contraindicated: Contains flagged allergen (${flaggedAllergens.join(", ")})`);
    }

    // 2. SKIN TYPE COMPATIBILITY (+25 pts)
    const typeMatches =
      product.skin_types.includes("All") ||
      product.skin_types.includes(skinType);

    if (typeMatches) {
      score += 20;
      matchReasons.push(`Physiologically compatible with ${skinType} skin`);
    } else {
      score -= 15;
    }

    // 3. CONCERNS MATCH (+30 pts)
    const matchingConcerns = product.target_concerns.filter((c) =>
      concerns.some(
        (userConcern) =>
          normalizeName(userConcern).includes(normalizeName(c)) ||
          normalizeName(c).includes(normalizeName(userConcern))
      )
    );

    if (matchingConcerns.length > 0) {
      const boost = Math.min(25, matchingConcerns.length * 12);
      score += boost;
      concernsAddressed.push(...matchingConcerns);
      matchReasons.push(`Targets your key concerns: ${matchingConcerns.join(", ")}`);
    }

    // 4. CLINICAL BARRIER INTEGRITY ALIGNMENT (+15 pts)
    if (barrierState.toLowerCase().includes("compromised") || barrierState.toLowerCase().includes("fragile")) {
      const isBarrierRestorative =
        product.key_actives.some((a) =>
          ["Ceramide NP", "Colloidal Oatmeal", "Centella Asiatica Leaf Extract", "Panthenol", "Squalane"].includes(a)
        ) ||
        product.category === "Moisturizer" ||
        product.name.toLowerCase().includes("barrier") ||
        product.name.toLowerCase().includes("restore");

      const isAggressiveExfoliant =
        product.key_actives.some((a) => ["Glycolic Acid", "Retinol", "Ascorbic Acid"].includes(a)) &&
        product.category === "Treatment & Exfoliant";

      if (isBarrierRestorative) {
        score += 15;
        matchReasons.push("Fortifies compromised lipid barrier with biomimetic ceramides & soothing agents");
      }
      if (isAggressiveExfoliant) {
        score -= 25;
        matchReasons.push("Caution: Strong active withheld until barrier stabilizes");
      }
    } else {
      // Resilient barrier: rewards effective active cellular turnover
      if (product.key_actives.some((a) => ["Retinol", "Salicylic Acid", "Ascorbic Acid"].includes(a))) {
        score += 10;
        matchReasons.push("Active treatment aligns with healthy cellular turnover baseline");
      }
    }

    // 5. ML PREDICTED ACTIVE BOOST (+15 pts)
    const containsPredictedActive = product.key_actives.some(
      (a) =>
        normalizeName(a).includes(normalizeName(predictedActive)) ||
        normalizeName(predictedActive).includes(normalizeName(a))
    );

    if (containsPredictedActive) {
      score += 15;
      matchReasons.push(`Contains ML Model's recommended primary active: ${predictedActive}`);
    }

    // 6. SENSITIVITY PENALTY
    if (hasSensitivity && !hasAllergen) {
      score = Math.max(25, score - 30);
      matchReasons.push(`Contains potential sensitivity trigger: ${flaggedSensitivities.join(", ")}`);
    }

    // Normalize final score between 0 and 99
    if (hasAllergen) {
      score = 0;
    } else {
      score = Math.min(99, Math.max(35, Math.round(score)));
    }

    // Routine fit mapping
    let routineFit = "Flexible AM / PM Step";
    if (product.category === "Cleanser") {
      routineFit = product.routine_slot_default.includes("AM") ? "AM Step 1 (Cleanser)" : "PM Step 1 (Cleanser)";
    } else if (product.category === "Sunscreen") {
      routineFit = "AM Step 4 (Photoprotection Shield)";
    } else if (product.category === "Serum") {
      routineFit = product.key_actives.some((a) => a.includes("Retinol") || a.includes("Azelaic"))
        ? "PM Step 2 (Active Target Serum)"
        : "AM Step 2 (Antioxidant / Hydration Serum)";
    } else if (product.category === "Moisturizer") {
      routineFit = "AM/PM Step 3 (Lipid Moisture Lock)";
    } else if (product.category === "Treatment & Exfoliant") {
      routineFit = "Weekly PM Treatment (1-2x / week)";
    }

    let barrierCompatibility = "Neutral / Balancing";
    if (product.key_actives.some((a) => a.includes("Ceramide") || a.includes("Centella") || a.includes("Oat"))) {
      barrierCompatibility = "Barrier Fortifying & Restorative";
    } else if (product.key_actives.some((a) => a.includes("Glycolic") || a.includes("Salicylic") || a.includes("Retinol"))) {
      barrierCompatibility = "Cellular Resurfacing (Requires Resilient Barrier)";
    }

    return {
      ...product,
      match_score: score,
      match_reasons: matchReasons,
      target_concerns_addressed: Array.from(new Set(concernsAddressed)),
      allergen_warning: hasAllergen,
      flagged_allergens: flaggedAllergens,
      sensitivity_warning: hasSensitivity,
      flagged_sensitivities: flaggedSensitivities,
      routine_fit: routineFit,
      barrier_compatibility: barrierCompatibility,
    };
  });

  // Sort by match score descending (highest match first, 0% allergen matches last)
  return recommendations.sort((a, b) => b.match_score - a.match_score);
}
