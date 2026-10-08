"""Create schema and load cleaned cosmetics plus ingredient reference data."""
import csv
import hashlib
import os
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
env_file = ROOT / "backend" / ".env"
if env_file.exists():
    for line in env_file.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"\''))
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.database import Base, SessionLocal, engine
from app.models import Product, Ingredient, IngredientConcern



def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        product_file = Path(os.getenv("CLEAN_PRODUCTS_CSV", ROOT / "backend" / "data" / "products_cleaned.csv"))
        ingredient_names = set()
        if product_file.exists():
            with product_file.open(encoding="utf-8-sig", newline="") as handle:
                for row in csv.DictReader(handle):
                    source_id = row.get("source_id") or hashlib.sha1(f"{row.get('Brand')}:{row.get('Name')}".encode()).hexdigest()
                    product = db.query(Product).filter_by(source_id=source_id).first() or Product(source_id=source_id)
                    product.name = row.get("Name", "").strip()
                    product.brand = row.get("Brand", "Unknown")
                    product.category = row.get("Label", "Other")
                    product.price_inr = float(row["Price_INR"]) if row.get("Price_INR") else None
                    product.rating = float(row["Rank"]) if row.get("Rank") else 0
                    product.ingredients = row.get("Ingredients", "")
                    ingredient_names.update(part.strip() for part in product.ingredients.split(",") if part.strip())
                    product.skin_types = ",".join(name for name, col in [("Combination", "Combination"), ("Dry", "Dry"), ("Normal", "Normal"), ("Oily", "Oily"), ("Sensitive", "Sensitive")] if row.get(col) == "1")
                    product.concerns = row.get("concerns", "")
                    product.allergens = row.get("allergens", "")
                    product.source = row.get("source", "Kaggle Sephora cosmetics.csv")
                    db.add(product)
        existing_ingredients = {name for (name,) in db.query(Ingredient.name).all()}
        new_ingredients = ingredient_names - existing_ingredients
        db.add_all(Ingredient(name=name) for name in sorted(new_ingredients))
        existing_ingredients.update(new_ingredients)
        reference = ROOT / "backend" / "data" / "ingredient_concerns.csv"
        if reference.exists():
            with reference.open(encoding="utf-8-sig", newline="") as handle:
                for row in csv.DictReader(handle):
                    if not db.query(IngredientConcern).filter_by(ingredient=row["ingredient"], concern=row["concern"]).first(): db.add(IngredientConcern(**row))
                    name = row["ingredient"].strip()
                    if name not in existing_ingredients:
                        db.add(Ingredient(name=name))
                        existing_ingredients.add(name)
        db.commit()
        print(f"Seed complete: {db.query(Product).count()} products, {db.query(Ingredient).count()} ingredients, {db.query(IngredientConcern).count()} ingredient-concern rows.")
    finally:
        db.close()


if __name__ == "__main__": seed()
