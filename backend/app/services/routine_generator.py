def generate_morning_routine(skin_type, primary_concern):
    routine = [
        "Gentle cleanser",
        "Hydrating toner",
    ]

    if primary_concern == "Acne":
        routine.append("Acne treatment containing salicylic acid or niacinamide")
    elif primary_concern == "Hyperpigmentation":
        routine.append("Brightening serum containing vitamin C or niacinamide")
    elif primary_concern == "Dark Spots":
        routine.append("Dark-spot treatment with vitamin C or niacinamide")
    elif primary_concern == "Dry Skin":
        routine.append("Hydrating serum containing hyaluronic acid")
    elif primary_concern == "Oily Skin":
        routine.append("Lightweight oil-control serum containing niacinamide")
    elif primary_concern == "Sensitive Skin":
        routine.append("Gentle soothing serum containing panthenol or centella")

    routine.extend([
        "Moisturizer suitable for your skin type",
        "Broad-spectrum sunscreen SPF 30 or higher",
    ])

    return routine


def generate_evening_routine(skin_type, primary_concern):
    routine = [
        "Gentle cleanser",
    ]

    if primary_concern == "Acne":
        routine.append("Acne treatment")
    elif primary_concern in ["Hyperpigmentation", "Dark Spots"]:
        routine.append("Pigmentation treatment")
    elif primary_concern in ["Fine Lines", "Wrinkles"]:
        routine.append("Anti-aging treatment")
    elif primary_concern == "Dry Skin":
        routine.append("Hydrating serum")
    elif primary_concern == "Sensitive Skin":
        routine.append("Soothing serum")

    routine.append("Moisturizer")

    return routine


def generate_weekly_treatment(skin_type, primary_concern):
    if skin_type == "Sensitive":
        return "Use a gentle hydrating mask once a week. Avoid harsh exfoliation."

    if primary_concern in ["Acne", "Oily Skin"]:
        return "Use a gentle exfoliating treatment once a week if tolerated."

    if primary_concern in ["Dry Skin", "Fine Lines", "Wrinkles"]:
        return "Use a hydrating and nourishing face mask once a week."

    return "Use a gentle exfoliation or hydrating mask once a week."


def generate_seasonal_recommendations(skin_type, season):
    if season == "Summer":
        return (
            "Use lightweight moisturizer, increase hydration, "
            "and apply sunscreen regularly."
        )

    if season == "Winter":
        return (
            "Use a richer moisturizer, avoid very hot water, "
            "and focus on maintaining skin hydration."
        )

    if season == "Monsoon":
        return (
            "Use lightweight non-comedogenic products and maintain "
            "regular cleansing."
        )

    return "Maintain hydration, gentle cleansing, moisturizing, and daily sun protection."


def generate_adaptive_updates(primary_concern, risk_factors):
    updates = []

    if risk_factors:
        updates.append(
            "Improve lifestyle factors identified during the skin assessment."
        )

    if primary_concern:
        updates.append(
            f"Monitor progress related to {primary_concern} and adjust treatment gradually."
        )

    updates.append(
        "Reassess the skincare routine regularly based on skin response."
    )

    return " ".join(updates)


def generate_personalized_routine(
    skin_type,
    primary_concern,
    season,
    risk_factors=None,
):
    return {
        "morning_routine": generate_morning_routine(
            skin_type,
            primary_concern,
        ),
        "evening_routine": generate_evening_routine(
            skin_type,
            primary_concern,
        ),
        "weekly_treatment": generate_weekly_treatment(
            skin_type,
            primary_concern,
        ),
        "seasonal_recommendations": generate_seasonal_recommendations(
            skin_type,
            season,
        ),
        "adaptive_updates": generate_adaptive_updates(
            primary_concern,
            risk_factors,
        ),
    }