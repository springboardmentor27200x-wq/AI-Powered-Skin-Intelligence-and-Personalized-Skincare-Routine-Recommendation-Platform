import React, { useState, useEffect } from 'react';
import { api } from './api';

// ── Step Card with Clinical Product Integration ──────────────────────────────
function StepCard({
  step,
  name,
  product_type,
  product_name,
  brand,
  price,
  rating,
  image_url,
  key_ingredients,
  why,
  application,
  texture_benefit,
  frequency,
  index
}) {
  const [showDetails, setShowDetails] = useState(true);

  return (
    <div
      className="routine-step-card"
      style={{
        animationDelay: `${index * 0.06}s`,
        background: '#FFFFFF',
        borderRadius: '20px',
        padding: '24px',
        border: '1px solid rgba(192, 99, 122, 0.2)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        marginBottom: '20px',
        display: 'flex',
        gap: '20px',
        alignItems: 'flex-start'
      }}
    >
      {/* Step Number Circle */}
      <div style={{
        minWidth: '42px',
        height: '42px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #C0637A 0%, #9B3D56 100%)',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '800',
        fontSize: '16px',
        boxShadow: '0 4px 12px rgba(192, 99, 122, 0.3)'
      }}>
        {step}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#C0637A', fontWeight: '700', letterSpacing: '1px' }}>
              {product_type || 'Clinical Formulation'} {frequency ? `· ${frequency}` : ''}
            </div>
            <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#2D1822', margin: '2px 0 0 0' }}>
              {name}
            </h4>
          </div>

          <button
            onClick={() => setShowDetails(s => !s)}
            style={{
              padding: '4px 12px',
              borderRadius: '20px',
              background: '#FDF0F4',
              border: '1px solid rgba(192, 99, 122, 0.25)',
              color: '#C0637A',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {showDetails ? 'Hide Details' : 'View Instructions'}
          </button>
        </div>

        {/* Matched Real Product Card */}
        {product_name && (
          <div style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #FAF6F7 0%, #F5ECF0 100%)',
            borderRadius: '14px',
            border: '1px solid rgba(192, 99, 122, 0.2)',
            margin: '12px 0'
          }}>
            {image_url && (
              <img
                src={image_url}
                alt={product_name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=600&auto=format&fit=crop';
                }}
                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '10px', border: '1px solid rgba(192,99,122,0.2)' }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '14px', color: '#2D1822' }}>{product_name}</strong>
                <span style={{ fontSize: '11px', background: '#2D1822', color: '#FFFFFF', padding: '2px 8px', borderRadius: '6px' }}>
                  {brand}
                </span>
                {rating && <span style={{ fontSize: '11px', color: '#B8924A', fontWeight: '700' }}>★ {rating}</span>}
                {price && <span style={{ fontSize: '11px', color: '#6A5E66' }}>({price})</span>}
              </div>
              <div style={{ fontSize: '12px', color: '#6A5E66', marginTop: '4px' }}>
                {key_ingredients?.join(' · ')}
              </div>
            </div>
          </div>
        )}

        {/* Key Active Ingredients */}
        {!product_name && key_ingredients?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '8px 0' }}>
            {key_ingredients.map(ing => (
              <span key={ing} style={{ fontSize: '11px', background: '#F5F5F7', color: '#4A4048', padding: '3px 10px', borderRadius: '8px' }}>
                {ing}
              </span>
            ))}
          </div>
        )}

        {showDetails && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Texture Benefit Insight */}
            {texture_benefit && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(192, 99, 122, 0.08)',
                borderLeft: '3px solid #C0637A',
                fontSize: '12px',
                color: '#2D1822',
                lineHeight: '1.5'
              }}>
                <strong style={{ color: '#C0637A' }}>🔬 Texture Scan Calibration:</strong> {texture_benefit}
              </div>
            )}

            {/* Why Prescribed */}
            {why && (
              <p style={{ fontSize: '13px', color: '#4A4048', margin: 0, lineHeight: '1.6' }}>
                <strong>Why:</strong> {why}
              </p>
            )}

            {/* How to Apply / Clinical Use */}
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: '#FDFBFB',
              border: '1px dashed rgba(192, 99, 122, 0.3)',
              fontSize: '13px',
              color: '#2D1822'
            }}>
              <strong style={{ color: '#C0637A', display: 'block', marginBottom: '4px' }}>
                ✦ How to Use & Apply:
              </strong>
              {application}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Treatment Card ────────────────────────────────────────────────────────────
