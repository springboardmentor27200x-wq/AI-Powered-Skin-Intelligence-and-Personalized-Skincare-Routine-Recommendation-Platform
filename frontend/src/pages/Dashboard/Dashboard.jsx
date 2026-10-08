import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { skinService } from '../../services/skin';
import { trackingService } from '../../services/tracking';
import { assessmentService } from '../../services/assessmentService';
import { routineService } from '../../services/routineService';
import { progressService } from '../../services/progressService';
import { useToast } from '../../components/Toast';
import {
  Sparkles, Brain, ShieldCheck, Droplet, Moon, Activity, Sun,
  ArrowRight, AlertTriangle, CheckCircle2, Clock, Zap, TrendingUp,
  TrendingDown, Minus, RefreshCw, ChevronRight, Info, Target,
  FlaskConical, Calendar, Layers, Plus, Flame, Check,
} from 'lucide-react';
import ClinicalAdvisoryCard from '../../components/ui/ClinicalAdvisoryCard';
import BarrierForecastCard from '../../components/ui/BarrierForecastCard';
import SeasonalAdvisoryCard from '../../components/ui/SeasonalAdvisoryCard';
import ProductShowcase from '../../components/ui/ProductShowcase';

// ─── Constants wired to backend enum values ──────────────────────────────────

const CONCERN_META = {
  ACNE: { label: 'Acne', color: '#ef4444', icon: '🔴' },
  HYPERPIGMENTATION: { label: 'Hyperpigmentation', color: '#a855f7', icon: '🟣' },
  DARK_SPOTS: { label: 'Dark Spots', color: '#8b5cf6', icon: '🟤' },
  DRY_SKIN: { label: 'Dry Skin', color: '#3b82f6', icon: '💧' },
  OILY_SKIN: { label: 'Oily Skin', color: '#f59e0b', icon: '✨' },
  SENSITIVE_SKIN: { label: 'Sensitive Skin', color: '#f97316', icon: '⚠️' },
  WRINKLES: { label: 'Wrinkles', color: '#6366f1', icon: '〰️' },
  FINE_LINES: { label: 'Fine Lines', color: '#818cf8', icon: '➰' },
  REDNESS: { label: 'Redness', color: '#f43f5e', icon: '🩸' },
  UNEVEN_TONE: { label: 'Uneven Tone', color: '#84cc16', icon: '🌈' },
};

const RISK_META = {
  STRESS: { label: 'Stress', icon: Brain, color: '#f97316', bg: 'bg-orange-50', border: 'border-orange-200', route: '/lifestyle' },
  SLEEP: { label: 'Sleep', icon: Moon, color: '#6366f1', bg: 'bg-indigo-50', border: 'border-indigo-200', route: '/sleep' },
  HYDRATION: { label: 'Hydration', icon: Droplet, color: '#3b82f6', bg: 'bg-blue-50', border: 'border-blue-200', route: '/hydration' },
  LIFESTYLE: { label: 'Lifestyle', icon: Activity, color: '#10b981', bg: 'bg-emerald-50', border: 'border-emerald-200', route: '/lifestyle' },
  ENVIRONMENT: { label: 'Environment', icon: Sun, color: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200', route: '/environment' },
};

const IMPACT_ORDER = { HIGH: 0, MODERATE: 1, LOW: 2 };

// ─── Shared utility helpers ───────────────────────────────────────────────────

const pct = (v) => Math.min(100, Math.max(0, Math.round((v ?? 0) * 100)));

const scoreColor = (score) => {
  if (score >= 75) return { ring: '#22c55e', label: 'Excellent', text: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (score >= 55) return { ring: '#f59e0b', label: 'Fair', text: 'text-amber-600', bg: 'bg-amber-50' };
  return { ring: '#ef4444', label: 'Needs Care', text: 'text-red-600', bg: 'bg-red-50' };
};

const riskColor = (level) => {
  if (level === 'HIGH') return { bar: '#ef4444', badge: 'bg-red-100 text-red-700' };
  if (level === 'MODERATE') return { bar: '#f59e0b', badge: 'bg-amber-100 text-amber-700' };
  return { bar: '#22c55e', badge: 'bg-emerald-100 text-emerald-700' };
};

const probColor = (prob) => {
  if (prob >= 0.6) return '#ef4444';
  if (prob >= 0.3) return '#f59e0b';
  return '#22c55e';
};

const greetingFor = (h) =>
  h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

const timeSince = (dateStr) => {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Animated bar that respects prefers-reduced-motion */
const AnimatedBar = ({ pctValue, color, heightClass = 'h-2', delay = 0 }) => (
  <div className={`w-full ${heightClass} bg-gray-100 rounded-full overflow-hidden`}>
    <div
      className="h-full rounded-full transition-all duration-700 ease-out"
      style={{
        width: `${pctValue}%`,
        backgroundColor: color,
        transitionDelay: `${delay}ms`,
      }}
    />
  </div>
);

/** Skeleton pulse block */
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
);

/** Score ring SVG — single responsibility */
const ScoreRing = ({ score, size = 96, stroke = 7 }) => {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const { ring, label } = scoreColor(score);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={ring} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-white leading-none">{score}</span>
        <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider mt-0.5">{label}</span>
      </div>
    </div>
  );
};

/** Routine adherence circular ring for dark hero card */
const DarkAdherenceRing = ({ pct, label, completed, total }) => {
  const pctSafe = pct ?? 0;
  const color = pctSafe >= 70 ? '#22c55e' : pctSafe >= 40 ? '#f59e0b' : pctSafe > 0 ? '#38bdf8' : '#4a8c6e';
  const track = 'rgba(255, 255, 255, 0.08)';

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-1.5 transition-all duration-700 relative"
        style={{
          background: `conic-gradient(${color} ${pctSafe}%, ${track} 0)`,
          boxShadow: `0 0 0 2px rgba(255,255,255,0.06), 0 0 10px ${pctSafe > 0 ? `${color}30` : 'transparent'}`,
        }}
      >
        <div className="w-10 h-10 bg-[#162923] rounded-full flex items-center justify-center border border-white/5">
          <span className="text-xs font-bold text-white">{Math.round(pctSafe)}%</span>
        </div>
      </div>
      <p className="text-xs font-bold text-white leading-tight">{label}</p>
      {completed !== undefined && (
        <p className="text-[10px] text-white/50 mt-0.5">{completed}/{total} steps</p>
      )}
    </div>
  );
};

