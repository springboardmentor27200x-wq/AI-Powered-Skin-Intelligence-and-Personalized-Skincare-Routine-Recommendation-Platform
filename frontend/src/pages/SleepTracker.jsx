import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { logSleep, getSleepLogs, deleteSleepLog } from "../services/api";

export default function SleepTracker() {
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({
    sleep_hours: "", bedtime: "", wakeup_time: "",
    quality: "", consistency: "", notes: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () =>
    getSleepLogs().then((r) => setLogs(r.data)).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setSaving(true);
    try {
      await logSleep({
        sleep_hours: Number(form.sleep_hours),
        bedtime: form.bedtime || null,
        wakeup_time: form.wakeup_time || null,
        quality: form.quality,
        consistency: form.consistency ? Number(form.consistency) : null,
        notes: form.notes || null,
      });
      setSuccess("Sleep logged successfully!");
      setForm({ sleep_hours: "", bedtime: "", wakeup_time: "", quality: "", consistency: "", notes: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to log sleep.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this sleep log?")) return;
    await deleteSleepLog(id);
    load();
  };

  return (
    <section className="card tracker-card">
      <p className="eyebrow">Sleep Tracking</p>
      <h1>😴 Log Your Sleep</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 8 }}>
        Track your sleep patterns for better skin health insights.
      </p>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={submit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <label>
            Sleep Hours
            <input name="sleep_hours" type="number" min="0" max="24" step="0.5"
              value={form.sleep_hours} onChange={change} required placeholder="e.g. 7.5" />
          </label>
          <label>
            Quality
            <select name="quality" value={form.quality} onChange={change} required>
              <option value="">Select</option>
              {["Poor", "Average", "Good", "Excellent"].map((q) => (
                <option key={q}>{q}</option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <label>
            Bedtime
            <input name="bedtime" type="time" value={form.bedtime} onChange={change} />
          </label>
          <label>
            Wake-up Time
            <input name="wakeup_time" type="time" value={form.wakeup_time} onChange={change} />
          </label>
        </div>

        <label>
          Consistency (1–5)
          <select name="consistency" value={form.consistency} onChange={change}>
            <option value="">Select</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n} — {["Very inconsistent", "Inconsistent", "Moderate", "Consistent", "Very consistent"][n - 1]}</option>
            ))}
          </select>
        </label>

        <label>
          Notes
          <textarea name="notes" value={form.notes} onChange={change} placeholder="Any additional notes about your sleep" rows={2} />
        </label>

        <button className="primary" disabled={saving}>
          {saving ? "Saving…" : "Log Sleep"}
        </button>
      </form>

      {/* Recent logs */}
      <hr className="divider" />
      <p className="section-title">Recent Sleep Logs</p>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading…</p>
      ) : logs.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>No sleep logs yet. Log your first entry above!</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="log-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Hours</th>
                <th>Quality</th>
                <th>Bedtime</th>
                <th>Wake-up</th>
                <th>Consistency</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 10).map((l) => (
                <tr key={l.id}>
                  <td>{l.log_date}</td>
                  <td><strong>{l.sleep_hours}h</strong></td>
                  <td>{l.quality}</td>
                  <td>{l.bedtime || "–"}</td>
                  <td>{l.wakeup_time || "–"}</td>
                  <td>{l.consistency ? `${l.consistency}/5` : "–"}</td>
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
