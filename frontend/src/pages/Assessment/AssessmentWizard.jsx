import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Activity, ShieldCheck, Droplet, Moon, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Sun, Brain, Calendar, ChevronRight, TrendingUp } from 'lucide-react';
import assessmentService from '../../services/assessmentService';
import skinService from '../../services/skin';
import { useToast } from '../../components/Toast';
import AssessmentProgress from '../../components/ui/AssessmentProgress';
import ScoreRing, { scoreTheme } from '../../components/ui/ScoreRing';
import ConcernCard from '../../components/ui/ConcernCard';
import RiskFactorCard from '../../components/ui/RiskFactorCard';
import SkinHealthBreakdown from '../../components/ui/SkinHealthBreakdown';
import AIBadge from '../../components/ui/AIBadge';
import SafetyWarning from '../../components/ui/SafetyWarning';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { SkeletonAssessment, AnalysisProgress } from '../../components/ui/LoadingState';

const ANALYSIS_STEPS = [
  'Preparing your profile...',
  'Running neural net analysis...',
  'Evaluating risk factors...',
  'Prioritizing your concerns...',
  'Building your personalized routine...',
];

const WIZARD_STEPS = [
  { step: 1, label: 'Skin Profile'   },
  { step: 2, label: 'Concerns'       },
  { step: 3, label: 'Lifestyle'      },
  { step: 4, label: 'Safety Review'  },
  { step: 5, label: 'Analyze'        },
];

// ─── Precheck summary rows ─────────────────────────────────────────────────

const CheckRow = ({ icon: Icon, label, value, ok = true, actionTo, actionLabel }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-[var(--color-border-light)] last:border-b-0">
    <div className={`w-8 h-8 rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0 ${ok ? 'bg-[var(--color-brand-light)]' : 'bg-amber-50'}`}>
      <Icon size={14} className={ok ? 'text-[var(--color-brand)]' : 'text-amber-600'} aria-hidden="true" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{label}</p>
      <p className={`text-sm font-semibold truncate ${ok ? 'text-[var(--color-text-primary)]' : 'text-amber-700'}`}>{value}</p>
    </div>
    {actionTo && (
      <Link to={actionTo} className="text-[10px] font-bold text-[var(--color-brand)] hover:underline flex-shrink-0">
        {actionLabel ?? 'Update'}
      </Link>
    )}
    {ok
      ? <CheckCircle2 size={15} className="text-[var(--color-brand)] flex-shrink-0" aria-hidden="true" />
      : <AlertCircle size={15} className="text-amber-500 flex-shrink-0" aria-hidden="true" />
    }
  </div>
);

// ─── Result section header ─────────────────────────────────────────────────

const ResultSection = ({ title, badge, children }) => (
  <div>
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-sm font-bold text-[var(--color-text-primary)]">{title}</h2>
      {badge}
    </div>
    {children}
  </div>
);

// ─── AssessmentWizard ───────────────────────────────────────────────────────

