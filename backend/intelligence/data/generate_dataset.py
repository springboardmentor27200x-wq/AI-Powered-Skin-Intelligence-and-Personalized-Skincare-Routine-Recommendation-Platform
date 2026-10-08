"""
generate_dataset.py
Generates a clearly labeled SYNTHETIC training dataset for the AI Skin project.

IMPORTANT: This data is SYNTHETIC and PROCEDURALLY GENERATED.
It is NOT based on real clinical data.
It is NOT suitable for medical diagnosis.
It is designed only to demonstrate ML training pipelines.

5000 rows | 15 concern features | 10 concern labels | 8 risk features | 5 risk labels

Usage:
    python intelligence/data/generate_dataset.py
"""
import os
import numpy as np
import pandas as pd

# Reproducible seed
RNG = np.random.default_rng(42)

N = 5000  # number of synthetic samples

#   Feature Distributions (realistic but synthetic)  

skin_type        = RNG.integers(0, 5, N)     # 0=DRY 1=NORMAL 2=COMBO 3=OILY 4=SENSITIVE
age_group        = RNG.integers(0, 6, N)     # 0=UNDER18 .. 5=55_OVER
stress_level     = RNG.uniform(1, 10, N)
sleep_hours      = RNG.uniform(4, 10, N)
sleep_quality    = RNG.integers(0, 4, N)     # 0=POOR 1=FAIR 2=GOOD 3=EXCELLENT
water_intake_ml  = RNG.uniform(500, 3500, N)
physical_activity= RNG.integers(0, 5, N)     # 0=SEDENTARY .. 4=VERY_ACTIVE
smoking          = RNG.integers(0, 4, N)     # 0=NONE .. 3=HEAVY
alcohol          = RNG.integers(0, 5, N)     # 0=NONE .. 4=HEAVY
uv_index         = RNG.uniform(0, 12, N)
air_quality_index= RNG.uniform(0, 300, N)
has_allergies    = RNG.integers(0, 2, N)
has_sensitivities= RNG.integers(0, 2, N)
concern_count    = RNG.integers(0, 6, N)
is_oily_or_combo = ((skin_type == 2) | (skin_type == 3)).astype(float)

#   Concern Labels (rule + noise to create realistic pattern)  

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def noisy_label(prob, noise=0.10):
    """Apply noise to a probability and threshold to binary label."""
    p = np.clip(prob + RNG.uniform(-noise, noise, len(prob)), 0, 1)
    return (p > 0.5).astype(float)

# ACNE: driven by oily skin, high stress, poor sleep
acne_p = sigmoid(
    0.8 * is_oily_or_combo
    + 0.5 * (stress_level - 5) / 5
    + 0.4 * (4 - sleep_quality) / 3
    - 1.5
)
# HYPERPIGMENTATION: UV, age, smoking
hyper_p = sigmoid(
    0.7 * (uv_index - 6) / 6
    + 0.6 * (age_group - 2) / 3
    + 0.4 * smoking / 3
    - 1.8
)
# DARK_SPOTS: UV + age + stress
dark_p = sigmoid(
    0.6 * (uv_index - 5) / 7
    + 0.5 * (age_group - 2) / 3
    + 0.3 * (stress_level - 5) / 5
    - 1.5
)
# DRY_SKIN: dry type, low water intake
dry_p = sigmoid(
    1.0 * (skin_type == 0).astype(float)
    + 0.7 * (skin_type == 4).astype(float)
    - 0.5 * (water_intake_ml - 1500) / 1000
    - 1.0
)
# OILY_SKIN: oily/combo type + stress
oily_p = sigmoid(
    1.2 * is_oily_or_combo
    + 0.4 * (stress_level - 5) / 5
    - 1.8
)
# SENSITIVE_SKIN: sensitive type + allergies
sensitive_p = sigmoid(
    1.0 * (skin_type == 4).astype(float)
    + 0.8 * has_allergies.astype(float)
    + 0.6 * has_sensitivities.astype(float)
    - 1.5
)
# WRINKLES: age + smoking + dehydration
wrinkle_p = sigmoid(
    0.9 * (age_group - 2) / 3
    + 0.6 * smoking / 3
    + 0.4 * (2000 - water_intake_ml) / 1500
    - 1.5
)
# FINE_LINES: similar to wrinkles but younger onset
fine_p = sigmoid(
    0.7 * (age_group - 1) / 4
    + 0.5 * smoking / 3
    + 0.3 * (stress_level - 5) / 5
    - 1.5
)
# REDNESS: sensitive/dry, stress, alcohol
redness_p = sigmoid(
    0.8 * (skin_type == 4).astype(float)
    + 0.5 * (stress_level - 5) / 5
    + 0.4 * alcohol / 4
    - 1.5
)
# UNEVEN_TONE: UV, poor sleep, age
uneven_p = sigmoid(
    0.6 * (uv_index - 5) / 7
    + 0.4 * (4 - sleep_quality) / 3
    + 0.4 * (age_group - 2) / 3
    - 1.5
)

