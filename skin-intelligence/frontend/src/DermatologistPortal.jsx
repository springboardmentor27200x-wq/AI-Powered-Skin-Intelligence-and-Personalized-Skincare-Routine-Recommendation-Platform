import React, { useState, useEffect } from 'react';
import { api } from './api';

export default function DermatologistPortal({ user }) {
  const [patients, setPatients] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected patient for prescription
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPrescribeModal, setShowPrescribeModal] = useState(false);

  // Filters
  const [searchPatient, setSearchPatient] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('All');
  const [catalogTag, setCatalogTag] = useState('All');
  const [searchProduct, setSearchProduct] = useState('');

  // Active prescription form
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalFocus, setClinicalFocus] = useState('Barrier Repair & Sebum Regulation');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [reviewWeeks, setReviewWeeks] = useState(4);
  const [prescribedAM, setPrescribedAM] = useState([]);
  const [prescribedPM, setPrescribedPM] = useState([]);
  const [savingPrescription, setSavingPrescription] = useState(false);

  // Active View Tab: 'patients' or 'catalog'
  const [activeTab, setActiveTab] = useState('patients');

  const loadPortalData = async () => {
    setLoading(true);
    setError('');
    try {
      const [pts, prods] = await Promise.all([
        api.getDermatologistPatients().catch(() => []),
        api.getDermatologistCatalog().catch(() => []),
      ]);
      setPatients(pts || []);
      setCatalog(prods || []);
    } catch (err) {
      setError(err.message || 'Failed to load clinical portal data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, []);

  const handleOpenPrescription = (patient) => {
    setSelectedPatient(patient);
    setDiagnosis(
      `Patient presents with ${patient.skin_type || 'Combination'} skin. ` +
      (patient.latest_texture_score ? `AI Camera Texture score: ${patient.latest_texture_score.toFixed(1)}/100 (${patient.texture_primary_concern || 'Surface Roughness'}).` : '')
    );
    setClinicalNotes(
      'Follow prescribed AM and PM regimens consistently. Avoid harsh physical scrubs. Patch test active exfoliants on inner wrist for 24h prior to facial application.'
    );
    // Seed default items from catalog matching concerns
    const cleanser = catalog.find(p => p.category === 'Cleanser') || null;
    const serum = catalog.find(p => p.category === 'Serum') || null;
    const moisturizer = catalog.find(p => p.category === 'Moisturizer') || null;
    const spf = catalog.find(p => p.category === 'Sunscreen') || null;
    const exfoliant = catalog.find(p => p.category === 'Exfoliant') || null;

    setPrescribedAM([
      cleanser ? { ...cleanser, step_name: 'Step 1: Gentle AM Cleanser', custom_use: cleanser.how_to_use } : null,
      serum ? { ...serum, step_name: 'Step 2: Daytime Antioxidant / Active', custom_use: serum.how_to_use } : null,
      moisturizer ? { ...moisturizer, step_name: 'Step 3: Barrier Moisture Shield', custom_use: moisturizer.how_to_use } : null,
      spf ? { ...spf, step_name: 'Step 4: Broad-Spectrum UV Protection', custom_use: spf.how_to_use } : null,
    ].filter(Boolean));

    setPrescribedPM([
      cleanser ? { ...cleanser, step_name: 'Step 1: PM Double Cleanser', custom_use: cleanser.how_to_use } : null,
      exfoliant ? { ...exfoliant, step_name: 'Step 2: Night Corrective Treatment', custom_use: exfoliant.how_to_use } : null,
      moisturizer ? { ...moisturizer, step_name: 'Step 3: Night Lipid Recovery', custom_use: moisturizer.how_to_use } : null,
    ].filter(Boolean));

    setShowPrescribeModal(true);
  };

  const handleAddProductToPrescription = (product, routineType) => {
    const item = {
      ...product,
      step_name: `${routineType.toUpperCase()} Step: ${product.name}`,
      custom_use: product.how_to_use || 'Apply as directed by dermatologist.',
    };
    if (routineType === 'am') {
      setPrescribedAM(prev => [...prev, item]);
    } else {
      setPrescribedPM(prev => [...prev, item]);
    }
    setSuccessMsg(`Added ${product.name} to ${routineType.toUpperCase()} Prescription!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSavePrescription = async () => {
    if (!selectedPatient) return;
    setSavingPrescription(true);
    setError('');
    try {
      await api.prescribeRoutine({
        patient_id: selectedPatient.id,
        diagnosis,
        clinical_focus: clinicalFocus,
        clinical_notes: clinicalNotes,
        review_period_weeks: Number(reviewWeeks),
        prescribed_am_routine: prescribedAM,
        prescribed_pm_routine: prescribedPM,
      });
      setSuccessMsg(`Clinical prescription successfully issued for ${selectedPatient.full_name}!`);
      setShowPrescribeModal(false);
      loadPortalData();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to submit prescription');
    } finally {
      setSavingPrescription(false);
    }
  };

  // Filtered lists
  const filteredPatients = patients.filter(p =>
    p.full_name?.toLowerCase().includes(searchPatient.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchPatient.toLowerCase()) ||
    p.skin_type?.toLowerCase().includes(searchPatient.toLowerCase())
  );

  const filteredCatalog = catalog.filter(p => {
    const matchCat = catalogCategory === 'All' || p.category?.toLowerCase() === catalogCategory.toLowerCase();
    const matchTag = catalogTag === 'All' || p.product_type_tag?.toLowerCase().includes(catalogTag.toLowerCase());
    const matchSearch = !searchProduct ||
      p.name?.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.ingredients?.some(ing => ing.toLowerCase().includes(searchProduct.toLowerCase()));
    return matchCat && matchTag && matchSearch;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader-spinner" />
        <p>Loading Clinical Dermatologist Console...</p>
      </div>
    );
  }

  return (
    <div className="dermatologist-portal" style={{ padding: '24px 0' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #2D1822 0%, #1A0D14 100%)',
        borderRadius: '24px',
        padding: '32px',
        color: '#FFFFFF',
        marginBottom: '28px',
        border: '1px solid rgba(192, 99, 122, 0.3)',
        boxShadow: '0 12px 36px rgba(192, 99, 122, 0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{
              padding: '4px 12px',
              borderRadius: '20px',
              background: 'rgba(192, 99, 122, 0.3)',
              border: '1px solid #C0637A',
              color: '#FDE8EE',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Clinical Medical Portal
            </span>
            <span style={{ color: '#B8924A', fontSize: '13px' }}>✦ Board-Certified Dermatology Console</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', margin: '0 0 6px 0', color: '#FFFFFF' }}>
            Dermatologist Patient Panel & Product Catalog
          </h2>
          <p style={{ color: '#E4D5DC', fontSize: '14px', margin: 0, maxWidth: '650px' }}>
            Evaluate patient facial texture analyses and assessments, browse the clinical & trendy skincare catalog, and issue customized morning and evening routine prescriptions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setActiveTab('patients')}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              background: activeTab === 'patients' ? '#C0637A' : 'rgba(255,255,255,0.1)',
              color: '#FFFFFF',
              border: 'none',
              transition: 'all 0.2s',
            }}
          >
            👥 Patients ({patients.length})
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              background: activeTab === 'catalog' ? '#C0637A' : 'rgba(255,255,255,0.1)',
              color: '#FFFFFF',
              border: 'none',
              transition: 'all 0.2s',
            }}
          >
            🧪 Clinical Catalog ({catalog.length})
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{
          padding: '14px 20px',
          background: 'rgba(30, 140, 95, 0.12)',
          border: '1px solid #1E8C5F',
          borderRadius: '12px',
          color: '#1E8C5F',
          fontWeight: '600',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>✓</span> {successMsg}
        </div>
      )}

      {error && (
        <div style={{
          padding: '14px 20px',
          background: 'rgba(192, 57, 43, 0.12)',
          border: '1px solid #C0392B',
          borderRadius: '12px',
          color: '#C0392B',
          fontWeight: '600',
          marginBottom: '20px',
        }}>
          {error}
        </div>
      )}

      {/* ========================================================
          TAB 1: PATIENT ROSTER
      ======================================================== */}
      {activeTab === 'patients' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', margin: 0, color: '#2D1822' }}>
              Patient Diagnostic Records
            </h3>
            <input
              type="text"
              placeholder="Search patients by name, email, skin type..."
              value={searchPatient}
              onChange={e => setSearchPatient(e.target.value)}
              style={{
                padding: '10px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(192, 99, 122, 0.3)',
                background: '#FFFFFF',
                width: '320px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
            {filteredPatients.map(patient => (
              <div
                key={patient.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '24px',
                  border: '1px solid rgba(192, 99, 122, 0.2)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#2D1822', margin: '0 0 2px 0' }}>
                        {patient.full_name}
                      </h4>
                      <span style={{ fontSize: '12px', color: '#9A8F95' }}>{patient.email}</span>
                    </div>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background: patient.has_prescription ? '#E8F8F0' : '#FFF4E5',
                      color: patient.has_prescription ? '#1E8C5F' : '#B87A30',
                      border: `1px solid ${patient.has_prescription ? 'rgba(30,140,95,0.3)' : 'rgba(184,122,48,0.3)'}`
                    }}>
                      {patient.has_prescription ? '✓ Prescribed' : '⚠ Needs Plan'}
                    </span>
                  </div>

                  {/* Clinical Scores Snapshot */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: '12px',
                    background: '#FAF6F7',
                    marginBottom: '14px',
                    border: '1px solid rgba(192, 99, 122, 0.1)'
                  }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#6A5E66', display: 'block' }}>Texture Scan Score</span>
                      <span style={{ fontSize: '18px', fontWeight: '800', color: patient.latest_texture_score ? (patient.latest_texture_score >= 70 ? '#1E8C5F' : patient.latest_texture_score >= 50 ? '#B87A30' : '#C0392B') : '#9A8F95' }}>
                        {patient.latest_texture_score ? `${patient.latest_texture_score.toFixed(1)}/100` : 'No Scan'}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#6A5E66', display: 'block' }}>Assessment Score</span>
                      <span style={{ fontSize: '18px', fontWeight: '800', color: patient.latest_assessment_score ? (patient.latest_assessment_score >= 70 ? '#1E8C5F' : patient.latest_assessment_score >= 50 ? '#B87A30' : '#C0392B') : '#9A8F95' }}>
                        {patient.latest_assessment_score ? `${patient.latest_assessment_score.toFixed(1)}/100` : 'No Record'}
                      </span>
                    </div>
                  </div>

                  {/* Specs */}
                  <div style={{ fontSize: '13px', color: '#4A4048', marginBottom: '14px', lineHeight: '1.6' }}>
                    <div><strong>Skin Type:</strong> {patient.skin_type} ({patient.age_group})</div>
                    {patient.texture_type && <div><strong>Texture Classification:</strong> {patient.texture_type}</div>}
                    {patient.concerns?.length > 0 && (
                      <div style={{ marginTop: '6px' }}>
                        <strong>Reported Concerns:</strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                          {patient.concerns.map(c => (
                            <span key={c} style={{ fontSize: '11px', background: '#FDE8EE', color: '#C0637A', padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(192,99,122,0.2)' }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleOpenPrescription(patient)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #C0637A 0%, #9B3D56 100%)',
                    color: '#FFFFFF',
                    fontWeight: '700',
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(192, 99, 122, 0.25)',
                    transition: 'all 0.2s'
                  }}
                >
                  ✦ Prescribe Clinical Routine & Products
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: PRODUCT CATALOG
      ======================================================== */}
      {activeTab === 'catalog' && (
        <div>
          {/* Filters */}
          <div style={{
            background: '#FFFFFF',
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid rgba(192, 99, 122, 0.2)',
            marginBottom: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#2D1822' }}>Category:</span>
              {['All', 'Cleanser', 'Exfoliant', 'Toner', 'Serum', 'Moisturizer', 'Sunscreen'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCatalogCategory(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: catalogCategory === cat ? '#C0637A' : 'rgba(192, 99, 122, 0.2)',
                    background: catalogCategory === cat ? '#FDE8EE' : '#FFFFFF',
                    color: catalogCategory === cat ? '#C0637A' : '#4A4048',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select
                value={catalogTag}
                onChange={e => setCatalogTag(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(192, 99, 122, 0.3)',
                  fontSize: '13px',
                  outline: 'none',
                  background: '#FFFFFF'
                }}
              >
                <option value="All">All Formulations</option>
                <option value="Dermatology Clinical">Dermatology Clinical Grade</option>
                <option value="Market Trendy">Market Trendy / Cult Viral</option>
              </select>

              <input
                type="text"
                placeholder="Search by ingredient, brand..."
                value={searchProduct}
                onChange={e => setSearchProduct(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(192, 99, 122, 0.3)',
                  fontSize: '13px',
                  outline: 'none',
                  width: '220px'
                }}
              />
            </div>
          </div>

          {/* Product Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            {filteredCatalog.map(p => (
              <div
                key={p.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '20px',
                  border: '1px solid rgba(192, 99, 122, 0.2)',
                  overflow: 'hidden',
                  boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ position: 'relative', height: '180px', overflow: 'hidden', background: '#F7EFF2' }}>
                    <img
                      src={p.image_url}
                      alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background: p.product_type_tag?.includes('Dermatology') ? '#2D1822' : '#C0637A',
                      color: '#FFFFFF',
                      letterSpacing: '0.5px'
                    }}>
                      {p.product_type_tag || 'Clinical'}
                    </span>
                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background: 'rgba(255, 255, 255, 0.9)',
                      color: '#B8924A'
                    }}>
                      ★ {p.rating || 4.8}
                    </span>
                  </div>

                  <div style={{ padding: '20px' }}>
                    <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#C0637A', fontWeight: '700', letterSpacing: '1px', marginBottom: '4px' }}>
                      {p.brand} · {p.category}
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#2D1822', margin: '0 0 8px 0' }}>
                      {p.name}
                    </h4>
                    <p style={{ fontSize: '13px', color: '#6A5E66', lineHeight: '1.5', margin: '0 0 12px 0' }}>
                      {p.description}
                    </p>

                    {/* How to use */}
                    <div style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: '#FAF6F7',
                      border: '1px solid rgba(192, 99, 122, 0.15)',
                      fontSize: '12px',
                      color: '#4A4048',
                      marginBottom: '12px'
                    }}>
                      <strong style={{ color: '#C0637A', display: 'block', marginBottom: '2px' }}>✦ Clinical How-to-Use:</strong>
                      {p.how_to_use || 'Apply to clean skin morning or evening.'}
                    </div>

                    {/* Ingredients chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {p.ingredients?.map(ing => (
                        <span key={ing} style={{ fontSize: '11px', background: '#F5F5F7', color: '#4A4048', padding: '2px 8px', borderRadius: '6px' }}>
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '0 20px 20px 20px', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      if (!selectedPatient) {
                        alert('Please select a patient from the Patients tab first or choose a client below.');
                        setActiveTab('patients');
                        return;
                      }
                      handleAddProductToPrescription(p, 'am');
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1px solid #C0637A',
                      background: '#FFFFFF',
                      color: '#C0637A',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    + Add to AM Plan
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedPatient) {
                        alert('Please select a patient from the Patients tab first.');
                        setActiveTab('patients');
                        return;
                      }
                      handleAddProductToPrescription(p, 'pm');
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#2D1822',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    + Add to PM Plan
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          PRESCRIPTION & ROUTINE BUILDER MODAL
      ======================================================== */}
      {showPrescribeModal && selectedPatient && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '850px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '32px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            position: 'relative',
          }}>
            <button
              onClick={() => setShowPrescribeModal(false)}
              style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                border: 'none',
                background: '#F5F5F7',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '18px',
                color: '#6A5E66'
              }}
            >
              ✕
            </button>

            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#C0637A', letterSpacing: '1px' }}>
                Clinical Prescription Form
              </span>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', margin: '4px 0 2px 0', color: '#2D1822' }}>
                Prescribe Tailored Regimen for {selectedPatient.full_name}
              </h3>
              <p style={{ fontSize: '13px', color: '#6A5E66', margin: 0 }}>
                {selectedPatient.skin_type} Skin · Latest AI Texture Score: {selectedPatient.latest_texture_score ? `${selectedPatient.latest_texture_score.toFixed(1)}/100` : 'N/A'}
              </p>
            </div>

            {/* Diagnosis & Notes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#2D1822', marginBottom: '6px' }}>
                  Clinical Diagnosis:
                </label>
                <textarea
                  rows={3}
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(192, 99, 122, 0.3)',
                    fontSize: '13px',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#2D1822', marginBottom: '6px' }}>
                  Clinical Priority & Focus:
                </label>
                <input
                  type="text"
                  value={clinicalFocus}
                  onChange={e => setClinicalFocus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(192, 99, 122, 0.3)',
                    fontSize: '13px',
                    outline: 'none',
                    marginBottom: '10px'
                  }}
                />
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#2D1822', marginBottom: '4px' }}>
                  Follow-up Review Period (Weeks):
                </label>
                <input
                  type="number"
                  value={reviewWeeks}
                  onChange={e => setReviewWeeks(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(192, 99, 122, 0.3)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* AM Routine Plan */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#C0637A', margin: 0 }}>
                  ☀️ Prescribed Morning (AM) Routine ({prescribedAM.length} Steps)
                </h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {prescribedAM.map((item, idx) => (
                  <div key={idx} style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: '#FAF6F7',
                    border: '1px solid rgba(192, 99, 122, 0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '14px', color: '#2D1822' }}>{item.name}</strong> ({item.brand})
                      <div style={{ fontSize: '12px', color: '#6A5E66', marginTop: '2px' }}>
                        <strong>Usage:</strong> {item.custom_use || item.how_to_use}
                      </div>
                    </div>
                    <button
                      onClick={() => setPrescribedAM(prev => prev.filter((_, i) => i !== idx))}
                      style={{ border: 'none', background: 'transparent', color: '#C0392B', cursor: 'pointer', fontSize: '16px' }}
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* PM Routine Plan */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#2D1822', margin: 0 }}>
                  🌙 Prescribed Evening (PM) Routine ({prescribedPM.length} Steps)
                </h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {prescribedPM.map((item, idx) => (
                  <div key={idx} style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: '#F9F8F9',
                    border: '1px solid rgba(45, 24, 34, 0.15)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '14px', color: '#2D1822' }}>{item.name}</strong> ({item.brand})
                      <div style={{ fontSize: '12px', color: '#6A5E66', marginTop: '2px' }}>
                        <strong>Usage:</strong> {item.custom_use || item.how_to_use}
                      </div>
                    </div>
                    <button
                      onClick={() => setPrescribedPM(prev => prev.filter((_, i) => i !== idx))}
                      style={{ border: 'none', background: 'transparent', color: '#C0392B', cursor: 'pointer', fontSize: '16px' }}
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Clinical Instructions / Notes */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#2D1822', marginBottom: '6px' }}>
                Direct Dermatologist Instructions for Patient:
              </label>
              <textarea
                rows={2}
                value={clinicalNotes}
                onChange={e => setClinicalNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(192, 99, 122, 0.3)',
                  fontSize: '13px',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Submit Prescription */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowPrescribeModal(false)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: '1px solid #CCC',
                  background: '#FFFFFF',
                  color: '#4A4048',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                disabled={savingPrescription}
                onClick={handleSavePrescription}
                style={{
                  padding: '12px 28px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #C0637A 0%, #9B3D56 100%)',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(192, 99, 122, 0.3)'
                }}
              >
                {savingPrescription ? 'Issuing...' : '✓ Issue & Send Prescription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