/** AI mode badge (AI_ASSISTED | RULE_BASED_FALLBACK) */
const ModeBadge = ({ mode }) => {
  const isAI = mode === 'AI_ASSISTED';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isAI
      ? 'bg-violet-500/20 text-violet-200 border-violet-400/30'
      : 'bg-white/10 text-white/50 border-white/20'
      }`}>
      <FlaskConical size={9} />
      {isAI ? 'Neural Net' : 'Rule-Based'}
    </span>
  );
};

/** Daily tracking tile with AI-impact awareness */
const TrackingTile = ({ icon: Icon, label, value, sub, color, logged, aiImpact, onClick, to }) => {
  const Wrapper = to ? Link : 'button';
  const wrapperProps = to ? { to } : { onClick, type: 'button' };

  return (
    <Wrapper
      {...wrapperProps}
      className="group relative bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-2 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 text-left w-full cursor-pointer"
    >
      {/* Logged indicator */}
      <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${logged ? 'bg-emerald-400' : 'bg-gray-200'}`} />

      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={16} className="text-white" />
      </div>

      <div>
        <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <p className="text-sm font-bold text-gray-800 mt-0.5">{value || '—'}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>

      {aiImpact && (
        <p className="text-[9px] text-indigo-500 font-medium leading-tight border-t border-gray-50 pt-1.5">
          <span className="text-indigo-400">AI:</span> {aiImpact}
        </p>
      )}
    </Wrapper>
  );
};

const normalizeRoutine = (raw) => {
  if (!raw) return null;
  const mapSteps = (steps) =>
    (steps ?? []).map((s, i) => ({
      id: s.id ?? `step-${i}`,
      title: s.title ?? s.product_type ?? s.step_name ?? s.category ?? `Step ${i + 1}`,
      category: s.category,
      description: s.description ?? s.notes,
      key_actives: s.key_actives ?? s.ingredients ?? [],
      safety_notes: s.safety_notes ?? s.safety_warning ?? null,
      frequency: s.frequency ?? 'DAILY',
      product_recommendations: s.product_recommendations ?? [],
    }));

  return {
    morning: { steps: mapSteps(raw.morning_steps ?? raw.morning?.steps ?? []) },
    evening: { steps: mapSteps(raw.evening_steps ?? raw.evening?.steps ?? []) },
    weekly: { steps: mapSteps(raw.weekly_steps ?? raw.weekly?.steps ?? []) },
    seasonal: { steps: mapSteps(raw.seasonal_steps ?? raw.seasonal?.steps ?? []) },
    version: raw.version ?? 1,
    today_completed_step_ids: raw.today_completed_step_ids ?? [],
    allergen_safety_summary: raw.allergen_safety_summary,
  };
};

