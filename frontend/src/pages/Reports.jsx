import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";

function Reports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState("info");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const getToken = () => localStorage.getItem("token");

  const downloadReport = async (url, filename) => {
    const token = getToken();
    if (!token) {
      setMessage("Please login first.");
      setMsgType("error");
      return;
    }

    setLoading(filename);
    setMessage("");

    try {
      const res = await axios.get(`http://127.0.0.1:5000${url}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      });

      const mimeType = filename.endsWith(".xlsx")
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "application/pdf";
      const blob = new Blob([res.data], { type: mimeType });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setMsgType("success");
      setMessage(`"${filename}" generated and downloaded successfully!`);
    } catch (error) {
      console.error(error);
      setMsgType("error");
      setMessage("Unable to download report. Please ensure your skin profile is saved and try again.");
    } finally {
      setLoading(null);
    }
  };

  const reportCards = [
    {
      title: "Skin Assessment Report",
      icon: "🔬",
      badge: "Clinical PDF",
      desc: "Complete diagnostic summary including skin barrier score, 5-factor weighted breakdown, prioritized concerns, and recommended active ingredients.",
      endpoint: "/api/reports/export/pdf/assessment",
      filename: "Skin_Assessment_Report.pdf",
    },
    {
      title: "Personalized Routine Plan",
      icon: "⏱",
      badge: "Regimen PDF",
      desc: "Step-by-step AM (protect) and PM (repair) daily regimens, weekly treatment protocol (retinoids/exfoliation), and weather-adaptive skin guidance.",
      endpoint: "/api/reports/export/pdf/routine",
      filename: "Skincare_Routine_Plan.pdf",
    },
    {
      title: "Product Recommendations",
      icon: "🛍️",
      badge: "Catalog PDF",
      desc: "Top matched dermatological products with content-based ML compatibility scores, ingredients to look for, safety guidelines, and estimated prices.",
      endpoint: "/api/reports/export/pdf/products",
      filename: "Product_Recommendations.pdf",
    },
    {
      title: "Skin Health Progress Report",
      icon: "📈",
      badge: "Trend PDF",
      desc: "Longitudinal tracking of your skin health score over time, net score change, 30-day health trend, and routine checklist adherence rate.",
      endpoint: "/api/reports/export/pdf/progress",
      filename: "Progress_Report.pdf",
    },
    {
      title: "Skin Health Diagnostic Report",
      icon: "🩺",
      badge: "Health PDF",
      desc: "Full clinical skin health report combining 5-factor scoring model breakdown, prioritized risk factors, barrier integrity assessment, and doctor advisories.",
      endpoint: "/api/reports/export/pdf/skin-health",
      filename: "Skin_Health_Diagnostic_Report.pdf",
    },
    {
      title: "Progress Data Spreadsheet",
      icon: "📊",
      badge: "Excel (.xlsx)",
      desc: "Export your complete raw daily skin health scores, dates, and clinical logs in Microsoft Excel format for clinical review.",
      endpoint: "/api/reports/export/excel/progress",
      filename: "Progress_Report.xlsx",
    },
  ];

  return (
    <Layout>
      <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 60 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              margin: 0,
              fontSize: "2rem",
              color: "#1b4332",
              fontFamily: "Georgia, serif",
              fontWeight: 700,
            }}
          >
            Clinical Reports & Export Center
          </h1>
          <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: 14 }}>
            Generate and export high-definition clinical PDF summaries and raw Excel data for your records or dermatologist consultations.
          </p>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div
            style={{
              background: msgType === "success" ? "#dcfce7" : "#fee2e2",
              color: msgType === "success" ? "#166534" : "#991b1b",
              padding: "12px 18px",
              borderRadius: 10,
              marginBottom: 24,
              fontSize: 14,
              fontWeight: 500,
              border: `1px solid ${msgType === "success" ? "#86efac" : "#fca5a5"}`,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span>{msgType === "success" ? "✓" : "⚠"}</span>
            {message}
          </div>
        )}

        {/* Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 22,
          }}
        >
          {reportCards.map((rc) => {
            const isDownloading = loading === rc.filename;
            return (
              <div
                key={rc.filename}
                style={{
                  background: "white",
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: "0 4px 18px rgba(27,67,50,0.06)",
                  border: "1px solid #edf5f0",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                      }}
                    >
                      {rc.icon}
                    </div>

                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        padding: "3px 10px",
                        borderRadius: 20,
                        background: rc.badge.includes("Excel") ? "#fef3c7" : "#d1fae5",
                        color: rc.badge.includes("Excel") ? "#92400e" : "#065f46",
                      }}
                    >
                      {rc.badge}
                    </span>
                  </div>

                  <h2
                    style={{
                      margin: "0 0 8px",
                      fontSize: "1.15rem",
                      color: "#1b4332",
                      fontWeight: 700,
                    }}
                  >
                    {rc.title}
                  </h2>
                  <p
                    style={{
                      color: "#6b7280",
                      fontSize: 13,
                      lineHeight: 1.55,
                      margin: "0 0 20px",
                    }}
                  >
                    {rc.desc}
                  </p>
                </div>

                <button
                  disabled={!!loading}
                  onClick={() => downloadReport(rc.endpoint, rc.filename)}
                  style={{
                    background: isDownloading ? "#4d7c67" : "#1b4332",
                    color: "white",
                    border: "none",
                    padding: "11px 18px",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    width: "100%",
                    boxShadow: "0 2px 6px rgba(27,67,50,0.15)",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    if (!loading) e.currentTarget.style.background = "#2d6a4f";
                  }}
                  onMouseOut={(e) => {
                    if (!loading) e.currentTarget.style.background = "#1b4332";
                  }}
                >
                  <span>{isDownloading ? "⏳" : "⬇"}</span>
                  {isDownloading ? "Preparing Document..." : `Download ${rc.badge.split(" ")[0]}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Clinical Note Footer */}
        <div
          style={{
            marginTop: 36,
            background: "#f0fdf4",
            borderRadius: 14,
            padding: "18px 24px",
            border: "1px solid #bbf7d0",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span style={{ fontSize: 24 }}>🩺</span>
          <div style={{ fontSize: 13, color: "#166534", lineHeight: 1.5 }}>
            <b>Dermatological Reference:</b> All generated PDF reports adhere to clinical typography standards, structured table alignments, and safety advisories suitable for consultation reviews.
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Reports;