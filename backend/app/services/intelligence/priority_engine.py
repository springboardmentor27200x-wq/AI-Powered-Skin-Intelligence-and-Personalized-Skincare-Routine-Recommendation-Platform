"""
priority_engine.py  — ML-informed concern prioritization

Deterministically assigns priority to skin concerns using a weighted composite:

  priority_score = ML_probability × 0.60
                 + is_user_declared × 0.25
                 + severity_normalized × 0.15

After scoring, applies safety constraints:
  - Sensitive skin / REDNESS always promoted to HIGH if active

The final priority assignment is deterministic.
ML probabilities influence ranking but do not replace the formula.
"""
from typing import Any, Dict, List, Optional


class PriorityEngine:
    """
    Uses ML probability (from ConcernNet) as primary weight for concern prioritization.
    Falls back to severity-only scoring if ML probability is unavailable.
    """

    @classmethod
    def prioritize_concerns(
        cls,
        concerns: List[Dict[str, Any]],
        skin_profile: Optional[Any] = None,
    ) -> List[Dict[str, Any]]:
        if not concerns:
            return []

        is_sensitive = False
        if skin_profile:
            is_sensitive = (
                (skin_profile.skin_type or "").upper() == "SENSITIVE"
                or bool(skin_profile.sensitivities)
            )

        prioritized = []

        for item in concerns:
            concern_name = item.get("concern_name", "")
            severity     = item.get("severity", 50)
            ml_prob      = item.get("ml_probability")  # float or None
            is_declared  = any("profile" in r.lower() or "selected" in r.lower()
                               for r in item.get("reasons", []))

            # ── Composite Priority Score ────────────────────────────────────
            # Weights: ML probability (60%), user-declared (25%), severity (15%)
            if ml_prob is not None:
                severity_norm = severity / 100.0
                declared_score = 1.0 if is_declared else 0.0
                composite = (ml_prob * 0.60) + (declared_score * 0.25) + (severity_norm * 0.15)
                method = "ML_WEIGHTED"
            else:
                # Fallback: pure severity-based
                composite = severity / 100.0
                method = "SEVERITY_BASED"

            # ── Priority Assignment ─────────────────────────────────────────
            if composite >= 0.55:
                priority = "HIGH"
            elif composite >= 0.35:
                priority = "MEDIUM"
            else:
                priority = "LOW"

            # ── Safety Override: Sensitive Skin ─────────────────────────────
            # Per spec §14: safety constraints are deterministic
            if is_sensitive and concern_name in ("SENSITIVE_SKIN", "REDNESS"):
                if priority != "HIGH" and severity >= 35:
                    priority = "HIGH"
                    item.setdefault("reasons", []).append(
                        "Priority elevated — sensitive skin barrier must be stabilized first"
                    )

            updated_item = dict(item)
            updated_item["priority"]        = priority
            updated_item["priority_score"]  = round(composite, 4)
            updated_item["priority_method"] = method
            prioritized.append(updated_item)

        # ── Deterministic sort: priority weight → priority_score → severity ─
        priority_weight = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}
        prioritized.sort(
            key=lambda x: (
                priority_weight.get(x["priority"], 0),
                x.get("priority_score", 0),
                x.get("severity", 0),
            ),
            reverse=True,
        )

        return prioritized