/** Daily Skincare Checklist & Personalized Routine Interactive Component */
const DailySkincareChecklist = ({ routine, onToggleStep, todayCompletedIds }) => {
  const [selectedTab, setSelectedTab] = useState(() => (new Date().getHours() < 17 ? 'morning' : 'evening'));

  const steps = routine?.[selectedTab]?.steps ?? [];
  const completedInTab = steps.filter((s) => todayCompletedIds.has(String(s.id))).length;
  const totalInTab = steps.length;
  const progressPercent = totalInTab > 0 ? Math.round((completedInTab / totalInTab) * 100) : 0;

  const tabs = [
    { key: 'morning', label: 'Morning Routine', icon: Sun },
    { key: 'evening', label: 'Evening Routine', icon: Moon },
    { key: 'weekly', label: 'Weekly Treatment', icon: Calendar },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-5 pb-3 border-b border-gray-50 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#eaf4ef] rounded-xl flex items-center justify-center">
            <CheckCircle2 size={16} className="text-[#4a8c6e]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">Daily Skincare Checklist</h3>
            <p className="text-[10px] text-gray-400 font-medium">
              {routine ? `v${routine.version} · Active Personalized Regimen` : 'Regimen Checklist'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            to="/routine"
            className="text-xs font-bold text-[#4a8c6e] hover:text-[#3a7a5e] flex items-center gap-1 transition-colors px-2.5 py-1 rounded-lg bg-[#eaf4ef]/60 hover:bg-[#eaf4ef]"
          >
            Routine Planner <ArrowRight size={11} />
          </Link>
        </div>
      </div>

      {/* Routine Tab Selector */}
      <div className="px-5 pt-3 pb-2 flex gap-1.5 bg-gray-50/50 border-b border-gray-50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = selectedTab === tab.key;
          const count = routine?.[tab.key]?.steps?.length ?? 0;
          return (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200/80 font-bold'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/60'
              }`}
            >
              <Icon size={12} className={isSelected ? 'text-[#4a8c6e]' : 'text-gray-400'} />
              <span>{tab.label.split(' ')[0]}</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-[#eaf4ef] text-[#4a8c6e]' : 'bg-gray-200/60 text-gray-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      {totalInTab > 0 && (
        <div className="px-5 pt-3 pb-2">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-semibold text-gray-600">
              {completedInTab} of {totalInTab} steps completed today
            </span>
            <span className="font-bold text-[#4a8c6e]">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#4a8c6e] to-[#2d6b51] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Steps List */}
      <div className="px-5 py-3 space-y-2.5 flex-1 overflow-y-auto max-h-[380px]">
        {steps.length > 0 ? (
          steps.map((step, idx) => {
            const isCompleted = todayCompletedIds.has(String(step.id));
            return (
              <div
                key={step.id ?? idx}
                onClick={() => onToggleStep(step.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                  isCompleted
                    ? 'bg-emerald-50/60 border-emerald-200/80 text-gray-500'
                    : 'bg-white hover:bg-gray-50/80 border-gray-200/80 hover:border-gray-300'
                }`}
              >
                <button
                  type="button"
                  aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                  className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all mt-0.5 ${
                    isCompleted
                      ? 'bg-[#4a8c6e] text-white shadow-sm'
                      : 'border-2 border-gray-300 hover:border-[#4a8c6e] text-transparent'
                  }`}
                >
                  <Check size={14} className={isCompleted ? 'opacity-100 stroke-[3]' : 'opacity-0'} />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[10px] font-bold text-gray-400">Step {idx + 1}</span>
                    {step.category && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                        {step.category.replace('_', ' ')}
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                        Done
                      </span>
                    )}
                  </div>

                  <p className={`text-xs font-bold transition-all ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {step.title}
                  </p>

                  {step.description && (
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {step.description}
                    </p>
                  )}

                  {step.key_actives?.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap mt-1.5">
                      {step.key_actives.map((act, actIdx) => (
                        <span key={actIdx} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                          {act}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <EmptyIntelligenceState
            icon={Layers}
            title={routine ? 'No steps in this routine' : 'No routine generated'}
            sub={routine ? 'Re-run skin assessment to update steps' : 'Run a skin assessment to formulate your personalized routine'}
            to="/assessment"
            cta={routine ? 'Re-run Assessment' : 'Run Assessment'}
          />
        )}
      </div>
    </div>
  );
};

// ─── Loading skeleton layout (mirrors real layout exactly) ────────────────────
const DashboardSkeleton = () => (
  <div className="space-y-5 animate-pulse">
    <div className="bg-[#1a2e28] rounded-2xl p-6 flex items-center justify-between">
      <div className="space-y-2 flex-1">
        <div className="h-3 w-24 bg-white/10 rounded" />
        <div className="h-6 w-40 bg-white/10 rounded" />
        <div className="h-3 w-56 bg-white/10 rounded" />
      </div>
      <div className="w-24 h-24 rounded-full bg-white/10" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 h-64">
        <div className="h-4 w-32 bg-gray-100 rounded" />
        {[...Array(5)].map((_, i) => <div key={i} className="h-6 bg-gray-50 rounded-lg" />)}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 h-64">
        <div className="h-4 w-32 bg-gray-100 rounded" />
        {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-50 rounded-xl" />)}
      </div>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
    </div>
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [state, setState] = useState({
    loading: true,
    skinProfile: null,
    assessment: null,
    hydration: null,
    sleep: null,
    lifestyle: null,
    environment: null,
    routine: null,
    adherence: null,
    errors: {},
  });

  const [quickAnalyzing, setQuickAnalyzing] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const hour = new Date().getHours();

  // ── Parallel data loading with individual error isolation ──
  const load = useCallback(async () => {
    setState(s => ({ ...s, loading: true }));

    const results = await Promise.allSettled([
      skinService.getProfile(),
      assessmentService.getLatestAssessment(),
      trackingService.getHydration(todayStr),
      trackingService.getSleep(todayStr),
      trackingService.getLifestyle(todayStr),
      trackingService.getEnvironment(todayStr),
      routineService.getCurrentRoutinePlan(),
      progressService.getAdherence(),
    ]);

    const [prof, asmt, hyd, slp, life, env, rtn, adh] = results;

    setState({
      loading: false,
      skinProfile: prof.status === 'fulfilled' ? prof.value : null,
      assessment: asmt.status === 'fulfilled' ? asmt.value : null,
      hydration: hyd.status === 'fulfilled' && hyd.value?.length ? hyd.value[0] : null,
      sleep: slp.status === 'fulfilled' && slp.value?.length ? slp.value[0] : null,
      lifestyle: life.status === 'fulfilled' && life.value?.length ? life.value[0] : null,
      environment: env.status === 'fulfilled' && env.value?.length ? env.value[0] : null,
      routine: rtn.status === 'fulfilled' ? normalizeRoutine(rtn.value) : null,
      adherence: adh.status === 'fulfilled' ? (adh.value?.data ?? adh.value) : null,
      errors: {
        profile: prof.status === 'rejected',
        assessment: asmt.status === 'rejected',
        routine: rtn.status === 'rejected',
        adherence: adh.status === 'rejected',
      },
    });
  }, [todayStr]);

  // Local step completion state with persistence & backend sync
  const [completedStepIds, setCompletedStepIds] = useState(() => {
    try {
      const rawLocal = localStorage.getItem(`routine_done_${todayStr}`);
      return new Set(rawLocal ? JSON.parse(rawLocal) : []);
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    if (state.routine?.today_completed_step_ids?.length) {
      setCompletedStepIds((prev) => {
        const next = new Set(prev);
        state.routine.today_completed_step_ids.forEach((id) => next.add(String(id)));
        try {
          localStorage.setItem(`routine_done_${todayStr}`, JSON.stringify(Array.from(next)));
        } catch { /* ignore */ }
        return next;
      });
    }
  }, [state.routine, todayStr]);

  const handleToggleStep = async (stepId) => {
    const strId = String(stepId);
    const isCompleted = completedStepIds.has(strId);
    const nextSet = new Set(completedStepIds);
    if (isCompleted) {
      nextSet.delete(strId);
    } else {
      nextSet.add(strId);
    }
    setCompletedStepIds(nextSet);
    try {
      localStorage.setItem(`routine_done_${todayStr}`, JSON.stringify(Array.from(nextSet)));
    } catch { /* ignore */ }

    try {
      await routineService.toggleStepAdherence({
        routineStepId: stepId,
        recordDate: todayStr,
        completed: !isCompleted,
      });
      const adhRes = await progressService.getAdherence();
      const newAdh = adhRes?.data ?? adhRes;
      setState((s) => ({ ...s, adherence: newAdh }));
    } catch (err) {
      console.warn('Adherence sync:', err);
    }
  };

  useEffect(() => { load(); }, [load]);

  const handleQuickWaterLog = async () => {
    try {
      if (state.hydration) {
        const updated = await trackingService.updateHydration(state.hydration.id, {
          water_intake_ml: state.hydration.water_intake_ml + 250,
        });
        setState(s => ({ ...s, hydration: updated }));
        toast.success('+250 ml logged! Click Quick Sync to reflect in your score.');
      } else {
        const created = await trackingService.createHydration({
          water_intake_ml: 250,
          target_water_ml: 2000,
          record_date: todayStr,
        });
        setState(s => ({ ...s, hydration: created }));
        toast.success('+250 ml logged! Click Quick Sync to reflect in your score.');
      }
    } catch (err) {
      console.error('Failed to log water:', err);
    }
  };

  // ── Assessment & Telemetry Freshness Calculations ──
  const { assessment, skinProfile, hydration, sleep, lifestyle, environment, routine, adherence } = state;
  const asmtDate = assessment?.assessment_date || assessment?.created_at;
  const asmtTime = asmtDate ? new Date(asmtDate).getTime() : null;
  const diffHours = asmtTime ? (Date.now() - asmtTime) / (1000 * 60 * 60) : null;
  const isOlderThan1Week = diffHours !== null && diffHours >= 168; // 1 week (168 hours)
  const hoursRemaining1Week = diffHours !== null ? Math.max(0, Math.ceil(168 - diffHours)) : 0;
  const daysRemainingWeek = Math.ceil(hoursRemaining1Week / 24);
  const timeRemaining1WeekStr = hoursRemaining1Week >= 48
    ? `${daysRemainingWeek} days`
    : hoursRemaining1Week >= 24
    ? `1 day ${hoursRemaining1Week - 24}h`
    : `${hoursRemaining1Week}h`;

  // Timestamps of current telemetry and profile records
  const telemetryTimestamps = [
    skinProfile?.updated_at || skinProfile?.created_at,
    lifestyle?.updated_at || lifestyle?.created_at,
    sleep?.updated_at || sleep?.created_at,
    hydration?.updated_at || hydration?.created_at,
    environment?.updated_at || environment?.created_at,
  ].filter(Boolean).map(t => new Date(t).getTime());

  const latestDataTime = telemetryTimestamps.length > 0 ? Math.max(...telemetryTimestamps) : 0;
  // Has the user updated any telemetry or profile after the current assessment was generated?
  // We include a 5-second buffer to ignore creation timestamp precision noise.
  const hasNewDataSinceAssessment = asmtTime ? (latestDataTime > asmtTime + 5000) : Boolean(skinProfile);

  // Auto-refresh ONLY triggers when:
  // 1. Assessment exists
  // 2. >= 1 week (168 hours) has passed since last assessment
  // 3. User HAS updated data (hasNewDataSinceAssessment === true)
  // 4. Not currently analyzing
  const shouldAutoRefresh = Boolean(
    assessment &&
    isOlderThan1Week &&
    hasNewDataSinceAssessment &&
    !quickAnalyzing
  );

  // ── 1-Click Quick Generation Handler ──
  const handleQuickGenerate = useCallback(async (isAuto = false) => {
    if (quickAnalyzing) return;
    setQuickAnalyzing(true);
    try {
      const newAssessment = await assessmentService.runAssessment();
      const newRoutine = normalizeRoutine(await routineService.getCurrentRoutinePlan());
      let newAdh = null;
      try {
        const adhRes = await progressService.getAdherence();
        newAdh = adhRes?.data ?? adhRes;
      } catch {
        // silent fallback
      }
      setState(s => ({
        ...s,
        assessment: newAssessment,
        routine: newRoutine,
        adherence: newAdh ?? s.adherence,
      }));

      // Record this data version as synced in this browser session
      const syncKey = `auto_synced_${newAssessment.id}_${latestDataTime}`;
      sessionStorage.setItem(syncKey, 'true');

      if (isAuto) {
        toast.success('12-Hour Telemetry Refresh: Score, risks, and routine updated with your latest biometric data!');
      } else {
        toast.success('AI Recalibration complete! Score, risks, and recommendations updated.');
      }
    } catch (err) {
      console.error('Quick assessment generation failed:', err);
      if (!isAuto) {
        toast.error(err.response?.data?.detail || 'Failed to generate assessment. Please verify your profile.');
      }
    } finally {
      setQuickAnalyzing(false);
    }
  }, [quickAnalyzing, latestDataTime, toast]);

  // ── 1-Week Auto-Update Effect (Runs ONLY if user updated data & 1 week passed) ──
  useEffect(() => {
    if (!state.loading && shouldAutoRefresh) {
      const syncKey = `auto_synced_${assessment.id}_${latestDataTime}`;
      if (!sessionStorage.getItem(syncKey)) {
        sessionStorage.setItem(syncKey, 'pending');
        handleQuickGenerate(true);
      }
    }
  }, [state.loading, shouldAutoRefresh, assessment?.id, latestDataTime, handleQuickGenerate]);

  // ── Render: Loading ──
  if (state.loading) return <DashboardSkeleton />;

  // ── Render: No skin profile → drive user to onboarding ──
  if (!state.skinProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center space-y-5 max-w-md w-full shadow-sm">
          <div className="w-16 h-16 bg-gradient-to-br from-[#4a8c6e] to-[#2d6b51] rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <Sparkles size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Set Up Your Skin Profile</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Complete a quick questionnaire to unlock your personalized AI dashboard, neural net assessments, and care routines.
            </p>
          </div>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a2e28] hover:bg-[#243d36] text-white text-sm font-semibold rounded-xl shadow transition-colors"
          >
            Start Onboarding <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  // ── Derived values ──
  const score = assessment?.overall_score ?? null;
  const scoreTheme = score !== null ? scoreColor(score) : null;
  const assessmentMode = assessment?.assessment_mode ?? null;

  // ConcernNet: sort by ml_probability desc, fallback to confidence
  const sortedConcerns = [...(assessment?.concerns ?? [])]
    .sort((a, b) => (b.ml_probability ?? b.confidence / 100) - (a.ml_probability ?? a.confidence / 100));

  // RiskNet: sort by impact_order
  const sortedRisks = [...(assessment?.risk_factors ?? [])]
    .sort((a, b) => (IMPACT_ORDER[a.impact_level] ?? 3) - (IMPACT_ORDER[b.impact_level] ?? 3));

  // Raw AI predictions from ai_analysis field
  const aiConcernPreds = assessment?.ai_analysis?.concern_predictions ?? [];
  const aiRiskPreds = assessment?.ai_analysis?.risk_predictions ?? [];

  // Daily tracking completeness
  const trackedCount = [hydration, sleep, lifestyle, environment].filter(Boolean).length;
  const allLogged = trackedCount === 4;

  // Today's routine (prefer morning in AM, evening in PM)
  const todayRoutine = hour < 17 ? (routine?.morning ?? routine?.evening) : (routine?.evening ?? routine?.morning);
  const todayRoutineLabel = hour < 17 ? 'Morning Routine' : 'Evening Routine';

  // Dynamic contextual insight from ML data
  const buildInsight = () => {
    if (!assessment) return null;
    const topConcern = sortedConcerns[0];
    const topRisk = sortedRisks[0];
    if (topConcern?.ml_probability >= 0.6 && topRisk?.impact_level === 'HIGH') {
      const m = CONCERN_META[topConcern.concern_name];
      return `${m?.icon ?? ''} Neural net detected ${(topConcern.ml_probability * 100).toFixed(0)}% probability of ${m?.label ?? topConcern.concern_name}. Primary driver: ${topRisk.factor_name} (${topRisk.impact_level} risk). Address ${topRisk.factor_name.toLowerCase()} to reduce this concern.`;
    }
    if (topConcern?.ml_probability >= 0.4) {
      const m = CONCERN_META[topConcern.concern_name];
      return `${m?.icon ?? ''} AI flags ${m?.label ?? topConcern.concern_name} at ${(topConcern.ml_probability * 100).toFixed(0)}% probability. Your routine is targeting this — stay consistent for best results.`;
    }
    if (score >= 75) {
      return `✅ Your skin health score is in excellent range. Keep maintaining your current routine and tracking habits.`;
    }
    return `📊 Complete today's daily tracking to give the neural net more signals for a sharper analysis.`;
  };
  const dynamicInsight = buildInsight();

  // Score pillar breakdown
  const pillars = assessment?.scores ? [
    { label: 'Skin Condition', value: assessment.scores.skin_condition_score, weight: 35 },
    { label: 'Lifestyle', value: assessment.scores.lifestyle_score, weight: 20 },
    { label: 'Sleep', value: assessment.scores.sleep_score, weight: 15 },
    { label: 'Consistency', value: assessment.scores.routine_consistency_score, weight: 20 },
    { label: 'Hydration', value: assessment.scores.hydration_score, weight: 10 },
  ] : [];

  // Routine adherence metrics
  const routineMorningSteps = routine?.morning?.steps || [];
  const routineEveningSteps = routine?.evening?.steps || [];
  const fallbackStepCount = (routineMorningSteps.length + routineEveningSteps.length) || 4;

  const todayTotal = adherence?.today_total ?? fallbackStepCount;
  const todayCompleted = adherence?.today_completed ?? (routine?.today_completed_step_ids?.length || 0);
  const todayPct = adherence?.today_percent != null
    ? Math.round(adherence.today_percent)
    : (todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0);

  const weekTotal = adherence?.week_total ?? (todayTotal * 7);
  const weekCompleted = adherence?.week_completed ?? todayCompleted;
  const weekPct = adherence?.week_percent != null
    ? Math.round(adherence.week_percent)
    : (weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0);

  const streakDays = adherence?.streak_days ?? 0;
  const adherencePct = todayPct;

  return (
    <div className="space-y-5">

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 1 — AI Command Header
      ═════════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-[#1a2e28] via-[#1e3530] to-[#142420] rounded-2xl p-6 relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#4a8c6e]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-start gap-5">

          {/* Left: Greeting + status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-[#7ab59a] text-xs font-semibold">{greetingFor(hour)} 👋</p>
              {assessmentMode && <ModeBadge mode={assessmentMode} />}
              {streakDays > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  <Flame size={10} className="fill-amber-400 text-amber-400" />
                  {streakDays}d streak
                </span>
              )}
            </div>

            <h1 className="text-xl font-black text-white">
              {user?.profile?.name || 'Skincarer'}
            </h1>

            {/* Dynamic AI Insight */}
            {dynamicInsight && (
              <div className="mt-3 flex items-start gap-2 bg-white/5 rounded-xl px-3 py-2.5 border border-white/8">
                <Brain size={13} className="text-violet-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-white/75 leading-relaxed">{dynamicInsight}</p>
              </div>
            )}

            {/* No assessment CTA */}
            {!assessment && (
              <div className="mt-3 flex items-center gap-2 bg-amber-500/10 rounded-xl px-3 py-2.5 border border-amber-400/20">
                <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-200/80">No assessment yet. Run one to activate your AI neural net analysis.</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <button
                onClick={() => handleQuickGenerate(false)}
                disabled={quickAnalyzing}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 active:scale-95 cursor-pointer"
                title="Instantly re-evaluate all 5 pillars, risks, and routine recommendations with your latest data"
              >
                <Zap size={13} className={quickAnalyzing ? "animate-spin text-amber-300" : "text-amber-300"} />
                {quickAnalyzing ? "Recalculating AI Models..." : "Quick Re-Analyze"}
              </button>
              <Link
                to="/assessment"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl border border-white/10 transition-colors"
              >
                <Sparkles size={12} />
                {assessment ? 'Full Assessment Wizard' : 'Run AI Assessment'}
              </Link>
              {routine && (
                <Link
                  to="/routine"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl border border-white/10 transition-colors"
                >
                  <Calendar size={12} />
                  <span>View Routine</span>
                  {adherencePct !== null && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                      adherencePct >= 80 ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/30' :
                      adherencePct > 0 ? 'bg-amber-500/25 text-amber-300 border border-amber-500/30' :
                      'bg-white/10 text-white/50'
                    }`}>
                      {adherencePct}%
                    </span>
                  )}
                </Link>
              )}
            </div>

            {/* Last assessment timestamp & 1-week cadence */}
            {assessment?.assessment_date && (
              <p className="text-[10px] text-white/40 mt-2 flex items-center gap-2 flex-wrap">
                <span>Last assessed {timeSince(assessment.assessment_date)} · v{assessment.ai_analysis?.model_version ?? '1'}</span>
                {diffHours !== null && (
                  <span className="text-white/30">
                    · Weekly cadence: {isOlderThan1Week ? (hasNewDataSinceAssessment ? 'Ready for auto-recalibration' : 'Telemetry unchanged') : `${timeRemaining1WeekStr} remaining`}
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Right: Score ring + pillars */}
          <div className="flex-shrink-0 flex flex-col items-center gap-3">
            {score !== null ? (
              <>
                <ScoreRing score={score} size={96} stroke={7} />

                {/* Pillar mini bars */}
                {pillars.length > 0 && (
                  <div className="w-28 space-y-1.5">
                    {pillars.map(p => (
                      <div key={p.label} className="flex items-center gap-1.5">
                        <div className="flex-1">
                          <AnimatedBar pctValue={p.value} color={scoreColor(p.value).ring} heightClass="h-1" />
                        </div>
                        <span className="text-[8px] text-white/40 w-5 text-right font-mono">{p.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                <p className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${scoreTheme?.bg} ${scoreTheme?.text}`}>
                  {scoreTheme?.label}
                </p>
              </>
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-dashed border-white/10 flex items-center justify-center">
                <Target size={24} className="text-white/20" />
              </div>
            )}
          </div>
        </div>

        {/* Bottom metrics bar: Routine Adherence (Today, This Week, Day Streak) + Data Coverage */}
        <div className="mt-5 pt-4 border-t border-white/8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Routine Adherence: 3 metrics (Today, This Week, Day Streak) */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Routine Adherence</p>
                {streakDays > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded-full border border-amber-400/20">
                    <Flame size={10} className="fill-amber-400" />
                    {streakDays}d streak
                  </span>
                )}
              </div>
              <Link
                to="/routine"
                className="text-[10px] font-semibold text-[#7ab59a] hover:text-white transition-colors inline-flex items-center gap-0.5"
              >
                View Routine <ChevronRight size={11} />
              </Link>
            </div>

            <div className="flex items-center gap-6 sm:gap-10 justify-start">
              {/* 1. Today */}
              <DarkAdherenceRing
                pct={todayPct}
                label="Today"
                completed={todayCompleted}
                total={todayTotal}
              />

              {/* 2. This Week */}
              <DarkAdherenceRing
                pct={weekPct}
                label="This Week"
                completed={weekCompleted}
                total={weekTotal}
              />

              {/* 3. Day Streak */}
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-1.5 bg-[#162923] border border-white/10 shadow-inner">
                  <div className="flex items-center gap-1">
                    <Flame size={18} className={streakDays > 0 ? "text-amber-400 fill-amber-400" : "text-amber-400/60"} />
                    <span className="text-base font-bold text-white">{streakDays}</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-white leading-tight">Day Streak</p>
                <p className="text-[10px] text-white/50 mt-0.5">Consecutive days</p>
              </div>
            </div>
          </div>

          {/* Today's Data Coverage */}
          <div className="lg:w-64 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-white/8 pt-3 lg:pt-0 lg:pl-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Today's Data Coverage</p>
              <div className={`flex items-center gap-1 text-[10px] font-bold ${allLogged ? 'text-emerald-400' : 'text-amber-400'}`}>
                {allLogged ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                {trackedCount}/4 signals logged
              </div>
            </div>
            <div className="flex gap-1.5">
              {[
                { done: !!hydration, label: 'Hydration' },
                { done: !!sleep, label: 'Sleep' },
                { done: !!lifestyle, label: 'Lifestyle' },
                { done: !!environment, label: 'Env' },
              ].map(({ done, label }) => (
                <div key={label} className="flex-1">
                  <div className={`h-1.5 rounded-full transition-all duration-500 ${done ? 'bg-emerald-400' : 'bg-white/10'}`} />
                  <p className="text-[8px] text-white/30 mt-0.5 text-center truncate">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 1.5 — Telemetry Freshness & Intelligence Sync Bar
      ═════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${quickAnalyzing ? 'bg-violet-100 text-violet-700' :
            (hasNewDataSinceAssessment && isOlderThan1Week) ? 'bg-amber-100 text-amber-700' :
              hasNewDataSinceAssessment ? 'bg-blue-100 text-blue-700' :
                'bg-emerald-100 text-emerald-700'
            }`}>
            {quickAnalyzing ? <RefreshCw size={16} className="animate-spin" /> :
              (hasNewDataSinceAssessment && isOlderThan1Week) ? <Clock size={16} /> :
                hasNewDataSinceAssessment ? <Sparkles size={16} /> :
                  <CheckCircle2 size={16} />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs font-bold text-gray-800">
                {quickAnalyzing ? 'Recalculating 5-Pillar Score, Risks & Routines...' :
                  (hasNewDataSinceAssessment && isOlderThan1Week) ? 'Weekly Telemetry Recalibration Available' :
                    hasNewDataSinceAssessment ? 'New Daily Telemetry Recorded' :
                      'Intelligence & Recommendations Up-To-Date'}
              </p>
              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${quickAnalyzing ? 'bg-violet-100 text-violet-700' :
                (hasNewDataSinceAssessment && isOlderThan1Week) ? 'bg-amber-100 text-amber-700' :
                  hasNewDataSinceAssessment ? 'bg-blue-100 text-blue-700' :
                    'bg-emerald-100 text-emerald-700'
                }`}>
                {quickAnalyzing ? 'Processing' :
                  (hasNewDataSinceAssessment && isOlderThan1Week) ? 'Weekly Update Ready' :
                    hasNewDataSinceAssessment ? 'Telemetry Updated' :
                      'In Sync'}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed truncate sm:whitespace-normal">
              {quickAnalyzing ? 'ConcernNet & RiskNet are processing your latest habits and biometric signals...' :
                (hasNewDataSinceAssessment && isOlderThan1Week) ? 'You have updated biometric data since your last assessment (>1 week ago). Auto-refreshing recommendations.' :
                  hasNewDataSinceAssessment ? `New daily tracking logged. Scheduled for 1-week auto-recalibration in ${timeRemaining1WeekStr}, or sync now.` :
                    'No new telemetry logged since last assessment. Score, threat vectors, and routines reflect your current state.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={() => handleQuickGenerate(false)}
            disabled={quickAnalyzing}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gray-900 hover:bg-gray-800 active:bg-black text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            title="Run instant AI recalculation"
          >
            <Zap size={12} className={quickAnalyzing ? "animate-spin text-amber-400" : "text-amber-400"} />
            {quickAnalyzing ? "Recalculating..." : "Quick Sync"}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 2 — AI Intelligence Row  (ConcernNet + RiskNet)
      ═════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Panel A: ConcernNet Probability Radar ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-violet-50 rounded-xl flex items-center justify-center">
                <Brain size={15} className="text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Concern Analysis</p>
                <p className="text-[9px] text-gray-400 font-medium">ConcernNet · 10 signals</p>
              </div>
            </div>
            {assessmentMode === 'AI_ASSISTED' && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 font-bold border border-violet-100">
                Neural Net Active
              </span>
            )}
          </div>

          <div className="px-5 pb-5 space-y-2.5">
            {sortedConcerns.length === 0 ? (
              assessment ? (
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-900">Optimal Barrier Condition</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                      ConcernNet detected 0 acute barrier vulnerabilities. Protective lipid layers and hydration balance are functioning normally.
                    </p>
                  </div>
                </div>
              ) : (
                <EmptyIntelligenceState
                  icon={Brain}
                  title="No concern data yet"
                  sub="Run a skin assessment to activate ConcernNet analysis"
                  to="/assessment"
                  cta="Run Assessment"
                />
              )
            ) : (
              sortedConcerns.map((c, i) => {
                const meta = CONCERN_META[c.concern_name] ?? { label: c.concern_name, color: '#6b7280', icon: '●' };
                const prob = c.ml_probability ?? c.confidence / 100;
                const color = probColor(prob);
                return (
                  <div key={c.id ?? i} className="group">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{meta.icon}</span>
                      <span className="text-xs font-semibold text-gray-700 flex-1">{meta.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold" style={{ color }}>
                          {pct(prob)}%
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${c.priority === 'HIGH' ? 'bg-red-50 text-red-600' :
                          c.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600' :
                            'bg-gray-50 text-gray-500'
                          }`}>
                          {c.priority}
                        </span>
                      </div>
                    </div>
                    <AnimatedBar pctValue={pct(prob)} color={color} heightClass="h-2" delay={i * 50} />
                  </div>
                );
              })
            )}
          </div>

          {assessment?.ai_analysis?.disclaimer && (
            <div className="px-5 pb-4">
              <div className="flex items-start gap-1.5 bg-gray-50 rounded-xl px-3 py-2">
                <Info size={10} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-[9px] text-gray-400 leading-relaxed">{assessment.ai_analysis.disclaimer}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Panel B: RiskNet Threat Matrix ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
                <ShieldCheck size={15} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Risk Threat Matrix</p>
                <p className="text-[9px] text-gray-400 font-medium">RiskNet · 5 threat vectors</p>
              </div>
            </div>
            {assessmentMode === 'AI_ASSISTED' && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-bold border border-orange-100">
                Live Signals
              </span>
            )}
          </div>

          <div className="px-5 pb-5 space-y-2">
            {sortedRisks.length === 0 ? (
              assessment ? (
                <div className="space-y-2">
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <ShieldCheck size={16} className="text-emerald-700" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-900">All 5 Threat Vectors Optimal</p>
                        <p className="text-[10px] text-emerald-700">RiskNet detected 0 elevated environmental or lifestyle threats</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                      Low Risk
                    </span>
                  </div>

                  {/* Threat vectors status chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                    {[
                      { key: 'STRESS', label: 'Stress Impact', status: 'Optimal', icon: Brain, route: '/lifestyle' },
                      { key: 'SLEEP', label: 'Sleep Recovery', status: 'Optimal', icon: Moon, route: '/sleep' },
                      { key: 'HYDRATION', label: 'Cell Hydration', status: 'Protected', icon: Droplet, route: '/hydration' },
                      { key: 'LIFESTYLE', label: 'Metabolic / Habit', status: 'Optimal', icon: Activity, route: '/lifestyle' },
                      { key: 'ENVIRONMENT', label: 'Photo & UV Risk', status: 'Guarded', icon: Sun, route: '/environment' },
                    ].map((v) => {
                      const Icon = v.icon;
                      return (
                        <Link
                          key={v.key}
                          to={v.route}
                          className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors group"
                        >
                          <Icon size={12} className="text-gray-500 group-hover:text-gray-700 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-bold text-gray-700 truncate">{v.label}</p>
                            <p className="text-[8px] font-semibold text-emerald-600">{v.status}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <EmptyIntelligenceState
                  icon={ShieldCheck}
                  title="No risk data yet"
                  sub="Run assessment to activate RiskNet threat detection"
                  to="/assessment"
                  cta="Run Assessment"
                />
              )
            ) : (
              sortedRisks.map((r, i) => {
                const meta = RISK_META[r.factor_type] ?? RISK_META['LIFESTYLE'];
                const theme = riskColor(r.impact_level);
                const RiskIcon = meta.icon;
                return (
                  <div
                    key={r.id ?? i}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${meta.bg} ${meta.border} group`}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/60">
                      <RiskIcon size={14} style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-bold text-gray-800">{meta.label}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${theme.badge}`}>
                          {r.impact_level}
                        </span>
                      </div>
                      <AnimatedBar
                        pctValue={r.ml_probability ? pct(r.ml_probability) : r.impact_score}
                        color={theme.bar}
                        heightClass="h-1.5"
                        delay={i * 60}
                      />
                      {r.description && (
                        <p className="text-[9px] text-gray-500 mt-1 truncate">{r.description}</p>
                      )}
                    </div>
                    <Link
                      to={meta.route}
                      className="flex-shrink-0 text-[10px] font-bold text-gray-400 hover:text-gray-700 transition-colors"
                      title={`Log ${meta.label}`}
                    >
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                );
              })
            )}
          </div>

          {/* 5-pillar score breakdown accordion */}
          {pillars.length > 0 && (
            <div className="px-5 pb-5 pt-2 border-t border-gray-50">
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-2">5-Pillar Score Breakdown</p>
              <div className="grid grid-cols-5 gap-1">
                {pillars.map(p => (
                  <div key={p.label} className="text-center">
                    <div className="text-xs font-black text-gray-700">{p.value}</div>
                    <div className="text-[7px] text-gray-400 truncate">{p.label.split(' ')[0]}</div>
                    <div className="text-[7px] text-gray-300">{p.weight}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 3 — Daily Intelligence Row
      ═════════════════════════════════════════════════════════════════════ */}

      {/* ── Tracking: 4 tiles ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Daily Signal Logging</p>
          <p className="text-[10px] text-gray-400">
            Each signal feeds the neural net · <span className="font-semibold text-gray-600">{trackedCount}/4 today</span>
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <TrackingTile
            icon={Droplet} label="Hydration" color="bg-blue-400"
            logged={!!hydration}
            value={hydration ? `${hydration.water_intake_ml} ml` : null}
            sub={hydration ? `Goal: ${hydration.target_water_ml} ml` : 'Not logged'}
            aiImpact="Feeds RiskNet hydration vector"
            onClick={handleQuickWaterLog}
          />
          <TrackingTile
            icon={Moon} label="Sleep" color="bg-indigo-400"
            logged={!!sleep}
            value={sleep ? `${(sleep.duration_minutes / 60).toFixed(1)} hrs` : null}
            sub={sleep ? `Quality: ${sleep.quality}` : 'Not logged'}
            aiImpact="Drives sleep deficit prediction"
            to="/sleep"
          />
          <TrackingTile
            icon={Activity} label="Stress" color="bg-orange-400"
            logged={!!lifestyle}
            value={lifestyle ? `Level ${lifestyle.stress_level}/10` : null}
            sub={lifestyle ? lifestyle.physical_activity : 'Not logged'}
            aiImpact="Cortisol stress score for RiskNet"
            to="/lifestyle"
          />
          <TrackingTile
            icon={Sun} label="Environment" color="bg-amber-400"
            logged={!!environment}
            value={environment ? environment.climate : null}
            sub={environment ? `UV: ${environment.uv_exposure}` : 'Not logged'}
            aiImpact="UV & pollution skin threat input"
            to="/environment"
          />
        </div>
      </div>

      {/* ── Clinical Advisory & 7-Day Predictive Barrier Trajectory ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <ClinicalAdvisoryCard assessment={assessment} skinProfile={skinProfile} />
        <BarrierForecastCard preview={true} />
      </div>

      {/* ── Seasonal Climate & Environmental Regimen ── */}
      <SeasonalAdvisoryCard seasonalRoutine={routine?.seasonal} environment={environment} />

      {/* ── Bottom row: Routine preview + AI insight card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Daily Skincare Checklist & Personalized Routine (2/3 width) */}
        <div className="lg:col-span-2">
          <DailySkincareChecklist
            routine={routine}
            todayCompletedIds={completedStepIds}
            onToggleStep={handleToggleStep}
          />
        </div>

        {/* AI Daily Insight (1/3 width) */}
        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center">
                <Zap size={13} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">AI Daily Brief</p>
                <p className="text-[9px] text-white/50">Powered by neural net</p>
              </div>
            </div>

            {assessment ? (
              <>
                {/* Top detected concern */}
                {sortedConcerns[0] && (() => {
                  const top = sortedConcerns[0];
                  const meta = CONCERN_META[top.concern_name] ?? { label: top.concern_name, icon: '●' };
                  const prob = top.ml_probability ?? top.confidence / 100;
                  return (
                    <div className="mb-3">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-white/50 mb-1">Top Concern</p>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{meta.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white">{meta.label}</p>
                          <AnimatedBar pctValue={pct(prob)} color="rgba(255,255,255,0.6)" heightClass="h-1.5 mt-1" />
                        </div>
                        <span className="text-sm font-black text-white/90">{pct(prob)}%</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Overall score trend indicator */}
                <div className="flex items-center gap-2 mb-3 bg-white/10 rounded-xl px-3 py-2">
                  <TrendingUp size={14} className="text-emerald-300 flex-shrink-0" />
                  <div>
                    <p className="text-[9px] text-white/60">Overall Score</p>
                    <p className="text-lg font-black text-white leading-none">{score}<span className="text-xs font-normal text-white/50">/100</span></p>
                  </div>
                </div>

                <p className="text-[10px] text-white/60 leading-relaxed">
                  {dynamicInsight?.split('.')[0]}.
                </p>
              </>
            ) : (
              <div className="text-center py-4">
                <Brain size={28} className="text-white/20 mx-auto mb-2" />
                <p className="text-xs text-white/50">Run your first assessment to see AI insights</p>
                <Link
                  to="/assessment"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-white/80 hover:text-white underline underline-offset-2 transition-colors"
                >
                  Run now <ArrowRight size={10} />
                </Link>
              </div>
            )}

            {assessment?.assessment_date && (
              <p className="text-[9px] text-white/30 mt-3 border-t border-white/10 pt-2">
                Data from assessment {timeSince(assessment.assessment_date)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Curated Medical-Grade Product Recommendations ── */}
      <ProductShowcase routinePlan={routine} />
    </div>
  );
};

// ── Reusable empty-state within panels ─────────────────────────────────────
const EmptyIntelligenceState = ({ icon: Icon, title, sub, to, cta }) => (
  <div className="flex flex-col items-center py-6 text-center gap-2">
    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-1">
      <Icon size={18} className="text-gray-300" />
    </div>
    <p className="text-xs font-semibold text-gray-500">{title}</p>
    <p className="text-[10px] text-gray-400 max-w-[180px] leading-relaxed">{sub}</p>
    {to && cta && (
      <Link
        to={to}
        className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[#4a8c6e] hover:text-[#3a7a5e] transition-colors"
      >
        {cta} <ArrowRight size={11} />
      </Link>
    )}
  </div>
);


export default Dashboard;
