import React, { useState, useEffect } from 'react';
import { Sparkles, Save, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { skinService } from '../services/skinService';
import { useNotification } from '../hooks/useNotification';
import { SKIN_TYPES, AGE_GROUPS, SKIN_CONCERNS } from '../utils/constants';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Select';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function SkinProfilePage() {
  const { notifySuccess, notifyError } = useNotification();

  const [formData, setFormData] = useState({
    skin_type: 'Combination',
    age_group: '25–34',
    skin_concerns: [],
    allergies: '',
    sensitivities: '',
  });

  const [isExisting, setIsExisting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSkinProfile() {
      try {
        const profile = await skinService.getProfile();
        if (profile) {
          setFormData({
            skin_type: profile.skin_type || 'Combination',
            age_group: profile.age_group || '25–34',
            skin_concerns: profile.skin_concerns || [],
            allergies: profile.allergies || '',
            sensitivities: profile.sensitivities || '',
          });
          setIsExisting(true);
        }
      } catch (err) {
        console.error('Failed to load skin profile:', err);
        notifyError('Could not load existing skin profile.');
      } finally {
        setIsLoading(false);
      }
    }
    loadSkinProfile();
  }, [notifyError]);

  const toggleConcern = (concern) => {
    setFormData((prev) => {
      const exists = prev.skin_concerns.includes(concern);
      return {
        ...prev,
        skin_concerns: exists
          ? prev.skin_concerns.filter((c) => c !== concern)
          : [...prev.skin_concerns, concern],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (isExisting) {
        await skinService.updateProfile(formData);
        notifySuccess('Skin profile updated successfully!');
      } else {
        await skinService.saveProfile(formData);
        setIsExisting(true);
        notifySuccess('Skin profile created successfully!');
      }
    } catch (err) {
      console.error('Error saving skin profile:', err);
      notifyError('Failed to save skin profile. Please check your entries.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading skin profile details..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-emerald-600" />
            Skin Profile Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Capture your primary skin type, age bracket, dermatological concerns, and sensitivities.
          </p>
        </div>
      </div>

      {/* Non-Diagnostic Disclaimer */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold block mb-0.5">Foundational Information Collection</span>
          This skin profile is a structured wellness record and does not constitute medical advice or clinical diagnosis.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Skin Type Selection */}
        <Card
          title="1. Primary Skin Type"
          subtitle="Select the description that best reflects your skin on a typical day"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {SKIN_TYPES.map((type) => {
              const isSelected = formData.skin_type === type.id;
              return (
                <button
                  type="button"
                  key={type.id}
                  onClick={() => setFormData({ ...formData, skin_type: type.id })}
                  className={`p-4 rounded-2xl border text-left transition-all relative ${
                    isSelected
                      ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm">{type.label}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{type.description}</p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* 2. Age Group */}
        <Card
          title="2. Age Bracket"
          subtitle="Skincare requirements evolve across different life stages"
        >
          <div className="max-w-xs">
            <Select
              label="Age Group"
              required
              options={AGE_GROUPS}
              value={formData.age_group}
              onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
            />
          </div>
        </Card>

        {/* 3. Skin Concerns (Multi-Select) */}
        <Card
          title="3. Active Skin Concerns"
          subtitle="Select all dermatological and cosmetic concerns you would like to monitor"
        >
          <div className="flex flex-wrap gap-2.5">
            {SKIN_CONCERNS.map((concern) => {
              const isSelected = formData.skin_concerns.includes(concern);
              return (
                <button
                  type="button"
                  key={concern}
                  onClick={() => toggleConcern(concern)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{concern}</span>
                </button>
              );
            })}
          </div>
          {formData.skin_concerns.length === 0 && (
            <p className="text-xs text-slate-400 italic mt-3">
              No concerns selected. You can select one or multiple items above.
            </p>
          )}
        </Card>

        {/* 4. Allergies and Sensitivities */}
        <Card
          title="4. Allergies & Sensitivities"
          subtitle="Record any known cosmetic ingredient allergies or hyper-sensitivities"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Known Allergies
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Synthetic fragrances, nuts, essential oils, sulfites"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Leave blank if no known allergies.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Skin Sensitivities
              </label>
              <textarea
                rows={3}
                placeholder="e.g. High concentration AHAs, alcohol toners, physical scrubs"
                value={formData.sensitivities}
                onChange={(e) => setFormData({ ...formData, sensitivities: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Ingredients or formulas that cause stinging or redness.</p>
            </div>
          </div>
        </Card>

        {/* Action button */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="submit"
            size="lg"
            variant="primary"
            icon={Save}
            isLoading={isSaving}
            className="px-8"
          >
            {isExisting ? 'Update Skin Profile' : 'Save Skin Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
}
