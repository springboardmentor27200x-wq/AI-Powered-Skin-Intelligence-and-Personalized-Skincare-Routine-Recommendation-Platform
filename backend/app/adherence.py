from datetime import date, timedelta
from app.models import DailyChecklist
from app import db

def get_routine_consistency(user_id: int, days: int = 7) -> int:
    """
    Calculate average routine adherence over the last `days` days.
    Returns a percentage (0-100).
    """
    today = date.today()
    start_date = today - timedelta(days=days - 1)

    # Get all checklist items in the period
    items = DailyChecklist.query.filter(
        DailyChecklist.user_id == user_id,
        DailyChecklist.date >= start_date.isoformat(),
        DailyChecklist.date <= today.isoformat()
    ).all()

    if not items:
        return 0

    # Group by date
    from collections import defaultdict
    daily = defaultdict(lambda: {"total": 0, "completed": 0})

    for item in items:
        daily[item.date]["total"] += 1
        if item.is_completed:
            daily[item.date]["completed"] += 1

    # Calculate daily percentages and average them
    percentages = []
    for day_data in daily.values():
        if day_data["total"] > 0:
            pct = (day_data["completed"] / day_data["total"]) * 100
            percentages.append(pct)

    if not percentages:
        return 0

    average = sum(percentages) / len(percentages)
    return round(average)