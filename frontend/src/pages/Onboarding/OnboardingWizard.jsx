import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { skinService } from '../../services/skin';
import { trackingService } from '../../services/tracking';
import apiClient from '../../services/api';
import {
  ArrowLeft, ArrowRight, Sparkles, CheckCircle2, AlertCircle,
  User, Droplet, Moon, Activity, Sun, ShieldAlert,
} from 'lucide-react';
import AssessmentProgress from '../../components/ui/AssessmentProgress';
import AssessmentOption from '../../components/ui/AssessmentOption';
import SafetyWarning from '../../components/ui/SafetyWarning';
import { Spinner } from '../../components/ui/LoadingState';

const TOTAL_STEPS = 6;

// ─── Step Labels ────────────────────────────────────────────────────────────

const STEP_LABELS = [
  'Basic Profile',
  'Skin Type',
  'Skin Concerns',
  'Lifestyle',
  'Sleep & Hydration',
  'Safety & Preferences',
];

// ─── Skin Type options ──────────────────────────────────────────────────────

const SKIN_TYPES = [
  { value: 'DRY',         label: 'Dry',         desc: 'Skin often feels tight, may flake or feel rough.' },
  { value: 'OILY',        label: 'Oily',        desc: 'Skin looks shiny, pores may appear enlarged.'      },
  { value: 'COMBINATION', label: 'Combination', desc: 'Oily in the T-zone, drier on cheeks and jawline.'  },
  { value: 'NORMAL',      label: 'Normal',      desc: 'Balanced moisture, rarely oily or dry.'            },
  { value: 'SENSITIVE',   label: 'Sensitive',   desc: 'Reacts easily to products, prone to redness.'      },
];

// ─── Age groups ─────────────────────────────────────────────────────────────

const AGE_GROUPS = [
  { value: 'UNDER_18', label: 'Under 18' },
  { value: '18_24',    label: '18 – 24'  },
  { value: '25_34',    label: '25 – 34'  },
  { value: '35_44',    label: '35 – 44'  },
  { value: '45_54',    label: '45 – 54'  },
  { value: '55_PLUS',  label: '55+'      },
];

// ─── Styled input ───────────────────────────────────────────────────────────

const StyledInput = ({ id, label, type = 'text', value, onChange, placeholder, min, max, step, helper }) => (
  <div>
    <label htmlFor={id} className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
      {label}
    </label>
    <input
      id={id} type={type} value={value} onChange={onChange}
      placeholder={placeholder} min={min} max={max} step={step}
      className="w-full px-4 py-3 bg-white border border-[var(--color-border)] rounded-[var(--radius-lg)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:border-[var(--color-brand)]"
    />
    {helper && <p className="text-[10px] text-[var(--color-text-muted)] mt-1">{helper}</p>}
  </div>
);

// ─── Segmented control ──────────────────────────────────────────────────────

