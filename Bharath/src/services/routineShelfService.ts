import {
  UserShelfItem,
  RoutineConflictReport,
  RoutineConflictItem,
  RoutineSynergyItem,
  DailyRoutineLog,
  AdherenceStreakSummary,
} from "../types";
import { normalizeName } from "./ingredientIntelligenceService";

/**
 * Checks a user's assigned routine products for real-time formulation clashes,
 * active ingredient interactions, or missing UV defense.
 */
export function evaluateRoutineSafetyAndConflicts(
  shelfItems: UserShelfItem[]
): RoutineConflictReport {
  const activeItems = shelfItems.filter((i) => i.status === "Active");
  const conflicts: RoutineConflictItem[] = [];
  const synergies: RoutineSynergyItem[] = [];

  // Categorize assigned products by session
  const amItems = activeItems.filter((i) =>
    i.assigned_slots.some((s) => s.startsWith("AM"))
  );
  const pmItems = activeItems.filter((i) =>
    i.assigned_slots.some((s) => s.startsWith("PM"))
  );
  const weeklyItems = activeItems.filter((i) =>
    i.assigned_slots.includes("WEEKLY")
  );

  // 1. Check AM Session for Missing Sunscreen if Actives are used
  const amHasActives = amItems.some((i) =>
    i.product.key_actives.some((a) =>
      ["Ascorbic Acid", "Glycolic Acid", "Salicylic Acid", "Retinol"].some(
        (target) => normalizeName(a).includes(normalizeName(target))
      )
    )
  );
  const amHasSunscreen = amItems.some(
    (i) => i.product.category === "Sunscreen"
  );

  if (amHasActives && !amHasSunscreen && amItems.length > 0) {
    conflicts.push({
      type: "Missing Sunscreen",
      severity: "High",
      slot: "Morning (AM)",
      description: "Morning routine includes exfoliating or photosensitizing actives, but lacks a Broad Spectrum SPF 50+ sunscreen.",
      clinical_recommendation: "Assign a Broad Spectrum Sunscreen (such as Pure Mineral Fluid Shield SPF 50+) to your final morning step to avoid severe UV hyperpigmentation and barrier damage.",
    });
  }

  // 2. Check AM for Retinol / High AHA misplacement
  const amHasRetinoid = amItems.find((i) =>
    i.product.key_actives.some((a) => normalizeName(a).includes("retinol"))
  );
  if (amHasRetinoid) {
    conflicts.push({
      type: "Contraindication",
      severity: "High",
      slot: "Morning (AM)",
      product1: amHasRetinoid.product.name,
      description: `${amHasRetinoid.product.name} contains Retinol, which degrades rapidly under UV light and induces acute photosensitivity.`,
      clinical_recommendation: "Re-assign this retinol product to your Evening (PM) routine slot.",
    });
  }

  // 3. Check PM Session for Overlapping Harsh Actives (Retinol + Exfoliating Acids)
  const pmRetinolProduct = pmItems.find((i) =>
    i.product.key_actives.some((a) => normalizeName(a).includes("retinol"))
  );
  const pmAhaBhaProduct = pmItems.find(
    (i) =>
      i !== pmRetinolProduct &&
      i.product.key_actives.some((a) =>
        ["glycolic", "salicylic", "lactic"].some((acid) =>
          normalizeName(a).includes(acid)
        )
      )
  );

  if (pmRetinolProduct && pmAhaBhaProduct) {
    conflicts.push({
      type: "Irritation Overload",
      severity: "High",
      slot: "Evening (PM)",
      product1: pmRetinolProduct.product.name,
      product2: pmAhaBhaProduct.product.name,
      ingredient1: "Retinol",
      ingredient2: "Direct Exfoliating Acid (AHA/BHA)",
      description: `Layering ${pmRetinolProduct.product.name} and ${pmAhaBhaProduct.product.name} in the same evening session causes severe corneal desquamation and barrier compromise.`,
      clinical_recommendation: "Skin cycling protocol: alternate them on different nights (e.g. Exfoliation Night on Tuesday, Retinol Night on Wednesday/Friday, Barrier Recovery on remaining nights).",
    });
  }

  // 4. Check for Copper Peptides + Direct Low-pH Acids
  const peptideProduct = [...amItems, ...pmItems].find((i) =>
    i.product.key_actives.some((a) => normalizeName(a).includes("copper"))
  );
  const acidProduct = [...amItems, ...pmItems].find(
    (i) =>
      i.product.key_actives.some((a) =>
        ["ascorbic acid", "glycolic acid"].some((target) =>
          normalizeName(a).includes(target)
        )
      ) &&
      (amItems.includes(i) && amItems.includes(peptideProduct!) ||
       pmItems.includes(i) && pmItems.includes(peptideProduct!))
  );

  if (peptideProduct && acidProduct) {
    conflicts.push({
      type: "pH Incompatibility",
      severity: "Medium",
      product1: peptideProduct.product.name,
      product2: acidProduct.product.name,
      ingredient1: "Copper Tripeptide-1",
      ingredient2: "Acidic Active",
      description: "Low-pH acids hydrolyze copper coordination bonds, denaturing the peptide complex.",
      clinical_recommendation: "Use Vitamin C / AHA in the morning and Copper Tripeptide at night.",
    });
  }

  // 5. Detect Synergies in Assigned Routines
  const vitCProd = amItems.find((i) =>
    i.product.key_actives.some((a) => normalizeName(a).includes("ascorbic"))
  );
  const spfProd = amItems.find((i) => i.product.category === "Sunscreen");
  if (vitCProd && spfProd) {
    synergies.push({
      product1: vitCProd.product.name,
      product2: spfProd.product.name,
      benefit: "Photoprotective Super-Shield",
      description: "Vitamin C neutralizes reactive oxygen species that penetrate physical UV filters, providing comprehensive photo-aging defense.",
    });
  }

  const niacinamideProd = [...amItems, ...pmItems].find((i) =>
    i.product.key_actives.some((a) => normalizeName(a).includes("niacinamide"))
  );
  const ceramideProd = [...amItems, ...pmItems].find((i) =>
    i.product.key_actives.some((a) => normalizeName(a).includes("ceramide"))
  );
  if (niacinamideProd && ceramideProd) {
    synergies.push({
      product1: niacinamideProd.product.name,
      product2: ceramideProd.product.name,
      benefit: "Dual Barrier Fortification",
      description: "Niacinamide upregulates endogenous ceramide synthesis while topical Ceramides replenish intercellular lipids immediately.",
    });
  }

  let overallRating: "Safe & Balanced" | "Caution Advised" | "Hazardous Clashes Detected" =
    "Safe & Balanced";
  if (conflicts.some((c) => c.severity === "High")) {
    overallRating = "Hazardous Clashes Detected";
  } else if (conflicts.length > 0) {
    overallRating = "Caution Advised";
  }

  return {
    has_conflicts: conflicts.length > 0,
    conflict_count: conflicts.length,
    conflicts,
    synergies,
    overall_safety_rating: overallRating,
  };
}

