import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getAssessmentReport,
  getRoutineReport,
  getProductReport,
  getProgressReport,
  getHealthReport,
  downloadAssessmentPDF,
  downloadHealthPDF,
  downloadProgressExcel,
  downloadHealthExcel,
} from "../services/api";

import "./Reports.css";


function Reports() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [reports, setReports] = useState({
    assessment: null,
    routine: null,
    products: null,
    progress: null,
    health: null,
  });

  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState("");
  const [error, setError] = useState("");


  /* =====================================================
     GET LOGGED-IN USER
     ===================================================== */

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    } catch (err) {
      console.error("Invalid stored user:", err);

      localStorage.removeItem("user");
      localStorage.removeItem("token");

      navigate("/login");
    }
  }, [navigate]);


  /* =====================================================
     GET USER ID
     ===================================================== */

  const getUserId = (currentUser) => {
    return (
      currentUser?.user_id ||
      currentUser?.user?.id ||
      currentUser?.id
    );
  };


  /* =====================================================
     LOAD REPORTS
     ===================================================== */

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadReports = async () => {
      const userId = getUserId(user);

      if (!userId) {
        setError("Unable to identify the logged-in user.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const results = await Promise.allSettled([
          getAssessmentReport(userId),
          getRoutineReport(userId),
          getProductReport(userId),
          getProgressReport(userId),
          getHealthReport(userId),
        ]);

        setReports({
          assessment:
            results[0].status === "fulfilled"
              ? results[0].value
              : null,

          routine:
            results[1].status === "fulfilled"
              ? results[1].value
              : null,

          products:
            results[2].status === "fulfilled"
              ? results[2].value
              : null,

          progress:
            results[3].status === "fulfilled"
              ? results[3].value
              : null,

          health:
            results[4].status === "fulfilled"
              ? results[4].value
              : null,
        });

      } catch (err) {
        console.error("Reports loading error:", err);

        setError(
          err?.message ||
          "Unable to load reports."
        );
      } finally {
        setLoading(false);
      }
    };

    loadReports();

  }, [user]);


  /* =====================================================
     DOWNLOAD FILE
     ===================================================== */

  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);
  };


  /* =====================================================
     DOWNLOAD HANDLER
     ===================================================== */

  const handleDownload = async (
    type,
    downloadFunction,
    filename
  ) => {
    const userId = getUserId(user);

    if (!userId) {
      setError("Unable to identify the logged-in user.");
      return;
    }

    try {
      setDownloadLoading(type);
      setError("");

      const file = await downloadFunction(userId);

      downloadFile(file, filename);

    } catch (err) {
      console.error(
        `${type} download error:`,
        err
      );

      setError(
        err?.message ||
        `Unable to download ${type}.`
      );

    } finally {
      setDownloadLoading("");
    }
  };


  /* =====================================================
     ROUTINE VALUE FORMATTER
     ===================================================== */

  const formatRoutineValue = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "";
    }

    if (typeof value === "string") {
      return value;
    }

    if (Array.isArray(value)) {
      return value
        .map((step) => {
          if (typeof step === "string") {
            return step;
          }

          if (step && typeof step === "object") {
            return (
              step.name ||
              step.product ||
              step.step ||
              step.description ||
              JSON.stringify(step)
            );
          }

          return String(step);
        })
        .join(" → ");
    }

    if (typeof value === "object") {
      return Object.entries(value)
        .map(([key, val]) => {
          const label = key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) =>
              char.toUpperCase()
            );

          let text;

          if (typeof val === "string") {
            text = val;
          } else if (Array.isArray(val)) {
            text = val.join(", ");
          } else {
            text = JSON.stringify(val);
          }

          return `${label}: ${text}`;
        })
        .join(" • ");
    }

    return String(value);
  };


  /* =====================================================
     REPORT CARD
     ===================================================== */

  const ReportCard = ({
    icon,
    title,
    description,
    available,
    children,
  }) => {
    return (
      <div className="report-card">

        <div className="report-card-top">

          <div className="report-icon">
            {icon}
          </div>

          <span
            className={
              available
                ? "report-status available"
                : "report-status unavailable"
            }
          >
            {available
              ? "Available"
              : "Not Available"}
          </span>

        </div>

        <h3>
          {title}
        </h3>

        <p>
          {description}
        </p>

        {children}

      </div>
    );
  };


  /* =====================================================
     LOADING
     ===================================================== */

  if (loading) {
    return (
      <div className="reports-loading">

        <div className="reports-spinner"></div>

        <h2>
          Preparing your reports
        </h2>

        <p>
          Please wait while we collect your skin health information.
        </p>

      </div>
    );
  }


  /* =====================================================
     MAIN UI
     ===================================================== */

  return (
    <div className="reports-page">

      {/* =================================================
          HEADER
          ================================================= */}

      <header className="reports-header">

        <div>

          <span className="reports-label">
            SKIN INTELLIGENCE
          </span>

          <h1>
            Reports &amp; Export
          </h1>

          <p>
            View and download your personalized skin health reports.
          </p>

        </div>

        <button
          className="reports-back-button"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>

      </header>


      {/* =================================================
          CONTENT
          ================================================= */}

      <main className="reports-container">

        {/* =================================================
            ERROR
            ================================================= */}

        {error && (
          <div className="reports-error">
            ⚠️ {error}
          </div>
        )}


        {/* =================================================
            SUMMARY
            ================================================= */}

        <section className="reports-summary">

          <div className="reports-summary-icon">
            📊
          </div>

          <div>

            <h2>
              Your Skin Health Reports
            </h2>

            <p>
              Your reports bring together your skin assessment,
              skincare routine, product recommendations,
              progress and overall health information.
            </p>

          </div>

        </section>


        {/* =================================================
            REPORT CARDS
            ================================================= */}

        <section>

          <div className="reports-section-heading">

            <div>

              <span>
                AVAILABLE REPORTS
              </span>

              <h2>
                Personalized Reports
              </h2>

            </div>

          </div>


          <div className="reports-grid">


            {/* =================================================
                SKIN ASSESSMENT REPORT
                ================================================= */}

            <ReportCard
              icon="🧴"
              title="Skin Assessment Report"
              description="Review your latest skin assessment and health score."
              available={Boolean(reports.assessment)}
            >

              {reports.assessment ? (

                <div className="assessment-preview">

                  <div className="assessment-score-row">

                    <div className="assessment-score">

                      <span className="assessment-score-label">
                        Skin Score
                      </span>

                      <strong>
                        {reports.assessment.assessment?.skin_score ?? "--"}
                      </strong>

                      <span>
                        /100
                      </span>

                    </div>


                    <div className="assessment-status">

                      <span className="assessment-status-label">
                        Health Status
                      </span>

                      <strong>
                        {reports.assessment.health_status ||
                          reports.assessment.status ||
                          "Not available"}
                      </strong>

                    </div>

                  </div>


                  {reports.assessment.concerns && (

                    <div className="assessment-detail">

                      <span className="assessment-detail-label">
                        🎯 Main Concerns
                      </span>

                      <p>
                        {Array.isArray(
                          reports.assessment.concerns
                        )
                          ? reports.assessment.concerns.join(", ")
                          : reports.assessment.concerns}
                      </p>

                    </div>

                  )}


                  {(reports.assessment.risk_level ||
                    reports.assessment.risk) && (

                    <div className="assessment-detail">

                      <span className="assessment-detail-label">
                        ⚠️ Risk Level
                      </span>

                      <p>
                        {reports.assessment.risk_level ||
                          reports.assessment.risk}
                      </p>

                    </div>

                  )}


                  {(reports.assessment.summary ||
                    reports.assessment.health_summary) && (

                    <div className="assessment-detail">

                      <span className="assessment-detail-label">
                        📝 Summary
                      </span>

                      <p>
                        {reports.assessment.summary ||
                          reports.assessment.health_summary}
                      </p>

                    </div>

                  )}

                </div>

              ) : (

                <div className="report-unavailable-message">
                  Assessment information is not available yet.
                </div>

              )}


              <div className="report-actions">

                <button
                  className="report-view-button"
                  onClick={() =>
                    navigate("/health-dashboard")
                  }
                  disabled={!reports.assessment}
                >
                  View Full Report
                </button>


                <button
                  className="report-download-button"
                  onClick={() =>
                    handleDownload(
                      "assessment",
                      downloadAssessmentPDF,
                      "skin-assessment-report.pdf"
                    )
                  }
                  disabled={
                    !reports.assessment ||
                    downloadLoading === "assessment"
                  }
                >
                  {downloadLoading === "assessment"
                    ? "Downloading..."
                    : "PDF"}
                </button>

              </div>

            </ReportCard>


            {/* =================================================
                SKINCARE ROUTINE REPORT
                ================================================= */}

            <ReportCard
              icon="✨"
              title="Skincare Routine Report"
              description="Review your personalized skincare routine and daily care steps."
              available={Boolean(reports.routine)}
            >

              {reports.routine ? (

                <div className="routine-preview">

                  {[
                    {
                      key: "morning",
                      title: "Morning Routine",
                      icon: "☀️",
                    },
                    {
                      key: "evening",
                      title: "Evening Routine",
                      icon: "🌙",
                    },
                    {
                      key: "weekly",
                      title: "Weekly Care",
                      icon: "🧖",
                    },
                    {
                      key: "seasonal",
                      title: "Seasonal Care",
                      icon: "🍃",
                    },
                    {
                      key: "adaptive",
                      title: "Adaptive Routine",
                      icon: "🤖",
                    },
                  ].map((item) => {

                    const value =
                      reports.routine[item.key];

                    if (
                      value === null ||
                      value === undefined ||
                      value === ""
                    ) {
                      return null;
                    }

                    const displayValue =
                      formatRoutineValue(value);

                    return (
                      <div
                        className="routine-preview-item"
                        key={item.key}
                      >

                        <div className="routine-preview-heading">

                          <span>
                            {item.icon}
                          </span>

                          <strong>
                            {item.title}
                          </strong>

                        </div>

                        <p>
                          {displayValue}
                        </p>

                      </div>
                    );
                  })}


                  {![
                    reports.routine.morning,
                    reports.routine.evening,
                    reports.routine.weekly,
                    reports.routine.seasonal,
                    reports.routine.adaptive,
                  ].some(
                    (value) =>
                      value !== null &&
                      value !== undefined &&
                      value !== ""
                  ) && (

                    <p className="routine-preview-empty">
                      Your routine report is available.
                      Open the full routine to review its
                      details.
                    </p>

                  )}

                </div>

              ) : (

                <div className="report-unavailable-message">
                  No skincare routine report is available yet.
                </div>

              )}


              <div className="report-actions">

                <button
                  className="report-view-button"
                  onClick={() =>
                    navigate("/dashboard")
                  }
                  disabled={!reports.routine}
                >
                  View Full Routine
                </button>

              </div>

            </ReportCard>


            {/* =================================================
                PRODUCT RECOMMENDATION REPORT
                ================================================= */}

            <ReportCard
              icon="🧴"
              title="Product Recommendation Report"
              description="Review products recommended for your skin type and concerns."
              available={Boolean(reports.products)}
            >

              <div className="report-actions">

                <button
                  className="report-view-button"
                  onClick={() =>
                    navigate("/product-recommendations")
                  }
                  disabled={!reports.products}
                >
                  View Products
                </button>

              </div>

            </ReportCard>


            {/* =================================================
                PROGRESS REPORT
                ================================================= */}

            <ReportCard
              icon="📈"
              title="Progress Report"
              description="Track changes in your skin health and routine consistency."
              available={Boolean(reports.progress)}
            >

              <div className="report-actions">

                <button
                  className="report-view-button"
                  onClick={() =>
                    navigate("/progress")
                  }
                  disabled={!reports.progress}
                >
                  View Progress
                </button>


                <button
                  className="report-download-button"
                  onClick={() =>
                    handleDownload(
                      "progress",
                      downloadProgressExcel,
                      "skin-progress-report.xlsx"
                    )
                  }
                  disabled={
                    !reports.progress ||
                    downloadLoading === "progress"
                  }
                >
                  {downloadLoading === "progress"
                    ? "Downloading..."
                    : "Excel"}
                </button>

              </div>

            </ReportCard>


            {/* =================================================
                SKIN HEALTH REPORT
                ================================================= */}

            <ReportCard
              icon="💚"
              title="Skin Health Report"
              description="Get a complete overview of your skin health, risks and insights."
              available={Boolean(reports.health)}
            >

              <div className="report-actions">

                <button
                  className="report-view-button"
                  onClick={() =>
                    navigate("/health-dashboard")
                  }
                  disabled={!reports.health}
                >
                  View Health
                </button>


                <button
                  className="report-download-button"
                  onClick={() =>
                    handleDownload(
                      "health-pdf",
                      downloadHealthPDF,
                      "skin-health-report.pdf"
                    )
                  }
                  disabled={
                    !reports.health ||
                    downloadLoading === "health-pdf"
                  }
                >
                  {downloadLoading === "health-pdf"
                    ? "Downloading..."
                    : "PDF"}
                </button>


                <button
                  className="report-download-button"
                  onClick={() =>
                    handleDownload(
                      "health-excel",
                      downloadHealthExcel,
                      "skin-health-report.xlsx"
                    )
                  }
                  disabled={
                    !reports.health ||
                    downloadLoading === "health-excel"
                  }
                >
                  {downloadLoading === "health-excel"
                    ? "Downloading..."
                    : "Excel"}
                </button>

              </div>

            </ReportCard>


          </div>

        </section>


        {/* =================================================
            EXPORT INFORMATION
            ================================================= */}

        <section className="export-information">

          <div className="export-information-icon">
            📥
          </div>

          <div>

            <h2>
              Export Your Reports
            </h2>

            <p>
              Download your skin health information in PDF
              or Excel format for personal records,
              consultations and progress tracking.
            </p>

          </div>

        </section>


        {/* =================================================
            FOOTER
            ================================================= */}

        <footer className="reports-footer">
          AI Skin Intelligence • Personalized Skincare
        </footer>

      </main>

    </div>
  );
}


export default Reports;