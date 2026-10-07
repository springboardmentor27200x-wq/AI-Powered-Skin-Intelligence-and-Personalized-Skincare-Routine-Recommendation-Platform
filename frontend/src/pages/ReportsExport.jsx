import { useState, useEffect } from "react";
import { getSkinHealthReport, exportProgressCsv } from "../services/api";

const scoreColor = (score) => {
  if (!score) return "#9ca3af";
  if (score >= 75) return "#10b981";
  if (score >= 55) return "#f59e0b";
  return "#ef4444";
};

const scoreLabel = (score) => {
  if (!score) return "N/A";
  if (score >= 75) return "Excellent";
  if (score >= 55) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Attention";
};

function MetricCard({ icon, title, value, unit = "", color = "#7c3aed", subtitle = "" }) {
  return (
    <div className="card" style={{ textAlign: "center", padding: "20px 16px" }}>
      <div style={{ fontSize: "2rem", marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: "1.8rem", fontWeight: 800, color }}>{value || "—"}</div>
      {unit && <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 2 }}>{unit}</div>}
      <div style={{ fontWeight: 600, color: "#374151", marginTop: 6, fontSize: "0.85rem" }}>{title}</div>
      {subtitle && <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 4 }}>{subtitle}</div>}
    </div>
  );
}

function ProgressBar({ value, max = 100, color = "#7c3aed" }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ background: "#e5e7eb", borderRadius: 999, height: 10, overflow: "hidden" }}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: 999,
          transition: "width 0.6s ease",
        }}
      />
    </div>
  );
}

