from typing import List
import pytest
from app.services.intelligence import (
    ConcernAnalyzer,
    PriorityEngine,
    RiskAnalyzer,
    RoutineGenerator,
    ScoreEngine,
)


class MockRecord:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)


class MockConcern:
    def __init__(self, code, name):
        self.code = code
        self.name = name


def test_risk_analyzer_detects_high_stress_and_poor_sleep():
    lifestyle = MockRecord(stress_level=9, smoking="NONE", alcohol="NONE", physical_activity="SEDENTARY")
    sleep = MockRecord(duration_minutes=320, quality="POOR")
    hydration = MockRecord(water_intake_ml=800, target_water_ml=2000)

    risks = RiskAnalyzer.analyze_risks(lifestyle, sleep, hydration)
    types = [r["factor_type"] for r in risks]

    assert "STRESS" in types
    assert "SLEEP" in types
    assert "HYDRATION" in types
    assert "LIFESTYLE" in types  # Sedentary


def test_concern_analyzer_acne_amplification():
    skin_prof = MockRecord(
        skin_type="OILY",
        allergies=None,
        sensitivities=None,
        concerns=[MockConcern("ACNE", "Acne")],
    )
    lifestyle = MockRecord(stress_level=8, smoking="NONE", alcohol="NONE", physical_activity="MODERATE")
    risks = RiskAnalyzer.analyze_risks(lifestyle)

    concerns = ConcernAnalyzer.analyze_concerns(
        skin_profile=skin_prof,
        user_profile=None,
        risks=risks,
        lifestyle_record=lifestyle,
    )

    acne_data = next((c for c in concerns if c["concern_name"] == "ACNE"), None)
    assert acne_data is not None
    # Base 50 + Oily 18 + Stress 12 = 80 severity
    assert acne_data["severity"] >= 75
    assert any("Oily" in r for r in acne_data["reasons"])


def test_priority_engine_ranks_high_severity():
    concerns = [
        {"concern_name": "ACNE", "severity": 82, "confidence": 0.95, "reasons": ["High"]},
        {"concern_name": "DRY_SKIN", "severity": 52, "confidence": 0.85, "reasons": ["Moderate"]},
        {"concern_name": "FINE_LINES", "severity": 30, "confidence": 0.80, "reasons": ["Mild"]},
    ]

    prioritized = PriorityEngine.prioritize_concerns(concerns)

    assert prioritized[0]["concern_name"] == "ACNE"
    assert prioritized[0]["priority"] == "HIGH"
    assert prioritized[1]["concern_name"] == "DRY_SKIN"
    assert prioritized[1]["priority"] == "MEDIUM"
    assert prioritized[2]["concern_name"] == "FINE_LINES"
    assert prioritized[2]["priority"] == "LOW"


def test_score_engine_weighted_formula():
    concerns = [
        {"concern_name": "ACNE", "severity": 60, "priority": "HIGH"},
    ]
    lifestyle = MockRecord(stress_level=3, smoking="NONE", alcohol="NONE", physical_activity="ACTIVE")
    sleep = MockRecord(duration_minutes=480, quality="EXCELLENT")
    hydration = MockRecord(water_intake_ml=2000, target_water_ml=2000)

    scores = ScoreEngine.calculate_scores(concerns, lifestyle, sleep, hydration)

    cond = scores["skin_condition_score"]
    life = scores["lifestyle_score"]
    slp = scores["sleep_score"]
    cons = scores["routine_consistency_score"]  # 50
    hydr = scores["hydration_score"]  # 100

    expected_overall = round(
        (cond * 0.35) + (life * 0.20) + (slp * 0.15) + (cons * 0.20) + (hydr * 0.10)
    )
    assert scores["overall_score"] == expected_overall
    assert "strong_pillars" in scores["explanation"]
    assert "improvement_areas" in scores["explanation"]


def test_routine_generator_allergy_exclusion_safety():
    # User has declared Salicylic Acid and Retinol allergies
    skin_prof = MockRecord(
        skin_type="OILY",
        allergies="Salicylic Acid, Retinoids",
        sensitivities="fragrance",
        concerns=[MockConcern("ACNE", "Acne")],
    )
    prioritized = [
        {"concern_name": "ACNE", "priority": "HIGH", "severity": 75, "confidence": 0.9, "reasons": []},
    ]

    plan = RoutineGenerator.generate_routines(skin_prof, prioritized, version=1)

    assert len(plan["routines"]) == 3  # MORNING, EVENING, WEEKLY

    all_actives = []
    all_titles = []
    for routine in plan["routines"]:
        for step in routine["steps"]:
            all_titles.append(step["title"].lower())
            for act in step.get("key_actives", []):
                all_actives.append(act.lower())

    # Guarantee Salicylic Acid is excluded
    assert not any("salicylic" in act for act in all_actives)
    assert not any("salicylic" in title for title in all_titles)

    # Guarantee Retinoids are excluded
    assert not any("retinol" in act for act in all_actives)
    assert not any("retinoid" in act for act in all_actives)


def test_routine_generator_fallback_on_no_concerns():
    skin_prof = MockRecord(
        skin_type="NORMAL",
        allergies=None,
        sensitivities=None,
        concerns=[],
    )
    concerns = ConcernAnalyzer.analyze_concerns(skin_prof)
    prioritized = PriorityEngine.prioritize_concerns(concerns)

    assert prioritized[0]["concern_name"] == "BARRIER_MAINTENANCE"

    plan = RoutineGenerator.generate_routines(skin_prof, prioritized, version=1)
    assert plan["version"] == 1
    assert any(r["routine_type"] == "MORNING" for r in plan["routines"])
