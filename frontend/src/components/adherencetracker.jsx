import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { markAdherence, getAdherence } from "../api/client";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdherenceTracker() {
  const { token } = useAuth();
  const [morning, setMorning] = useState(false);
  const [evening, setEvening] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdherence(token, 1)
      .then((rows) => {
        const today = rows.find((r) => r.log_date === todayISO());
        if (today) {
          setMorning(today.morning_completed);
          setEvening(today.evening_completed);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function toggle(which) {
    const nextMorning = which === "morning" ? !morning : morning;
    const nextEvening = which === "evening" ? !evening : evening;
    setMorning(nextMorning);
    setEvening(nextEvening);
    setSaving(true);
    setError("");
    try {
      await markAdherence(token, {
        log_date: todayISO(),
        morning_completed: nextMorning,
        evening_completed: nextEvening,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-ink/50">Loading today's routine status...</p>;
  }

  return (
    <div className="rounded-2xl border border-clay bg-white p-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">Today's routine</p>
      <p className="mt-2 text-sm text-ink/60">Mark off what you actually did today.</p>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => toggle("morning")}
          disabled={saving}
          className={`focus-ring flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition ${
            morning ? "border-clinical-500 bg-clinical-50 text-clinical-700" : "border-clay bg-white text-ink/60"
          }`}
        >
          {morning ? "✓ " : ""}Morning routine
        </button>
        <button
          type="button"
          onClick={() => toggle("evening")}
          disabled={saving}
          className={`focus-ring flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition ${
            evening ? "border-clinical-500 bg-clinical-50 text-clinical-700" : "border-clay bg-white text-ink/60"
          }`}
        >
          {evening ? "✓ " : ""}Evening routine
        </button>
      </div>

      {error && <p className="mt-3 rounded-lg bg-bloom-200/60 px-3 py-2 text-sm text-bloom-600">{error}</p>}
    </div>
  );
}