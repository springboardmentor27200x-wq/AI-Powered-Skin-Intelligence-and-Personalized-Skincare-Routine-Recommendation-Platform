from datetime import date
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.routine import RoutinePlan
from app.schemas.user import UserResponse
from app.schemas.skin_profile import SkinProfileResponse
from app.schemas.lifestyle import LifestyleResponse
from app.schemas.sleep import SleepRecordResponse
from app.schemas.hydration import HydrationRecordResponse
from app.schemas.dashboard import ProfileCompletionStatus, DashboardSummaryResponse, ProgressAnalyticsResponse, ProgressTrendPoint
from app.repositories.skin_repository import skin_repository
from app.repositories.lifestyle_repository import lifestyle_repository
from app.repositories.sleep_repository import sleep_repository
from app.repositories.hydration_repository import hydration_repository


class DashboardService:
    def _clamp(self, value: float, minimum: float = 0.0, maximum: float = 100.0) -> int:
        return int(max(minimum, min(maximum, value)))

    def get_progress_analytics(self, db: Session, user: User) -> ProgressAnalyticsResponse:
        skin_prof = skin_repository.get_by_user_id(db, user.id)
        lifestyle_prof = lifestyle_repository.get_by_user_id(db, user.id)
        recent_sleep = sleep_repository.get_most_recent(db, user.id)
        recent_hydration_records = hydration_repository.get_user_records(db, user.id, limit=7)
        avg_sleep = sleep_repository.get_average_duration(db, user.id)

        skin_score = 65
        if skin_prof:
            skin_score = 80
            if skin_prof.skin_type.lower() in {"dry", "sensitive"}:
                skin_score -= 8
            if skin_prof.skin_type.lower() == "oily":
                skin_score -= 5
            if skin_prof.skin_concerns:
                skin_score -= min(25, len(skin_prof.skin_concerns) * 5)
            if skin_prof.allergies and str(skin_prof.allergies).lower() not in {"none", "n/a", ""}:
                skin_score -= 10
        else:
            skin_score = 0

        lifestyle_score = 60
        if lifestyle_prof:
            lifestyle_score = 72
            activity = (lifestyle_prof.physical_activity or "").lower()
            if activity in {"moderate", "high"}:
                lifestyle_score += 12
            elif activity == "light":
                lifestyle_score += 6
            if (lifestyle_prof.smoking or "").lower() == "never":
                lifestyle_score += 8
            if (lifestyle_prof.alcohol_consumption or "").lower() in {"none", "rarely"}:
                lifestyle_score += 7
            if lifestyle_prof.screen_time_hours is not None and lifestyle_prof.screen_time_hours < 4:
                lifestyle_score += 8
            elif lifestyle_prof.screen_time_hours and lifestyle_prof.screen_time_hours > 8:
                lifestyle_score -= 12

        sleep_score = 60
        if recent_sleep:
            sleep_score = 70
            if recent_sleep.sleep_duration_hours is not None:
                sleep_score += min(20, max(0, (recent_sleep.sleep_duration_hours - 6) * 8))
            quality = (recent_sleep.sleep_quality or "").lower()
            if quality == "excellent":
                sleep_score += 10
            elif quality == "good":
                sleep_score += 6
            elif quality == "fair":
                sleep_score -= 5
            elif quality == "poor":
                sleep_score -= 15
        elif avg_sleep is not None:
            sleep_score = min(100, int(avg_sleep * 10))

        hydration_score = 55
        if recent_hydration_records:
            avg_ml = sum(float(item.water_intake_ml) for item in recent_hydration_records) / len(recent_hydration_records)
            hydration_score = int(min(100, max(0, (avg_ml / 2200) * 100)))

        overall_score = int(
            (skin_score * 0.35) + (lifestyle_score * 0.20) + (sleep_score * 0.15) + (hydration_score * 0.15) + (min(100, max(0, (skin_score + lifestyle_score) / 2)) * 0.15)
        )

        assessment_history = db.query(RoutinePlan).filter(
            RoutinePlan.user_id == user.id,
        ).order_by(RoutinePlan.created_at.desc()).limit(12).all()
        trend = [
            ProgressTrendPoint(
                label=plan.created_at.strftime("%b %d %H:%M"),
                score=plan.assessment_score,
            )
            for plan in reversed(assessment_history)
        ]

        alerts = []
        if skin_score < 65:
            alerts.append("Prioritize a barrier-supportive routine and target your main skin concerns.")
        if hydration_score < 70:
            alerts.append("Increase daily hydration to support smoother skin and better barrier performance.")
        if sleep_score < 70:
            alerts.append("Improved sleep consistency will support recovery and skin resilience.")
        if not skin_prof:
            alerts.append("Complete the skin profile to unlock a more accurate health assessment.")
        if not alerts:
            alerts.append("Your current routine is in a strong maintenance zone. Keep consistency high.")

        summary = (
            "Historical points show scores from your saved skin assessments; current component scores reflect your latest profile and logs."
            if trend else
            "Current component scores reflect your profile and latest logs. Save a skin assessment to begin tracking score history."
        )

        return ProgressAnalyticsResponse(
            overall_skin_health_score=self._clamp(overall_score),
            skin_condition_score=self._clamp(skin_score),
            lifestyle_score=self._clamp(lifestyle_score),
            sleep_score=self._clamp(sleep_score),
            hydration_score=self._clamp(hydration_score),
            trend=trend,
            alerts=alerts,
            summary=summary,
        )

    def get_user_dashboard(self, db: Session, user: User) -> DashboardSummaryResponse:
        # Load user data
        skin_prof = skin_repository.get_by_user_id(db, user.id)
        lifestyle_prof = lifestyle_repository.get_by_user_id(db, user.id)
        recent_sleep = sleep_repository.get_most_recent(db, user.id)
        avg_sleep = sleep_repository.get_average_duration(db, user.id)

        today = date.today()
        today_hydration = hydration_repository.get_daily_total(db, user.id, today)
        recent_hydration_records = hydration_repository.get_user_records(db, user.id, limit=5)
        sleep_records = sleep_repository.get_user_records(db, user.id, limit=1)

        # Calculate completion percentage
        score = 0
        missing_sections = []

        has_skin = skin_prof is not None
        if has_skin:
            score += 40
        else:
            missing_sections.append("Skin Profile")

        has_lifestyle = lifestyle_prof is not None
        if has_lifestyle:
            score += 30
        else:
            missing_sections.append("Lifestyle Information")

        has_sleep = len(sleep_records) > 0
        if has_sleep:
            score += 15
        else:
            missing_sections.append("Sleep Log")

        has_hydration = len(recent_hydration_records) > 0
        if has_hydration:
            score += 15
        else:
            missing_sections.append("Hydration Log")

        completion_status = ProfileCompletionStatus(
            completion_percentage=score,
            skin_profile_completed=has_skin,
            lifestyle_completed=has_lifestyle,
            has_sleep_records=has_sleep,
            has_hydration_records=has_hydration,
            missing_sections=missing_sections,
        )

        return DashboardSummaryResponse(
            user=UserResponse.model_validate(user),
            completion=completion_status,
            skin_profile=SkinProfileResponse.model_validate(skin_prof) if skin_prof else None,
            lifestyle=LifestyleResponse.model_validate(lifestyle_prof) if lifestyle_prof else None,
            recent_sleep=SleepRecordResponse.model_validate(recent_sleep) if recent_sleep else None,
            average_sleep_hours=avg_sleep,
            today_hydration_ml=today_hydration,
            recent_hydration=[HydrationRecordResponse.model_validate(h) for h in recent_hydration_records],
        )


dashboard_service = DashboardService()
