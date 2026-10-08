import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./HealthDashboard.css";
import { getHealthDashboard } from "../services/api";

function HealthDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const getUserId = (currentUser) => {
    return (
      currentUser?.user_id ||
      currentUser?.user?.id ||
      currentUser?.id
    );
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadHealthDashboard = async () => {
      const userId = getUserId(user);

      if (!userId) {
        setError("Unable to identify the logged-in user.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await getHealthDashboard(userId);

        setDashboard(response);
      } catch (err) {
        console.error("Health dashboard loading error:", err);

        setError(
          err?.message ||
            "Unable to load your health dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    loadHealthDashboard();
  }, [user]);

  const formatScore = (value) => {
    if (value === null || value === undefined) {
      return "--";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
      return value;
    }

    return Math.round(number);
  };

  const getHealthStatusClass = (status) => {
    const value = String(status || "").toLowerCase();

    if (
      value.includes("excellent") ||
      value.includes("good") ||
      value.includes("healthy")
    ) {
      return "status-good";
    }

    if (
      value.includes("moderate") ||
      value.includes("average") ||
      value.includes("fair")
    ) {
      return "status-moderate";
    }

    if (
      value.includes("poor") ||
      value.includes("risk") ||
      value.includes("attention")
    ) {
      return "status-warning";
    }

    return "status-neutral";
  };

  const getConcernList = () => {
    if (!dashboard) {
      return [];
    }

    const concerns =
      dashboard.concerns ||
      dashboard.skin_concerns ||
      dashboard.primary_concerns ||
      [];

    if (Array.isArray(concerns)) {
      return concerns;
    }

    if (typeof concerns === "string") {
      return concerns
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  };

  const getRiskList = () => {
    if (!dashboard) {
      return [];
    }

    const risks =
      dashboard.risk_factors ||
      dashboard.risks ||
      [];

    if (Array.isArray(risks)) {
      return risks;
    }

    if (typeof risks === "string") {
      return risks
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  };

  const getInsights = () => {
    if (!dashboard) {
      return [];
    }

    const insights =
      dashboard.insights ||
      dashboard.health_insights ||
      dashboard.ai_insights ||
      [];

    if (Array.isArray(insights)) {
      return insights;
    }

    if (typeof insights === "string") {
      return [insights];
    }

    return [];
  };

  const score =
    dashboard?.skin_score ??
    dashboard?.overall_score ??
    dashboard?.health_score ??
    0;

  const skinCondition =
    dashboard?.skin_condition ??
    dashboard?.skin_condition_score ??
    dashboard?.scores?.skin_condition ??
    0;

  const lifestyle =
    dashboard?.lifestyle ??
    dashboard?.lifestyle_score ??
    dashboard?.scores?.lifestyle ??
    0;

  const sleep =
    dashboard?.sleep ??
    dashboard?.sleep_score ??
    dashboard?.scores?.sleep ??
    0;

  const routineConsistency =
    dashboard?.routine_consistency ??
    dashboard?.routine_consistency_score ??
    dashboard?.scores?.routine_consistency ??
    0;

  const hydration =
    dashboard?.hydration ??
    dashboard?.hydration_score ??
    dashboard?.scores?.hydration ??
    0;

  const healthStatus =
    dashboard?.health_status ||
    dashboard?.status ||
    "Not available";

  const concerns = getConcernList();
  const risks = getRiskList();
  const insights = getInsights();

  if (loading) {
    return (
      <div className="health-dashboard-loading">
        <div className="health-loading-spinner"></div>

        <h2>Analyzing your skin health...</h2>

        <p>
          Please wait while we prepare your personalized
          health overview.
        </p>
      </div>
    );
  }

  return (
    <div className="health-dashboard-page">

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="health-dashboard-header">

        <div className="health-header-left">

          <button
            className="health-back-button"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>

          <div>
            <span className="health-section-label">
              AI SKIN INTELLIGENCE
            </span>

            <h1>
              Health Dashboard
            </h1>

            <p>
              Your personalized skin health overview
            </p>
          </div>

        </div>

        <div className="health-user">

          <div className="health-user-avatar">
            {(user?.name || "U")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <strong>
              {user?.name || "User"}
            </strong>

            <span>
              {user?.role || "user"}
            </span>
          </div>

        </div>

      </header>

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="health-error">
          <span>⚠️</span>

          <div>
            <strong>
              Unable to load health data
            </strong>

            <p>
              {error}
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <main className="health-dashboard-content">

        {/* ==================================================
            SCORE HERO
        ================================================== */}

        <section className="health-score-hero">

          <div className="health-score-main">

            <span className="health-card-label">
              OVERALL SKIN HEALTH
            </span>

            <div className="health-score-circle">

              <div className="health-score-inner">

                <strong>
                  {formatScore(score)}
                </strong>

                <span>
                  / 100
                </span>

              </div>

            </div>

            <h2>
              Your Skin Health Score
            </h2>

            <p>
              A combined assessment of your skin,
              lifestyle, sleep, hydration and routine
              consistency.
            </p>

          </div>

          <div className="health-status-panel">

            <span className="health-card-label">
              CURRENT STATUS
            </span>

            <div
              className={`health-status-badge ${getHealthStatusClass(
                healthStatus
              )}`}
            >
              {healthStatus}
            </div>

            <p>
              Keep following your personalized skincare
              recommendations and healthy daily habits.
            </p>

            <button
              className="health-primary-button"
              onClick={() => navigate("/dashboard")}
            >
              View Dashboard
            </button>

          </div>

        </section>

        {/* ==================================================
            SCORE BREAKDOWN
        ================================================== */}

        <section className="health-section">

          <div className="health-section-heading">

            <div>
              <span className="health-section-label">
                SCORE BREAKDOWN
              </span>

              <h2>
                What Shapes Your Score?
              </h2>

              <p>
                Your overall score is based on multiple
                aspects of your skin health.
              </p>
            </div>

          </div>

          <div className="health-score-grid">

            <ScoreCard
              icon="🌸"
              title="Skin Condition"
              value={skinCondition}
              description="Current skin condition"
            />

            <ScoreCard
              icon="🌱"
              title="Lifestyle"
              value={lifestyle}
              description="Daily lifestyle habits"
            />

            <ScoreCard
              icon="😴"
              title="Sleep"
              value={sleep}
              description="Sleep and recovery"
            />

            <ScoreCard
              icon="✨"
              title="Routine"
              value={routineConsistency}
              description="Skincare consistency"
            />

            <ScoreCard
              icon="💧"
              title="Hydration"
              value={hydration}
              description="Hydration level"
            />

          </div>

        </section>

        {/* ==================================================
            CONCERNS + RISKS
        ================================================== */}

        <section className="health-two-column">

          <div className="health-info-card">

            <div className="health-info-card-header">

              <div className="health-info-icon">
                🎯
              </div>

              <div>
                <span className="health-card-label">
                  PERSONALIZED
                </span>

                <h3>
                  Skin Concerns
                </h3>
              </div>

            </div>

            {concerns.length > 0 ? (
              <div className="health-tag-list">

                {concerns.map((concern, index) => (
                  <span
                    className="health-tag"
                    key={index}
                  >
                    {typeof concern === "object"
                      ? concern.name ||
                        concern.concern ||
                        "Skin concern"
                      : concern}
                  </span>
                ))}

              </div>
            ) : (
              <div className="health-empty-small">
                <span>🌿</span>

                <p>
                  No major skin concerns have been
                  identified.
                </p>
              </div>
            )}

          </div>

          <div className="health-info-card">

            <div className="health-info-card-header">

              <div className="health-info-icon warning">
                ⚠️
              </div>

              <div>
                <span className="health-card-label">
                  AWARENESS
                </span>

                <h3>
                  Risk Factors
                </h3>
              </div>

            </div>

            {risks.length > 0 ? (
              <ul className="health-risk-list">

                {risks.map((risk, index) => (
                  <li key={index}>
                    <span>•</span>

                    <span>
                      {typeof risk === "object"
                        ? risk.name ||
                          risk.description ||
                          "Risk factor"
                        : risk}
                    </span>
                  </li>
                ))}

              </ul>
            ) : (
              <div className="health-empty-small">
                <span>✓</span>

                <p>
                  No significant risk factors detected.
                </p>
              </div>
            )}

          </div>

        </section>

        {/* ==================================================
            AI INSIGHTS
        ================================================== */}

        <section className="health-section">

          <div className="health-section-heading">

            <div>
              <span className="health-section-label">
                AI INSIGHTS
              </span>

              <h2>
                Personalized Health Insights
              </h2>

              <p>
                Recommendations generated from your
                skin health information.
              </p>
            </div>

          </div>

          {insights.length > 0 ? (
            <div className="health-insights-grid">

              {insights.map((insight, index) => {

                const text =
                  typeof insight === "object"
                    ? insight.message ||
                      insight.description ||
                      insight.text ||
                      "Personalized health insight"
                    : insight;

                return (
                  <div
                    className="health-insight-card"
                    key={index}
                  >
                    <div className="health-insight-number">
                      {index + 1}
                    </div>

                    <div>
                      <h3>
                        AI Recommendation
                      </h3>

                      <p>
                        {text}
                      </p>
                    </div>
                  </div>
                );
              })}

            </div>
          ) : (
            <div className="health-empty-state">

              <div>
                🤖
              </div>

              <h3>
                No AI insights available yet
              </h3>

              <p>
                Complete your skin profile and assessment
                to receive personalized health insights.
              </p>

              <button
                className="health-primary-button"
                onClick={() => navigate("/dashboard")}
              >
                Complete Assessment
              </button>

            </div>
          )}

        </section>

        {/* ==================================================
            HEALTH SUMMARY
        ================================================== */}

        <section className="health-summary-card">

          <div className="health-summary-icon">
            💚
          </div>

          <div>

            <span className="health-card-label">
              YOUR HEALTH SUMMARY
            </span>

            <h2>
              Keep building healthy skin habits
            </h2>

            <p>
              Your skin health is influenced by more than
              skincare products. Consistent routines,
              hydration, sleep and lifestyle habits all
              contribute to your overall skin wellbeing.
            </p>

          </div>

        </section>

      </main>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <footer className="health-dashboard-footer">
        <span>
          ✨ Skin Intelligence
        </span>

        <span>
          Personalized skincare powered by AI
        </span>
      </footer>

    </div>
  );
}

/* =========================================================
   SCORE CARD
========================================================= */

function ScoreCard({
  icon,
  title,
  value,
  description,
}) {
  const score = Number(value) || 0;

  return (
    <div className="health-score-card">

      <div className="health-score-card-top">

        <div className="health-score-icon">
          {icon}
        </div>

        <span>
          {Math.round(score)}
        </span>

      </div>

      <h3>
        {title}
      </h3>

      <p>
        {description}
      </p>

      <div className="health-progress-bar">
        <div
          className="health-progress-fill"
          style={{
            width: `${Math.min(
              Math.max(score, 0),
              100
            )}%`,
          }}
        ></div>
      </div>

    </div>
  );
}

export default HealthDashboard;