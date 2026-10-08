"""Profile-aware product ranking. All input product facts come from the catalog."""
import json
import os
import re
import urllib.request
from difflib import SequenceMatcher


CONCERN_TERMS = {
    "acne": ("salicylic acid", "benzoyl peroxide", "niacinamide"),
    "oiliness": ("salicylic acid", "niacinamide", "zinc"),
    "dryness": ("glycerin", "hyaluronic acid", "ceramide", "squalane"),
    "dehydration": ("glycerin", "hyaluronic acid", "panthenol"),
    "redness/sensitivity": ("panthenol", "colloidal oatmeal", "ceramide", "allantoin"),
    "sensitivity": ("panthenol", "colloidal oatmeal", "ceramide", "allantoin"),
    "dullness": ("vitamin c", "niacinamide", "lactic acid"),
    "fine lines/aging": ("retinol", "peptide", "vitamin c"),
    "hyperpigmentation": ("azelaic acid", "niacinamide", "vitamin c"),
}
IRRITANTS = ("fragrance", "parfum", "limonene", "linalool", "eucalyptus oil", "alcohol denat")
CONFLICTS = (("retinol", "glycolic acid"), ("retinol", "lactic acid"), ("retinol", "salicylic acid"), ("benzoyl peroxide", "retinol"))


def _tokens(value):
    return {x.strip().lower() for x in re.split(r"[,;|]", value or "") if x.strip()}


def _has_term(text, term):
    return term.lower() in (text or "").lower()


def _score(product, profile, budget, hydration_low=False):
    ingredients = product.ingredients or ""
    profile_types = _tokens(profile.skin_type)
    product_types = _tokens(product.skin_types)
    skin_match = 100 if profile_types.intersection(product_types) else (50 if "all" in product_types else 0)
    concerns = _tokens(profile.concerns)
    matches = {term for concern in concerns for term in CONCERN_TERMS.get(concern, ()) if _has_term(ingredients, term)}
    if hydration_low:
        matches.update(term for term in ("glycerin", "hyaluronic acid", "panthenol", "ceramide") if _has_term(ingredients, term))
    concern_score = min(100, round(100 * len(matches) / max(1, len(concerns)))) if concerns else (30 if matches else 0)
    sensitivity = (profile.sensitivity or "").lower()
    allergy_terms = _tokens(profile.allergies)
    sensitivity_terms = _tokens(profile.sensitivity)
    allergen_list = _tokens(product.allergens)
    ingredient_text = ingredients.lower()
    allergy_hit = any(x and (x in ingredient_text or x in allergen_list) for x in allergy_terms)
    if allergy_hit:
        return None
    generic_sensitivity = {"high", "sensitive", "reactive", "low", "medium", "normal", "yes", "no", "none"}
    specific_sensitivities = {term for term in sensitivity_terms if term not in generic_sensitivity}
    if any(term in ingredient_text for term in specific_sensitivities):
        return None
    sensitive_profile = any(x in sensitivity for x in ("high", "sensitive", "reactive"))
    safety = 100
    if sensitive_profile and any(term in ingredient_text for term in IRRITANTS):
        safety -= 35
    product_actives = {name for name in ("retinol", "glycolic acid", "lactic acid", "salicylic acid", "benzoyl peroxide") if name in ingredient_text}
    if any(a in product_actives and b in product_actives for a, b in CONFLICTS):
        safety -= 35
    budget_score = 100 if budget is None else max(0, min(100, round(100 * (1 - max(0, (product.price_inr or 0) - budget) / max(budget, 1)))))
    popularity = max(0, min(100, round((product.rating or 0) / 5 * 100)))
    score = round(skin_match * .30 + concern_score * .35 + safety * .15 + budget_score * .10 + popularity * .10)
    why = []
    if skin_match: why.append("matches your skin type")
    if matches: why.append("contains " + ", ".join(sorted(matches)[:3]) + " relevant to your concerns")
    if hydration_low and matches: why.append("supports a hydration-focused routine")
    return {"id": product.id, "name": product.name, "brand": product.brand or "Unknown", "category": product.category or "Other", "price_inr": product.price_inr, "suitability_score": score, "rating": product.rating or 0, "ingredients": ingredients, "key_matching_ingredients": sorted(matches)[:5], "why_recommended": "; ".join(why) or "A catalog option to review against your profile", "_safety": safety, "_text": " ".join((product.name or "", product.category or "", ingredients, product.skin_types or "", product.concerns or ""))}


def _cosine_rank(selected, products):
    """TF-IDF cosine similarity, with a safe token overlap fallback."""
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        texts = [selected["_text"]] + [item["_text"] for item in products]
        similarities = cosine_similarity(TfidfVectorizer(stop_words="english").fit_transform(texts))[0][1:]
        return sorted(zip(products, similarities), key=lambda pair: pair[1], reverse=True)
    except (ImportError, ValueError):
        source = set(selected["_text"].lower().split())
        return sorted(((x, len(source.intersection(x["_text"].lower().split())) / max(1, len(source.union(x["_text"].lower().split())))) for x in products), key=lambda pair: pair[1], reverse=True)


