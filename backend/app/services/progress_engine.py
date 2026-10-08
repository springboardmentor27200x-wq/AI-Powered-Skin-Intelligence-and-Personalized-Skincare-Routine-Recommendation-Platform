# from datetime import datetime


# # =========================================================
# # HELPER: CONVERT ASSESSMENT TO DICTIONARY
# # =========================================================

# def assessment_to_dict(assessment):
#     return {
#         "id": assessment.id,
#         "skin_condition_score": assessment.skin_condition_score or 0,
#         "lifestyle_score": assessment.lifestyle_score or 0,
#         "sleep_score": assessment.sleep_score or 0,
#         "routine_consistency_score": (
#             assessment.routine_consistency_score or 0
#         ),
#         "hydration_score": assessment.hydration_score or 0,
#         "skin_score": assessment.skin_score or 0,
#         "health_status": assessment.health_status,
#         "primary_concern": assessment.primary_concern,
#         "created_at": (
#             assessment.created_at.isoformat()
#             if assessment.created_at
#             else None
#         ),
#     }


# # =========================================================
# # CALCULATE SCORE CHANGE
# # =========================================================

# def calculate_score_change(first_score, latest_score):
#     return round(
#         latest_score - first_score,
#         2
#     )


# # =========================================================
# # DETERMINE IMPROVEMENT STATUS
# # =========================================================

# def determine_improvement(change):

#     if change > 5:
#         return "Improved"

#     if change < -5:
#         return "Declined"

#     return "Stable"


# # =========================================================
# # GENERATE SCORE TREND
# # =========================================================

# def generate_score_trend(assessments):

#     trend = []

#     for assessment in assessments:

#         trend.append({
#             "assessment_id": assessment.id,

#             "date": (
#                 assessment.created_at.isoformat()
#                 if assessment.created_at
#                 else None
#             ),

#             "skin_score": (
#                 assessment.skin_score or 0
#             ),

#             "skin_condition_score": (
#                 assessment.skin_condition_score or 0
#             ),

#             "lifestyle_score": (
#                 assessment.lifestyle_score or 0
#             ),

#             "sleep_score": (
#                 assessment.sleep_score or 0
#             ),

#             "routine_consistency_score": (
#                 assessment.routine_consistency_score or 0
#             ),

#             "hydration_score": (
#                 assessment.hydration_score or 0
#             ),
#         })

#     return trend


# # =========================================================
# # ANALYZE PROGRESS
# # =========================================================

# def analyze_progress(assessments):

#     if not assessments:

#         return {
#             "total_assessments": 0,
#             "message": "No assessment history available.",
#             "first_assessment": None,
#             "latest_assessment": None,
#             "score_change": 0,
#             "improvement_status": "No Data",
#             "trend": [],
#         }

#     # Oldest → newest
#     assessments = sorted(
#         assessments,
#         key=lambda x: x.created_at or datetime.min
#     )

#     first = assessments[0]
#     latest = assessments[-1]

#     first_score = first.skin_score or 0
#     latest_score = latest.skin_score or 0

#     score_change = calculate_score_change(
#         first_score,
#         latest_score
#     )

#     improvement_status = determine_improvement(
#         score_change
#     )

#     return {
#         "total_assessments": len(assessments),

#         "first_assessment": assessment_to_dict(
#             first
#         ),

#         "latest_assessment": assessment_to_dict(
#             latest
#         ),

#         "score_change": score_change,

#         "improvement_status": improvement_status,

#         "trend": generate_score_trend(
#             assessments
#         ),
#     }


# # =========================================================
# # BEFORE / AFTER COMPARISON
# # =========================================================

# def compare_before_after(assessments):

#     if len(assessments) < 2:

#         return {
#             "message": (
#                 "At least two assessments are required "
#                 "for before/after comparison."
#             )
#         }

#     assessments = sorted(
#         assessments,
#         key=lambda x: x.created_at or datetime.min
#     )

#     before = assessments[0]
#     after = assessments[-1]

#     score_fields = [
#         "skin_condition_score",
#         "lifestyle_score",
#         "sleep_score",
#         "routine_consistency_score",
#         "hydration_score",
#         "skin_score",
#     ]

#     comparison = {}

#     for field in score_fields:

#         before_score = getattr(
#             before,
#             field
#         ) or 0

#         after_score = getattr(
#             after,
#             field
#         ) or 0

#         change = round(
#             after_score - before_score,
#             2
#         )

#         comparison[field] = {
#             "before": before_score,
#             "after": after_score,
#             "change": change,
#         }

#     return {
#         "before_assessment_id": before.id,
#         "after_assessment_id": after.id,
#         "comparison": comparison,
#     }
from datetime import datetime


# =========================================================
# HELPER: CONVERT DATE/TIME TO STRING
# =========================================================

def format_datetime(value):
    """
    Handles both Python datetime objects and
    string datetime values from SQLite.
    """

    if value is None:
        return None

    if isinstance(value, datetime):
        return value.isoformat()

    return str(value)


# =========================================================
# HELPER: CONVERT DATE/TIME FOR SORTING
# =========================================================

def datetime_for_sorting(value):
    """
    Converts datetime/string values into a datetime
    object so assessments can be sorted safely.
    """

    if value is None:
        return datetime.min

    if isinstance(value, datetime):
        return value

    if isinstance(value, str):

        try:
            return datetime.fromisoformat(
                value.replace("Z", "+00:00")
            )

        except ValueError:
            return datetime.min

    return datetime.min


