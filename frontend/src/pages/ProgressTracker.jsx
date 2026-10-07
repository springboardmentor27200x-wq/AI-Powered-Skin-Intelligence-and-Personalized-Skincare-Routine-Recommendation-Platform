import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { logProgress, getProgressHistory, getProgressAnalytics } from "../services/api";

export default function ProgressTracker() {
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [rating, setRating] = useState(7);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    try {
      const [hRes, aRes] = await Promise.all([
        getProgressHistory(),
        getProgressAnalytics()
      ]);
      setHistory(hRes.data);
      setAnalytics(aRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setSaving(true);
    try {
      await logProgress({
        skin_condition_rating: Number(rating),
        notes: notes.trim(),
        concerns_severity: {}
      });
      setSuccess("Skin progress logged successfully!");
      setNotes("");
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to log progress.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <div className="dashboard-head">
        <div>
          <p className="eyebrow">Progress Tracking</p>
          <h1>Skin Health & Adherence Progress</h1>
          <p style={{ color: "var(--text-muted)", marginTop: 4 }}>
            Log daily skin condition ratings, monitor routine adherence, and track skin health score improvements over time.
          </p>
        </div>
      </div>

      {/* Progress & Analytics Summary Cards */}
      {!loading && analytics && (
        <div className="grid-3" style={{ marginBottom: 28 }}>
          <div className="card stat" style={{ borderLeft: "4px solid var(--green-dark)" }}>
            <span>Average Condition Rating</span>
            <strong style={{ fontSize: 24, color: "var(--green-dark)" }}>
              {analytics.average_condition_rating} / 10
            </strong>
          </div>
          <div className="card stat" style={{ borderLeft: "4px solid var(--blue)" }}>
            <span>Routine Adherence Rate</span>
            <strong style={{ fontSize: 24, color: "var(--blue)" }}>
              {analytics.routine_adherence_rate}%
            </strong>
          </div>
          <div className="card stat" style={{ borderLeft: "4px solid var(--purple)" }}>
            <span>Health Score Improvement</span>
            <strong style={{ fontSize: 24, color: analytics.score_improvement >= 0 ? "var(--green-dark)" : "var(--red)" }}>
              {analytics.score_improvement >= 0 ? `+${analytics.score_improvement}` : analytics.score_improvement} pts
            </strong>
          </div>
          <div className="card stat" style={{ borderLeft: "4px solid var(--orange)" }}>
            <span>Total Progress Logs</span>
            <strong style={{ fontSize: 24, color: "var(--orange)" }}>
              {analytics.total_logs} Days
            </strong>
          </div>
        </div>
      )}

      {/* Daily Progress Entry Form */}
      <div className="card tracker-card" style={{ marginBottom: 32 }}>
        <h3>📈 Log Daily Skin Condition</h3>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
          Rate how your skin feels today and record notes on texture, breakouts, or improvements.
        </p>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <label>
            Skin Condition Rating (1 = Poor, 10 = Perfect)
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
              <input
                type="range"
                min="1"
                max="10"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                style={{ flex: 1 }}
              />
              <strong style={{ fontSize: 20, color: "var(--green-dark)", minWidth: 40 }}>{rating} / 10</strong>
            </div>
          </label>

          <label>
            Daily Observations & Skincare Notes
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Skin feels hydrated, no active breakouts, BHA serum reduced pore size..."
            />
          </label>

          <button className="primary" disabled={saving} style={{ width: "fit-content" }}>
            {saving ? "Logging..." : "Log Daily Progress"}
          </button>
        </form>
      </div>

      {/* Historical Progress Log Timeline Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <p className="section-title" style={{ padding: "20px 22px 0" }}>Historical Progress Log Timeline</p>

        {loading ? (
          <p style={{ padding: 22, color: "var(--text-muted)" }}>Loading progress history...</p>
        ) : history.length === 0 ? (
          <div className="empty">
            <h3>No progress entries yet</h3>
            <p>Log your first skin condition rating above!</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Log Date</th>
                  <th>Condition Rating</th>
                  <th>Health Score Snapshot</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {history.map((log) => (
                  <tr key={log.id}>
                    <td><strong>{log.log_date}</strong></td>
                    <td>
                      <span className="badge badge-user" style={{ fontSize: 13, fontWeight: 800 }}>
                        {log.skin_condition_rating} / 10
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: "var(--green-dark)" }}>
                        {log.skin_health_score_at_log ?? 75.0} / 100
                      </strong>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      {log.notes || "No additional notes."}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
