import { SkinProfile, LifestyleRecord, SleepRecord } from "../types";

export interface ScoreBreakdown {
  overall_score: number;
  condition_score: number;
  lifestyle_score: number;
  sleep_score: number;
  hydration_score: number;
  routine_score: number;
  score_category: "Optimal" | "Good" | "Moderate" | "Needs Attention";
  score_explanation: string;
}

/**
 * Calculates the Condition Score (Weight: 35%)
 * Evaluates declared skin concerns, sensitivities, allergies, and base skin type vulnerability.
 */
export function calculateConditionScore(
  profile: SkinProfile,
  concerns: string[]
): number {
  let score = 95;

  // Penalty per concern based on complexity
  const severeConcerns = ["Severe Cystic Acne", "Rosacea", "Eczema", "Extreme Hyperpigmentation"];
  const moderateConcerns = ["Acne", "Hyperpigmentation", "Wrinkles", "Dark Spots", "Uneven Texture"];

  concerns.forEach((concern) => {
    if (severeConcerns.some((sc) => concern.toLowerCase().includes(sc.toLowerCase()))) {
      score -= 14;
    } else if (moderateConcerns.some((mc) => concern.toLowerCase().includes(mc.toLowerCase()))) {
      score -= 9;
    } else {
      score -= 5;
    }
  });

  // Sensitive skin barrier tax
  if (profile.skin_type === "Sensitive") {
    score -= 8;
  } else if (profile.skin_type === "Combination" || profile.skin_type === "Dry") {
    score -= 4;
  }

  // Sensitivities & Allergies impact
  const sensitivityCount = (profile.sensitivities || []).length;
  const allergyCount = (profile.allergies || []).length;
  score -= sensitivityCount * 3;
  score -= allergyCount * 3;

  return Math.max(30, Math.min(100, Math.round(score)));
}

/**
 * Calculates the Lifestyle Score (Weight: 20%)
 * Evaluates lifestyle habits, stress, smoking, sun exposure, and environmental exposure.
 */
export function calculateLifestyleScore(records: LifestyleRecord[]): number {
  if (!records || records.length === 0) {
    return 75; // Neutral baseline when tracking has just started
  }

  const latestRecord = records[0];
  let score = 85;

  const habits = Array.isArray(latestRecord.lifestyle_habits)
    ? latestRecord.lifestyle_habits.map((h) => h.toLowerCase())
    : String(latestRecord.lifestyle_habits || "")
        .toLowerCase()
        .split(",");

  habits.forEach((habit) => {
    if (habit.includes("high stress") || habit.includes("chronic stress")) score -= 12;
    if (habit.includes("smoking") || habit.includes("nicotine")) score -= 15;
    if (habit.includes("high sugar") || habit.includes("processed food")) score -= 8;
    if (habit.includes("high caffeine") || habit.includes("alcohol")) score -= 6;
    if (habit.includes("late night screen")) score -= 5;
    if (habit.includes("spf") || habit.includes("sunscreen")) score += 8;
    if (habit.includes("mediterranean") || habit.includes("whole food") || habit.includes("antioxidant")) score += 6;
    if (habit.includes("gym") || habit.includes("exercise") || habit.includes("active")) score += 5;
    if (habit.includes("low stress") || habit.includes("meditation")) score += 6;
  });

  // Environmental exposure checks
  const env = (latestRecord.environmental_exposure || "").toLowerCase();
  if (env.includes("high uv") || env.includes("intense sun")) score -= 10;
  if (env.includes("pollution") || env.includes("urban")) score -= 8;
  if (env.includes("air-conditioned") || env.includes("dry ac") || env.includes("low humidity")) score -= 6;
  if (env.includes("moderate") || env.includes("controlled")) score += 4;

  return Math.max(35, Math.min(100, Math.round(score)));
}

/**
 * Calculates the Sleep Score (Weight: 15%)
 * Evaluates duration (optimal 7-9h) and restorative quality ratings.
 */
