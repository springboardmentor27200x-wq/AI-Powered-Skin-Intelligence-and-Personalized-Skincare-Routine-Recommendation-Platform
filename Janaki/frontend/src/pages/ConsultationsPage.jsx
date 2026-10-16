import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyConsultations, getConsultationStats, createConsultation } from '../services/api.js';

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'in_review', 'completed'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newConsultation, setNewConsultation] = useState({ subject: '', description: '' });
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cons, st] = await Promise.all([
        getMyConsultations(),
        getConsultationStats()
      ]);
      setConsultations(Array.isArray(cons) ? cons : cons?.consultations || []);
      setStats(st);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Failed to fetch consultations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createConsultation(newConsultation);
      setShowModal(false);
      setNewConsultation({ subject: '', description: '' });
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Failed to create consultation');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = consultations.filter(c => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  return (
    <div className="container">
      {/* Hero */}
      <div className="consultation-hero">
        <div>
          <span className="eyebrow">PROFESSIONAL TELE-DERMATOLOGY</span>
          <h1>Clinical Consultations</h1>
          <p>Direct asynchronous communication with licensed dermatologists. Priority triage is automatically assigned from your skin assessment.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Request Consultation
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Stats Counter Bar */}
      {stats && (
        <div className="telemetry-grid" style={{ marginBottom: '20px' }}>
          <div className="metric-card" onClick={() => setFilter('all')} style={{ cursor: 'pointer' }}>
            <div className="metric-icon">📑</div>
            <div>
              <small>Total Cases</small>
              <div className="value">{stats.total || 0}</div>
            </div>
          </div>
          <div className="metric-card" onClick={() => setFilter('pending')} style={{ cursor: 'pointer' }}>
            <div className="metric-icon" style={{ background: '#fff3d5', color: '#b45309' }}>⏳</div>
            <div>
              <small>Pending Triage</small>
              <div className="value">{stats.pending || 0}</div>
            </div>
          </div>
          <div className="metric-card" onClick={() => setFilter('in_review')} style={{ cursor: 'pointer' }}>
            <div className="metric-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}>🩺</div>
            <div>
              <small>In Review</small>
              <div className="value">{stats.in_review || 0}</div>
            </div>
          </div>
          <div className="metric-card" onClick={() => setFilter('completed')} style={{ cursor: 'pointer' }}>
            <div className="metric-icon" style={{ background: '#dcfce7', color: '#15803d' }}>✅</div>
            <div>
              <small>Completed</small>
              <div className="value">{stats.completed || 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['all', 'pending', 'in_review', 'completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={filter === f ? 'btn-primary' : 'btn-secondary'}
            style={{ textTransform: 'capitalize' }}
          >
            {f === 'in_review' ? 'In Review' : f}
          </button>
        ))}
      </div>

      {loading && consultations.length === 0 && <div className="spinner" />}

      {/* Consultations Cards Grid */}
      <div className="consultation-list">
        {filtered.length === 0 && !loading && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <h3>No consultations found</h3>
            <p>You haven't requested any consultations under this status. Click "Request Consultation" to start.</p>
          </div>
        )}

        {filtered.map(c => (
          <div
            key={c.id}
            onClick={() => navigate(`/consultations/${c.id}`)}
            className="consultation-card"
          >
            <div className="consultation-card-top">
              <span className={`status-badge ${c.status}`}>
                {c.status?.replace('_', ' ')}
              </span>
              <span className={`priority-badge ${c.priority}`}>
                {c.priority} Priority
              </span>
            </div>

            <h3>{c.subject}</h3>
            <p>{c.description}</p>

            <div className="consultation-meta">
              <span>📅 {new Date(c.created_at).toLocaleDateString()}</span>
              {c.skin_type && <span>🧬 {c.skin_type} Skin</span>}
              {c.primary_concern && <span>🎯 {c.primary_concern}</span>}
              {c.dermatologist_name ? (
                <span style={{ color: 'var(--purple)', fontWeight: 700 }}>
                  👨‍⚕️ {c.dermatologist_name}
                </span>
              ) : (
                <span style={{ color: '#94a3b8' }}>Awaiting specialist assignment</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Consultation Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(20, 24, 38, 0.6)',
          backdropFilter: 'blur(5px)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '24px',
            maxWidth: '560px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Request Dermatologist Consultation</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              Your profile data and assessment severity will be automatically forwarded to the reviewing dermatologist.
            </p>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Subject / Primary Complaint</label>
                <input
                  type="text"
                  placeholder="E.g., Persistent inflammatory breakouts on jawline"
                  value={newConsultation.subject}
                  onChange={e => setNewConsultation({ ...newConsultation, subject: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Detailed Description of Symptoms & History</label>
                <textarea
                  rows="4"
                  placeholder="Describe when the issue began, current products used, whether it hurts or itches..."
                  value={newConsultation.description}
                  onChange={e => setNewConsultation({ ...newConsultation, description: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
