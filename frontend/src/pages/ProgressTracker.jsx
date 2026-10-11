import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { logProgress, getProgressHistory, getProgressAnalytics, updateChecklist, getTodayChecklist } from "../services/api";

export default function ProgressTracker() {
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [hasProfile, setHasProfile] = useState(true);
  const [rating, setRating] = useState(8);
  const [notes, setNotes] = useState("");
  const [completedMorning, setCompletedMorning] = useState(false);
  const [completedEvening, setCompletedEvening] = useState(false);
  const [completedHydration, setCompletedHydration] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    try {
      const [hRes, aRes, cRes] = await Promise.all([
        getProgressHistory(),
        getProgressAnalytics(),
        getTodayChecklist().catch(() => ({ data: { completed_steps: [] } })),
      ]);
      setHistory(hRes.data);
      setAnalytics(aRes.data);
      setHasProfile(true);

      const steps = cRes.data?.completed_steps || [];
      if (steps.some((s) => s.startsWith("m"))) setCompletedMorning(true);
      if (steps.some((s) => s.startsWith("e"))) setCompletedEvening(true);
      if (steps.includes("hydration")) setCompletedHydration(true);
    } catch (err) {
      if (err.response?.status === 404) {
        setHasProfile(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      // 1. Log skin condition rating & notes
      await logProgress({
        condition_rating: Number(rating),
        notes: notes.trim(),
        active_concerns: [],
      });

      // 2. Synchronize checklist steps based on user's tick marks
      const stepsToSave = [];
      if (completedMorning) stepsToSave.push("m1", "m2", "m3", "m4");
      if (completedEvening) stepsToSave.push("e1", "e2", "e3");
      if (completedHydration) stepsToSave.push("hydration");
      await updateChecklist(stepsToSave).catch(() => {});

      setSuccess("✅ Today's skin progress & routine activity logged successfully!");
      setNotes("");
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to log progress.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="card" style={{ textAlign: "center", padding: 40 }}>Loading progress analytics…</div>;
  }

  if (!hasProfile) {
    return (
      <section>
        <div className="dashboard-head">
          <div>
            <p className="eyebrow">Progress Tracking</p>
            <h1>Skin Health & Adherence Progress</h1>
          </div>
        </div>
        <div className="card empty" style={{ textAlign: "center", padding: "60px 24px", maxWidth: 640, margin: "40px auto" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>📈</div>
          <h2 style={{ fontSize: 24, marginBottom: 10, color: "var(--text-main)" }}>No Skin Profile Found</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
            Please create your skin profile first to track your daily progress, calendar streaks, routine adherence, and skin condition improvements.
          </p>
          <Link to="/profile" className="primary" style={{ display: "inline-block", padding: "10px 24px", fontSize: 15, textDecoration: "none" }}>
            👉 Create Skin Profile
          </Link>
        </div>
      </section>
    );
  }

  const calendarDays = analytics?.activity_calendar || [];

  return (
    <section>
      <div className="dashboard-head">
        <div>
          <p className="eyebrow">Progress Tracking & Consistency</p>
          <h1>Skin Health & Adherence Progress</h1>
          <p style={{ color: "var(--text-muted)", marginTop: 4 }}>
            Track your daily routine check-ins, view your monthly activity calendar heatmap, and monitor health improvements over time.
          </p>
        </div>
      </div>

      {/* Progress & Analytics Summary Cards */}
      {analytics && (
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
          <div className="card stat" style={{ borderLeft: "4px solid #f97316" }}>
            <span>🔥 Daily Activity Streak</span>
            <strong style={{ fontSize: 26, color: "#ea580c" }}>
              {analytics.current_streak > 0 ? `${analytics.current_streak} Days` : "0 Days"}
            </strong>
            <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              Personal Best: {analytics.longest_streak || 0} days
            </span>
          </div>

          <div className="card stat" style={{ borderLeft: "4px solid var(--green-dark)" }}>
            <span>Average Condition Rating</span>
            <strong style={{ fontSize: 26, color: "var(--green-dark)" }}>
              {analytics.average_condition_rating > 0 ? `${analytics.average_condition_rating} / 10` : "—"}
            </strong>
            <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              Based on {analytics.total_logs} logged days
            </span>
          </div>

          <div className="card stat" style={{ borderLeft: "4px solid #2563eb" }}>
            <span>Routine Adherence Rate</span>
            <strong style={{ fontSize: 26, color: "#2563eb" }}>
              {analytics.routine_adherence_rate}%
            </strong>
            <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              Completion consistency
            </span>
          </div>

          <div className="card stat" style={{ borderLeft: "4px solid #7c3aed" }}>
            <span>Health Score Improvement</span>
            <strong style={{ fontSize: 26, color: analytics.score_improvement >= 0 ? "var(--green-dark)" : "var(--red)" }}>
              {analytics.score_improvement >= 0 ? `+${analytics.score_improvement}` : analytics.score_improvement} pts
            </strong>
            <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              Net assessment delta
            </span>
          </div>
        </div>
      )}

      {/* 🗓️ 30-Day Activity Calendar & Consistency Heatmap */}
      <div className="card" style={{ marginBottom: 32, background: "linear-gradient(135deg, #ffffff 0%, #f9fbf9 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h3 style={{ fontSize: 18, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              🗓️ 30-Day Skincare Activity Calendar & Heatmap
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>
              Every checkmark represents completed skincare routines or condition logging. Build your streak!
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 12 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 14, height: 14, background: "#10b981", borderRadius: 4, display: "inline-block" }} /> Completed (✅)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 14, height: 14, background: "#fbbf24", borderRadius: 4, display: "inline-block" }} /> Partial (🟡)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 14, height: 14, background: "#e5e7eb", borderRadius: 4, display: "inline-block" }} /> Missed / Rest
            </span>
          </div>
        </div>

        {/* Heatmap / Calendar Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(68px, 1fr))",
          gap: 10,
          marginTop: 14,
        }}>
          {calendarDays.map((d) => {
            const isSelected = selectedDay?.date === d.date;
            const bg = d.status === "completed" ? "#dcfce7" : d.status === "partial" ? "#fef3c7" : "#f3f4f6";
            const borderColor = d.is_today ? "var(--green-dark)" : isSelected ? "#7c3aed" : "transparent";
            const textColor = d.status === "completed" ? "#15803d" : d.status === "partial" ? "#b45309" : "#9ca3af";

            return (
              <div
                key={d.date}
                onClick={() => setSelectedDay(d)}
                style={{
                  background: bg,
                  border: `2px solid ${borderColor}`,
                  borderRadius: 10,
                  padding: "8px 6px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: d.is_today ? "0 2px 8px rgba(16,185,129,0.25)" : "none",
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  {d.weekday}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: d.is_today ? "var(--green-dark)" : "#1f2937", margin: "2px 0" }}>
                  {d.day}
                </div>
                <div style={{ fontSize: 12 }}>
                  {d.status === "completed" ? "✅" : d.status === "partial" ? "🟡" : "⚪"}
                </div>
                {d.is_today && (
                  <span style={{ fontSize: 9, fontWeight: 800, background: "var(--green-dark)", color: "white", padding: "1px 4px", borderRadius: 4, display: "inline-block", marginTop: 2 }}>
                    TODAY
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Day Info Popup */}
        {selectedDay && (
          <div style={{ marginTop: 16, padding: 14, background: "white", borderRadius: 10, border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ fontSize: 14 }}>📅 Activity Detail for {selectedDay.month} {selectedDay.day} ({selectedDay.weekday}):</strong>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                {selectedDay.status === "completed" ? (
                  <span>✅ Completed daily routine. Condition Rating: <strong>{selectedDay.condition_rating || "—"}/10</strong>{selectedDay.notes ? ` · Notes: "${selectedDay.notes}"` : ""}</span>
                ) : selectedDay.status === "partial" ? (
                  <span>🟡 Partially completed routine steps ({selectedDay.completion_rate}% adherence).</span>
                ) : (
                  <span>⚪ No activity logged on this date.</span>
                )}
              </div>
            </div>
            <button className="secondary" onClick={() => setSelectedDay(null)} style={{ fontSize: 12, padding: "4px 10px" }}>
              Close
            </button>
          </div>
        )}
      </div>

      {/* ✅ Daily Activity Check-In & Skin Log Form */}
      <div className="card tracker-card" style={{ marginBottom: 32, borderTop: "4px solid var(--green-dark)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <h3 style={{ fontSize: 18, margin: 0 }}>✅ Today's Daily Skincare Check-In</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>
              Put a tick mark for the activities you completed today. Saving updates your adherence score and keeps your streak alive!
            </p>
          </div>
          <span className="badge badge-user" style={{ fontSize: 13, fontWeight: 700 }}>
            Today: {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", weekday: "short" })}
          </span>
        </div>

        {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}
        {success && <div className="success" style={{ marginBottom: 12 }}>{success}</div>}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>
          {/* Daily Activity Checkboxes */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8, display: "block" }}>
              Daily Activity Checklist:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <label style={{
                display: "flex", alignItems: "center", gap: 10, padding: 12, borderRadius: 8,
                background: completedMorning ? "#dcfce7" : "#f9fafb", border: `1px solid ${completedMorning ? "#86efac" : "var(--border)"}`,
                cursor: "pointer", transition: "all .2s"
              }}>
                <input
                  type="checkbox"
                  checked={completedMorning}
                  onChange={(e) => setCompletedMorning(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: "pointer" }}
                />
                <span style={{ fontSize: 14, fontWeight: 600 }}>🌅 Morning Routine (Cleanse + Serum + SPF)</span>
              </label>

              <label style={{
                display: "flex", alignItems: "center", gap: 10, padding: 12, borderRadius: 8,
                background: completedEvening ? "#dcfce7" : "#f9fafb", border: `1px solid ${completedEvening ? "#86efac" : "var(--border)"}`,
                cursor: "pointer", transition: "all .2s"
              }}>
                <input
                  type="checkbox"
                  checked={completedEvening}
                  onChange={(e) => setCompletedEvening(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: "pointer" }}
                />
                <span style={{ fontSize: 14, fontWeight: 600 }}>🌙 Evening Routine (Double Cleanse + Night Care)</span>
              </label>

              <label style={{
                display: "flex", alignItems: "center", gap: 10, padding: 12, borderRadius: 8,
                background: completedHydration ? "#dcfce7" : "#f9fafb", border: `1px solid ${completedHydration ? "#86efac" : "var(--border)"}`,
                cursor: "pointer", transition: "all .2s"
              }}>
                <input
                  type="checkbox"
                  checked={completedHydration}
                  onChange={(e) => setCompletedHydration(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: "pointer" }}
                />
                <span style={{ fontSize: 14, fontWeight: 600 }}>💧 Water Intake Goal (8+ Glasses)</span>
              </label>
            </div>
          </div>

          {/* Skin Condition Rating Slider */}
          <label>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Rate Today's Overall Skin Condition (1 = Poor, 10 = Glowing & Clear):</span>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8 }}>
              <input
                type="range"
                min="1"
                max="10"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                style={{ flex: 1 }}
              />
              <strong style={{ fontSize: 22, color: "var(--green-dark)", minWidth: 60 }}>
                {rating} / 10
              </strong>
            </div>
          </label>

          {/* Notes */}
          <label>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Daily Skincare Observations & Notes:</span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Skin feels hydrated, no redness today, pores looking tighter after Niacinamide..."
              style={{ marginTop: 6 }}
            />
          </label>

          <button className="primary" disabled={saving} style={{ width: "fit-content", padding: "10px 24px" }}>
            {saving ? "Saving Check-In..." : "💾 Save Today's Check-In & Update Streak"}
          </button>
        </form>
      </div>

      {/* Historical Progress Log Timeline Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <p className="section-title" style={{ padding: "20px 22px 0" }}>📜 Historical Progress Log Timeline</p>

        {history.length === 0 ? (
          <div className="empty" style={{ padding: 40, textAlign: "center" }}>
            <h3>No progress entries yet</h3>
            <p>Complete your first daily check-in above to start building your timeline!</p>
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
                        {log.condition_rating || log.skin_condition_rating} / 10
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: "var(--green-dark)" }}>
                        {log.skin_health_score_at_log ? `${log.skin_health_score_at_log} / 100` : "—"}
                      </strong>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      {log.notes || "Check-in completed."}
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
