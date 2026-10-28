def calculate_skin_condition_score(concerns):
    """
    Calculate skin condition score out of 100.

    More skin concerns = lower score.
    """

    if not concerns:
        return 100

    concern_count = len(concerns)

    if concern_count == 1:
        return 90
    elif concern_count == 2:
        return 80
    elif concern_count == 3:
        return 70
    elif concern_count == 4:
        return 60
    elif concern_count == 5:
        return 50
    else:
        return 40


def calculate_lifestyle_score(exercise, stress):
    """
    Calculate lifestyle score out of 100.
    """

    score = 100

    # Exercise
    if exercise == "Low":
        score -= 20
    elif exercise == "Moderate":
        score -= 10

    # Stress
    if stress == "High":
        score -= 20
    elif stress == "Moderate":
        score -= 10

    return max(score, 0)


def calculate_sleep_score(sleep):
    """
    Calculate sleep quality score out of 100.
    """

    if sleep == "Less than 5 hours":
        return 70
    elif sleep == "5–6 hours":
        return 85
    elif sleep == "7–8 hours":
        return 100
    elif sleep == "More than 8 hours":
        return 95
    else:
        return 0


def calculate_hydration_score(water):
    """
    Calculate hydration score out of 100.
    """

    if water == "Less than 1 L":
        return 70
    elif water == "1–2 L":
        return 85
    elif water == "2–3 L":
        return 100
    elif water == "More than 3 L":
        return 95
    else:
        return 0


def calculate_overall_score(
    skin_condition,
    lifestyle,
    sleep,
    routine_consistency,
    hydration
):
    """
    Calculate overall skin health score
    using the required weighted model.
    """

    overall_score = (
        skin_condition * 0.35
        + lifestyle * 0.20
        + sleep * 0.15
        + routine_consistency * 0.20
        + hydration * 0.10
    )

    return round(overall_score)


def calculate_skin_health_score(
    concerns,
    exercise,
    stress,
    sleep,
    water,
    routine_consistency=100
):
    """
    Calculate all skin health scores.
    """

    skin_condition = calculate_skin_condition_score(concerns)

    lifestyle = calculate_lifestyle_score(
        exercise,
        stress
    )

    sleep_score = calculate_sleep_score(sleep)

    hydration = calculate_hydration_score(water)

    overall = calculate_overall_score(
        skin_condition,
        lifestyle,
        sleep_score,
        routine_consistency,
        hydration
    )

    return {
        "skin_condition_score": skin_condition,
        "lifestyle_score": lifestyle,
        "sleep_score": sleep_score,
        "routine_consistency_score": routine_consistency,
        "hydration_score": hydration,
        "overall_score": overall
    }