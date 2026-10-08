import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RoutineAdherence.css";
import { useAuth } from "../context/useAuth";

const API_URL = "http://127.0.0.1:8000";

function RoutineAdherence() {
  const navigate = useNavigate();

  const [routine, setRoutine] = useState(null);
  const [adherence, setAdherence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { user } = useAuth();

  const token = localStorage.getItem("token");

  const userId =
    user?.user?.id ||
    user?.id ||
    user?.user_id;

  const getActivityText = (activity) => {
    if (typeof activity === "string") {
      return activity;
    }

    if (activity && typeof activity === "object") {
      return (
        activity.activity ||
        activity.name ||
        activity.step ||
        activity.description ||
        JSON.stringify(activity)
      );
    }

    return String(activity);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const routineResponse = await fetch(
        `${API_URL}/api/routines/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const routineData = await routineResponse.json();

      if (!routineResponse.ok) {
        throw new Error(
          routineData.detail ||
            "Unable to load skincare routine."
        );
      }

      setRoutine(routineData);

      const adherenceResponse = await fetch(
        `${API_URL}/api/routine-adherence/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const adherenceData = await adherenceResponse.json();

      if (!adherenceResponse.ok) {
        throw new Error(
          adherenceData.detail ||
            "Unable to load routine adherence."
        );
      }

      setAdherence(adherenceData);
    } catch (err) {
      console.error("Routine Adherence Error:", err);

      setError(
        err.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (userId && token) {
        void loadData();
      } else {
        setError("Please login again.");
        setLoading(false);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [userId, token, loadData]);

  const parseRoutine = (routineData) => {
    if (!routineData) {
      return [];
    }

    if (Array.isArray(routineData)) {
      return routineData.map(getActivityText);
    }

    if (typeof routineData === "string") {
      return routineData
        .split("\n")
        .map((item) =>
          item.replace(/^\d+\.\s*/, "").trim()
        )
        .filter(Boolean);
    }

    if (typeof routineData === "object") {
      return [getActivityText(routineData)];
    }

    return [];
  };

  const isCompleted = (activity, routineType) => {
    if (!adherence?.records) {
      return false;
    }

    const activityText =
      getActivityText(activity);

    return adherence.records.some((record) => {
      const recordActivity =
        getActivityText(record.activity);

      return (
        recordActivity.toLowerCase() ===
          activityText.toLowerCase() &&
        record.routine_type === routineType &&
        Boolean(record.completed)
      );
    });
  };

  const markCompleted = async (
    routineType,
    activity
  ) => {
    try {
      setMessage("");
      setError("");

      const activityText =
        getActivityText(activity);

      const params = new URLSearchParams({
        routine_id: String(routine.id),
        routine_type: routineType,
        activity: activityText,
        completed: "true",
      });

      const response = await fetch(
        `${API_URL}/api/routine-adherence/${userId}?${params.toString()}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to record routine adherence."
        );
      }

      setMessage(
        `${activityText} marked as completed.`
      );

      await loadData();
    } catch (err) {
      console.error(
        "Mark Complete Error:",
        err
      );

      setError(
        err.message ||
          "Unable to mark activity complete."
      );
    }
  };

  if (loading) {
    return (
      <div className="routine-adherence-page">
        <div className="routine-loading-card">
          <div className="loading-spinner"></div>
          <h2>Preparing your routine</h2>
          <p>
            We're loading your personalized skincare plan...
          </p>
        </div>
      </div>
    );
  }

  if (error && !routine) {
    return (
      <div className="routine-adherence-page">
        <div className="routine-error-card">
          <div className="state-icon">⚠️</div>
          <h2>Unable to load your routine</h2>
          <p>{error}</p>

          <button
            className="routine-primary-btn"
            onClick={() => loadData()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!routine) {
    return (
      <div className="routine-adherence-page">
        <div className="routine-empty-card">
          <div className="state-icon">🧴</div>

          <h2>No Routine Found</h2>

          <p>
            Please complete your skin assessment
            first to generate your personalized
            skincare routine.
          </p>

          <button
            className="routine-primary-btn"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const morningRoutine = parseRoutine(
    routine.morning_routine
  );

  const eveningRoutine = parseRoutine(
    routine.evening_routine
  );

  const weeklyRoutine = routine.weekly_treatment
    ? [getActivityText(routine.weekly_treatment)]
    : [];

  const totalActivities =
    morningRoutine.length +
    eveningRoutine.length;

  const completedActivities =
    morningRoutine.filter((activity) =>
      isCompleted(activity, "morning")
    ).length +
    eveningRoutine.filter((activity) =>
      isCompleted(activity, "evening")
    ).length;

  const adherencePercentage =
    totalActivities > 0
      ? Math.round(
          (completedActivities /
            totalActivities) *
            100
        )
      : 0;

  return (
    <div className="routine-adherence-page">

      {/* BACK TO DASHBOARD */}
      <div className="routine-topbar">
        <button
          className="back-dashboard-btn"
          onClick={() => navigate("/dashboard")}
        >
          <span>←</span>
          Back to Dashboard
        </button>
      </div>

      {/* HERO */}
      <section className="routine-hero">
        <div className="routine-hero-content">
          <span className="routine-eyebrow">
            ✦ DAILY SKINCARE TRACKER
          </span>

          <h1>
            Stay consistent with
            <span> your routine.</span>
          </h1>

          <p>
            Track your personalized skincare
            routine, complete daily steps and
            build healthy consistency over time.
          </p>

          <div className="routine-hero-tags">
            <span>🌿 Personalized</span>
            <span>✓ Daily tracking</span>
            <span>💧 Skin focused</span>
          </div>
        </div>

        <div className="routine-hero-visual">
          <div className="routine-progress-circle">
            <strong>{adherencePercentage}%</strong>
            <span>Today</span>
          </div>

          <div className="hero-float float-one">
            ☀️
          </div>

          <div className="hero-float float-two">
            🌿
          </div>

          <div className="hero-float float-three">
            💧
          </div>
        </div>
      </section>

      {/* SUCCESS MESSAGE */}
      {message && (
        <div className="routine-success">
          <span>✓</span>
          <div>
            <strong>Routine updated</strong>
            <p>{message}</p>
          </div>
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div className="routine-alert">
          <span>⚠️</span>
          <div>
            <strong>Something needs attention</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* STATISTICS */}
      <section className="routine-stats-grid">

        <div className="routine-stat-card">
          <div className="stat-icon green">
            ✓
          </div>

          <div>
            <strong>
              {completedActivities}
            </strong>

            <span>Completed today</span>
          </div>
        </div>

        <div className="routine-stat-card">
          <div className="stat-icon blue">
            ◉
          </div>

          <div>
            <strong>
              {totalActivities}
            </strong>

            <span>Total daily steps</span>
          </div>
        </div>

        <div className="routine-stat-card">
          <div className="stat-icon purple">
            %
          </div>

          <div>
            <strong>
              {adherencePercentage}%
            </strong>

            <span>Today's adherence</span>
          </div>
        </div>
      </section>

      {/* ROUTINE INFORMATION */}
      <section className="routine-profile-card">

        <div className="routine-profile-heading">
          <div>
            <span className="routine-section-kicker">
              YOUR PERSONALIZED PLAN
            </span>

            <h2>
              Your skincare routine
            </h2>

            <p>
              Your routine is adapted to your
              skin profile and current needs.
            </p>
          </div>

          <div className="routine-profile-badge">
            ✦ AI Personalized
          </div>
        </div>

        <div className="routine-profile-details">

          <div className="profile-detail">
            <span className="detail-icon">
              🧴
            </span>

            <div>
              <small>Skin Type</small>
              <strong>
                {routine.skin_type ||
                  "Not specified"}
              </strong>
            </div>
          </div>

          <div className="profile-detail">
            <span className="detail-icon">
              🎯
            </span>

            <div>
              <small>Primary Concern</small>
              <strong>
                {routine.primary_concern ||
                  "Not specified"}
              </strong>
            </div>
          </div>

          <div className="profile-detail">
            <span className="detail-icon">
              🌿
            </span>

            <div>
              <small>Season</small>
              <strong>
                {routine.season ||
                  "Current"}
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* PROGRESS */}
      <section className="routine-progress-card">

        <div className="progress-heading">
          <div>
            <span className="routine-section-kicker">
              TODAY'S PROGRESS
            </span>

            <h2>
              Keep your streak going
            </h2>
          </div>

          <strong>
            {completedActivities}/{totalActivities}
          </strong>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${adherencePercentage}%`,
            }}
          />
        </div>

        <div className="progress-footer">
          <span>
            {adherencePercentage === 100
              ? "Excellent! You've completed your routine."
              : adherencePercentage >= 50
              ? "You're doing well. Keep going!"
              : "Complete your routine steps to build consistency."}
          </span>

          <strong>
            {adherencePercentage}%
          </strong>
        </div>
      </section>

      {/* MORNING */}
      <RoutineBlock
        title="Morning Routine"
        icon="☀️"
        subtitle="Start your day with consistent skin care."
        activities={morningRoutine}
        routineType="morning"
        isCompleted={isCompleted}
        markCompleted={markCompleted}
        getActivityText={getActivityText}
      />

      {/* EVENING */}
      <RoutineBlock
        title="Evening Routine"
        icon="🌙"
        subtitle="Wind down and support your skin overnight."
        activities={eveningRoutine}
        routineType="evening"
        isCompleted={isCompleted}
        markCompleted={markCompleted}
        getActivityText={getActivityText}
      />

      {/* WEEKLY */}
      {weeklyRoutine.length > 0 && (
        <section className="routine-section-card">

          <div className="routine-section-heading">
            <div className="routine-heading-icon weekly">
              📅
            </div>

            <div>
              <span className="routine-section-kicker">
                WEEKLY CARE
              </span>

              <h2>Weekly Treatment</h2>

              <p>
                Additional care to support your
                regular routine.
              </p>
            </div>
          </div>

          <div className="weekly-treatment-card">
            <div className="weekly-number">
              01
            </div>

            <div>
              <strong>
                {weeklyRoutine[0]}
              </strong>

              <p>
                Follow this treatment according
                to your personalized routine.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* SEASONAL */}
      {routine.seasonal_recommendations && (
        <section className="routine-section-card">

          <div className="routine-section-heading">
            <div className="routine-heading-icon seasonal">
              🌿
            </div>

            <div>
              <span className="routine-section-kicker">
                SEASONAL CARE
              </span>

              <h2>
                Seasonal Recommendations
              </h2>
            </div>
          </div>

          <div className="recommendation-box">
            <span>✦</span>

            <p>
              {getActivityText(
                routine.seasonal_recommendations
              )}
            </p>
          </div>
        </section>
      )}

      {/* ADAPTIVE */}
      {routine.adaptive_updates && (
        <section className="routine-section-card">

          <div className="routine-section-heading">
            <div className="routine-heading-icon adaptive">
              🔄
            </div>

            <div>
              <span className="routine-section-kicker">
                SMART UPDATES
              </span>

              <h2>Adaptive Updates</h2>
            </div>
          </div>

          <div className="recommendation-box adaptive-box">
            <span>✦</span>

            <p>
              {getActivityText(
                routine.adaptive_updates
              )}
            </p>
          </div>
        </section>
      )}

      {/* FOOTER NOTE */}
      <div className="routine-footer-note">
        <span>💚</span>

        <p>
          Consistency matters more than perfection.
          Complete your routine regularly and
          give your skin time to respond.
        </p>
      </div>

    </div>
  );
}

function RoutineBlock({
  title,
  icon,
  subtitle,
  activities,
  routineType,
  isCompleted,
  markCompleted,
  getActivityText,
}) {
  return (
    <section className="routine-section-card">

      <div className="routine-section-heading">

        <div className="routine-heading-icon">
          {icon}
        </div>

        <div>
          <span className="routine-section-kicker">
            DAILY ROUTINE
          </span>

          <h2>{title}</h2>

          <p>{subtitle}</p>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="routine-no-activities">
          <span>🧴</span>
          <p>
            No {routineType} routine available.
          </p>
        </div>
      ) : (
        <div className="activity-list">

          {activities.map(
            (activity, index) => {
              const completed =
                isCompleted(
                  activity,
                  routineType
                );

              return (
                <div
                  className={`routine-activity ${
                    completed
                      ? "activity-completed"
                      : ""
                  }`}
                  key={index}
                >

                  <div
                    className={`activity-step ${
                      completed
                        ? "step-completed"
                        : ""
                    }`}
                  >
                    {completed
                      ? "✓"
                      : String(index + 1).padStart(
                          2,
                          "0"
                        )}
                  </div>

                  <div className="activity-details">
                    <span className="activity-label">
                      STEP {index + 1}
                    </span>

                    <strong>
                      {getActivityText(activity)}
                    </strong>

                    {completed && (
                      <span className="completed-label">
                        ✓ Completed today
                      </span>
                    )}
                  </div>

                  <button
                    className={
                      completed
                        ? "activity-completed-btn"
                        : "activity-complete-btn"
                    }
                    disabled={completed}
                    onClick={() =>
                      markCompleted(
                        routineType,
                        activity
                      )
                    }
                  >
                    {completed
                      ? "Completed ✓"
                      : "Mark Complete"}
                  </button>
                </div>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}

export default RoutineAdherence;