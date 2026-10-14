import uuid

from pydantic import BaseModel


class ProductOut(BaseModel):
    id: uuid.UUID
    name: str
    category: str
    brand: str | None
    price: float
    description: str
    skin_types: list[str]

    class Config:
        from_attributes = True


class ProductDetailOut(ProductOut):
    ingredients: list[str]


class ProductRecommendationOut(ProductDetailOut):
    score: int
    reasons: list[str]