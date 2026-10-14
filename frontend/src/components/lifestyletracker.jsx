import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { deleteDailyLog, fetchDailyLogs, saveDailyLog } from "../api/client";

const SLEEP_QUALITY = ["poor", "fair", "good", "excellent"];
const LIFESTYLE_HABITS = ["smoking", "high_stress", "frequent_travel", "alcohol", "exercise", "none"];
const ENVIRONMENTAL_EXPOSURE = ["sun", "pollution", "ac_heat", "none"];
const ACTIVITY_LEVEL = ["low", "moderate", "high"];
const STRESS_LEVEL = ["low", "moderate", "high"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function label(word) {
  return word.replace(/_/g, " ");
}

function toggleInList(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

const EMPTY_FORM = {
  log_date: todayISO(),
  sleep_quality: "",
  sleep_hours: "",
  water_intake_liters: "",
  activity_level: "",
  stress_level: "",
  diet_notes: "",
  lifestyle_habits: [],
  environmental_exposure: [],
  notes: "",
};

export default function LifestyleTracker() {
  const { token } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState(null);
  const [deletingDate, setDeletingDate] = useState(null);

  function loadLogs() {
    return fetchDailyLogs(token, 30)
      .then(setLogs)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    loadLogs().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        log_date: form.log_date,
        sleep_quality: form.sleep_quality || null,
        sleep_hours: form.sleep_hours === "" ? null : Number(form.sleep_hours),
        water_intake_liters: form.water_intake_liters === "" ? null : Number(form.water_intake_liters),
        activity_level: form.activity_level || null,
        stress_level: form.stress_level || null,
        diet_notes: form.diet_notes || null,
        lifestyle_habits: form.lifestyle_habits,
        environmental_exposure: form.environmental_exposure,
        notes: form.notes || null,
      };
      await saveDailyLog(token, payload);
      setSavedAt(new Date());
      setForm(EMPTY_FORM);
      await loadLogs();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(logDate) {
    if (!window.confirm(`Delete the entry for ${logDate}? This can't be undone.`)) return;
    setDeletingDate(logDate);
    setError("");
    try {
      await deleteDailyLog(token, logDate);
      await loadLogs();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingDate(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-ink/50">Loading your logs...</p>;
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/80">Date</label>
            <input
              type="date"
              required
              max={todayISO()}
              value={form.log_date}
              onChange={(e) => setForm((f) => ({ ...f, log_date: e.target.value }))}
              className="focus-ring w-full rounded-xl border border-clay bg-white px-4 py-2.5 text-ink"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/80">Sleep quality</label>
            <select
              value={form.sleep_quality}
              onChange={(e) => setForm((f) => ({ ...f, sleep_quality: e.target.value }))}
              className="focus-ring w-full rounded-xl border border-clay bg-white px-4 py-2.5 text-ink"
            >
              <option value="">Select...</option>
              {SLEEP_QUALITY.map((s) => (
                <option key={s} value={s}>{label(s)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/80">Sleep hours</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={form.sleep_hours}
              onChange={(e) => setForm((f) => ({ ...f, sleep_hours: e.target.value }))}
              placeholder="e.g. 7.5"
              className="focus-ring w-full rounded-xl border border-clay bg-white px-4 py-2.5 text-ink"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/80">Water intake (liters)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={form.water_intake_liters}
            onChange={(e) => setForm((f) => ({ ...f, water_intake_liters: e.target.value }))}
            placeholder="e.g. 2.0"
            className="focus-ring w-full max-w-xs rounded-xl border border-clay bg-white px-4 py-2.5 text-ink"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/80">Activity level</label>
            <select
              value={form.activity_level}
              onChange={(e) => setForm((f) => ({ ...f, activity_level: e.target.value }))}
              className="focus-ring w-full rounded-xl border border-clay bg-white px-4 py-2.5 text-ink"
            >
              <option value="">Select...</option>
              {ACTIVITY_LEVEL.map((a) => (
                <option key={a} value={a}>{label(a)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/80">Stress level</label>
            <select
              value={form.stress_level}
              onChange={(e) => setForm((f) => ({ ...f, stress_level: e.target.value }))}
              className="focus-ring w-full rounded-xl border border-clay bg-white px-4 py-2.5 text-ink"
            >
              <option value="">Select...</option>
              {STRESS_LEVEL.map((s) => (
                <option key={s} value={s}>{label(s)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/80">Diet notes</label>
            <input
              value={form.diet_notes}
              onChange={(e) => setForm((f) => ({ ...f, diet_notes: e.target.value }))}
              placeholder="e.g. vegetarian, skipped breakfast"
              className="focus-ring w-full rounded-xl border border-clay bg-white px-4 py-2.5 text-ink"
            />
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink/80">Lifestyle habits today</span>
          <div className="flex flex-wrap gap-2">
            {LIFESTYLE_HABITS.map((h) => (
              <button
                type="button"
                key={h}
                onClick={() => setForm((f) => ({ ...f, lifestyle_habits: toggleInList(f.lifestyle_habits, h) }))}
                className={`focus-ring rounded-full border px-3 py-1.5 text-xs transition ${
                  form.lifestyle_habits.includes(h)
                    ? "border-clinical-500 bg-clinical-50 text-clinical-700"
                    : "border-clay bg-white text-ink/60 hover:border-clinical-400"
                }`}
              >
                {label(h)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink/80">Environmental exposure today</span>
          <div className="flex flex-wrap gap-2">
            {ENVIRONMENTAL_EXPOSURE.map((e) => (
              <button
                type="button"
                key={e}
                onClick={() =>
                  setForm((f) => ({ ...f, environmental_exposure: toggleInList(f.environmental_exposure, e) }))
                }
                className={`focus-ring rounded-full border px-3 py-1.5 text-xs transition ${
                  form.environmental_exposure.includes(e)
                    ? "border-clinical-500 bg-clinical-50 text-clinical-700"
                    : "border-clay bg-white text-ink/60 hover:border-clinical-400"
                }`}
              >
                {label(e)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/80">Notes (optional)</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="focus-ring w-full rounded-xl border border-clay bg-white px-4 py-2.5 text-ink"
            placeholder="Anything else worth remembering about today"
          />
        </div>

        {error && <p className="rounded-lg bg-bloom-200/60 px-3 py-2 text-sm text-bloom-600">{error}</p>}
        {savedAt && !error && (
          <p className="text-sm text-clinical-600">Saved at {savedAt.toLocaleTimeString()}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="focus-ring rounded-full bg-clinical-500 px-6 py-2.5 font-medium text-white transition hover:bg-clinical-600 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Log today"}
        </button>
      </form>

      <div>
        <h3 className="mb-3 font-display text-base text-ink">Recent history</h3>
        {logs.length === 0 ? (
          <p className="text-sm text-ink/50">No entries yet — log today above to start tracking.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-clay">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-clay bg-mist text-xs uppercase tracking-wide text-ink/50">
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Sleep</th>
                  <th className="px-4 py-2 font-medium">Water</th>
                  <th className="px-4 py-2 font-medium">Activity</th>
                  <th className="px-4 py-2 font-medium">Stress</th>
                  <th className="px-4 py-2 font-medium">Habits</th>
                  <th className="px-4 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-clay/60 last:border-0">
                    <td className="px-4 py-2 text-ink">{l.log_date}</td>
                    <td className="px-4 py-2 text-ink/70">
                      {l.sleep_quality ? label(l.sleep_quality) : "—"}
                      {l.sleep_hours ? ` · ${l.sleep_hours}h` : ""}
                    </td>
                    <td className="px-4 py-2 text-ink/70">
                      {l.water_intake_liters ? `${l.water_intake_liters} L` : "—"}
                    </td>
                    <td className="px-4 py-2 text-ink/70">
                      {l.activity_level ? label(l.activity_level) : "—"}
                    </td>
                    <td className="px-4 py-2 text-ink/70">
                      {l.stress_level ? label(l.stress_level) : "—"}
                    </td>
                    <td className="px-4 py-2 text-ink/70">
                      {(l.lifestyle_habits || []).map(label).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(l.log_date)}
                        disabled={deletingDate === l.log_date}
                        className="focus-ring text-xs font-medium text-bloom-600 hover:underline disabled:opacity-50"
                      >
                        {deletingDate === l.log_date ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}