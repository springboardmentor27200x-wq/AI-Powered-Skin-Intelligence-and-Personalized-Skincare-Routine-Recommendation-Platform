"""
Seed Product + Ingredient tables from the existing products.json
Run:  python seed_products.py
"""

import json
from pathlib import Path

from app import create_app, db
from app.models import Product, Ingredient, ProductIngredient, ProductSkinType, ProductConcern

app = create_app()

JSON_PATH = Path("app/ml/products.json")


def get_or_create_ingredient(name: str):
    name = name.strip().lower().replace(" ", "_")
    ing = Ingredient.query.filter_by(name=name).first()
    if not ing:
        ing = Ingredient(
            name=name,
            display_name=name.replace("_", " ").title(),
            benefits="",
            cautions="",
            good_for="[]",
            avoid_for="[]",
        )
        db.session.add(ing)
        db.session.flush()
    return ing


def seed():
    if not JSON_PATH.exists():
        print(f"File not found: {JSON_PATH}")
        return

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        products_data = json.load(f)

    print(f"Loaded {len(products_data)} products from JSON")

    created = 0
    for p in products_data:
        # Skip if product already exists
        existing = Product.query.filter_by(name=p["name"]).first()
        if existing:
            continue

        product = Product(
            name=p.get("name"),
            brand=p.get("brand"),
            category=p.get("category"),
            subcategory=p.get("subcategory"),
            texture=p.get("texture"),
            price=p.get("price"),
            price_tier=p.get("price_tier"),
            currency=p.get("currency", "INR"),
            rating=p.get("rating"),
            num_reviews=p.get("num_reviews", 0),
            comedogenic_rating=p.get("comedogenic_rating"),
            fragrance_free=p.get("fragrance_free", False),
            alcohol_free=p.get("alcohol_free", False),
            routine_step=p.get("routine_step"),
            time_of_use=",".join(p.get("time_of_use", [])) if isinstance(p.get("time_of_use"), list) else p.get("time_of_use"),
            description=p.get("description"),
            is_active=True,
        )
        db.session.add(product)
        db.session.flush()  # get product.id

        # Key ingredients
        for ing_name in p.get("key_ingredients", []):
            ingredient = get_or_create_ingredient(ing_name)
            link = ProductIngredient(
                product_id=product.id,
                ingredient_id=ingredient.id,
                is_key_ingredient=True,
            )
            db.session.add(link)

        # Skin types
        for st in p.get("skin_types", []):
            db.session.add(ProductSkinType(
                product_id=product.id,
                skin_type=st.lower()
            ))

        # Concerns
        for c in p.get("concerns", []):
            db.session.add(ProductConcern(
                product_id=product.id,
                concern=c.lower()
            ))

        created += 1

    db.session.commit()
    print(f"Seeded {created} new products successfully.")


if __name__ == "__main__":
    with app.app_context():
        seed()