"""
AI Skin Intelligence Engine package.
Provides modular, explainable, and deterministic rule-based algorithms for:
- Skin concern identification and severity calculation
- Lifestyle & environmental risk factor analysis
- Deterministic concern prioritization (HIGH, MEDIUM, LOW)
- 5-Pillar Skin Health Scoring (35% Condition, 20% Lifestyle, 15% Sleep, 20% Consistency, 10% Hydration)
- Allergy/Sensitivity safe personalized routine generation (Morning, Evening, Weekly)
"""

from app.services.intelligence.concern_analyzer import ConcernAnalyzer
from app.services.intelligence.risk_analyzer import RiskAnalyzer
from app.services.intelligence.priority_engine import PriorityEngine
from app.services.intelligence.score_engine import ScoreEngine
from app.services.intelligence.routine_generator import RoutineGenerator

__all__ = [
    "ConcernAnalyzer",
    "RiskAnalyzer",
    "PriorityEngine",
    "ScoreEngine",
    "RoutineGenerator",
]
