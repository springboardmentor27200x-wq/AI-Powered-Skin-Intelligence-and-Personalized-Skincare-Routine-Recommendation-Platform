import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getProgress,
  getBeforeAfterProgress,
} from "../services/api";

import "./Progress.css";


function Progress() {
  const navigate = useNavigate();

  const [progress, setProgress] = useState(null);
  const [comparison, setComparison] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");


  // =====================================================
  // GET USER ID
  // =====================================================

  const getUserId = useCallback(() => {
    try { const user = JSON.parse(localStorage.getItem("user") || "null"); return user?.user?.id ?? user?.id ?? user?.user_id ?? user?.user?.user_id ?? null; }
    catch (err) { console.error("Invalid stored user:", err); return null; }
  }, []);


  // =====================================================
  // LOAD PROGRESS
  // =====================================================

  const loadProgress = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const userId = getUserId();

      console.log("Progress user ID:", userId);

      if (!userId) {
        setError("User information not found. Please login again.");
        return;
      }

      // -----------------------------------------------
      // MAIN PROGRESS
      // -----------------------------------------------

      const progressData = await getProgress(userId);

      setProgress(progressData);

      // -----------------------------------------------
      // BEFORE / AFTER
      // -----------------------------------------------

      try {
        const comparisonData =
          await getBeforeAfterProgress(userId);

        setComparison(comparisonData);
      } catch (comparisonError) {
        console.error(
          "Before/after loading error:",
          comparisonError
        );

        setComparison({
          message:
            comparisonError.message ||
            "Before and after comparison is not available yet.",
        });
      }

    } catch (err) {
      console.error(
        "Progress loading error:",
        err
      );

      setError(
        err.message ||
        "Unable to load progress data."
      );

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getUserId]);


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadProgress(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadProgress]);


  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (dateString) => {
    if (!dateString) {
      return "N/A";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleDateString(
      undefined,
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };


  // =====================================================
  // FORMAT SCORE CHANGE
  // =====================================================

  const formatChange = (change) => {
    const value = Number(change) || 0;

    if (value > 0) {
      return `+${value}`;
    }

    return value;
  };


  // =====================================================
  // GET STATUS CLASS
  // =====================================================

  const getStatusClass = (status) => {
    if (!status) {
      return "status-neutral";
    }

    const normalized =
      status.toLowerCase();

    if (normalized === "improved") {
      return "status-improved";
    }

    if (normalized === "declined") {
      return "status-declined";
    }

    if (normalized === "stable") {
      return "status-stable";
    }

    return "status-neutral";
  };


  // =====================================================
  // SCORE CLASS
  // =====================================================

  const getScoreClass = (score) => {
    const value = Number(score) || 0;

    if (value >= 85) {
      return "progress-score-excellent";
    }

    if (value >= 70) {
      return "progress-score-good";
    }

    if (value >= 50) {
      return "progress-score-moderate";
    }

    return "progress-score-attention";
  };


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="progress-page">

        <div className="progress-loading">

          <div className="progress-spinner"></div>

          <h2>
            Loading your progress...
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
      <div className="progress-page">

        <div className="progress-error">

          <div className="progress-error-icon">
            ⚠️
          </div>

          <h2>
            Unable to load progress
          </h2>

          <p>
            {error}
          </p>

          <div className="progress-error-actions">

            <button
              className="progress-primary-button"
              onClick={() => loadProgress()}
            >
              Try Again
            </button>

            <button
              className="progress-secondary-button"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              Back to Dashboard
            </button>

          </div>

        </div>

      </div>
    );
  }


  // =====================================================
  // NO DATA
  // =====================================================

  if (!progress) {
    return (
      <div className="progress-page">

        <div className="progress-empty">

          <div className="progress-empty-icon">
            📊
          </div>

          <h2>
            No progress data available
          </h2>

          <p>
            Generate a skin assessment from your
            dashboard to start tracking your progress.
          </p>

          <button
            className="progress-primary-button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            Go to Dashboard
          </button>

        </div>

      </div>
    );
  }


  // =====================================================
  // DATA
  // =====================================================

  const latest =
    progress.latest_assessment;

  const first =
    progress.first_assessment;


  const currentScore =
    Number(latest?.skin_score) || 0;

  const scoreChange =
    Number(progress.score_change) || 0;


  return (

    <div className="progress-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="progress-header">

        <div className="progress-header-left">

          <button
            className="progress-back-button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            ← Dashboard
          </button>

          <p className="progress-eyebrow">
            SKIN HEALTH JOURNEY
          </p>

          <h1>
            Progress & Analytics
          </h1>

          <p className="progress-header-description">
            Track your skin health journey,
            improvements, assessment history,
            and health score trends.
          </p>

        </div>

        <button
          className="progress-refresh-button"
          onClick={() => loadProgress(true)}
          disabled={refreshing}
        >
          {refreshing
            ? "Refreshing..."
            : "↻ Refresh Progress"}
        </button>

      </header>


      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <section className="progress-summary-grid">

        {/* Current Score */}

        <div className="progress-card score-summary-card">

          <div className="progress-card-icon">
            🧠
          </div>

          <span className="progress-card-label">
            Current Skin Score
          </span>

          <div className="progress-card-main-value">

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

          <p className="progress-card-description">
            Latest overall skin health score
          </p>

        </div>


        {/* Score Change */}

        <div className="progress-card">

          <div className="progress-card-icon">
            📈
          </div>

          <span className="progress-card-label">
            Score Change
          </span>

          <div className="progress-card-main-value">

            <strong>
              {formatChange(scoreChange)}
            </strong>

            <span>
              points
            </span>

          </div>

          <p className="progress-card-description">
            Change since first assessment
          </p>

        </div>


        {/* Status */}

        <div className="progress-card">

          <div className="progress-card-icon">
            🌱
          </div>

          <span className="progress-card-label">
            Progress Status
          </span>

          <div className="progress-status-wrapper">

            <strong
              className={`progress-status ${getStatusClass(
                progress.improvement_status
              )}`}
            >
              {progress.improvement_status}
            </strong>

          </div>

          <p className="progress-card-description">
            Based on your assessment history
          </p>

        </div>


        {/* Assessments */}

        <div className="progress-card">

          <div className="progress-card-icon">
            📋
          </div>

          <span className="progress-card-label">
            Assessments
          </span>

          <div className="progress-card-main-value">

            <strong>
              {progress.total_assessments}
            </strong>

            <span>
              total
            </span>

          </div>

          <p className="progress-card-description">
            Recorded skin assessments
          </p>

        </div>

      </section>


      {/* =================================================
          CURRENT SKIN HEALTH
      ================================================= */}

      <section className="progress-section">

        <div className="progress-section-heading">

          <div>

            <p className="progress-section-kicker">
              LATEST ANALYSIS
            </p>

            <h2>
              Current Skin Health
            </h2>

          </div>

          <span className="progress-section-icon">
            🧴
          </span>

        </div>


        <div className="assessment-info-grid">

          <div className="assessment-info-item">

            <span>
              Skin Score
            </span>

            <strong
              className={getScoreClass(
                currentScore
              )}
            >
              {Math.round(currentScore)}
              <small>/100</small>
            </strong>

          </div>


          <div className="assessment-info-item">

            <span>
              Health Status
            </span>

            <strong>
              {latest?.health_status ||
                "N/A"}
            </strong>

          </div>


          <div className="assessment-info-item">

            <span>
              Primary Concern
            </span>

            <strong>
              {latest?.primary_concern ||
                "N/A"}
            </strong>

          </div>


          <div className="assessment-info-item">

            <span>
              Assessment Date
            </span>

            <strong>
              {formatDate(
                latest?.created_at
              )}
            </strong>

          </div>

        </div>

      </section>


      {/* =================================================
          SCORE TREND
      ================================================= */}

      <section className="progress-section">

        <div className="progress-section-heading">

          <div>

            <p className="progress-section-kicker">
              PERFORMANCE HISTORY
            </p>

            <h2>
              Skin Score Trend
            </h2>

          </div>

          <span className="progress-section-icon">
            📈
          </span>

        </div>


        {progress.trend &&
        progress.trend.length > 0 ? (

          <div className="trend-container">

            {progress.trend.map(
              (item, index) => {

                const score =
                  Number(item.skin_score) || 0;

                return (

                  <div
                    className="trend-item"
                    key={
                      item.assessment_id ??
                      index
                    }
                  >

                    <div className="trend-number">
                      {Math.round(score)}
                    </div>

                    <div className="trend-content">

                      <div className="trend-bar-container">

                        <div
                          className="trend-bar"
                          style={{
                            width: `${Math.min(
                              Math.max(
                                score,
                                0
                              ),
                              100
                            )}%`,
                          }}
                        />

                      </div>

                      <div className="trend-meta">

                        <span>
                          Assessment #{index + 1}
                        </span>

                        <span>
                          {formatDate(
                            item.date
                          )}
                        </span>

                      </div>

                    </div>

                  </div>

                );

              }
            )}

          </div>

        ) : (

          <div className="comparison-empty">
            No assessment trend data available yet.
          </div>

        )}

      </section>


      {/* =================================================
          BEFORE / AFTER
      ================================================= */}

      <section className="progress-section">

        <div className="progress-section-heading">

          <div>

            <p className="progress-section-kicker">
              PROGRESS COMPARISON
            </p>

            <h2>
              Before & After Comparison
            </h2>

          </div>

          <span className="progress-section-icon">
            🔄
          </span>

        </div>


        {comparison?.comparison ? (

          <div className="comparison-grid">

            {Object.entries(
              comparison.comparison
            ).map(
              ([key, value]) => {

                const change =
                  Number(value.change) || 0;

                return (

                  <div
                    className="comparison-card"
                    key={key}
                  >

                    <h3>
                      {key
                        .replaceAll("_", " ")
                        .replace(
                          /\b\w/g,
                          (char) =>
                            char.toUpperCase()
                        )}
                    </h3>

                    <div className="comparison-values">

                      <div>

                        <span>
                          Before
                        </span>

                        <strong>
                          {value.before}
                        </strong>

                      </div>


                      <div>

                        <span>
                          After
                        </span>

                        <strong>
                          {value.after}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Change
                        </span>

                        <strong
                          className={
                            change > 0
                              ? "change-positive"
                              : change < 0
                              ? "change-negative"
                              : "change-neutral"
                          }
                        >
                          {formatChange(change)}
                        </strong>

                      </div>

                    </div>

                  </div>

                );

              }
            )}

          </div>

        ) : (

          <div className="comparison-empty">

            <div className="comparison-empty-icon">
              📊
            </div>

            <h3>
              Before & after comparison
              is not available yet
            </h3>

            <p>
              {comparison?.message ||
                "At least two assessments are required to compare your progress."}
            </p>

            <button
              className="progress-secondary-button"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              Generate Another Assessment
            </button>

          </div>

        )}

      </section>


      {/* =================================================
          FIRST ASSESSMENT
      ================================================= */}

      {first && (

        <section className="progress-section">

          <div className="progress-section-heading">

            <div>

              <p className="progress-section-kicker">
                STARTING POINT
              </p>

              <h2>
                First Recorded Assessment
              </h2>

            </div>

            <span className="progress-section-icon">
              🌱
            </span>

          </div>


          <div className="first-assessment">

            <div>

              <span>
                Skin Score
              </span>

              <strong
                className={getScoreClass(
                  first.skin_score
                )}
              >
                {first.skin_score}
              </strong>

            </div>


            <div>

              <span>
                Primary Concern
              </span>

              <strong>
                {first.primary_concern ||
                  "N/A"}
              </strong>

            </div>


            <div>

              <span>
                Health Status
              </span>

              <strong>
                {first.health_status ||
                  "N/A"}
              </strong>

            </div>


            <div>

              <span>
                Assessment Date
              </span>

              <strong>
                {formatDate(
                  first.created_at
                )}
              </strong>

            </div>

          </div>

        </section>

      )}


      {/* =================================================
          FOOTER INSIGHT
      ================================================= */}

      <section className="progress-insight">

        <div className="progress-insight-icon">
          ✨
        </div>

        <div>

          <p className="progress-section-kicker">
            PERSONALIZED INSIGHT
          </p>

          <h2>
            Keep tracking your skin health
          </h2>

          <p>
            Regular assessments help you understand
            how your skin health changes over time.
            Continue monitoring your skin profile,
            lifestyle, sleep, hydration, and routine
            consistency.
          </p>

        </div>

      </section>


    </div>
  );
}


export default Progress;