const SegmentedControl = ({ id, label, options, value, onChange }) => (
  <div>
    {label && <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">{label}</p>}
    <div className="flex gap-1 bg-[var(--color-surface-3)] rounded-[var(--radius-lg)] p-1" role="group" aria-label={label}>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={`flex-1 py-2 text-xs font-semibold rounded-[var(--radius-md)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] ${
            value === opt.value
              ? 'bg-white text-[var(--color-brand-dark)] shadow-[var(--shadow-xs)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

// ─── Slider ─────────────────────────────────────────────────────────────────

const Slider = ({ id, label, min, max, step = 1, value, onChange, formatValue }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <label htmlFor={id} className="text-xs font-semibold text-[var(--color-text-secondary)]">{label}</label>
      <span className="text-sm font-bold text-[var(--color-text-primary)]">{formatValue ? formatValue(value) : value}</span>
    </div>
    <input
      id={id} type="range" min={min} max={max} step={step}
      value={value} onChange={e => onChange(Number(e.target.value))}
      className="w-full h-2 bg-[var(--color-border)] rounded-full appearance-none cursor-pointer accent-[var(--color-brand)]"
      aria-valuenow={value} aria-valuemin={min} aria-valuemax={max}
    />
    <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mt-1">
      <span>{min}</span><span>{max}</span>
    </div>
  </div>
);

// ─── Main OnboardingWizard ───────────────────────────────────────────────────

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [step, setStep]   = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);

  const [availableConcerns, setAvailableConcerns] = useState([]);

  const [formData, setFormData] = useState({
    // Step 1
    fullName:  user?.profile?.name ?? '',
    ageGroup:  '25_34',
    location:  '',
    // Step 2
    skinType:  'NORMAL',
    // Step 3
    concerns:  [],
    // Step 4
    physicalActivity: 'MODERATE',
    smoking:          'NONE',
    alcohol:          'NONE',
    stressLevel:      5,
    // Step 5
    sleepDuration: 480,
    sleepQuality:  'GOOD',
    bedtime:       '22:30',
    wakeTime:      '06:30',
    waterIntake:   1500,
    targetWater:   2000,
    // Step 6
    allergies:     '',
    sensitivities: '',
    uvExposure:       'MODERATE',
    pollutionExposure:'LOW',
    outdoorTime:      60,
    climate:          'TEMPERATE',
  });

  const update = (field, value) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const toggleConcern = (code) => {
    const current = formData.concerns;
    update('concerns', current.includes(code)
      ? current.filter(c => c !== code)
      : [...current, code]
    );
  };

  useEffect(() => {
    skinService.getConcerns()
      .then(data => setAvailableConcerns(data))
      .catch(() => {/* non-fatal */});

    // If user already has a skin profile, prefill form
    skinService.getProfile()
      .then(prof => {
        if (prof) {
          setFormData(prev => ({
            ...prev,
            skinType: prof.skin_type || prev.skinType,
            allergies: prof.allergies || prev.allergies,
            sensitivities: prof.sensitivities || prev.sensitivities,
            concerns: (prof.concerns || []).map(c => (typeof c === 'object' ? c.code : c)),
          }));
        }
      })
      .catch(() => {/* No existing profile yet — fresh onboarding */});
  }, []);

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(s => s + 1);
    else submitOnboarding();
  };

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1);
  };

  const submitOnboarding = async () => {
    setError('');
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      await apiClient.patch('/users/me', {
        name:      formData.fullName,
        age_group: formData.ageGroup,
        location:  formData.location,
      });

      await skinService.createProfile({
        skin_type:     formData.skinType,
        allergies:     formData.allergies || 'None known',
        sensitivities: formData.sensitivities || 'None known',
        concerns:      formData.concerns,
      });

      const safeLog = async (fn) => {
        try {
          await fn();
        } catch (e) {
          // If record already exists for today or non-fatal tracking error, ignore
          console.warn('[Onboarding] Tracking log non-fatal error:', e?.response?.data?.detail || e.message);
        }
      };

      await safeLog(() => trackingService.createLifestyle({
        physical_activity: formData.physicalActivity,
        smoking:           formData.smoking,
        alcohol:           formData.alcohol,
        stress_level:      parseInt(formData.stressLevel),
        record_date:       todayStr,
      }));

      await safeLog(() => trackingService.createSleep({
        duration_minutes: parseInt(formData.sleepDuration),
        quality:          formData.sleepQuality,
        bedtime:          formData.bedtime,
        wake_time:        formData.wakeTime,
        record_date:      todayStr,
      }));

      await safeLog(() => trackingService.createHydration({
        water_intake_ml: parseInt(formData.waterIntake),
        target_water_ml: parseInt(formData.targetWater),
        record_date:     todayStr,
      }));

      await safeLog(() => trackingService.createEnvironment({
        uv_exposure:           formData.uvExposure,
        pollution_exposure:    formData.pollutionExposure,
        outdoor_time_minutes:  parseInt(formData.outdoorTime),
        climate:               formData.climate,
        record_date:           todayStr,
      }));

      await refreshUser();
      setComplete(true);
    } catch (err) {
      setError(err.response?.data?.detail ?? 'An error occurred while saving your profile. Please check all fields and try again.');
      setLoading(false);
    }
  };

  // ── Completion screen ────────────────────────────────────────────────────

  if (complete) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 py-12" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-lg)] p-10 max-w-sm w-full text-center animate-scale-in">
          <div className="w-16 h-16 bg-[var(--color-brand-light)] rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-[var(--color-brand)]" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-black text-[var(--color-text-primary)] mb-2">Profile complete!</h2>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-7">
            Your skin profile, lifestyle, and safety preferences have been saved. Run your first assessment to get your personalized skincare plan.
          </p>
          <button
            onClick={() => navigate('/assessment')}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white font-bold text-sm rounded-[var(--radius-xl)] transition-all shadow-[var(--shadow-sm)]"
          >
            Start My Skin Assessment
            <ArrowRight size={14} aria-hidden="true" />
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mt-3 py-2"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Wizard container ─────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      // ── STEP 1: Basic Profile ──────────────────────────────────────────
      case 1:
        return (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-black text-[var(--color-text-primary)]">Tell us about yourself</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">We use these to help calibrate your skin metrics.</p>
            </div>
            <StyledInput
              id="fullName" label="Full name" value={formData.fullName}
              onChange={e => update('fullName', e.target.value)}
              placeholder="Your full name"
            />
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">Age group</p>
              <div className="grid grid-cols-3 gap-2">
                {AGE_GROUPS.map(ag => (
                  <button
                    key={ag.value}
                    type="button"
                    onClick={() => update('ageGroup', ag.value)}
                    aria-pressed={formData.ageGroup === ag.value}
                    className={`py-2.5 text-xs font-semibold rounded-[var(--radius-lg)] border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] ${
                      formData.ageGroup === ag.value
                        ? 'border-[var(--color-brand)] bg-[var(--color-brand-light)] text-[var(--color-brand-dark)]'
                        : 'border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-brand-mid)]'
                    }`}
                  >
                    {ag.label}
                  </button>
                ))}
              </div>
            </div>
            <StyledInput
              id="location" label="Location (optional)" value={formData.location}
              onChange={e => update('location', e.target.value)}
              placeholder="City, Country"
              helper="Used to factor regional climate into your analysis."
            />
          </div>
        );

      // ── STEP 2: Skin Type ──────────────────────────────────────────────
      case 2:
        return (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-black text-[var(--color-text-primary)]">What does your skin usually feel like?</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Select the option that best describes your skin on an average day.</p>
            </div>
            <div className="space-y-2">
              {SKIN_TYPES.map(st => (
                <AssessmentOption
                  key={st.value}
                  value={st.value}
                  label={st.label}
                  description={st.desc}
                  selected={formData.skinType === st.value}
                  onChange={v => update('skinType', v)}
                />
              ))}
            </div>
          </div>
        );

      // ── STEP 3: Skin Concerns ──────────────────────────────────────────
      case 3:
        return (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-black text-[var(--color-text-primary)]">What are your skin concerns?</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Select all that apply. AI will also detect additional concerns from your profile.</p>
            </div>
            {availableConcerns.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableConcerns.map(c => {
                  const selected = formData.concerns.includes(c.code);
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => toggleConcern(c.code)}
                      aria-pressed={selected}
                      className={`text-left border-2 rounded-[var(--radius-xl)] px-4 py-3.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] ${
                        selected
                          ? 'border-[var(--color-brand)] bg-[var(--color-brand-light)]'
                          : 'border-[var(--color-border)] bg-white hover:border-[var(--color-brand-mid)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-semibold ${selected ? 'text-[var(--color-brand-dark)]' : 'text-[var(--color-text-primary)]'}`}>
                          {c.name?.replace(/_/g, ' ')}
                        </p>
                        {selected && <CheckCircle2 size={15} className="text-[var(--color-brand)]" aria-hidden="true" />}
                      </div>
                      {c.description && (
                        <p className={`text-[10px] mt-0.5 leading-relaxed ${selected ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-muted)]'}`}>
                          {c.description}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {['Acne','Dark Spots','Hyperpigmentation','Dryness','Oiliness','Sensitivity','Redness','Fine Lines','Wrinkles','Uneven Tone'].map(name => {
                  const code = name.toUpperCase().replace(/ /g, '_');
                  const selected = formData.concerns.includes(code);
                  return (
                    <button
                      key={code} type="button" onClick={() => toggleConcern(code)} aria-pressed={selected}
                      className={`text-left border-2 rounded-[var(--radius-xl)] px-4 py-3.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] ${
                        selected ? 'border-[var(--color-brand)] bg-[var(--color-brand-light)]' : 'border-[var(--color-border)] bg-white hover:border-[var(--color-brand-mid)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-semibold ${selected ? 'text-[var(--color-brand-dark)]' : 'text-[var(--color-text-primary)]'}`}>{name}</p>
                        {selected && <CheckCircle2 size={15} className="text-[var(--color-brand)]" aria-hidden="true" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {formData.concerns.length > 0 && (
              <p className="text-xs text-[var(--color-brand)] font-semibold">{formData.concerns.length} concern{formData.concerns.length !== 1 ? 's' : ''} selected</p>
            )}
          </div>
        );

      // ── STEP 4: Lifestyle ──────────────────────────────────────────────
      case 4:
        return (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-black text-[var(--color-text-primary)]">Your lifestyle habits</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Lifestyle factors are analyzed by RiskNet to assess their effect on your skin.</p>
            </div>
            <Slider
              id="stressLevel" label="Stress level"
              min={1} max={10} value={formData.stressLevel}
              onChange={v => update('stressLevel', v)}
              formatValue={v => `${v} / 10`}
            />
            <SegmentedControl
              label="Physical activity"
              options={[
                { value: 'SEDENTARY', label: 'Sedentary' },
                { value: 'MODERATE',  label: 'Moderate'  },
                { value: 'ACTIVE',    label: 'Active'    },
              ]}
              value={formData.physicalActivity}
              onChange={v => update('physicalActivity', v)}
            />
            <SegmentedControl
              label="Smoking"
              options={[
                { value: 'NONE',    label: 'None'    },
                { value: 'LIGHT',   label: 'Light'   },
                { value: 'REGULAR', label: 'Regular' },
              ]}
              value={formData.smoking}
              onChange={v => update('smoking', v)}
            />
            <SegmentedControl
              label="Alcohol"
              options={[
                { value: 'NONE',      label: 'None'      },
                { value: 'LIGHT',     label: 'Light'     },
                { value: 'MODERATE',  label: 'Moderate'  },
                { value: 'HEAVY',     label: 'Heavy'     },
              ]}
              value={formData.alcohol}
              onChange={v => update('alcohol', v)}
            />
          </div>
        );

      // ── STEP 5: Sleep & Hydration ──────────────────────────────────────
      case 5:
        return (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-black text-[var(--color-text-primary)]">Sleep & Hydration</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Sleep and hydration directly affect your skin's recovery and barrier function.</p>
            </div>
            <Slider
              id="sleepDuration" label="Sleep duration"
              min={180} max={720} step={30} value={formData.sleepDuration}
              onChange={v => update('sleepDuration', v)}
              formatValue={v => `${Math.floor(v/60)}h ${v%60 > 0 ? v%60+'m' : ''}`}
            />
            <SegmentedControl
              label="Sleep quality"
              options={[
                { value: 'POOR',      label: 'Poor'      },
                { value: 'FAIR',      label: 'Fair'      },
                { value: 'GOOD',      label: 'Good'      },
                { value: 'EXCELLENT', label: 'Excellent' },
              ]}
              value={formData.sleepQuality}
              onChange={v => update('sleepQuality', v)}
            />
            <div className="grid grid-cols-2 gap-3">
              <StyledInput id="bedtime" label="Bedtime" type="time" value={formData.bedtime} onChange={e => update('bedtime', e.target.value)} />
              <StyledInput id="wakeTime" label="Wake time" type="time" value={formData.wakeTime} onChange={e => update('wakeTime', e.target.value)} />
            </div>
            <Slider
              id="waterIntake" label="Daily water intake"
              min={0} max={4000} step={100} value={formData.waterIntake}
              onChange={v => update('waterIntake', v)}
              formatValue={v => `${v} ml`}
            />
            <Slider
              id="targetWater" label="Daily water target"
              min={1000} max={5000} step={250} value={formData.targetWater}
              onChange={v => update('targetWater', v)}
              formatValue={v => `${v} ml`}
            />
          </div>
        );

      // ── STEP 6: Safety & Preferences ──────────────────────────────────
      case 6:
        return (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-black text-[var(--color-text-primary)]">Safety & Preferences</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">These are critically important. They prevent unsuitable recommendations.</p>
            </div>
            <SafetyWarning
              message="These preferences will be used to prevent unsuitable recommendations."
              reason="ML analysis NEVER overrides your recorded allergies and sensitivities."
            />
            <div>
              <label htmlFor="allergies" className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                Known allergies
              </label>
              <textarea
                id="allergies"
                value={formData.allergies}
                onChange={e => update('allergies', e.target.value)}
                placeholder="e.g. Retinol, Benzoyl peroxide, Fragrance, Lanolin..."
                rows={3}
                className="w-full px-4 py-3 bg-white border border-[var(--color-border)] rounded-[var(--radius-lg)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] resize-none hover:border-[var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] transition-colors"
              />
            </div>
            <div>
              <label htmlFor="sensitivities" className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                Known sensitivities
              </label>
              <textarea
                id="sensitivities"
                value={formData.sensitivities}
                onChange={e => update('sensitivities', e.target.value)}
                placeholder="e.g. Essential oils, Acids, Strong exfoliants..."
                rows={3}
                className="w-full px-4 py-3 bg-white border border-[var(--color-border)] rounded-[var(--radius-lg)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] resize-none hover:border-[var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] transition-colors"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">Environmental exposure</p>
              <SegmentedControl
                label="UV exposure"
                options={[{value:'LOW',label:'Low'},{value:'MODERATE',label:'Moderate'},{value:'HIGH',label:'High'}]}
                value={formData.uvExposure}
                onChange={v => update('uvExposure', v)}
              />
            </div>
            <SegmentedControl
              label="Pollution exposure"
              options={[{value:'LOW',label:'Low'},{value:'MODERATE',label:'Moderate'},{value:'HIGH',label:'High'}]}
              value={formData.pollutionExposure}
              onChange={v => update('pollutionExposure', v)}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-white border-b border-[var(--color-border)] px-5 py-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 bg-[var(--color-brand)] rounded-[var(--radius-md)] flex items-center justify-center">
              <Sparkles size={13} className="text-white" aria-hidden="true" />
            </div>
            <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Skin Profile Setup</p>
          </div>
          <AssessmentProgress currentStep={step} totalSteps={TOTAL_STEPS} stepLabel={STEP_LABELS[step - 1]} />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col">
        <div className="max-w-lg mx-auto w-full px-5 py-8 flex-1">
          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-[var(--radius-lg)] px-4 py-3 mb-6" role="alert">
              <AlertCircle size={15} className="text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-red-700 leading-relaxed">{error}</p>
            </div>
          )}

          {renderStep()}
        </div>
      </main>

      {/* Sticky bottom nav */}
      <div className="sticky bottom-0 bg-white border-t border-[var(--color-border)] px-5 py-4" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-3 border border-[var(--color-border)] rounded-[var(--radius-xl)] text-sm font-semibold text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] transition-colors disabled:opacity-50"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-[var(--radius-xl)] transition-all shadow-[var(--shadow-sm)]"
          >
            {loading ? (
              <><Spinner size={16} className="border-white/30 border-t-white" /> Saving...</>
            ) : step === TOTAL_STEPS ? (
              <><CheckCircle2 size={15} aria-hidden="true" /> Complete My Profile</>
            ) : (
              <>Continue <ArrowRight size={14} aria-hidden="true" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
