import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";

function Progress() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Visual Photo Check-in State
  const [beforePhoto, setBeforePhoto] = useState(() => localStorage.getItem("skin_before_photo") || null);
  const [afterPhoto, setAfterPhoto] = useState(() => localStorage.getItem("skin_after_photo") || null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get("http://127.0.0.1:5000/progress", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.response?.status === 401 || err.response?.status === 422) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }
        setError(err.response?.data?.error || "Failed to load progress");
        setLoading(false);
      });
  }, [navigate]);

  const handlePhotoUpload = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      if (type === "before") {
        setBeforePhoto(dataUrl);
        localStorage.setItem("skin_before_photo", dataUrl);
      } else {
        setAfterPhoto(dataUrl);
        localStorage.setItem("skin_after_photo", dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearPhotos = () => {
    setBeforePhoto(null);
    setAfterPhoto(null);
    localStorage.removeItem("skin_before_photo");
    localStorage.removeItem("skin_after_photo");
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 16, color: "#6b7280" }}>Loading progress data & analytics...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px" }}>
          <div style={card}>
            <h2 style={{ color: "#c62828", marginTop: 0 }}>Progress Unavailable</h2>
            <p style={{ color: "#6b7280" }}>{error}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
              <Link to="/dashboard" style={ghostBtn}>← Back to Dashboard</Link>
              <Link to="/assessment" style={greenBtn}>Run Skin Analysis</Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const latest = data.latest_score;
  const first = data.first_score;
  const change = data.change || 0;
  const changeText = change > 0 ? `+${change}` : `${change}`;
  const changeColor = change > 0 ? "#2d6a4f" : change < 0 ? "#c62828" : "#6b7280";

  const history = data.history || [];
  const maxScore = Math.max(...history.map((h) => h.score || 0), 100);

  const insights = data.insights || {};
  const trend = insights.trend || "insufficient_data";
  const trendLabel = insights.trend_label || "Evaluating Trend";
  const insightText =
    insights.insight ||
    "Complete more assessments and routine checklists to unlock deeper personalized insights.";
  const prediction = insights.prediction;
  const recommendations = insights.recommendations || [];
  const consistencyStatus = insights.consistency_status || "unknown";
  const comparison = data.comparison || {};

  const trendStyles = {
    improving: { bg: "#f0fdf4", border: "#bbf7d0", color: "#166534", icon: "📈" },
    declining: { bg: "#fef2f2", border: "#fecaca", color: "#991b1b", icon: "📉" },
    stable: { bg: "#fffbeb", border: "#fde68a", color: "#92400e", icon: "➡️" },
    insufficient_data: { bg: "#f8fafc", border: "#e2e8f0", color: "#475569", icon: "ℹ️" },
  };
  const tStyle = trendStyles[trend] || trendStyles.insufficient_data;

  const consistencyLabel = {
    excellent: "Excellent",
    moderate: "Moderate",
    low: "Low",
    missing: "No data today",
    unknown: "Tracking",
  }[consistencyStatus] || "Tracking";

  return (
    <Layout>
      <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 60 }}>
        {/* Top Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "2rem",
                color: "#1b4332",
                fontFamily: "Georgia, serif",
                fontWeight: 700,
              }}
            >
              Progress & Analytics
            </h1>
            <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: 14 }}>
              Longitudinal skin progress monitoring, adherence tracking, improvement analysis, before/after comparison, and trend forecasts.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => navigate("/reports")}
              style={{
                background: "#1b4332",
                color: "white",
                border: "none",
                padding: "9px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>📄</span> Export PDF Report
            </button>
          </div>
        </div>

        {/* 1. CORE METRICS OVERVIEW (Progress Monitoring & Improvement Analysis) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div style={card}>
            <p style={label}>Latest Health Score</p>
            <h2 style={{ margin: "4px 0 0", fontSize: "2.3rem", color: "#1b4332", fontWeight: 700 }}>
              {latest != null ? `${latest}/100` : "—"}
            </h2>
            <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: 12 }}>
              Current composite skin barrier index
            </p>
          </div>

          <div style={card}>
            <p style={label}>Improvement Analysis</p>
            <h2 style={{ margin: "4px 0 0", fontSize: "2.3rem", color: changeColor, fontWeight: 700 }}>
              {changeText}
            </h2>
            <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: 12 }}>
              Net points vs baseline {first != null ? `(${first})` : ""}
            </p>
          </div>

          <div style={card}>
            <p style={label}>Routine Adherence Tracking</p>
            <h2 style={{ margin: "4px 0 0", fontSize: "2.3rem", color: "#2d6a4f", fontWeight: 700 }}>
              {data.today_adherence}%
            </h2>
            <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: 12 }}>
              {data.today_completed}/{data.today_total} steps completed today
            </p>
          </div>
        </div>

        {/* 2. TREND ANALYSIS (Direction & Consistency Insights) */}
        <div
          style={{
            ...card,
            background: tStyle.bg,
            border: `1px solid ${tStyle.border}`,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <h3 style={{ ...h3, margin: 0, color: tStyle.color, display: "flex", alignItems: "center", gap: 8 }}>
              <span>{tStyle.icon}</span> Trend Analysis — {trendLabel}
            </h3>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: tStyle.color,
                background: "rgba(255,255,255,0.85)",
                padding: "4px 12px",
                borderRadius: 20,
                border: `1px solid ${tStyle.border}`,
              }}
            >
              Adherence Consistency: {consistencyLabel}
            </span>
          </div>
          <p style={{ margin: 0, color: tStyle.color, fontSize: 14, lineHeight: 1.55 }}>
            {insightText}
          </p>
        </div>

        {/* 3. BEFORE / AFTER COMPARISONS (Clinical & Visual) */}
        <div style={{ ...card, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>⚖️</span>
              <div>
                <h3 style={{ ...h3, margin: 0, color: "#1b4332" }}>Before & After Clinical Comparison</h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                  Longitudinal comparison between your Day 1 baseline and your current skin condition.
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "5px 14px",
                borderRadius: 20,
                background: change >= 0 ? "#dcfce7" : "#fee2e2",
                color: change >= 0 ? "#166534" : "#991b1b",
              }}
            >
              {change >= 0 ? `+${change} pts Gain (${comparison.percentage_change || 0}%)` : `${change} pts Delta`}
            </span>
          </div>

          {/* Side-by-Side Metric Comparison */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
              marginBottom: 20,
            }}
          >
            {/* BEFORE Card */}
            <div
              style={{
                background: "#f8faf9",
                borderRadius: 14,
                padding: "18px 20px",
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  BEFORE (Day 1 Baseline)
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>
                  {comparison.baseline_date || (history[0]?.date ?? "Initial")}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: "#374151" }}>
                  {first != null ? first : "—"}
                </span>
                <span style={{ fontSize: 14, color: "#6b7280" }}>/ 100</span>
              </div>
              <div style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.45 }}>
                • Initial Skin Health Assessment<br />
                • Baseline barrier recovery stage<br />
                • Starting habit compliance
              </div>
            </div>

            {/* AFTER Card */}
            <div
              style={{
                background: "#f0fdf4",
                borderRadius: 14,
                padding: "18px 20px",
                border: "1px solid #bbf7d0",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  AFTER (Current State)
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#166534" }}>
                  {comparison.current_date || "Today"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: "#1b4332" }}>
                  {latest != null ? latest : "—"}
                </span>
                <span style={{ fontSize: 14, color: "#2d6a4f" }}>/ 100</span>
              </div>
              <div style={{ fontSize: 13, color: "#166534", lineHeight: 1.45 }}>
                • Active composite barrier integrity<br />
                • Routine Adherence: {data.today_adherence}%<br />
                • Overall status: {comparison.status || "Progressing well"}
              </div>
            </div>
          </div>

          {/* Visual Photo Upload & Check-in */}
          <div style={{ borderTop: "1px solid #edf2ef", paddingTop: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1b4332" }}>
                  Visual Photo Check-in (Before vs. After)
                </h4>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                  Upload photos taken in consistent morning lighting to visually track redness, texture, and clarity.
                </p>
              </div>

              {(beforePhoto || afterPhoto) && (
                <button
                  onClick={handleClearPhotos}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#991b1b",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Clear Photos
                </button>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              {/* Before Photo Box */}
              <div
                style={{
                  border: "1.5px dashed #cbd5e1",
                  borderRadius: 12,
                  padding: 14,
                  textAlign: "center",
                  background: "#f8faf9",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
                  DAY 1 — BASELINE PHOTO
                </div>
                {beforePhoto ? (
                  <div style={{ position: "relative" }}>
                    <img
                      src={beforePhoto}
                      alt="Before Skin"
                      style={{
                        width: "100%",
                        height: 200,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                      }}
                    />
                    <label
                      style={{
                        display: "inline-block",
                        marginTop: 8,
                        fontSize: 12,
                        color: "#2d6a4f",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Change Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, "before")}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>
                ) : (
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 180,
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: 32, marginBottom: 6 }}>📷</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1b4332" }}>
                      Upload Day 1 Baseline Photo
                    </span>
                    <span style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                      PNG, JPG up to 10MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, "before")}
                      style={{ display: "none" }}
                    />
                  </label>
                )}
              </div>

              {/* After Photo Box */}
              <div
                style={{
                  border: "1.5px dashed #86efac",
                  borderRadius: 12,
                  padding: 14,
                  textAlign: "center",
                  background: "#f0fdf4",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginBottom: 8 }}>
                  CURRENT — FOLLOW-UP PHOTO
                </div>
                {afterPhoto ? (
                  <div style={{ position: "relative" }}>
                    <img
                      src={afterPhoto}
                      alt="After Skin"
                      style={{
                        width: "100%",
                        height: 200,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #bbf7d0",
                      }}
                    />
                    <label
                      style={{
                        display: "inline-block",
                        marginTop: 8,
                        fontSize: 12,
                        color: "#166534",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Update Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, "after")}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>
                ) : (
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 180,
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: 32, marginBottom: 6 }}>📸</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#166534" }}>
                      Upload Today's Check-in Photo
                    </span>
                    <span style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                      PNG, JPG up to 10MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, "after")}
                      style={{ display: "none" }}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. PREDICTION FORECAST & ADAPTIVE TIPS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: prediction ? "1fr 1.3fr" : "1fr",
            gap: 18,
            marginBottom: 20,
          }}
        >
          {prediction && (
            <div style={{ ...card, background: "#eff6ff", border: "1px solid #bfdbfe" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>🔮</span>
                <h3 style={{ ...h3, margin: 0, color: "#1e40af" }}>ML Forecast Model</h3>
              </div>
              <p style={{ margin: "0 0 6px", fontSize: 32, fontWeight: 800, color: "#1e3a8a" }}>
                ~{prediction.target_score}
              </p>
              <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#2563eb" }}>
                Expected in {prediction.timeframe}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.45 }}>
                {prediction.note}
              </p>
            </div>
          )}

          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>💡</span>
              <h3 style={{ ...h3, margin: 0, color: "#1b4332" }}>Adaptive Skin Health Recommendations</h3>
            </div>
            {recommendations.length === 0 ? (
              <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>
                Keep completing your daily routine checklists to unlock targeted dynamic tips.
              </p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {recommendations.map((rec, i) => (
                  <li
                    key={i}
                    style={{
                      padding: "10px 14px",
                      background: "#f8faf9",
                      borderRadius: 10,
                      fontSize: 13,
                      color: "#334155",
                      border: "1px solid #eef2ef",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <span style={{ color: "#2d6a4f", fontWeight: 700 }}>✓</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 5. HISTORICAL SKIN HEALTH LOGS */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ ...h3, margin: 0, color: "#1b4332" }}>Historical Health Log</h3>
            <span style={{ fontSize: 12, color: "#6b7280" }}>{history.length} records logged</span>
          </div>

          {history.length === 0 ? (
            <p style={{ color: "#6b7280", fontSize: 14 }}>
              No history yet. Open the Skin Analysis page to save your baseline score.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {history
                .slice()
                .reverse()
                .map((item, index) => {
                  const barWidth = Math.round(((item.score || 0) / maxScore) * 100);
                  return (
                    <div
                      key={index}
                      style={{
                        padding: "12px 14px",
                        background: "#fcfdfc",
                        borderRadius: 10,
                        border: "1px solid #f1f5f2",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <div>
                          <strong style={{ color: "#1b4332", fontSize: 14 }}>{item.date}</strong>
                          <p style={{ margin: "3px 0 0", color: "#6b7280", fontSize: 12 }}>
                            {item.summary || "Skin assessment and adherence recorded"}
                          </p>
                        </div>
                        <span style={{ fontWeight: 800, fontSize: 18, color: "#1b4332" }}>
                          {item.score}
                        </span>
                      </div>
                      <div style={track}>
                        <div
                          style={{
                            ...fill,
                            width: `${barWidth}%`,
                            background:
                              item.score >= 75
                                ? "#2d6a4f"
                                : item.score >= 50
                                ? "#e9c46a"
                                : "#e76f51",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

const card = {
  background: "white",
  borderRadius: 16,
  padding: 22,
  boxShadow: "0 4px 18px rgba(27,67,50,0.05)",
  border: "1px solid #edf5f0",
};

const label = {
  margin: "0 0 6px",
  color: "#6b7280",
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.4px",
};

const h3 = {
  margin: "0 0 12px",
  fontSize: "1.05rem",
  fontWeight: 700,
};

const track = {
  height: 8,
  background: "#eef2ee",
  borderRadius: 20,
  overflow: "hidden",
};

const fill = {
  height: "100%",
  borderRadius: 20,
  transition: "width 0.4s ease",
};

const ghostBtn = {
  padding: "9px 18px",
  background: "white",
  border: "1px solid #95d5b2",
  color: "#1b4332",
  borderRadius: 8,
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 600,
};

const greenBtn = {
  display: "inline-block",
  padding: "9px 18px",
  background: "#1b4332",
  color: "white",
  textDecoration: "none",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
};

export default Progress;