import React, { useState, useEffect } from 'react';
import { api, clearAuth } from './api';

import LifestyleLogger from './LifestyleLogger';
import SkinAssessmentPanel from './SkinAssessmentPanel';
import SkincareRoutinePanel from './SkincareRoutinePanel';
import ProductRecommendationPanel from './ProductRecommendationPanel';
import ProgressTracker from './ProgressTracker';
import SkinCycleAnalysis from './SkinCycleAnalysis';
import SkinTextureAnalyzer from './SkinTextureAnalyzer';
import DermatologistPortal from './DermatologistPortal';
import NotificationCenter from './NotificationCenter';

export default function Dashboard({
  user,
  onLogout,
  onResetProfile,
}) {
  // ============================================================
  // USER DASHBOARD STATES
  // ============================================================

  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showLogger, setShowLogger] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [activeTab, setActiveTab] = useState('overview');

  // ============================================================
  // ADDITIONAL DASHBOARD DATA
  // ============================================================

  const [latestAssessment, setLatestAssessment] = useState(null);
  const [latestRoutine, setLatestRoutine] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  // ============================================================
  // ADMIN / CONSULTANT STATES
  // ============================================================

  const [adminUsers, setAdminUsers] = useState([]);
  const [consultantClients, setConsultantClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // ============================================================
  // LOAD DASHBOARD DATA
  // ============================================================

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      // ========================================================
      // NORMAL USER
      // ========================================================

      if (user.role === 'USER') {
        const prof = await api.getProfile();
        setProfile(prof);

        const hist = await api.getLifestyleHistory(7);
        setHistory(hist || []);

        const st = await api.getLifestyleStats();
        setStats(st);

        /*
         * These are optional.
         *
         * If the API methods exist in your api.js,
         * they will load the latest assessment/routine/products.
         *
         * If they don't exist yet, the dashboard still works.
         */

        if (typeof api.getLatestAssessment === 'function') {
          try {
            const assessment =
              await api.getLatestAssessment();

            setLatestAssessment(assessment);
          } catch {
            setLatestAssessment(null);
          }
        } else {
          setLatestAssessment(null);
        }

        if (typeof api.getLatestRoutine === 'function') {
          try {
            const routine =
              await api.getLatestRoutine();

            setLatestRoutine(routine);
          } catch {
            setLatestRoutine(null);
          }
        } else {
          setLatestRoutine(null);
        }

        if (
          typeof api.getProductRecommendations ===
          'function'
        ) {
          try {
            const products =
              await api.getProductRecommendations();

            setRecommendations(products || []);
          } catch {
            setRecommendations([]);
          }
        } else {
          setRecommendations([]);
        }

        if (typeof api.getNotifications === 'function') {
          try {
            const notifs = await api.getNotifications();
            setUnreadCount(notifs.unread_count || 0);
          } catch {
            setUnreadCount(0);
          }
        }
      }

      // ========================================================
      // ADMIN
      // ========================================================

      else if (user.role === 'ADMIN') {
        setAdminUsers([
          {
            id: 1,
            full_name: 'Alice Johnson',
            email: 'alice@example.com',
            role: 'USER',
            created_at: '2026-08-20',
          },
          {
            id: 2,
            full_name: 'Dr. Sarah Carter',
            email: 'drsarah@example.com',
            role: 'DERMATOLOGIST',
            created_at: '2026-08-18',
          },
          {
            id: 3,
            full_name: 'Consultant Mark',
            email: 'mark@example.com',
            role: 'SKINCARE_CONSULTANT',
            created_at: '2026-08-25',
          },
          {
            id: 4,
            full_name: user.full_name,
            email: user.email,
            role: 'ADMIN',
            created_at: '2026-08-27',
          },
        ]);
      }

      // ========================================================
      // CONSULTANT / DERMATOLOGIST
      // ========================================================

      else {
        setConsultantClients([
          {
            id: 1,
            name: 'Emily Davis',
            age: '25-34',
            skin_type: 'Oily',
            concerns: ['Acne', 'Dark Spots'],
            status: 'Needs Routine Review',
          },
          {
            id: 2,
            name: 'Michael Smith',
            age: '35-44',
            skin_type: 'Dry',
            concerns: ['Wrinkles', 'Redness'],
            status: 'Under Treatment',
          },
          {
            id: 3,
            name: 'Jessica Taylor',
            age: '18-24',
            skin_type: 'Sensitive',
            concerns: ['Redness'],
            status: 'Routine Active',
          },
        ]);
      }
    } catch (err) {
      if (
        user.role === 'USER' &&
        err.message ===
        'Skin profile not created yet'
      ) {
        onResetProfile();
      } else {
        setError(
          err.message ||
          'Error loading dashboard data'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOAD DATA WHEN USER CHANGES
  // ============================================================

  useEffect(() => {
    loadData();
  }, [user]);

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogoutClick = () => {
    clearAuth();
    onLogout();
  };

  // ============================================================
  // LIFESTYLE LOG SAVED
  // ============================================================

  const handleLogSaved = () => {
    setShowLogger(false);
    loadData();
  };

  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (loading) {
    return (
      <div className="loading-container">
        Loading Intelligence Dashboard...
      </div>
    );
  }

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">

      {/* ========================================================
          TOP NAVBAR
      ======================================================== */}

      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">

        {/* BRAND */}

        <div className="flex items-center gap-3">

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #C0637A 0%, #9B3D56 100%)',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(192, 99, 122, 0.3)',
            }}
          >
            <span className="text-xl">
              ✦
            </span>
          </div>

          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              background: 'linear-gradient(135deg, #C0637A 0%, #9B3D56 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.01em',
              margin: 0,
            }}
          >
            Skin Intelligence
          </h2>

        </div>

        {/* USER INFO & NOTIFICATIONS */}

        <div className="flex items-center gap-3">
          {/* Notification Bell Button */}
          <button
            type="button"
            onClick={() => setShowNotificationCenter(true)}
            style={{
              position: 'relative',
              background: '#FFFFFF',
              border: '1px solid rgba(192, 99, 122, 0.25)',
              borderRadius: 12,
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease'
            }}
            title="Notification & Reminder Center"
          >
            <span>🔔</span>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -4,
                background: '#DC2626',
                color: '#FFFFFF',
                fontSize: 10.5,
                fontWeight: 800,
                borderRadius: 999,
                padding: '1px 5px',
                minWidth: 18,
                height: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.4)'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          <span
            style={{
              padding: '4px 12px',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: '#C0637A',
              background: '#FDE8EE',
              borderRadius: 999,
              border: '1px solid rgba(192, 99, 122, 0.25)',
            }}
          >
            {user.role}
          </span>

          <span className="text-slate-600">
            Hello,{' '}
            <strong className="text-slate-900">
              {user.full_name}
            </strong>
          </span>

          <button
            type="button"
            onClick={handleLogoutClick}
            className="px-4 py-2 text-sm font-medium text-white transition-all bg-slate-900 rounded-lg hover:bg-slate-800 hover:shadow-md"
          >
            Sign Out
          </button>

        </div>
      </nav>

      {/* ========================================================
          MAIN CONTENT
      ======================================================== */}

      <div
        className="max-w-7xl mx-auto px-6 py-8"
        id="dashboard-wrapper"
      >

        {/* ERROR */}

        {error && (
          <div className="p-4 mb-6 text-red-700 bg-red-50 border border-red-200 rounded-xl">
            {error}
          </div>
        )}

        {/* ======================================================
            DERMATOLOGIST & CLINICAL PORTAL VIEW
        ====================================================== */}

        {(user.role === 'DERMATOLOGIST' || user.role === 'SKINCARE_CONSULTANT') && (
          <DermatologistPortal user={user} />
        )}

        {/* ======================================================
            USER VIEW
        ====================================================== */}

        {user.role === 'USER' && (
          <div className="user-dashboard-grid">

            {/* ==================================================
                TAB NAVIGATION
            ================================================== */}

            <div className="flex items-center gap-2 p-1.5 mb-8 bg-white/70 backdrop-blur-md rounded-2xl border border-rose-100 shadow-sm overflow-x-auto" style={{ borderColor: 'rgba(192, 99, 122, 0.2)' }}>

              {[
                {
                  key: 'overview',
                  icon: '◈',
                  label: 'Overview',
                },
                {
                  key: 'texture',
                  icon: '🔬',
                  label: 'Skin Texture',
                },
                {
                  key: 'assessment',
                  icon: '✦',
                  label: 'Skin Assessment',
                },
                {
                  key: 'routine',
                  icon: '🧴',
                  label: 'My Routine',
                },
                {
                  key: 'products',
                  icon: '🧪',
                  label: 'Product & Ingredient',
                },
                {
                  key: 'progress',
                  icon: '📈',
                  label: 'Progress Tracking',
                },
                {
                  key: 'skincycle',
                  icon: '🔄',
                  label: 'Skin Cycle Analysis',
                },
              ].map(
                ({
                  key,
                  icon,
                  label,
                }) => (
                  <button
                    key={key}
                    type="button"
                    className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${activeTab === key
                      ? 'bg-white shadow-sm border'
                      : 'hover:bg-white/50 border border-transparent'
                      }`}
                    style={{
                      background: activeTab === key ? '#FFFFFF' : 'transparent',
                      color: activeTab === key ? '#C0637A' : '#4A4048',
                      borderColor: activeTab === key ? 'rgba(192, 99, 122, 0.25)' : 'transparent',
                      boxShadow: activeTab === key ? '0 2px 10px rgba(192, 99, 122, 0.1)' : 'none',
                    }}
                    onClick={() =>
                      setActiveTab(key)
                    }
                  >

                    <span
                      style={{
                        color: activeTab === key ? '#C0637A' : '#9A8F95',
                      }}
                    >
                      {icon}
                    </span>

                    {label}

                  </button>
                )
              )}

            </div>

            {/* ==================================================
                1. OVERVIEW DASHBOARD
            ================================================== */}

            {activeTab === 'overview' && (
              <div className="overview-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* ROW 1: PROFILE SUMMARY & QUICK ACTIONS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
                  
                  {/* Profile Card */}
                  <div className="glass-card" style={{ padding: '24px' }}>
                    <div className="card-header-btn">
                      <h3>Skin Profile Summary</h3>
                      <button type="button" onClick={onResetProfile} className="text-action-btn">
                        Edit Profile
                      </button>
                    </div>

                    <div className="profile-details-grid">
                      <div className="profile-detail-item">
                        <span className="label">Skin Type</span>
                        <span className="value">{profile?.skin_type || 'Combination'}</span>
                      </div>
                      <div className="profile-detail-item">
                        <span className="label">Fitzpatrick Scale</span>
                        <span className="value">Type {profile?.fitzpatrick_type || 'III'}</span>
                      </div>
                      <div className="profile-detail-item">
                        <span className="label">Age Group</span>
                        <span className="value">{profile?.age_group || '25-34'}</span>
                      </div>
                      <div className="profile-detail-item">
                        <span className="label">Climate</span>
                        <span className="value">{profile?.climate || 'Temperate'}</span>
                      </div>
                    </div>

                    <div className="profile-details-list">
                      <div className="list-item">
                        <span className="label">Primary Concerns</span>
                        <div className="badge-list">
                          {profile?.skin_concerns?.length > 0 ? (
                            profile.skin_concerns.map((c) => (
                              <span key={c} className="badge">{c}</span>
                            ))
                          ) : (
                            <span className="dim-text">None specified</span>
                          )}
                        </div>
                      </div>

                      <div className="list-item">
                        <span className="label">Sensitivities & Allergies</span>
                        <div className="badge-list">
                          {profile?.sensitivities?.length > 0 ? (
                            profile.sensitivities.map((s) => (
                              <span key={s} className="badge sensitivity-badge">{s}</span>
                            ))
                          ) : null}
                          {profile?.allergies?.length > 0 ? (
                            profile.allergies.map((a) => (
                              <span key={a} className="badge allergy-badge">{a}</span>
                            ))
                          ) : null}
                          {(!profile?.sensitivities?.length && !profile?.allergies?.length) && (
                            <span className="dim-text">No sensitivities listed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action & Daily Tracker Card */}
                  <div className="glass-card quick-actions-card" style={{ padding: '24px' }}>
                    <h3>Daily Lifestyle Check-in</h3>
                    <p className="section-desc">
                      Log your daily sleep, water intake, UV exposure, and sunscreen application to keep your skin intelligence personalized and accurate.
                    </p>

                    <button
                      type="button"
                      onClick={() => setShowLogger(true)}
                      className="action-pill-btn"
                      id="btn-log-lifestyle-overview"
                    >
                      📝 + Log Today's Lifestyle
                    </button>

                    <div className="today-status-tracker" style={{ marginTop: 'auto', paddingTop: '20px' }}>
                      <h4>Today's Log Status</h4>
                      {history && history.length > 0 && history[0]?.log_date === new Date().toISOString().split('T')[0] ? (
                        <div className="status-indicator completed">
                          <span className="icon">✓</span>
                          <span>Today's lifestyle log has been recorded!</span>
                        </div>
                      ) : (
                        <div className="status-indicator pending">
                          <span className="icon">!</span>
                          <span>Pending today's check-in. Take 30 seconds to log now.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ROW 2: LIFESTYLE METRICS AVERAGES */}
                <div className="glass-card analytics-summary-card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <h3 style={{ margin: 0 }}>7-Day Lifestyle Averages</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time aggregated health factors</span>
                  </div>

                  <div className="metrics-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                    <div className="metric-box">
                      <span className="metric-val">
                        {stats?.avg_sleep_hours ? `${stats.avg_sleep_hours}h` : '0h'}
                      </span>
                      <span className="metric-lbl">Avg Sleep Duration</span>
                    </div>

                    <div className="metric-box">
                      <span className="metric-val">
                        {stats?.avg_water_intake_ml ? `${(stats.avg_water_intake_ml / 1000).toFixed(1)}L` : '0L'}
                      </span>
                      <span className="metric-lbl">Avg Water Intake</span>
                    </div>

                    <div className="metric-box">
                      <span className="metric-val">
                        {stats?.sunscreen_compliance_rate != null ? `${Math.round(stats.sunscreen_compliance_rate)}%` : '0%'}
                      </span>
                      <span className="metric-lbl">Sunscreen Compliance</span>
                    </div>

                    <div className="metric-box">
                      <span className="metric-val">
                        {stats?.total_logs_count ?? history?.length ?? 0}
                      </span>
                      <span className="metric-lbl">Total Days Logged</span>
                    </div>
                  </div>
                </div>

                {/* ROW 3: MODULE QUICK ACCESS CARDS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
                  
                  {/* Assessment Preview */}
                  <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--rose)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                          ✦ Skin Assessment
                        </span>
                        {latestAssessment?.overall_score != null && (
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--rose-deep)' }}>
                            {latestAssessment.overall_score.toFixed(0)}/100
                          </span>
                        )}
                      </div>
                      <h4 style={{ fontSize: '1.1rem', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
                        Health & Concern Report
                      </h4>
                      <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                        {latestAssessment
                          ? `${latestAssessment.concern_analysis?.length ?? 0} concerns & ${latestAssessment.risk_factors?.length ?? 0} risk factors evaluated.`
                          : 'Run your diagnostic assessment to identify barrier risks and concern scores.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('assessment')}
                      className="text-action-btn"
                      style={{ alignSelf: 'flex-start', marginTop: '16px', padding: '6px 14px', background: 'var(--rose-pale)' }}
                    >
                      {latestAssessment ? 'View Assessment →' : 'Run Assessment →'}
                    </button>
                  </div>

                  {/* Routine Preview */}
                  <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                        🧴 Active Regimen
                      </span>
                      <h4 style={{ fontSize: '1.1rem', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
                        Daily Skincare Routine
                      </h4>
                      <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                        {latestRoutine
                          ? `${latestRoutine.am_routine?.length ?? 0} AM steps · ${latestRoutine.pm_routine?.length ?? 0} PM steps customized for your barrier.`
                          : 'Generate an AI morning and night routine tailored to your skin profile.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('routine')}
                      className="text-action-btn"
                      style={{ alignSelf: 'flex-start', marginTop: '16px', padding: '6px 14px', background: 'var(--bg-soft)' }}
                    >
                      {latestRoutine ? 'View Routine →' : 'Build Routine →'}
                    </button>
                  </div>

                  {/* Skin Cycle Quick Access */}
                  <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E8C5F', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                        🔄 Cycle Intelligence
                      </span>
                      <h4 style={{ fontSize: '1.1rem', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
                        Skin Cycle Analysis
                      </h4>
                      <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                        4-Night cycling protocol, 7-day AM/PM checklist, and 28-day epidermal turnover tracking.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('skincycle')}
                      className="text-action-btn"
                      style={{ alignSelf: 'flex-start', marginTop: '16px', padding: '6px 14px', background: 'rgba(30, 140, 95, 0.08)', color: '#1E8C5F' }}
                    >
                      Open Skin Cycle Analysis →
                    </button>
                  </div>

                  {/* AI Texture Scanner */}
                  <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366F1', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                        🔬 AI Vision
                      </span>
                      <h4 style={{ fontSize: '1.1rem', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
                        Skin Texture Scanner
                      </h4>
                      <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                        Optical camera analysis of pore size, surface roughness, redness, and oil balance.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('texture')}
                      className="text-action-btn"
                      style={{ alignSelf: 'flex-start', marginTop: '16px', padding: '6px 14px', background: 'rgba(99, 102, 241, 0.08)', color: '#6366F1' }}
                    >
                      Scan Skin Texture →
                    </button>
                  </div>
                </div>

                {/* ROW 4: RECENT LIFESTYLE LOGS TABLE */}
                <div className="glass-card logs-history-card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <h3 style={{ margin: 0 }}>Recent Lifestyle Logs (Last 7 Days)</h3>
                    <button type="button" onClick={() => setShowLogger(true)} className="text-action-btn">
                      + Add New Entry
                    </button>
                  </div>

                  <div className="table-responsive">
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Sleep</th>
                          <th>Quality</th>
                          <th>Water</th>
                          <th>UV Exposure</th>
                          <th>Pollution</th>
                          <th>Stress</th>
                          <th>Sunscreen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history && history.length > 0 ? (
                          history.map((log) => (
                            <tr key={log.id || log.log_date}>
                              <td><strong>{log.log_date}</strong></td>
                              <td>{log.sleep_hours} hrs</td>
                              <td>{log.sleep_quality}</td>
                              <td>{log.water_intake_ml} ml</td>
                              <td>
                                <span className={`uv-indicator ${log.uv_exposure || 'Moderate'}`}>
                                  {log.uv_exposure || 'Moderate'}
                                </span>
                              </td>
                              <td>{log.pollution_exposure || 'Low'}</td>
                              <td>{log.stress_level || 'Medium'}</td>
                              <td>
                                {log.sunscreen_applied ? (
                                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ Yes</span>
                                ) : (
                                  <span style={{ color: 'var(--danger)', fontWeight: 600 }}>✗ No</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="no-data">
                              No lifestyle logs found yet. Click "+ Log Today's Lifestyle" to begin tracking!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ==================================================
                2. SKIN TEXTURE & VISION SCANNER
            ================================================== */}

            {activeTab === 'texture' && (
              <SkinTextureAnalyzer
                onProfileUpdated={() => {
                  loadData();
                }}
              />
            )}

            {/* ==================================================
                3. SKIN ASSESSMENT
            ================================================== */}

            {activeTab === 'assessment' && (
              <SkinAssessmentPanel
                onAssessmentUpdated={(updated) => setLatestAssessment(updated)}
              />
            )}

            {/* ==================================================
                4. SKINCARE ROUTINE
            ================================================== */}

            {activeTab === 'routine' && (
              <SkincareRoutinePanel
                onRoutineUpdated={(updated) => setLatestRoutine(updated)}
              />
            )}

            {/* ==================================================
                5. PRODUCTS & INGREDIENTS
            ================================================== */}

            {activeTab === 'products' && (
              <ProductRecommendationPanel />
            )}

            {/* ==================================================
                6. PROGRESS TRACKING
            ================================================== */}

            {activeTab === 'progress' && (
              <ProgressTracker />
            )}

            {/* ==================================================
                7. SKIN CYCLE ANALYSIS (MY SKIN JOURNEY & CYCLING)
            ================================================== */}

            {activeTab === 'skincycle' && (
              <SkinCycleAnalysis
                user={user}
                profile={profile}
                history={history}
                stats={stats}
                assessment={latestAssessment}
                routine={latestRoutine}
                recommendations={recommendations}
                onLogLifestyle={() => setShowLogger(true)}
                onOpenAssessment={() => setActiveTab('assessment')}
                onOpenRoutine={() => setActiveTab('routine')}
                onOpenProducts={() => setActiveTab('products')}
                onOpenProgress={() => setActiveTab('progress')}
                onOpenTexture={() => setActiveTab('texture')}
              />
            )}

          </div>
        )}

        {/* ========================================================
            ADMIN VIEW
        ======================================================== */}

        {user.role === 'ADMIN' && (
          <div className="admin-dashboard">

            {/* ADMIN HEADER */}

            <div className="dashboard-header">

              <h3>
                System Administration
                Console
              </h3>

              <p className="subtitle">
                Manage user records, check
                database logs, and oversee
                platform performance
              </p>

            </div>

            {/* ADMIN STATS */}

            <div className="admin-stats-row">

              <div className="glass-card admin-stat-box">

                <span className="stat-num">
                  {adminUsers.length}
                </span>

                <span className="stat-lbl">
                  Registered Accounts
                </span>

              </div>

              <div className="glass-card admin-stat-box">

                <span className="stat-num">
                  Healthy
                </span>

                <span className="stat-lbl">
                  Database Integration
                </span>

              </div>

              <div className="glass-card admin-stat-box">

                <span className="stat-num">
                  API Active
                </span>

                <span className="stat-lbl">
                  Platform Engine Status
                </span>

              </div>

            </div>

            {/* USER TABLE */}

            <div className="glass-card admin-users-card">

              <h3>
                Registered Platform Users
              </h3>

              <div className="table-responsive">

                <table className="admin-users-table">

                  <thead>

                    <tr>
                      <th>User ID</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Registration Date</th>
                      <th>Action</th>
                    </tr>

                  </thead>

                  <tbody>

                    {adminUsers.map(
                      (adminUser) => (

                        <tr
                          key={
                            adminUser.id
                          }
                        >

                          <td>
                            #{adminUser.id}
                          </td>

                          <td>
                            <strong>
                              {
                                adminUser.full_name
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              adminUser.email
                            }
                          </td>

                          <td>
                            <span className="user-role-badge inline">
                              {
                                adminUser.role
                              }
                            </span>
                          </td>

                          <td>
                            {
                              adminUser.created_at
                            }
                          </td>

                          <td>

                            <button
                              type="button"
                              className="admin-edit-btn"
                              onClick={() =>
                                alert(
                                  `Modifying role settings for ${adminUser.full_name}`
                                )
                              }
                            >
                              Edit Roles
                            </button>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* ========================================================
          NOTIFICATION & REMINDER CENTER MODAL
      ======================================================== */}

      {showNotificationCenter && (
        <NotificationCenter
          onClose={() => {
            setShowNotificationCenter(false);
            loadData();
          }}
          onNavigateTab={(targetTab) => {
            setActiveTab(targetTab);
          }}
        />
      )}

      {/* ========================================================
          LIFESTYLE LOGGER MODAL
      ======================================================== */}

      {showLogger && (
        <LifestyleLogger
          onLogSubmitted={
            handleLogSaved
          }
          onClose={() =>
            setShowLogger(false)
          }
        />
      )}

    </div>
  );
}