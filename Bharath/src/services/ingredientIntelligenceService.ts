import {
  Ingredient,
  CustomAnalysisResult,
  CustomAnalysisIngredientItem,
  SkinProfile,
} from "../types";
import { CLINICAL_INGREDIENTS_DATABASE } from "./ingredientData";

/**
 * Normalizes an ingredient name for fuzzy lookup.
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Finds a matching ingredient record in the database using INCI, common names, or substring.
 */
export function findIngredientInDatabase(rawName: string): Ingredient | null {
  const clean = normalizeName(rawName);
  if (!clean || clean.length < 2) return null;

  // Direct exact match on name or inci
  const exact = CLINICAL_INGREDIENTS_DATABASE.find(
    (ing) =>
      normalizeName(ing.name) === clean ||
      normalizeName(ing.inci_name) === clean ||
      ing.common_names.some((cn) => normalizeName(cn) === clean)
  );
  if (exact) return exact;

  // Substring match
  const partial = CLINICAL_INGREDIENTS_DATABASE.find(
    (ing) =>
      clean.includes(normalizeName(ing.name)) ||
      normalizeName(ing.name).includes(clean) ||
      clean.includes(normalizeName(ing.inci_name)) ||
      normalizeName(ing.inci_name).includes(clean) ||
      ing.common_names.some((cn) => clean.includes(normalizeName(cn)) || normalizeName(cn).includes(clean))
  );

  return partial || null;
}

/**
 * Parses a raw ingredients list (e.g. copied from cosmetic packaging) into separated tokens.
 */
export function parseInciText(rawText: string): string[] {
  if (!rawText) return [];

  // Remove common prefix headings like "Ingredients:", "Inactive Ingredients:", "Active Ingredients:"
  let cleaned = rawText
    .replace(/^ingredients\s*[:\-]/i, "")
    .replace(/^active ingredients?\s*[:\-]/i, "")
    .replace(/^inactive ingredients?\s*[:\-]/i, "")
    .replace(/\[.*?\]/g, "")
    .trim();

  // Split on commas, semicolons, bullets, or newlines
  const rawParts = cleaned.split(/[,;\n\u2022\u00B7]/);

  const results: string[] = [];
  for (const part of rawParts) {
    const item = part.trim().replace(/^[-*•\s]+/, "").trim();
    if (item.length > 1) {
      results.push(item);
    }
  }

  return results;
}

/**
 * Checks if a candidate ingredient matches any item in a user's allergy or sensitivity list.
 */
export function checkUserContraindication(
  candidate: string,
  userList: string[]
): string | null {
  if (!userList || userList.length === 0) return null;
  const candidateNorm = normalizeName(candidate);

  for (const item of userList) {
    const itemNorm = normalizeName(item);
    if (!itemNorm) continue;

    if (
      candidateNorm.includes(itemNorm) ||
      itemNorm.includes(candidateNorm) ||
      (itemNorm.includes("fragrance") && (candidateNorm.includes("parfum") || candidateNorm.includes("fragrance") || candidateNorm.includes("linalool") || candidateNorm.includes("limonene"))) ||
      (itemNorm.includes("alcohol") && candidateNorm.includes("alcohol denat")) ||
      (itemNorm.includes("lanolin") && candidateNorm.includes("lanolin")) ||
      (itemNorm.includes("glycolic") && candidateNorm.includes("glycolic")) ||
      (itemNorm.includes("salicylic") && candidateNorm.includes("salicylic")) ||
      (itemNorm.includes("sun") && (candidateNorm.includes("avobenzone") || candidateNorm.includes("oxybenzone")))
    ) {
      return item;
    }
  }

  return null;
}

/**
 * Analyzes a custom cosmetic formulation / INCI text against user skin profile
 * and detects active conflicts, allergen threats, and safety parameters.
 */