#   Risk Labels  

# STRESS risk
stress_r = noisy_label(sigmoid(0.8 * (stress_level - 5) / 5 - 0.3))
# SLEEP risk
sleep_r  = noisy_label(sigmoid(0.7 * (7 - sleep_hours) / 3 + 0.5 * (4 - sleep_quality) / 3 - 0.5))
# HYDRATION risk
hydra_r  = noisy_label(sigmoid(-0.8 * (water_intake_ml - 1500) / 1000 - 0.2))
# LIFESTYLE risk (smoking + alcohol + sedentary)
life_r   = noisy_label(sigmoid(0.6 * smoking / 3 + 0.5 * alcohol / 4 + 0.4 * (1 - physical_activity / 4) - 0.8))
# ENVIRONMENT risk
env_r    = noisy_label(sigmoid(0.7 * (uv_index - 6) / 6 + 0.3 * (air_quality_index - 100) / 200 - 0.5))

#   Build DataFrame  

df = pd.DataFrame({
    # Features
    "skin_type":         skin_type,
    "age_group":         age_group,
    "stress_level":      stress_level,
    "sleep_hours":       sleep_hours,
    "sleep_quality":     sleep_quality,
    "water_intake_ml":   water_intake_ml,
    "physical_activity": physical_activity,
    "smoking":           smoking,
    "alcohol":           alcohol,
    "uv_index":          uv_index,
    "air_quality_index": air_quality_index,
    "has_allergies":     has_allergies,
    "has_sensitivities": has_sensitivities,
    "concern_count":     concern_count,
    "is_oily_or_combo":  is_oily_or_combo,
    # Concern labels
    "label_ACNE":             noisy_label(acne_p),
    "label_HYPERPIGMENTATION":noisy_label(hyper_p),
    "label_DARK_SPOTS":       noisy_label(dark_p),
    "label_DRY_SKIN":         noisy_label(dry_p),
    "label_OILY_SKIN":        noisy_label(oily_p),
    "label_SENSITIVE_SKIN":   noisy_label(sensitive_p),
    "label_WRINKLES":         noisy_label(wrinkle_p),
    "label_FINE_LINES":       noisy_label(fine_p),
    "label_REDNESS":          noisy_label(redness_p),
    "label_UNEVEN_TONE":      noisy_label(uneven_p),
    # Risk labels
    "risk_STRESS":       stress_r,
    "risk_SLEEP":        sleep_r,
    "risk_HYDRATION":    hydra_r,
    "risk_LIFESTYLE":    life_r,
    "risk_ENVIRONMENT":  env_r,
})

#   Save  

out_path = os.path.join(os.path.dirname(__file__), "skin_dataset_synthetic_v1.csv")
df.to_csv(out_path, index=False)

print(f"[Dataset] SYNTHETIC dataset generated: {N} rows -> {out_path}")
print(f"[Dataset] Concern label distribution:")
for col in [c for c in df.columns if c.startswith("label_")]:
    print(f"  {col}: {df[col].mean():.2f} positive rate")
print("[Dataset] WARNING: SYNTHETIC DATA ONLY - Not clinical. For demonstration purposes.")
