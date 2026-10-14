from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.skin_profile import SkinProfile
from app.models.skin_assessment import SkinAssessment
from app.models.product import Product, ProductIngredient
from app.models.ingredient import Ingredient
from app.schemas.product import ProductOut, ProductDetailOut, ProductRecommendationOut
from app.services.ingredient_engine import assess_ingredient_suitability
from app.services.product_engine import score_product

router = APIRouter(prefix="/products", tags=["products"])


def _product_ingredients(db: Session, product_id) -> list[Ingredient]:
    return (
        db.query(Ingredient)
        .join(ProductIngredient, ProductIngredient.ingredient_id == Ingredient.id)
        .filter(ProductIngredient.product_id == product_id)
        .all()
    )


def _to_detail(product: Product, ingredients: list[Ingredient]) -> ProductDetailOut:
    return ProductDetailOut(
        id=product.id, name=product.name, category=product.category, brand=product.brand,
        price=float(product.price), description=product.description, skin_types=product.skin_types,
        ingredients=[i.name for i in ingredients],
    )


def _score_for_user(db: Session, product: Product, profile: SkinProfile, prioritized_concerns: list[str]) -> tuple[int, list[str], list[Ingredient]]:
    ingredients = _product_ingredients(db, product.id)
    statuses = {}
    for ing in ingredients:
        result_status, _ = assess_ingredient_suitability(
            ing, profile.allergies or [], profile.sensitivities or [], profile.skin_type
        )
        statuses[ing.name] = result_status
    names_categories = [(i.name, i.category) for i in ingredients]
    score, reasons = score_product(
        product.skin_types, names_categories, statuses, profile.skin_type, prioritized_concerns
    )
    return score, reasons, ingredients


def _latest_concerns(db: Session, user_id) -> list[str]:
    latest = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == user_id)
        .order_by(SkinAssessment.created_at.desc())
        .first()
    )
    return latest.prioritized_concerns if latest else []


# --- Specific paths FIRST — these must be registered before /{product_id} ---


@router.get("/me/recommendations", response_model=list[ProductRecommendationOut])
def get_my_recommendations(
    category: str | None = None,
    max_price: float | None = Query(default=None, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = (
        db.query(SkinProfile)
        .filter(SkinProfile.user_id == current_user.id)
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Create a skin profile first",
        )

    prioritized_concerns = _latest_concerns(db, current_user.id)

    query = db.query(Product)

    if category:
        query = query.filter(Product.category == category)

    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    products = query.all()
    results = []

    for product in products:
        score, reasons, ingredients = _score_for_user(
            db, product, profile, prioritized_concerns
        )

        # Do not recommend products containing ingredients
        # identified as conflicting with the user's allergies.
        if any(
            "conflicts with your allergies" in reason.lower()
            for reason in reasons
        ):
            continue

        detail = _to_detail(product, ingredients)

        results.append(
            ProductRecommendationOut(
                **detail.model_dump(),
                score=score,
                reasons=reasons,
            )
        )

    # Sort all eligible products before applying the limit.
    results.sort(key=lambda item: item.score, reverse=True)

    return results[:limit]



@router.get("/compare", response_model=list[ProductRecommendationOut])
def compare_products(
    ids: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Create a skin profile first")

    id_list = [i.strip() for i in ids.split(",") if i.strip()]
    if len(id_list) < 2:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide at least 2 product ids, comma-separated")

    prioritized_concerns = _latest_concerns(db, current_user.id)
    results = []
    for pid in id_list:
        product = db.query(Product).filter(Product.id == pid).first()
        if not product:
            continue
        score, reasons, ingredients = _score_for_user(db, product, profile, prioritized_concerns)
        detail = _to_detail(product, ingredients)
        results.append(ProductRecommendationOut(**detail.model_dump(), score=score, reasons=reasons))

    return results


# --- Generic /{product_id} paths LAST ---

@router.get("", response_model=list[ProductOut])
def list_products(category: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Product)
    if category:
        query = query.filter(Product.category == category)
    return query.order_by(Product.category, Product.name).all()


@router.get("/{product_id}", response_model=ProductDetailOut)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return _to_detail(product, _product_ingredients(db, product.id))



@router.get("/{product_id}/alternatives", response_model=list[ProductRecommendationOut])
def get_alternatives(
    product_id: str,
    limit: int = Query(default=3, ge=1, le=10),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = (
        db.query(SkinProfile)
        .filter(SkinProfile.user_id == current_user.id)
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Create a skin profile first",
        )

    target = db.query(Product).filter(Product.id == product_id).first()

    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    prioritized_concerns = _latest_concerns(db, current_user.id)

    others = (
        db.query(Product)
        .filter(
            Product.category == target.category,
            Product.id != target.id,
        )
        .all()
    )

    results = []

    for product in others:
        score, reasons, ingredients = _score_for_user(
            db, product, profile, prioritized_concerns
        )

        # Exclude products identified as conflicting with allergies.
        if any(
            "conflicts with your allergies" in reason.lower()
            for reason in reasons
        ):
            continue

        detail = _to_detail(product, ingredients)

        results.append(
            ProductRecommendationOut(
                **detail.model_dump(),
                score=score,
                reasons=reasons,
            )
        )

    # Sort eligible alternatives by score, highest first.
    results.sort(key=lambda item: item.score, reverse=True)

    return results[:limit]