export function analyzeCustomIngredientList(
  rawInciText: string,
  profile?: SkinProfile | null
): CustomAnalysisResult {
  const parsedNames = parseInciText(rawInciText);
  const matchedIngredients: { raw: string; record: Ingredient | null }[] = [];
  const matchedRecords: Ingredient[] = [];

  for (const name of parsedNames) {
    const rec = findIngredientInDatabase(name);
    matchedIngredients.push({ raw: name, record: rec });
    if (rec && !matchedRecords.some((r) => r.id === rec.id)) {
      matchedRecords.push(rec);
    }
  }

  const userAllergies = profile?.allergies || [];
  const userSensitivities = profile?.sensitivities || [];

  const allergenMatches: { ingredient: string; user_allergen: string }[] = [];
  const sensitivityMatches: { ingredient: string; user_sensitivity: string }[] = [];

  // Check allergen & sensitivity matches
  for (const item of parsedNames) {
    const matchedAllergen = checkUserContraindication(item, userAllergies);
    if (matchedAllergen && !allergenMatches.some((m) => m.ingredient === item)) {
      allergenMatches.push({ ingredient: item, user_allergen: matchedAllergen });
    }

    const matchedSens = checkUserContraindication(item, userSensitivities);
    if (matchedSens && !sensitivityMatches.some((m) => m.ingredient === item)) {
      sensitivityMatches.push({ ingredient: item, user_sensitivity: matchedSens });
    }
  }

  // Detect internal active conflicts / contraindications
  const detectedConflicts: {
    ingredient1: string;
    ingredient2: string;
    reason: string;
    severity: "High" | "Moderate";
  }[] = [];

  for (let i = 0; i < matchedRecords.length; i++) {
    const ingA = matchedRecords[i];
    for (let j = i + 1; j < matchedRecords.length; j++) {
      const ingB = matchedRecords[j];

      // Check if ingA contraindicates ingB
      const contraA = ingA.contraindications.find(
        (c) =>
          normalizeName(c.ingredient) === normalizeName(ingB.name) ||
          normalizeName(c.ingredient) === normalizeName(ingB.inci_name)
      );
      if (contraA) {
        detectedConflicts.push({
          ingredient1: ingA.name,
          ingredient2: ingB.name,
          reason: contraA.reason,
          severity: contraA.severity,
        });
      }

      // Check if ingB contraindicates ingA
      const contraB = ingB.contraindications.find(
        (c) =>
          normalizeName(c.ingredient) === normalizeName(ingA.name) ||
          normalizeName(c.ingredient) === normalizeName(ingA.inci_name)
      );
      if (contraB && !detectedConflicts.some((dc) => dc.ingredient1 === ingB.name && dc.ingredient2 === ingA.name)) {
        detectedConflicts.push({
          ingredient1: ingB.name,
          ingredient2: ingA.name,
          reason: contraB.reason,
          severity: contraB.severity,
        });
      }
    }
  }

  // Detect synergistic pairings
  const detectedSynergies: {
    ingredient1: string;
    ingredient2: string;
    reason: string;
  }[] = [];

  for (let i = 0; i < matchedRecords.length; i++) {
    const ingA = matchedRecords[i];
    for (let j = i + 1; j < matchedRecords.length; j++) {
      const ingB = matchedRecords[j];

      const synA = ingA.synergies.find(
        (s) =>
          normalizeName(s.ingredient) === normalizeName(ingB.name) ||
          normalizeName(s.ingredient) === normalizeName(ingB.inci_name)
      );
      if (synA) {
        detectedSynergies.push({
          ingredient1: ingA.name,
          ingredient2: ingB.name,
          reason: synA.reason,
        });
      }
    }
  }

  // Calculate Comedogenic Risk
  let maxComedogenic = 0;
  for (const r of matchedRecords) {
    if (r.comedogenic_rating > maxComedogenic) {
      maxComedogenic = r.comedogenic_rating;
    }
  }

  let comedogenicRisk: "Very Low" | "Low" | "Moderate" | "High" = "Very Low";
  if (maxComedogenic >= 4) comedogenicRisk = "High";
  else if (maxComedogenic === 3) comedogenicRisk = "Moderate";
  else if (maxComedogenic === 2) comedogenicRisk = "Low";

  // Calculate Base Safety Score (0-100)
  let safetyScore = 95;
  if (allergenMatches.length > 0) safetyScore -= allergenMatches.length * 35;
  if (sensitivityMatches.length > 0) safetyScore -= sensitivityMatches.length * 20;
  if (detectedConflicts.length > 0) {
    safetyScore -= detectedConflicts.filter((c) => c.severity === "High").length * 25;
    safetyScore -= detectedConflicts.filter((c) => c.severity === "Moderate").length * 15;
  }
  if (comedogenicRisk === "High" && profile?.skin_type === "Oily") safetyScore -= 20;
  safetyScore = Math.max(10, Math.min(100, safetyScore));

  // Extract Actives & Benefits
  const activesFound = matchedRecords
    .filter((r) => r.category === "Active" || r.category === "Exfoliant")
    .map((r) => r.name);

  const keyBenefitsSet = new Set<string>();
  matchedRecords.forEach((r) => {
    r.target_concerns.forEach((c) => keyBenefitsSet.add(c));
  });

  // Build usage recommendation
  let usageRecommendation = "Safe for morning or evening application.";
  const hasPhotosensitizer = matchedRecords.some(
    (r) => r.usage_advice.requires_sunscreen || r.usage_advice.time_of_day === "PM"
  );
  if (hasPhotosensitizer) {
    usageRecommendation =
      "Contains photosensitizing or exfoliating actives. Best reserved for evening routines, and mandatory Broad Spectrum SPF 50+ is required during the day.";
  }

  // Build detailed ingredient list
  const ingredientsDetails: CustomAnalysisIngredientItem[] = matchedIngredients.map((item) => {
    if (item.record) {
      return {
        name: item.record.name,
        inci_name: item.record.inci_name,
        category: item.record.category,
        comedogenic_rating: item.record.comedogenic_rating,
        function: item.record.function,
        is_active: item.record.category === "Active" || item.record.category === "Exfoliant",
        matched: true,
      };
    }
    return {
      name: item.raw,
      inci_name: item.raw,
      category: "Inactive / Botanical / Excipient",
      comedogenic_rating: 0,
      function: "Formulation stabilizer, vehicle, solvent, or conditioning agent.",
      is_active: false,
      matched: false,
    };
  });

  return {
    total_ingredients_parsed: parsedNames.length,
    known_ingredients: matchedRecords.length,
    safety_score: safetyScore,
    comedogenic_risk: comedogenicRisk,
    max_comedogenic_rating: maxComedogenic,
    allergen_matches: allergenMatches,
    sensitivity_matches: sensitivityMatches,
    detected_conflicts: detectedConflicts,
    detected_synergies: detectedSynergies,
    actives_found: activesFound,
    key_benefits: Array.from(keyBenefitsSet).slice(0, 6),
    usage_recommendation: usageRecommendation,
    ingredients_details: ingredientsDetails,
  };
}
