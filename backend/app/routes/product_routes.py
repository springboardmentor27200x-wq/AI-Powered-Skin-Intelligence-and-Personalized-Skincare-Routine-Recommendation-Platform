from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..dependencies import get_current_user
from ..models import User, SkinProfile, Product, DailyCheckin
from ..services.product_engine import recommend_products, alternatives, build_combos, _cosine_rank

router = APIRouter(prefix="/api/products", tags=["Product Recommendations"])


def _profile(db, user):
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == user.id).first()
    if not profile: raise HTTPException(status_code=404, detail="Create your skin profile before requesting product recommendations.")
    return profile


def _catalog(db): return db.query(Product).all()


@router.get("/recommendations")
def product_recommendations(category: str | None = None, min_price_inr: float | None = Query(default=None, ge=0), max_price_inr: float | None = Query(default=None, ge=0), concern: str | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = _profile(db, current_user)
    latest = db.query(DailyCheckin).filter_by(user_id=current_user.id).order_by(DailyCheckin.date.desc()).first()
    low_hydration = bool(latest and latest.water_intake_liters < 1.5)
    products = recommend_products(_catalog(db), profile, budget=max_price_inr, min_price=min_price_inr, category=category, concern=concern, hydration_low=low_hydration)
    return {"products": products, "profile": {"skin_type": profile.skin_type, "concerns": profile.concerns, "budget_inr": max_price_inr if max_price_inr is not None else profile.budget_inr}, "hydration_nudge": "Your recent water intake is low; hydrating product matches are highlighted." if low_hydration else None}


@router.get("/combos")
def product_combos(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = _profile(db, current_user)
    ranked = recommend_products(_catalog(db), profile, use_llm=False)
    return {"combos": build_combos(ranked)}


@router.post("/compare")
def compare_product_list(product_ids: list[int], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _profile(db, current_user)
    if not product_ids: raise HTTPException(status_code=400, detail="Provide at least one product ID.")
    products = db.query(Product).filter(Product.id.in_(product_ids)).all()
    if not products: raise HTTPException(status_code=404, detail="No matching products found.")
    profile = _profile(db, current_user)
    scored = recommend_products(products, profile, use_llm=False)
    if scored:
        first_id = scored[0]["id"]
        first_product = next((p for p in products if p.id == first_id), products[0])
        from ..services.product_engine import _cosine_rank, _score
        scored_first = _score(first_product, profile, profile.budget_inr)
        safe_scores = [item for p in products if p.id != first_id if (item := _score(p, profile, profile.budget_inr))]
        ranked = _cosine_rank(scored_first, safe_scores)
        similarity = {item["id"]: round(float(value), 3) for item, value in ranked}
        for item in scored: item["similarity_to_first"] = 1.0 if item["id"] == first_id else similarity.get(item["id"], 0.0)
    return {"products": scored, "total_products": len(scored)}


@router.get("/{product_id}/alternatives")
def product_alternatives(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = _profile(db, current_user)
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product: raise HTTPException(status_code=404, detail="Product not found.")
    results = alternatives(product, _catalog(db), profile, profile.budget_inr)
    for item in results: item.pop("_text", None); item.pop("_safety", None)
    return {"alternatives": results}