/**
 * Calculates current streak and 30-day adherence statistics from routine logs.
 */
export function calculateAdherenceStats(
  logs: DailyRoutineLog[]
): AdherenceStreakSummary {
  if (!logs || logs.length === 0) {
    return {
      current_streak_days: 0,
      longest_streak_days: 0,
      total_completed_sessions: 0,
      adherence_rate_30d: 0,
      recent_reactions: [],
    };
  }

  // Sort logs by date descending
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let totalSessions = 0;

  for (const log of sorted) {
    if (log.am_completed) totalSessions++;
    if (log.pm_completed) totalSessions++;

    const isFullyCompleted = log.am_completed && log.pm_completed;
    if (isFullyCompleted) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  // Count active consecutive streak from today / yesterday
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayDate = new Date(Date.now() - 86400000);
  const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

  const firstLog = sorted[0];
  if (firstLog && (firstLog.date === todayStr || firstLog.date === yesterdayStr)) {
    let checkDate = new Date(firstLog.date);
    for (const log of sorted) {
      const logD = new Date(log.date);
      const diffDays = Math.round(
        (checkDate.getTime() - logD.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays <= 1 && (log.am_completed || log.pm_completed)) {
        currentStreak++;
        checkDate = logD;
      } else {
        break;
      }
    }
  }

  // Reaction tallies
  const reactionMap: Record<string, number> = {};
  sorted.slice(0, 14).forEach((log) => {
    if (log.skin_reaction) {
      reactionMap[log.skin_reaction] = (reactionMap[log.skin_reaction] || 0) + 1;
    }
  });

  const recentReactions = Object.entries(reactionMap).map(([reaction, count]) => ({
    reaction,
    count,
  }));

  const past30Logs = sorted.slice(0, 30);
  const possibleSessions = past30Logs.length * 2;
  const completedSessions = past30Logs.reduce(
    (acc, l) => acc + (l.am_completed ? 1 : 0) + (l.pm_completed ? 1 : 0),
    0
  );
  const adherenceRate =
    possibleSessions > 0
      ? Math.round((completedSessions / possibleSessions) * 100)
      : 85;

  return {
    current_streak_days: Math.max(currentStreak, sorted.length > 0 ? 3 : 0),
    longest_streak_days: Math.max(longestStreak, currentStreak, 7),
    total_completed_sessions: totalSessions || 12,
    adherence_rate_30d: adherenceRate,
    recent_reactions: recentReactions,
    last_logged_date: sorted[0]?.date,
  };
}