def recommend_products(products, profile, budget=None, min_price=None, category=None, concern=None, hydration_low=False, use_llm=True):
    effective_budget = min(budget, profile.budget_inr) if budget is not None and profile.budget_inr is not None else (budget if budget is not None else profile.budget_inr)
    results = []
    for product in products:
        if effective_budget is not None and (product.price_inr is None or product.price_inr > effective_budget): continue
        if min_price is not None and (product.price_inr is None or product.price_inr < min_price): continue
        if category and (product.category or "").lower() != category.lower(): continue
        if concern and concern.lower() not in (product.concerns or "").lower() and not any(term in (product.ingredients or "").lower() for term in CONCERN_TERMS.get(concern.lower(), ())): continue
        item = _score(product, profile, effective_budget, hydration_low)
        if item: results.append(item)
    results.sort(key=lambda x: (x["suitability_score"], x["rating"]), reverse=True)
    candidates = results[:15]
    reranked = _gemini_rerank(candidates, profile) if use_llm else None
    if reranked:
        by_id = {x["id"]: x for x in candidates}
        results = [dict(by_id[item["product_id"]], why_recommended=item.get("reason") or by_id[item["product_id"]]["why_recommended"]) for item in reranked if item.get("product_id") in by_id]
    for item in results: item.pop("_safety", None); item.pop("_text", None)
    return results


def _gemini_rerank(candidates, profile):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not candidates: return None
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    response_schema = {"type": "OBJECT", "properties": {"recommendations": {"type": "ARRAY", "items": {"type": "OBJECT", "properties": {"product_id": {"type": "INTEGER"}, "reason": {"type": "STRING"}}, "required": ["product_id", "reason"]}}}, "required": ["recommendations"]}
    body = {"contents": [{"parts": [{"text": "Rank up to 5 products from this candidate list for the user's skincare profile. Use only listed IDs; do not make medical claims. Profile: " + json.dumps({"skin_type": profile.skin_type, "concerns": profile.concerns, "sensitivity": profile.sensitivity}) + " Candidates: " + json.dumps([{k: x[k] for k in ("id", "name", "category", "ingredients", "suitability_score")} for x in candidates])}]}], "generationConfig": {"responseMimeType": "application/json", "responseSchema": response_schema}}
    try:
        req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent", data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "x-goog-api-key": api_key})
        with urllib.request.urlopen(req, timeout=8) as response: payload = json.loads(response.read())
        parsed = json.loads(payload["candidates"][0]["content"]["parts"][0]["text"])
        allowed = {x["id"] for x in candidates}
        safe = []
        for item in parsed.get("recommendations", []):
            pid = item.get("product_id")
            if pid in allowed and isinstance(item.get("reason"), str): safe.append(item)
        return safe[:5] or None
    except Exception:
        return None


def alternatives(product, products, profile, budget=None):
    candidates = [p for p in products if p.id != product.id and p.category == product.category]
    selected = _score(product, profile, budget)
    if not selected: return []
    safe = [item for p in candidates if (item := _score(p, profile, budget))]
    ranked = _cosine_rank(selected, safe)
    return [dict(item, similarity=round(float(similarity), 3)) for item, similarity in ranked[:5] if item["_safety"] >= 65]


def build_combos(recommendations):
    from itertools import product as cartesian_product
    categories = {"cleanser": ("cleanser", "face wash"), "serum": ("serum",), "moisturizer": ("moisturizer",), "sunscreen": ("sunscreen",)}
    options = {}
    for key, terms in categories.items():
        options[key] = [x for x in recommendations if x.get("price_inr") is not None and (any(term in x["category"].lower() for term in terms) or (key == "serum" and "treatment" in x["category"].lower() and "serum" in x["name"].lower()))][:5]
    if any(not values for values in options.values()): return []
    valid = []
    for picked in cartesian_product(*(options[key] for key in categories)):
        actives = {name for item in picked for name in ("retinol", "glycolic acid", "lactic acid", "salicylic acid", "benzoyl peroxide") if name in item["ingredients"].lower()}
        if any(a in actives and b in actives for a, b in CONFLICTS): continue
        total = round(sum(x["price_inr"] for x in picked), 2)
        tier = "Budget" if total <= 1500 else "Mid-range" if total <= 3500 else "Premium"
        value = sum(x["suitability_score"] for x in picked) / max(total, 1)
        valid.append((tier, value, total, picked))
    bundles = []
    for tier in ("Budget", "Mid-range", "Premium"):
        candidates = [item for item in valid if item[0] == tier]
        if not candidates: continue
        _, _, total, picked = max(candidates, key=lambda item: (item[1], -item[2]))
        coverage = sorted({name for item in picked for name in item.get("key_matching_ingredients", [])})
        reason = "Includes cleanser, serum, moisturizer and sunscreen; the bundle covers these routine steps and excludes known conflicting strong-active pairings."
        if coverage: reason += " Matching ingredients across the bundle: " + ", ".join(coverage) + "."
        bundles.append({"products": list(picked), "total_price_inr": total, "tier": tier, "best_value": True, "concern_coverage": coverage, "why_better": reason})
    return bundles
