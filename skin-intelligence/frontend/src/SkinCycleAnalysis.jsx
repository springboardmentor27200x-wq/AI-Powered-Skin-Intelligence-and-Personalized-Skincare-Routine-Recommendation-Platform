import React, { useState, useEffect, useMemo } from 'react';
import UserAnalyticsDashboard from './UserAnalyticsDashboard';

export default function SkinCycleAnalysis({
  user,
  profile,
  history = [],
  stats = null,
  assessment = null,
  routine = null,
  recommendations = [],
  onLogLifestyle,
  onOpenAssessment,
  onOpenRoutine,
  onOpenProducts,
  onOpenProgress,
  onOpenTexture,
}) {
  const [subTab, setSubTab] = useState('journey'); // 'journey' | 'cycling' | 'turnover'
  const [currentDay, setCurrentDay] = useState(14);
  const [cycleLength] = useState(28);

  // ── Weekly Planner Interactive State ─────────────────────────
  const [weeklyPlan, setWeeklyPlan] = useState(() => {
    try {
      const saved = localStorage.getItem('skin_weekly_plan_completed');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading weekly plan:', e);
    }
    return {
      mon: true,
      tue: true,
      wed: false,
      thu: true,
      fri: true,
      sat: true,
      sun: false,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('skin_weekly_plan_completed', JSON.stringify(weeklyPlan));
    } catch (e) {
      console.error('Error saving weekly plan:', e);
    }
  }, [weeklyPlan]);

  const toggleWeeklyDay = (dayKey) => {
    setWeeklyPlan((prev) => ({
      ...prev,
      [dayKey]: !prev[dayKey],
    }));
  };

  const completedWeeklyDays = Object.values(weeklyPlan).filter(Boolean).length;
  const weeklyCompliancePct = Math.round((completedWeeklyDays / 7) * 100);

  // Get current weekday (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const currentWeekdayNum = new Date().getDay();
  const dayKeyMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayKey = dayKeyMap[currentWeekdayNum];

  // ── 4-Day Classic Skin Cycling Phase ────────────────────────
  const cyclingNight = useMemo(() => {
    const nightIndex = ((currentDay - 1) % 4) + 1;
    switch (nightIndex) {
      case 1:
        return {
          nightNum: 1,
          title: 'Night 1: Exfoliation',
          phase: 'Exfoliation Phase',
          badge: '#C0637A',
          badgeBg: '#FDF2F4',
          description: 'Gentle chemical exfoliation to slough off dead stratum corneum cells and prep skin for active absorption.',
          keyActives: ['Salicylic Acid (BHA 2%)', 'Glycolic Acid (AHA 5%)', 'Lactic Acid'],
          focus: 'Pore decongestion & surface smoothing',
          howToApply: 'Apply 3-4 drops after cleansing. Let absorb for 2 minutes before barrier moisturizer.',
          avoid: 'Retinoids, physical scrubs, Vitamin C on the same evening'
        };
      case 2:
        return {
          nightNum: 2,
          title: 'Night 2: Retinoid Renewal',
          phase: 'Cellular Renewal Phase',
          badge: '#B8924A',
          badgeBg: '#FBF3E4',
          description: 'Targeted Vitamin A acceleration to stimulate collagen synthesis, minimize fine lines, and boost cellular turnover kinetics.',
          keyActives: ['Encapsulated Retinol 0.3%', 'Bakuchiol', 'Peptide Complex'],
          focus: 'Collagen renewal & fine line reduction',
          howToApply: 'Use a pea-sized amount over completely dry face. Follow with a ceramide night cream.',
          avoid: 'AHA/BHA acids, benzoyl peroxide, aggressive clay masks'
        };
      case 3:
      case 4:
        return {
          nightNum: nightIndex,
          title: `Night ${nightIndex}: Recovery & Barrier Repair`,
          phase: 'Lipid Replenishment Phase',
          badge: '#1E8C5F',
          badgeBg: '#E8F8F0',
          description: 'Deep hydration and lipid barrier reinforcement to replenish ceramides, cholesterol, and fatty acids without irritation.',
          keyActives: ['Ceramides NP/AP/EOP', 'Centella Asiatica', 'Hyaluronic Acid', 'Squalane Oil'],
          focus: 'Microbiome restoration & transepidermal water barrier lock',
          howToApply: 'Apply hydrating serum on damp skin, then seal with a rich barrier repair cream.',
          avoid: 'All exfoliating acids, peeling solutions, and strong actives'
        };
      default:
        return {};
    }
  }, [currentDay]);

  const weeklySchedule = [
    {
      key: 'mon',
      day: 'Monday',
      nightTitle: 'Exfoliation Night',
      tag: 'Exfoliate',
      color: '#C0637A',
      bg: '#FDF2F4',
      amRoutine: 'Gentle Cleanse + Vitamin C 15% + SPF 50+',
      pmRoutine: 'Double Cleanse + BHA 2% / Glycolic Acid + Barrier Cream',
      benefit: 'Unclogs pores & dissolves stratum corneum dead cells'
    },
    {
      key: 'tue',
      day: 'Tuesday',
      nightTitle: 'Retinoid Renewal Night',
      tag: 'Retinoid',
      color: '#B8924A',
      bg: '#FBF3E4',
      amRoutine: 'Hydrating Cleanse + Niacinamide + SPF 50+',
      pmRoutine: 'Double Cleanse + Encapsulated Retinol 0.3% + Peptide Cream',
      benefit: 'Accelerates collagen synthesis & cellular turnover kinetics'
    },
    {
      key: 'wed',
      day: 'Wednesday',
      nightTitle: 'Barrier Recovery Night I',
      tag: 'Recovery',
      color: '#1E8C5F',
      bg: '#E8F8F0',
      amRoutine: 'Lukewarm Rinse + Hyaluronic Acid + SPF 50+',
      pmRoutine: 'Gentle Wash + Ceramide NP Ampoule + Squalane Barrier Cream',
      benefit: 'Replenishes essential ceramides, cholesterol & fatty acids'
    },
    {
      key: 'thu',
      day: 'Thursday',
      nightTitle: 'Barrier Recovery Night II',
      tag: 'Recovery',
      color: '#1E8C5F',
      bg: '#E8F8F0',
      amRoutine: 'Hydrating Cleanse + Antioxidants + SPF 50+',
      pmRoutine: 'Double Cleanse + Centella Asiatica Soothing Balm',
      benefit: 'Calms irritation & locks in deep transepidermal hydration'
    },
    {
      key: 'fri',
      day: 'Friday',
      nightTitle: 'Gentle Exfoliation / Enzyme Polish',
      tag: 'Exfoliate',
      color: '#C0637A',
      bg: '#FDF2F4',
      amRoutine: 'Gentle Cleanse + Vitamin C 15% + SPF 50+',
      pmRoutine: 'Double Cleanse + Lactic Acid / PHA + Soothing Gel',
      benefit: 'Refines weekend texture without micro-barrier stress'
    },
    {
      key: 'sat',
      day: 'Saturday',
      nightTitle: 'Retinoid Glow Renewal',
      tag: 'Retinoid',
      color: '#B8924A',
      bg: '#FBF3E4',
      amRoutine: 'Hydrating Cleanse + Peptides + SPF 50+',
      pmRoutine: 'Double Cleanse + Retinol 0.3% / Bakuchiol + Night Moisturizer',
      benefit: 'Smoothes fine lines & brightens post-inflammatory tone'
    },
    {
      key: 'sun',
      day: 'Sunday',
      nightTitle: 'Restorative Barrier Sheet Mask & Reset',
      tag: 'Rest & Reset',
      color: '#7C3AED',
      bg: '#F5F3FF',
      amRoutine: 'Gentle Rinse + Ceramides + SPF 50+',
      pmRoutine: 'Hydrating Sheet Mask + Squalane Oil / Sleeping Lipid Glaze',
      benefit: 'Nourishes the skin microbiome for a radiant week ahead'
    },
  ];

  // ── Epidermal Turnover Phase calculation ──────────────────────
  const turnoverPhase = useMemo(() => {
    if (currentDay <= 7) {
      return {
        title: 'Phase 1: Basal Layer Mitosis (Days 1–7)',
        subtitle: 'Cell proliferation in the stratum basale',
        description: 'Stem cells in the lowest layer of the epidermis divide actively, pushing newer keratinocyte daughter cells upwards toward the surface.',
        color: '#6366F1',
        bg: '#EEF2FF',
        targetAction: 'Focus on gentle hydration and antioxidant support to protect dividing stem cells.'
      };
    } else if (currentDay <= 14) {
      return {
        title: 'Phase 2: Stratum Spinosum Differentiation (Days 8–14)',
        subtitle: 'Lipid synthesis & desmosome formation',
        description: 'Keratinocytes flatten and start synthesizing cellular lipids, lamellar bodies, and keratin filaments that form structural skin scaffolding.',
        color: '#1E8C5F',
        bg: '#E8F8F0',
        targetAction: 'Ideal window for retinoid acceleration and peptide reinforcement.'
      };
    } else if (currentDay <= 21) {
      return {
        title: 'Phase 3: Stratum Granulosum Keratinization (Days 15–21)',
        subtitle: 'Filaggrin release & lipid extrusion',
        description: 'Cells release keratohyalin granules and extrude lipid envelopes, creating the primary water-impermeable barrier layer.',
        color: '#B8924A',
        bg: '#FBF3E4',
        targetAction: 'Reinforce ceramide and squalane replenishment to lock in moisture.'
      };
    } else {
      return {
        title: 'Phase 4: Stratum Corneum Desquamation (Days 22–28)',
        subtitle: 'Surface corneocyte shedding & renewal',
        description: 'Dead corneocytes on the skin surface shed naturally via enzymatic desquamation, unveiling fresh, smooth, and radiant skin.',
        color: '#C0637A',
        bg: '#FDF2F4',
        targetAction: 'Perform mild AHA/BHA chemical exfoliation to cleanly clear shedding dead cells.'
      };
    }
  }, [currentDay]);

  const turnoverProgressPct = Math.round((currentDay / cycleLength) * 100);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      width: '100%',
      fontFamily: 'var(--font-sans, "DM Sans", -apple-system, BlinkMacSystemFont, sans-serif)',
      color: '#1A1219'
    }}>

      {/* ========================================================
          TOP SUB-NAVIGATION TABS
      ======================================================== */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px',
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid rgba(192, 99, 122, 0.2)',
        boxShadow: '0 2px 10px rgba(192, 99, 122, 0.06)',
        overflowX: 'auto'
      }}>
        {[
          { key: 'journey', label: '📊 My Skin Journey & Health Analytics', icon: '📈' },
          { key: 'cycling', label: '🔄 4-Night Cycling & 7-Day Plan', icon: '✦' },
          { key: 'turnover', label: '🧬 28-Day Epidermal Turnover Simulator', icon: '🔬' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSubTab(tab.key)}
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              background: subTab === tab.key ? 'linear-gradient(135deg, #C0637A 0%, #9B3D56 100%)' : 'transparent',
              color: subTab === tab.key ? '#FFFFFF' : '#4A4048',
              boxShadow: subTab === tab.key ? '0 4px 12px rgba(192, 99, 122, 0.25)' : 'none'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ========================================================
          SUB-TAB 1: MY SKIN JOURNEY & HEALTH ANALYTICS
      ======================================================== */}
      {subTab === 'journey' && (
        <UserAnalyticsDashboard
          profile={profile}
          history={history}
          stats={stats}
          assessment={assessment}
          routine={routine}
          recommendations={recommendations}
          onLogLifestyle={onLogLifestyle}
          onOpenAssessment={onOpenAssessment}
          onOpenRoutine={onOpenRoutine}
          onOpenProducts={onOpenProducts}
          onOpenProgress={onOpenProgress}
          onOpenTexture={onOpenTexture}
          onOpenSkinCycle={() => setSubTab('cycling')}
        />
      )}

      {/* ========================================================
          SUB-TAB 2: 4-NIGHT CYCLING & 7-DAY REGIMEN PLAN
      ======================================================== */}
      {subTab === 'cycling' && (
        <>
          {/* HERO BANNER */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            padding: '24px 28px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 2px 14px rgba(0, 0, 0, 0.02)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 20
          }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 999,
                background: '#FDF2F4',
                border: '1px solid rgba(192, 99, 122, 0.25)',
                color: '#C0637A',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 8
              }}>
                ✦ 4-NIGHT SKIN CYCLING & 7-DAY REGIMEN
              </div>

              <h2 style={{
                fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                fontSize: 32,
                fontWeight: 700,
                color: '#1A1219',
                margin: '0 0 6px 0',
                letterSpacing: '-0.3px'
              }}>
                Skin Cycle & Weekly Plan
              </h2>

              <p style={{ fontSize: 14, color: '#7D737B', margin: 0, maxWidth: 640 }}>
                Know exactly what to apply every morning and evening. Alternate between <strong>Exfoliation</strong>, <strong>Retinoids</strong>, and <strong>Barrier Recovery</strong> to prevent irritation and maximize glowing results.
              </p>
            </div>

            {/* Current Cycle Pill */}
            <div style={{
              background: '#F8F9FA',
              padding: '16px 24px',
              borderRadius: 16,
              border: '1px solid rgba(0, 0, 0, 0.06)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8F95', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
                CURRENT CYCLE DAY
              </div>
              <div style={{
                fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                fontSize: 34,
                fontWeight: 800,
                color: '#C0637A',
                lineHeight: 1
              }}>
                Day {currentDay} <span style={{ fontSize: 16, color: '#9A8F95', fontWeight: 500 }}>/ {cycleLength}</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: cyclingNight.badge }}>
                {cyclingNight.phase}
              </div>
            </div>
          </div>

          {/* TONIGHT'S DIRECTIVE & 4-STEP MATRIX ROW */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(320px, 1fr)',
            gap: 20
          }}>

            {/* CARD 1: TONIGHT'S CLINICAL DIRECTIVE */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 20,
              padding: '24px 28px',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 2px 14px rgba(0, 0, 0, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    background: cyclingNight.badgeBg,
                    color: cyclingNight.badge,
                  }}>
                    {cyclingNight.title}
                  </span>
                  <span style={{ fontSize: 12, color: '#9A8F95', fontWeight: 600 }}>
                    Cycle Day #{currentDay}
                  </span>
                </div>

                <h3 style={{
                  fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#1A1219',
                  margin: '0 0 8px 0'
                }}>
                  {cyclingNight.phase} Protocol
                </h3>

                <p style={{ fontSize: 13, color: '#4A4048', lineHeight: 1.55, margin: '0 0 16px 0' }}>
                  {cyclingNight.description}
                </p>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1A1219', textTransform: 'uppercase', marginBottom: 6 }}>
                    Recommended Actives for Tonight:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {cyclingNight.keyActives?.map((act) => (
                      <span
                        key={act}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          background: '#F8F9FA',
                          border: '1px solid rgba(0,0,0,0.06)',
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#374151'
                        }}
                      >
                        ✓ {act}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>
                  <strong style={{ color: '#1A1219' }}>How to Apply:</strong> {cyclingNight.howToApply}
                </div>
              </div>

              <div style={{ padding: '10px 14px', borderRadius: 12, background: '#FDEAEA', border: '1px solid rgba(220, 38, 38, 0.15)' }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#DC2626' }}>Avoid Tonight: </span>
                <span style={{ fontSize: 11.5, color: '#7F1D1D' }}>{cyclingNight.avoid}</span>
              </div>
            </div>

            {/* CARD 2: 4-NIGHT SKIN CYCLING SCHEDULE MATRIX */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 20,
              padding: '24px 28px',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 2px 14px rgba(0, 0, 0, 0.02)'
            }}>
              <h3 style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#1A1219',
                margin: '0 0 14px 0'
              }}>
                4-Night Skin Cycling Matrix
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { night: 'Night 1', name: 'Exfoliation', focus: 'BHA 2% / AHA 5% Glycolic Peel', tag: 'Exfoliate', color: '#C0637A', bg: '#FDF2F4' },
                  { night: 'Night 2', name: 'Retinoid Renewal', focus: 'Retinol 0.3% / Bakuchiol Complex', tag: 'Retinoid', color: '#B8924A', bg: '#FBF3E4' },
                  { night: 'Night 3', name: 'Barrier Recovery I', focus: 'Ceramides NP & Centella Asiatica', tag: 'Recovery', color: '#1E8C5F', bg: '#E8F8F0' },
                  { night: 'Night 4', name: 'Barrier Recovery II', focus: 'Hyaluronic Acid & Squalane Seal', tag: 'Recovery', color: '#1E8C5F', bg: '#E8F8F0' },
                ].map((item, idx) => {
                  const isActive = ((currentDay - 1) % 4) === idx;
                  return (
                    <div
                      key={item.night}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '11px 14px',
                        borderRadius: 12,
                        background: isActive ? item.bg : '#F8F9FA',
                        border: `1.5px solid ${isActive ? item.color : 'rgba(0,0,0,0.04)'}`,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1219' }}>{item.night}:</span>
                        <span style={{ fontSize: 12, color: '#4A4048' }}>{item.focus}</span>
                      </div>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: 10.5,
                        fontWeight: 700,
                        background: item.bg,
                        color: item.color
                      }}>
                        {item.tag} {isActive && '★ Today'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* 7-DAY WEEKLY APPLICATION CALENDAR & PLANNER */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            padding: '24px 28px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 2px 14px rgba(0, 0, 0, 0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
              <div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: '#E8F8F0',
                  border: '1px solid rgba(30, 140, 95, 0.2)',
                  color: '#1E8C5F',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  marginBottom: 6
                }}>
                  ✦ WEEKLY ACTION PLAN
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#1A1219',
                  margin: '0 0 4px 0'
                }}>
                  What To Apply Each Day (Mon – Sun)
                </h3>
                <p style={{ fontSize: 13.5, color: '#7D737B', margin: 0 }}>
                  Follow this personalized weekly schedule. Click the checkbox on each day once finished to track your 7-day adherence.
                </p>
              </div>

              <div style={{
                background: '#F8F9FA',
                padding: '10px 18px',
                borderRadius: 12,
                border: '1px solid rgba(0,0,0,0.06)',
                textAlign: 'right'
              }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9A8F95', textTransform: 'uppercase' }}>
                  WEEKLY COMPLIANCE
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: weeklyCompliancePct >= 80 ? '#1E8C5F' : '#C0637A' }}>
                  {completedWeeklyDays} / 7 Days ({weeklyCompliancePct}%)
                </div>
              </div>
            </div>

            {/* Weekly Schedule Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {weeklySchedule.map((item) => {
                const isToday = todayKey === item.key;
                const isChecked = !!weeklyPlan[item.key];

                return (
                  <div
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      borderRadius: 14,
                      background: isToday ? '#FFFDF8' : isChecked ? '#FAFAFB' : '#FFFFFF',
                      border: `1.5px solid ${isToday ? '#B8924A' : isChecked ? 'rgba(30, 140, 95, 0.3)' : 'rgba(0,0,0,0.06)'}`,
                      boxShadow: isToday ? '0 3px 10px rgba(184, 146, 74, 0.12)' : 'none',
                      flexWrap: 'wrap',
                      gap: 14,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Day & Tag & Checkbox */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 190 }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleWeeklyDay(item.key)}
                        style={{ width: 18, height: 18, accentColor: '#10B981', cursor: 'pointer' }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1219', textDecoration: isChecked ? 'line-through' : 'none' }}>
                            {item.day}
                          </span>
                          {isToday && (
                            <span style={{ fontSize: 9.5, fontWeight: 800, color: '#B8924A', background: '#FBF3E4', padding: '1px 6px', borderRadius: 4, border: '1px solid rgba(184, 146, 74, 0.3)' }}>
                              ★ TODAY
                            </span>
                          )}
                        </div>
                        <span style={{
                          display: 'inline-block',
                          marginTop: 2,
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 10.5,
                          fontWeight: 700,
                          background: item.bg,
                          color: item.color
                        }}>
                          {item.nightTitle}
                        </span>
                      </div>
                    </div>

                    {/* AM & PM Instructions */}
                    <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ fontSize: 12, color: '#374151' }}>
                        <strong style={{ color: '#D97706' }}>AM:</strong> {item.amRoutine}
                      </div>
                      <div style={{ fontSize: 12, color: '#374151' }}>
                        <strong style={{ color: '#7C3AED' }}>PM:</strong> {item.pmRoutine}
                      </div>
                    </div>

                    {/* Target Clinical Benefit */}
                    <div style={{ minWidth: 180, textAlign: 'right' }}>
                      <div style={{ fontSize: 10.5, color: '#9A8F95', textTransform: 'uppercase', fontWeight: 700 }}>CLINICAL GOAL</div>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: '#1A1219' }}>{item.benefit}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ========================================================
          SUB-TAB 3: 28-DAY EPIDERMAL TURNOVER SIMULATOR
      ======================================================== */}
      {subTab === 'turnover' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20
        }}>
          {/* SIMULATOR HERO */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            padding: '24px 28px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 2px 14px rgba(0, 0, 0, 0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 999,
                  background: '#EEF2FF',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  color: '#4F46E5',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  marginBottom: 8
                }}>
                  ✦ CELLULAR KINETICS & RENEWAL
                </div>
                <h2 style={{
                  fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#1A1219',
                  margin: '0 0 6px 0'
                }}>
                  28-Day Epidermal Turnover Simulator
                </h2>
                <p style={{ fontSize: 14, color: '#7D737B', margin: 0, maxWidth: 640 }}>
                  Drag the slider to visualize how skin cells travel from the basal stem cell layer to the stratum corneum surface.
                </p>
              </div>

              <div style={{
                background: '#F8F9FA',
                padding: '16px 24px',
                borderRadius: 16,
                border: '1px solid rgba(0,0,0,0.06)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8F95', textTransform: 'uppercase' }}>
                  TURNOVER MATURITY
                </div>
                <div style={{
                  fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                  fontSize: 32,
                  fontWeight: 800,
                  color: turnoverPhase.color
                }}>
                  {turnoverProgressPct}%
                </div>
                <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>
                  Day {currentDay} of 28
                </div>
              </div>
            </div>

            {/* DAY SLIDER */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#6B7280', marginBottom: 8 }}>
                <span>Day 1 (Basal Mitosis)</span>
                <span style={{ color: turnoverPhase.color }}>Selected: Day {currentDay}</span>
                <span>Day 28 (Complete Shedding)</span>
              </div>
              <input
                type="range"
                min="1"
                max="28"
                value={currentDay}
                onChange={(e) => setCurrentDay(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: turnoverPhase.color,
                  height: 8,
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* CURRENT ACTIVE STAGE CARD */}
            <div style={{
              background: turnoverPhase.bg,
              border: `1.5px solid ${turnoverPhase.color}`,
              borderRadius: 16,
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: turnoverPhase.color }}>
                {turnoverPhase.title}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
                {turnoverPhase.subtitle}
              </div>
              <p style={{ fontSize: 13.5, color: '#4B5563', lineHeight: 1.6, margin: 0 }}>
                {turnoverPhase.description}
              </p>
              <div style={{
                marginTop: 6,
                padding: '10px 14px',
                background: '#FFFFFF',
                borderRadius: 10,
                border: '1px solid rgba(0,0,0,0.06)',
                fontSize: 12.5,
                fontWeight: 600,
                color: '#1A1219'
              }}>
                ✦ <strong>Clinical Recommendation:</strong> {turnoverPhase.targetAction}
              </div>
            </div>
          </div>

          {/* 4 STAGES OVERVIEW GRID */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16
          }}>
            {[
              { num: '1', name: 'Basal Mitosis', days: 'Days 1–7', color: '#6366F1', bg: '#EEF2FF', desc: 'Stem cells divide and initiate ascent.' },
              { num: '2', name: 'Spinosum Differentiation', days: 'Days 8–14', color: '#1E8C5F', bg: '#E8F8F0', desc: 'Lipid envelopes and cellular bridges form.' },
              { num: '3', name: 'Granulosum Keratinization', days: 'Days 15–21', color: '#B8924A', bg: '#FBF3E4', desc: 'Natural moisturizing factors extruded.' },
              { num: '4', name: 'Corneum Desquamation', days: 'Days 22–28', color: '#C0637A', bg: '#FDF2F4', desc: 'Dead cells shed cleanly, revealing radiant skin.' },
            ].map((stg) => (
              <div
                key={stg.num}
                onClick={() => setCurrentDay(stg.num === '1' ? 4 : stg.num === '2' ? 11 : stg.num === '3' ? 18 : 25)}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  padding: '18px 20px',
                  border: `1.5px solid ${currentDay >= (parseInt(stg.num)-1)*7 + 1 && currentDay <= parseInt(stg.num)*7 ? stg.color : 'rgba(0,0,0,0.06)'}`,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 800,
                    background: stg.bg,
                    color: stg.color
                  }}>
                    Stage {stg.num}
                  </span>
                  <span style={{ fontSize: 11, color: '#9A8F95', fontWeight: 600 }}>{stg.days}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1219', marginBottom: 4 }}>
                  {stg.name}
                </div>
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.4 }}>
                  {stg.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
