import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { generateRoutine, getRoutine } from "../api/client";

function StepList({ steps }) {
  if (steps.length === 0) {
    return <p className="text-sm text-ink/50">No steps.</p>;
  }
  return (
    <ol className="space-y-3">
      {steps.map((s) => (
        <li key={s.id} className="rounded-xl bg-mist p-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-clinical-500 text-[10px] font-bold text-white">
              {s.step_order}
            </span>
            <span className="text-xs font-medium uppercase tracking-wide text-clinical-600">
              {s.category.replace(/_/g, " ")}
            </span>
            {s.frequency !== "daily" && (
              <span className="rounded-full bg-bloom-200/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-bloom-600">
                {s.frequency === "2x_week" ? "2x/week" : "weekly"}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-ink">{s.instruction}</p>
          {s.reason && <p className="mt-1 text-xs italic text-ink/50">{s.reason}</p>}
        </li>
      ))}
    </ol>
  );
}

export default function RoutinePanel({ assessmentReady, refreshKey}) {
  const { token } = useAuth();
  const [routine, setRoutine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    return getRoutine(token)
      .then(setRoutine)
      .catch(() => setRoutine(null))
      .finally(() => setLoading(false));
  }

    useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, refreshKey]);

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const data = await generateRoutine(token);
      setRoutine(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-ink/50">Loading your routine...</p>;
  }

  return (
    <div className="rounded-2xl border border-clay bg-white p-6">
            <div className="flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">Skincare routine</p>
        {routine?.season && (
          <span className="rounded-full bg-mist px-3 py-1 text-xs capitalize text-ink/60">
            {routine.season} routine
          </span>
        )}
      </div>

      {!routine ? (
        <p className="mt-4 text-ink/70">
          {assessmentReady
            ? "Generate a routine based on your latest assessment."
            : "Run an assessment above first — the routine is built from it."}
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <h4 className="mb-3 font-display text-base text-ink">Morning</h4>
            <StepList steps={routine.morning} />
          </div>
          <div>
            <h4 className="mb-3 font-display text-base text-ink">Evening</h4>
            <StepList steps={routine.evening} />
          </div>
        </div>
      )}

      {error && <p className="mt-4 rounded-lg bg-bloom-200/60 px-3 py-2 text-sm text-bloom-600">{error}</p>}

      <button
        type="button"
        onClick={handleGenerate}
        disabled={generating || !assessmentReady}
        className="focus-ring mt-5 rounded-full bg-clinical-500 px-6 py-2.5 font-medium text-white transition hover:bg-clinical-600 disabled:opacity-60"
      >
        {generating ? "Generating..." : routine ? "Regenerate Routine" : "Generate Routine"}
      </button>
      {!assessmentReady && !routine && (
        <p className="mt-2 text-xs text-ink/40">Run an assessment first to enable this.</p>
      )}
    </div>
  );
}