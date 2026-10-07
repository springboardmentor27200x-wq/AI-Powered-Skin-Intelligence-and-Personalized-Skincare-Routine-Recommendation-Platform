import json
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, Product, SkinProfile
from schemas import ProductResponse, ProductComparisonRequest
from auth import get_current_user
from services.product_recommender import seed_products_db, calculate_product_suitability

router = APIRouter()


def serialize_product(prod: Product, suitability: dict = None) -> dict:
    data = {
        "id": prod.id,
        "name": prod.name,
        "brand": prod.brand,
        "category": prod.category,
        "price": prod.price,
        "budget_tier": prod.budget_tier,
        "key_ingredients": json.loads(prod.key_ingredients or "[]"),
        "suitable_skin_types": json.loads(prod.suitable_skin_types or "[]"),
        "target_concerns": json.loads(prod.target_concerns or "[]"),
        "rating": prod.rating,
        "description": prod.description or "",
        "image_url": prod.image_url or "",
    }
    if suitability:
        data["suitability_score"] = suitability["score"]
        data["suitability_reasons"] = suitability["reasons"]
    return data


@router.get("/recommendations", response_model=List[ProductResponse])
def get_product_recommendations(
    category: Optional[str] = Query(None),
    budget_tier: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seed_products_db(db)
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == user.id).first()

    query = db.query(Product)
    if category and category != "All":
        query = query.filter(Product.category == category)
    if budget_tier and budget_tier != "All":
        query = query.filter(Product.budget_tier == budget_tier)

    products = query.all()

    results = []
    for p in products:
        suitability = calculate_product_suitability(p, profile)
        results.append(serialize_product(p, suitability))

    # Sort products by highest suitability score
    results.sort(key=lambda x: x["suitability_score"] or 0, reverse=True)
    return results


@router.post("/compare", response_model=List[ProductResponse])
def compare_products(
    data: ProductComparisonRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seed_products_db(db)
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == user.id).first()

    products = db.query(Product).filter(Product.id.in_(data.product_ids)).all()
    results = []
    for p in products:
        suitability = calculate_product_suitability(p, profile)
        results.append(serialize_product(p, suitability))

    return results
