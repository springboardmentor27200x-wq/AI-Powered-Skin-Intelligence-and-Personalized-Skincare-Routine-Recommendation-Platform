from app import db
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default="user")  # user, consultant, dermatologist, admin
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # One user can have one skin profile
    skin_profile = db.relationship("SkinProfile", backref="user", uselist=False)

class SkinProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    # ===== Skin Profile =====
    skin_type = db.Column(db.String(50))
    age_group = db.Column(db.String(20))
    skin_concerns = db.Column(db.Text)
    allergies = db.Column(db.Text)
    sensitivities = db.Column(db.Text)
    selected_dermatologist = db.Column(db.String(100))


    # ===== Sleep Tracking =====
    sleep_hours = db.Column(db.String(20))
    sleep_quality = db.Column(db.String(20))

    # ===== Lifestyle Tracking =====
    stress_level = db.Column(db.String(20))
    exercise_frequency = db.Column(db.String(20))

    # ===== Hydration Tracking =====
    water_intake_level = db.Column(db.String(20))
    average_water_intake = db.Column(db.String(20))   # in liters

    # ===== Environmental Exposure =====
    environmental_exposure = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
class DailyChecklist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    date = db.Column(db.String(20), nullable=False)          # format: YYYY-MM-DD
    item = db.Column(db.String(200), nullable=False)
    is_completed = db.Column(db.Boolean, default=False)
    period = db.Column(db.String(20))                        # morning / evening
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ScoreHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    summary = db.Column(db.Text)
    date = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ClinicalRecommendation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    notes = db.Column(db.Text, nullable=False)
    routine_adjustment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Prescription(db.Model):
    __tablename__ = "prescriptions"
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    medication = db.Column(db.String(200), nullable=False)
    dosage = db.Column(db.String(100), nullable=False)
    frequency = db.Column(db.String(100), nullable=False)
    instructions = db.Column(db.Text)
    duration_days = db.Column(db.Integer, default=30)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "doctor_id": self.doctor_id,
            "medication": self.medication,
            "dosage": self.dosage,
            "frequency": self.frequency,
            "instructions": self.instructions,
            "duration_days": self.duration_days,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M") if self.created_at else "",
        }

# ============================================================
# Product Intelligence Models
# ============================================================

class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    brand = db.Column(db.String(120))
    category = db.Column(db.String(80))          # Cleanser, Serum, Moisturizer, Sunscreen...
    subcategory = db.Column(db.String(80))
    texture = db.Column(db.String(50))           # gel, cream, serum, lotion...
    price = db.Column(db.Float)
    price_tier = db.Column(db.String(20))        # budget, mid, premium
    currency = db.Column(db.String(10), default="INR")
    rating = db.Column(db.Float)
    num_reviews = db.Column(db.Integer, default=0)
    comedogenic_rating = db.Column(db.Integer)   # 0–5
    fragrance_free = db.Column(db.Boolean, default=False)
    alcohol_free = db.Column(db.Boolean, default=False)
    routine_step = db.Column(db.String(50))      # cleanser, serum, moisturizer...
    time_of_use = db.Column(db.String(50))       # AM, PM, Both
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    # Relationships
    ingredients = db.relationship(
        "ProductIngredient",
        back_populates="product",
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "brand": self.brand,
            "category": self.category,
            "subcategory": self.subcategory,
            "texture": self.texture,
            "price": self.price,
            "price_tier": self.price_tier,
            "currency": self.currency,
            "rating": self.rating,
            "num_reviews": self.num_reviews,
            "comedogenic_rating": self.comedogenic_rating,
            "fragrance_free": self.fragrance_free,
            "alcohol_free": self.alcohol_free,
            "routine_step": self.routine_step,
            "time_of_use": self.time_of_use,
            "description": self.description,
            "key_ingredients": [
                pi.ingredient.name for pi in self.ingredients if pi.is_key_ingredient
            ],
        }


class Ingredient(db.Model):
    __tablename__ = "ingredients"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)   # canonical: niacinamide
    display_name = db.Column(db.String(120))                        # Niacinamide
    benefits = db.Column(db.Text)                                   # JSON string or plain text
    cautions = db.Column(db.Text)
    good_for = db.Column(db.Text)                                   # JSON list of concerns
    avoid_for = db.Column(db.Text)                                  # JSON list
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    products = db.relationship(
        "ProductIngredient",
        back_populates="ingredient",
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "display_name": self.display_name or self.name.title(),
            "benefits": self.benefits,
            "cautions": self.cautions,
            "good_for": self.good_for,
            "avoid_for": self.avoid_for,
        }


class ProductIngredient(db.Model):
    __tablename__ = "product_ingredients"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    ingredient_id = db.Column(db.Integer, db.ForeignKey("ingredients.id"), nullable=False)
    is_key_ingredient = db.Column(db.Boolean, default=True)
    concentration = db.Column(db.String(50))     # e.g. "10%", "0.3%"

    product = db.relationship("Product", back_populates="ingredients")
    ingredient = db.relationship("Ingredient", back_populates="products")

class ProductSkinType(db.Model):
    __tablename__ = "product_skin_types"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    skin_type = db.Column(db.String(50), nullable=False)   # oily, dry, combination...


class ProductConcern(db.Model):
    __tablename__ = "product_concerns"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    concern = db.Column(db.String(80), nullable=False)     # acne, hyperpigmentation...