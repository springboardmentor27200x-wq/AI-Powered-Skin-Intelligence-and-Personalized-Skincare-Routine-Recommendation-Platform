import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchAnalytics, getAssessmentHistory } from "../api/client";

const TREND_STYLES = {
  improving: { label: "Improving", color: "text-clinical-600" },
  declining: { label: "Declining", color: "text-bloom-600" },
  stable: { label: "Stable", color: "text-ink/60" },
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ProgressAnalytics() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [beforeId, setBeforeId] = useState("");
  const [afterId, setAfterId] = useState("");

  useEffect(() => {
    Promise.all([fetchAnalytics(token), getAssessmentHistory(token, 30)])
      .then(([a, h]) => {
        setAnalytics(a);
        setHistory(h);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (loading) {
    return <p className="text-sm text-ink/50">Loading your progress...</p>;
  }

  if (error) {
    return <p className="rounded-lg bg-bloom-200/60 px-3 py-2 text-sm text-bloom-600">{error}</p>;
  }

  if (!analytics || history.length === 0) {
    return (
      <div className="rounded-2xl border border-clay bg-white p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">Progress</p>
        <p className="mt-4 text-ink/70">
          No assessment history yet — run an assessment on My Plan to start tracking progress.
        </p>
      </div>
    );
  }

  const trendStyle = TREND_STYLES[analytics.trend] || TREND_STYLES.stable;
  const chronological = [...history].reverse();

  const beforeAssessment = history.find((a) => a.id === beforeId);
  const afterAssessment = history.find((a) => a.id === afterId);
  const concernsAdded = beforeAssessment && afterAssessment
    ? afterAssessment.prioritized_concerns.filter((c) => !beforeAssessment.prioritized_concerns.includes(c))
    : [];
  const concernsResolved = beforeAssessment && afterAssessment
    ? beforeAssessment.prioritized_concerns.filter((c) => !afterAssessment.prioritized_concerns.includes(c))
    : [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-clay bg-white p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">Progress summary</p>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="font-display text-3xl font-bold text-ink">{analytics.current_score}</p>
            <p className="text-xs text-ink/50">Current score</p>
          </div>
          <div>
            <p className={`font-display text-3xl font-bold ${trendStyle.color}`}>
              {analytics.change_since_first > 0 ? "+" : ""}{analytics.change_since_first}
            </p>
            <p className="text-xs text-ink/50">Since first assessment</p>
          </div>
          <div>
            <p className="font-display text-3xl font-bold text-ink">{analytics.average_score}</p>
            <p className="text-xs text-ink/50">Average score</p>
          </div>
          <div>
            <p className={`font-display text-xl font-bold ${trendStyle.color}`}>{trendStyle.label}</p>
            <p className="text-xs text-ink/50">Trend</p>
          </div>
        </div>

        <p className="mt-4 text-xs text-ink/40">
          Best: {analytics.best_score} · Worst: {analytics.worst_score} · Based on {analytics.assessments_count} assessment{analytics.assessments_count === 1 ? "" : "s"}
        </p>
      </div>

      <div className="rounded-2xl border border-clay bg-white p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">Score history</p>
        <div className="mt-5 flex items-end gap-2" style={{ height: "120px" }}>
          {chronological.map((a) => (
            <div key={a.id} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t-md bg-clinical-500"
                style={{ height: `${Math.max(a.score, 4)}%` }}
                title={`${a.score}/100`}
              />
              <span className="text-[10px] text-ink/40">{formatDate(a.created_at)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-clay bg-white p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">Before / after comparison</p>
        <p className="mt-2 text-sm text-ink/60">Pick two assessments to compare.</p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/60">Before</label>
            <select
              value={beforeId}
              onChange={(e) => setBeforeId(e.target.value)}
              className="focus-ring w-full rounded-lg border border-clay bg-white px-3 py-2 text-sm text-ink"
            >
              <option value="">Select...</option>
              {history.map((a) => (
                <option key={a.id} value={a.id}>{formatDate(a.created_at)} — score {a.score}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/60">After</label>
            <select
              value={afterId}
              onChange={(e) => setAfterId(e.target.value)}
              className="focus-ring w-full rounded-lg border border-clay bg-white px-3 py-2 text-sm text-ink"
            >
              <option value="">Select...</option>
              {history.map((a) => (
                <option key={a.id} value={a.id}>{formatDate(a.created_at)} — score {a.score}</option>
              ))}
            </select>
          </div>
        </div>

        {beforeAssessment && afterAssessment && (
          <div className="mt-5 rounded-xl bg-mist p-4">
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-ink">{beforeAssessment.score}</p>
                <p className="text-xs text-ink/50">{formatDate(beforeAssessment.created_at)}</p>
              </div>
              <span className="text-ink/30">→</span>
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-ink">{afterAssessment.score}</p>
                <p className="text-xs text-ink/50">{formatDate(afterAssessment.created_at)}</p>
              </div>
              <div className="text-center">
                <p className={`font-display text-2xl font-bold ${
                  afterAssessment.score > beforeAssessment.score ? "text-clinical-600" : afterAssessment.score < beforeAssessment.score ? "text-bloom-600" : "text-ink/60"
                }`}>
                  {afterAssessment.score - beforeAssessment.score > 0 ? "+" : ""}{afterAssessment.score - beforeAssessment.score}
                </p>
                <p className="text-xs text-ink/50">Change</p>
              </div>
            </div>

            {(concernsResolved.length > 0 || concernsAdded.length > 0) && (
              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-clay/60 pt-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-clinical-600">Resolved</p>
                  {concernsResolved.length > 0 ? (
                    <p className="mt-1 text-sm text-ink/70">{concernsResolved.join(", ")}</p>
                  ) : (
                    <p className="mt-1 text-sm text-ink/40">None</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-bloom-600">New</p>
                  {concernsAdded.length > 0 ? (
                    <p className="mt-1 text-sm text-ink/70">{concernsAdded.join(", ")}</p>
                  ) : (
                    <p className="mt-1 text-sm text-ink/40">None</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}