export function calculateSleepScore(records: SleepRecord[]): number {
  if (!records || records.length === 0) {
    return 75; // Baseline when no logs exist yet
  }

  const latest = records[0];
  const hours = Number(latest.sleep_hours) || 7.5;
  const quality = (latest.sleep_quality || "").toLowerCase();

  let score = 80;

  // Duration evaluation
  if (hours >= 7.0 && hours <= 9.0) {
    score += 15;
  } else if (hours >= 6.0 && hours < 7.0) {
    score += 5;
  } else if (hours > 9.0) {
    score += 8;
  } else if (hours >= 5.0 && hours < 6.0) {
    score -= 15;
  } else {
    score -= 25;
  }

  // Quality evaluation
  if (quality.includes("deep")) {
    score += 10;
  } else if (quality.includes("good")) {
    score += 6;
  } else if (quality.includes("fair")) {
    score -= 8;
  } else if (quality.includes("poor")) {
    score -= 20;
  }

  return Math.max(30, Math.min(100, Math.round(score)));
}

/**
 * Calculates the Hydration Score (Weight: 10%)
 * Evaluates daily water intake in liters against dermatological hydration targets.
 */
export function calculateHydrationScore(records: LifestyleRecord[]): number {
  if (!records || records.length === 0) {
    return 70; // Baseline
  }

  const latest = records[0];
  const liters = Number(latest.water_intake) || 2.0;

  if (liters >= 3.0) return 100;
  if (liters >= 2.5) return 92;
  if (liters >= 2.0) return 80;
  if (liters >= 1.5) return 65;
  if (liters >= 1.0) return 48;
  return 30;
}

/**
 * Calculates Routine Consistency / Readiness Score (Weight: 20%)
 * In Milestone 2 (pre-Milestone 3 tracking history), evaluates profile completeness,
 * active monitoring frequency, and baseline habit commitment.
 */
export function calculateRoutineScore(
  hasProfile: boolean,
  lifestyleRecordsCount: number,
  sleepRecordsCount: number
): number {
  let score = 70;

  if (hasProfile) score += 15;
  if (lifestyleRecordsCount >= 3) score += 8;
  else if (lifestyleRecordsCount >= 1) score += 4;

  if (sleepRecordsCount >= 3) score += 7;
  else if (sleepRecordsCount >= 1) score += 4;

  return Math.min(95, Math.max(50, score));
}

/**
 * Computes the overall weighted Skin Health Score (0-100) and structured explanation.
 * Weights:
 * - Condition Score: 35%
 * - Lifestyle Score: 20%
 * - Routine Score: 20%
 * - Sleep Score: 15%
 * - Hydration Score: 10%
 */
export function computeSkinHealthScore(
  profile: SkinProfile,
  concerns: string[],
  lifestyleRecords: LifestyleRecord[],
  sleepRecords: SleepRecord[]
): ScoreBreakdown {
  const condition_score = calculateConditionScore(profile, concerns);
  const lifestyle_score = calculateLifestyleScore(lifestyleRecords);
  const sleep_score = calculateSleepScore(sleepRecords);
  const hydration_score = calculateHydrationScore(lifestyleRecords);
  const routine_score = calculateRoutineScore(
    Boolean(profile),
    lifestyleRecords.length,
    sleepRecords.length
  );

  const weightedTotal =
    condition_score * 0.35 +
    lifestyle_score * 0.20 +
    sleep_score * 0.15 +
    routine_score * 0.20 +
    hydration_score * 0.10;

  const overall_score = Math.round(weightedTotal);

  let score_category: "Optimal" | "Good" | "Moderate" | "Needs Attention" = "Good";
  if (overall_score >= 85) score_category = "Optimal";
  else if (overall_score >= 72) score_category = "Good";
  else if (overall_score >= 58) score_category = "Moderate";
  else score_category = "Needs Attention";

  let explanation = `Your skin health index is ${overall_score}/100 (${score_category}). `;
  if (condition_score < 70) {
    explanation += "Active concerns and skin barrier sensitivities are the primary factors lowering your score. ";
  } else {
    explanation += "Your baseline skin barrier exhibits healthy resistance. ";
  }

  if (hydration_score >= 85 && sleep_score >= 80) {
    explanation += "Strong hydration habits and restorative sleep provide vital cellular renewal support.";
  } else if (hydration_score < 70) {
    explanation += "Increasing daily hydration above 2.5L will immediately accelerate skin moisture barrier recovery.";
  } else if (sleep_score < 70) {
    explanation += "Sub-optimal sleep patterns may hinder overnight epidermal repair cycles.";
  }

  return {
    overall_score,
    condition_score,
    lifestyle_score,
    sleep_score,
    hydration_score,
    routine_score,
    score_category,
    score_explanation: explanation,
  };
}
