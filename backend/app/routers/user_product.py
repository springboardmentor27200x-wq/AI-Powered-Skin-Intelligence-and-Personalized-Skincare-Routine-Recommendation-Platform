import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import require_roles
from app.models.product import Product
from app.models.user import User, UserRole
from app.models.user_product import UserProduct
from app.schemas.user_product import UserProductIn, UserProductOut
from app.services.product_usage import days_remaining, default_lasts_days, product_status

router = APIRouter(prefix="/my-products", tags=["my-products"])

require_user = require_roles(UserRole.user)


def _out(entry: UserProduct, name, brand, category, price, today: date) -> UserProductOut:
    left = days_remaining(entry.started_on, entry.lasts_days, today)
    return UserProductOut(
        product_id=entry.product_id,
        name=name,
        brand=brand,
        category=category,
        price=float(price),
        started_on=entry.started_on,
        lasts_days=entry.lasts_days,
        days_left=left,
        status=product_status(left),
    )


@router.get("", response_model=list[UserProductOut])
def list_my_products(current_user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Products I'm using, running-out-soonest first."""
    today = date.today()
    rows = (
        db.query(UserProduct, Product.name, Product.brand, Product.category, Product.price)
        .join(Product, Product.id == UserProduct.product_id)
        .filter(UserProduct.user_id == current_user.id)
        .all()
    )
    result = [_out(entry, name, brand, category, price, today) for entry, name, brand, category, price in rows]
    result.sort(key=lambda p: p.days_left)
    return result


@router.post("", response_model=UserProductOut)
def start_using_product(
    payload: UserProductIn,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Start tracking a product. Doing it again for the same product restarts its timer
    (e.g. you bought a new one)."""
    product = (
        db.query(Product.id, Product.name, Product.brand, Product.category, Product.price)
        .filter(Product.id == payload.product_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    today = date.today()
    entry = (
        db.query(UserProduct)
        .filter(UserProduct.user_id == current_user.id, UserProduct.product_id == payload.product_id)
        .first()
    )
    if entry is None:
        entry = UserProduct(
            user_id=current_user.id,
            product_id=payload.product_id,
            started_on=today,
            lasts_days=payload.lasts_days or default_lasts_days(product.category),
        )
        db.add(entry)
    else:
        entry.started_on = today
        if payload.lasts_days:
            entry.lasts_days = payload.lasts_days  # otherwise keep the lifespan they chose before

    db.commit()
    db.refresh(entry)
    return _out(entry, product.name, product.brand, product.category, product.price, today)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def stop_using_product(
    product_id: uuid.UUID,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(UserProduct)
        .filter(UserProduct.user_id == current_user.id, UserProduct.product_id == product_id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="You're not tracking that product")
    db.delete(entry)
    db.commit()