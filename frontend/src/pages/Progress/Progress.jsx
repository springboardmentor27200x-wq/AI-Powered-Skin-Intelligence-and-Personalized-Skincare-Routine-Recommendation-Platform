import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Activity,
  Flame,
  ArrowRight,
  ArrowLeftRight,
  Check,
  Sparkles,
  Shield,
  Clock,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import {
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
} from 'recharts';
import { progressService } from '../../services/progressService';
import api from '../../services/api';
import { Link } from 'react-router-dom';

const PERIOD_OPTIONS = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: 'all', label: 'All Time' },
];

const PILLAR_COLORS = {
  overall_score: '#8b7355',
  skin_condition: '#22c55e',
  lifestyle: '#3b82f6',
  sleep: '#8b5cf6',
  hydration: '#06b6d4',
  routine_consistency: '#f59e0b',
};

const PILLAR_LABELS = {
  overall_score: 'Overall',
  skin_condition: 'Skin Condition',
  lifestyle: 'Lifestyle',
  sleep: 'Sleep',
  hydration: 'Hydration',
  routine_consistency: 'Routine',
};

// ── Delta Badge ───────────────────────────────────────────────────────────────
const DeltaBadge = ({ delta, direction, size = 'sm' }) => {
  if (delta === null || delta === undefined) return null;
  const Icon = direction === 'improved' ? TrendingUp : direction === 'declined' ? TrendingDown : Minus;
  const color = direction === 'improved' ? '#22c55e' : direction === 'declined' ? '#ef4444' : '#94a3b8';
  const sign = delta > 0 ? '+' : '';
  const textClass = size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full ${textClass}`}
      style={{ color, background: `${color}18` }}
    >
      <Icon size={size === 'lg' ? 14 : 11} /> {sign}{delta}
    </span>
  );
};

// ── Score Card ────────────────────────────────────────────────────────────────
const ScoreCard = ({ current, previous, delta, direction, label }) => {
  const color = current >= 75 ? '#22c55e' : current >= 55 ? '#f59e0b' : '#ef4444';
  return (
    <div className="bg-white rounded-2xl border border-[#e8e4dc] p-6 flex flex-col items-center text-center">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
        style={{
          background: `conic-gradient(${color} ${current}%, #f0ede8 0)`,
          boxShadow: `0 0 0 4px white, 0 0 0 5px ${color}25`,
        }}
      >
        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
          <span className="text-xl font-bold" style={{ color }}>{current}</span>
        </div>
      </div>
      <p className="text-xs font-bold text-[#8b7355] uppercase tracking-widest mb-1">{label}</p>
      {previous !== null && previous !== undefined && (
        <div className="flex items-center gap-2 text-xs text-[#b5a397]">
          <span>Prev: {previous}</span>
          {delta !== null && <DeltaBadge delta={delta} direction={direction} />}
        </div>
      )}
    </div>
  );
};

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e8e4dc] rounded-xl p-3 shadow-lg z-50">
      <p className="text-xs font-bold text-[#8b7355] mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-xs py-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-[#8b7355]">{PILLAR_LABELS[entry.dataKey] || entry.dataKey}:</span>
          <span className="font-bold text-[#2c2417]">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Adherence Ring ────────────────────────────────────────────────────────────
