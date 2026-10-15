import React, { useState, useEffect } from 'react';
import { Activity, Save, CheckCircle2, Sun, Wind, Monitor, Dumbbell } from 'lucide-react';
import { lifestyleService } from '../services/lifestyleService';
import { useNotification } from '../hooks/useNotification';
import {
  ACTIVITY_LEVELS,
  SMOKING_OPTIONS,
  ALCOHOL_OPTIONS,
  OUTDOOR_EXPOSURE_OPTIONS,
  EXPOSURE_LEVELS,
  ENVIRONMENT_TYPES,
} from '../utils/constants';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Select';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function LifestylePage() {
  const { notifySuccess, notifyError } = useNotification();

  const [formData, setFormData] = useState({
    physical_activity: 'Moderate',
    smoking: 'Never',
    alcohol_consumption: 'Occasionally',
    screen_time_hours: 6.0,
    outdoor_exposure: 'Moderate (1–3 hours daily)',
    pollution_exposure: 'Low',
    sun_exposure: 'Moderate',
    environment_type: 'Indoor (Air Conditioned / Climate Controlled)',
  });

  const [isExisting, setIsExisting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadLifestyle() {
      try {
        const data = await lifestyleService.getProfile();
        if (data) {
          setFormData({
            physical_activity: data.physical_activity || 'Moderate',
            smoking: data.smoking || 'Never',
            alcohol_consumption: data.alcohol_consumption || 'Occasionally',
            screen_time_hours: Number(data.screen_time_hours) || 6.0,
            outdoor_exposure: data.outdoor_exposure || 'Moderate (1–3 hours daily)',
            pollution_exposure: data.pollution_exposure || 'Low',
            sun_exposure: data.sun_exposure || 'Moderate',
            environment_type: data.environment_type || 'Indoor (Air Conditioned / Climate Controlled)',
          });
          setIsExisting(true);
        }
      } catch (err) {
        console.error('Failed to load lifestyle data:', err);
        notifyError('Could not load existing lifestyle profile.');
      } finally {
        setIsLoading(false);
      }
    }
    loadLifestyle();
  }, [notifyError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (isExisting) {
        await lifestyleService.updateProfile(formData);
        notifySuccess('Lifestyle profile updated successfully!');
      } else {
        await lifestyleService.saveProfile(formData);
        setIsExisting(true);
        notifySuccess('Lifestyle profile saved successfully!');
      }
    } catch (err) {
      console.error('Error saving lifestyle profile:', err);
      notifyError('Failed to save lifestyle profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading lifestyle records..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Activity className="w-6 h-6 text-teal-600" />
          Lifestyle & Environmental Exposure Tracking
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Record your daily habits, environmental exposures, and screen routines to help contextualize skin health.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Physical Activity */}
        <Card
          title="1. Physical Activity Level"
          subtitle="Regular cardiovascular and strength exercise influences systemic circulation"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {ACTIVITY_LEVELS.map((level) => {
              const isSelected = formData.physical_activity === level.id;
              return (
                <button
                  type="button"
                  key={level.id}
                  onClick={() => setFormData({ ...formData, physical_activity: level.id })}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/20 text-teal-950'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm">{level.label}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500">{level.desc}</p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* 2. Screen Time & Digital Habits */}
        <Card
          title="2. Daily Screen Time"
          subtitle="Approximate daily hours facing monitors, phones, and tablets (HEV Blue Light Exposure)"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1 w-full">
              <input
                type="range"
                min="0"
                max="16"
                step="0.5"
                value={formData.screen_time_hours}
                onChange={(e) => setFormData({ ...formData, screen_time_hours: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <div className="flex justify-between text-[10px] font-semibold text-slate-400 mt-1.5">
                <span>0 hrs</span>
                <span>4 hrs</span>
                <span>8 hrs</span>
                <span>12 hrs</span>
                <span>16+ hrs</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-center min-w-[140px]">
              <span className="text-2xl font-black text-teal-800">{formData.screen_time_hours}</span>
              <span className="text-xs font-semibold text-teal-600 block">hours / day</span>
            </div>
          </div>
        </Card>

        {/* 3. Smoking and Alcohol */}
        <Card
          title="3. Habits & Consumption"
          subtitle="Tobacco and alcohol intake levels that affect oxidative stress and skin hydration"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Smoking Frequency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SMOKING_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => setFormData({ ...formData, smoking: opt })}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                      formData.smoking === opt
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Alcohol Consumption
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ALCOHOL_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => setFormData({ ...formData, alcohol_consumption: opt })}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                      formData.alcohol_consumption === opt
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* 4. Outdoor & Environmental Exposures */}
        <Card
          title="4. Environmental & Ambient Exposure"
          subtitle="Sunlight exposure, pollution density, and indoor climate characteristics"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Daily Outdoor Exposure"
              options={OUTDOOR_EXPOSURE_OPTIONS}
              value={formData.outdoor_exposure}
              onChange={(e) => setFormData({ ...formData, outdoor_exposure: e.target.value })}
            />

            <Select
              label="Primary Work / Living Environment"
              options={ENVIRONMENT_TYPES}
              value={formData.environment_type}
              onChange={(e) => setFormData({ ...formData, environment_type: e.target.value })}
            />

            <Select
              label="Sun / UV Exposure Intensity"
              options={EXPOSURE_LEVELS}
              value={formData.sun_exposure}
              onChange={(e) => setFormData({ ...formData, sun_exposure: e.target.value })}
            />

            <Select
              label="Pollution & Dust Exposure"
              options={EXPOSURE_LEVELS}
              value={formData.pollution_exposure}
              onChange={(e) => setFormData({ ...formData, pollution_exposure: e.target.value })}
            />
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            size="lg"
            variant="wellness"
            icon={Save}
            isLoading={isSaving}
            className="px-8"
          >
            {isExisting ? 'Update Lifestyle Profile' : 'Save Lifestyle Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
}
