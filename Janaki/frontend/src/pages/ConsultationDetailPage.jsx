import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getConsultation,
  getConsultationMessages,
  sendConsultationMessage,
  cancelConsultation,
  acceptConsultation,
  respondConsultation
} from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ConsultationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [consultation, setConsultation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Doctor response modal state
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [doctorRecs, setDoctorRecs] = useState('');
  const [responding, setResponding] = useState(false);

  const messagesEndRef = useRef(null);

  const fetchDetails = async () => {
    try {
      const [cons, msgs] = await Promise.all([
        getConsultation(id),
        getConsultationMessages(id)
      ]);
      setConsultation(cons);
      setMessages(Array.isArray(msgs) ? msgs : msgs?.messages || []);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Failed to load consultation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    const interval = setInterval(async () => {
      try {
        const msgs = await getConsultationMessages(id);
        setMessages(Array.isArray(msgs) ? msgs : msgs?.messages || []);
      } catch {
        // Polling failure silent
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await sendConsultationMessage(id, newMessage.trim());
      setNewMessage('');
      const msgs = await getConsultationMessages(id);
      setMessages(Array.isArray(msgs) ? msgs : msgs?.messages || []);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this consultation?')) return;
    try {
      await cancelConsultation(id);
      fetchDetails();
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Cancellation failed');
    }
  };

  const handleAccept = async () => {
    try {
      await acceptConsultation(id);
      fetchDetails();
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Acceptance failed');
    }
  };

  const handleDoctorSubmitResponse = async (e) => {
    e.preventDefault();
    setResponding(true);
    try {
      await respondConsultation(id, {
        dermatologist_notes: doctorNotes,
        recommendations: doctorRecs
      });
      setShowRespondModal(false);
      fetchDetails();
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Failed to submit response');
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <p>Connecting to secure clinical tele-channel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/consultations')} className="btn-secondary">
          ← Back to Consultations
        </button>
      </div>
    );
  }

  if (!consultation) return null;

  const isDermatologist = user?.role === 'dermatologist' || user?.role === 'admin';
  const isPatient = consultation.user_id === user?.id;

  return (
    <div className="container">
      {/* Top Header */}
      <div style={{ marginBottom: '14px' }}>
        <button onClick={() => navigate('/consultations')} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 14px' }}>
          ← Back to Consultations
        </button>
      </div>

      <div className="consultation-card" style={{ cursor: 'default', marginBottom: '20px' }}>
        <div className="consultation-card-top">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className={`status-badge ${consultation.status}`}>
              {consultation.status?.replace('_', ' ')}
            </span>
            <span className={`priority-badge ${consultation.priority}`}>
              {consultation.priority} Priority
            </span>
          </div>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            Case #{consultation.id} • {new Date(consultation.created_at).toLocaleDateString()}
          </span>
        </div>

        <h2 style={{ fontSize: '22px', margin: '12px 0 6px', color: '#2c354e' }}>
          {consultation.subject}
        </h2>
        <p style={{ fontSize: '14px', color: '#55627a', lineHeight: 1.6 }}>
          {consultation.description}
        </p>

        <div className="consultation-meta" style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #edf0f5' }}>
          <span>👤 Patient: <strong>{consultation.patient_name || 'Patient'}</strong></span>
          <span>🧬 Skin Type: <strong>{consultation.skin_type || 'N/A'}</strong></span>
          <span>🎯 Concern: <strong>{consultation.primary_concern || 'N/A'}</strong></span>
          <span>
            👨‍⚕️ Dermatologist: <strong>{consultation.dermatologist_name || 'Unassigned'}</strong>
          </span>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          {isDermatologist && consultation.status === 'pending' && (
            <button onClick={handleAccept} className="btn-primary">
              Accept Consultation Request
            </button>
          )}

          {isDermatologist && (consultation.status === 'in_review' || consultation.status === 'pending') && (
            <button onClick={() => setShowRespondModal(true)} className="btn-mint">
              📝 Submit Clinical Evaluation
            </button>
          )}

          {consultation.status !== 'completed' && consultation.status !== 'cancelled' && (
            <button onClick={handleCancel} className="danger-button" style={{ fontSize: '12px' }}>
              Cancel Consultation
            </button>
          )}
        </div>
      </div>

      {/* Completed Doctor Notes Banner */}
      {(consultation.dermatologist_notes || consultation.recommendations) && (
        <div className="card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px' }}>👨‍⚕️</span>
            <h3 style={{ fontSize: '16px', color: '#166534', margin: 0 }}>
              Official Dermatologist Treatment Plan & Notes
            </h3>
          </div>
          {consultation.dermatologist_notes && (
            <div style={{ marginTop: '8px' }}>
              <strong style={{ fontSize: '12px', color: '#14532d' }}>Clinical Assessment:</strong>
              <p style={{ fontSize: '13px', color: '#166534', marginTop: '4px', lineHeight: 1.6 }}>
                {consultation.dermatologist_notes}
              </p>
            </div>
          )}
          {consultation.recommendations && (
            <div style={{ marginTop: '10px', borderTop: '1px solid #bbf7d0', paddingTop: '8px' }}>
              <strong style={{ fontSize: '12px', color: '#14532d' }}>Prescribed Regimen & Advice:</strong>
              <p style={{ fontSize: '13px', color: '#166534', marginTop: '4px', lineHeight: 1.6 }}>
                {consultation.recommendations}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Chat & Clinical Context Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Real-time Chat Panel */}
        <div className="chat-panel">
          <div className="chat-header">
            <div>
              <h3 style={{ fontSize: '15px', margin: 0 }}>Direct Clinical Messaging</h3>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
                Secure encrypted tele-dermatology exchange
              </p>
            </div>
            <span className="badge badge-success">Live Session</span>
          </div>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                <p>No messages exchanged yet.</p>
                <small>Send a greeting or detailed question below to begin.</small>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.sender_id === user?.id;
                return (
                  <div
                    key={m.id}
                    className={`message ${isMe ? 'user' : 'other'}`}
                  >
                    <div style={{ fontSize: '10px', fontWeight: 800, color: isMe ? '#765be1' : '#64748b', marginBottom: '3px' }}>
                      {m.sender_name || (isMe ? 'You' : 'Specialist')}
                    </div>
                    <p style={{ margin: 0, wordBreak: 'break-word' }}>{m.message}</p>
                    <small>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {consultation.status !== 'cancelled' ? (
            <form onSubmit={handleSend} className="chat-input">
              <input
                type="text"
                placeholder="Type your message to the specialist..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                disabled={sending}
              />
              <button type="submit" disabled={sending || !newMessage.trim()} className="btn-primary">
                {sending ? '...' : 'Send'}
              </button>
            </form>
          ) : (
            <div style={{ padding: '12px', textAlign: 'center', color: '#dc2626', background: '#fef2f2', fontSize: '12px' }}>
              This consultation has been cancelled. Messaging is disabled.
            </div>
          )}
        </div>

        {/* Clinical Side Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <h4 style={{ fontSize: '14px', color: '#334155', marginBottom: '10px' }}>Patient Clinical Snapshot</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #edf0f5', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Skin Type</span>
                <strong>{consultation.skin_type || 'Unspecified'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #edf0f5', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Primary Concern</span>
                <strong>{consultation.primary_concern || 'Unspecified'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #edf0f5', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Priority Level</span>
                <span className={`priority-badge ${consultation.priority}`}>{consultation.priority}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '2px' }}>
                <span style={{ color: '#64748b' }}>Status</span>
                <span className={`status-badge ${consultation.status}`}>{consultation.status}</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ background: '#f8fafc' }}>
            <h4 style={{ fontSize: '13px', color: '#475569', marginBottom: '6px' }}>Tele-health Best Practices</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '12px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>• Share symptom durations & current active skincare.</li>
              <li>• Mention any itchiness, pain, or seasonal fluctuations.</li>
              <li>• Do not make radical skincare alterations without physician review.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Doctor Respond Modal */}
      {showRespondModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(20, 24, 38, 0.65)',
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
            <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Submit Clinical Consultation Response</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px' }}>
              Provide your clinical impression, safety cautions, and personalized regimen instructions for the patient.
            </p>

            <form onSubmit={handleDoctorSubmitResponse}>
              <div className="form-group">
                <label>Clinical Notes / Diagnostic Impression</label>
                <textarea
                  rows="3"
                  placeholder="Observations on skin barrier, mild follicular inflammation, erythema..."
                  value={doctorNotes}
                  onChange={e => setDoctorNotes(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Prescribed Regimen & Recommendations</label>
                <textarea
                  rows="3"
                  placeholder="Recommend barrier-support moisturizer, discontinue physical scrubs, patch test actives..."
                  value={doctorRecs}
                  onChange={e => setDoctorRecs(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowRespondModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={responding}
                  className="btn-primary"
                >
                  {responding ? 'Saving...' : 'Finalize & Send Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
