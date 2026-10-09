
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./HealthDashboard.css";
import {
  getHealthDashboard,
  getSkinAssessment,
} from "../services/api";

function unwrapResponse(response) {
  let data = response?.data ?? response;

  // Handle APIs that wrap their response in "data".
  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    data.data &&
    typeof data.data === "object"
  ) {
    data = data.data;
  }

  return data;
}

function findAssessment(data) {
  if (!data || typeof data !== "object") {
    return {};
  }

  // Support common assessment response structures.
  return (
    data.assessment ??
    data.skin_assessment ??
    data.latest_assessment ??
    data
  );
}

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
      setUser(JSON.parse(storedUser));
    } catch (err) {
      console.error("Invalid stored user:", err);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/login");
    }
  }, [navigate]);

  const getUserId = (currentUser) =>
    currentUser?.user_id ??
    currentUser?.user?.id ??
    currentUser?.id ??
    null;

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadHealthDashboard() {
      const userId = getUserId(user);

      if (!userId) {
        setError("Unable to identify the logged-in user.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        // Load the dashboard and skin assessment together.
        const results = await Promise.allSettled([
          getHealthDashboard(userId),
          getSkinAssessment(userId),
        ]);

        if (cancelled) return;

        const dashboardResult = results[0];
        const assessmentResult = results[1];

        let dashboardData = {};
        let assessmentData = {};

        if (dashboardResult.status === "fulfilled") {
          dashboardData = unwrapResponse(
            dashboardResult.value
          );
        } else {
          console.error(
            "Health dashboard API error:",
            dashboardResult.reason
          );
        }

        if (assessmentResult.status === "fulfilled") {
          assessmentData = findAssessment(
            unwrapResponse(assessmentResult.value)
          );
        } else {
          console.error(
            "Skin assessment API error:",
            assessmentResult.reason
          );
        }

        // Keep dashboard information and add assessment fields.
        // Explicitly preserve the assessment score if present.
        const combinedData = {
          ...(dashboardData &&
          typeof dashboardData === "object"
            ? dashboardData
            : {}),
          ...(assessmentData &&
          typeof assessmentData === "object"
            ? assessmentData
            : {}),
        };

        // If the assessment has a skin_score, it takes priority.
        const assessmentScore =
          assessmentData?.skin_score ??
          assessmentData?.overall_score ??
          assessmentData?.health_score;

        if (assessmentScore !== null &&
            assessmentScore !== undefined) {
          combinedData.skin_score = assessmentScore;
        }

        setDashboard(combinedData);

        if (
          dashboardResult.status === "rejected" &&
          assessmentResult.status === "rejected"
        ) {
          setError(
            "Unable to load dashboard or skin assessment data. Please retry."
          );
        } else if (assessmentResult.status === "rejected") {
          setError(
            "The dashboard loaded, but the skin assessment could not be fetched."
          );
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Health dashboard loading error:", err);
          setError(
            err?.message ||
              "Unable to load your health dashboard."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHealthDashboard();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const formatScore = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "--";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "--";
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

  const getList = (...values) => {
    const value = values.find(
      (item) => item !== null && item !== undefined
    );

    if (Array.isArray(value)) return value;

    if (typeof value === "string") {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  };

  const getConcernList = () =>
    getList(
      dashboard?.concerns,
      dashboard?.skin_concerns,
      dashboard?.primary_concerns
    );

  const getRiskList = () =>
    getList(
      dashboard?.risk_factors,
      dashboard?.risks
    );

  const getInsights = () =>
    getList(
      dashboard?.insights,
      dashboard?.health_insights,
      dashboard?.ai_insights
    );

  const score =
    dashboard?.skin_score ??
    dashboard?.overall_score ??
    dashboard?.health_score ??
    null;

  const skinCondition =
    dashboard?.skin_condition_score ??
    dashboard?.scores?.skin_condition ??
    dashboard?.skin_condition ??
    null;

  const lifestyle =
    dashboard?.lifestyle_score ??
    dashboard?.scores?.lifestyle ??
    dashboard?.lifestyle ??
    null;

  const sleep =
    dashboard?.sleep_score ??
    dashboard?.scores?.sleep ??
    dashboard?.sleep ??
    null;

  const routineConsistency =
    dashboard?.routine_consistency_score ??
    dashboard?.scores?.routine_consistency ??
    dashboard?.routine_consistency ??
    null;

  const hydration =
    dashboard?.hydration_score ??
    dashboard?.scores?.hydration ??
    dashboard?.hydration ??
    null;

  const healthStatus =
    dashboard?.health_status ??
    dashboard?.status ??
    "Not available";

  const concerns = getConcernList();
  const risks = getRiskList();
  const insights = getInsights();

  if (loading) {
    return (
      <div className="health-dashboard-loading">
        <div className="health-loading-spinner" />
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
            <h1>Health Dashboard</h1>
            <p>Your personalized skin health overview</p>
          </div>
        </div>

        <div className="health-user">
          <div className="health-user-avatar">
            {(user?.name || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>{user?.name || "User"}</strong>
            <span>{user?.role || "user"}</span>
          </div>
        </div>
      </header>

      {error && (
        <div className="health-error">
          <span>⚠️</span>
          <div>
            <strong>Unable to load all health data</strong>
            <p>{error}</p>
          </div>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      )}

      <main className="health-dashboard-content">
        <section className="health-score-hero">
          <div className="health-score-main">
            <span className="health-card-label">
              OVERALL SKIN HEALTH
            </span>

            <div className="health-score-circle">
              <div className="health-score-inner">
                <strong>{formatScore(score)}</strong>
                <span>/ 100</span>
              </div>
            </div>

            <h2>Your Skin Health Score</h2>
            <p>
              A combined assessment of your skin, lifestyle,
              sleep, hydration and routine consistency.
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

        <section className="health-section">
          <div className="health-section-heading">
            <div>
              <span className="health-section-label">
                SCORE BREAKDOWN
              </span>
              <h2>What Shapes Your Score?</h2>
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

        <section className="health-two-column">
          <div className="health-info-card">
            <div className="health-info-card-header">
              <div className="health-info-icon">🎯</div>
              <div>
                <span className="health-card-label">
                  PERSONALIZED
                </span>
                <h3>Skin Concerns</h3>
              </div>
            </div>

            {concerns.length > 0 ? (
              <div className="health-tag-list">
                {concerns.map((concern, index) => (
                  <span className="health-tag" key={index}>
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
                  No major skin concerns have been identified.
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
                <h3>Risk Factors</h3>
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

        <section className="health-section">
          <div className="health-section-heading">
            <div>
              <span className="health-section-label">
                AI INSIGHTS
              </span>
              <h2>Personalized Health Insights</h2>
              <p>
                Recommendations generated from your skin
                health information.
              </p>
            </div>
          </div>

          {insights.length > 0 ? (
            <div className="health-insights-grid">
              {insights.map((insight, index) => {
                const insightText =
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
                      <h3>AI Recommendation</h3>
                      <p>{insightText}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="health-empty-state">
              <div>🤖</div>
              <h3>No AI insights available yet</h3>
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

        <section className="health-summary-card">
          <div className="health-summary-icon">💚</div>
          <div>
            <span className="health-card-label">
              YOUR HEALTH SUMMARY
            </span>
            <h2>Keep building healthy skin habits</h2>
            <p>
              Your skin health is influenced by more than
              skincare products. Consistent routines,
              hydration, sleep and lifestyle habits all
              contribute to your overall skin wellbeing.
            </p>
          </div>
        </section>
      </main>

      <footer className="health-dashboard-footer">
        <span>✨ Skin Intelligence</span>
        <span>Personalized skincare powered by AI</span>
      </footer>
    </div>
  );
}

function ScoreCard({ icon, title, value, description }) {
  const parsedScore = Number(value);
  const hasScore =
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(parsedScore);

  const score = hasScore ? parsedScore : null;
  const progress = score === null
    ? 0
    : Math.min(Math.max(score, 0), 100);

  return (
    <div className="health-score-card">
      <div className="health-score-card-top">
        <div className="health-score-icon">{icon}</div>
        <span>{score === null ? "--" : Math.round(score)}</span>
      </div>

      <h3>{title}</h3>
      <p>{description}</p>

      <div className="health-progress-bar">
        <div
          className="health-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default HealthDashboard;