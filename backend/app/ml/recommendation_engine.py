#!/usr/bin/env python3
"""
Content-Based Product Recommendation Engine
===========================================
Uses scikit-learn for feature encoding + cosine similarity.
Now loads products from the database (with JSON fallback).
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MultiLabelBinarizer, normalize

from app import db
from app.models import Product, ProductSkinType, ProductConcern, ProductIngredient

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent
PRODUCTS_JSON = DATA_DIR / "products.json"


class ProductRecommender:
    """
    Content-based recommender using multi-hot encoding + cosine similarity.
    """

    def __init__(self, products_path: Path | str = PRODUCTS_JSON):
        self.products_path = Path(products_path)
        self.products: List[Dict[str, Any]] = []
        self.df: Optional[pd.DataFrame] = None

        self.mlb_skin: Optional[MultiLabelBinarizer] = None
        self.mlb_concerns: Optional[MultiLabelBinarizer] = None
        self.mlb_ingredients: Optional[MultiLabelBinarizer] = None
        self.mlb_texture: Optional[MultiLabelBinarizer] = None
        self.mlb_tier: Optional[MultiLabelBinarizer] = None
        self.mlb_routine: Optional[MultiLabelBinarizer] = None

        self.product_matrix: Optional[np.ndarray] = None
        self.feature_names: List[str] = []

        self._load_and_fit()

    def _load_and_fit(self) -> None:
        """Load products from the database and build the feature matrix."""
        products_db = Product.query.filter_by(is_active=True).all()

        if not products_db:
            # Fallback to JSON if DB is empty
            if self.products_path.exists():
                with open(self.products_path, "r", encoding="utf-8") as f:
                    self.products = json.load(f)
                logger.warning("No products in DB – loaded from JSON fallback")
            else:
                raise FileNotFoundError("No products found in database or JSON")
        else:
            self.products = []
            for p in products_db:
                skin_types = [pst.skin_type for pst in ProductSkinType.query.filter_by(product_id=p.id).all()]
                concerns = [pc.concern for pc in ProductConcern.query.filter_by(product_id=p.id).all()]
                key_ings = []
                for pi in ProductIngredient.query.filter_by(product_id=p.id, is_key_ingredient=True).all():
                    if pi.ingredient:
                        key_ings.append(pi.ingredient.name)

                product_dict = {
                    "product_id": f"P{p.id:03d}",
                    "name": p.name,
                    "brand": p.brand or "",
                    "category": p.category or "",
                    "subcategory": p.subcategory or "",
                    "price": p.price or 0,
                    "price_tier": p.price_tier or "mid",
                    "currency": p.currency or "INR",
                    "skin_types": skin_types,
                    "concerns": concerns,
                    "key_ingredients": key_ings,
                    "texture": p.texture or "",
                    "fragrance_free": bool(p.fragrance_free),
                    "alcohol_free": bool(p.alcohol_free),
                    "comedogenic_rating": p.comedogenic_rating if p.comedogenic_rating is not None else 2,
                    "routine_step": p.routine_step or "",
                    "time_of_use": (p.time_of_use or "Both").split(",") if p.time_of_use else ["Both"],
                    "description": p.description or "",
                    "rating": p.rating or 4.0,
                    "num_reviews": p.num_reviews or 0,
                }
                self.products.append(product_dict)

            logger.info("Loaded %d products from database", len(self.products))

        self.df = pd.DataFrame(self.products)

        for col in ["skin_types", "concerns", "key_ingredients", "time_of_use"]:
            self.df[col] = self.df[col].apply(lambda x: x if isinstance(x, list) else [])

        self._build_feature_matrix()

    def _build_feature_matrix(self) -> None:
        self.mlb_skin = MultiLabelBinarizer()
        skin_mat = self.mlb_skin.fit_transform(self.df["skin_types"])

        self.mlb_concerns = MultiLabelBinarizer()
        concern_mat = self.mlb_concerns.fit_transform(self.df["concerns"])

        self.mlb_ingredients = MultiLabelBinarizer()
        ing_mat = self.mlb_ingredients.fit_transform(self.df["key_ingredients"])

        self.mlb_texture = MultiLabelBinarizer()
        texture_mat = self.mlb_texture.fit_transform(self.df["texture"].apply(lambda x: [x]))

        self.mlb_tier = MultiLabelBinarizer()
        tier_mat = self.mlb_tier.fit_transform(self.df["price_tier"].apply(lambda x: [x]))

        self.mlb_routine = MultiLabelBinarizer()
        routine_mat = self.mlb_routine.fit_transform(self.df["routine_step"].apply(lambda x: [x]))

        price_norm = np.log1p(self.df["price"].values).reshape(-1, 1)
        price_norm = (price_norm - price_norm.min()) / (price_norm.max() - price_norm.min() + 1e-8)

        rating_norm = (self.df["rating"].values / 5.0).reshape(-1, 1)
        comed_norm = (1.0 - self.df["comedogenic_rating"].values / 5.0).reshape(-1, 1)

        frag_free = self.df["fragrance_free"].astype(float).values.reshape(-1, 1)
        alcohol_free = self.df["alcohol_free"].astype(float).values.reshape(-1, 1)

        self.product_matrix = np.hstack([
            skin_mat, concern_mat, ing_mat, texture_mat, tier_mat, routine_mat,
            price_norm, rating_norm, comed_norm, frag_free, alcohol_free,
        ]).astype(np.float64)

        self.product_matrix = normalize(self.product_matrix, norm="l2", axis=1)

        self.feature_names = (
            [f"skin_{s}" for s in self.mlb_skin.classes_]
            + [f"concern_{c}" for c in self.mlb_concerns.classes_]
            + [f"ing_{i}" for i in self.mlb_ingredients.classes_]
            + [f"texture_{t}" for t in self.mlb_texture.classes_]
            + [f"tier_{t}" for t in self.mlb_tier.classes_]
            + [f"routine_{r}" for r in self.mlb_routine.classes_]
            + ["price_norm", "rating_norm", "comed_norm", "fragrance_free", "alcohol_free"]
        )

        logger.info("Feature matrix shape: %s", self.product_matrix.shape)

    def _build_user_vector(
        self,
        skin_type: Optional[str] = None,
        concerns: Optional[List[str]] = None,
        preferred_ingredients: Optional[List[str]] = None,
        price_tier: Optional[str] = None,
        texture: Optional[str] = None,
        routine_step: Optional[str] = None,
        prefer_fragrance_free: bool = False,
        prefer_alcohol_free: bool = False,
        max_price: Optional[float] = None,
    ) -> np.ndarray:
        concerns = concerns or []
        preferred_ingredients = preferred_ingredients or []

        skin_list = [skin_type] if skin_type else []
        skin_vec = self.mlb_skin.transform([skin_list])
        concern_vec = self.mlb_concerns.transform([concerns])
        ing_vec = self.mlb_ingredients.transform([preferred_ingredients])
        texture_list = [texture] if texture else []
        texture_vec = self.mlb_texture.transform([texture_list])
        tier_list = [price_tier] if price_tier else []
        tier_vec = self.mlb_tier.transform([tier_list])
        routine_list = [routine_step] if routine_step else []
        routine_vec = self.mlb_routine.transform([routine_list])

        price_val = 0.5
        if max_price is not None and self.df is not None:
            log_max = np.log1p(max_price)
            log_min = np.log1p(self.df["price"].min())
            log_range = np.log1p(self.df["price"].max()) - log_min
            price_val = max(0.0, min(1.0, (log_max - log_min) / (log_range + 1e-8)))

        rating_val = 0.85
        comed_val = 0.8
        frag_val = 1.0 if prefer_fragrance_free else 0.5
        alcohol_val = 1.0 if prefer_alcohol_free else 0.5

        numerical = np.array([[price_val, rating_val, comed_val, frag_val, alcohol_val]])

        user_vec = np.hstack([
            skin_vec, concern_vec, ing_vec, texture_vec, tier_vec, routine_vec, numerical,
        ]).astype(np.float64)

        return normalize(user_vec, norm="l2", axis=1)

    def recommend(
        self,
        skin_type: Optional[str] = None,
        concerns: Optional[List[str]] = None,
        preferred_ingredients: Optional[List[str]] = None,
        price_tier: Optional[str] = None,
        texture: Optional[str] = None,
        routine_step: Optional[str] = None,
        prefer_fragrance_free: bool = False,
        prefer_alcohol_free: bool = False,
        max_price: Optional[float] = None,
        top_k: int = 5,
        min_score: float = 0.01,
        category_filter: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        if self.product_matrix is None:
            raise RuntimeError("Recommender not fitted")

        user_vec = self._build_user_vector(
            skin_type=skin_type,
            concerns=concerns,
            preferred_ingredients=preferred_ingredients,
            price_tier=price_tier,
            texture=texture,
            routine_step=routine_step,
            prefer_fragrance_free=prefer_fragrance_free,
            prefer_alcohol_free=prefer_alcohol_free,
            max_price=max_price,
        )

        scores = cosine_similarity(user_vec, self.product_matrix).flatten()

        mask = np.ones(len(self.products), dtype=bool)
        if max_price is not None:
            mask &= self.df["price"].values <= max_price
        if category_filter:
            mask &= self.df["category"].str.lower() == category_filter.lower()

        scores = np.where(mask, scores, -1.0)
        ranked_idx = np.argsort(scores)[::-1]

        results = []
        for idx in ranked_idx:
            score = float(scores[idx])
            if score < min_score or len(results) >= top_k:
                break

            product = self.products[idx].copy()
            product["suitability_score"] = round(score, 4)
            product["match_percentage"] = round(score * 100, 1)
            product["match_reasons"] = self._explain_match(
                user_vec, idx, skin_type, concerns or [], preferred_ingredients or []
            )
            results.append(product)

        return results

    def _explain_match(
        self,
        user_vec: np.ndarray,
        product_idx: int,
        skin_type: Optional[str],
        concerns: List[str],
        preferred_ingredients: List[str],
    ) -> List[str]:
        reasons = []
        prod = self.products[product_idx]

        if skin_type and skin_type in prod.get("skin_types", []):
            reasons.append(f"Suitable for {skin_type} skin")

        matched_concerns = set(concerns) & set(prod.get("concerns", []))
        if matched_concerns:
            reasons.append(f"Targets: {', '.join(c.replace('_', ' ') for c in sorted(matched_concerns))}")

        matched_ings = set(preferred_ingredients) & set(prod.get("key_ingredients", []))
        if matched_ings:
            reasons.append(f"Contains: {', '.join(i.replace('_', ' ') for i in sorted(matched_ings))}")

        if prod.get("fragrance_free"):
            reasons.append("Fragrance-free")
        if prod.get("alcohol_free"):
            reasons.append("Alcohol-free")

        if not reasons:
            reasons.append("Good overall profile match")

        return reasons[:4]

    def get_product_suggestions(
        self,
        user_profile: Dict[str, Any],
        top_k: int = 5,
    ) -> Dict[str, Any]:
        skin_type = user_profile.get("skin_type") or user_profile.get("skinType")
        if skin_type:
            skin_type = skin_type.lower().strip()

        concerns = user_profile.get("concerns") or user_profile.get("skin_concerns") or []
        if isinstance(concerns, str):
            concerns = [c.strip() for c in concerns.split(",") if c.strip()]
        concerns = [c.lower().strip() for c in concerns]

        max_price = user_profile.get("max_price") or user_profile.get("budget")
        price_tier = user_profile.get("price_tier")
        if max_price and not price_tier:
            if max_price < 800:
                price_tier = "budget"
            elif max_price < 2500:
                price_tier = "mid"
            else:
                price_tier = "premium"

        recommendations = self.recommend(
            skin_type=skin_type,
            concerns=concerns,
            preferred_ingredients=user_profile.get("preferred_ingredients") or [],
            price_tier=price_tier,
            texture=user_profile.get("texture"),
            prefer_fragrance_free=user_profile.get("fragrance_free", False),
            prefer_alcohol_free=user_profile.get("alcohol_free", False),
            max_price=max_price,
            top_k=top_k,
        )

        return {
            "status": "success",
            "count": len(recommendations),
            "recommendations": [
                {
                    "product_id": r["product_id"],
                    "name": r["name"],
                    "brand": r["brand"],
                    "category": r["category"],
                    "price": r["price"],
                    "currency": r.get("currency", "INR"),
                    "suitability_score": r["suitability_score"],
                    "match_percentage": r["match_percentage"],
                    "match_reasons": r["match_reasons"],
                    "key_ingredients": r["key_ingredients"],
                    "skin_types": r["skin_types"],
                    "concerns": r["concerns"],
                    "texture": r["texture"],
                    "rating": r["rating"],
                    "routine_step": r["routine_step"],
                    "description": r["description"],
                }
                for r in recommendations
            ],
            "model": "content_based_cosine_v1",
            "feature_dim": self.product_matrix.shape[1] if self.product_matrix is not None else 0,
        }