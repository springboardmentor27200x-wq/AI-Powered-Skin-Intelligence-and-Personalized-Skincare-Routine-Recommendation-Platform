"""
Progress Tracking Service — Module 8
=====================================
Provides:
- Progress summary (current vs previous assessment delta)
- Time-series trend data for charts
- Concern trend data
- Routine adherence statistics
- Progress snapshot creation (called after each assessment)
- Assessment history list
"""
from __future__ import annotations

import uuid
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.assessment import SkinAssessment, AssessmentConcern, SkinScore
from app.models.progress import ProgressSnapshot
from app.models.routine import Routine, RoutineStep
from app.models.routine_adherence import RoutineAdherenceRecord
from app.schemas.progress import (
    AdherenceStats,
    AdherenceStepItem,
    AssessmentComparison,
    AssessmentHistoryItem,
    ConcernDelta,
    ConcernTrend,
    ConcernTrendPoint,
    ProgressSummary,
    ScoreDelta,
    TrendData,
    TrendPoint,
    TrendResponse,
)


class ProgressService:

    # ── Snapshot Auto-Sync & Creation ────────────────────────────────────────

    @classmethod
    def _sync_missing_snapshots(cls, db: Session, user_id: uuid.UUID) -> None:
        """
        Scans all completed assessments for the user and automatically
        creates any missing ProgressSnapshot rows so history and trends are never missing data.
        """
        assessments = (
            db.query(SkinAssessment)
            .filter(
                SkinAssessment.user_id == user_id,
                SkinAssessment.status == "COMPLETED",
            )
            .order_by(SkinAssessment.created_at.asc())
            .all()
        )
        for ass in assessments:
            existing = db.query(ProgressSnapshot).filter(
                ProgressSnapshot.assessment_id == ass.id
            ).first()
            if not existing:
                scores = ass.scores
                concern_values: Dict[str, int] = {}
                for concern in (ass.concerns or []):
                    concern_values[concern.concern_name.upper()] = concern.severity

                snap_date = (
                    ass.assessment_date.date()
                    if ass.assessment_date
                    else (ass.created_at.date() if ass.created_at else date.today())
                ).isoformat()

                snap = ProgressSnapshot(
                    user_id=ass.user_id,
                    assessment_id=ass.id,
                    snapshot_date=snap_date,
                    overall_score=ass.overall_score,
                    skin_condition_score=scores.skin_condition_score if scores else None,
                    lifestyle_score=scores.lifestyle_score if scores else None,
                    sleep_score=scores.sleep_score if scores else None,
                    routine_consistency_score=scores.routine_consistency_score if scores else None,
                    hydration_score=scores.hydration_score if scores else None,
                    concern_values=concern_values,
                    created_at=ass.created_at or func.now(),
                )
                db.add(snap)
        try:
            db.commit()
        except Exception:
            db.rollback()

    @classmethod
    def create_snapshot_from_assessment(
        cls,
        db: Session,
        assessment: SkinAssessment,
    ) -> ProgressSnapshot:
        """
        Creates a ProgressSnapshot from a completed assessment.
        Idempotent — skips if a snapshot already exists for this assessment.
        """
        existing = db.query(ProgressSnapshot).filter(
            ProgressSnapshot.assessment_id == assessment.id
        ).first()
        if existing:
            return existing

        scores = assessment.scores  # SkinScore relationship
        concern_values: Dict[str, int] = {}
        for concern in (assessment.concerns or []):
            concern_values[concern.concern_name.upper()] = concern.severity

        snap_date = (
            assessment.assessment_date.date()
            if assessment.assessment_date
            else (assessment.created_at.date() if assessment.created_at else date.today())
        ).isoformat()

        snapshot = ProgressSnapshot(
            user_id=assessment.user_id,
            assessment_id=assessment.id,
            snapshot_date=snap_date,
            overall_score=assessment.overall_score,
            skin_condition_score=scores.skin_condition_score if scores else None,
            lifestyle_score=scores.lifestyle_score if scores else None,
            sleep_score=scores.sleep_score if scores else None,
            routine_consistency_score=scores.routine_consistency_score if scores else None,
            hydration_score=scores.hydration_score if scores else None,
            concern_values=concern_values,
            created_at=assessment.created_at or func.now(),
        )
        db.add(snapshot)
        try:
            db.commit()
            db.refresh(snapshot)
        except Exception:
            db.rollback()
        return snapshot

    # ── Progress Summary ──────────────────────────────────────────────────────

    @classmethod
    def get_progress_summary(
        cls,
        db: Session,
        user_id: uuid.UUID,
    ) -> ProgressSummary:
        """
        Returns current vs previous assessment comparison.
        If only one assessment exists, shows current with no delta.
        If no assessments, returns has_data=False.
        """
        cls._sync_missing_snapshots(db, user_id)

        snapshots = (
            db.query(ProgressSnapshot)
            .filter(ProgressSnapshot.user_id == user_id)
            .order_by(desc(ProgressSnapshot.snapshot_date), desc(ProgressSnapshot.created_at))
            .limit(2)
            .all()
        )

        if not snapshots:
            return ProgressSummary(
                has_data=False,
                assessment_count=0,
                message="Complete your skin assessment to start tracking your progress.",
            )

        total_count = db.query(func.count(ProgressSnapshot.id)).filter(
            ProgressSnapshot.user_id == user_id
        ).scalar() or 0

        current = snapshots[0]
        previous = snapshots[1] if len(snapshots) > 1 else None

        pillar_deltas: List[ScoreDelta] = []
        overall_delta: Optional[int] = None

        if previous:
            overall_delta = int(current.overall_score) - int(previous.overall_score)

            pillar_map = [
                ("Skin Condition", "skin_condition_score"),
                ("Lifestyle", "lifestyle_score"),
                ("Sleep", "sleep_score"),
                ("Routine Consistency", "routine_consistency_score"),
                ("Hydration", "hydration_score"),
            ]
            for label, attr in pillar_map:
                cur_val = getattr(current, attr)
                prev_val = getattr(previous, attr)
                if cur_val is not None and prev_val is not None:
                    delta = int(cur_val) - int(prev_val)
                    pillar_deltas.append(ScoreDelta(
                        pillar=label,
                        previous=int(prev_val),
                        current=int(cur_val),
                        delta=delta,
                        direction="improved" if delta > 0 else ("declined" if delta < 0 else "unchanged"),
                    ))

        # Friendly message
        if overall_delta is not None:
            if overall_delta > 0:
                message = f"Your skin health score improved by {overall_delta} points since your last assessment."
            elif overall_delta < 0:
                message = f"Your skin health score declined by {abs(overall_delta)} points. Review your routine and habits."
            else:
                message = "Your skin health score is unchanged since your last assessment."
        else:
            message = "Complete another assessment to start seeing your progress over time."

        return ProgressSummary(
            has_data=True,
            assessment_count=total_count,
            current_score=int(current.overall_score),
            previous_score=int(previous.overall_score) if previous else None,
            overall_delta=overall_delta,
            pillar_deltas=pillar_deltas,
            assessment_date=str(current.snapshot_date),
            previous_date=str(previous.snapshot_date) if previous else None,
            message=message,
        )

    # ── Trend Data ────────────────────────────────────────────────────────────

    @classmethod
    def get_trend_data(
        cls,
        db: Session,
        user_id: uuid.UUID,
        period: str = "30d",
    ) -> TrendResponse:
        """
        Returns time-series score data for all pillars.
        Period: 7d | 30d | 90d | all
        Only shows real persisted assessment data.
        """
        cls._sync_missing_snapshots(db, user_id)

        cutoff = cls._period_to_cutoff(period)
        query = db.query(ProgressSnapshot).filter(ProgressSnapshot.user_id == user_id)
        if cutoff:
            query = query.filter(ProgressSnapshot.snapshot_date >= cutoff.isoformat())
        snapshots = query.order_by(ProgressSnapshot.snapshot_date.asc(), ProgressSnapshot.created_at.asc()).all()

        # If period filtering resulted in < 2 snapshots but user has more snapshots all-time,
        # fallback to all snapshots so the trend chart is never empty or broken.
        if len(snapshots) < 2 and period != "all":
            all_snaps = (
                db.query(ProgressSnapshot)
                .filter(ProgressSnapshot.user_id == user_id)
                .order_by(ProgressSnapshot.snapshot_date.asc(), ProgressSnapshot.created_at.asc())
                .all()
            )
            if len(all_snaps) >= 1:
                snapshots = all_snaps

        def build_trend(attr: str, metric: str) -> TrendData:
            points = []
            for snap in snapshots:
                val = getattr(snap, attr)
                if val is None:
                    val = snap.overall_score
                points.append(TrendPoint(
                    date=str(snap.snapshot_date),
                    score=int(val) if val is not None else 0,
                    assessment_id=str(snap.assessment_id),
                ))
            return TrendData(
                metric=metric,
                period=period,
                data_points=points,
                insufficient_data=len(points) < 2,
            )

        return TrendResponse(
            overall=build_trend("overall_score", "overall_score"),
            skin_condition=build_trend("skin_condition_score", "skin_condition"),
            lifestyle=build_trend("lifestyle_score", "lifestyle"),
            sleep=build_trend("sleep_score", "sleep"),
            hydration=build_trend("hydration_score", "hydration"),
            routine_consistency=build_trend("routine_consistency_score", "routine_consistency"),
            period=period,
        )

    # ── Concern Trends ────────────────────────────────────────────────────────

    @classmethod
    def get_concern_trends(
        cls,
        db: Session,
        user_id: uuid.UUID,
        period: str = "30d",
    ) -> List[ConcernTrend]:
        """Returns per-concern severity trends over time."""
        cls._sync_missing_snapshots(db, user_id)

        cutoff = cls._period_to_cutoff(period)
        query = db.query(ProgressSnapshot).filter(ProgressSnapshot.user_id == user_id)
        if cutoff:
            query = query.filter(ProgressSnapshot.snapshot_date >= cutoff.isoformat())
        snapshots = query.order_by(ProgressSnapshot.snapshot_date.asc(), ProgressSnapshot.created_at.asc()).all()

        if len(snapshots) < 2 and period != "all":
            all_snaps = (
                db.query(ProgressSnapshot)
                .filter(ProgressSnapshot.user_id == user_id)
                .order_by(ProgressSnapshot.snapshot_date.asc(), ProgressSnapshot.created_at.asc())
                .all()
            )
            if len(all_snaps) >= 2:
                snapshots = all_snaps

        concern_data: Dict[str, List[ConcernTrendPoint]] = defaultdict(list)
        for snap in snapshots:
            if snap.concern_values:
                for concern, severity in snap.concern_values.items():
                    concern_data[concern].append(ConcernTrendPoint(
                        date=str(snap.snapshot_date),
                        severity=severity,
                    ))

        return [
            ConcernTrend(concern=concern, data_points=points)
            for concern, points in concern_data.items()
        ]

    # ── Adherence Stats ───────────────────────────────────────────────────────

    @classmethod
    def get_adherence_stats(
        cls,
        db: Session,
        user_id: uuid.UUID,
    ) -> AdherenceStats:
        """
        Calculates routine adherence from persisted RoutineAdherenceRecord rows.
        Includes interactive today_steps list for the active daily routines.
        """
        # Get user's active daily routines (MORNING and EVENING)
        active_routines = (
            db.query(Routine)
            .filter(
                Routine.user_id == user_id,
                Routine.is_active == True,
                Routine.routine_type.in_(["MORNING", "EVENING"]),
            )
            .order_by(desc(Routine.created_at))
            .all()
        )

        # Fallback to any active routine if none specifically morning/evening
        if not active_routines:
            active_routines = (
                db.query(Routine)
                .filter(Routine.user_id == user_id, Routine.is_active == True)
                .order_by(desc(Routine.created_at))
                .all()
            )

        # If no active routines, check if user has a completed assessment and auto-generate routine
        if not active_routines:
            latest_assessment = (
                db.query(SkinAssessment)
                .filter(SkinAssessment.user_id == user_id, SkinAssessment.status == "COMPLETED")
                .order_by(desc(SkinAssessment.created_at))
                .first()
            )
            if latest_assessment:
                try:
                    from app.services.routine_service import RoutineService
                    target_ass_id = uuid.UUID(str(latest_assessment.id))
                    RoutineService.generate_routine_plan(db, user_id, target_ass_id)
                    active_routines = (
                        db.query(Routine)
                        .filter(
                            Routine.user_id == user_id,
                            Routine.is_active == True,
                            Routine.routine_type.in_(["MORNING", "EVENING"]),
                        )
                        .order_by(desc(Routine.created_at))
                        .all()
                    )
                except Exception:
                    pass

        if not active_routines:
            return AdherenceStats(
                today_completed=0, today_total=0, today_percent=None,
                week_completed=0, week_total=0, week_percent=None,
                streak_days=0, has_routine=False, today_steps=[],
            )

        seen_step_ids = set()
        all_steps: List[RoutineStep] = []
        for r in active_routines:
            for s in r.steps:
                if str(s.id) not in seen_step_ids:
                    seen_step_ids.add(str(s.id))
                    all_steps.append(s)

        total_steps = len(all_steps)
        if total_steps == 0:
            return AdherenceStats(
                today_completed=0, today_total=0, today_percent=None,
                week_completed=0, week_total=0, week_percent=None,
                streak_days=0, has_routine=True, today_steps=[],
            )

        # Accommodate both local server date and UTC date to prevent timezone misses
        today_local = date.today().isoformat()
        today_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        possible_today_dates = list({today_local, today_utc})

        # Query today's completed records for these steps
        today_completed_records = (
            db.query(RoutineAdherenceRecord)
            .filter(
                RoutineAdherenceRecord.user_id == user_id,
                RoutineAdherenceRecord.record_date.in_(possible_today_dates),
                RoutineAdherenceRecord.completed == True,
            )
            .all()
        )
        completed_step_ids = {str(r.routine_step_id) for r in today_completed_records}
        today_completed = len(completed_step_ids)
        today_pct = round(today_completed / total_steps * 100, 1)

        # Build today_steps item list
        today_steps_list = []
        for s in all_steps:
            r_type = s.routine.routine_type if s.routine else "DAILY"
            today_steps_list.append(
                AdherenceStepItem(
                    id=str(s.id),
                    title=str(s.title or "Routine Step"),
                    routine_type=r_type,
                    step_order=int(s.step_order or 1),
                    completed=(str(s.id) in completed_step_ids),
                )
            )

        # Weekly adherence (last 7 days)
        week_start = (date.today() - timedelta(days=6)).isoformat()
        week_records = (
            db.query(RoutineAdherenceRecord)
            .filter(
                RoutineAdherenceRecord.user_id == user_id,
                RoutineAdherenceRecord.record_date >= week_start,
                RoutineAdherenceRecord.completed == True,
            )
            .all()
        )
        week_completed = len(week_records)
        week_total = total_steps * 7
        week_pct = round(week_completed / week_total * 100, 1) if week_total > 0 else 0.0

        # Streak calculation: consecutive days with >= 1 completed step
        streak = 0
        check_date = date.today()
        # If today has at least 1 completed step:
        if today_completed > 0:
            streak += 1
            check_date -= timedelta(days=1)
        else:
            # If today has not been logged yet, check starting from yesterday so streak doesn't drop to 0 mid-day
            check_date -= timedelta(days=1)

        while True:
            day_str = check_date.isoformat()
            day_count = (
                db.query(func.count(RoutineAdherenceRecord.id))
                .filter(
                    RoutineAdherenceRecord.user_id == user_id,
                    RoutineAdherenceRecord.record_date == day_str,
                    RoutineAdherenceRecord.completed == True,
                )
                .scalar() or 0
            )
            if day_count > 0:
                streak += 1
                check_date -= timedelta(days=1)
            else:
                break
            if streak > 365:
                break

        return AdherenceStats(
            today_completed=today_completed,
            today_total=total_steps,
            today_percent=today_pct,
            week_completed=week_completed,
            week_total=week_total,
            week_percent=week_pct,
            streak_days=streak,
            has_routine=True,
            today_steps=today_steps_list,
        )

    # ── Assessment History ────────────────────────────────────────────────────

    @classmethod
    def get_assessment_history(
        cls,
        db: Session,
        user_id: uuid.UUID,
        limit: int = 20,
    ) -> List[AssessmentHistoryItem]:
        """Returns ordered assessment history list."""
        cls._sync_missing_snapshots(db, user_id)

        snapshots = (
            db.query(ProgressSnapshot)
            .filter(ProgressSnapshot.user_id == user_id)
            .order_by(desc(ProgressSnapshot.snapshot_date), desc(ProgressSnapshot.created_at))
            .limit(limit)
            .all()
        )
        items = []
        for snap in snapshots:
            # Get top concerns for this assessment
            concerns = (
                db.query(AssessmentConcern)
                .filter(AssessmentConcern.assessment_id == snap.assessment_id)
                .order_by(AssessmentConcern.severity.desc())
                .limit(3)
                .all()
            )
            top_concerns = [c.concern_name.replace("_", " ").title() for c in concerns]
            items.append(AssessmentHistoryItem(
                assessment_id=str(snap.assessment_id),
                date=str(snap.snapshot_date),
                overall_score=int(snap.overall_score),
                skin_condition_score=int(snap.skin_condition_score) if snap.skin_condition_score is not None else None,
                lifestyle_score=int(snap.lifestyle_score) if snap.lifestyle_score is not None else None,
                sleep_score=int(snap.sleep_score) if snap.sleep_score is not None else None,
                hydration_score=int(snap.hydration_score) if snap.hydration_score is not None else None,
                routine_consistency_score=int(snap.routine_consistency_score) if snap.routine_consistency_score is not None else None,
                top_concerns=top_concerns,
                concern_values=dict(snap.concern_values) if snap.concern_values else None,
            ))
        return items

    # ── Assessment Comparison ─────────────────────────────────────────────────

    @classmethod
    def compare_assessments(
        cls,
        db: Session,
        user_id: uuid.UUID,
        baseline_id: Optional[str] = None,
        target_id: Optional[str] = None,
    ) -> AssessmentComparison:
        """
        Performs a full side-by-side comparative analysis between two assessments.
        If baseline_id or target_id is omitted, compares the two most recent assessments.
        """
        cls._sync_missing_snapshots(db, user_id)

        # Get all assessments available for selection
        history_items = cls.get_assessment_history(db, user_id, limit=30)
        if len(history_items) < 2:
            single = history_items[0] if history_items else None
            return AssessmentComparison(
                has_comparison=False,
                baseline_id=single.assessment_id if single else None,
                baseline_date=single.date if single else None,
                baseline_score=single.overall_score if single else None,
                summary_text="Complete at least two assessments to enable longitudinal progress comparison.",
                available_assessments=history_items,
            )

        snap_query = db.query(ProgressSnapshot).filter(ProgressSnapshot.user_id == user_id)
        
        target_snap: Optional[ProgressSnapshot] = None
        baseline_snap: Optional[ProgressSnapshot] = None

        if target_id:
            try:
                target_snap = snap_query.filter(ProgressSnapshot.assessment_id == uuid.UUID(target_id)).first()
            except Exception:
                pass
        if baseline_id:
            try:
                baseline_snap = snap_query.filter(ProgressSnapshot.assessment_id == uuid.UUID(baseline_id)).first()
            except Exception:
                pass

        # Ordered snapshots (most recent first)
        ordered_snaps = (
            snap_query
            .order_by(desc(ProgressSnapshot.snapshot_date), desc(ProgressSnapshot.created_at))
            .all()
        )
        if not target_snap:
            target_snap = ordered_snaps[0]
        if not baseline_snap:
            for s in ordered_snaps:
                if s.assessment_id != target_snap.assessment_id:
                    baseline_snap = s
                    break
            if not baseline_snap:
                baseline_snap = ordered_snaps[-1]

        # Calculate days apart
        try:
            d_base = date.fromisoformat(str(baseline_snap.snapshot_date))
            d_target = date.fromisoformat(str(target_snap.snapshot_date))
            days_apart = abs((d_target - d_base).days)
        except Exception:
            days_apart = 0

        # Overall delta
        overall_delta = int(target_snap.overall_score) - int(baseline_snap.overall_score)
        direction = "improved" if overall_delta > 0 else ("declined" if overall_delta < 0 else "unchanged")

        # 5 Pillar deltas
        pillar_map = [
            ("Skin Condition", "skin_condition_score"),
            ("Hydration", "hydration_score"),
            ("Sleep", "sleep_score"),
            ("Lifestyle", "lifestyle_score"),
            ("Routine Consistency", "routine_consistency_score"),
        ]
        pillar_deltas: List[ScoreDelta] = []
        for label, attr in pillar_map:
            b_val = getattr(baseline_snap, attr)
            t_val = getattr(target_snap, attr)
            if b_val is not None or t_val is not None:
                p_prev = int(b_val) if b_val is not None else 0
                p_cur = int(t_val) if t_val is not None else 0
                p_delta = p_cur - p_prev
                pillar_deltas.append(
                    ScoreDelta(
                        pillar=label,
                        previous=p_prev,
                        current=p_cur,
                        delta=p_delta,
                        direction="improved" if p_delta > 0 else ("declined" if p_delta < 0 else "unchanged"),
                    )
                )

        # Concern deltas
        b_concerns = baseline_snap.concern_values or {}
        t_concerns = target_snap.concern_values or {}
        all_concern_names = sorted(set(b_concerns.keys()) | set(t_concerns.keys()))

        concern_deltas: List[ConcernDelta] = []
        for c_name in all_concern_names:
            b_sev = b_concerns.get(c_name)
            t_sev = t_concerns.get(c_name)
            display_name = c_name.replace("_", " ").title()

            if b_sev is not None and (t_sev is None or t_sev == 0):
                status = "resolved"
                delta = b_sev
            elif (b_sev is None or b_sev == 0) and t_sev is not None:
                status = "new"
                delta = -t_sev
            elif b_sev is not None and t_sev is not None:
                delta = b_sev - t_sev  # positive delta means severity decreased (improved!)
                if delta > 0:
                    status = "improved"
                elif delta < 0:
                    status = "worsened"
                else:
                    status = "unchanged"
            else:
                status = "unchanged"
                delta = 0

            concern_deltas.append(
                ConcernDelta(
                    concern=display_name,
                    baseline_severity=b_sev,
                    target_severity=t_sev,
                    delta=delta,
                    status=status,
                )
            )

        # Narrative clinical summary
        improved_pillars = [p.pillar for p in pillar_deltas if p.delta and p.delta > 0]
        improved_concerns = [c.concern for c in concern_deltas if c.status in ("improved", "resolved")]

        narrative_parts = []
        if overall_delta > 0:
            narrative_parts.append(f"Overall skin resilience increased by +{overall_delta} points across {days_apart} days.")
        elif overall_delta < 0:
            narrative_parts.append(f"Overall skin score declined by {abs(int(overall_delta))} points across {days_apart} days.")
        else:
            narrative_parts.append(f"Skin barrier metrics held steady across {days_apart} days.")

        if improved_pillars:
            narrative_parts.append(f"Notable improvements observed in {', '.join(improved_pillars[:2])}.")
        if improved_concerns:
            narrative_parts.append(f"Key concern relief noted for {', '.join(improved_concerns[:2])}.")

        summary_text = " ".join(narrative_parts)

        return AssessmentComparison(
            has_comparison=True,
            baseline_id=str(baseline_snap.assessment_id),
            target_id=str(target_snap.assessment_id),
            baseline_date=str(baseline_snap.snapshot_date),
            target_date=str(target_snap.snapshot_date),
            days_apart=days_apart,
            baseline_score=int(baseline_snap.overall_score),
            target_score=int(target_snap.overall_score),
            overall_delta=int(overall_delta),
            direction=direction,
            pillar_deltas=pillar_deltas,
            concern_deltas=concern_deltas,
            summary_text=summary_text,
            available_assessments=history_items,
        )

    # ── Helper ────────────────────────────────────────────────────────────────

    @staticmethod
    def _period_to_cutoff(period: str) -> Optional[date]:
        if period == "7d":
            return date.today() - timedelta(days=7)
        if period == "30d":
            return date.today() - timedelta(days=30)
        if period == "90d":
            return date.today() - timedelta(days=90)
        return None   # "all"

