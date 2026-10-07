import React, { useState, useEffect } from 'react';
import { api } from './api';

const ProgressTracker = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(50);
  const [notes, setNotes] = useState("");

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await api.getProgressAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error("Error fetching analytics", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogProgress = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");
    try {
      await api.logProgress({
        skin_health_score: score,
        notes: notes,
        routine_adherence: 100
      });
      setScore(50);
      setNotes("");
      fetchAnalytics();
      setSuccessMsg("Your skin progress has been beautifully logged!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMsg("Error logging progress: " + err.message);
    }
  };

  if (loading) return <div className="loading-spinner">Loading your skin journey...</div>;

  const renderTrendIcon = (trend) => {
    if (trend === 'improving') return '📈';
    if (trend === 'declining') return '📉';
    return '➖';
  };

  const formatScore = (score) => {
    if (score == null) return "0";
    return Number(score).toFixed(1);
  };

  return (
    <div className="progress-panel panel-glass">
      <div className="panel-header-centered">
        <h3>Skin Journey</h3>
        <p>Track your health over time to see what routines are working.</p>
      </div>

      <div className="analytics-summary">
        <div className="stat-card">
          <div className="stat-icon">✨</div>
          <span className="stat-value">{formatScore(analytics?.average_score)}</span>
          <h4>Avg Health Score</h4>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <span className="stat-value">{analytics?.total_logs || 0}</span>
          <h4>Total Entries</h4>
        </div>
        <div className="stat-card">
          <div className="stat-icon">{renderTrendIcon(analytics?.trend)}</div>
          <span className={`stat-value trend-${analytics?.trend || 'neutral'}`}>
            <span className="capitalize">{analytics?.trend || 'Neutral'}</span>
          </span>
          <h4>Current Trend</h4>
        </div>
      </div>

      <div className="log-form-container">
        <div className="log-form-header">
          <h4>Daily Check-in</h4>
          <p>How is your skin feeling today?</p>
        </div>

        {successMsg && <div className="inline-alert success">{successMsg}</div>}
        {errorMsg && <div className="inline-alert danger">{errorMsg}</div>}

        <form onSubmit={handleLogProgress} className="log-form">
          <div className="form-group score-group">
            <label>Skin Health Score</label>
            <div className="score-display">
              <span className="score-value">{score}</span>
              <span className="score-max">/ 100</span>
            </div>
            <input
              type="range"
              min="0" max="100"
              className="styled-slider"
              value={score}
              onChange={e => setScore(Number(e.target.value))}
            />
            <div className="slider-labels">
              <span>Struggling</span>
              <span>Radiant</span>
            </div>
          </div>

          <div className="form-group">
            <label>Journal Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notice any new breakouts or extra glow today?"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full">
            Log Progress
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProgressTracker;
