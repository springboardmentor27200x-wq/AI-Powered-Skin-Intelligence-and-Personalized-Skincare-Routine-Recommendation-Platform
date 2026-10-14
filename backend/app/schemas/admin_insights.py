import uuid

from pydantic import BaseModel


class MonitoredProduct(BaseModel):
    product_id: uuid.UUID
    name: str
    category: str
    brand: str | None
    times_recommended: int    # users for whom this product scores at/above the threshold
    average_score: float
    allergen_conflicts: int   # users whose allergies conflict with an ingredient
    caution_flags: int        # users who should use it with caution (no allergen conflict)


class CategoryScore(BaseModel):
    category: str
    average_score: float
    products: int


class RecommendationMonitoringOut(BaseModel):
    users_evaluated: int
    products_evaluated: int
    recommended_min_score: int
    total_pairs: int
    average_score: float | None
    allergen_conflict_pairs: int
    conflict_rate: float | None   # percent of user-product pairings with an allergen conflict
    top_products: list[MonitoredProduct]
    most_flagged_products: list[MonitoredProduct]
    category_scores: list[CategoryScore]