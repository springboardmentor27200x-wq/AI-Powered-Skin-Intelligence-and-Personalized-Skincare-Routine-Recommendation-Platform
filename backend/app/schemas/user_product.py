import uuid
from datetime import date

from pydantic import BaseModel, Field


class UserProductIn(BaseModel):
    product_id: uuid.UUID
    lasts_days: int | None = Field(default=None, ge=7, le=365)  # omit to use the category default


class UserProductOut(BaseModel):
    product_id: uuid.UUID
    name: str
    brand: str | None
    category: str
    price: float
    started_on: date
    lasts_days: int
    days_left: int      # negative once it should have run out
    status: str         # ok | low | empty