const AssessmentWizard = () => {
  const toast = useToast();

  const [loading,      setLoading]      = useState(true);
  const [analyzing,    setAnalyzing]    = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [precheck,     setPrecheck]     = useState(null);
  const [assessment,   setAssessment]   = useState(null);
  const [error,        setError]        = useState(null);
  const [wizardStep,   setWizardStep]   = useState(1);
  const [showResults,  setShowResults]  = useState(false);

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      let precheckData = null;
      try {
        precheckData = await assessmentService.getPrecheckData();
      } catch (e) {
        console.warn('Precheck error, falling back to direct profile fetch:', e);
      }

      // If precheck reports no profile, or failed, verify with direct skinService.getProfile()
      if (!precheckData || !precheckData.has_profile) {
        try {
          const directProfile = await skinService.getProfile();
          if (directProfile) {
            precheckData = {
              ...(precheckData || {}),
              has_profile: true,
              skin_type: directProfile.skin_type,
              concerns: (directProfile.concerns || []).map(c => c.name || c.code || c),
              allergies: directProfile.allergies,
              sensitivities: directProfile.sensitivities,
            };
          }
        } catch {
          // No profile in DB
        }
      }

      setPrecheck(precheckData);

      try {
        const latestData = await assessmentService.getLatestAssessment();
        setAssessment(latestData);
      } catch (err) {
        if (err.response?.status !== 404) console.error('Latest assessment error:', err);
      }
    } catch (err) {
      setError('Failed to load your profile data. Please ensure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAssessment = async () => {
    setAnalyzing(true);
    setAnalysisStep(0);

    const stepInterval = setInterval(() => {
      setAnalysisStep(prev => {
        if (prev >= ANALYSIS_STEPS.length - 1) { clearInterval(stepInterval); return prev; }
        return prev + 1;
      });
    }, 900);

    try {
      const newAssessment = await assessmentService.runAssessment();
      clearInterval(stepInterval);
      setAnalysisStep(ANALYSIS_STEPS.length);

      setTimeout(() => {
        setAssessment(newAssessment);
        setAnalyzing(false);
        setShowResults(true);
        toast.success('Skin health assessment completed successfully!');
      }, 600);
    } catch (err) {
      clearInterval(stepInterval);
      setAnalyzing(false);
      toast.error(err.response?.data?.detail ?? 'Failed to complete assessment. Please try again.');
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-8">
        <div className="h-2 skeleton rounded-full mb-8" />
        <SkeletonAssessment />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-8">
        <ErrorState
          title="Unable to load assessment"
          message={error}
          reasons={['Network connectivity issue', 'Session may have expired', 'Profile data incomplete']}
          onRetry={fetchInitialData}
          retryLabel="Retry"
          secondaryLabel="Review Profile"
          secondaryTo="/profile"
        />
      </div>
    );
  }

  // ── Analysis in progress ───────────────────────────────────────────────

  if (analyzing) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ backgroundColor: 'var(--color-sidebar-bg)' }}>
        <div className="max-w-sm w-full text-center animate-fade-in">
          <div className="w-14 h-14 bg-[var(--color-brand)] rounded-[var(--radius-xl)] flex items-center justify-center mx-auto mb-8">
            <Brain size={26} className="text-white" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Analyzing your skin</h2>
          <p className="text-sm text-white/50 mb-10">This may take a moment. Please don't close this page.</p>
          <AnalysisProgress steps={ANALYSIS_STEPS} currentStep={analysisStep} />
          <p className="text-[9px] text-white/20 mt-10">
            AI analysis indicates concerns — not a medical diagnosis.
          </p>
        </div>
      </div>
    );
  }

  // ── RESULTS screen ─────────────────────────────────────────────────────

  if (showResults && assessment) {
    const ai = assessment.ai_analysis;
    const concerns = (assessment.concerns && assessment.concerns.length > 0)
      ? assessment.concerns
      : (ai?.concern_predictions ?? []);
    const risks = (assessment.risk_factors && assessment.risk_factors.length > 0)
      ? assessment.risk_factors
      : (ai?.risk_predictions ?? []);
    const topConcerns = [...concerns].sort((a, b) => (b.ml_probability ?? (b.confidence != null ? b.confidence / 100 : 0)) - (a.ml_probability ?? (a.confidence != null ? a.confidence / 100 : 0))).slice(0, 3);

    return (
      <div className="max-w-2xl mx-auto px-5 py-8 space-y-8 animate-fade-in">
        {/* Score reveal */}
        <div className="bg-[var(--color-sidebar-bg)] rounded-[var(--radius-2xl)] p-8 text-white">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-5">Your Skin Analysis</p>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ScoreRing score={assessment.overall_score ?? 0} size={140} stroke={11} darkMode={true} />
            <div>
              <p className="text-3xl font-black text-white">{assessment.overall_score ?? '—'} / 100</p>
              <p className="text-sm text-white/50 mt-1">Skin Health Score</p>
              <AIBadge type="rule" className="mt-3 opacity-70" />
              {assessment.ai_analysis?.assessment_mode && (
                <div className="mt-2">
                  <AIBadge type="ai" className="opacity-70" />
                </div>
              )}
              {ai?.disclaimer && (
                <p className="text-[10px] text-white/25 mt-4 max-w-xs leading-relaxed">{ai.disclaimer}</p>
              )}
            </div>
          </div>
        </div>

        {/* Top Priorities */}
        {topConcerns.length > 0 && (
          <ResultSection title="Your Skin's Top Priorities" badge={<AIBadge type="ai" />}>
            <div className="space-y-3">
              {topConcerns.map((c, i) => <ConcernCard key={c.id ?? i} concern={c} index={i} />)}
            </div>
          </ResultSection>
        )}

        {/* All Concerns */}
        {concerns.length > 3 && (
          <ResultSection title="All Skin Concerns" badge={<AIBadge type="ai" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {concerns.map((c, i) => <ConcernCard key={c.id ?? i} concern={c} index={i} compact />)}
            </div>
          </ResultSection>
        )}

        {/* Risk Factors */}
        {risks.length > 0 && (
          <ResultSection title="What May Be Affecting Your Skin" badge={<AIBadge type="ai" />}>
            <div className="space-y-3">
              {risks.map((r, i) => <RiskFactorCard key={r.id ?? i} risk={r} index={i} />)}
            </div>
          </ResultSection>
        )}

        {/* Score Breakdown */}
        <ResultSection title="Score Breakdown" badge={<AIBadge type="rule" />}>
          <SkinHealthBreakdown scores={assessment} />
        </ResultSection>

        {/* Routine CTA */}
        <div className="bg-[var(--color-brand-light)] border border-[var(--color-brand-mid)] rounded-[var(--radius-2xl)] p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[var(--color-brand)] rounded-[var(--radius-xl)] flex items-center justify-center flex-shrink-0">
              <Calendar size={18} className="text-white" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[var(--color-brand-dark)]">Your personalized routine is ready</p>
              <p className="text-xs text-[var(--color-brand)] mt-0.5">Built around your current priorities and safety constraints.</p>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <Link
              to="/routine"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white text-sm font-bold rounded-[var(--radius-xl)] transition-colors"
            >
              View My Routine <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <Link
              to="/dashboard"
              className="px-4 py-3 border border-[var(--color-brand-mid)] text-[var(--color-brand-dark)] text-sm font-semibold rounded-[var(--radius-xl)] hover:bg-white transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── WIZARD steps ───────────────────────────────────────────────────────

  const hasProfile    = Boolean(precheck?.has_profile || precheck?.skin_type || precheck?.skin_profile);
  const skinType      = precheck?.skin_type ?? precheck?.skin_profile?.skin_type ?? 'NORMAL';
  const concernsList  = precheck?.concerns ?? precheck?.skin_profile?.concerns ?? [];
  const allergies     = precheck?.allergies ?? precheck?.skin_profile?.allergies ?? 'None recorded';
  const sensitivities = precheck?.sensitivities ?? precheck?.skin_profile?.sensitivities ?? 'None recorded';

  const hasSleep      = Boolean(precheck?.sleep_hours != null || precheck?.latest_sleep);
  const sleepDisplay  = precheck?.sleep_hours != null
    ? `${precheck.sleep_hours} hrs`
    : (precheck?.latest_sleep ? `${Math.floor((precheck.latest_sleep.duration_minutes ?? 0)/60)}h ${(precheck.latest_sleep.duration_minutes ?? 0)%60}m` : 'Not logged yet');

  const hasHydration  = Boolean(precheck?.water_intake_ml != null || precheck?.latest_hydration);
  const waterIntake   = precheck?.water_intake_ml ?? precheck?.latest_hydration?.water_intake_ml ?? 0;

  const hasLifestyle  = Boolean(precheck?.stress_level != null || precheck?.latest_lifestyle);

  const renderWizardStep = () => {
    switch (wizardStep) {
      // Step 1: Skin Profile
      case 1:
        return (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-black text-[var(--color-text-primary)]">Your Skin Profile</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Review your current profile. Make sure it's up to date before analyzing.</p>
            </div>
            {!hasProfile ? (
              <EmptyState
                Icon={Sparkles}
                title="No skin profile found"
                description="Complete your onboarding to create a skin profile before running an assessment."
                cta="Set Up Profile"
                ctaTo="/onboarding"
              />
            ) : (
              <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[var(--color-border-light)] flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Skin Profile</p>
                  <Link to="/skin-profile" className="text-[10px] font-bold text-[var(--color-brand)]">Update →</Link>
                </div>
                <div className="p-5 space-y-1">
                  <CheckRow icon={Sparkles} label="Skin Type"  value={String(skinType).replace(/_/g,' ')} ok={true} />
                  <CheckRow icon={ShieldCheck} label="Concerns" value={`${concernsList.length} declared`} ok={true} />
                  <CheckRow icon={ShieldCheck} label="Allergies" value={allergies || 'None known'} ok={true} />
                </div>
              </div>
            )}
          </div>
        );

      // Step 2: Concerns confirmation
      case 2:
        return (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-black text-[var(--color-text-primary)]">Your Skin Concerns</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">These are your declared concerns. ConcernNet will also detect additional concerns from your lifestyle and environmental data.</p>
            </div>
            {concernsList.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {concernsList.map(c => {
                  const label = typeof c === 'string' ? c : (c.name || c.code || String(c));
                  return (
                    <div key={label} className="bg-[var(--color-brand-light)] border border-[var(--color-brand-mid)] rounded-[var(--radius-lg)] px-3 py-2.5 flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-[var(--color-brand)] flex-shrink-0" aria-hidden="true" />
                      <span className="text-xs font-semibold text-[var(--color-brand-dark)] capitalize">{label.toLowerCase().replace(/_/g,' ')}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)] italic">No concerns declared in your profile. ConcernNet will still analyze your biometric data.</p>
            )}
            <div className="bg-[var(--color-brand-light)] border border-[var(--color-brand-mid)] rounded-[var(--radius-lg)] p-4 flex items-start gap-3">
              <Brain size={14} className="text-[var(--color-brand)] flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-[var(--color-brand-dark)] leading-relaxed">
                ConcernNet analyzes 15 biometric signals to detect skin concerns, including those not explicitly declared.
              </p>
            </div>
          </div>
        );

      // Step 3: Lifestyle data check
      case 3:
        return (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-black text-[var(--color-text-primary)]">Today's Tracking Data</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Missing data reduces assessment accuracy. Log what you can before running the analysis.</p>
            </div>
            <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] overflow-hidden">
              <div className="p-5 space-y-1">
                <CheckRow icon={Activity} label="Lifestyle" value={hasLifestyle ? (precheck?.stress_level != null ? `Stress level ${precheck.stress_level}/10` : 'Logged today') : 'Not logged yet'} ok={hasLifestyle} actionTo="/lifestyle" actionLabel="Log now" />
                <CheckRow icon={Moon} label="Sleep" value={hasSleep ? sleepDisplay : 'Not logged yet'} ok={hasSleep} actionTo="/sleep" actionLabel="Log now" />
                <CheckRow icon={Droplet} label="Hydration" value={hasHydration ? `${waterIntake} ml` : 'Not logged yet'} ok={hasHydration} actionTo="/hydration" actionLabel="Log now" />
                <CheckRow icon={Sun} label="Environment" value={precheck?.latest_environment ? 'Logged today' : 'Auto-detected'} ok={true} actionTo="/environment" actionLabel="Log now" />
              </div>
            </div>
            {(!hasSleep || !hasHydration) && (
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-[var(--radius-lg)] px-4 py-3">
                <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Missing data reduces assessment accuracy. Log your sleep and hydration above for the most accurate analysis.
                </p>
              </div>
            )}
          </div>
        );

      // Step 4: Safety review
      case 4:
        return (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-black text-[var(--color-text-primary)]">Safety Review</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Your safety constraints are applied before any recommendation is generated.</p>
            </div>
            <SafetyWarning
              message="ML analysis NEVER overrides your safety constraints."
              reason="Every product or routine recommendation is checked against your recorded allergies and sensitivities before being shown to you."
            />
            <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[var(--color-border-light)] flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Your Safety Profile</p>
                <Link to="/skin-profile" className="text-[10px] font-bold text-[var(--color-brand)]">Update →</Link>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Allergies</p>
                  <p className="text-sm text-[var(--color-text-primary)]">{allergies || 'None recorded'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Sensitivities</p>
                  <p className="text-sm text-[var(--color-text-primary)]">{sensitivities || 'None recorded'}</p>
                </div>
              </div>
            </div>
          </div>
        );

      // Step 5: Analyze
      case 5:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center pt-4">
              <div className="w-16 h-16 bg-[var(--color-brand-light)] rounded-full flex items-center justify-center mx-auto mb-5">
                <Brain size={28} className="text-[var(--color-brand)]" aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-black text-[var(--color-text-primary)]">Ready to analyze your skin?</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-2 max-w-sm mx-auto leading-relaxed">
                We will combine your skin profile, lifestyle, sleep, hydration, and environment data to generate your personalized assessment.
              </p>
            </div>

            {/* What will be analyzed */}
            <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Data included in this analysis</p>
              <div className="space-y-2">
                {[
                  [Sparkles, 'Skin profile', hasProfile ? 'Ready' : 'Not found', hasProfile],
                  [Activity, 'Lifestyle data', hasLifestyle ? 'Ready' : 'Not logged', hasLifestyle],
                  [Moon, 'Sleep data', hasSleep ? 'Ready' : 'Not logged', hasSleep],
                  [Droplet, 'Hydration data', hasHydration ? 'Ready' : 'Not logged', hasHydration],
                ].map(([Icon, label, status, ok]) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon size={14} className={ok ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-muted)]'} aria-hidden="true" />
                    <p className="text-xs text-[var(--color-text-secondary)] flex-1">{label}</p>
                    <span className={`text-[10px] font-bold ${ok ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-muted)]'}`}>{status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Previous assessment score if available */}
            {assessment && (
              <div className="bg-[var(--color-surface-2)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-4 flex items-center gap-4">
                <TrendingUp size={16} className="text-[var(--color-text-muted)]" aria-hidden="true" />
                <div>
                  <p className="text-[10px] text-[var(--color-text-muted)]">Previous score</p>
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">{assessment.overall_score} / 100</p>
                </div>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleRunAssessment}
              className="w-full flex items-center justify-center gap-2 py-4 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white text-sm font-bold rounded-[var(--radius-xl)] transition-all shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]"
            >
              <Brain size={16} aria-hidden="true" />
              Analyze My Skin
              <ArrowRight size={14} aria-hidden="true" />
            </button>
            <p className="text-[10px] text-[var(--color-text-muted)] text-center">
              AI analysis indicates concerns. Not a medical diagnosis.
            </p>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-5 py-6 space-y-6">
      {/* Progress bar */}
      <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-xl)] p-4 shadow-[var(--shadow-sm)]">
        <AssessmentProgress
          currentStep={wizardStep}
          totalSteps={WIZARD_STEPS.length}
          stepLabel={WIZARD_STEPS[wizardStep - 1]?.label}
        />
      </div>

      {/* Step content */}
      <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-sm)]">
        {renderWizardStep()}
      </div>

      {/* Nav buttons */}
      {wizardStep < 5 && (
        <div className="flex gap-3">
          {wizardStep > 1 && (
            <button
              onClick={() => setWizardStep(s => s - 1)}
              className="px-5 py-3 border border-[var(--color-border)] rounded-[var(--radius-xl)] text-sm font-semibold text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] transition-colors"
            >
              ← Back
            </button>
          )}
          <button
            onClick={() => setWizardStep(s => s + 1)}
            disabled={wizardStep === 1 && !hasProfile}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-[var(--radius-xl)] transition-colors"
          >
            Continue <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AssessmentWizard;
