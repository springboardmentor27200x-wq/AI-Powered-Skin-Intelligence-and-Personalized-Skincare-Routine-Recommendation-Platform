import uuid

from pydantic import BaseModel


class IngredientOut(BaseModel):
    id: uuid.UUID
    name: str
    category: str
    description: str
    benefits: str
    caution_notes: str | None

    class Config:
        from_attributes = True


class ConflictOut(BaseModel):
    name: str
    reason: str


class IngredientDetailOut(IngredientOut):
    conflicts: list[ConflictOut]


class IngredientSuitabilityOut(BaseModel):
    ingredient_id: uuid.UUID
    name: str
    category: str
    status: str  # suitable | caution | avoid
    reasons: list[str]