import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import "./Analytics.css";
import DailyAnalytics from "./DailyAnalytics";

const API_URL = "http://127.0.0.1:8000";

function Analytics() {
  const [progress, setProgress] = useState(null);
  const [beforeAfter, setBeforeAfter] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const storedUser = localStorage.getItem("user");

  const user = (() => {
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  })();

  const userId =
    user?.user?.id ||
    user?.id ||
    user?.user_id ||
    user?.user?.user_id;


  // =====================================================
  // LOAD ANALYTICS
  // =====================================================

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        if (!userId || !token) {
          throw new Error("Please login again.");
        }

        // -------------------------------------------------
        // PROGRESS
        // -------------------------------------------------

        const progressResponse = await fetch(
          `${API_URL}/api/progress/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const progressData = await progressResponse.json();

        if (!progressResponse.ok) {
          throw new Error(
            progressData.detail ||
              "Unable to load progress data."
          );
        }

        console.log(
          "ANALYTICS PROGRESS:",
          progressData
        );

        setProgress(progressData);


        // -------------------------------------------------
        // BEFORE / AFTER
        // -------------------------------------------------

        const beforeAfterResponse = await fetch(
          `${API_URL}/api/progress/${userId}/before-after`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const beforeAfterData =
          await beforeAfterResponse.json();

        if (!beforeAfterResponse.ok) {
          throw new Error(
            beforeAfterData.detail ||
              "Unable to load before-after data."
          );
        }

        console.log(
          "ANALYTICS BEFORE AFTER:",
          beforeAfterData
        );

        setBeforeAfter(beforeAfterData);

      } catch (err) {
        console.error(
          "Analytics Error:",
          err
        );

        setError(
          err.message ||
            "Unable to load analytics."
        );

      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [userId, token]);


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="analytics-page">

        <div className="analytics-loading">

          <div className="analytics-loading-spinner"></div>

          <h2>
            Loading your analytics...
          </h2>

          <p>
            We're analyzing your skin health history.
          </p>

        </div>

      </div>
    );
  }


  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="analytics-page">

        <div className="analytics-error">

          <div className="analytics-state-icon">
            ⚠️
          </div>

          <h2>
            Unable to load analytics
          </h2>

          <p>
            {error}
          </p>

          <button
            className="analytics-primary-button"
            onClick={() =>
              window.location.reload()
            }
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }


  // =====================================================
  // EMPTY STATE
  // =====================================================

  if (!progress) {
    return (
      <div className="analytics-page">

        <div className="analytics-empty">

          <div className="analytics-state-icon">
            📊
          </div>

          <h2>
            No Analytics Available
          </h2>

          <p>
            Complete a skin assessment to
            start tracking your progress.
          </p>

        </div>

      </div>
    );
  }


  // =====================================================
  // TREND DATA
  // =====================================================

  const trend =
    Array.isArray(progress.trend)
      ? progress.trend
      : [];


  const chartData = trend.map(
    (item, index) => ({
      name:
        item.date ||
        `Assessment ${index + 1}`,

      "Skin Score":
        Number(
          item.skin_score ??
            item.skin_condition_score ??
            0
        ),

      "Lifestyle Score":
        Number(
          item.lifestyle_score ?? 0
        ),

      "Sleep Score":
        Number(
          item.sleep_score ?? 0
        ),

      "Hydration Score":
        Number(
          item.hydration_score ?? 0
        ),

      "Routine Consistency":
        Number(
          item.routine_consistency_score ??
            0
        ),
    })
  );


  // =====================================================
  // HELPER
  // =====================================================

  const getValue = (...values) => {
    for (const value of values) {
      if (
        value !== undefined &&
        value !== null
      ) {
        return value;
      }
    }

    return 0;
  };


  // =====================================================
  // CURRENT / INITIAL SCORE
  // =====================================================

  const currentScore = Number(
    getValue(
      progress.current_score,
      progress.latest_score,
      progress.current_skin_score,
      progress.latest_assessment?.skin_score
    )
  ) || 0;


  const initialScore = Number(
    getValue(
      progress.initial_score,
      progress.first_score,
      progress.before_score,
      progress.first_assessment?.skin_score
    )
  ) || 0;


  const scoreChange = Number(
    currentScore - initialScore
  ).toFixed(2);


  const improvement =
    Number(scoreChange) > 0
      ? "Improving"
      : Number(scoreChange) < 0
      ? "Needs Attention"
      : "Stable";


  // =====================================================
  // SCORE CLASS
  // =====================================================

  const getScoreClass = (score) => {
    const value = Number(score) || 0;

    if (value >= 85) {
      return "analytics-score-excellent";
    }

    if (value >= 70) {
      return "analytics-score-good";
    }

    if (value >= 50) {
      return "analytics-score-moderate";
    }

    return "analytics-score-attention";
  };


  // =====================================================
  // SCORE STATUS CLASS
  // =====================================================

  const getStatusClass = () => {
    if (Number(scoreChange) > 0) {
      return "analytics-status-improving";
    }

    if (Number(scoreChange) < 0) {
      return "analytics-status-attention";
    }

    return "analytics-status-stable";
  };


  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div className="analytics-page">

      {/* =================================================
          DAILY ANALYTICS
          ================================================= */}

      <DailyAnalytics />


      {/* =================================================
          HEADER
          ================================================= */}

      <header className="analytics-header">

        <div className="analytics-header-content">

          <button
            className="analytics-back-button"
            onClick={() =>
              window.history.back()
            }
          >
            ← Back
          </button>

          <p className="analytics-eyebrow">
            SKIN HEALTH INSIGHTS
          </p>

          <h1>
            Skin Health Analytics
          </h1>

          <p className="analytics-header-description">
            Monitor your skin health, lifestyle,
            sleep, hydration, and skincare
            consistency over time.
          </p>

        </div>


        <button
          className="analytics-refresh-button"
          onClick={() =>
            window.location.reload()
          }
        >
          ↻ Refresh Analytics
        </button>

      </header>


      {/* =================================================
          SUMMARY CARDS
          ================================================= */}

      <section className="analytics-cards">

        {/* Current Score */}

        <div className="analytics-card">

          <div className="analytics-card-icon">
            🧠
          </div>

          <span className="card-label">
            Current Skin Score
          </span>

          <div className="analytics-card-value">

            <strong
              className={getScoreClass(
                currentScore
              )}
            >
              {Math.round(currentScore)}
            </strong>

            <span>
              /100
            </span>

          </div>

          <p>
            Latest overall skin health score
          </p>

        </div>


        {/* Initial Score */}

        <div className="analytics-card">

          <div className="analytics-card-icon">
            🌱
          </div>

          <span className="card-label">
            Initial Score
          </span>

          <div className="analytics-card-value">

            <strong
              className={getScoreClass(
                initialScore
              )}
            >
              {Math.round(initialScore)}
            </strong>

            <span>
              /100
            </span>

          </div>

          <p>
            Score from your first assessment
          </p>

        </div>


        {/* Score Change */}

        <div className="analytics-card">

          <div className="analytics-card-icon">
            📈
          </div>

          <span className="card-label">
            Score Change
          </span>

          <div className="analytics-card-value">

            <strong
              className={
                Number(scoreChange) > 0
                  ? "analytics-change-positive"
                  : Number(scoreChange) < 0
                  ? "analytics-change-negative"
                  : "analytics-change-neutral"
              }
            >
              {Number(scoreChange) > 0
                ? "+"
                : ""}
              {scoreChange}
            </strong>

            <span>
              points
            </span>

          </div>

          <p>
            Change since your first assessment
          </p>

        </div>


        {/* Progress Status */}

        <div className="analytics-card">

          <div className="analytics-card-icon">
            ✨
          </div>

          <span className="card-label">
            Progress Status
          </span>

          <div className="analytics-status-wrapper">

            <strong
              className={`analytics-status ${getStatusClass()}`}
            >
              {improvement}
            </strong>

          </div>

          <p>
            Based on your assessment history
          </p>

        </div>

      </section>


      {/* =================================================
          TREND CHART
          ================================================= */}

      <section className="analytics-section">

        <div className="section-title">

          <div>

            <p className="analytics-section-kicker">
              PERFORMANCE HISTORY
            </p>

            <h2>
              Skin Health Trend
            </h2>

            <p>
              Your assessment scores and
              contributing health factors over time.
            </p>

          </div>

          <div className="analytics-section-icon">
            📈
          </div>

        </div>


        {chartData.length > 0 ? (

          <div className="chart-container">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <LineChart
                data={chartData}
                margin={{
                  top: 15,
                  right: 20,
                  left: 0,
                  bottom: 10,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e4ebe7"
                />

                <XAxis
                  dataKey="name"
                  tick={{
                    fontSize: 11,
                    fill: "#74827b",
                  }}
                  tickLine={false}
                  axisLine={{
                    stroke: "#dce5e0",
                  }}
                />

                <YAxis
                  domain={[0, 100]}
                  tick={{
                    fontSize: 11,
                    fill: "#74827b",
                  }}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #dce8e1",
                    boxShadow:
                      "0 8px 24px rgba(0,0,0,0.08)",
                  }}
                />

                <Legend
                  wrapperStyle={{
                    paddingTop: "15px",
                    fontSize: "12px",
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="Skin Score"
                  stroke="#287a52"
                  strokeWidth={3}
                  dot={{
                    r: 5,
                  }}
                  activeDot={{
                    r: 7,
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="Lifestyle Score"
                  stroke="#6c9f82"
                  strokeWidth={2}
                  dot={{
                    r: 4,
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="Sleep Score"
                  stroke="#8a9b91"
                  strokeWidth={2}
                  dot={{
                    r: 4,
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="Hydration Score"
                  stroke="#5d8f82"
                  strokeWidth={2}
                  dot={{
                    r: 4,
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="Routine Consistency"
                  stroke="#a5791d"
                  strokeWidth={2}
                  dot={{
                    r: 4,
                  }}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

        ) : (

          <div className="chart-empty">

            <div className="analytics-empty-icon">
              📊
            </div>

            <h3>
              Not enough trend data yet
            </h3>

            <p>
              Complete more assessments to
              generate a detailed progress trend.
            </p>

          </div>

        )}

      </section>


      {/* =================================================
          BEFORE / AFTER
          ================================================= */}

      {beforeAfter && (

        <section className="analytics-section">

          <div className="section-title">

            <div>

              <p className="analytics-section-kicker">
                PROGRESS COMPARISON
              </p>

              <h2>
                Before & After Comparison
              </h2>

              <p>
                Compare your first and latest
                assessment.
              </p>

            </div>

            <div className="analytics-section-icon">
              🔄
            </div>

          </div>


          <div className="analytics-comparison-grid">

            <div className="analytics-comparison-card">

              <div className="comparison-card-icon">
                🌱
              </div>

              <span>
                First Assessment
              </span>

              <strong
                className={getScoreClass(
                  getValue(
                    beforeAfter.before_score,
                    beforeAfter.initial_score
                  )
                )}
              >
                {getValue(
                  beforeAfter.before_score,
                  beforeAfter.initial_score
                )}
              </strong>

              <small>
                /100
              </small>

            </div>


            <div className="analytics-comparison-arrow">
              →
            </div>


            <div className="analytics-comparison-card">

              <div className="comparison-card-icon">
                ✨
              </div>

              <span>
                Latest Assessment
              </span>

              <strong
                className={getScoreClass(
                  getValue(
                    beforeAfter.after_score,
                    beforeAfter.current_score
                  )
                )}
              >
                {getValue(
                  beforeAfter.after_score,
                  beforeAfter.current_score
                )}
              </strong>

              <small>
                /100
              </small>

            </div>

          </div>

        </section>

      )}


      {/* =================================================
          ANALYTICS INFORMATION
          ================================================= */}

      <section className="analytics-section">

        <div className="section-title">

          <div>

            <p className="analytics-section-kicker">
              UNDERSTANDING YOUR DATA
            </p>

            <h2>
              What This Analytics Shows
            </h2>

            <p>
              Your skin health score is influenced
              by several important factors.
            </p>

          </div>

          <div className="analytics-section-icon">
            💡
          </div>

        </div>


        <div className="analytics-info-grid">

          <div className="analytics-info-card">

            <div className="info-icon">
              🧴
            </div>

            <h3>
              Skin Health
            </h3>

            <p>
              Tracks your overall skin condition
              score from your assessments.
            </p>

          </div>


          <div className="analytics-info-card">

            <div className="info-icon">
              🌿
            </div>

            <h3>
              Lifestyle
            </h3>

            <p>
              Shows how lifestyle factors
              contribute to your skin health.
            </p>

          </div>


          <div className="analytics-info-card">

            <div className="info-icon">
              😴
            </div>

            <h3>
              Sleep
            </h3>

            <p>
              Monitors the relationship between
              sleep quality and skin health.
            </p>

          </div>


          <div className="analytics-info-card">

            <div className="info-icon">
              💧
            </div>

            <h3>
              Hydration
            </h3>

            <p>
              Tracks your hydration-related
              assessment score.
            </p>

          </div>


          <div className="analytics-info-card">

            <div className="info-icon">
              🔄
            </div>

            <h3>
              Routine Consistency
            </h3>

            <p>
              Shows how consistently you
              follow your skincare routine.
            </p>

          </div>

        </div>

      </section>


      {/* =================================================
          FOOTER INSIGHT
          ================================================= */}

      <section className="analytics-insight">

        <div className="analytics-insight-icon">
          ✨
        </div>

        <div>

          <p className="analytics-section-kicker">
            PERSONALIZED INSIGHT
          </p>

          <h2>
            Keep tracking your skin health
          </h2>

          <p>
            Regular assessments help you understand
            how your skin health changes over time.
            Continue monitoring your lifestyle, sleep,
            hydration, and skincare routine consistency.
          </p>

        </div>

      </section>

    </div>
  );
}

export default Analytics;