from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.product import Product
from models.skin_profile import SkinProfile
from schemas import ProductOut, ProductBase
from utils.auth import get_current_user
from models.user import User
from ml.product_recommender import recommend_products, get_ingredient_analysis

router = APIRouter(
    prefix="/api/products",
    tags=["Products & Recommendations"]
)

@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def add_product(product: ProductBase, db: Session = Depends(get_db)):
    """Add a new product to the database (Admin/Internal use)."""
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.get("/", response_model=List[ProductOut])
def get_all_products(db: Session = Depends(get_db)):
    """Get all available products."""
    return db.query(Product).filter(Product.is_active == True).all()

@router.get("/recommendations", response_model=List[ProductOut])
def get_product_recommendations_api(
    budget: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get personalized product recommendations based on user's skin profile."""
    # 1. Get user profile
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Skin profile not found. Please complete profile first.")
        
    # 2. Get all active products
    all_products = db.query(Product).filter(Product.is_active == True).all()
    
    # 3. Generate recommendations
    recommended = recommend_products(profile, all_products)
    
    # 4. Filter by budget if provided
    if budget and budget != "Any":
        recommended = [p for p in recommended if p.price == budget]
        
    return recommended

@router.get("/{product_id}/analysis")
def analyze_product_ingredients(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze a specific product's ingredients against user's allergies."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    allergies = profile.allergies if profile else []
    analysis = get_ingredient_analysis(product.ingredients, allergies)
    return analysis

@router.get("/compare")
def compare_products(
    product_ids: str,
    db: Session = Depends(get_db)
):
    """Compare multiple products by IDs (comma separated)."""
    ids = [int(pid) for pid in product_ids.split(",") if pid.isdigit()]
    products = db.query(Product).filter(Product.id.in_(ids)).all()
    
    if len(products) < 2:
        raise HTTPException(status_code=400, detail="Please provide at least 2 valid product IDs to compare.")
        
    comparison = []
    for p in products:
        comparison.append({
            "id": p.id,
            "name": p.name,
            "brand": p.brand,
            "price": p.price,
            "category": p.category,
            "key_ingredients": p.ingredients,
            "target_concerns": p.target_concerns,
            "suitable_skin_types": p.target_skin_types
        })
    return {"comparison": comparison}

@router.get("/{product_id}/alternatives")
def get_product_alternatives(
    product_id: int,
    budget_limit: float = None,
    db: Session = Depends(get_db)
):
    """Get alternative product suggestions, optionally filtered by budget."""
    target_product = db.query(Product).filter(Product.id == product_id).first()
    if not target_product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    query = db.query(Product).filter(
        Product.id != product_id,
        Product.category == target_product.category
    )
    
    if budget_limit:
        query = query.filter(Product.price <= budget_limit)
        
    alternatives = query.limit(5).all()
    return {"target_product": target_product.name, "alternatives": alternatives}

