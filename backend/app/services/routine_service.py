from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
import uuid
from sqlalchemy import desc, func
from sqlalchemy.orm import Session, joinedload

from app.models.assessment import AssessmentConcern, RiskFactor, SkinAssessment
from app.models.routine import Routine, RoutineStep
from app.models.routine_adherence import RoutineAdherenceRecord
from app.models.skin_profile import SkinProfile
from app.schemas.routine import FullRoutinePlanResponse, RoutineResponse, RoutineStepResponse
from app.schemas.recommendation import RoutineAdherenceSummaryResponse, RoutineAdherenceDaySummary
from app.services.intelligence.routine_generator import RoutineGenerator


class RoutineService:

    @classmethod
    def generate_routine_plan(
        cls,
        db: Session,
        user_id: uuid.UUID,
        assessment_id: Optional[uuid.UUID] = None,
    ) -> FullRoutinePlanResponse:
        # 1. Fetch user's skin profile
        skin_profile = (
            db.query(SkinProfile)
            .options(joinedload(SkinProfile.concerns))
            .filter(SkinProfile.user_id == user_id)
            .first()
        )

        # 2. Fetch assessment concerns and risks if available
        prioritized_concerns: List[Dict[str, Any]] = []
        risks: List[Dict[str, Any]] = []

        assessment = None
        if assessment_id:
            assessment = (
                db.query(SkinAssessment)
                .options(
                    joinedload(SkinAssessment.concerns),
                    joinedload(SkinAssessment.risk_factors),
                )
                .filter(SkinAssessment.id == assessment_id, SkinAssessment.user_id == user_id)
                .first()
            )
        else:
            assessment = (
                db.query(SkinAssessment)
                .options(
                    joinedload(SkinAssessment.concerns),
                    joinedload(SkinAssessment.risk_factors),
                )
                .filter(SkinAssessment.user_id == user_id)
                .order_by(desc(SkinAssessment.created_at))
                .first()
            )

        if assessment:
            for c in assessment.concerns:
                prioritized_concerns.append({
                    "concern_name": c.concern_name,
                    "priority": c.priority,
                    "severity": c.severity,
                    "confidence": c.confidence,
                    "reasons": c.reasons or [],
                })
            for r in assessment.risk_factors:
                risks.append({
                    "factor_type": r.factor_type,
                    "factor_name": r.factor_name,
                    "impact_level": r.impact_level,
                    "impact_score": r.impact_score,
                    "description": r.description,
                })

        # 3. Calculate next version and archive existing active routines
        max_ver = (
            db.query(func.max(Routine.version))
            .filter(Routine.user_id == user_id)
            .scalar()
        )
        next_version = (max_ver or 0) + 1

        # Deactivate existing routines
        db.query(Routine).filter(
            Routine.user_id == user_id, Routine.is_active == True  # noqa: E712
        ).update({"is_active": False})

        # 4. Generate routines using intelligence generator
        plan_data = RoutineGenerator.generate_routines(
            skin_profile=skin_profile,
            prioritized_concerns=prioritized_concerns,
            risks=risks,
            version=next_version,
            include_seasonal=True,
        )

        created_routines: Dict[str, Routine] = {}

        for r_spec in plan_data["routines"]:
            r_type = r_spec["routine_type"]
            routine_record = Routine(
                user_id=user_id,
                assessment_id=assessment.id if assessment else None,
                routine_type=r_type,
                version=next_version,
                is_active=True,
                summary=plan_data["summary"],
            )
            db.add(routine_record)
            db.flush()  # assign ID

            for step_data in r_spec["steps"]:
                step_record = RoutineStep(
                    routine_id=routine_record.id,
                    step_order=step_data["step_order"],
                    category=step_data["category"],
                    title=step_data["title"],
                    description=step_data.get("description"),
                    frequency=step_data.get("frequency", "DAILY"),
                    key_actives=step_data.get("key_actives"),
                    safety_notes=step_data.get("safety_notes"),
                    product_recommendations=step_data.get("product_recommendations"),
                )
                db.add(step_record)

            created_routines[r_type] = routine_record

        db.commit()

        plan = cls.get_active_routine_plan(db, user_id)
        if not plan:
            raise ValueError("Failed to retrieve generated routine plan")
        return plan

    @classmethod
    def calculate_user_adherence_score(cls, db: Session, user_id: uuid.UUID) -> int:
        """
        Calculates 7-day adherence score (0-100) based on completed routine step logs.
        Defaults to neutral baseline 80 if active routines exist and user just began tracking.
        """
        today_date = datetime.now(timezone.utc).date()
        cutoff_7d = (today_date - timedelta(days=7)).strftime("%Y-%m-%d")
        records = (
            db.query(RoutineAdherenceRecord)
            .filter(
                RoutineAdherenceRecord.user_id == user_id,
                RoutineAdherenceRecord.record_date >= cutoff_7d,
            )
            .all()
        )
        if not records:
            return 80  # Good adherence baseline for fresh regimens

        completed = sum(1 for r in records if r.completed)
        total = len(records)
        rate = completed / max(1, total)
        return min(100, max(15, int(round(rate * 100))))

    @classmethod
    def get_active_routine_plan(
        cls,
        db: Session,
        user_id: uuid.UUID,
    ) -> Optional[FullRoutinePlanResponse]:
        active_routines = (
            db.query(Routine)
            .options(joinedload(Routine.steps))
            .filter(Routine.user_id == user_id, Routine.is_active == True)  # noqa: E712
            .order_by(Routine.routine_type)
            .all()
        )

        if not active_routines:
            return None

        version = active_routines[0].version
        summary = active_routines[0].summary
        created_at = active_routines[0].created_at

        morning_routine = None
        evening_routine = None
        weekly_routine = None
        seasonal_routine = None

        for r in active_routines:
            resp = RoutineResponse.model_validate(r)
            # Ensure steps sorted by step_order
            resp.steps.sort(key=lambda s: s.step_order)

            if r.routine_type == "MORNING":
                morning_routine = resp
            elif r.routine_type == "EVENING":
                evening_routine = resp
            elif r.routine_type == "WEEKLY":
                weekly_routine = resp
            elif r.routine_type == "SEASONAL":
                seasonal_routine = resp

        # If legacy active routine lacks seasonal routine or product recommendations, auto-regenerate it cleanly
        has_seasonal = seasonal_routine is not None
        has_products = all(
            all(bool(s.product_recommendations) for s in r.steps)
            for r in [morning_routine, evening_routine, weekly_routine]
            if r and r.steps
        )
        if (not has_seasonal or not has_products) and active_routines:
            ass_id = active_routines[0].assessment_id
            assessment_id = uuid.UUID(str(ass_id)) if ass_id else None
            return cls.generate_routine_plan(db, user_id, assessment_id)

        # Fetch today's completed step IDs
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        today_records = (
            db.query(RoutineAdherenceRecord)
            .filter(
                RoutineAdherenceRecord.user_id == user_id,
                RoutineAdherenceRecord.record_date == today_str,
                RoutineAdherenceRecord.completed == True,  # noqa: E712
            )
            .all()
        )
        today_completed_ids = [str(rec.routine_step_id) for rec in today_records]
        adherence_score = cls.calculate_user_adherence_score(db, user_id)

        return FullRoutinePlanResponse(
            version=int(version) if version is not None else 1,
            is_active=True,
            summary=str(summary) if summary else None,
            generated_at=created_at,
            morning=morning_routine,
            evening=evening_routine,
            weekly=weekly_routine,
            seasonal=seasonal_routine,
            adherence_score=adherence_score,
            today_completed_step_ids=today_completed_ids,
        )

    @classmethod
    def toggle_step_adherence(
        cls,
        db: Session,
        user_id: uuid.UUID,
        routine_step_id: uuid.UUID,
        record_date: Optional[str] = None,
        completed: Optional[bool] = None,
    ) -> Dict[str, Any]:
        """
        Toggles or sets the completion status of a routine step for a specific date.
        """
        target_date = record_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")

        # Find routine step to obtain routine_id
        step = db.query(RoutineStep).filter(RoutineStep.id == routine_step_id).first()
        if not step:
            raise ValueError("Routine step not found")

        record = (
            db.query(RoutineAdherenceRecord)
            .filter(
                RoutineAdherenceRecord.user_id == user_id,
                RoutineAdherenceRecord.routine_step_id == routine_step_id,
                RoutineAdherenceRecord.record_date == target_date,
            )
            .first()
        )

        if record:
            if completed is not None:
                setattr(record, "completed", bool(completed))
            else:
                setattr(record, "completed", not record.completed)
        else:
            new_val = completed if completed is not None else True
            record = RoutineAdherenceRecord(
                user_id=user_id,
                routine_id=step.routine_id,
                routine_step_id=routine_step_id,
                record_date=target_date,
                completed=new_val,
            )
            db.add(record)

        db.commit()
        db.refresh(record)

        updated_score = cls.calculate_user_adherence_score(db, user_id)
        return {
            "success": True,
            "routine_step_id": str(routine_step_id),
            "record_date": target_date,
            "completed": record.completed,
            "adherence_score": updated_score,
        }

    @classmethod
    def get_adherence_summary(cls, db: Session, user_id: uuid.UUID) -> RoutineAdherenceSummaryResponse:
        """
        Builds 7-day adherence timeline, streak counts, and weekly completion rate.
        """
        today_date = datetime.now(timezone.utc).date()
        today_str = today_date.strftime("%Y-%m-%d")

        # Fetch active routine steps count (morning + evening daily steps)
        active_plan = cls.get_active_routine_plan(db, user_id)
        daily_steps_count = 0
        if active_plan:
            if active_plan.morning:
                daily_steps_count += len(active_plan.morning.steps)
            if active_plan.evening:
                daily_steps_count += len(active_plan.evening.steps)
        if daily_steps_count == 0:
            daily_steps_count = 4  # Fallback standard daily routine count

        # Build 7-day history
        history_7d: List[RoutineAdherenceDaySummary] = []
        logged_days_count = 0
        current_streak = 0
        streak_broken = False

        for offset in range(6, -1, -1):
            d = today_date - timedelta(days=offset)
            d_str = d.strftime("%Y-%m-%d")

            day_recs = (
                db.query(RoutineAdherenceRecord)
                .filter(
                    RoutineAdherenceRecord.user_id == user_id,
                    RoutineAdherenceRecord.record_date == d_str,
                    RoutineAdherenceRecord.completed == True,  # noqa: E712
                )
                .all()
            )
            comp_count = len(day_recs)
            rate = min(1.0, comp_count / daily_steps_count)

            if comp_count > 0:
                logged_days_count += 1
                if not streak_broken:
                    current_streak += 1
            else:
                if offset > 0:  # don't break streak on today if morning hasn't finished
                    streak_broken = True

            history_7d.append(
                RoutineAdherenceDaySummary(
                    record_date=d_str,
                    completed_steps=comp_count,
                    total_steps=daily_steps_count,
                    completion_rate=round(rate, 2),
                )
            )

        # Today's completed step IDs
        today_completed = [
            str(r.routine_step_id)
            for r in db.query(RoutineAdherenceRecord)
            .filter(
                RoutineAdherenceRecord.user_id == user_id,
                RoutineAdherenceRecord.record_date == today_str,
                RoutineAdherenceRecord.completed == True,  # noqa: E712
            )
            .all()
        ]

        adherence_score = cls.calculate_user_adherence_score(db, user_id)
        weekly_rate = sum(h.completion_rate for h in history_7d) / max(1, len(history_7d))

        return RoutineAdherenceSummaryResponse(
            adherence_score=adherence_score,
            streak_days=max(1 if today_completed else 0, current_streak),
            total_logged_days=logged_days_count,
            weekly_completion_rate=round(weekly_rate, 2),
            history_7d=history_7d,
            today_completed_step_ids=today_completed,
        )

    @classmethod
    def get_routine_history(
        cls,
        db: Session,
        user_id: uuid.UUID,
    ) -> List[RoutineResponse]:
        routines = (
            db.query(Routine)
            .options(joinedload(Routine.steps))
            .filter(Routine.user_id == user_id)
            .order_by(desc(Routine.created_at))
            .all()
        )
        return [RoutineResponse.model_validate(r) for r in routines]
