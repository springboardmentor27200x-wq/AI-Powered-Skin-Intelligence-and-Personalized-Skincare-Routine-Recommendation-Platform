import React, { useState, useEffect } from 'react';
import { api } from './api';
import LifestyleLogger from './LifestyleLogger';

// ── Severity config ──────────────────────────────────────────────────────────
const SEVERITY_CONFIG = {
  Critical: { color: 'var(--danger)', bg: 'var(--danger-dim)', border: 'var(--danger-border)', icon: '⚠' },
  Moderate: { color: 'var(--warning)', bg: 'var(--warning-dim)', border: 'var(--warning-border)', icon: '◉' },
  Low:      { color: 'var(--info)',    bg: 'var(--info-dim)',    border: 'var(--info-border)',    icon: '○' },
};

const RISK_SEVERITY = {
  High:     { color: 'var(--danger)', bg: 'var(--danger-dim)', border: 'var(--danger-border)' },
  Moderate: { color: 'var(--warning)', bg: 'var(--warning-dim)', border: 'var(--warning-border)' },
  Low:      { color: 'var(--info)',    bg: 'var(--info-dim)',    border: 'var(--info-border)' },
};

// ── Score Breakdown Bar ──────────────────────────────────────────────────────
function ScoreBar({ label, rawScore, weight, contribution, description }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="score-factor-row">
      <div className="score-factor-header">
        <span className="score-factor-label">{label}</span>
        <div className="score-factor-right">
          <span className="score-factor-weight">{(weight * 100).toFixed(0)}% weight</span>
          <span className="score-factor-value">{rawScore.toFixed(0)}/100</span>
        </div>
      </div>
      <div className="score-factor-bar-track">
        <div
          className="score-factor-bar-fill"
          style={{
            width: animated ? `${rawScore}%` : '0%',
            background: rawScore >= 70
              ? 'linear-gradient(90deg, var(--success), #52c4a0)'
              : rawScore >= 45
              ? 'linear-gradient(90deg, var(--warning), var(--gold-light))'
              : 'linear-gradient(90deg, var(--danger), var(--rose-light))',
          }}
        />
      </div>
      <p className="score-factor-desc">{description}</p>
    </div>
  );
}

