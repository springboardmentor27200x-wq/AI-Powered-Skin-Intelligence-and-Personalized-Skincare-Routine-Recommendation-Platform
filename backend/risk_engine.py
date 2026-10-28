def analyze_skin_risks(
    concerns,
    skin_type,
    sun_exposure,
    pollution_exposure,
    environment,
    exercise,
    stress,
    sleep,
    water
):
    concerns = concerns or []

    risk_factors = []
    priority_scores = {}

    # -----------------------------------
    # 1. BASE CONCERN PRIORITY
    # -----------------------------------

    for concern in concerns:
        priority_scores[concern] = 60

    # -----------------------------------
    # 2. ENVIRONMENTAL RISK FACTORS
    # -----------------------------------

    if sun_exposure == "High":
        risk_factors.append({
            "factor": "High sun exposure",
            "impact": "May increase the importance of daytime sun protection.",
            "related_concerns": [
                "Dark Spots",
                "Hyperpigmentation",
                "Uneven Skin Tone"
            ]
        })

        for concern in [
            "Dark Spots",
            "Hyperpigmentation",
            "Uneven Skin Tone"
        ]:
            if concern in priority_scores:
                priority_scores[concern] += 20

    elif sun_exposure == "Moderate":
        risk_factors.append({
            "factor": "Moderate sun exposure",
            "impact": "Regular daytime sun protection is recommended.",
            "related_concerns": [
                "Dark Spots",
                "Hyperpigmentation",
                "Uneven Skin Tone"
            ]
        })

        for concern in [
            "Dark Spots",
            "Hyperpigmentation",
            "Uneven Skin Tone"
        ]:
            if concern in priority_scores:
                priority_scores[concern] += 10

    if pollution_exposure == "High":
        risk_factors.append({
            "factor": "High pollution exposure",
            "impact": "Daily cleansing and skin-barrier support become important routine considerations.",
            "related_concerns": [
                "Acne",
                "Redness",
                "Uneven Skin Tone"
            ]
        })

        for concern in [
            "Acne",
            "Redness",
            "Uneven Skin Tone"
        ]:
            if concern in priority_scores:
                priority_scores[concern] += 15

    elif pollution_exposure == "Moderate":
        risk_factors.append({
            "factor": "Moderate pollution exposure",
            "impact": "Consistent cleansing and barrier support may be useful.",
            "related_concerns": [
                "Acne",
                "Redness",
                "Uneven Skin Tone"
            ]
        })

        for concern in [
            "Acne",
            "Redness",
            "Uneven Skin Tone"
        ]:
            if concern in priority_scores:
                priority_scores[concern] += 8

    # -----------------------------------
    # 3. LIFESTYLE RISK FACTORS
    # -----------------------------------

    if stress == "High":
        risk_factors.append({
            "factor": "High stress",
            "impact": "Stress management is included as a lifestyle consideration.",
            "related_concerns": ["Acne", "Redness"]
        })

        for concern in ["Acne", "Redness"]:
            if concern in priority_scores:
                priority_scores[concern] += 10

    if exercise == "Low":
        risk_factors.append({
            "factor": "Low physical activity",
            "impact": "Increasing regular physical activity may support overall lifestyle health.",
            "related_concerns": []
        })

    # -----------------------------------
    # 4. SLEEP RISK
    # -----------------------------------

    if sleep == "Less than 5 hours":
        risk_factors.append({
            "factor": "Low sleep duration",
            "impact": "Improving sleep consistency is an important lifestyle consideration.",
            "related_concerns": [
                "Redness",
                "Fine Lines"
            ]
        })

        for concern in ["Redness", "Fine Lines"]:
            if concern in priority_scores:
                priority_scores[concern] += 10

    # -----------------------------------
    # 5. HYDRATION RISK
    # -----------------------------------

    if water == "Less than 1 L":
        risk_factors.append({
            "factor": "Low reported water intake",
            "impact": "Increasing water intake may support overall hydration habits.",
            "related_concerns": [
                "Dry Skin"
            ]
        })

        if "Dry Skin" in priority_scores:
            priority_scores["Dry Skin"] += 10

    # -----------------------------------
    # 6. SKIN TYPE CONTEXT
    # -----------------------------------

    if skin_type == "Oily" and "Acne" in priority_scores:
        priority_scores["Acne"] += 10

    if skin_type == "Sensitive" and "Redness" in priority_scores:
        priority_scores["Redness"] += 10

    if skin_type == "Dry" and "Fine Lines" in priority_scores:
        priority_scores["Fine Lines"] += 5

    # -----------------------------------
    # 7. LIMIT SCORE
    # -----------------------------------

    priority_scores = {
        concern: min(score, 100)
        for concern, score in priority_scores.items()
    }

    # -----------------------------------
    # 8. SORT CONCERNS BY PRIORITY
    # -----------------------------------

    prioritized_concerns = sorted(
        [
            {
                "concern": concern,
                "priority_score": score
            }
            for concern, score in priority_scores.items()
        ],
        key=lambda item: item["priority_score"],
        reverse=True
    )

    return {
        "prioritized_concerns": prioritized_concerns,
        "risk_factors": risk_factors
    }