# =========================================================
# HELPER: CONVERT ASSESSMENT TO DICTIONARY
# =========================================================

def assessment_to_dict(assessment):

    return {
        "id": assessment.id,

        "skin_condition_score": (
            assessment.skin_condition_score or 0
        ),

        "lifestyle_score": (
            assessment.lifestyle_score or 0
        ),

        "sleep_score": (
            assessment.sleep_score or 0
        ),

        "routine_consistency_score": (
            assessment.routine_consistency_score or 0
        ),

        "hydration_score": (
            assessment.hydration_score or 0
        ),

        "skin_score": (
            assessment.skin_score or 0
        ),

        "health_status": (
            assessment.health_status
        ),

        "primary_concern": (
            assessment.primary_concern
        ),

        "created_at": format_datetime(
            assessment.created_at
        ),
    }


# =========================================================
# CALCULATE SCORE CHANGE
# =========================================================

def calculate_score_change(
    first_score,
    latest_score
):

    return round(
        latest_score - first_score,
        2
    )


# =========================================================
# DETERMINE IMPROVEMENT STATUS
# =========================================================

def determine_improvement(change):

    if change > 5:
        return "Improved"

    if change < -5:
        return "Declined"

    return "Stable"


# =========================================================
# GENERATE SCORE TREND
# =========================================================

def generate_score_trend(assessments):

    trend = []

    for assessment in assessments:

        trend.append({

            "assessment_id": assessment.id,

            "date": format_datetime(
                assessment.created_at
            ),

            "skin_score": (
                assessment.skin_score or 0
            ),

            "skin_condition_score": (
                assessment.skin_condition_score or 0
            ),

            "lifestyle_score": (
                assessment.lifestyle_score or 0
            ),

            "sleep_score": (
                assessment.sleep_score or 0
            ),

            "routine_consistency_score": (
                assessment.routine_consistency_score or 0
            ),

            "hydration_score": (
                assessment.hydration_score or 0
            ),
        })

    return trend


# =========================================================
# ANALYZE PROGRESS
# =========================================================

def analyze_progress(assessments):

    # -----------------------------------------------------
    # NO ASSESSMENT DATA
    # -----------------------------------------------------

    if not assessments:

        return {

            "total_assessments": 0,

            "message": (
                "No assessment history available."
            ),

            "first_assessment": None,

            "latest_assessment": None,

            "score_change": 0,

            "improvement_status": "No Data",

            "trend": [],
        }


    # -----------------------------------------------------
    # SORT OLDEST → NEWEST
    # -----------------------------------------------------

    assessments = sorted(
        assessments,
        key=lambda x: datetime_for_sorting(
            x.created_at
        )
    )


    # -----------------------------------------------------
    # FIRST AND LATEST
    # -----------------------------------------------------

    first = assessments[0]

    latest = assessments[-1]


    # -----------------------------------------------------
    # SCORES
    # -----------------------------------------------------

    first_score = (
        first.skin_score or 0
    )

    latest_score = (
        latest.skin_score or 0
    )


    # -----------------------------------------------------
    # SCORE CHANGE
    # -----------------------------------------------------

    score_change = calculate_score_change(

        first_score,

        latest_score
    )


    # -----------------------------------------------------
    # IMPROVEMENT STATUS
    # -----------------------------------------------------

    improvement_status = determine_improvement(
        score_change
    )


    # -----------------------------------------------------
    # FINAL RESULT
    # -----------------------------------------------------

    return {

        "total_assessments": len(
            assessments
        ),

        "first_assessment": (
            assessment_to_dict(
                first
            )
        ),

        "latest_assessment": (
            assessment_to_dict(
                latest
            )
        ),

        "score_change": score_change,

        "improvement_status": (
            improvement_status
        ),

        "trend": (
            generate_score_trend(
                assessments
            )
        ),
    }


# =========================================================
# BEFORE / AFTER COMPARISON
# =========================================================

def compare_before_after(assessments):

    # -----------------------------------------------------
    # NOT ENOUGH DATA
    # -----------------------------------------------------

    if len(assessments) < 2:

        return {

            "message": (
                "At least two assessments are required "
                "for before/after comparison."
            )
        }


    # -----------------------------------------------------
    # SORT OLDEST → NEWEST
    # -----------------------------------------------------

    assessments = sorted(

        assessments,

        key=lambda x:
        datetime_for_sorting(
            x.created_at
        )
    )


    # -----------------------------------------------------
    # FIRST / LAST
    # -----------------------------------------------------

    before = assessments[0]

    after = assessments[-1]


    # -----------------------------------------------------
    # SCORE FIELDS
    # -----------------------------------------------------

    score_fields = [

        "skin_condition_score",

        "lifestyle_score",

        "sleep_score",

        "routine_consistency_score",

        "hydration_score",

        "skin_score",

    ]


    comparison = {}


    # -----------------------------------------------------
    # CALCULATE CHANGES
    # -----------------------------------------------------

    for field in score_fields:

        before_score = (
            getattr(
                before,
                field
            ) or 0
        )

        after_score = (
            getattr(
                after,
                field
            ) or 0
        )


        change = round(

            after_score - before_score,

            2
        )


        comparison[field] = {

            "before": before_score,

            "after": after_score,

            "change": change,

        }


    # -----------------------------------------------------
    # FINAL RESULT
    # -----------------------------------------------------

    return {

        "before_assessment_id": (
            before.id
        ),

        "after_assessment_id": (
            after.id
        ),

        "comparison": comparison,

    }