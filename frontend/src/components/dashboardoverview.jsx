import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getLatestAssessment, getRoutine, fetchRecommendations, fetchAnalytics } from "../api/client";
import AdherenceTracker from "./adherencetracker";

const TREND_STYLES = {
  improving: { label: "Improving", color: "text-clinical-600" },
  declining: { label: "Declining", color: "text-bloom-600" },
  stable: { label: "Stable", color: "text-ink/60" },
};

function scoreColor(score) {
  if (score >= 80) return "text-clinical-600";
  if (score >= 50) return "text-bloom-600";
  return "text-bloom-600";
}

function ScoreCard() {
  const { token } = useAuth();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLatestAssessment(token)
      .then(setAssessment)
      .catch(() => setAssessment(null))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="rounded-2xl border border-clay bg-white p-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">Skin health score</p>
      {loading ? (
        <p className="mt-4 text-sm text-ink/50">Loading...</p>
      ) : assessment ? (
        <>
          <p className={`mt-3 font-display text-5xl font-bold ${scoreColor(assessment.score)}`}>{assessment.score}</p>
          <p className="text-xs uppercase tracking-wide text-ink/40">out of 100</p>
        </>
      ) : (
        <p className="mt-4 text-sm text-ink/60">No assessment yet.</p>
      )}
      <Link to="/plan" className="focus-ring mt-4 inline-block text-sm font-medium text-clinical-600 hover:underline">
        {assessment ? "View full assessment →" : "Run your first assessment →"}
      </Link>
    </div>
  );
}

function ProgressCard() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics(token)
      .then(setAnalytics)
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const trendStyle = analytics ? TREND_STYLES[analytics.trend] || TREND_STYLES.stable : null;

  return (
    <div className="rounded-2xl border border-clay bg-white p-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">Progress</p>
      {loading ? (
        <p className="mt-4 text-sm text-ink/50">Loading...</p>
      ) : analytics ? (
        <>
          <p className={`mt-3 font-display text-3xl font-bold ${trendStyle.color}`}>{trendStyle.label}</p>
          <p className="text-sm text-ink/60">
            {analytics.change_since_first > 0 ? "+" : ""}{analytics.change_since_first} since first assessment
          </p>
        </>
      ) : (
        <p className="mt-4 text-sm text-ink/60">No history yet — run a few assessments to see a trend.</p>
      )}
      <Link to="/progress" className="focus-ring mt-4 inline-block text-sm font-medium text-clinical-600 hover:underline">
        View full progress →
      </Link>
    </div>
  );
}

function RoutineCard() {
  const { token } = useAuth();
  const [routine, setRoutine] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRoutine(token)
      .then(setRoutine)
      .catch(() => setRoutine(null))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const totalSteps = routine ? routine.morning.length + routine.evening.length : 0;

  return (
    <div className="rounded-2xl border border-clay bg-white p-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">Your routine</p>
      {loading ? (
        <p className="mt-4 text-sm text-ink/50">Loading...</p>
      ) : routine ? (
        <>
          <p className="mt-3 font-display text-3xl font-bold text-ink">{totalSteps} steps</p>
          <p className="text-sm text-ink/60">
            {routine.morning.length} morning · {routine.evening.length} evening
            {routine.season && ` · ${routine.season} routine`}
          </p>
        </>
      ) : (
        <p className="mt-4 text-sm text-ink/60">No routine yet — generate one from your assessment.</p>
      )}
      <Link to="/plan" className="focus-ring mt-4 inline-block text-sm font-medium text-clinical-600 hover:underline">
        View full routine →
      </Link>
    </div>
  );
}

function ProductPickCard() {
  const { token } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations(token, { limit: 1 })
      .then((results) => setProduct(results[0] || null))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="rounded-2xl border border-clay bg-white p-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">Top product pick</p>
      {loading ? (
        <p className="mt-4 text-sm text-ink/50">Loading...</p>
      ) : product ? (
        <>
          <p className="mt-3 font-display text-lg font-bold text-ink">{product.name}</p>
          <p className="text-sm text-ink/60">{product.brand} · ₹{product.price} · {product.score}/100 match</p>
        </>
      ) : (
        <p className="mt-4 text-sm text-ink/60">Complete your skin profile to see recommendations.</p>
      )}
      <Link to="/products" className="focus-ring mt-4 inline-block text-sm font-medium text-clinical-600 hover:underline">
        See all recommendations →
      </Link>
    </div>
  );
}

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreCard />
        <ProgressCard />
        <RoutineCard />
        <ProductPickCard />
      </div>

      <div className="rounded-2xl border border-clay bg-white p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">Daily skincare checklist</p>
        <div className="mt-4">
          <AdherenceTracker />
        </div>
      </div>
    </div>
  );
}