import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAssessment, evaluateAssessment } from "../services/api";

function ScoreBar({ label, weight, score, icon, color }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
          <span>{icon}</span> {label} <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>({weight})</span>
        </span>
        <strong style={{ fontSize: 16, color: color || "var(--green-dark)" }}>{score}/100</strong>
      </div>
      <div style={{ width: "100%", background: "var(--green-light)", borderRadius: 8, height: 10, overflow: "hidden" }}>
        <div style={{
          width: `${Math.min(100, Math.max(0, score))}%`,
          height: "100%",
          background: color || "var(--green-dark)",
          borderRadius: 8,
          transition: "width .5s ease"
        }} />
      </div>
    </div>
  );
}

export default function SkinAssessment() {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);

  const fetchScore = () => {
    getAssessment()
      .then((r) => setAssessment(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchScore();
  }, []);

  const handleRecalculate = async () => {
    setEvaluating(true);
    try {
      const r = await evaluateAssessment();
      setAssessment(r.data);
    } catch {
      // fallback
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return <div className="card" style={{ textAlign: "center", padding: 40 }}>Calculating skin assessment score…</div>;
  }

  if (!assessment) {
    return (
      <section>
        <div className="dashboard-head">
          <div>
            <p className="eyebrow">Skin Intelligence</p>
            <h1>Skin Health Assessment Report</h1>
          </div>
        </div>
        <div className="card empty" style={{ textAlign: "center", padding: "60px 24px", maxWidth: 640, margin: "40px auto" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>📋</div>
          <h2 style={{ fontSize: 24, marginBottom: 10, color: "var(--text-main)" }}>No Skin Profile Found</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
            Please create your skin profile first. Our clinical assessment engine calculates your multi-factorial skin health score based on your unique skin type, concerns, sleep, and hydration.
          </p>
          <Link to="/profile" className="primary" style={{ display: "inline-block", padding: "10px 24px", fontSize: 15, textDecoration: "none" }}>
            👉 Create Skin Profile
          </Link>
        </div>
      </section>
    );
  }

  const overall = assessment?.overall_score ?? 0;
  const getScoreBadgeClass = (score) => {
    if (score >= 80) return { color: "#15803d", bg: "#dcfce7", label: "Optimal Health" };
    if (score >= 60) return { color: "#b45309", bg: "#fef3c7", label: "Moderate Health" };
    return { color: "#b91c1c", bg: "#fee2e2", label: "Attention Needed" };
  };
  const statusBadge = getScoreBadgeClass(overall);

  return (
    <section>
      <div className="dashboard-head">
        <div>
          <p className="eyebrow">Skin Intelligence</p>
          <h1>Skin Health Assessment Report</h1>
          <p style={{ color: "var(--text-muted)", marginTop: 4 }}>
            Weighted multi-factorial evaluation of your skin condition, habits, sleep, and hydration.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="primary" onClick={handleRecalculate} disabled={evaluating}>
            {evaluating ? "Evaluating…" : "🔄 Recalculate Score"}
          </button>
        </div>
      </div>

      {/* Main Score Hero Card */}
      <div className="card" style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24, alignItems: "center",
        background: "linear-gradient(135deg, #ffffff 0%, #f4f8f6 100%)", border: "1px solid var(--border)", marginBottom: 28
      }}>
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <div style={{
            width: 140, height: 140, borderRadius: "50%",
            border: `8px solid ${statusBadge.color}`,
            display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
            margin: "0 auto 12px", background: "white", boxShadow: "0 6px 20px rgba(0,0,0,0.06)"
          }}>
            <span style={{ fontSize: 40, fontWeight: 800, color: statusBadge.color, lineHeight: 1 }}>{overall}</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>/ 100</span>
          </div>
          <span style={{
            background: statusBadge.bg, color: statusBadge.color,
            padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: "uppercase"
          }}>
            {statusBadge.label}
          </span>
        </div>

        <div>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>Assessment Summary</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
            {assessment?.recommendation_summary}
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <Link className="secondary" to="/routine" style={{ fontSize: 13 }}>
              ✨ View Personalized Routine
            </Link>
            <Link className="secondary" to="/profile" style={{ fontSize: 13 }}>
              ✏️ Update Skin Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Weighted Score Model Breakdown */}
      <p className="section-title">Weighted Score Breakdown</p>
      <div className="grid-3" style={{ marginBottom: 32 }}>
        <ScoreBar
          label="Skin Condition Assessment"
          weight="35% Weight"
          score={assessment?.condition_score ?? 0}
          icon="🩺"
          color="#1e5fa3"
        />
        <ScoreBar
          label="Lifestyle Habits"
          weight="20% Weight"
          score={assessment?.lifestyle_score ?? 0}
          icon="🏃"
          color="#16a34a"
        />
        <ScoreBar
          label="Sleep Quality"
          weight="15% Weight"
          score={assessment?.sleep_score ?? 0}
          icon="😴"
          color="#6b3fa0"
        />
        <ScoreBar
          label="Routine Consistency"
          weight="20% Weight"
          score={assessment?.consistency_score ?? 0}
          icon="📋"
          color="#c2610c"
        />
        <ScoreBar
          label="Hydration Level"
          weight="10% Weight"
          score={assessment?.hydration_score ?? 0}
          icon="💧"
          color="#0284c7"
        />
      </div>

      {/* Two-Column Section: Concern Priorities & Identified Risk Factors */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
        {/* Prioritized Concerns */}
        <div className="card">
          <h3 style={{ fontSize: 18, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            🎯 Prioritized Skin Concerns
          </h3>
          {assessment?.concern_priorities?.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No specific concerns reported in skin profile.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {assessment?.concern_priorities?.map((item, idx) => (
                <div key={idx} style={{
                  padding: 12, borderRadius: 10, background: "var(--green-bg)", border: "1px solid var(--border)",
                  display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <div>
                    <strong style={{ fontSize: 14, display: "block" }}>{item.concern}</strong>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.description}</span>
                  </div>
                  <span className={`badge ${item.priority === 'High' ? 'badge-admin' : 'badge-consultant'}`}>
                    {item.priority} Priority
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Identified Risk Factors */}
        <div className="card">
          <h3 style={{ fontSize: 18, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            ⚠️ Risk Factor Analysis
          </h3>
          <div style={{ display: "grid", gap: 12 }}>
            {assessment?.risk_factors?.map((risk, idx) => (
              <div key={idx} style={{
                padding: 14, borderRadius: 10, background: "white", border: "1px solid var(--border)",
                borderLeft: `4px solid ${risk.level === 'High' ? 'var(--red)' : risk.level === 'Medium' ? 'var(--orange)' : 'var(--green-mid)'}`
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <strong style={{ fontSize: 14 }}>{risk.title}</strong>
                  <span className={`badge ${risk.level === 'High' ? 'badge-admin' : 'badge-user'}`}>
                    {risk.level} Risk
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                  👉 {risk.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
