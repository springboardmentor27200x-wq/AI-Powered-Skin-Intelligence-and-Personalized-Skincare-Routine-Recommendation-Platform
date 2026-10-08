import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getDailyCheckins, saveDailyCheckin } from "../services/api";

export default function DailyAnalytics() {
  const stored = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = stored.user_id || stored.user?.id || stored.id;
  const [data, setData] = useState({ daily: [], weekly_summary: [] });
  const [form, setForm] = useState({ routine_completed: false, water_intake_liters: 2, sleep_hours: 8, skin_condition_rating: 70 });
  const [message, setMessage] = useState("");
  const refresh = async () => { if (userId) setData(await getDailyCheckins(userId)); };
  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    getDailyCheckins(userId).then((value) => { if (active) setData(value); }).catch((err) => { if (active) setMessage(err.message); });
    return () => { active = false; };
  }, [userId]);
  const submit = async (event) => { event.preventDefault(); setMessage(""); try { const now = new Date(); const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; await saveDailyCheckin(userId, { ...form, date: today }); await refresh(); setMessage("Today's check-in saved. Your weighted score has been updated."); } catch (err) { setMessage(err.message); } };
  return <section style={{ margin: "24px 0" }}><h2>Daily skin check-in & trends</h2><p>Daily score: skin condition 35%, lifestyle 20%, sleep 15%, routine consistency 20%, hydration 10%.</p>
    <form onSubmit={submit} className="dashboard-info-card" style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "end" }}>
      <label><input type="checkbox" checked={form.routine_completed} onChange={(e) => setForm({ ...form, routine_completed: e.target.checked })} /> Routine completed today</label>
      <label>Water (litres)<input type="number" min="0" max="20" step="0.1" value={form.water_intake_liters} onChange={(e) => setForm({ ...form, water_intake_liters: Number(e.target.value) })} /></label>
      <label>Sleep (hours)<input type="number" min="0" max="24" step="0.1" value={form.sleep_hours} onChange={(e) => setForm({ ...form, sleep_hours: Number(e.target.value) })} /></label>
      <label>Skin condition (0–100)<input type="number" min="0" max="100" value={form.skin_condition_rating} onChange={(e) => setForm({ ...form, skin_condition_rating: Number(e.target.value) })} /></label><button className="card-link">Save check-in</button>
    </form>{message && <p role="status">{message}</p>}
    <div className="dashboard-info-card" style={{ marginTop: 16, height: 300 }}><h3>Daily Skin Health Score</h3><ResponsiveContainer width="100%" height="85%"><LineChart data={data.daily}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date"/><YAxis domain={[0, 100]}/><Tooltip/><Line dataKey="skin_health_score" stroke="#267663"/></LineChart></ResponsiveContainer></div>
    <div className="dashboard-info-card" style={{ marginTop: 16, height: 280 }}><h3>Weekly routine completion</h3><ResponsiveContainer width="100%" height="85%"><BarChart data={data.weekly_summary}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="week_start"/><YAxis domain={[0, 100]}/><Tooltip/><Bar dataKey="routine_completion_rate" fill="#61a58b"/></BarChart></ResponsiveContainer></div>
    <div className="dashboard-content-grid">{data.weekly_summary.map((week) => <article className="dashboard-info-card" key={week.week_start}><h3>Week of {week.week_start}</h3><p>{week.days_recorded} check-in days</p><p>Average score: {week.average_skin_health_score}</p><p>Routine completed: {week.routine_completion_rate}%</p><p>Water: {week.average_water_intake_liters} L · Sleep: {week.average_sleep_hours} h</p></article>)}</div>
  </section>;
}
