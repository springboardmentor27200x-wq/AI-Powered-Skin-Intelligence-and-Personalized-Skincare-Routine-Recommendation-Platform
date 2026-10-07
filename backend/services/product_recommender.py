import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from models import Product, SkinProfile

SEED_PRODUCTS = [
    {
        "name": "Hydrating Facial Cleanser",
        "brand": "CeraVe",
        "category": "Face Wash",
        "price": 16.99,
        "budget_tier": "Budget",
        "key_ingredients": ["Ceramides NP", "Hyaluronic Acid", "Glycerin"],
        "suitable_skin_types": ["Normal", "Dry", "Sensitive"],
        "target_concerns": ["Dry Skin", "Redness", "Sensitive Skin"],
        "rating": 4.8,
        "description": "Non-foaming hydrating cleanser formulated with 3 essential ceramides and hyaluronic acid to cleanse without stripping the skin barrier.",
        "image_url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300"
    },
    {
        "name": "Effaclar Purifying Foaming Gel",
        "brand": "La Roche-Posay",
        "category": "Face Wash",
        "price": 22.50,
        "budget_tier": "Mid-range",
        "key_ingredients": ["Zinc PCA", "Thermal Spring Water"],
        "suitable_skin_types": ["Oily", "Combination"],
        "target_concerns": ["Acne", "Oily Skin", "Uneven Skin Tone"],
        "rating": 4.7,
        "description": "Gently purifies oily skin, eliminates impurities and excess sebum while leaving the skin clean and fresh.",
        "image_url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300"
    },
    {
        "name": "Hydro Boost Water Gel",
        "brand": "Neutrogena",
        "category": "Moisturizer",
        "price": 19.99,
        "budget_tier": "Budget",
        "key_ingredients": ["Hyaluronic Acid", "Olive Extract", "Glycerin"],
        "suitable_skin_types": ["Oily", "Combination", "Normal"],
        "target_concerns": ["Dry Skin", "Oily Skin", "Fine Lines"],
        "rating": 4.6,
        "description": "Oil-free gel moisturizer that instantly quenches dry skin and keeps it smooth, supple and hydrated all day long.",
        "image_url": "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=300"
    },
    {
        "name": "PM Facial Moisturizing Lotion",
        "brand": "CeraVe",
        "category": "Moisturizer",
        "price": 18.50,
        "budget_tier": "Budget",
        "key_ingredients": ["Niacinamide", "Ceramides NP", "Hyaluronic Acid"],
        "suitable_skin_types": ["Normal", "Dry", "Oily", "Combination", "Sensitive"],
        "target_concerns": ["Redness", "Dry Skin", "Dark Spots", "Hyperpigmentation"],
        "rating": 4.8,
        "description": "Ultra-lightweight night cream that moisturizes throughout the night and helps restore the protective skin barrier.",
        "image_url": "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=300"
    },
    {
        "name": "UV Clear Broad-Spectrum SPF 46",
        "brand": "EltaMD",
        "category": "Sunscreen",
        "price": 41.00,
        "budget_tier": "Premium",
        "key_ingredients": ["Zinc Oxide (9.0%)", "Niacinamide (5%)", "Hyaluronic Acid"],
        "suitable_skin_types": ["Normal", "Oily", "Combination", "Sensitive"],
        "target_concerns": ["Acne", "Hyperpigmentation", "Redness", "Sensitive Skin"],
        "rating": 4.9,
        "description": "Oil-free sunscreen formulated with high-purity niacinamide to calm and protect sensitive skin types prone to breakouts and discoloration.",
        "image_url": "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=300"
    },
    {
        "name": "Anthelios Melt-in Milk SPF 60",
        "brand": "La Roche-Posay",
        "category": "Sunscreen",
        "price": 27.99,
        "budget_tier": "Mid-range",
        "key_ingredients": ["Cell-Ox Shield XL", "Senna Alata Extract", "Vitamin E"],
        "suitable_skin_types": ["Normal", "Dry", "Combination"],
        "target_concerns": ["Dry Skin", "Wrinkles", "Dark Spots"],
        "rating": 4.8,
        "description": "Fast-absorbing, non-greasy body and face sunscreen that provides broad-spectrum protection with antioxidant cell defense.",
        "image_url": "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=300"
    },
    {
        "name": "Niacinamide 10% + Zinc 1%",
        "brand": "The Ordinary",
        "category": "Serum",
        "price": 6.50,
        "budget_tier": "Budget",
        "key_ingredients": ["Niacinamide (10%)", "Zinc PCA (1%)"],
        "suitable_skin_types": ["Oily", "Combination", "Normal"],
        "target_concerns": ["Acne", "Oily Skin", "Hyperpigmentation", "Uneven Skin Tone"],
        "rating": 4.6,
        "description": "High-strength vitamin and mineral formula that targets blemishes, visible shine, and enlarged pores.",
        "image_url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300"
    },
    {
        "name": "Skin Perfecting 2% BHA Liquid Exfoliant",
        "brand": "Paula's Choice",
        "category": "Serum",
        "price": 35.00,
        "budget_tier": "Mid-range",
        "key_ingredients": ["Salicylic Acid (BHA 2%)", "Green Tea Extract", "Methylpropanediol"],
        "suitable_skin_types": ["Oily", "Combination", "Normal"],
        "target_concerns": ["Acne", "Oily Skin", "Uneven Skin Tone", "Dark Spots"],
        "rating": 4.9,
        "description": "Fluid leave-on exfoliant that unclogs pores, smooths wrinkles, and evens out skin tone remarkably fast.",
        "image_url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300"
    },
    {
        "name": "C E Ferulic Antioxidant Serum",
        "brand": "SkinCeuticals",
        "category": "Serum",
        "price": 182.00,
        "budget_tier": "Premium",
        "key_ingredients": ["L-Ascorbic Acid (15%)", "Alpha Tocopherol (1%)", "Ferulic Acid (0.5%)"],
        "suitable_skin_types": ["Normal", "Dry", "Combination"],
        "target_concerns": ["Wrinkles", "Fine Lines", "Hyperpigmentation", "Dark Spots"],
        "rating": 4.9,
        "description": "Synergistic antioxidant combination delivers advanced environmental protection and improves signs of photo-aging.",
        "image_url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300"
    },
    {
        "name": "Supple Preparation Unscented Toner",
        "brand": "Dear, Klairs",
        "category": "Toner",
        "price": 22.00,
        "budget_tier": "Mid-range",
        "key_ingredients": ["Hyaluronic Acid", "Centella Asiatica", "Beta-Glucan"],
        "suitable_skin_types": ["Normal", "Dry", "Sensitive", "Combination"],
        "target_concerns": ["Sensitive Skin", "Redness", "Dry Skin"],
        "rating": 4.8,
        "description": "Essential oil-free hydrating toner formulated with plant extracts and soothing ingredients to calm sensitive skin.",
        "image_url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300"
    },
    {
        "name": "Ultimate Nourishing Rice Overnight Spa Mask",
        "brand": "COSRX",
        "category": "Face Masks",
        "price": 18.00,
        "budget_tier": "Budget",
        "key_ingredients": ["Rice Extract (68%)", "Niacinamide", "Sunflower Seed Oil"],
        "suitable_skin_types": ["Normal", "Dry", "Sensitive", "Combination"],
        "target_concerns": ["Dry Skin", "Uneven Skin Tone", "Fine Lines"],
        "rating": 4.7,
        "description": "Enriched with 68% rice extract, this intensive nourishing sleeping mask leaves skin soft, clear, and deeply moisturized.",
        "image_url": "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=300"
    }
]


