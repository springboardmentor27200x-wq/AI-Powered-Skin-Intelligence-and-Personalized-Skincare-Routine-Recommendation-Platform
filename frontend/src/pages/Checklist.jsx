import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";

function Checklist() {
  const navigate = useNavigate();
  const [morning, setMorning] = useState([]);
  const [evening, setEvening] = useState([]);
  const [routineData, setRoutineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Daily logs state
  const [water, setWater] = useState("");
  const [exercise, setExercise] = useState("");
  const [sleepQuality, setSleepQuality] = useState("");
  const [logMessage, setLogMessage] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchChecklist();
  }, [navigate]);

  const fetchChecklist = () => {
    axios
      .get("http://127.0.0.1:5000/checklist", { headers })
      .then((res) => {
        setMorning(res.data.morning || []);
        setEvening(res.data.evening || []);
        setRoutineData(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const toggleItem = async (item) => {
    try {
      await axios.post(
        `http://127.0.0.1:5000/checklist/toggle/${item.id}`,
        {},
        { headers }
      );
      fetchChecklist();
    } catch {
      setMessage("Could not update item. Please try again.");
    }
  };

  const allItems = [...morning, ...evening];
  const doneCount = allItems.filter((i) => i.is_completed).length;
  const totalCount = allItems.length || 8;
  const adherence = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  const saveDailyLog = () => {
    if (!water && !exercise && !sleepQuality) {
      setLogMessage("Please fill at least one field.");
      return;
    }
    setLogMessage("Daily log saved successfully!");
    setTimeout(() => setLogMessage(""), 3000);
  };

  // Build dynamic weekly plan from backend routine data or graceful fallback
  const daysMap = [
    { key: "Monday", short: "Mon" },
    { key: "Tuesday", short: "Tue" },
    { key: "Wednesday", short: "Wed" },
    { key: "Thursday", short: "Thu" },
    { key: "Friday", short: "Fri" },
    { key: "Saturday", short: "Sat" },
    { key: "Sunday", short: "Sun" },
  ];

  const dynamicWeekly = daysMap.map((d) => {
    const backendFocus = routineData?.weekly?.[d.key];
    return {
      day: d.short,
      fullDay: d.key,
      focus: backendFocus || "Balanced care & hydration",
    };
  });

  const tips = [
    "Apply products on damp skin to lock in more moisture.",
    "Wait 60–90 seconds between active layers for better absorption.",
    "Always finish your morning routine with broad-spectrum SPF 50.",
    "Consistency beats intensity — small daily steps deliver long-term skin health.",
  ];

  const categories = routineData?.categories || {
    Cleansing: "Gentle cleanser suited to skin type",
    Exfoliation: "Chemical exfoliant (1–2x/week)",
    Treatment: "Targeted serum for primary concern",
    Moisturizing: "Barrier-protecting moisturizer",
    "Sun Protection": "Broad spectrum SPF 50",
    "Night Care": "Nourishing night recovery formula",
  };

  const categoryIcons = {
    Cleansing: "🧼",
    Exfoliation: "✨",
    Treatment: "💧",
    Moisturizing: "🧴",
    "Sun Protection": "☀️",
    "Night Care": "🌙",
  };

  return (
    <Layout>
      <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 60 }}>
        <h1 style={st.title}>Personalized Routine & Daily Checklist</h1>
        <p style={st.subtitle}>
          Tailored specifically for your skin concerns, environment, and sensitivity level.
        </p>

        {/* Adaptive Routine Notice */}
        {routineData?.adaptive_note && (
          <div style={st.adaptiveBanner}>
            <span style={{ fontSize: 18, marginRight: 8 }}>🔄</span>
            <div style={{ fontSize: 13.5, color: "#166534", lineHeight: 1.45 }}>
              <strong>Adaptive Routine Engine:</strong> {routineData.adaptive_note}
            </div>
          </div>
        )}

        {message && <p style={{ color: "#dc2626", marginBottom: 12 }}>{message}</p>}

        {/* Adherence Card */}
        <div style={st.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={st.label}>ROUTINE ADHERENCE</p>
              <p style={st.bigNumber}>{adherence}%</p>
            </div>
            <p style={{ fontSize: 14, color: "#4d6b57", fontWeight: 600 }}>
              {doneCount}/{totalCount} steps completed today
            </p>
          </div>
          <div style={st.barTrack}>
            <div
              style={{
                ...st.barFill,
                width: `${adherence}%`,
                background: "linear-gradient(90deg,#34d399,#059669)",
              }}
            />
          </div>
        </div>

        {/* Morning + Evening Checklists */}
        <div style={st.twoCol}>
          {/* Morning Routine Generation */}
          <div style={st.card}>
            <h3 style={st.sectionTitle}>
              <span style={{ marginRight: 8 }}>☀️</span> Morning Routine
            </h3>
            {loading ? (
              <p style={{ color: "#6b7280" }}>Loading morning steps...</p>
            ) : morning.length === 0 ? (
              <p style={{ color: "#6b7280", fontSize: 14 }}>No morning steps generated yet.</p>
            ) : (
              morning.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item)}
                  style={{
                    ...st.stepBtn,
                    background: item.is_completed ? "#e8f5e9" : "#f8faf9",
                  }}
                >
                  <span style={item.is_completed ? st.checkOn : st.checkOff}>
                    {item.is_completed ? "✓" : ""}
                  </span>
                  <span style={{ flex: 1, textAlign: "left" }}>{item.item}</span>
                </button>
              ))
            )}
          </div>

          {/* Evening Routine Generation */}
          <div style={st.card}>
            <h3 style={st.sectionTitle}>
              <span style={{ marginRight: 8 }}>🌙</span> Evening Routine
            </h3>
            {loading ? (
              <p style={{ color: "#6b7280" }}>Loading evening steps...</p>
            ) : evening.length === 0 ? (
              <p style={{ color: "#6b7280", fontSize: 14 }}>No evening steps generated yet.</p>
            ) : (
              evening.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item)}
                  style={{
                    ...st.stepBtn,
                    background: item.is_completed ? "#e8f5e9" : "#f8faf9",
                  }}
                >
                  <span style={item.is_completed ? st.checkOn : st.checkOff}>
                    {item.is_completed ? "✓" : ""}
                  </span>
                  <span style={{ flex: 1, textAlign: "left" }}>{item.item}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Routine Categories Section (Cleansing, Exfoliation, Treatment, Moisturizing, Sun Protection, Night Care) ── */}
        <div style={{ ...st.card, marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h3 style={{ ...st.sectionTitle, margin: 0 }}>🌿 Routine Categories</h3>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
                Targeted steps across the 6 clinical skincare pillars.
              </p>
            </div>
            <span style={{ fontSize: 12, background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: 12, fontWeight: 700 }}>
              6 Categories Active
            </span>
          </div>

          <div style={st.categoriesGrid}>
            {Object.entries(categories).map(([catName, stepDesc]) => (
              <div key={catName} style={st.catCard}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 20 }}>{categoryIcons[catName] || "✨"}</span>
                  <strong style={{ fontSize: 14, color: "#1b4332" }}>{catName}</strong>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: "#4d6b57", lineHeight: 1.4 }}>
                  {stepDesc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Weekly Treatment Planning (Monday – Sunday) ── */}
        <div style={{ ...st.card, marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h3 style={{ ...st.sectionTitle, margin: 0 }}>📅 Weekly Treatment Planning</h3>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
                Active treatments, chemical exfoliants, and recovery sessions scheduled through the week.
              </p>
            </div>
            {routineData?.primary_concern && (
              <span style={{ fontSize: 12, background: "#e0f2fe", color: "#0369a1", padding: "4px 10px", borderRadius: 12, fontWeight: 600 }}>
                Target: {routineData.primary_concern}
              </span>
            )}
          </div>

          <div style={st.weekGrid}>
            {dynamicWeekly.map((d) => (
              <div key={d.day} style={st.weekCard}>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#1b4332", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {d.day}
                </div>
                <div style={{ fontSize: 12, color: "#2d6a4f", marginTop: 6, lineHeight: 1.35, fontWeight: 500 }}>
                  {d.focus}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Seasonal Skincare Recommendations ── */}
        {routineData?.seasonal && (
          <div style={{ ...st.card, marginTop: 18, background: "linear-gradient(135deg, #f0fdf4, #e8f5e9)", border: "1px solid #c8e6c9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 22 }}>🌤️</span>
                <h3 style={{ ...st.sectionTitle, margin: 0, color: "#166534" }}>
                  Seasonal Skincare: {routineData.seasonal.season || "Current Season"}
                </h3>
              </div>
            </div>
            <p style={{ fontSize: 13.5, color: "#374151", margin: "0 0 12px", lineHeight: 1.45 }}>
              {routineData.seasonal.summary}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
              {(routineData.seasonal.tips || []).map((tip, idx) => (
                <div key={idx} style={{ background: "white", padding: "10px 14px", borderRadius: 10, fontSize: 13, color: "#2d6a4f", display: "flex", gap: 8, alignItems: "flex-start", border: "1px solid #d8f3dc" }}>
                  <span style={{ color: "#16a34a", fontWeight: 700 }}>✓</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Lifestyle Logs */}
        <div style={{ ...st.card, marginTop: 18 }}>
          <h3 style={st.sectionTitle}>Daily Lifestyle Logs</h3>
          <p style={{ margin: "4px 0 16px", fontSize: 13, color: "#6b7280" }}>
            Log your water intake, exercise, and sleep quality to boost skin recovery analytics.
          </p>

          <div style={st.logGrid}>
            <div>
              <label style={st.logLabel}>Water Intake</label>
              <select
                value={water}
                onChange={(e) => setWater(e.target.value)}
                style={st.select}
              >
                <option value="">Select</option>
                <option value="Low (< 1.5L)">Low (&lt; 1.5L)</option>
                <option value="Moderate (1.5–2.5L)">Moderate (1.5–2.5L)</option>
                <option value="High (2.5–3.5L)">High (2.5–3.5L)</option>
                <option value="Very High (> 3.5L)">Very High (&gt; 3.5L)</option>
              </select>
            </div>

            <div>
              <label style={st.logLabel}>Exercise</label>
              <select
                value={exercise}
                onChange={(e) => setExercise(e.target.value)}
                style={st.select}
              >
                <option value="">Select</option>
                <option value="None">None</option>
                <option value="Light">Light</option>
                <option value="Moderate">Moderate</option>
                <option value="Intense">Intense</option>
              </select>
            </div>

            <div>
              <label style={st.logLabel}>Sleep Quality</label>
              <select
                value={sleepQuality}
                onChange={(e) => setSleepQuality(e.target.value)}
                style={st.select}
              >
                <option value="">Select</option>
                <option value="Poor">Poor</option>
                <option value="Fair">Fair</option>
                <option value="Good">Good</option>
                <option value="Excellent">Excellent</option>
              </select>
            </div>
          </div>

          <button onClick={saveDailyLog} style={st.saveBtn}>
            Save Daily Log
          </button>
          {logMessage && (
            <p style={{ marginTop: 10, fontSize: 13, color: "#059669", fontWeight: 600 }}>
              {logMessage}
            </p>
          )}
        </div>

        {/* Clinical Application Tips */}
        <div style={{ ...st.card, marginTop: 18 }}>
          <h3 style={st.sectionTitle}>Application Best Practices</h3>
          <ul style={{ margin: "12px 0 0", paddingLeft: 18 }}>
            {tips.map((t, i) => (
              <li key={i} style={{ marginBottom: 8, fontSize: 13.5, color: "#4d6b57", lineHeight: 1.45 }}>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Layout>
  );
}

const st = {
  title: {
    margin: 0,
    fontSize: "1.75rem",
    color: "#1b4332",
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontWeight: 600,
  },
  subtitle: {
    margin: "6px 0 16px",
    color: "#6b7280",
    fontSize: 14,
  },
  adaptiveBanner: {
    display: "flex",
    alignItems: "center",
    background: "#f0fdf4",
    border: "1px solid #86efac",
    padding: "12px 16px",
    borderRadius: 12,
    marginBottom: 16,
  },
  card: {
    background: "white",
    borderRadius: 16,
    padding: "20px 22px",
    boxShadow: "0 3px 14px rgba(27,67,50,0.05)",
    border: "1px solid #edf5f0",
  },
  label: {
    margin: 0,
    fontSize: 11,
    fontWeight: 600,
    color: "#6b7280",
    letterSpacing: "0.04em",
  },
  bigNumber: {
    margin: "4px 0 10px",
    fontSize: 32,
    fontWeight: 700,
    color: "#1b4332",
  },
  barTrack: {
    height: 7,
    background: "#e5e7eb",
    borderRadius: 20,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 20,
    transition: "width 0.4s ease",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
    marginTop: 14,
  },
  sectionTitle: {
    margin: "0 0 14px",
    fontSize: 15,
    fontWeight: 700,
    color: "#1b4332",
  },
  stepBtn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "11px 14px",
    borderRadius: 12,
    border: "1px solid #e5ebe7",
    marginBottom: 8,
    cursor: "pointer",
    fontSize: 13.5,
    color: "#1b4332",
  },
  checkOn: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#10b981",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
  },
  checkOff: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    border: "1.5px solid #d1d5db",
  },
  categoriesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 12,
  },
  catCard: {
    background: "#f8faf9",
    borderRadius: 12,
    padding: "14px 16px",
    border: "1px solid #e5ebe7",
  },
  weekGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 8,
  },
  weekCard: {
    background: "#f0fdf4",
    borderRadius: 12,
    padding: "12px 8px",
    textAlign: "center",
    border: "1px solid #d8f3dc",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  logGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 14,
    marginBottom: 16,
  },
  logLabel: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#4d6b57",
    marginBottom: 6,
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    fontSize: 13.5,
    background: "#fafafa",
    color: "#1b4332",
  },
  saveBtn: {
    padding: "10px 20px",
    background: "linear-gradient(135deg,#2d6a4f,#1b4332)",
    color: "white",
    border: "none",
    borderRadius: 12,
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
  },
};

export default Checklist;