export default function ReportsExport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSkinHealthReport()
      .then((r) => setReport(r.data))
      .catch(() => setError("Failed to load report. Make sure you have a skin profile set up."))
      .finally(() => setLoading(false));
  }, []);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const res = await exportProgressCsv();
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `skin_progress_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to export CSV. Make sure you have progress logs.");
    }
    setExporting(false);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  if (loading) return <div className="card" style={{ textAlign: "center", padding: 60 }}>Loading your skin health report...</div>;

  return (
    <div id="reports-page">
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#1f2937", marginBottom: 4 }}>📊 Reports & Export</h2>
          <p style={{ color: "#6b7280", margin: 0 }}>
            Report Date: {report?.report_date || new Date().toLocaleDateString()}
            {report && ` · ${report.user_name}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }} className="no-print">
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="btn"
            style={{ background: "#10b981", color: "white", border: "none", display: "flex", alignItems: "center", gap: 8 }}
          >
            📥 {exporting ? "Exporting..." : "Export CSV"}
          </button>
          <button
            onClick={handlePrintPDF}
            className="btn"
            style={{ background: "#7c3aed", color: "white", border: "none", display: "flex", alignItems: "center", gap: 8 }}
          >
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {report ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Overall Score Banner */}
          <div className="card" style={{
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            color: "white",
            textAlign: "center",
            padding: "32px 24px",
          }}>
            <div style={{ fontSize: "0.9rem", opacity: 0.85, marginBottom: 8 }}>Overall Skin Health Score</div>
            <div style={{ fontSize: "5rem", fontWeight: 900, lineHeight: 1 }}>
              {report.latest_score?.toFixed(1) || "—"}
            </div>
            <div style={{ fontSize: "1.2rem", fontWeight: 600, marginTop: 8, opacity: 0.9 }}>
              {scoreLabel(report.latest_score)}
            </div>
            <div style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: 4 }}>
              Based on {report.assessment_count} assessment{report.assessment_count !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Metrics Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 16 }}>
            <MetricCard
              icon="📈"
              title="Routine Adherence"
              value={report.routine_adherence_pct != null ? `${report.routine_adherence_pct}%` : null}
              color={report.routine_adherence_pct >= 70 ? "#10b981" : "#f59e0b"}
              subtitle="Last 14 days"
            />
            <MetricCard
              icon="😴"
              title="Avg Sleep Quality"
              value={report.avg_sleep_quality?.toFixed(1)}
              unit="/ 10"
              color={report.avg_sleep_quality >= 7 ? "#10b981" : "#f59e0b"}
              subtitle="Last 7 days"
            />
            <MetricCard
              icon="💧"
              title="Avg Hydration"
              value={report.avg_hydration_glasses?.toFixed(1)}
              unit="glasses / day"
              color={report.avg_hydration_glasses >= 7 ? "#10b981" : "#f59e0b"}
              subtitle="Last 7 days"
            />
            <MetricCard
              icon="📊"
              title="Avg Skin Condition"
              value={report.avg_condition_rating?.toFixed(1)}
              unit="/ 10"
              color={report.avg_condition_rating >= 7 ? "#10b981" : "#f59e0b"}
              subtitle="Last 30 days"
            />
            <MetricCard
              icon="📝"
              title="Progress Entries"
              value={report.progress_logs_count}
              color="#7c3aed"
              subtitle="Last 30 days"
            />
          </div>

          {/* Skin Profile Summary */}
          <div className="card">
            <h3 style={{ fontWeight: 700, color: "#1f2937", marginBottom: 16 }}>🧴 Skin Profile Summary</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              {[
                { label: "Skin Type", value: report.skin_type || "Not set" },
                { label: "Age Group", value: report.age_group || "Not set" },
                { label: "Assessments Done", value: report.assessment_count },
              ].map((item) => (
                <div key={item.label} style={{ background: "#f9fafb", borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontWeight: 700, color: "#1f2937" }}>{item.value}</div>
                </div>
              ))}
            </div>

            {report.skin_concerns && report.skin_concerns.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 8, fontWeight: 600 }}>Active Skin Concerns:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {report.skin_concerns.map((c) => (
                    <span key={c} style={{
                      background: "#fee2e2",
                      color: "#991b1b",
                      borderRadius: 20,
                      padding: "4px 12px",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                    }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Progress Bars */}
          <div className="card">
            <h3 style={{ fontWeight: 700, color: "#1f2937", marginBottom: 20 }}>📉 Health Metric Breakdown</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                { label: "Routine Adherence", value: report.routine_adherence_pct || 0, max: 100, color: "#7c3aed", suffix: "%" },
                { label: "Sleep Quality", value: (report.avg_sleep_quality || 0) * 10, max: 100, color: "#6366f1", suffix: `/10 avg` },
                { label: "Hydration", value: Math.min(100, (report.avg_hydration_glasses || 0) * 12.5), max: 100, color: "#06b6d4", suffix: " glasses/day avg" },
                { label: "Skin Condition", value: (report.avg_condition_rating || 0) * 10, max: 100, color: "#10b981", suffix: "/10 avg" },
              ].map((item) => (
                <div key={item.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, color: "#374151", fontSize: "0.9rem" }}>{item.label}</span>
                    <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                      {item.label === "Routine Adherence"
                        ? `${item.value}${item.suffix}`
                        : item.label === "Sleep Quality"
                        ? `${report.avg_sleep_quality?.toFixed(1) || "—"}${item.suffix}`
                        : item.label === "Hydration"
                        ? `${report.avg_hydration_glasses?.toFixed(1) || "—"}${item.suffix}`
                        : `${report.avg_condition_rating?.toFixed(1) || "—"}${item.suffix}`}
                    </span>
                  </div>
                  <ProgressBar value={item.value} max={100} color={item.color} />
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="card">
            <h3 style={{ fontWeight: 700, color: "#1f2937", marginBottom: 16 }}>💡 AI Recommendations</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {report.recommendations.map((rec, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 12,
                    background: "#faf5ff",
                    borderRadius: 10,
                    padding: "12px 16px",
                    borderLeft: "4px solid #7c3aed",
                  }}
                >
                  <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>
                    {i === 0 ? "🎯" : i === 1 ? "📌" : i === 2 ? "💡" : "✅"}
                  </span>
                  <p style={{ margin: 0, color: "#374151", lineHeight: 1.5, fontSize: "0.9rem" }}>{rec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Export Actions */}
          <div className="card no-print" style={{ textAlign: "center", padding: "24px 16px" }}>
            <h3 style={{ fontWeight: 700, color: "#1f2937", marginBottom: 8 }}>📤 Export Your Report</h3>
            <p style={{ color: "#6b7280", marginBottom: 20 }}>
              Download your progress data or save this page as a PDF for your records.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
              <button
                onClick={handleExportCsv}
                disabled={exporting}
                className="btn"
                style={{ background: "#10b981", color: "white", border: "none", padding: "12px 28px" }}
              >
                📥 {exporting ? "Exporting..." : "Download CSV (Progress Logs)"}
              </button>
              <button
                onClick={handlePrintPDF}
                className="btn"
                style={{ background: "#7c3aed", color: "white", border: "none", padding: "12px 28px" }}
              >
                🖨️ Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      ) : (
        !error && (
          <div className="card" style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>📋</div>
            <p>Set up your skin profile and complete at least one assessment to generate your report.</p>
          </div>
        )
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .card { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
          header, nav { display: none !important; }
        }
      `}</style>
    </div>
  );
}
