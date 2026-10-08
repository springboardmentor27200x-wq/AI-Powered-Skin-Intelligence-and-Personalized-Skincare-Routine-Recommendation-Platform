import React, { useEffect, useState } from 'react';
import { skinService } from '../services/skin';
import { ShieldCheck, Sparkles, CheckCircle2, AlertTriangle, AlertCircle, Save, Check, Droplet } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';

const SKIN_TYPE_DESCRIPTIONS = {
  NORMAL: 'Balanced hydration and sebum production, neither overly dry nor oily.',
  DRY: 'Low sebum, feels tight or flaky, requires intensive barrier hydration.',
  OILY: 'Excess sebum, visible shine, prone to enlarged pores and congestion.',
  COMBINATION: 'Oily T-zone (forehead, nose, chin) with normal or dry cheeks.',
  SENSITIVE: 'Easily reactive to environmental triggers, prone to redness or irritation.',
};

const SkinProfilePage = () => {
  const [skinProfile, setSkinProfile] = useState(null);
  const [availableConcerns, setAvailableConcerns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Edit State
  const [skinType, setSkinType] = useState('NORMAL');
  const [selectedConcerns, setSelectedConcerns] = useState([]);
  const [allergies, setAllergies] = useState('');
  const [sensitivities, setSensitivities] = useState('');

  const fetchProfileData = async () => {
    try {
      const concernsData = await skinService.getConcerns();
      setAvailableConcerns(concernsData);

      const profile = await skinService.getProfile();
      setSkinProfile(profile);

      setSkinType(profile.skin_type || 'NORMAL');
      setSelectedConcerns((profile.concerns || []).map(c => c.code));
      setAllergies(profile.allergies || '');
      setSensitivities(profile.sensitivities || '');
    } catch (err) {
      setError("No skin profile found. Please complete onboarding first.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleToggleConcern = (code) => {
    if (selectedConcerns.includes(code)) {
      setSelectedConcerns(prev => prev.filter(c => c !== code));
    } else {
      setSelectedConcerns(prev => [...prev, code]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      const updated = await skinService.updateProfile({
        skin_type: skinType,
        allergies,
        sensitivities,
        concerns: selectedConcerns,
      });
      setSkinProfile(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update skin profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="h-8 w-8 border-3 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[var(--color-text-muted)] font-medium">Loading skin profile data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <SectionHeader
        badge="Biometric Skin Profile"
        title="Manage Skin Characteristics"
        subtitle="Your personalized skin profile feeds the AI assessment engine and customizes daily routine formulations."
      />

      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[var(--radius-xl)] animate-fade-in shadow-xs">
          <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-medium">Your skin profile configurations have been updated and synchronized with AI engine!</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-[var(--radius-xl)] animate-fade-in shadow-xs">
          <AlertTriangle size={20} className="text-rose-600 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Skin Type Selection */}
        <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-2xl)] p-6 md:p-8 shadow-[var(--shadow-sm)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">Skin Classification</h2>
              <p className="text-xs text-[var(--color-text-muted)]">Select your primary underlying physiological skin category.</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--color-brand-light)] text-[var(--color-brand)]">
              {skinType}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {['NORMAL', 'DRY', 'OILY', 'COMBINATION', 'SENSITIVE'].map((type) => {
              const active = skinType === type;
              return (
                <button
                  type="button"
                  key={type}
                  onClick={() => setSkinType(type)}
                  className={`p-3.5 border rounded-[var(--radius-xl)] text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] ${
                    active
                      ? 'border-[var(--color-brand)] bg-[var(--color-brand-light)] text-[var(--color-brand)] font-bold shadow-xs'
                      : 'border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-brand-muted)] text-[var(--color-text-secondary)] font-medium'
                  }`}
                >
                  <span className="text-xs tracking-tight">{type}</span>
                  {active && <Check size={14} className="text-[var(--color-brand)] mt-0.5" />}
                </button>
              );
            })}
          </div>

          {skinType && (
            <p className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-2)] p-3 rounded-[var(--radius-lg)] border border-[var(--color-border)]">
              <span className="font-semibold text-[var(--color-text-primary)]">{skinType}:</span> {SKIN_TYPE_DESCRIPTIONS[skinType]}
            </p>
          )}
        </div>

        {/* Skin Concerns Checklist */}
        <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-2xl)] p-6 md:p-8 shadow-[var(--shadow-sm)] space-y-4">
          <div>
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">Identified Skin Concerns</h2>
            <p className="text-xs text-[var(--color-text-muted)]">Select all current dermatological concerns to guide targeted ingredient actives.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableConcerns.map((concern) => {
              const isChecked = selectedConcerns.includes(concern.code);
              return (
                <button
                  type="button"
                  key={concern.id || concern.code}
                  onClick={() => handleToggleConcern(concern.code)}
                  className={`flex items-start gap-3 p-3.5 border rounded-[var(--radius-xl)] text-left transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] ${
                    isChecked
                      ? 'border-[var(--color-brand)] bg-[var(--color-brand-light)]/40 shadow-xs'
                      : 'border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-brand-muted)]'
                  }`}
                >
                  <div className={`mt-0.5 h-4 w-4 rounded-[4px] border flex items-center justify-center flex-shrink-0 transition-colors ${
                    isChecked ? 'bg-[var(--color-brand)] border-transparent text-white' : 'border-[var(--color-border)] bg-white'
                  }`}>
                    {isChecked && <Check size={11} strokeWidth={3} className="text-white" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold ${isChecked ? 'text-[var(--color-brand-dark)]' : 'text-[var(--color-text-primary)]'}`}>
                      {concern.name}
                    </p>
                    {concern.description && (
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 line-clamp-2 leading-relaxed">
                        {concern.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Allergies & Sensitivities */}
        <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-2xl)] p-6 md:p-8 shadow-[var(--shadow-sm)] space-y-4">
          <div>
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">Safety & Tolerance Guardrails</h2>
            <p className="text-xs text-[var(--color-text-muted)]">Ingredients or compounds the formulation engine must avoid when generating routines.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                Known Allergies
              </label>
              <textarea
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g., Fragrance, Propylene Glycol, Salicylates..."
                className="w-full px-3.5 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-xs text-[var(--color-text-primary)] font-medium focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 h-24 resize-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                Sensitivities / Ingredients to Avoid
              </label>
              <textarea
                value={sensitivities}
                onChange={(e) => setSensitivities(e.target.value)}
                placeholder="e.g., Essential oils, high-strength AHA acids, alcohol denat..."
                className="w-full px-3.5 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-xs text-[var(--color-text-primary)] font-medium focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 h-24 resize-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white text-sm font-semibold rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Configurations...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Biometric Skin Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SkinProfilePage;
