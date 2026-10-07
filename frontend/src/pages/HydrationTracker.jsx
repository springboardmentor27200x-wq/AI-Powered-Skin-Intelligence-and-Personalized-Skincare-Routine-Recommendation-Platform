import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { logHydration, getHydrationLogs, deleteHydrationLog } from "../services/api";

const DAILY_GOAL = 3.0; // litres

export default function HydrationTracker() {
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({ water_litres: "", glasses: "", notes: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () =>
    getHydrationLogs().then((r) => setLogs(r.data)).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setSaving(true);
    try {
      await logHydration({
        water_litres: Number(form.water_litres),
        glasses: form.glasses ? Number(form.glasses) : null,
        notes: form.notes || null,
      });
      setSuccess("Hydration logged!");
      setForm({ water_litres: "", glasses: "", notes: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to log hydration.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this hydration log?")) return;
    await deleteHydrationLog(id);
    load();
  };

  // Today's total
  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = logs.filter((l) => l.log_date === today);
  const todayTotal = todayLogs.reduce((sum, l) => sum + l.water_litres, 0);
  const progress = Math.min((todayTotal / DAILY_GOAL) * 100, 100);

  return (
    <section className="card tracker-card">
      <p className="eyebrow">Hydration Tracking</p>
      <h1>💧 Log Your Water Intake</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 8 }}>
        Stay hydrated for healthy, glowing skin. Daily goal: {DAILY_GOAL}L
      </p>

      {/* Progress bar */}
      <div className="progress-ring-wrap">
        <div style={{ width: "100%", background: "var(--green-light)", borderRadius: 10, height: 28, overflow: "hidden" }}>
          <div style={{
            width: `${progress}%`, height: "100%",
            background: progress >= 100 ? "#22c55e" : "var(--green-dark)",
            borderRadius: 10, transition: "width .4s ease",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 12, fontWeight: 700,
          }}>
            {todayTotal.toFixed(1)}L / {DAILY_GOAL}L
          </div>
        </div>
        <span className="progress-ring-label">
          {progress >= 100 ? "🎉 Daily goal reached!" : `${(DAILY_GOAL - todayTotal).toFixed(1)}L remaining`}
        </span>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={submit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <label>
            Water (litres)
            <input name="water_litres" type="number" min="0" max="50" step="0.1"
              value={form.water_litres} onChange={change} required placeholder="e.g. 0.5" />
          </label>
          <label>
            Glasses (optional)
            <input name="glasses" type="number" min="0" max="200"
              value={form.glasses} onChange={change} placeholder="e.g. 2" />
          </label>
        </div>

        <label>
          Notes
          <textarea name="notes" value={form.notes} onChange={change}
            placeholder="e.g. Drank lemon water, herbal tea, etc." rows={2} />
        </label>

        <button className="primary" disabled={saving}>
          {saving ? "Saving…" : "Log Hydration"}
        </button>
      </form>

      {/* Recent logs */}
      <hr className="divider" />
      <p className="section-title">Recent Hydration Logs</p>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading…</p>
      ) : logs.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>No hydration logs yet. Start logging above!</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="log-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Litres</th>
                <th>Glasses</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 10).map((l) => (
                <tr key={l.id}>
                  <td>{l.log_date}</td>
                  <td><strong>{l.water_litres}L</strong></td>
                  <td>{l.glasses ?? "–"}</td>
                  <td>{l.notes || "–"}</td>
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
