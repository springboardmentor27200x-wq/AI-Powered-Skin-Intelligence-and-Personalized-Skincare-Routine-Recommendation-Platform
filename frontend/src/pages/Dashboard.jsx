import {
  requestNotificationPermission,
  showBrowserNotification,
} from "../services/browserNotifications";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getSkinProfile,
  getLifestyle,
  getSleep,
  getClientConsultations,
  getSkinAssessment,
  createSkinAssessment,
  getPersonalizedRoutine,
  createPersonalizedRoutine,

  // Notifications
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  generateAllNotifications,
} from "../services/api";

import "./Dashboard.css";


function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [skinProfile, setSkinProfile] = useState(null);
  const [lifestyle, setLifestyle] = useState(null);
  const [sleep, setSleep] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [routine, setRoutine] = useState(null);

  const [loading, setLoading] = useState(true);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [routineLoading, setRoutineLoading] = useState(false);

  const [error, setError] = useState("");

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(
    typeof Notification !== "undefined" && Notification.permission === "granted"
  );
 

  // Keep the in-app notification switch in sync with browser permission.
  useEffect(() => {
    if ("Notification" in window) {
      const savedSetting = localStorage.getItem("browser_notifications_enabled");
      setBrowserNotificationsEnabled(
        savedSetting !== "false" && Notification.permission === "granted"
      );
    }
  }, []);

  const handleBrowserNotificationToggle = async () => {
    if (!("Notification" in window)) {
      alert("Browser notifications are not supported in this browser.");
      return;
    }

    if (browserNotificationsEnabled) {
      // A website cannot revoke browser permission with JavaScript.
      // This switch disables notification popups from this application.
      setBrowserNotificationsEnabled(false);
      localStorage.setItem("browser_notifications_enabled", "false");
      return;
    }

    const allowed = await requestNotificationPermission();

    if (allowed) {
      setBrowserNotificationsEnabled(true);
      localStorage.setItem("browser_notifications_enabled", "true");

      try {
        await showBrowserNotification(
          "🔔 Notifications Enabled",
          "You will now receive new skincare alerts here."
        );
      } catch (browserNotificationError) {
        console.warn(
          "Browser notification failed:",
          browserNotificationError
        );
      }
    }
  };

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


  const getUserId = () => {
    return (
      user?.user_id ||
      user?.user?.id ||
      user?.id
    );
  };


  const loadDashboardData = useCallback(async () => {
    const userId = getUserId();

    if (!userId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [
        profileResponse,
        lifestyleResponse,
        sleepResponse,
        consultationResponse,
        assessmentResponse,
        routineResponse,
      ] = await Promise.allSettled([
        getSkinProfile(userId),
        getLifestyle(userId),
        getSleep(userId),
        getClientConsultations(userId),
        getSkinAssessment(userId),
        getPersonalizedRoutine(userId),
      ]);

      if (profileResponse.status === "fulfilled") {
        setSkinProfile(profileResponse.value);
      }

      if (lifestyleResponse.status === "fulfilled") {
        const lifestyleData = lifestyleResponse.value;
        const latestLifestyle = Array.isArray(lifestyleData)
          ? lifestyleData[lifestyleData.length - 1]
          : lifestyleData;
        setLifestyle(latestLifestyle || null);
      }

      if (sleepResponse.status === "fulfilled") {
        const sleepData = sleepResponse.value;
        const latestSleep = Array.isArray(sleepData)
          ? sleepData[sleepData.length - 1]
          : sleepData;
        setSleep(latestSleep || null);
      }

      if (consultationResponse.status === "fulfilled") {
        const data = consultationResponse.value;

        if (Array.isArray(data)) {
          setConsultations(data);
        } else if (Array.isArray(data?.consultations)) {
          setConsultations(data.consultations);
        } else {
          setConsultations([]);
        }
      }

      if (assessmentResponse.status === "fulfilled") {
        const assessmentData =
          assessmentResponse.value?.assessment ||
          assessmentResponse.value;
        setAssessment(assessmentData);
      }

      if (routineResponse.status === "fulfilled") {
        setRoutine(routineResponse.value);
      }
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError("Unable to load some dashboard information.");
    } finally {
      setLoading(false);
    }
  }, [user]);


  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);


  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  const loadNotifications = useCallback(async () => {
    const userId = getUserId();

    if (!userId) {
      return;
    }

    setNotificationsLoading(true);
    setNotificationError("");

    try {
      const response = await getNotifications(userId);

      const notificationData = Array.isArray(response)
        ? response
        : Array.isArray(response?.notifications)
        ? response.notifications
        : [];

      // Show a browser popup only for new unread backend notifications.
      // Notification IDs are stored locally so the same notification
      // does not appear again every time the dashboard is refreshed.
      if (
        notificationData.length > 0 &&
        browserNotificationsEnabled &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        const notifiedKey = `browser_notified_notifications_${userId}`;
        let alreadyNotified = [];

        try {
          alreadyNotified = JSON.parse(
            localStorage.getItem(notifiedKey) || "[]"
          );

          if (!Array.isArray(alreadyNotified)) {
            alreadyNotified = [];
          }
        } catch {
          alreadyNotified = [];
        }

        const newUnreadNotifications = notificationData.filter(
          (notification) =>
            !notification.is_read &&
            notification.id != null &&
            !alreadyNotified.includes(notification.id)
        );

        if (newUnreadNotifications.length > 0) {
          for (const notification of newUnreadNotifications) {
            try {
              await showBrowserNotification(
                notification.title || "Skin Intelligence Alert",
                notification.message ||
                  "You have a new skincare notification."
              );
            } catch (browserNotificationError) {
              console.warn(
                "Browser notification failed:",
                browserNotificationError
              );
            }
          }

          const updatedNotifiedIds = [
            ...alreadyNotified,
            ...newUnreadNotifications.map(
              (notification) => notification.id
            ),
          ];

          localStorage.setItem(
            notifiedKey,
            JSON.stringify(updatedNotifiedIds.slice(-100))
          );
        }
      }

      setNotifications(notificationData);
    } catch (err) {
      console.error("Notification loading error:", err);
      setNotificationError(
        err?.message || "Unable to load notifications."
      );
    } finally {
      setNotificationsLoading(false);
    }
  }, [user, browserNotificationsEnabled]);


  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, loadNotifications]);


  const handleMarkNotificationRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);

      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (err) {
      console.error("Unable to mark notification as read:", err);

      setNotificationError(
        err?.message || "Unable to mark notification as read."
      );
    }
  };


  const handleMarkAllNotificationsRead = async () => {
    const userId = getUserId();

    if (!userId) {
      return;
    }

    try {
      await markAllNotificationsRead(userId);

      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );
    } catch (err) {
      console.error("Unable to mark all notifications as read:", err);

      setNotificationError(
        err?.message || "Unable to mark all notifications as read."
      );
    }
  };


  const handleGenerateNotifications = async () => {
    const userId = getUserId();

    if (!userId) {
      return;
    }

    try {
      setNotificationsLoading(true);
      setNotificationError("");

      await generateAllNotifications(userId);

      await loadNotifications();
    } catch (err) {
      console.error("Unable to generate notifications:", err);

      setNotificationError(
        err?.message || "Unable to generate notifications."
      );
    } finally {
      setNotificationsLoading(false);
    }
  };


  // ============================================================
  // ASSESSMENT
  // ============================================================

  const handleGenerateAssessment = async () => {
    const userId = getUserId();

    if (!userId) {
      return;
    }

    setAssessmentLoading(true);
    setError("");

    try {
      const result = await createSkinAssessment(userId);
      const assessmentData = result?.assessment || result;
      setAssessment(assessmentData);

      // Generate fresh notifications after assessment
      try {
        await generateAllNotifications(userId);
        await loadNotifications();
      } catch (notificationErr) {
        console.warn(
          "Notification generation failed:",
          notificationErr
        );
      }
    } catch (err) {
      console.error("Assessment generation error:", err);

      setError(
        err?.message || "Unable to generate skin assessment."
      );
    } finally {
      setAssessmentLoading(false);
    }
  };


  // ============================================================
  // PERSONALIZED ROUTINE
  // ============================================================

  const handleGenerateRoutine = async () => {
    const userId = getUserId();

    if (!userId) {
      return;
    }

    setRoutineLoading(true);
    setError("");

    try {
      const result = await createPersonalizedRoutine(userId);
      setRoutine(result);

      // Generate fresh notifications
      try {
        await generateAllNotifications(userId);
        await loadNotifications();
      } catch (notificationErr) {
        console.warn(
          "Notification generation failed:",
          notificationErr
        );
      }
    } catch (err) {
      console.error("Routine generation error:", err);

      setError(
        err?.message || "Unable to generate personalized routine."
      );
    } finally {
      setRoutineLoading(false);
    }
  };


  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };


  // ============================================================
  // HELPERS
  // ============================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Recently";
    }

    try {
      return new Date(dateValue).toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return "Recently";
    }
  };


  const formatRoutineSteps = (routineValue) => {
    if (!routineValue) return [];
    if (Array.isArray(routineValue)) {
      return routineValue.map((step) =>
        typeof step === "string"
          ? step.trim()
          : step?.product_name || step?.name || JSON.stringify(step)
      ).filter(Boolean);
    }
    if (typeof routineValue === "string") {
      return routineValue
        .split(/\s+(?=\d+\.\s)/)
        .map((step) => step.trim())
        .filter(Boolean)
        .map((step) => step.replace(/^\d+\.\s*/, ""));
    }
    return [];
  };


  const getNotificationIcon = (notification) => {
    const type = notification?.notification_type || "";

    if (type.startsWith("health_")) {
      return "❤️";
    }

    if (type.includes("sleep")) {
      return "😴";
    }

    if (type.includes("hydration")) {
      return "💧";
    }

    if (type.includes("routine")) {
      return "✨";
    }

    if (type.includes("product")) {
      return "🧴";
    }

    if (type.includes("progress")) {
      return "📈";
    }

    return "🔔";
  };


  const unreadNotifications = notifications.filter(
    (notification) => !notification.is_read
  );

  const unreadCount = unreadNotifications.length;

  const rawSkinScore =
    assessment?.skin_score ??
    assessment?.skin_health_score ??
    assessment?.overall_score;

  const skinScoreNumber = Number(rawSkinScore);
  const skinScoreForCircle = Number.isFinite(skinScoreNumber)
    ? Math.min(100, Math.max(0, skinScoreNumber))
    : 0;


  // ============================================================
  // LOADING
  // ============================================================

  if (loading && !user) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your skin intelligence dashboard...</p>
      </div>
    );
  }


  return (
    <div className="dashboard-page">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside className="dashboard-sidebar">

        <div className="dashboard-brand">
          <div className="brand-logo">
            ✨
          </div>

          <div>
            <h2>Skin Intelligence</h2>
            <span>Personalized Skincare</span>
          </div>
        </div>


        <nav className="dashboard-navigation">

          <button
            className="navigation-item active"
            onClick={() => navigate("/dashboard")}
          >
            <span>🏠</span>
            <span>Dashboard</span>
          </button>


          <button
            className="navigation-item"
            onClick={() => navigate("/skin-profile")}
          >
            <span>👤</span>
            <span>Skin Profile</span>
          </button>


          <button
            className="navigation-item"
            onClick={() => navigate("/lifestyle")}
          >
            <span>🌱</span>
            <span>Lifestyle</span>
          </button>


          <button
            className="navigation-item"
            onClick={() => navigate("/sleep")}
          >
            <span>😴</span>
            <span>Sleep</span>
          </button>


          <button
            className="navigation-item"
            onClick={() => navigate("/progress")}
          >
            <span>📈</span>
            <span>Progress</span>
          </button>


          <button
            className="navigation-item"
            onClick={() => navigate("/health-dashboard")}
          >
            <span>📊</span>
            <span>Health Dashboard</span>
          </button>


          <button
            className="navigation-item"
            onClick={() => navigate("/routine-adherence")}
          >
            <span>✅</span>
            <span>Routine Adherence</span>
          </button>
          <div
  className="sidebar-item"
  onClick={() => navigate("/reports")}
>
  <span className="sidebar-icon">📄</span>
  <span>Reports</span>
</div>

        </nav>


        <div className="dashboard-sidebar-bottom">

          <button
            className="navigation-item"
            onClick={() => navigate("/consultations")}
          >
            <span>💬</span>
            <span>Consultations</span>
          </button>


          <button
            className="navigation-item logout-item"
            onClick={handleLogout}
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
          

        </div>

      </aside>


      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="dashboard-main">

        {/* HEADER */}

        <header className="dashboard-header">

          <div>
            <p className="header-greeting">
              Welcome back 👋
            </p>

            <h1>
              {user?.name || "User"}
            </h1>

            <p className="header-subtitle">
              Your personalized skin intelligence overview
            </p>
          </div>


          <div className="header-user">

            <div className="header-avatar">
              {(user?.name || "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="header-user-info">
              <strong>
                {user?.name || "User"}
              </strong>

              <span>
                {user?.role || "user"}
              </span>
            </div>

          </div>

        </header>


        {/* GLOBAL ERROR */}

        {error && (
          <div className="dashboard-error">
            <span>⚠️</span>
            <span>{error}</span>

            <button
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}


        {/* ====================================================
            NOTIFICATION CENTER
        ==================================================== */}

        <section className="dashboard-section notification-section">

          <div className="section-heading">

            <div>
              <span className="section-label">
                SMART ALERTS
              </span>

              <h2>
                Notification Center

                {unreadCount > 0 && (
                  <span className="notification-count">
                    {unreadCount}
                  </span>
                )}
              </h2>

              <p>
                Stay updated with your skincare, lifestyle,
                sleep and routine insights.
              </p>
            </div>


            <div className="notification-actions">
              <button
                className={`secondary-button ${
                  browserNotificationsEnabled
                    ? "notification-toggle-enabled"
                    : "notification-toggle-disabled"
                }`}
                onClick={handleBrowserNotificationToggle}
                type="button"
              >
                {browserNotificationsEnabled
                  ? "🔕 Disable Notifications"
                  : "🔔 Enable Notifications"}
              </button>
              <button
                className="secondary-button"
                onClick={handleGenerateNotifications}
                disabled={notificationsLoading}
              >
                {notificationsLoading
                  ? "Refreshing..."
                  : "🔄 Refresh Alerts"}
              </button>


              {unreadCount > 0 && (
                <button
                  className="notification-read-all"
                  onClick={handleMarkAllNotificationsRead}
                >
                  Mark all as read
                </button>
              )}

            </div>

          </div>


          {notificationError && (
            <div className="notification-error">
              <span>⚠️</span>
              <span>{notificationError}</span>
            </div>
          )}


          {notificationsLoading && notifications.length === 0 ? (

            <div className="notification-empty">

              <div className="notification-empty-icon">
                🔔
              </div>

              <p>
                Loading your smart alerts...
              </p>

            </div>

          ) : notifications.length === 0 ? (

            <div className="notification-empty">

              <div className="notification-empty-icon">
                🔔
              </div>

              <h3>
                No new alerts
              </h3>

              <p>
                You're all caught up. New skincare
                insights will appear here automatically.
              </p>

            </div>

          ) : (

            <div className="notification-list">

              {notifications
                .slice(0, 6)
                .map((notification) => (

                  <div
                    key={notification.id}
                    className={`notification-card ${
                      notification.is_read
                        ? "notification-read"
                        : "notification-unread"
                    }`}
                  >

                    <div className="notification-icon">
                      {getNotificationIcon(notification)}
                    </div>


                    <div className="notification-content">

                      <div className="notification-title-row">

                        <h3>
                          {notification.title ||
                            "Skin Intelligence Alert"}
                        </h3>

                        {!notification.is_read && (
                          <span className="notification-new">
                            NEW
                          </span>
                        )}

                      </div>


                      <p>
                        {notification.message ||
                          "You have a new skincare insight."}
                      </p>


                      <span className="notification-date">
                        {formatDate(notification.created_at)}
                      </span>

                    </div>


                    {!notification.is_read && (
                      <button
                        className="notification-mark-read"
                        onClick={() =>
                          handleMarkNotificationRead(
                            notification.id
                          )
                        }
                      >
                        Mark read
                      </button>
                    )}

                  </div>

                ))}

            </div>

          )}

        </section>


        {/* ====================================================
            SKIN HEALTH OVERVIEW
        ==================================================== */}

        <section className="dashboard-section">

          <div className="section-heading">

            <div>
              <span className="section-label">
                YOUR SKIN
              </span>

              <h2>
                Skin Health Overview
              </h2>

              <p>
                Your current personalized skin intelligence.
              </p>
            </div>

          </div>


          <div className="overview-grid">

            {/* SKIN PROFILE */}

            <div className="overview-card">

              <div className="overview-card-header">

                <div className="overview-icon">
                  🌸
                </div>

                <div>
                  <h3>Skin Profile</h3>
                  <span>Current profile</span>
                </div>

              </div>


              {skinProfile ? (

                <div className="overview-card-content">

                  <div className="overview-value">
                    {skinProfile.skin_type ||
                      "Not specified"}
                  </div>

                  <div className="overview-detail">
                    Skin Type
                  </div>


                  {skinProfile.concerns && (
                    <div className="overview-tags">

                      {Array.isArray(
                        skinProfile.concerns
                      )
                        ? skinProfile.concerns
                            .slice(0, 3)
                            .map((concern, index) => (
                              <span
                                key={index}
                                className="overview-tag"
                              >
                                {concern}
                              </span>
                            ))
                        : (
                          <span className="overview-tag">
                            {skinProfile.concerns}
                          </span>
                        )}

                    </div>
                  )}

                </div>

              ) : (

                <div className="empty-state">

                  <p>
                    Complete your skin profile
                    to get personalized insights.
                  </p>

                  <button
                    className="card-link"
                    onClick={() =>
                      navigate("/skin-profile")
                    }
                  >
                    Complete Profile →
                  </button>

                </div>

              )}

            </div>


            {/* LIFESTYLE */}

            <div className="overview-card">

              <div className="overview-card-header">

                <div className="overview-icon">
                  🌱
                </div>

                <div>
                  <h3>Lifestyle</h3>
                  <span>Daily wellness</span>
                </div>

              </div>


              {lifestyle ? (

                <div className="overview-metrics">

                  <div>
                    <strong>
                      {lifestyle.water_intake ?? "--"}
                    </strong>
                    <span>Water (L)</span>
                  </div>

                  <div>
                    <strong>
                      {lifestyle.exercise_minutes ?? "--"}
                    </strong>
                    <span>Exercise (min)</span>
                  </div>

                  <div>
                    <strong>
                      {lifestyle.stress_level ?? "--"}
                    </strong>
                    <span>Stress</span>
                  </div>

                </div>

              ) : (

                <div className="empty-state">

                  <p>
                    No lifestyle data available.
                  </p>

                  <button
                    className="card-link"
                    onClick={() =>
                      navigate("/lifestyle")
                    }
                  >
                    Add Lifestyle →
                  </button>

                </div>

              )}

            </div>


            {/* SLEEP */}

            <div className="overview-card">

              <div className="overview-card-header">

                <div className="overview-icon">
                  😴
                </div>

                <div>
                  <h3>Sleep</h3>
                  <span>Recovery</span>
                </div>

              </div>


              {sleep ? (

                <div className="overview-metrics">

                  <div>
                    <strong>
                      {sleep.sleep_hours ?? "--"}
                    </strong>
                    <span>Hours</span>
                  </div>

                  <div>
                    <strong>
                      {sleep.sleep_quality ?? "--"}
                    </strong>
                    <span>Quality</span>
                  </div>

                </div>

              ) : (

                <div className="empty-state">

                  <p>
                    No sleep information available.
                  </p>

                  <button
                    className="card-link"
                    onClick={() =>
                      navigate("/sleep")
                    }
                  >
                    Add Sleep Data →
                  </button>

                </div>

              )}

            </div>


            {/* PROGRESS */}

            <div className="overview-card">

              <div className="overview-card-header">

                <div className="overview-icon">
                  📈
                </div>

                <div>
                  <h3>Progress</h3>
                  <span>Skin journey</span>
                </div>

              </div>


              <div className="overview-card-content">

                <div className="overview-value">
                  {rawSkinScore ?? "--"}
                </div>

                <div className="overview-detail">
                  Current skin health score
                </div>

                <button
                  className="card-link"
                  onClick={() =>
                    navigate("/progress")
                  }
                >
                  View Progress →
                </button>

              </div>

            </div>

          </div>

        </section>


        {/* ====================================================
            AI SKIN ASSESSMENT
        ==================================================== */}

        <section className="dashboard-section">

          <div className="section-heading">

            <div>
              <span className="section-label">
                AI ANALYSIS
              </span>

              <h2>
                Skin Assessment
              </h2>

              <p>
                AI-powered analysis of your current
                skin health.
              </p>
            </div>


            <button
              className="primary-button"
              onClick={handleGenerateAssessment}
              disabled={assessmentLoading}
            >
              {assessmentLoading
                ? "Analyzing..."
                : assessment
                ? "🔄 Reassess Skin"
                : "✨ Analyze My Skin"}
            </button>

          </div>


          {!assessment ? (

            <div className="empty-state large-empty-state">

              <div className="empty-state-icon">
                🔬
              </div>

              <h3>
                Get your AI skin assessment
              </h3>

              <p>
                Our skin intelligence engine analyzes
                your profile, lifestyle and sleep data
                to generate personalized skin insights.
              </p>

              <button
                className="primary-button"
                onClick={handleGenerateAssessment}
                disabled={assessmentLoading}
              >
                {assessmentLoading
                  ? "Analyzing..."
                  : "Start Skin Assessment"}
              </button>

            </div>

          ) : (

            <div className="assessment-container">

              {/* SCORE */}

              <div className="assessment-score-card">

                <div
                  className="score-circle"
                  style={{
                    background: `conic-gradient(#0f9f8f ${skinScoreForCircle}%, #e2f3ef ${skinScoreForCircle}% 100%)`,
                  }}
                  aria-label={`Skin score ${skinScoreForCircle} out of 100`}
                >
                  <span className="score-number">
                    {Number.isFinite(skinScoreNumber)
                      ? skinScoreNumber.toFixed(2)
                      : "--"}
                  </span>

                  <span className="score-label">
                    / 100
                  </span>
                </div>


                <div className="score-information">

                  <span className="score-caption">
                    Overall Skin Health
                  </span>

                  <h3>
                    {assessment.health_status ||
                      assessment.status ||
                      "Skin health analyzed"}
                  </h3>

                  <p>
                    {assessment.summary ||
                      assessment.description ||
                      "Your skin assessment has been completed."}
                  </p>

                </div>

              </div>


              {/* PRIMARY CONCERN */}

              {(assessment.primary_concern ||
                assessment.main_concern) && (

                <div className="primary-concern-card">

                  <span>
                    PRIMARY CONCERN
                  </span>

                  <h3>
                    {assessment.primary_concern ||
                      assessment.main_concern}
                  </h3>

                  {assessment.concern_description && (
                    <p>
                      {assessment.concern_description}
                    </p>
                  )}

                </div>

              )}


              {/* METRICS */}

              <div className="assessment-metrics">

                <div className="metric-item">

                  <span>
                    Hydration
                  </span>

                  <strong>
                    {assessment.hydration_score ??
                      "--"}
                  </strong>

                </div>


                <div className="metric-item">

                  <span>
                    Lifestyle
                  </span>

                  <strong>
                    {assessment.lifestyle_score ??
                      "--"}
                  </strong>

                </div>


                <div className="metric-item">

                  <span>
                    Sleep
                  </span>

                  <strong>
                    {assessment.sleep_score ??
                      "--"}
                  </strong>

                </div>


                <div className="metric-item">

                  <span>
                    Skin Condition
                  </span>

                  <strong>
                    {assessment.skin_condition_score ??
                      "--"}
                  </strong>

                </div>

              </div>


              {/* DETAILS */}

              <div className="assessment-details">

                {assessment.recommendations && (
                  <div className="detail-box">

                    <h4>
                      💡 Recommendations
                    </h4>

                    <p>
                      {Array.isArray(
                        assessment.recommendations
                      )
                        ? assessment.recommendations.join(
                            " "
                          )
                        : assessment.recommendations}
                    </p>

                  </div>
                )}


                {assessment.risk_factors && (
                  <div className="detail-box">

                    <h4>
                      ⚠️ Risk Factors
                    </h4>

                    <p>
                      {Array.isArray(
                        assessment.risk_factors
                      )
                        ? assessment.risk_factors.join(
                            " "
                          )
                        : assessment.risk_factors}
                    </p>

                  </div>
                )}

              </div>

            </div>

          )}

        </section>


        {/* ====================================================
            PERSONALIZED ROUTINE
        ==================================================== */}

        <section className="dashboard-section">

          <div className="section-heading">

            <div>
              <span className="section-label">
                AI PERSONALIZATION
              </span>

              <h2>
                Personalized Skincare Routine
              </h2>

              <p>
                A routine generated based on your
                individual skin needs.
              </p>
            </div>


            <button
              className="primary-button"
              onClick={handleGenerateRoutine}
              disabled={routineLoading}
            >
              {routineLoading
                ? "Generating..."
                : routine
                ? "🔄 Update Routine"
                : "✨ Generate Routine"}
            </button>

          </div>


          {!routine ? (

            <div className="empty-state large-empty-state">

              <div className="empty-state-icon">
                🧴
              </div>

              <h3>
                Create your personalized routine
              </h3>

              <p>
                Generate a morning and evening routine
                based on your skin profile and AI
                assessment.
              </p>

              <button
                className="primary-button"
                onClick={handleGenerateRoutine}
                disabled={routineLoading}
              >
                {routineLoading
                  ? "Generating..."
                  : "Generate My Routine"}
              </button>

            </div>

          ) : (

            <div className="routine-container">

              {routine.routine_name && (
                <div className="routine-meta">

                  <div>
                    <span>ROUTINE</span>

                    <h3>
                      {routine.routine_name}
                    </h3>
                  </div>

                  {routine.created_at && (
                    <span>
                      Created{" "}
                      {formatDate(
                        routine.created_at
                      )}
                    </span>
                  )}

                </div>
              )}


              <div className="routine-grid">

                {/* MORNING */}

                <div className="routine-card">

                  <div className="routine-card-header">

                    <span className="routine-icon">
                      ☀️
                    </span>

                    <div>
                      <h3>
                        Morning Routine
                      </h3>

                      <span>
                        Start your day right
                      </span>
                    </div>

                  </div>


                  <div className="routine-steps">

                    {(
                      routine.morning ||
                      routine.morning_routine ||
                      routine.am
                    ) ? (

                      Array.isArray(
                        routine.morning ||
                          routine.morning_routine ||
                          routine.am
                      ) ? (

                        (
                          routine.morning ||
                          routine.morning_routine ||
                          routine.am
                        ).map((step, index) => (

                          <div
                            className="routine-step"
                            key={index}
                          >
                            <span>
                              {index + 1}
                            </span>

                            <p>
                              {typeof step ===
                              "string"
                                ? step
                                : step?.product_name ||
                                  step?.name ||
                                  JSON.stringify(
                                    step
                                  )}
                            </p>
                          </div>

                        ))

                      ) : (

                        <ol className="routine-numbered-list">
                          {formatRoutineSteps(
                            routine.morning ||
                              routine.morning_routine ||
                              routine.am
                          ).map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>

                      )

                    ) : (

                      <p>
                        Morning routine details
                        are available in your
                        personalized routine.
                      </p>

                    )}

                  </div>

                </div>


                {/* EVENING */}

                <div className="routine-card">

                  <div className="routine-card-header">

                    <span className="routine-icon">
                      🌙
                    </span>

                    <div>
                      <h3>
                        Evening Routine
                      </h3>

                      <span>
                        Night-time skin care
                      </span>
                    </div>

                  </div>


                  <div className="routine-steps">

                    {(
                      routine.evening ||
                      routine.evening_routine ||
                      routine.pm
                    ) ? (

                      Array.isArray(
                        routine.evening ||
                          routine.evening_routine ||
                          routine.pm
                      ) ? (

                        (
                          routine.evening ||
                          routine.evening_routine ||
                          routine.pm
                        ).map((step, index) => (

                          <div
                            className="routine-step"
                            key={index}
                          >
                            <span>
                              {index + 1}
                            </span>

                            <p>
                              {typeof step ===
                              "string"
                                ? step
                                : step?.product_name ||
                                  step?.name ||
                                  JSON.stringify(
                                    step
                                  )}
                            </p>
                          </div>

                        ))

                      ) : (

                        <ol className="routine-numbered-list">
                          {formatRoutineSteps(
                            routine.evening ||
                              routine.evening_routine ||
                              routine.pm
                          ).map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>

                      )

                    ) : (

                      <p>
                        Evening routine details
                        are available in your
                        personalized routine.
                      </p>

                    )}

                  </div>

                </div>


                {/* GENERAL ADVICE */}

                {(routine.general_advice ||
                  routine.instructions ||
                  routine.notes) && (

                  <div className="routine-card routine-card-wide">

                    <div className="routine-card-header">

                      <span className="routine-icon">
                        💡
                      </span>

                      <div>
                        <h3>
                          Personalized Advice
                        </h3>
                      </div>

                    </div>

                    <p>
                      {routine.general_advice ||
                        routine.instructions ||
                        routine.notes}
                    </p>

                  </div>

                )}

              </div>

            </div>

          )}

        </section>


        {/* ====================================================
            INFORMATION CARDS
        ==================================================== */}

        <section className="dashboard-content-grid">

          {/* PRODUCT RECOMMENDATIONS */}

          

      


          {/* INGREDIENT INTELLIGENCE */}

          <div className="dashboard-info-card">

            <div className="info-card-icon">
              🧪
            </div>

            <div>

              <h3>
                Ingredient Intelligence
              </h3>

              <p>
                Understand skincare ingredients
                and their benefits.
              </p>

              <button
                className="card-link"
                onClick={() =>
                  navigate("/ingredients")
                }
              >
                Explore Ingredients →
              </button>

            </div>

          </div>


          {/* PROGRESS */}

          <div className="dashboard-info-card">

            <div className="info-card-icon">
              📊
            </div>

            <div>

              <h3>
                Progress Tracking
              </h3>

              <p>
                Monitor your skin health
                improvements over time.
              </p>

              <button
                className="card-link"
                onClick={() =>
                  navigate("/progress")
                }
              >
                View Progress →
              </button>

            </div>

          </div>


          {/* ANALYTICS */}

          <div className="dashboard-info-card">

            <div className="info-card-icon">
              📈
            </div>

            <div>

              <h3>
                Health Analytics
              </h3>

              <p>
                Explore detailed analytics
                about your skin health.
              </p>

              <button
                className="card-link"
                onClick={() =>
                  navigate("/analytics")
                }
              >
                View Analytics →
              </button>

            </div>

          </div>

        </section>


        {/* ====================================================
            CONSULTATIONS
        ==================================================== */}

        {/* ====================================================
    CONSULTATIONS
==================================================== */}
<section className="dashboard-section consultation-client-section">

  <div className="section-heading">
    <div>
      <span className="section-label">
        PROFESSIONAL CARE
      </span>

      <h2>
        Consultation History
      </h2>

      <p>
        Your interactions with skincare consultants and
        dermatologists.
      </p>
    </div>

    <button
      className="secondary-button"
      onClick={() => navigate("/consultations")}
    >
      View All
    </button>
  </div>

  {consultations.length === 0 ? (

    <div className="empty-state">

      <div className="empty-state-icon">
        💬
      </div>

      <h3>
        No consultations yet
      </h3>

      <p>
        Professional consultation records will appear
        here when available.
      </p>

      <button
        className="primary-button"
        onClick={() => navigate("/consultations")}
      >
        Find a Professional
      </button>

    </div>

  ) : (

    <div className="client-consultation-list">

      {consultations
        .slice(0, 5)
        .map((consultation) => (

          <article
            className="client-consultation-card"
            key={consultation.id}
          >

            {/* ================================
                CONSULTATION HEADER
            ================================= */}

            <div className="consultation-header">

              <div>

                <span className="consultation-label">
                  CONSULTATION #{consultation.id}
                </span>

                <h3>
                  {consultation.title ||
                    consultation.subject ||
                    "Skin Consultation"}
                </h3>

                <span className="consultation-date">
                  {formatDate(
                    consultation.created_at ||
                    consultation.date
                  )}
                </span>

              </div>

              <span className="consultation-status">
                {consultation.status || "ACTIVE"}
              </span>

            </div>


            {/* ================================
                CONSULTATION CONTENT
            ================================= */}

            <div className="client-consultation-content">

              {/* --------------------------------
                  NOTES / DOCTOR MESSAGE
              --------------------------------- */}

              {(consultation.notes ||
                consultation.message ||
                consultation.description) && (

                <div className="client-consultation-block">

                  <div className="consultation-block-title">

                    <span className="consultation-block-icon">
                      📝
                    </span>

                    <span>
                      Professional Notes
                    </span>

                  </div>

                  <p>
                    {consultation.notes ||
                      consultation.message ||
                      consultation.description}
                  </p>

                </div>

              )}


              {/* --------------------------------
                  RECOMMENDATIONS
              --------------------------------- */}

              {consultation.recommendations && (

                <div className="client-consultation-block recommendation-block">

                  <div className="consultation-block-title">

                    <span className="consultation-block-icon">
                      💡
                    </span>

                    <span>
                      Recommendations
                    </span>

                  </div>

                  <p>
                    {consultation.recommendations}
                  </p>

                </div>

              )}

            </div>

          </article>

        ))}

    </div>

  )}

</section>


        {/* ====================================================
            PERSONALIZED INSIGHT
        ==================================================== */}

        <section className="personalized-insight">

          <div className="insight-icon">
            ✨
          </div>

          <div>

            <span>
              PERSONALIZED INSIGHT
            </span>

            <h2>
              Small habits can make a big
              difference to your skin.
            </h2>

            <p>
              Stay consistent with hydration,
              sleep and your personalized
              skincare routine to support
              healthier skin over time.
            </p>

          </div>

        </section>


        {/* ====================================================
            QUICK ACTIONS
        ==================================================== */}

        <section className="dashboard-section quick-actions">

          <div className="section-heading">

            <div>
              <span className="section-label">
                QUICK ACTIONS
              </span>

              <h2>
                Continue Your Skin Journey
              </h2>
            </div>

          </div>


          <div className="quick-actions-grid">

            <button
              onClick={() =>
                navigate("/skin-profile")
              }
            >
              <span>👤</span>
              <strong>
                Update Skin Profile
              </strong>
              <small>
                Keep your skin information current
              </small>
            </button>


            <button
              onClick={() =>
                navigate("/checkin")
              }
            >
              <span>📝</span>
              <strong>
                Daily Check-in
              </strong>
              <small>
                Record today's skin condition
              </small>
            </button>


            <button
              onClick={() =>
                navigate("/product-recommendations")
              }
            >
              <span>🧴</span>
              <strong>
                Explore Products
              </strong>
              <small>
                Find products for your skin
              </small>
            </button>


            <button
              onClick={() =>
                navigate("/reports")
              }
            >
              <span>📄</span>
              <strong>
                View Reports
              </strong>
              <small>
                Download your health reports
              </small>
            </button>
            <button
              className="quick-action-card"
              onClick={() => navigate("/health-dashboard")}
            >
              <div className="quick-action-icon">💚</div>

               <div className="quick-action-content">
                <h3>Health Dashboard</h3>
                <p>View your complete skin health score, risks and AI insights.</p>
               </div>
              <span className="quick-action-arrow">
                →
                </span>
            
            </button>

          </div>

        </section>


        {/* ====================================================
            FOOTER
        ==================================================== */}

        <footer className="dashboard-footer">

          <div>
            <strong>
              Skin Intelligence
            </strong>

            <span>
              AI-powered personalized skincare
            </span>
          </div>


          <div>
            <span>
              Your skin. Your intelligence.
              Your journey. ✨
            </span>
          </div>

        </footer>

      </main>

    </div>
  );
}


export default Dashboard;