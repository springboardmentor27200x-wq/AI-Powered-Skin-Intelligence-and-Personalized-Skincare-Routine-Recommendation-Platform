from datetime import datetime, timezone
from typing import List, Dict, Any

class ProductService:
    def __init__(self):
        # Mock product catalog for Milestone 3
        self.catalog = [
            {
                "name": "CeraVe Hydrating Cleanser",
                "brand": "CeraVe",
                "category": "Cleanser",
                "key_ingredients": ["Ceramides", "Hyaluronic Acid", "Glycerin"],
                "price_range": "$10-$20",
                "suitability": ["NORMAL", "DRY", "SENSITIVE"]
            },
            {
                "name": "La Roche-Posay Purifying Foaming Cleanser",
                "brand": "La Roche-Posay",
                "category": "Cleanser",
                "key_ingredients": ["Niacinamide", "Ceramides"],
                "price_range": "$15-$25",
                "suitability": ["OILY", "COMBINATION", "ACNE_PRONE"]
            },
            {
                "name": "Paula's Choice 2% BHA",
                "brand": "Paula's Choice",
                "category": "Exfoliant",
                "key_ingredients": ["Salicylic Acid (BHA)", "Green Tea Extract"],
                "price_range": "$30-$40",
                "suitability": ["OILY", "ACNE_PRONE", "COMBINATION"]
            },
            {
                "name": "The Ordinary Niacinamide 10% + Zinc 1%",
                "brand": "The Ordinary",
                "category": "Serum",
                "key_ingredients": ["Niacinamide", "Zinc PCA"],
                "price_range": "< $10",
                "suitability": ["OILY", "ACNE_PRONE"]
            },
            {
                "name": "Mad Hippie Vitamin C Serum",
                "brand": "Mad Hippie",
                "category": "Serum",
                "key_ingredients": ["Vitamin C", "Vitamin E", "Ferulic Acid"],
                "price_range": "$25-$35",
                "suitability": ["NORMAL", "DRY", "COMBINATION", "AGING"]
            },
            {
                "name": "Neutrogena Hydro Boost Water Gel",
                "brand": "Neutrogena",
                "category": "Moisturizer",
                "key_ingredients": ["Hyaluronic Acid", "Dimethicone"],
                "price_range": "$15-$25",
                "suitability": ["OILY", "COMBINATION"]
            },
            {
                "name": "Vanicream Daily Facial Moisturizer",
                "brand": "Vanicream",
                "category": "Moisturizer",
                "key_ingredients": ["Ceramides", "Hyaluronic Acid", "Squalane"],
                "price_range": "$10-$20",
                "suitability": ["DRY", "SENSITIVE", "NORMAL"]
            },
            {
                "name": "EltaMD UV Clear Broad-Spectrum SPF 46",
                "brand": "EltaMD",
                "category": "Sunscreen",
                "key_ingredients": ["Zinc Oxide", "Niacinamide", "Hyaluronic Acid"],
                "price_range": "$35-$45",
                "suitability": ["ACNE_PRONE", "SENSITIVE", "NORMAL", "OILY"]
            },
            {
                "name": "Kiehl's Calendula Herbal-Extract Toner",
                "brand": "Kiehl's",
                "category": "Toner",
                "key_ingredients": ["Calendula", "Allantoin"],
                "price_range": "$40-$50",
                "suitability": ["NORMAL", "OILY"]
            },
            {
                "name": "Differin Adapalene Gel 0.1%",
                "brand": "Differin",
                "category": "Treatment Products",
                "key_ingredients": ["Adapalene"],
                "price_range": "$10-$20",
                "suitability": ["ACNE_PRONE", "OILY"]
            },
            {
                "name": "Glow Recipe Watermelon Glow Sleeping Mask",
                "brand": "Glow Recipe",
                "category": "Face Masks",
                "key_ingredients": ["Hyaluronic Acid", "AHA"],
                "price_range": "$30-$40",
                "suitability": ["DRY", "NORMAL"]
            },
        ]
        
        self.ingredients_db = [
            {
                "name": "Niacinamide",
                "category": "Barrier Repair / Brightening",
                "comedogenic_rating": 0,
                "irritancy_level": "Low",
                "safety_status": "Safe",
                "description": "Vitamin B3 derivative that helps build keratin, reduces inflammation, and regulates sebum."
            },
            {
                "name": "Salicylic Acid (BHA)",
                "category": "Exfoliant",
                "comedogenic_rating": 0,
                "irritancy_level": "Moderate",
                "safety_status": "Safe (up to 2% OTC)",
                "description": "Lipophilic acid that penetrates pores to dissolve dead skin cells and sebum."
            },
            {
                "name": "Ceramides",
                "category": "Lipids",
                "comedogenic_rating": 0,
                "irritancy_level": "None",
                "safety_status": "Safe",
                "description": "Lipids found naturally in skin to help form skin barrier and retain moisture."
            },
            {
                "name": "Hyaluronic Acid",
                "category": "Humectant",
                "comedogenic_rating": 0,
                "irritancy_level": "None",
                "safety_status": "Safe",
                "description": "Powerful humectant capable of holding 1000x its weight in water."
            },
            {
                "name": "Coconut Oil",
                "category": "Emollient",
                "comedogenic_rating": 4,
                "irritancy_level": "Low",
                "safety_status": "Safe",
                "description": "Rich in fatty acids but highly comedogenic; often causes breakouts in acne-prone skin."
            },
            {
                "name": "Isopropyl Myristate",
                "category": "Texture Enhancer / Emollient",
                "comedogenic_rating": 5,
                "irritancy_level": "Low",
                "safety_status": "Safe",
                "description": "Improves product spreadability but is notoriously known to clog pores and exacerbate acne."
            },
            {
                "name": "Retinoids",
                "category": "Vitamin A Derivative",
                "comedogenic_rating": 0,
                "irritancy_level": "High",
                "safety_status": "Safe (Avoid in pregnancy)",
                "description": "Promotes cell turnover and stimulates collagen production. Can cause initial purging and dryness."
            },
            {
                "name": "Vitamin C",
                "category": "Antioxidant",
                "comedogenic_rating": 0,
                "irritancy_level": "Moderate",
                "safety_status": "Safe",
                "description": "Brightens skin and protects against free radical damage. Can be irritating at high concentrations."
            },
            {
                "name": "Peptides",
                "category": "Proteins",
                "comedogenic_rating": 0,
                "irritancy_level": "None",
                "safety_status": "Safe",
                "description": "Short chains of amino acids that act as building blocks of proteins such as collagen, elastin and keratin."
            },
            {
                "name": "AHAs",
                "category": "Exfoliant",
                "comedogenic_rating": 0,
                "irritancy_level": "Moderate",
                "safety_status": "Safe",
                "description": "Water-soluble acids that peel away the surface of your skin so that new, more evenly pigmented skin cells may generate."
            }
        ]

    def get_all_ingredients(self, profile: dict = None):
        res = []
        allergies = [a.lower() for a in profile.get("allergies", [])] if profile else []
        skin_type = profile.get("skin_type", "NORMAL").upper() if profile else "NORMAL"
        concerns = [c.lower() for c in profile.get("concerns", [])] if profile else []
        
        interactions_map = {
            "Retinoids": ["Vitamin C", "AHAs", "Salicylic Acid (BHA)"],
            "Vitamin C": ["Retinoids", "AHAs", "Niacinamide (if not formulated together)"],
            "AHAs": ["Retinoids", "Vitamin C"],
            "Salicylic Acid (BHA)": ["Retinoids"]
        }
        
        for ing in self.ingredients_db:
            new_ing = dict(ing)
            new_ing["interactions"] = interactions_map.get(ing["name"], [])
            
            # Allergy Detection
            new_ing["allergy_alert"] = any(al in ing["name"].lower() for al in allergies)
            
            # Suitability Assessment
            if new_ing["allergy_alert"]:
                new_ing["user_suitability"] = "Avoid (Allergy)"
            elif ing["comedogenic_rating"] >= 4 and skin_type in ["OILY", "ACNE_PRONE"]:
                new_ing["user_suitability"] = "Use with Caution"
            elif ing["irritancy_level"] in ["High", "Moderate"] and skin_type == "SENSITIVE":
                new_ing["user_suitability"] = "Use with Caution"
            elif ing["name"] in ["Salicylic Acid (BHA)", "Retinoids"] and "acne" in concerns:
                new_ing["user_suitability"] = "Highly Recommended"
            elif ing["name"] in ["Ceramides", "Hyaluronic Acid"] and skin_type == "DRY":
                new_ing["user_suitability"] = "Highly Recommended"
            elif ing["name"] in ["Peptides", "Vitamin C", "Retinoids"] and "aging" in concerns:
                new_ing["user_suitability"] = "Highly Recommended"
            else:
                new_ing["user_suitability"] = "Suitable"
                
            res.append(new_ing)
            
        return res

    def parse_price(self, price_str):
        if "<" in price_str:
            return float(price_str.replace("<", "").replace("$", "").strip())
        prices = [float(p.replace("$", "").strip()) for p in price_str.split("-")]
        return sum(prices) / len(prices) if prices else 0.0

    def recommend_products(self, user_id: int, profile: dict, max_budget: float = None) -> dict:
        skin_type = profile.get("skin_type", "NORMAL").upper()
        concerns = [c.lower() for c in profile.get("concerns", [])]
        allergies = [a.lower() for a in profile.get("allergies", [])]
        
        recommendations = []
        for prod in self.catalog:
            suitability_score = 50
            match_reason = ""
            
            allergic_conflict = False
            for allergy in allergies:
                for key_ing in prod["key_ingredients"]:
                    if allergy in key_ing.lower():
                        allergic_conflict = True
                        break
                if allergic_conflict: break
            if allergic_conflict: continue
                
            if skin_type in prod["suitability"]:
                suitability_score += 20
                match_reason += f"Great for {skin_type} skin. "
            
            if any(c in concerns for c in ["acne", "pimple", "breakout"]) and "ACNE_PRONE" in prod["suitability"]:
                suitability_score += 20
                match_reason += "Targets acne. "
                
            if any(c in concerns for c in ["aging", "wrinkle"]) and "AGING" in prod["suitability"]:
                suitability_score += 20
                match_reason += "Anti-aging properties. "
                
            if any(c in concerns for c in ["sensitive", "redness"]) and "SENSITIVE" in prod["suitability"]:
                suitability_score += 15
                match_reason += "Safe for sensitive skin. "

            # Budget filter
            prod_price = self.parse_price(prod["price_range"])
            if max_budget and prod_price > max_budget:
                continue

            if suitability_score > 60:
                recommendations.append({
                    "product": prod,
                    "suitability_score": min(suitability_score, 98),
                    "match_reason": match_reason.strip() or f"Matches {skin_type} profile.",
                    "price_estimate": prod["price_range"]
                })
                
        recommendations.sort(key=lambda x: x["suitability_score"], reverse=True)
        
        # Add alternative product suggestions (same category, different product)
        for r in recommendations:
            cat = r["product"]["category"]
            alts = [p for p in self.catalog if p["category"] == cat and p["name"] != r["product"]["name"]]
            if alts:
                r["alternatives"] = [{"name": alt["name"], "price": alt["price_range"]} for alt in alts[:2]]
            else:
                r["alternatives"] = []
        
        from datetime import datetime, timezone
        return {
            "user_id": user_id,
            "recommended_products": recommendations[:5],
            "generated_at": datetime.now(timezone.utc)
        }

    def compare_products(self, product_names: list) -> dict:
        products = [p for p in self.catalog if p["name"] in product_names]
        if not products:
            return {"error": "Products not found"}
        
        comparison = {
            "ingredients_diff": {},
            "price_comparison": {},
            "suitability_overlap": []
        }
        
        for p in products:
            comparison["ingredients_diff"][p["name"]] = p["key_ingredients"]
            comparison["price_comparison"][p["name"]] = p["price_range"]
            
        # Find common suitability
        if len(products) > 1:
            common_suit = set(products[0]["suitability"])
            for p in products[1:]:
                common_suit = common_suit.intersection(set(p["suitability"]))
            comparison["suitability_overlap"] = list(common_suit)
            
        return {"comparisons": comparison}

product_service = ProductService()
