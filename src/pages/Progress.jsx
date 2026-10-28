import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import "../app.css";

function normalizeRoutineItems(items, section) {
  return (Array.isArray(items) ? items : []).map((item, index) => ({
    key: `${section}-${index}`,
    name: typeof item === "string" ? item : item?.name || `Step ${index + 1}`,
    ingredient: typeof item === "object" && item ? item.ingredient : null,
    reason: typeof item === "object" && item ? item.reason : null,
  }));
}

function Progress() {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [generatedRoutine, setGeneratedRoutine] = useState({
    morning: [],
    night: [],
    weekly: [],
  });
  const [routineSteps, setRoutineSteps] = useState({});

  const fetchProgress = async () => {
    try {
      const response = await fetch("http://localhost:8000/progress", {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();

      if (response.ok && Array.isArray(data.progress)) {
        const sorted = [...data.progress].sort(
          (a, b) =>
            new Date(a.created_at || 0).getTime() -
            new Date(b.created_at || 0).getTime()
        );
        setProgress(sorted);
      } else {
        setProgress([]);
        console.error("Progress API error:", data);
      }
    } catch (error) {
      console.error("Progress fetch error:", error);
      setProgress([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();

    try {
      const savedRoutine = localStorage.getItem("skinsenseGeneratedRoutine");
      if (savedRoutine) {
        const parsed = JSON.parse(savedRoutine);
        setGeneratedRoutine({
          morning: Array.isArray(parsed.morning) ? parsed.morning : [],
          night: Array.isArray(parsed.night) ? parsed.night : [],
          weekly: Array.isArray(parsed.weekly) ? parsed.weekly : [],
        });
      }
    } catch (error) {
      console.error("Could not load generated routine:", error);
    }
  }, []);

  const morningItems = normalizeRoutineItems(generatedRoutine.morning, "morning");
  const nightItems = normalizeRoutineItems(generatedRoutine.night, "night");
  const weeklyItems = normalizeRoutineItems(generatedRoutine.weekly, "weekly");
  const dailyRoutineItems = [...morningItems, ...nightItems];
  const completedSteps = dailyRoutineItems.filter(
    (item) => Boolean(routineSteps[item.key])
  ).length;
  const totalSteps = dailyRoutineItems.length;
  const adherence = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const formatDate = (date) => {
    if (!date) return "Unknown date";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "Unknown date";
    return parsed.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const latest = progress.length ? progress[progress.length - 1] : null;
  const previous = progress.length > 1 ? progress[progress.length - 2] : null;
  const scoreChange =
    latest?.skin_score != null && previous?.skin_score != null
      ? Number(latest.skin_score) - Number(previous.skin_score)
      : null;

  const chartData = progress.map((entry, index) => ({
    date: formatDate(entry.created_at),
    entry: index + 1,
    skinScore:
      entry.skin_score != null && Number.isFinite(Number(entry.skin_score))
        ? Number(entry.skin_score)
        : null,
    adherence:
      entry.routine_adherence != null && Number.isFinite(Number(entry.routine_adherence))
        ? Number(entry.routine_adherence)
        : null,
  }));

  const renderRoutineStep = (item) => (
    <button
      key={item.key}
      type="button"
      className={routineSteps[item.key] ? "routine-step completed" : "routine-step"}
      onClick={() =>
        setRoutineSteps((previousSteps) => ({
          ...previousSteps,
          [item.key]: !previousSteps[item.key],
        }))
      }
      aria-pressed={Boolean(routineSteps[item.key])}
    >
      <span className="routine-checkbox">{routineSteps[item.key] ? "✓" : ""}</span>
      <span>
        <strong>{item.name}</strong>
        {item.ingredient && <small className="progress-routine-detail">Ingredient: {item.ingredient}</small>}
        {item.reason && <small className="progress-routine-detail">{item.reason}</small>}
      </span>
    </button>
  );

  const handleSave = async (event) => {
    event.preventDefault();

    if (totalSteps === 0) {
      alert("No generated routine found. Open your Routine page first, then come back here.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("http://localhost:8000/progress", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routine_adherence: adherence,
          notes: notes.trim() || null,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Could not save progress.");
        return;
      }

      setNotes("");
      setRoutineSteps({});
      await fetchProgress();
      alert("Progress saved successfully ✨");
    } catch (error) {
      console.error("Save progress error:", error);
      alert("Something went wrong while saving progress.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header"><h1>Loading your progress...</h1></div>
      </div>
    );
  }

  return (
    <div className="page-container progress-page">
      <div className="page-header">
        <p className="page-eyebrow">SKIN PROGRESS</p>
        <h1>Track Your Skin Journey 📈</h1>
        <p>Monitor your skin health score, routine adherence, and improvement over time.</p>
      </div>

      <div className="progress-overview">
        <div className="progress-score-card">
          <span>CURRENT SKIN SCORE</span>
          <strong>{latest?.skin_score ?? "--"}</strong>
          <small>/100</small>
          {scoreChange !== null && (
            <p className="score-change">
              {scoreChange > 0
                ? `↑ ${scoreChange} points since last entry`
                : scoreChange < 0
                ? `↓ ${Math.abs(scoreChange)} points since last entry`
                : "No change since last entry"}
            </p>
          )}
        </div>
        <div className="progress-info-card">
          <h2>Your Progress</h2>
          <p>Total entries: <strong>{progress.length}</strong></p>
          {latest && <p>Last updated: <strong>{formatDate(latest.created_at)}</strong></p>}
        </div>
      </div>

      <section className="progress-charts-section">
        <div className="section-heading">
          <h2>Your Progress Analytics 📊</h2>
          <p>Graphs are based on your saved progress entries.</p>
        </div>

        {progress.length === 0 ? (
          <div className="empty-state">
            <h2>Your charts will appear here</h2>
            <p>Save your first progress entry to start tracking your journey.</p>
          </div>
        ) : (
          <div className="progress-chart-grid">
            <div className="progress-chart-card">
              <h3>Skin Health Score</h3>
              <p className="chart-description">How your recorded skin score changes over time.</p>
              {chartData.some((item) => item.skinScore !== null) ? (
                <div className="progress-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 12, right: 12, left: -12, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={20} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="skinScore" name="Skin score" stroke="#8b5e83" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="chart-empty">No skin scores are available in your saved entries yet.</p>}
            </div>

            <div className="progress-chart-card">
              <h3>Routine Adherence</h3>
              <p className="chart-description">The percentage of routine completion recorded each time.</p>
              {chartData.some((item) => item.adherence !== null) ? (
                <div className="progress-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 12, right: 12, left: -12, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={20} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                      <Tooltip formatter={(value) => [`${value}%`, "Adherence"]} />
                      <Bar dataKey="adherence" name="Routine adherence" fill="#78a995" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="chart-empty">No routine adherence records are available yet.</p>}
            </div>
          </div>
        )}
      </section>

      <section className="progress-form-section">
        <div className="section-heading">
          <h2>Today's Personalized Routine ✨</h2>
          <p>Check off the exact steps from your generated routine. Daily adherence counts morning and night steps.</p>
        </div>

        {dailyRoutineItems.length === 0 ? (
          <div className="empty-state">
            <h2>No personalized routine found</h2>
            <p>Open your generated Routine page first, then return here. Your routine will appear as a checklist.</p>
          </div>
        ) : (
          <div className="routine-tracker personalized-routine-tracker">
            {morningItems.length > 0 && (
              <section className="routine-section progress-routine-group">
                <div className="routine-title"><span>☀️</span><div><h2>Morning Routine</h2><p>Check the steps you completed today.</p></div></div>
                <div className="routine-list">{morningItems.map(renderRoutineStep)}</div>
              </section>
            )}
            {nightItems.length > 0 && (
              <section className="routine-section progress-routine-group">
                <div className="routine-title"><span>🌙</span><div><h2>Night Routine</h2><p>Check the steps you completed today.</p></div></div>
                <div className="routine-list">{nightItems.map(renderRoutineStep)}</div>
              </section>
            )}
            {weeklyItems.length > 0 && (
              <section className="routine-section progress-routine-group">
                <div className="routine-title"><span>📅</span><div><h2>Weekly Care</h2><p>Track these separately; they do not count toward daily adherence.</p></div></div>
                <div className="routine-list">{weeklyItems.map(renderRoutineStep)}</div>
              </section>
            )}
          </div>
        )}

        <div className="adherence-summary">
          <div><span>Today's Routine Adherence</span><strong>{adherence}%</strong></div>
          <div className="adherence-bar" role="progressbar" aria-valuenow={adherence} aria-valuemin={0} aria-valuemax={100}>
            <div className="adherence-bar-fill" style={{ width: `${adherence}%` }} />
          </div>
          <p>{completedSteps} of {totalSteps} morning/night steps completed</p>
        </div>

        <form className="progress-form" onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="notes">Skin Progress Notes</label>
            <textarea id="notes" rows="4" placeholder="Example: My skin feels less oily today..." value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? "Saving..." : "Save Today's Progress ✨"}
          </button>
        </form>
      </section>

      <section className="progress-history-section">
        <div className="section-heading"><h2>Progress History</h2><p>Your recorded skin health journey.</p></div>
        {progress.length === 0 ? (
          <div className="empty-state"><h2>No progress entries yet</h2><p>Complete today's routine and save your first progress entry.</p></div>
        ) : (
          <div className="progress-history">
            {[...progress].reverse().map((entry, index) => (
              <div className="progress-entry-card" key={entry.id ?? `${entry.created_at}-${index}`}>
                <div className="progress-entry-top">
                  <div><span>{formatDate(entry.created_at)}</span><h3>Skin Score: {entry.skin_score ?? "--"}/100</h3></div>
                  {entry.routine_adherence != null && <div className="adherence-badge">{entry.routine_adherence}% routine adherence</div>}
                </div>
                {entry.notes && <div className="progress-notes"><strong>Notes</strong><p>{entry.notes}</p></div>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="progress-ai-card">
        <div>
          <p className="page-eyebrow">INTELLIGENT PROGRESS ANALYSIS</p>
          <h2>AI-Powered Progress Insights</h2>
          <p>Your charts visualize saved skin scores and routine adherence. Personalized AI insights can be added once the analysis logic is connected to historical data.</p>
        </div>
        <span>AIML MODULE</span>
      </section>
    </div>
  );
}

export default Progress;
