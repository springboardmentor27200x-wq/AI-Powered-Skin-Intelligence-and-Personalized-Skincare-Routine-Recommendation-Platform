const CONCERN_GROUPS = {
  pigmentation: [
    "Dark Spots",
    "Hyperpigmentation",
    "Uneven Skin Tone",
  ],
  fineLines: ["Fine Lines", "Wrinkles"],
};

function generateRoutine({
  skinType = "Sensitive",
  concerns = [],
  allergies = "Not sure",
  ageGroup = "",
  exercise,
  stress,
  sleep,
  water,
}) {
  const routine = {
    morning: [],
    night: [],
    weekly: [],
  };

  const selectedConcerns = Array.isArray(concerns)
    ? concerns
    : String(concerns || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  const hasConcern = (items) =>
    items.some((item) => selectedConcerns.includes(item));

  const allergyText = String(allergies || "Not sure").toLowerCase();
  const hasKnownAllergy =
    allergyText !== "no" &&
    allergyText !== "none" &&
    allergyText !== "";

  const sensitive =
    skinType.toLowerCase() === "sensitive" ||
    hasKnownAllergy;

  const fragranceSensitive = /fragrance|essential oils/i.test(allergyText);
  const alcoholSensitive = /\balcohol\b/i.test(allergyText);
  const under18 = ageGroup === "Under 18";

  const add = (section, item) => {
    routine[section].push(item);
  };

  // MORNING
  add("morning", {
    name: "Gentle Cleanser",
    reason: `Choose a gentle, non-irritating cleanser for ${skinType.toLowerCase()} skin.`,
  });

  if (hasConcern(CONCERN_GROUPS.pigmentation) || hasConcern(["Acne"])) {
    add("morning", {
      name: "Optional Supporting Treatment",
      ingredient: "Niacinamide",
      reason: "May support the appearance of uneven tone and oily, acne-prone skin. Patch-test first.",
    });
  }

  add("morning", {
    name: "Moisturizer",
    reason: "Helps maintain hydration and support the skin barrier.",
  });

  add("morning", {
    name: "Broad-Spectrum Sunscreen",
    ingredient: "SPF 30 or higher",
    reason: "Helps protect skin from UV exposure and prevent dark spots from worsening.",
  });

  // NIGHT
  add("night", {
    name: "Gentle Cleanser",
    reason: "Removes daily dirt, sweat and sunscreen.",
  });

  if (hasConcern(["Acne"]) && !sensitive && !under18) {
    add("night", {
      name: "Optional Acne Treatment",
      ingredient: "Salicylic Acid",
      reason: "May help acne-prone skin. Start cautiously and stop if irritation develops.",
    });
  } else if (hasConcern(["Acne"]) && sensitive) {
    add("night", {
      name: "Gentle Acne Care",
      ingredient: "Avoid introducing strong exfoliants without professional guidance",
      reason: "A gentle routine is preferable when sensitivity or allergy status is uncertain.",
    });
  }

  if (hasConcern(CONCERN_GROUPS.pigmentation)) {
    add("night", {
      name: "Tone-Supporting Treatment",
      ingredient: "Niacinamide",
      reason: "May support a more even-looking skin tone. Patch-test before use.",
    });
  }

  if (hasConcern(CONCERN_GROUPS.fineLines)) {
    add("night", {
      name: "Fine-Line Care",
      ingredient: "Moisturizer; discuss retinoids with a qualified professional",
      reason: under18
        ? "Retinoids are not included in this routine for users under 18."
        : "Retinoids can irritate skin and need suitability checks before use.",
    });
  }

  add("night", {
    name: "Moisturizer",
    reason: "Helps maintain hydration and support the skin barrier.",
  });

  // WEEKLY: don't automatically prescribe exfoliation to everyone
  if (hasConcern(["Acne"]) && !sensitive && !under18) {
    add("weekly", {
      name: "Optional Exfoliation",
      ingredient: "Salicylic Acid (BHA)",
      reason: "Only consider if tolerated; do not combine with other strong exfoliants initially.",
    });
  } else {
    add("weekly", {
      name: "Skin Barrier Check",
      reason: "Review dryness, redness or irritation. Skip exfoliation if your skin is sensitive or irritated.",
    });
  }

  // ALLERGY SAFETY NOTES
  if (hasKnownAllergy) {
    add("morning", {
      name: "Ingredient Safety Check",
      reason: fragranceSensitive
        ? "Avoid products listing fragrance or essential oils when relevant to your known reactions."
        : alcoholSensitive
        ? "Check the exact alcohol ingredient with a healthcare professional; different alcohols are not equivalent."
        : "Check full ingredient lists against your known allergens. This routine cannot verify product safety.",
    });
  }

  // LIFESTYLE INSIGHTS
  const insights = [];

  if (water === "Less than 1 L") {
    insights.push("Review your daily fluid intake and drink regularly according to your needs.");
  }

  if (stress === "High") {
    insights.push("Try a manageable stress-relief habit, such as a short walk or relaxation break.");
  }

  if (sleep === "Less than 5 hours") {
    insights.push("Try to build a consistent sleep schedule and allow enough time for rest.");
  }

  if (exercise === "Low") {
    insights.push("Gradually add comfortable physical activity to your routine.");
  }

  if (allergyText === "not sure") {
    insights.push("Your allergy status is uncertain. Patch-test new products and seek professional advice for recurring reactions.");
  }

  return {
    morning: routine.morning,
    night: routine.night,
    weekly: routine.weekly,
    insights,
  };
}

export default generateRoutine;