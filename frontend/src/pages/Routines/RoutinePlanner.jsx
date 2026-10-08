import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Sparkles, Calendar, ArrowRight } from 'lucide-react';
import routineService from '../../services/routineService';
import { useToast } from '../../components/Toast';
import RoutineTimeline from '../../components/ui/RoutineTimeline';
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { SkeletonList, Spinner } from '../../components/ui/LoadingState';
import SeasonalAdvisoryCard from '../../components/ui/SeasonalAdvisoryCard';
import ProductShowcase from '../../components/ui/ProductShowcase';

// ─── Map backend routine plan to RoutineTimeline shape ─────────────────────
// Backend returns: { morning_steps: [], evening_steps: [], weekly_steps: [], version, ... }
// RoutineTimeline expects: { morning: { steps: [] }, evening: { steps: [] }, weekly: { steps: [] } }

const mapPlan = (raw) => {
  if (!raw) return null;
  const mapSteps = (steps) =>
    (steps ?? []).map((s, i) => ({
      id:           s.id ?? `step-${i}`,
      title:        s.title ?? s.product_type ?? s.step_name ?? s.category ?? `Step ${i + 1}`,
      category:     s.category,
      description:  s.description ?? s.notes,
      key_actives:  s.key_actives ?? s.ingredients ?? [],
      safety_notes: s.safety_notes ?? s.safety_warning ?? null,
      frequency:    s.frequency ?? 'Daily',
      product_recommendations: s.product_recommendations ?? [],
    }));

  return {
    morning: { steps: mapSteps(raw.morning_steps ?? raw.morning?.steps ?? []) },
    evening: { steps: mapSteps(raw.evening_steps ?? raw.evening?.steps ?? []) },
    weekly:  { steps: mapSteps(raw.weekly_steps  ?? raw.weekly?.steps  ?? []) },
    seasonal: { steps: mapSteps(raw.seasonal_steps ?? raw.seasonal?.steps ?? []) },
    version: raw.version,
    adherence_score: raw.adherence_score,
    today_completed_step_ids: raw.today_completed_step_ids ?? [],
    generatedAt: raw.generated_at ?? raw.created_at,
  };
};

// ─── RoutinePlanner ──────────────────────────────────────────────────────────

const RoutinePlanner = () => {
  const toast = useToast();

  const [loading,    setLoading]    = useState(true);
  const [generating, setGenerating] = useState(false);
  const [plan,       setPlan]       = useState(null);
  const [error,      setError]      = useState(null);

  useEffect(() => { fetchCurrentPlan(); }, []);

  const fetchCurrentPlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await routineService.getCurrentRoutinePlan();
      setPlan(mapPlan(data));
    } catch (err) {
      if (err.response?.status === 404) {
        setPlan(null);
      } else {
        setError('Failed to load your routine plan. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setGenerating(true);
    try {
      const newPlan = await routineService.generateNewRoutineVersion();
      setPlan(mapPlan(newPlan));
      toast.success(`Routine v${newPlan.version} generated successfully!`);
    } catch (err) {
      toast.error('Failed to regenerate routine plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="h-16 skeleton rounded-[var(--radius-xl)]" />
        <SkeletonList count={4} />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <ErrorState
          title="Unable to load routine"
          message={error}
          reasons={['Network issue', 'Session may have expired']}
          onRetry={fetchCurrentPlan}
        />
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────

  if (!plan) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-sm)]">
          <EmptyState
            Icon={Calendar}
            title="No routine generated yet"
            description="Run your first skin assessment to generate a personalized morning, evening, and weekly routine."
            cta="Start Assessment"
            ctaTo="/assessment"
          />
        </div>
      </div>
    );
  }

  // ── Has routine ──────────────────────────────────────────────────────────

  const lastUpdated = plan.generatedAt
    ? new Date(plan.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header card */}
      <div className="bg-[var(--color-sidebar-bg)] rounded-[var(--radius-2xl)] p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Your Personalized Routine</p>
            <h1 className="text-xl font-black text-white">Built around your priorities.</h1>
            {plan.version && (
              <p className="text-xs text-white/40 mt-1">
                Version {plan.version}{lastUpdated ? ` · Updated ${lastUpdated}` : ''}
              </p>
            )}
          </div>
          <button
            onClick={handleRegenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-50 text-white text-xs font-bold rounded-[var(--radius-lg)] transition-colors flex-shrink-0"
            aria-label="Regenerate routine plan"
          >
            {generating
              ? <><Spinner size={13} className="border-white/30 border-t-white" /> Generating...</>
              : <><RefreshCw size={13} aria-hidden="true" /> Regenerate</>
            }
          </button>
        </div>
      </div>

      {/* Seasonal Climate & TEWL Advisory */}
      <SeasonalAdvisoryCard seasonalRoutine={plan?.seasonal} />

      {/* Routine tabs */}
      <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-sm)] p-6">
        <RoutineTimeline plan={plan} />
      </div>

      {/* Curated Product Recommendations */}
      <ProductShowcase routinePlan={plan} />

      {/* Assessment reminder */}
      <div className="bg-[var(--color-brand-light)] border border-[var(--color-brand-mid)] rounded-[var(--radius-xl)] p-4 flex items-center gap-4">
        <Sparkles size={16} className="text-[var(--color-brand)] flex-shrink-0" aria-hidden="true" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-[var(--color-brand-dark)]">Keep your routine fresh</p>
          <p className="text-[10px] text-[var(--color-brand)]">Run a new assessment to update your routine as your skin changes.</p>
        </div>
        <Link
          to="/assessment"
          className="flex items-center gap-1 text-[10px] font-bold text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] flex-shrink-0"
          aria-label="Go to assessment"
        >
          Assess <ArrowRight size={11} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
};

export default RoutinePlanner;
