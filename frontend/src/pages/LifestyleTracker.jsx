import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { logLifestyle, getLifestyleLogs, deleteLifestyleLog } from "../services/api";

const DIET_LABELS = ["", "Poor", "Below Average", "Average", "Good", "Excellent"];
const STRESS_LABELS = ["", "Very Low", "Low", "Moderate", "High", "Very High"];

export default function LifestyleTracker() {
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({
    exercise_minutes: "", diet_quality: "", stress_level: "",
    smoking: false, alcohol: false, notes: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () =>
    getLifestyleLogs().then((r) => setLogs(r.data)).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setSaving(true);
    try {
      await logLifestyle({
        exercise_minutes: form.exercise_minutes ? Number(form.exercise_minutes) : null,
        diet_quality: form.diet_quality ? Number(form.diet_quality) : null,
        stress_level: form.stress_level ? Number(form.stress_level) : null,
        smoking: form.smoking,
        alcohol: form.alcohol,
        notes: form.notes || null,
      });
      setSuccess("Lifestyle entry logged!");
      setForm({ exercise_minutes: "", diet_quality: "", stress_level: "", smoking: false, alcohol: false, notes: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to log lifestyle.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this lifestyle log?")) return;
    await deleteLifestyleLog(id);
    load();
  };

  return (
    <section className="card tracker-card">
      <p className="eyebrow">Lifestyle Tracking</p>
      <h1>🏃 Log Your Lifestyle</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 8 }}>
        Track exercise, diet quality, stress, and habits that impact your skin health.
      </p>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={submit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <label>
            Exercise (minutes)
            <input name="exercise_minutes" type="number" min="0" max="1440"
              value={form.exercise_minutes} onChange={change} placeholder="e.g. 30" />
          </label>
          <label>
            Diet Quality (1–5)
            <select name="diet_quality" value={form.diet_quality} onChange={change}>
              <option value="">Select</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} — {DIET_LABELS[n]}</option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Stress Level (1–5)
          <select name="stress_level" value={form.stress_level} onChange={change}>
            <option value="">Select</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n} — {STRESS_LABELS[n]}</option>
            ))}
          </select>
        </label>

        <div style={{ display: "flex", gap: 28 }}>
          <label className="check">
            <input name="smoking" type="checkbox" checked={form.smoking} onChange={change} />
            Smoking today
          </label>
          <label className="check">
            <input name="alcohol" type="checkbox" checked={form.alcohol} onChange={change} />
            Alcohol today
          </label>
        </div>

        <label>
          Notes
          <textarea name="notes" value={form.notes} onChange={change}
            placeholder="e.g. Ate more vegetables, went for a walk" rows={2} />
        </label>

        <button className="primary" disabled={saving}>
          {saving ? "Saving…" : "Log Lifestyle"}
        </button>
      </form>

      {/* Recent logs */}
      <hr className="divider" />
      <p className="section-title">Recent Lifestyle Logs</p>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading…</p>
      ) : logs.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>No lifestyle logs yet. Start logging above!</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="log-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Exercise</th>
                <th>Diet</th>
                <th>Stress</th>
                <th>Smoking</th>
                <th>Alcohol</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 10).map((l) => (
                <tr key={l.id}>
                  <td>{l.log_date}</td>
                  <td>{l.exercise_minutes != null ? `${l.exercise_minutes} min` : "–"}</td>
                  <td>{l.diet_quality ? `${l.diet_quality}/5` : "–"}</td>
                  <td>{l.stress_level ? `${l.stress_level}/5` : "–"}</td>
                  <td>{l.smoking ? "Yes" : "No"}</td>
                  <td>{l.alcohol ? "Yes" : "No"}</td>
                  <td>
                    <button className="danger" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => handleDelete(l.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <Link className="secondary" to="/dashboard">← Back to Dashboard</Link>
      </div>
    </section>
  );
}