// ── Concern Card ─────────────────────────────────────────────────────────────
function ConcernCard({ concern, score, severity, modifiers_applied, explanation, index }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.Low;

  return (
    <div
      className="concern-card"
      style={{
        borderColor: cfg.border,
        animationDelay: `${index * 0.07}s`,
      }}
    >
      <div className="concern-card-header" onClick={() => setExpanded(e => !e)}>
        <div className="concern-card-left">
          <span className="concern-severity-dot" style={{ background: cfg.color }} />
          <span className="concern-name">{concern}</span>
          <span
            className="concern-severity-badge"
            style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
          >
            {cfg.icon} {severity}
          </span>
        </div>
        <div className="concern-card-right">
          <span className="concern-score-chip" style={{ color: cfg.color }}>{score}/10</span>
          <span className="concern-expand-btn">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>
      {expanded && (
        <div className="concern-card-body">
          <p className="concern-explanation">{explanation}</p>
          {modifiers_applied?.length > 0 && (
            <div className="concern-modifiers">
              <span className="modifiers-label">Factors driving this score:</span>
              <ul>
                {modifiers_applied.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Risk Factor Card ─────────────────────────────────────────────────────────
function RiskCard({ risk, severity, description, recommended_action, index }) {
  const cfg = RISK_SEVERITY[severity] || RISK_SEVERITY.Low;
  return (
    <div
      className="risk-card"
      style={{
        borderLeftColor: cfg.color,
        animationDelay: `${index * 0.08}s`,
      }}
    >
      <div className="risk-header">
        <span className="risk-name">{risk}</span>
        <span
          className="risk-severity-badge"
          style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
        >
          {severity} Risk
        </span>
      </div>
      <p className="risk-description">{description}</p>
      <div className="risk-action">
        <span className="risk-action-label">✦ Recommended Action:</span>
        <span className="risk-action-text">{recommended_action}</span>
      </div>
    </div>
  );
}

// ── Lifestyle Snapshot ───────────────────────────────────────────────────────
function LifestyleSnapshot({ snapshot }) {
  if (!snapshot) return null;
  const items = [
    { label: 'Avg Sleep', value: `${snapshot.avg_sleep_hours}h`, good: snapshot.avg_sleep_hours >= 7 },
    { label: 'Water Intake', value: `${(snapshot.avg_water_intake_ml / 1000).toFixed(1)}L`, good: snapshot.avg_water_intake_ml >= 2000 },
    { label: 'SPF Compliance', value: `${snapshot.sunscreen_compliance_rate?.toFixed(0)}%`, good: snapshot.sunscreen_compliance_rate >= 70 },
    { label: 'UV Exposure', value: snapshot.avg_uv_exposure || '—', good: ['Low', 'None'].includes(snapshot.avg_uv_exposure) },
    { label: 'Stress Level', value: snapshot.avg_stress_level || '—', good: snapshot.avg_stress_level === 'Low' },
    { label: 'Days Logged', value: snapshot.total_logs, good: snapshot.total_logs >= 7 },
  ];

  return (
    <div className="lifestyle-snapshot-grid">
      {items.map(({ label, value, good }) => (
        <div key={label} className="snapshot-item">
          <span className="snapshot-val" style={{ color: good ? 'var(--success)' : 'var(--warning)' }}>
            {value}
          </span>
          <span className="snapshot-label">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function SkinAssessmentPanel() {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [showLogger, setShowLogger] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('concerns'); // concerns | score | risks | snapshot

  const handleDownloadPDF = async () => {
    try {
      const blob = await api.exportAssessmentPdf();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'assessment_report.pdf';
      a.click();
    } catch (err) {
      setError('Failed to download PDF: ' + err.message);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const blob = await api.exportAssessmentExcel();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'assessments_history.xlsx';
      a.click();
    } catch (err) {
      setError('Failed to download Excel: ' + err.message);
    }
  };

  const fetchLatest = async () => {
    try {
      const data = await api.getLatestAssessment();
      setAssessment(data);
    } catch (err) {
      if (!err.message.includes('No assessment found')) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLatest(); }, []);

  const handleRunAssessment = async () => {
    setRunning(true);
    setError('');
    try {
      const res = await api.runAssessment();
      setAssessment(res.assessment);
      setActiveTab('concerns');
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 65) return 'var(--info)';
    if (score >= 50) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 65) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Attention';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader-spinner" />
        <p>Loading assessment...</p>
      </div>
    );
  }

  return (
    <div className="assessment-panel">
      {/* Header */}
      <div className="assessment-panel-header">
        <div>
          <h2 className="panel-title">Skin Assessment</h2>
          <p className="panel-subtitle">AI-powered analysis of your skin health, concerns, and risk factors</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => setShowLogger(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              fontSize: '0.82rem',
              fontWeight: 600
            }}
          >
            <span>📝</span> Log Daily Lifestyle
          </button>
          {assessment && (
            <>
              <button
                type="button"
                className="secondary-btn"
                onClick={handleDownloadPDF}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 600
                }}
              >
                <span>📥</span> PDF Report
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={handleDownloadExcel}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 600
                }}
              >
                <span>📊</span> Excel
              </button>
            </>
          )}
          <button
            className="run-assessment-btn"
            onClick={handleRunAssessment}
            disabled={running}
          >
            {running ? (
              <><span className="btn-spinner" />Analyzing...</>
            ) : (
              <>{assessment ? '↻ Re-run Assessment' : '▶ Run Assessment'}</>
            )}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {!assessment ? (
        <div className="assessment-empty">
          <div className="assessment-empty-icon">✦</div>
          <h3>No Assessment Yet</h3>
          <p>Click <strong>Run Assessment</strong> to analyze your skin profile and get a comprehensive health report with personalized insights.</p>
          <div className="assessment-preview-chips">
            {['Concern Analysis', 'Risk Factors', 'Health Score', 'Lifestyle Impact'].map(t => (
              <span key={t} className="preview-chip">{t}</span>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Score Hero */}
          <div className="assessment-score-hero glass-card">
            <div className="score-hero-left">
              <span className="score-hero-label">Overall Skin Health Score</span>
              <div className="score-hero-number" style={{ color: getScoreColor(assessment.overall_score) }}>
                {assessment.overall_score.toFixed(1)}
                <span className="score-hero-max">/100</span>
              </div>
              <span
                className="score-hero-rating"
                style={{
                  color: getScoreColor(assessment.overall_score),
                  background: `color-mix(in srgb, ${getScoreColor(assessment.overall_score)} 10%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${getScoreColor(assessment.overall_score)} 25%, transparent)`,
                }}
              >
                {getScoreLabel(assessment.overall_score)}
              </span>
              <span className="score-hero-date">
                Last assessed: {new Date(assessment.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </span>
            </div>
            <div className="score-hero-right">
              <div className="concern-count-row">
                <div className="count-chip critical">
                  <span>{assessment.concern_analysis?.filter(c => c.severity === 'Critical').length ?? 0}</span>
                  Critical
                </div>
                <div className="count-chip moderate">
                  <span>{assessment.concern_analysis?.filter(c => c.severity === 'Moderate').length ?? 0}</span>
                  Moderate
                </div>
                <div className="count-chip low">
                  <span>{assessment.concern_analysis?.filter(c => c.severity === 'Low').length ?? 0}</span>
                  Low
                </div>
              </div>
              <div className="risk-count-row">
                <span className="risk-count-label">
                  {assessment.risk_factors?.length ?? 0} risk factor{assessment.risk_factors?.length !== 1 ? 's' : ''} identified
                </span>
              </div>
            </div>
          </div>

          {/* Inner tabs */}
          <div className="assessment-inner-tabs">
            {[
              { key: 'concerns', label: 'Concerns', count: assessment.concern_analysis?.length },
              { key: 'score', label: 'Score Breakdown' },
              { key: 'risks', label: 'Risk Factors', count: assessment.risk_factors?.length },
              { key: 'snapshot', label: 'Lifestyle Snapshot' },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                className={`assessment-tab-btn ${activeTab === key ? 'active' : ''}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
                {count !== undefined && <span className="tab-count">{count}</span>}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="assessment-tab-content">
            {activeTab === 'concerns' && (
              <div className="concerns-list">
                {assessment.concern_analysis?.length > 0 ? (
                  assessment.concern_analysis.map((c, i) => (
                    <ConcernCard key={c.concern} {...c} index={i} />
                  ))
                ) : (
                  <div className="empty-tab">No significant skin concerns detected. Great skin health!</div>
                )}
              </div>
            )}

            {activeTab === 'score' && (
              <div className="score-breakdown-list">
                <p className="breakdown-formula-note">
                  Skin Health Score = Σ (Factor Score × Weight). All factors scored 0–100.
                </p>
                {assessment.score_breakdown && Object.entries(assessment.score_breakdown).map(([label, data]) => (
                  <ScoreBar
                    key={label}
                    label={label}
                    rawScore={data.raw_score}
                    weight={data.weight}
                    contribution={data.weighted_contribution}
                    description={data.description}
                  />
                ))}
              </div>
            )}

            {activeTab === 'risks' && (
              <div className="risks-list">
                {assessment.risk_factors?.length > 0 ? (
                  assessment.risk_factors.map((r, i) => (
                    <RiskCard key={r.risk} {...r} index={i} />
                  ))
                ) : (
                  <div className="empty-tab">No significant risk factors identified. Keep up your current habits!</div>
                )}
              </div>
            )}

            {activeTab === 'snapshot' && (
              <div className="snapshot-tab-wrapper">
                <div style={{
                  background: 'linear-gradient(135deg, var(--bg-card), var(--rose-pale))',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '3px' }}>
                      📅 Daily Lifestyle Logging
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                      Log sleep, hydration, UV exposure, stress & SPF compliance to keep your lifestyle snapshot accurate.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setShowLogger(true)}
                    style={{ whiteSpace: 'nowrap', fontWeight: 600 }}
                  >
                    📝 Open Lifestyle Logger
                  </button>
                </div>
                <p className="snapshot-note">Based on your last 30 days of lifestyle logs.</p>
                <LifestyleSnapshot snapshot={assessment.lifestyle_snapshot} />
              </div>
            )}
          </div>
        </>
      )}

      {/* Daily Lifestyle Logger Modal */}
      {showLogger && (
        <LifestyleLogger
          onLogSubmitted={async () => {
            setShowLogger(false);
            // Refresh assessment to reflect new lifestyle logs immediately
            await fetchLatest();
          }}
          onClose={() => setShowLogger(false)}
        />
      )}
    </div>
  );
}

