# import os
# import joblib
# import pandas as pd


# BASE_DIR = os.path.dirname(
#     os.path.dirname(
#         os.path.abspath(__file__)
#     )
# )

# MODEL_PATH = os.path.join(
#     BASE_DIR,
#     "ml_model",
#     "skin_concern_model.joblib"
# )


# # Load the trained ML model
# model = joblib.load(MODEL_PATH)


# def predict_skin_concern(
#     age,
#     skin_type,
#     sensitivity,
#     hydration,
#     stress_level,
#     sleep_quality,
#     physical_activity,
#     water_intake
# ):
#     input_data = pd.DataFrame([
#         {
#             "Age": age,
#             "Skin_Type": str(skin_type),
#             "Sensitivity": str(sensitivity),
#             "Hydration": str(hydration),
#             "Stress_Level": str(stress_level),
#             "Sleep_Quality": str(sleep_quality),
#             "Physical_Activity": str(physical_activity),
#             "Water_Intake": water_intake
#         }
#     ])

#     # Convert numeric columns
#     input_data["Age"] = pd.to_numeric(
#         input_data["Age"],
#         errors="coerce"
#     )

#     input_data["Water_Intake"] = pd.to_numeric(
#         input_data["Water_Intake"],
#         errors="coerce"
#     )

#     # ML prediction
#     prediction = model.predict(input_data)[0]

#     # ML confidence
#     confidence = None

#     if hasattr(model, "predict_proba"):
#         probabilities = model.predict_proba(input_data)[0]
#         confidence = float(max(probabilities))

#     return {
#         "concern": prediction,
#         "confidence": confidence
#     }
import os
import joblib
import pandas as pd


BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "ml_model",
    "skin_concern_model.joblib"
)


# Load the trained ML model
# mmap_mode=None forces joblib to load arrays directly into RAM
# instead of using memory-mapped files.
model = joblib.load(
    MODEL_PATH,
    mmap_mode=None
)


def predict_skin_concern(
    age,
    skin_type,
    sensitivity,
    hydration,
    stress_level,
    sleep_quality,
    physical_activity,
    water_intake
):
    input_data = pd.DataFrame([
        {
            "Age": age,
            "Skin_Type": str(skin_type),
            "Sensitivity": str(sensitivity),
            "Hydration": str(hydration),
            "Stress_Level": str(stress_level),
            "Sleep_Quality": str(sleep_quality),
            "Physical_Activity": str(physical_activity),
            "Water_Intake": water_intake
        }
    ])

    # Convert numeric columns
    input_data["Age"] = pd.to_numeric(
        input_data["Age"],
        errors="coerce"
    )

    input_data["Water_Intake"] = pd.to_numeric(
        input_data["Water_Intake"],
        errors="coerce"
    )

    # ML prediction
    prediction = model.predict(input_data)[0]

    # ML confidence
    confidence = None

    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(input_data)[0]
        confidence = float(max(probabilities))

    return {
        "concern": prediction,
        "confidence": confidence
    }