
from app.services.skin_concern_engine import analyze_skin_concerns

result = analyze_skin_concerns(
    concerns="mild acne, severe dry skin, redness",
    sensitivity="high",
    allergies="fragrance",
    exercise_minutes=30,
    stress_level=8,
    sleep_hours=5,
    sleep_quality=4,
    water_intake=0.8,
)

print("\n--- Skin Concern Engine Test ---")
print("Primary concern:", result["primary_concern"])
print("Prioritized concerns:", result["prioritized_concerns"])
print("Risk analysis:", result["risk_analysis"])
print("\nTest completed successfully!")
