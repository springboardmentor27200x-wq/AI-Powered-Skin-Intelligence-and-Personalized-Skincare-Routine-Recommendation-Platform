import React, { useState, useEffect } from 'react';
import { logRoutine, logProgress, getAnalyticsOverview, getRoutineLogs, getProgress } from '../services/api.js';

export default function ProgressPage() {
  const [activeTab, setActiveTab] = useState('routine'); // 'routine', 'progress', 'history'
  const [routineForm, setRoutineForm] = useState({
    date: new Date().toISOString().split('T')[0],
    morning_completed: true,
    evening_completed: true,
    sunscreen_completed: true,
    notes: ''
  });

  const [progressForm, setProgressForm] = useState({
    routine_adherence: 80,
    improvement_score: 5,
    hydration_score: 75,
    lifestyle_score: 80,
    sleep_score: 80,
    concern_status: '',
    notes: ''
  });

  const [analytics, setAnalytics] = useState(null);
  const [routineLogs, setRoutineLogs] = useState([]);
  const [progressEntries, setProgressEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, logsRes, progressRes] = await Promise.all([
        getAnalyticsOverview(),
        getRoutineLogs(14),
        getProgress(14)
      ]);
      setAnalytics(overviewRes);
      setRoutineLogs(logsRes?.logs || []);
      setProgressEntries(progressRes?.entries || []);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Failed to load progress telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoutineSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await logRoutine({
        log_date: routineForm.date,
        morning_completed: routineForm.morning_completed,
        evening_completed: routineForm.evening_completed,
        sunscreen_completed: routineForm.sunscreen_completed,
        notes: routineForm.notes,
      });
      setSuccessMsg('Daily routine logged successfully!');
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Failed to log routine');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await logProgress(progressForm);
      setSuccessMsg('Clinical skin progress entry recorded!');
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Failed to log progress');
    } finally {
      setSubmitting(false);
    }
  };

  const currentScore = analytics?.current?.skin_health_score || 80;
  const adherence = analytics?.current?.routine_adherence || 70;
  const trend = analytics?.change?.skin_health_trend || 'stable';

  return (
    <div className="container">
      {/* Hero */}
      <div className="feature-hero" style={{ background: 'linear-gradient(120deg, #e1f9f1, #e5f2ff 55%, #f4eaff)' }}>
        <div>
          <span className="eyebrow">CHRONOLOGICAL BIOMETRICS</span>
          <h1>Progress & Routine Tracking</h1>
          <p>Continuous longitudinal tracking of skincare adherence, barrier recovery velocity, and clinical milestone achievements.</p>
        </div>
        <div className="feature-emoji">📈</div>
      </div>

      {/* Telemetry Metrics */}
      <div className="telemetry-grid">
        <div className="metric-card">
          <div className="metric-icon">✨</div>
          <div>
            <small>Current Skin Health</small>
            <div className="value">{currentScore}/100</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">🔄</div>
          <div>
            <small>Routine Adherence</small>
            <div className="value">{adherence}%</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div>
            <small>Trend Direction</small>
            <div className="value" style={{ textTransform: 'capitalize' }}>{trend}</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">📋</div>
          <div>
            <small>Total Logs Recorded</small>
            <div className="value">{routineLogs.length + progressEntries.length}</div>
          </div>
        </div>
      </div>

      {successMsg && <div className="success-message">{successMsg}</div>}
      {error && <div className="error-message">{error}</div>}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '22px' }}>
        <button
          onClick={() => setActiveTab('routine')}
          className={activeTab === 'routine' ? 'btn-primary' : 'btn-secondary'}
        >
          📅 Log Daily Routine
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={activeTab === 'progress' ? 'btn-primary' : 'btn-secondary'}
        >
          🔬 Record Clinical Check
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}
        >
          📜 Routine & Progress History
        </button>
      </div>

      {/* TAB 1: Log Daily Routine */}
      {activeTab === 'routine' && (
        <div className="modern-form" style={{ maxWidth: '640px' }}>
          <div className="section-title">
            <span>☀️</span>
            <div>
              <h3>Daily Skincare Protocol Verification</h3>
              <p>Log morning, evening, and daytime UV protection adherence.</p>
            </div>
          </div>

          <form onSubmit={handleRoutineSubmit}>
            <div className="form-group">
              <label>Log Date</label>
              <input
                type="date"
                value={routineForm.date}
                onChange={e => setRoutineForm({ ...routineForm, date: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '18px 0', padding: '16px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #edf0f5' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={routineForm.morning_completed}
                  onChange={e => setRoutineForm({ ...routineForm, morning_completed: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                ☀️ Morning Protocol Completed (Cleanser + Hydration + Treatment)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={routineForm.sunscreen_completed}
                  onChange={e => setRoutineForm({ ...routineForm, sunscreen_completed: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                🛡️ Daytime UV Protection Applied (Broad Spectrum SPF 30+)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={routineForm.evening_completed}
                  onChange={e => setRoutineForm({ ...routineForm, evening_completed: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                🌙 Evening Protocol Completed (Cleanser + Recovery Moisturizer)
              </label>
            </div>

            <div className="form-group">
              <label>Observations & Notes (Optional)</label>
              <textarea
                rows="3"
                placeholder="E.g., No irritation experienced, skin felt well hydrated all afternoon..."
                value={routineForm.notes}
                onChange={e => setRoutineForm({ ...routineForm, notes: e.target.value })}
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>
              {submitting ? 'Saving...' : 'Save Routine Log'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: Record Clinical Progress */}
      {activeTab === 'progress' && (
        <div className="modern-form" style={{ maxWidth: '640px' }}>
          <div className="section-title">
            <span>🔬</span>
            <div>
              <h3>Self-Evaluation & Biometric Scores</h3>
              <p>Periodically evaluate barrier integrity and habit adherence.</p>
            </div>
          </div>

          <form onSubmit={handleProgressSubmit}>
            <div className="form-group">
              <label>Routine Adherence Self-Score: {progressForm.routine_adherence}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={progressForm.routine_adherence}
                onChange={e => setProgressForm({ ...progressForm, routine_adherence: Number(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label>Hydration Level Score: {progressForm.hydration_score}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={progressForm.hydration_score}
                onChange={e => setProgressForm({ ...progressForm, hydration_score: Number(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label>Sleep & Recovery Score: {progressForm.sleep_score}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={progressForm.sleep_score}
                onChange={e => setProgressForm({ ...progressForm, sleep_score: Number(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label>Primary Concern Status (Optional)</label>
              <input
                type="text"
                placeholder="E.g., Redness reduced by 50%, fewer active breakouts"
                value={progressForm.concern_status}
                onChange={e => setProgressForm({ ...progressForm, concern_status: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Clinical Notes</label>
              <textarea
                rows="3"
                placeholder="Notes on tolerance, reactions, or improvements..."
                value={progressForm.notes}
                onChange={e => setProgressForm({ ...progressForm, notes: e.target.value })}
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>
              {submitting ? 'Recording...' : 'Record Clinical Entry'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: History */}
      {activeTab === 'history' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Routine Logs */}
          <div className="history-card">
            <h3 style={{ fontSize: '15px', color: '#334155', padding: '12px 14px', borderBottom: '1px solid #edf0f5' }}>
              Recent Routine Logs ({routineLogs.length})
            </h3>
            {routineLogs.length === 0 ? (
              <p style={{ padding: '20px', color: '#94a3b8', fontSize: '13px' }}>No routine logs recorded yet.</p>
            ) : (
              routineLogs.map((log) => (
                <div key={log.id} className="history-item">
                  <div>
                    <strong>📅 {log.log_date}</strong>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '11px' }}>
                      <span className={`badge ${log.morning_completed ? 'badge-success' : ''}`}>
                        {log.morning_completed ? '☀️ AM' : '—'}
                      </span>
                      <span className={`badge ${log.sunscreen_completed ? 'badge-success' : ''}`}>
                        {log.sunscreen_completed ? '🛡️ SPF' : '—'}
                      </span>
                      <span className={`badge ${log.evening_completed ? 'badge-success' : ''}`}>
                        {log.evening_completed ? '🌙 PM' : '—'}
                      </span>
                    </div>
                    {log.notes && (
                      <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginTop: '4px' }}>
                        "{log.notes}"
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Progress Entries */}
          <div className="history-card">
            <h3 style={{ fontSize: '15px', color: '#334155', padding: '12px 14px', borderBottom: '1px solid #edf0f5' }}>
              Clinical Skin Health Records ({progressEntries.length})
            </h3>
            {progressEntries.length === 0 ? (
              <p style={{ padding: '20px', color: '#94a3b8', fontSize: '13px' }}>No progress entries recorded yet.</p>
            ) : (
              progressEntries.map((entry) => (
                <div key={entry.id} className="history-item">
                  <div>
                    <strong>Recorded: {new Date(entry.recorded_at).toLocaleDateString()}</strong>
                    <span>Concern: {entry.concern_status || 'Under review'}</span>
                    {entry.notes && (
                      <span style={{ fontSize: '12px', color: '#64748b' }}>"{entry.notes}"</span>
                    )}
                  </div>
                  <b>{entry.skin_health_score}/100</b>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