def seed_products_db(db: Session):
    """Populates products database if empty."""
    if db.query(Product).count() == 0:
        for item in SEED_PRODUCTS:
            prod = Product(
                name=item["name"],
                brand=item["brand"],
                category=item["category"],
                price=item["price"],
                budget_tier=item["budget_tier"],
                key_ingredients=json.dumps(item["key_ingredients"]),
                suitable_skin_types=json.dumps(item["suitable_skin_types"]),
                target_concerns=json.dumps(item["target_concerns"]),
                rating=item["rating"],
                description=item["description"],
                image_url=item["image_url"]
            )
            db.add(prod)
        db.commit()


def calculate_product_suitability(product: Product, user_profile: SkinProfile = None) -> Dict[str, Any]:
    """
    Calculates suitability score (0-100%) for a product against user skin profile.
    """
    if not user_profile:
        return {"score": 85.0, "reasons": ["Popular dermatologist-approved product."]}

    skin_type = user_profile.skin_type
    try:
        concerns = json.loads(user_profile.skin_concerns or "[]")
    except Exception:
        concerns = []

    allergies = (user_profile.allergies or "").lower()

    suitable_types = json.loads(product.suitable_skin_types or "[]")
    target_concerns = json.loads(product.target_concerns or "[]")
    key_ingredients = json.loads(product.key_ingredients or "[]")

    reasons = []
    base_score = 70.0

    # Skin Type Match (+15 pts)
    if skin_type in suitable_types:
        base_score += 15.0
        reasons.append(f"Ideal match for your {skin_type} skin type.")
    elif "Normal" in suitable_types:
        base_score += 8.0

    # Target Concerns Match (+5 pts per matched concern up to +15 pts)
    matched_concerns = [c for c in concerns if c in target_concerns]
    if matched_concerns:
        bonus = min(15.0, len(matched_concerns) * 7.5)
        base_score += bonus
        reasons.append(f"Specifically targets your concerns: {', '.join(matched_concerns)}.")

    # Allergy Check (-40 pts if allergen detected)
    for ing in key_ingredients:
        if allergies and allergies != "none" and ing.lower() in allergies:
            base_score -= 40.0
            reasons.append(f"⚠️ Contains ingredient '{ing}' matching your allergy report.")

    final_score = max(30.0, min(99.0, base_score))

    if not reasons:
        reasons.append("Formulated with gentle skin-nourishing ingredients.")

    return {
        "score": round(final_score, 1),
        "reasons": reasons
    }