function TreatmentCard({ name, frequency, product_type, product_name, brand, key_ingredients, duration, why, application, texture_benefit, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid rgba(192, 99, 122, 0.2)',
        marginBottom: '16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
        <div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#C0637A', fontWeight: '700' }}>
            {frequency} · ⏱ {duration}
          </span>
          <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#2D1822', margin: '2px 0 0 0' }}>
            {name}
          </h4>
        </div>
        <span style={{ fontSize: '14px', color: '#C0637A' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ marginTop: '16px', borderTop: '1px solid #F0E6EB', paddingTop: '14px' }}>
          {product_name && (
            <div style={{ marginBottom: '10px', fontSize: '13px', color: '#2D1822' }}>
              <strong>Recommended Product:</strong> {product_name} <span style={{ color: '#C0637A' }}>({brand})</span>
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
            {key_ingredients?.map(ing => (
              <span key={ing} style={{ fontSize: '11px', background: '#F5F5F7', padding: '2px 8px', borderRadius: '6px' }}>{ing}</span>
            ))}
          </div>
          {texture_benefit && (
            <div style={{ fontSize: '12px', color: '#C0637A', marginBottom: '8px' }}>
              🔬 <strong>Texture Goal:</strong> {texture_benefit}
            </div>
          )}
          <p style={{ fontSize: '13px', color: '#4A4048', margin: '0 0 10px 0' }}>{why}</p>
          <div style={{ padding: '10px 12px', background: '#FAF6F7', borderRadius: '10px', fontSize: '12px' }}>
            <strong>How to use:</strong> {application}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Skincare Routine Panel Component ─────────────────────────────────────
export default function SkincareRoutinePanel({ onRoutineUpdated }) {
  const [routine, setRoutine] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('morning'); // morning | evening | weekly | prescription | seasonal

  const handleDownloadPDF = async () => {
    try {
      const blob = await api.exportRoutinePdf();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'skincare_routine.pdf';
      a.click();
    } catch (err) {
      setError('Failed to download PDF: ' + err.message);
    }
  };

  const loadData = async () => {
    try {
      const [rout, presc] = await Promise.all([
        api.getLatestRoutine().catch(() => null),
        api.getMyPrescription().catch(() => null),
      ]);
      setRoutine(rout);
      setPrescription(presc);
      if (onRoutineUpdated && rout) {
        onRoutineUpdated(rout);
      }
    } catch (err) {
      if (!err.message.includes('No routine found')) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.generateRoutine();
      setRoutine(res.routine);
      setIngredients(res.ingredient_highlights || []);
      if (onRoutineUpdated && res.routine) {
        onRoutineUpdated(res.routine);
      }
      setSuccessMsg('Personalized skincare routine with clinical dermatology products generated!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setError(err.message || 'Error generating skincare routine');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader-spinner" />
        <p>Loading Skincare Routine...</p>
      </div>
    );
  }

  return (
    <div className="routine-panel">
      {/* Header */}
      <div className="routine-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="panel-title" style={{ margin: '0 0 4px 0' }}>Personalized Skincare Routine</h2>
          <p className="panel-subtitle" style={{ margin: 0 }}>
            Precision Morning & Evening regimens curated with clinical dermatology & trendy formulations
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {routine && (
            <button
              onClick={handleDownloadPDF}
              style={{
                padding: '12px 24px',
                borderRadius: '14px',
                background: '#FFFFFF',
                color: '#C0637A',
                fontWeight: '700',
                fontSize: '13px',
                border: '1px solid rgba(192, 99, 122, 0.3)',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(192, 99, 122, 0.05)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📥</span> Download PDF
            </button>
          )}
          <button
            className="generate-routine-btn"
            onClick={handleGenerate}
            disabled={generating}
            style={{
              padding: '12px 24px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #C0637A 0%, #9B3D56 100%)',
              color: '#FFFFFF',
              fontWeight: '700',
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(192, 99, 122, 0.3)'
            }}
          >
            {generating ? 'Regenerating...' : (routine ? '↻ Regenerate Routine' : '✦ Generate Routine')}
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(30, 140, 95, 0.1)',
          border: '1px solid rgba(30, 140, 95, 0.3)',
          borderRadius: '12px',
          color: '#1E8C5F',
          fontWeight: '600',
          marginBottom: '16px'
        }}>
          ✓ {successMsg}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {/* Dermatologist Active Prescription Notice */}
      {prescription && (
        <div style={{
          background: 'linear-gradient(135deg, #2D1822 0%, #1F0F17 100%)',
          borderRadius: '20px',
          padding: '24px',
          color: '#FFFFFF',
          marginBottom: '24px',
          border: '1px solid rgba(192, 99, 122, 0.35)',
          boxShadow: '0 8px 24px rgba(192, 99, 122, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ background: '#C0637A', color: '#FFFFFF', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                ACTIVE MEDICAL PRESCRIPTION
              </span>
              <span style={{ color: '#B8924A', fontSize: '12px' }}>✦ {prescription.dermatologist_name}</span>
            </div>
            <h3 style={{ fontSize: '18px', margin: '0 0 4px 0', color: '#FFFFFF' }}>
              Clinical Focus: {prescription.clinical_focus || 'Barrier Repair & Sebum Regulation'}
            </h3>
            <p style={{ fontSize: '13px', color: '#E4D5DC', margin: 0 }}>
              <strong>Diagnosis:</strong> {prescription.diagnosis}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('prescription')}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: '#C0637A',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            View Doctor's Prescription ➔
          </button>
        </div>
      )}

      {/* Routine Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid rgba(192, 99, 122, 0.2)', paddingBottom: '14px', marginBottom: '24px', overflowX: 'auto' }}>
        {[
          { key: 'morning', label: '☀️ Morning Routine (AM)', count: routine?.morning_routine?.length },
          { key: 'evening', label: '🌙 Evening Routine (PM)', count: routine?.evening_routine?.length },
          { key: 'weekly', label: '✨ Weekly Treatments', count: routine?.weekly_treatments?.length },
          ...(prescription ? [{ key: 'prescription', label: '🩺 Dermatologist Prescription' }] : []),
          { key: 'seasonal', label: '🍂 Seasonal Tips' },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              border: 'none',
              background: activeTab === key ? '#C0637A' : '#FAF6F7',
              color: activeTab === key ? '#FFFFFF' : '#4A4048',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {label} {count !== undefined ? `(${count})` : ''}
          </button>
        ))}
      </div>

      {/* Content */}
      {!routine ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFFFF', borderRadius: '20px', border: '1px solid rgba(192, 99, 122, 0.2)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🧴</div>
          <h3 style={{ fontSize: '20px', color: '#2D1822', margin: '0 0 8px 0' }}>No Routine Generated Yet</h3>
          <p style={{ color: '#6A5E66', fontSize: '14px', maxWidth: '480px', margin: '0 auto 20px auto' }}>
            Click <strong>Generate Routine</strong> to create your personalized Morning & Evening skincare plan with real dermatology & trendy products tailored to your skin texture scan.
          </p>
          <button
            onClick={handleGenerate}
            style={{
              padding: '12px 28px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #C0637A 0%, #9B3D56 100%)',
              color: '#FFFFFF',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            ✦ Generate Routine Now
          </button>
        </div>
      ) : (
        <>
          {activeTab === 'morning' && (
            <div>
              <div style={{ marginBottom: '16px', color: '#6A5E66', fontSize: '13px' }}>
                Apply products in order from lightest watery consistency to thickest occlusive cream, finishing with broad-spectrum SPF.
              </div>
              {routine.morning_routine?.map((step, idx) => (
                <StepCard key={idx} {...step} index={idx} />
              ))}
            </div>
          )}

          {activeTab === 'evening' && (
            <div>
              <div style={{ marginBottom: '16px', color: '#6A5E66', fontSize: '13px' }}>
                Evening is when cellular skin regeneration peaks. Focus on deep pore clearing, active repair ingredients, and rich barrier restoration.
              </div>
              {routine.evening_routine?.map((step, idx) => (
                <StepCard key={idx} {...step} index={idx} />
              ))}
            </div>
          )}

          {activeTab === 'weekly' && (
            <div>
              <div style={{ marginBottom: '16px', color: '#6A5E66', fontSize: '13px' }}>
                Intensive chemical peels and restorative barrier masks to accelerate cellular turnover and refine rough texture.
              </div>
              {routine.weekly_treatments?.map((treatment, idx) => (
                <TreatmentCard key={idx} {...treatment} index={idx} />
              ))}
            </div>
          )}

          {activeTab === 'prescription' && prescription && (
            <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid rgba(192, 99, 122, 0.25)' }}>
              <div style={{ borderBottom: '1px solid #F0E6EB', paddingBottom: '16px', marginBottom: '20px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#C0637A', fontWeight: '700' }}>
                  Official Doctor's Prescription
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', margin: '4px 0', color: '#2D1822' }}>
                  Prescribed by {prescription.dermatologist_name}
                </h3>
                <p style={{ color: '#6A5E66', fontSize: '13px', margin: 0 }}>
                  Clinical Focus: <strong>{prescription.clinical_focus}</strong> · Review Period: {prescription.review_period_weeks} Weeks
                </p>
              </div>

              {/* Diagnosis & Notes */}
              <div style={{ background: '#FAF6F7', borderRadius: '14px', padding: '16px', marginBottom: '20px', border: '1px solid rgba(192, 99, 122, 0.15)' }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#C0637A', display: 'block', fontSize: '12px' }}>DIAGNOSTIC SUMMARY:</strong>
                  <span style={{ fontSize: '14px', color: '#2D1822' }}>{prescription.diagnosis}</span>
                </div>
                {prescription.clinical_notes && (
                  <div>
                    <strong style={{ color: '#C0637A', display: 'block', fontSize: '12px' }}>CLINICAL INSTRUCTIONS:</strong>
                    <span style={{ fontSize: '14px', color: '#2D1822' }}>{prescription.clinical_notes}</span>
                  </div>
                )}
              </div>

              {/* Prescribed AM Routine */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#C0637A', margin: '0 0 12px 0' }}>
                  ☀️ Prescribed Morning Steps ({prescription.prescribed_am_routine?.length || 0})
                </h4>
                {prescription.prescribed_am_routine?.map((item, idx) => (
                  <div key={idx} style={{ padding: '14px 18px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid #F0E6EB', marginBottom: '10px' }}>
                    <strong style={{ fontSize: '15px', color: '#2D1822' }}>{item.name}</strong> ({item.brand})
                    <div style={{ fontSize: '13px', color: '#6A5E66', marginTop: '4px' }}>
                      <strong>How to use:</strong> {item.custom_use || item.how_to_use}
                    </div>
                  </div>
                ))}
              </div>

              {/* Prescribed PM Routine */}
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#2D1822', margin: '0 0 12px 0' }}>
                  🌙 Prescribed Evening Steps ({prescription.prescribed_pm_routine?.length || 0})
                </h4>
                {prescription.prescribed_pm_routine?.map((item, idx) => (
                  <div key={idx} style={{ padding: '14px 18px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid #F0E6EB', marginBottom: '10px' }}>
                    <strong style={{ fontSize: '15px', color: '#2D1822' }}>{item.name}</strong> ({item.brand})
                    <div style={{ fontSize: '13px', color: '#6A5E66', marginTop: '4px' }}>
                      <strong>How to use:</strong> {item.custom_use || item.how_to_use}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'seasonal' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {routine.seasonal_tips?.map((tip, idx) => (
                <div key={idx} style={{ background: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid rgba(192, 99, 122, 0.2)' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#C0637A', fontWeight: '700' }}>
                    {tip.season} Adaptation
                  </span>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#2D1822', margin: '4px 0 8px 0' }}>
                    {tip.tip}
                  </h4>
                  <p style={{ fontSize: '13px', color: '#6A5E66', lineHeight: '1.5', margin: 0 }}>
                    {tip.detail}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
