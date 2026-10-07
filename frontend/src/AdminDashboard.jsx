import React, { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

function AdminDashboard({ onLogout }) {
  const [users, setUsers] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [recommendationStatus, setRecommendationStatus] =
    useState(null);

  const [recommendationIssues, setRecommendationIssues] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [activeSection, setActiveSection] =
    useState("overview");

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);

    try {
      let userData = [];
      let assessmentData = [];
      let analyticsData = null;
      let systemData = null;
      let recommendationData = null;
      let issueData = [];

      // ---------------------------------------------------
      // USERS
      // ---------------------------------------------------

      try {
        const response = await fetch(
          `${API}/users`
        );

        if (response.ok) {
          const data = await response.json();

          userData = Array.isArray(data)
            ? data
            : Array.isArray(data.users)
            ? data.users
            : [];
        }
      } catch (error) {
        console.log("Users error:", error);
      }

      // ---------------------------------------------------
      // ASSESSMENTS
      // ---------------------------------------------------

      try {
        const response = await fetch(
          `${API}/assessments`
        );

        if (response.ok) {
          const data = await response.json();

          assessmentData = Array.isArray(data)
            ? data
            : Array.isArray(data.assessments)
            ? data.assessments
            : [];
        }
      } catch (error) {
        console.log(
          "Assessments error:",
          error
        );
      }

      // ---------------------------------------------------
      // ADMIN ANALYTICS
      // ---------------------------------------------------

      try {
        const response = await fetch(
          `${API}/admin/analytics`
        );

        if (response.ok) {
          const data = await response.json();

          if (data.success) {
            analyticsData = data;
          }
        }
      } catch (error) {
        console.log(
          "Analytics error:",
          error
        );
      }

      // ---------------------------------------------------
      // SYSTEM STATUS
      // ---------------------------------------------------

      try {
        const response = await fetch(
          `${API}/admin/system-status`
        );

        if (response.ok) {
          const data = await response.json();

          if (data.success) {
            systemData = data;
          }
        }
      } catch (error) {
        console.log(
          "System status error:",
          error
        );
      }

      // ---------------------------------------------------
      // RECOMMENDATION STATUS
      // ---------------------------------------------------

      try {
        const response = await fetch(
          `${API}/admin/recommendation-status`
        );

        if (response.ok) {
          const data = await response.json();

          if (data.success) {
            recommendationData = data;
          }
        }
      } catch (error) {
        console.log(
          "Recommendation status error:",
          error
        );
      }

      // ---------------------------------------------------
      // RECOMMENDATION ISSUES
      // ---------------------------------------------------

      setIssuesLoading(true);

      try {
        const response = await fetch(
          `${API}/admin/recommendation-issues`
        );

        if (response.ok) {
          const data = await response.json();

          if (data.success) {
            issueData = Array.isArray(
              data.issues
            )
              ? data.issues
              : [];
          }
        }
      } catch (error) {
        console.log(
          "Recommendation issues error:",
          error
        );
      } finally {
        setIssuesLoading(false);
      }

      // ---------------------------------------------------
      // LOCAL ASSESSMENT FALLBACK
      // ---------------------------------------------------

      if (!assessmentData.length) {
        const history = JSON.parse(
          localStorage.getItem(
            "skinai_assessment_history"
          ) || "[]"
        );

        assessmentData = Array.isArray(
          history
        )
          ? history
          : [];
      }

      // ---------------------------------------------------
      // SET DATA
      // ---------------------------------------------------

      setUsers(userData);
      setAssessments(assessmentData);
      setAnalytics(analyticsData);
      setSystemStatus(systemData);
      setRecommendationStatus(
        recommendationData
      );
      setRecommendationIssues(
        issueData
      );
    } catch (error) {
      console.error(
        "Admin data error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------
  // CALCULATED VALUES
  // -------------------------------------------------------

  const totalUsers =
    analytics?.users?.total_users ??
    users.filter(
      (user) =>
        String(
          user.role || "User"
        ).toLowerCase() === "user"
    ).length;

  const totalDermatologists =
    analytics?.users?.dermatologists ??
    users.filter(
      (user) =>
        String(
          user.role || ""
        ).toLowerCase() ===
        "dermatologist"
    ).length;

  const totalConsultants =
    analytics?.users?.consultants ??
    users.filter(
      (user) =>
        String(
          user.role || ""
        ).toLowerCase() ===
        "consultant"
    ).length;

  const totalAdmins =
    analytics?.users?.admins ?? 0;

  const totalAssessments =
    analytics?.platform?.total_assessments ??
    assessments.length;

  const averageScore =
    analytics?.platform
      ?.average_skin_score ?? 0;

  const sharedReports =
    analytics?.platform
      ?.shared_reports ?? 0;

  const reviewedReports =
    analytics?.platform
      ?.reviewed_reports ?? 0;

  const routineRecords =
    analytics?.platform
      ?.routine_records ?? 0;

  const progressRecords =
    analytics?.platform
      ?.progress_records ?? 0;

  const recentAssessments =
    [...assessments]
      .slice(-5)
      .reverse();

  const openIssues =
    recommendationIssues.filter(
      (issue) =>
        String(
          issue.status || "Open"
        ).toLowerCase() === "open"
    ).length;

  const getScoreClass = (score) => {
    if (score >= 80) return "excellent";
    if (score >= 60) return "good";
    if (score >= 40) return "moderate";
    return "low";
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem(
        "skinai_user"
      );

      localStorage.removeItem(
        "user"
      );

      window.location.href = "/";
    }
  };

  return (
    <div className="admin-page">

      <aside className="admin-sidebar">

        <div className="admin-brand">

          <div className="admin-logo">
            ✦
          </div>

          <div>
            <h2>SkinAI</h2>
            <span>ADMIN PANEL</span>
          </div>

        </div>

        <nav className="admin-nav">

          <button
            className={
              activeSection === "overview"
                ? "admin-nav-item active"
                : "admin-nav-item"
            }
            onClick={() =>
              setActiveSection("overview")
            }
          >
            <span>▦</span>
            Overview
          </button>

          <button
            className={
              activeSection === "users"
                ? "admin-nav-item active"
                : "admin-nav-item"
            }
            onClick={() =>
              setActiveSection("users")
            }
          >
            <span>👥</span>
            User Management
          </button>

          <button
            className={
              activeSection === "analytics"
                ? "admin-nav-item active"
                : "admin-nav-item"
            }
            onClick={() =>
              setActiveSection("analytics")
            }
          >
            <span>📊</span>
            Platform Analytics
          </button>

          <button
            className={
              activeSection ===
              "recommendations"
                ? "admin-nav-item active"
                : "admin-nav-item"
            }
            onClick={() =>
              setActiveSection(
                "recommendations"
              )
            }
          >
            <span>🧴</span>
            Recommendations
          </button>

          <button
            className={
              activeSection === "issues"
                ? "admin-nav-item active"
                : "admin-nav-item"
            }
            onClick={() =>
              setActiveSection("issues")
            }
          >
            <span>⚠️</span>
            Recommendation Issues

            {openIssues > 0 && (
              <span
                style={{
                  marginLeft: "auto",
                  background: "#dc2626",
                  color: "#fff",
                  borderRadius: "999px",
                  padding: "2px 8px",
                  fontSize: "11px",
                  fontWeight: "700",
                }}
              >
                {openIssues}
              </span>
            )}
          </button>

          <button
            className={
              activeSection === "system"
                ? "admin-nav-item active"
                : "admin-nav-item"
            }
            onClick={() =>
              setActiveSection("system")
            }
          >
            <span>⚙️</span>
            System Status
          </button>

        </nav>

        <div className="admin-sidebar-bottom">

          <div className="admin-profile-mini">

            <div className="admin-avatar">
              A
            </div>

            <div>
              <strong>
                Administrator
              </strong>

              <small>
                Platform Admin
              </small>
            </div>

          </div>

          <button
            className="admin-logout"
            onClick={handleLogout}
          >
            ⇥ Logout
          </button>

        </div>

      </aside>

      <main className="admin-main">

        <header className="admin-header">

          <div>

            <p className="admin-eyebrow">
              SKINAI PLATFORM
            </p>

            <h1>
              {activeSection ===
              "overview"
                ? "Admin Dashboard"
                : activeSection ===
                  "users"
                ? "User Management"
                : activeSection ===
                  "analytics"
                ? "Platform Analytics"
                : activeSection ===
                  "recommendations"
                ? "Recommendation Management"
                : activeSection ===
                  "issues"
                ? "Recommendation Issues"
                : "System Status"}
            </h1>

            <p className="admin-subtitle">
              Monitor SkinAI performance,
              users and intelligent
              skincare services.
            </p>

          </div>

          <div className="admin-header-right">

            <div className="admin-status">
              <span></span>
              System Online
            </div>

            <button
              className="admin-refresh"
              onClick={loadAdminData}
            >
              ↻ Refresh
            </button>

          </div>

        </header>
        {activeSection === "overview" && (
          <>
            <section className="admin-stat-grid">

              <div className="admin-stat-card">
                <div className="admin-stat-icon">👥</div>

                <div>
                  <span>Total Users</span>
                  <strong>
                    {loading ? "—" : totalUsers}
                  </strong>
                  <small>Registered users</small>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon">🩺</div>

                <div>
                  <span>Dermatologists</span>
                  <strong>
                    {loading
                      ? "—"
                      : totalDermatologists}
                  </strong>
                  <small>
                    Healthcare professionals
                  </small>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon">📝</div>

                <div>
                  <span>Assessments</span>
                  <strong>
                    {loading
                      ? "—"
                      : totalAssessments}
                  </strong>
                  <small>
                    Skin assessments completed
                  </small>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon">⭐</div>

                <div>
                  <span>Average Score</span>
                  <strong>
                    {loading
                      ? "—"
                      : `${Number(
                          averageScore
                        ).toFixed(2)}%`}
                  </strong>
                  <small>
                    Overall skin health
                  </small>
                </div>
              </div>

            </section>

            <section className="admin-section">

              <div className="admin-section-heading">

                <div>
                  <span className="section-label">
                    PLATFORM OVERVIEW
                  </span>

                  <h2>
                    SkinAI Performance
                  </h2>
                </div>

                <span className="live-badge">
                  ● Live
                </span>

              </div>

              <div className="admin-health-grid">

                <div className="health-card">

                  <div className="health-card-top">
                    <span>
                      Assessment Activity
                    </span>

                    <strong>
                      {totalAssessments}
                    </strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width:
                          totalAssessments
                            ? "92%"
                            : "0%",
                      }}
                    ></div>
                  </div>

                  <p>
                    Total assessments processed
                    by SkinAI
                  </p>

                </div>

                <div className="health-card">

                  <div className="health-card-top">
                    <span>
                      Routine Tracking
                    </span>

                    <strong>
                      {routineRecords}
                    </strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width:
                          routineRecords
                            ? "85%"
                            : "0%",
                      }}
                    ></div>
                  </div>

                  <p>
                    Routine tracking records stored
                  </p>

                </div>

                <div className="health-card">

                  <div className="health-card-top">
                    <span>
                      Recommendation
                    </span>

                    <strong>
                      {recommendationStatus?.engine_status ||
                        "Operational"}
                    </strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: "94%",
                      }}
                    ></div>
                  </div>

                  <p>
                    Personalized recommendation
                    engine
                  </p>

                </div>

              </div>

            </section>
            <section className="admin-section">

              <div className="admin-section-heading">

                <div>
                  <span className="section-label">
                    QUICK ACCESS
                  </span>

                  <h2>
                    Admin Actions
                  </h2>
                </div>

              </div>

              <div className="admin-action-grid">

                <button
                  className="admin-action-card"
                  onClick={() =>
                    setActiveSection("users")
                  }
                >
                  <span className="admin-stat-icon">
                    👥
                  </span>

                  <div>
                    <strong>
                      User Management
                    </strong>

                    <p>
                      View and manage platform users
                    </p>
                  </div>
                </button>

                <button
                  className="admin-action-card"
                  onClick={() =>
                    setActiveSection("analytics")
                  }
                >
                  <span className="admin-stat-icon">
                    📊
                  </span>

                  <div>
                    <strong>
                      Platform Analytics
                    </strong>

                    <p>
                      Monitor SkinAI platform activity
                    </p>
                  </div>
                </button>

                <button
                  className="admin-action-card"
                  onClick={() =>
                    setActiveSection("recommendations")
                  }
                >
                  <span className="admin-stat-icon">
                    🤖
                  </span>

                  <div>
                    <strong>
                      Recommendations
                    </strong>

                    <p>
                      Check AI recommendation engine
                    </p>
                  </div>
                </button>

                <button
                  className="admin-action-card"
                  onClick={() =>
                    setActiveSection("issues")
                  }
                >
                  <span className="admin-stat-icon">
                    ⚠️
                  </span>

                  <div>
                    <strong>
                      Recommendation Issues
                    </strong>

                    <p>
                      Review reported recommendation
                      problems
                    </p>
                  </div>
                </button>

              </div>

            </section>

            <section className="admin-section">

              <div className="admin-section-heading">

                <div>
                  <span className="section-label">
                    RECENT ACTIVITY
                  </span>

                  <h2>
                    Recent Assessments
                  </h2>
                </div>

                <span className="live-badge">
                  ● Updated
                </span>

              </div>

              <div className="admin-table-wrapper">

                <table className="admin-table">

                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Skin Type</th>
                      <th>Concern</th>
                      <th>Score</th>
                      <th>Date</th>
                    </tr>
                  </thead>

                  <tbody>

                    {recentAssessments.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="empty-table"
                        >
                          No recent assessments found.
                        </td>
                      </tr>
                    ) : (
                      recentAssessments
                        .slice(0, 5)
                        .map((assessment, index) => {

                          const score =
                            Number(
                              assessment.score ??
                              assessment.skin_health_score ??
                              0
                            );

                          return (
                            <tr
                              key={
                                assessment.id ||
                                index
                              }
                            >

                              <td>
                                <div className="table-user">

                                  <div className="table-avatar">
                                    {String(
                                      assessment.name ||
                                      assessment.email ||
                                      "U"
                                    )
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>

                                  <div>
                                    <strong>
                                      {assessment.name ||
                                        assessment.email ||
                                        "User"}
                                    </strong>

                                    <small>
                                      {assessment.email ||
                                        "—"}
                                    </small>
                                  </div>

                                </div>
                              </td>

                              <td>
                                {assessment.skin_type ||
                                  "—"}
                              </td>

                              <td>
                                {Array.isArray(
                                  assessment.concerns
                                )
                                  ? assessment.concerns.join(
                                      ", "
                                    )
                                  : assessment.concerns ||
                                    assessment.primary_concern ||
                                    "—"}
                              </td>

                              <td>
                                <span
                                  className={`score-pill ${getScoreClass(
                                    score
                                  )}`}
                                >
                                  {score}%
                                </span>
                              </td>

                              <td>
                                {assessment.created_at ||
                                  "Recent"}
                              </td>

                            </tr>
                          );
                        })
                    )}

                  </tbody>

                </table>

              </div>

            </section>
            <section className="admin-section">

              <div className="admin-insight">

                <div className="insight-icon">
                  ✦
                </div>

                <div>
                  <span className="section-label">
                    AI PLATFORM INSIGHT
                  </span>

                  <h3>
                    SkinAI is actively monitoring
                    platform performance.
                  </h3>

                  <p>
                    The platform is currently
                    processing skin assessments,
                    maintaining personalized
                    routines and supporting
                    AI-based skincare
                    recommendations.
                  </p>
                </div>

              </div>

            </section>

          </>
        )}

        {activeSection === "users" && (
          <section className="admin-content-panel">

            <div className="admin-section-heading">

              <div>
                <span className="section-label">
                  PLATFORM USERS
                </span>

                <h2>
                  User Management
                </h2>
              </div>

              <span className="live-badge">
                {users.length} Accounts
              </span>

            </div>

            <div className="role-summary">

              <div className="analytics-card">
                <span>Users</span>
                <strong>{totalUsers}</strong>
              </div>

              <div className="analytics-card">
                <span>Dermatologists</span>
                <strong>
                  {totalDermatologists}
                </strong>
              </div>

              <div className="analytics-card">
                <span>Consultants</span>
                <strong>
                  {totalConsultants}
                </strong>
              </div>

              <div className="analytics-card">
                <span>Admins</span>
                <strong>
                  {totalAdmins}
                </strong>
              </div>

            </div>

            <div className="admin-table-wrapper">

              <table className="admin-table">

                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>

                  {users.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="empty-table"
                      >
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((user, index) => (

                      <tr key={user.id || index}>

                        <td>
                          <div className="table-user">

                            <div className="table-avatar">
                              {String(
                                user.name ||
                                user.email ||
                                "U"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {user.name ||
                                  "Unknown User"}
                              </strong>

                              <small>
                                ID: {user.id || "—"}
                              </small>
                            </div>

                          </div>
                        </td>

                        <td>
                          {user.email || "—"}
                        </td>

                        <td>
                          <span className="role-pill">
                            {user.role || "User"}
                          </span>
                        </td>

                        <td>
                          <span className="status-pill">
                            Active
                          </span>
                        </td>

                      </tr>

                    ))
                  )}

                </tbody>

              </table>

            </div>

          </section>
        )}

        {activeSection === "analytics" && (
          <section className="admin-content-panel">

            <div className="admin-section-heading">

              <div>
                <span className="section-label">
                  PLATFORM ANALYTICS
                </span>

                <h2>
                  SkinAI Analytics
                </h2>
              </div>

              <span className="live-badge">
                ● Live Data
              </span>

            </div>

            <div className="analytics-grid">

              <div className="analytics-card">
                <span>
                  Total Assessments
                </span>

                <strong>
                  {totalAssessments}
                </strong>

                <small>
                  Completed on platform
                </small>
              </div>

              <div className="analytics-card">
                <span>
                  Average Skin Score
                </span>

                <strong>
                  {Number(
                    averageScore
                  ).toFixed(2)}%
                </strong>

                <small>
                  Overall assessment score
                </small>
              </div>

              <div className="analytics-card">
                <span>
                  Shared Reports
                </span>

                <strong>
                  {sharedReports}
                </strong>

                <small>
                  Reports shared with professionals
                </small>
              </div>

              <div className="analytics-card">
                <span>
                  Reviewed Reports
                </span>

                <strong>
                  {reviewedReports}
                </strong>

                <small>
                  Reports reviewed by professionals
                </small>
              </div>

              <div className="analytics-card">
                <span>
                  Routine Records
                </span>

                <strong>
                  {routineRecords}
                </strong>

                <small>
                  Routine tracking records
                </small>
              </div>

              <div className="analytics-card">
                <span>
                  Progress Records
                </span>

                <strong>
                  {progressRecords}
                </strong>

                <small>
                  Skin progress records
                </small>
              </div>

              <div className="analytics-card">
                <span>
                  Professional Accounts
                </span>

                <strong>
                  {totalDermatologists +
                    totalConsultants}
                </strong>

                <small>
                  Dermatologists and consultants
                </small>
              </div>

              <div className="analytics-card">
                <span>
                  Platform Status
                </span>

                <strong>
                  Operational
                </strong>

                <small>
                  SkinAI services are running
                </small>
              </div>

            </div>

            <div className="analytics-note">

              <strong>
                Analytics Summary
              </strong>

              <p>
                SkinAI is currently tracking
                user activity, skin assessments,
                personalized routines and
                professional report sharing.
                These metrics help administrators
                monitor the overall platform
                performance.
              </p>

            </div>

          </section>
        )}

        {activeSection === "recommendations" && (
          <section className="admin-content-panel">

            <div className="admin-section-heading">

              <div>
                <span className="section-label">
                  AI RECOMMENDATION ENGINE
                </span>

                <h2>
                  Recommendation Management
                </h2>
              </div>

              <span className="live-badge">
                ● Operational
              </span>

            </div>

            <div className="recommendation-status-grid">

              <div className="recommendation-status">
                <span>Engine Status</span>

                <strong>
                  {recommendationStatus?.engine_status ||
                    "Operational"}
                </strong>

                <small>
                  AI recommendation service
                </small>
              </div>

              <div className="recommendation-status">
                <span>Personalization</span>

                <strong>
                  {recommendationStatus?.personalization ||
                    "Active"}
                </strong>

                <small>
                  User profile based recommendations
                </small>
              </div>

              <div className="recommendation-status">
                <span>Safety Checks</span>

                <strong>
                  {recommendationStatus?.safety_checks ||
                    "Enabled"}
                </strong>

                <small>
                  Ingredient and sensitivity checks
                </small>
              </div>

            </div>

            <div className="analytics-note">

              <strong>
                Recommendation Monitoring
              </strong>

              <p>
                SkinAI recommendations use
                skin type, concerns, sensitivity
                and lifestyle information to
                provide personalized skincare
                guidance.
              </p>

            </div>

          </section>
        )}

        {activeSection === "issues" && (
          <section className="admin-content-panel">

            <div className="admin-section-heading">

              <div>
                <span className="section-label">
                  USER FEEDBACK
                </span>

                <h2>
                  Recommendation Issues
                </h2>
              </div>

              <span className="live-badge">
                {openIssues} Open
              </span>

            </div>

            {issuesLoading ? (

              <div className="issue-empty">
                <div className="issue-icon">
                  ⏳
                </div>

                <h3>
                  Loading issues...
                </h3>

                <p>
                  Please wait while SkinAI
                  retrieves recommendation
                  issue reports.
                </p>
              </div>

            ) : recommendationIssues.length === 0 ? (

              <div className="issue-empty">

                <div className="issue-icon">
                  ✓
                </div>

                <h3>
                  No reported issues
                </h3>

                <p>
                  There are currently no
                  recommendation issues reported
                  by users.
                </p>

              </div>

            ) : (

              <div className="admin-table-wrapper">

                <table className="admin-table">

                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Issue Type</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Reported At</th>
                    </tr>
                  </thead>

                  <tbody>

                    {recommendationIssues.map(
                      (issue) => (

                        <tr key={issue.id}>

                          <td>
                            {issue.email || "—"}
                          </td>

                          <td>
                            <span className="role-pill">
                              {issue.issue_type ||
                                "Other"}
                            </span>
                          </td>

                          <td>
                            {issue.description ||
                              "—"}
                          </td>

                          <td>
                            <span className="status-pill">
                              {issue.status ||
                                "Open"}
                            </span>
                          </td>

                          <td>
                            {issue.created_at ||
                              "—"}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </section>
        )}

        {activeSection === "system" && (
          <section className="admin-content-panel">

            <div className="admin-section-heading">

              <div>
                <span className="section-label">
                  SYSTEM MONITORING
                </span>

                <h2>
                  System Status
                </h2>
              </div>

              <span className="live-badge">
                ● Live
              </span>

            </div>

            <div className="system-status-list">

              <div className="recommendation-status">
                <span>
                  Frontend
                </span>

                <strong>
                  Operational
                </strong>

                <small>
                  React application running
                </small>
              </div>

              <div className="recommendation-status">
                <span>
                  FastAPI Backend
                </span>

                <strong>
                  {systemStatus?.backend ||
                    "Operational"}
                </strong>

                <small>
                  API services available
                </small>
              </div>

              <div className="recommendation-status">
                <span>
                  SQLite Database
                </span>

                <strong>
                  {systemStatus?.database ||
                    "Connected"}
                </strong>

                <small>
                  Application database
                </small>
              </div>

              <div className="recommendation-status">
                <span>
                  Recommendation Engine
                </span>

                <strong>
                  Operational
                </strong>

                <small>
                  AI recommendation service
                </small>
              </div>

            </div>

          </section>
        )}

      </main>

      <footer className="admin-footer">
        <span>
          ✦ SkinAI Admin Platform
        </span>

        <span>
          AI Skin Intelligence &
          Personalized Skincare Planner
        </span>
      </footer>

    </div>
  );
}

export default AdminDashboard;