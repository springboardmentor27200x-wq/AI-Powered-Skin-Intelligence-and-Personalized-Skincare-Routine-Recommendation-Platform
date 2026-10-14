import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getLatestAssessment, runAssessment } from "../api/client";

function scoreColor(score) {
  if (score >= 80) return "text-clinical-600";
  if (score >= 60) return "text-bloom-600";
  return "text-bloom-600";
}
const COMPONENTS = [
  { key: "skin_condition_score", label: "Skin Condition", weight: "35%" },
  { key: "lifestyle_score", label: "Lifestyle", weight: "20%" },
  { key: "sleep_score", label: "Sleep", weight: "15%" },
  { key: "routine_consistency_score", label: "Routine Consistency", weight: "20%" },
  { key: "hydration_score", label: "Hydration", weight: "10%" },
];

function ScoreBreakdown({ assessment }) {
  return (
    <div className="mt-5 space-y-2.5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Score breakdown</p>
      {COMPONENTS.map((c) => {
        const value = assessment[c.key];
        return (
          <div key={c.key} className="flex items-center gap-3">
            <span className="w-40 shrink-0 text-sm text-ink/70">
              {c.label} <span className="text-ink/40">({c.weight})</span>
            </span>
            <div className="h-2 flex-1 rounded-full bg-mist">
              <div
                className="h-2 rounded-full bg-clinical-500"
                style={{ width: `${value ?? 0}%` }}
              />
            </div>
            <span className="w-8 text-right text-sm text-ink/70">{value ?? "—"}</span>
          </div>
        );
      })}
    </div>
  );
}
export default function AssessmentPanel({ onAssessmentReady }) {
  const { token } = useAuth();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    return getLatestAssessment(token)
      .then((data) => {
        setAssessment(data);
        onAssessmentReady?.(data);
      })
      .catch(() => setAssessment(null)) // 404 = no assessment yet, not a real error
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleRun() {
    setRunning(true);
    setError("");
    try {
      const data = await runAssessment(token);
      setAssessment(data);
      onAssessmentReady?.(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-ink/50">Loading your assessment...</p>;
  }

  return (
    <div className="rounded-2xl border border-clay bg-white p-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">Skin assessment</p>

      {!assessment ? (
        <div className="mt-4">
          <p className="text-ink/70">
            No assessment yet. Run one to get a skin health score based on your profile and recent tracking.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="shrink-0">
            <div className={`font-display text-6xl font-bold ${scoreColor(assessment.score)}`}>
              {assessment.score}
            </div>
            <p className="text-xs uppercase tracking-wide text-ink/40">out of 100</p>
          </div>

          <div className="flex-1 space-y-4">
            {assessment.prioritized_concerns.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Priority concerns</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {assessment.prioritized_concerns.map((c) => (
                    <span
                      key={c}
                      className="rounded-full border border-clay bg-mist px-3 py-1 text-xs text-ink"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {assessment.risk_factors.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Risk factors</p>
                <ul className="mt-1.5 space-y-1">
                  {assessment.risk_factors.map((r, i) => (
                    <li key={i} className="text-sm text-ink/70">• {r}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-ink/40">
              Last run {new Date(assessment.created_at).toLocaleString()}
            </p>
            <ScoreBreakdown assessment={assessment} />
          </div>
        </div>
      )}

      {error && <p className="mt-4 rounded-lg bg-bloom-200/60 px-3 py-2 text-sm text-bloom-600">{error}</p>}

      <button
        type="button"
        onClick={handleRun}
        disabled={running}
        className="focus-ring mt-5 rounded-full bg-clinical-500 px-6 py-2.5 font-medium text-white transition hover:bg-clinical-600 disabled:opacity-60"
      >
        {running ? "Running..." : assessment ? "Run New Assessment" : "Run Assessment"}
      </button>
    </div>
  );
}