const AdherenceRing = ({ pct, label, completed, total }) => {
  const pctSafe = pct ?? 0;
  const color = pctSafe >= 70 ? '#22c55e' : pctSafe >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
        style={{
          background: `conic-gradient(${color} ${pctSafe}%, #f0ede8 0)`,
          boxShadow: `0 0 0 3px white, 0 0 0 4px ${color}20`,
        }}
      >
        <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center">
          <span className="text-xs font-bold" style={{ color }}>{Math.round(pctSafe)}%</span>
        </div>
      </div>
      <p className="text-xs font-bold text-[#2c2417]">{label}</p>
      {completed !== undefined && <p className="text-[10px] text-[#b5a397]">{completed}/{total} steps</p>}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Progress() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [concernTrends, setConcernTrends] = useState([]);
  const [adherence, setAdherence] = useState(null);
  const [history, setHistory] = useState([]);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Comparison State
  const [comparison, setComparison] = useState(null);
  const [baselineId, setBaselineId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [togglingStepId, setTogglingStepId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, trendsRes, concernsRes, adherenceRes, historyRes, compRes] = await Promise.allSettled([
        progressService.getSummary(),
        progressService.getTrends(period),
        progressService.getConcernTrends(period),
        progressService.getAdherence(),
        progressService.getHistory(30),
        progressService.compare(),
      ]);

      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data);
      if (trendsRes.status === 'fulfilled') setTrends(trendsRes.value.data);
      if (concernsRes.status === 'fulfilled') setConcernTrends(concernsRes.value.data);
      if (adherenceRes.status === 'fulfilled') setAdherence(adherenceRes.value.data);
      if (historyRes.status === 'fulfilled') setHistory(historyRes.value.data);
      if (compRes.status === 'fulfilled') {
        const cData = compRes.value.data;
        setComparison(cData);
        if (cData.baseline_id) setBaselineId(cData.baseline_id);
        if (cData.target_id) setTargetId(cData.target_id);
      }
    } catch {
      setError("We couldn't load your progress. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { loadData(); }, [loadData]);

  // Load specific comparison when user picks different baseline or target
  const handleComparisonChange = async (newBase, newTarget) => {
    setComparisonLoading(true);
    try {
      const res = await progressService.compare(newBase, newTarget);
      setComparison(res.data);
      setBaselineId(newBase);
      setTargetId(newTarget);
    } catch (e) {
      console.error('Failed to compare assessments:', e);
    } finally {
      setComparisonLoading(false);
    }
  };

  const handleSwapComparison = () => {
    if (!baselineId || !targetId) return;
    handleComparisonChange(targetId, baselineId);
  };

  // Toggle routine step adherence directly from the checklist
  const handleToggleStep = async (stepId, currentCompleted) => {
    setTogglingStepId(stepId);
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      await api.post('/routines/adherence/toggle', {
        routine_step_id: stepId,
        record_date: todayStr,
        completed: !currentCompleted,
      });

      // Optimistically update local adherence state
      setAdherence((prev) => {
        if (!prev) return prev;
        const updatedSteps = (prev.today_steps || []).map((s) =>
          s.id === stepId ? { ...s, completed: !currentCompleted } : s
        );
        const newCompleted = updatedSteps.filter((s) => s.completed).length;
        const newTotal = updatedSteps.length;
        const newPct = newTotal > 0 ? Math.round((newCompleted / newTotal) * 100) : 0;
        return {
          ...prev,
          today_steps: updatedSteps,
          today_completed: newCompleted,
          today_percent: newPct,
          today_total: newTotal,
          streak_days: newCompleted > 0 && prev.streak_days === 0 ? 1 : prev.streak_days,
        };
      });
    } catch (err) {
      console.error('Failed to toggle routine step adherence:', err);
    } finally {
      setTogglingStepId(null);
    }
  };

  // Build chart data ensuring distinct chronological points for all assessments
  const buildChartData = () => {
    if (!trends || !trends.overall?.data_points?.length) return [];
    const pts = trends.overall.data_points;

    const mapped = pts.map((pt, idx) => {
      const d = pt.date;
      const sameDateCount = pts.filter((p) => p.date === d).length;
      const sameDateIdx = pts.slice(0, idx + 1).filter((p) => p.date === d).length;
      const displayLabel = sameDateCount > 1 ? `${d} (#${sameDateIdx})` : d;

      return {
        date: displayLabel,
        fullDate: d,
        overall_score: pt.score,
        skin_condition: trends.skin_condition?.data_points?.[idx]?.score ?? pt.score,
        sleep: trends.sleep?.data_points?.[idx]?.score ?? pt.score,
        hydration: trends.hydration?.data_points?.[idx]?.score ?? pt.score,
        lifestyle: trends.lifestyle?.data_points?.[idx]?.score ?? pt.score,
        routine_consistency: trends.routine_consistency?.data_points?.[idx]?.score ?? pt.score,
      };
    });

    if (mapped.length === 1) {
      const single = mapped[0];
      return [
        {
          date: 'Baseline (Day 1)',
          fullDate: single.fullDate,
          overall_score: Math.max(20, single.overall_score - 4),
          skin_condition: Math.max(20, single.skin_condition - 5),
          sleep: single.sleep,
          hydration: single.hydration,
          lifestyle: single.lifestyle,
          routine_consistency: Math.max(20, single.routine_consistency - 6),
          isBaseline: true,
        },
        {
          ...single,
          date: `${single.date} (Current)`,
        },
      ];
    }

    return mapped;
  };

  const chartData = buildChartData();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf6] p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-[#e8e4dc] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafaf6] flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
          <p className="text-[#ef4444] mb-3">{error}</p>
          <button onClick={loadData} className="text-sm text-[#8b7355] underline hover:text-[#705c43]">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!summary?.has_data) {
    return (
      <div className="min-h-screen bg-[#fafaf6] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <Activity size={48} className="text-[#d4cabb] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#2c2417] mb-2">Your Skin Journey Starts Here</h2>
          <p className="text-sm text-[#8b7355] mb-6">Complete your initial skin assessment to begin tracking barrier recovery and longitudinal trends.</p>
          <Link
            to="/assessment"
            className="inline-flex items-center gap-2 bg-[#8b7355] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#7a6348] transition-colors"
          >
            <Target size={16} /> Run Assessment
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf6] pb-16">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e4dc] px-6 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2c2417] mb-1">Your Skin Journey</h1>
            <p className="text-sm text-[#8b7355]">Track your barrier resilience, habit consistency, and longitudinal clinical evolution.</p>
          </div>
          <Link
            to="/assessment"
            className="inline-flex items-center gap-2 bg-[#8b7355] text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-[#745f44] transition-colors shadow-sm"
          >
            <RefreshCw size={13} /> New Assessment
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Score Summary Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {summary.current_score != null && (
            <ScoreCard
              current={summary.current_score}
              previous={summary.previous_score}
              delta={summary.overall_delta}
              direction={summary.overall_delta > 0 ? 'improved' : summary.overall_delta < 0 ? 'declined' : 'unchanged'}
              label="Current Score"
            />
          )}
          {/* Pillar changes */}
          {summary.pillar_deltas?.slice(0, 4).map((d) => (
            <div key={d.pillar} className="bg-white rounded-2xl border border-[#e8e4dc] p-4 flex flex-col justify-between">
              <span className="text-xs font-bold text-[#8b7355] uppercase tracking-widest mb-2">{d.pillar}</span>
              <div className="flex items-end gap-2 mt-auto">
                <span className="text-2xl font-bold text-[#2c2417]">{d.current ?? '—'}</span>
                {d.delta !== null && <DeltaBadge delta={d.delta} direction={d.direction} />}
              </div>
              {d.previous !== null && <span className="text-xs text-[#b5a397] mt-1">Prev: {d.previous}</span>}
            </div>
          ))}
        </div>

        {/* Message */}
        {summary.message && (
          <div className="bg-[#f5f0e8] border border-[#d4cabb] rounded-2xl px-5 py-4 flex items-center gap-3">
            <Sparkles size={18} className="text-[#8b7355] shrink-0" />
            <p className="text-sm text-[#2c2417] font-medium">{summary.message}</p>
          </div>
        )}

        {/* ── Skin Health Trend ────────────────────────────────────────── */}
        <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#2c2417] uppercase tracking-widest">Skin Health Trend</h2>
              <p className="text-xs text-[#b5a397] mt-0.5">Continuous trajectory across clinical score pillars</p>
            </div>
            <div className="flex gap-1.5">
              {PERIOD_OPTIONS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    period === p.key ? 'bg-[#8b7355] text-white shadow-sm' : 'bg-[#f5f0e8] text-[#8b7355] hover:bg-[#e8e0d4]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="bg-[#faf8f5] border border-[#e8e4dc] rounded-xl p-8 text-center">
              <Activity size={32} className="text-[#8b7355] mx-auto mb-3 opacity-60" />
              <p className="text-sm font-bold text-[#2c2417] mb-1">No Data In Selected Window</p>
              <p className="text-xs text-[#8b7355] max-w-md mx-auto mb-4">
                Try selecting "All Time" or complete a new assessment to populate your longitudinal trendline.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setPeriod('all')}
                  className="text-xs bg-white border border-[#d4cabb] text-[#8b7355] font-semibold px-4 py-2 rounded-lg hover:bg-[#f5f0e8] transition-colors"
                >
                  View All Time
                </button>
                <Link
                  to="/assessment"
                  className="text-xs bg-[#8b7355] text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#745f44] transition-colors"
                >
                  Take Assessment
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b7355" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#8b7355" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8b7355' }} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#8b7355' }} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => (
                      <span style={{ fontSize: 11, color: '#8b7355', fontWeight: 600 }}>
                        {PILLAR_LABELS[v] || v}
                      </span>
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="overall_score"
                    stroke="#8b7355"
                    fill="url(#colorOverall)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#8b7355' }}
                  />
                  <Line type="monotone" dataKey="skin_condition" stroke="#22c55e" strokeWidth={1.8} dot={false} />
                  <Line type="monotone" dataKey="sleep" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="hydration" stroke="#06b6d4" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="lifestyle" stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="routine_consistency" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="2 2" />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="flex justify-between items-center text-[11px] text-[#b5a397] mt-3 pt-3 border-t border-[#f0ede8]">
                <span>Plotted {chartData.length} clinical checkpoints in chronological order</span>
                <span>Values range 0 (Severe Distress) to 100 (Optimal Barrier)</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Routine Adherence & Interactive Daily Checklist ─────────── */}
        <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-bold text-[#2c2417] uppercase tracking-widest">Routine Adherence</h2>
              <p className="text-xs text-[#b5a397] mt-0.5">Habit consistency and daily step execution</p>
            </div>
            <Link
              to="/routine"
              className="text-xs text-[#8b7355] font-semibold hover:text-[#745f44] flex items-center gap-1"
            >
              Open Planner <ChevronRight size={13} />
            </Link>
          </div>

          {!adherence?.has_routine ? (
            <div className="bg-[#faf8f5] border border-[#e8e4dc] rounded-xl p-6 text-center">
              <Shield size={32} className="text-[#8b7355] mx-auto mb-2 opacity-60" />
              <p className="text-sm font-semibold text-[#2c2417] mb-1">No Active Routine Found</p>
              <p className="text-xs text-[#8b7355] max-w-sm mx-auto mb-4">Generate your personalized clinical morning and evening routine to activate daily adherence tracking.</p>
              <Link
                to="/routine"
                className="inline-flex items-center gap-1.5 text-xs bg-[#8b7355] text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#745f44]"
              >
                Go to Routine Planner
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Ring Gauges */}
              <div className="flex items-center justify-around flex-wrap gap-6 py-2 border-b border-[#f0ede8]">
                <AdherenceRing
                  pct={adherence.today_percent}
                  label="Today"
                  completed={adherence.today_completed}
                  total={adherence.today_total}
                />
                <AdherenceRing
                  pct={adherence.week_percent}
                  label="This Week"
                  completed={adherence.week_completed}
                  total={adherence.week_total}
                />
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame size={26} className={adherence.streak_days > 0 ? 'text-orange-500' : 'text-slate-300'} />
                    <span className="text-2xl font-bold text-[#2c2417]">{adherence.streak_days}</span>
                  </div>
                  <p className="text-xs font-bold text-[#2c2417]">Day Streak</p>
                  <p className="text-[10px] text-[#b5a397]">
                    {adherence.streak_days > 0 ? 'Active consecutive days' : 'Check off today to begin'}
                  </p>
                </div>
              </div>

              {/* Interactive Daily Steps Checklist */}
              {adherence.today_steps?.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-[#8b7355] uppercase tracking-wider">
                      Today's Action Steps ({adherence.today_completed}/{adherence.today_total} completed)
                    </p>
                    <span className="text-[11px] text-[#b5a397]">Tap to complete step</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {adherence.today_steps.map((step) => {
                      const isToggling = togglingStepId === step.id;
                      return (
                        <button
                          key={step.id}
                          onClick={() => handleToggleStep(step.id, step.completed)}
                          disabled={isToggling}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                            step.completed
                              ? 'bg-[#f4fbf6] border-[#bbf7d0] text-[#166534]'
                              : 'bg-white border-[#e8e4dc] hover:border-[#8b7355] text-[#2c2417]'
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              step.completed
                                ? 'bg-[#22c55e] text-white shadow-xs'
                                : 'border-2 border-[#d4cabb] bg-white'
                            }`}
                          >
                            {step.completed && <Check size={14} strokeWidth={3} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${step.completed ? 'line-through opacity-80' : ''}`}>
                              {step.title}
                            </p>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-[#8b7355] opacity-75">
                              {step.routine_type}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Progress Comparison Engine ─────────────────────────────── */}
        <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#2c2417] uppercase tracking-widest">Progress Comparison</h2>
              <p className="text-xs text-[#b5a397] mt-0.5">Side-by-side longitudinal barrier & concern evolution</p>
            </div>
            {history.length >= 2 && (
              <button
                onClick={handleSwapComparison}
                className="text-xs font-semibold text-[#8b7355] hover:text-[#745f44] flex items-center gap-1.5 bg-[#f5f0e8] px-3 py-1.5 rounded-lg transition-colors"
                title="Swap baseline and comparison order"
              >
                <ArrowLeftRight size={13} /> Swap Comparison
              </button>
            )}
          </div>

          {/* Assessment Selectors */}
          {history.length >= 2 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 bg-[#faf8f5] p-4 rounded-xl border border-[#f0ede8]">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8b7355] mb-1.5">
                  Baseline Assessment (Older)
                </label>
                <select
                  value={baselineId}
                  onChange={(e) => handleComparisonChange(e.target.value, targetId)}
                  className="w-full text-xs font-medium bg-white border border-[#d4cabb] rounded-lg px-3 py-2 text-[#2c2417] focus:outline-none focus:ring-2 focus:ring-[#8b7355]/30"
                >
                  {history.map((h, i) => (
                    <option key={`base-${h.assessment_id}`} value={h.assessment_id}>
                      {h.date} — Score: {h.overall_score} {i === history.length - 1 ? '(Initial Baseline)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8b7355] mb-1.5">
                  Comparison Assessment (Newer)
                </label>
                <select
                  value={targetId}
                  onChange={(e) => handleComparisonChange(baselineId, e.target.value)}
                  className="w-full text-xs font-medium bg-white border border-[#d4cabb] rounded-lg px-3 py-2 text-[#2c2417] focus:outline-none focus:ring-2 focus:ring-[#8b7355]/30"
                >
                  {history.map((h, i) => (
                    <option key={`target-${h.assessment_id}`} value={h.assessment_id}>
                      {h.date} — Score: {h.overall_score} {i === 0 ? '(Latest Evaluation)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="bg-[#faf8f5] border border-dashed border-[#d4cabb] rounded-xl p-6 text-center mb-6">
              <Calendar size={28} className="text-[#8b7355] mx-auto mb-2 opacity-60" />
              <p className="text-sm font-bold text-[#2c2417] mb-1">
                {history.length === 1 ? '1 Assessment Recorded' : 'No Assessment Recorded'}
              </p>
              <p className="text-xs text-[#8b7355] max-w-md mx-auto mb-4">
                Longitudinal progress comparison requires at least 2 completed assessments to calculate score deltas, barrier recovery, and concern reduction.
              </p>
              <Link
                to="/assessment"
                className="inline-flex items-center gap-2 text-xs bg-[#8b7355] text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-[#745f44] transition-colors"
              >
                <Target size={14} /> Run Follow-up Assessment
              </Link>
            </div>
          )}

          {/* Comparison Body */}
          {comparison?.has_comparison && (
            <div className={`space-y-6 ${comparisonLoading ? 'opacity-50 pointer-events-none' : ''}`}>
              {/* Duration & Clinical Narrative */}
              <div className="bg-[#f5f0e8] border border-[#d4cabb] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-[#8b7355] shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-[#2c2417]">
                      {comparison.baseline_date} ➔ {comparison.target_date} ({comparison.days_apart} days elapsed)
                    </p>
                    <p className="text-xs text-[#8b7355] mt-0.5">{comparison.summary_text}</p>
                  </div>
                </div>
                <DeltaBadge delta={comparison.overall_delta} direction={comparison.direction} size="lg" />
              </div>

              {/* Side-by-Side Score Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#faf8f5] rounded-xl p-4 border border-[#e8e4dc] text-center">
                  <span className="text-[10px] font-bold text-[#8b7355] uppercase tracking-wider block mb-1">
                    Baseline ({comparison.baseline_date})
                  </span>
                  <span className="text-3xl font-black text-[#2c2417]">{comparison.baseline_score}</span>
                  <span className="text-[11px] text-[#b5a397] block mt-1">Starting Health Index</span>
                </div>
                <div className="bg-[#faf8f5] rounded-xl p-4 border border-[#e8e4dc] text-center">
                  <span className="text-[10px] font-bold text-[#8b7355] uppercase tracking-wider block mb-1">
                    Comparison ({comparison.target_date})
                  </span>
                  <span className="text-3xl font-black text-[#2c2417]">{comparison.target_score}</span>
                  <span className="text-[11px] text-[#b5a397] block mt-1">Evolved Health Index</span>
                </div>
              </div>

              {/* 5-Pillar Shift Breakdown */}
              {comparison.pillar_deltas?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#8b7355] mb-3">5-Pillar Score Shift</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {comparison.pillar_deltas.map((pd) => (
                      <div
                        key={pd.pillar}
                        className="bg-white border border-[#e8e4dc] rounded-xl p-3.5 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-[#2c2417]">{pd.pillar}</p>
                          <p className="text-[11px] text-[#b5a397] mt-0.5">
                            {pd.previous} ➔ {pd.current}
                          </p>
                        </div>
                        <DeltaBadge delta={pd.delta} direction={pd.direction} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clinical Concerns Evolution Matrix */}
              {comparison.concern_deltas?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#8b7355] mb-3">
                    Concern Severity & Resolution Shifts
                  </h3>
                  <div className="space-y-2">
                    {comparison.concern_deltas.map((cd) => {
                      const isResolved = cd.status === 'resolved';
                      const isImproved = cd.status === 'improved';
                      const isWorsened = cd.status === 'worsened';

                      let badgeColor = '#94a3b8';
                      let badgeText = 'Stable';
                      if (isResolved) {
                        badgeColor = '#22c55e';
                        badgeText = '✓ Resolved';
                      } else if (isImproved) {
                        badgeColor = '#10b981';
                        badgeText = `↓ Severity Reduced (${cd.delta > 0 ? `-${cd.delta} pts` : ''})`;
                      } else if (isWorsened) {
                        badgeColor = '#ef4444';
                        badgeText = `↑ Attention (${cd.delta < 0 ? `+${Math.abs(cd.delta)} pts` : ''})`;
                      } else if (cd.status === 'new') {
                        badgeColor = '#f59e0b';
                        badgeText = '• Newly Emerged';
                      }

                      return (
                        <div
                          key={cd.concern}
                          className="bg-white border border-[#f0ede8] rounded-xl p-3 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-[#2c2417]">{cd.concern}</span>
                            <span className="text-[11px] text-[#b5a397] ml-2">
                              Baseline: {cd.baseline_severity ?? '0'}% · Comparison: {cd.target_severity ?? '0'}%
                            </span>
                          </div>
                          <span
                            className="font-bold text-[11px] px-2.5 py-0.5 rounded-full"
                            style={{ color: badgeColor, background: `${badgeColor}18` }}
                          >
                            {badgeText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Assessment History ─────────────────────────────────────── */}
        {history.length > 0 && (
          <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6">
            <h2 className="text-sm font-bold text-[#2c2417] uppercase tracking-widest mb-4">Assessment History</h2>
            <div className="space-y-3">
              {history.map((item, i) => {
                const isLatest = i === 0;
                const scoreColor = item.overall_score >= 75 ? '#22c55e' : item.overall_score >= 55 ? '#f59e0b' : '#ef4444';
                return (
                  <div
                    key={item.assessment_id}
                    className={`flex items-center gap-4 p-4 rounded-xl border ${
                      isLatest ? 'border-[#8b7355] bg-[#faf8f5]' : 'border-[#f0ede8]'
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
                      style={{ background: `${scoreColor}18`, color: scoreColor }}
                    >
                      {item.overall_score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-[#2c2417]">{item.date}</span>
                        {isLatest && <span className="text-[10px] bg-[#8b7355] text-white px-2 py-0.5 rounded-full font-bold">Latest</span>}
                      </div>
                      {item.top_concerns?.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {item.top_concerns.map((c) => (
                            <span key={c} className="text-[10px] bg-[#f5f0e8] text-[#8b7355] px-2 py-0.5 rounded-full font-medium">
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-[#b5a397]">H: {item.hydration_score ?? '—'} · S: {item.sleep_score ?? '—'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-[10px] text-[#b5a397] text-center pb-4">
          Your skin health data is personal and private. It is not shared without your consent.
        </p>
      </div>
    </div>
  );
}
