import React, { useEffect, useState } from 'react';
import { CalendarDays, Check, Moon, RotateCcw, Sparkles, Sun } from 'lucide-react';
import api from '../services/api';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';

const emptyForm = {
  age: '',
  skin_type: '',
  concerns: '',
  allergies: '',
  budget: '',
  sleep_quality: '',
  hydration_level: '',
};

const sections = [
  { key: 'morning', label: 'Morning', icon: Sun },
  { key: 'evening', label: 'Evening', icon: Moon },
];

export function RoutinePage() {
  const [routine, setRoutine] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showGenerator, setShowGenerator] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingStep, setUpdatingStep] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/routines/current')
      .then(({ data }) => {
        if (!active) return;
        setRoutine(data);
        setShowGenerator(!data);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.detail || 'Could not load your routine.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleGenerate = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        age: Number(form.age),
        skin_type: form.skin_type,
        concerns: form.concerns.split(',').map((value) => value.trim()).filter(Boolean),
        allergies: form.allergies.split(',').map((value) => value.trim()).filter(Boolean),
        budget: form.budget ? Number(form.budget) : undefined,
        sleep_quality: form.sleep_quality || undefined,
        hydration_level: form.hydration_level || undefined,
      };
      const { data } = await api.post('/routines/generate', payload);
      setRoutine(data);
      setShowGenerator(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not generate your routine.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (stepKey, completed) => {
    setError('');
    setUpdatingStep(stepKey);
    try {
      const { data } = await api.put(`/routines/${routine.id}/steps/${encodeURIComponent(stepKey)}`, { completed });
      setRoutine(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update this routine step.');
    } finally {
      setUpdatingStep('');
    }
  };

  const completed = new Set(routine?.completed_step_keys || []);
  const activeProgressDays = routine?.recent_progress?.filter((day) => day.total_steps > 0) || [];
  const weeklyAdherence = activeProgressDays.length
    ? Math.round(activeProgressDays.reduce((total, day) => total + day.adherence_percentage, 0) / activeProgressDays.length)
    : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <Sparkles className="h-4 w-4" /> PERSONAL SKIN PLAN
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Routine & progress</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">A practical routine shaped by your skin profile, concerns, and daily habits.</p>
        </div>
        {routine && !showGenerator && (
          <Button variant="outline" icon={RotateCcw} onClick={() => setShowGenerator(true)}>Build a new routine</Button>
        )}
      </header>

      {error && <Alert type="error">{error}</Alert>}

      {showGenerator && (
        <section className="border-b border-slate-200 pb-7">
          <h2 className="mb-1 text-lg font-semibold text-slate-900">{routine ? 'Update your plan' : 'Generate your routine'}</h2>
          <p className="mb-5 text-sm text-slate-600">Your latest saved routine stays active until you generate a replacement.</p>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input label="Age" type="number" name="age" min="0" max="120" required value={form.age} onChange={handleChange} />
              <Input label="Skin type" name="skin_type" required value={form.skin_type} onChange={handleChange} placeholder="dry, oily, combination..." />
              <Input label="Monthly budget ($)" type="number" name="budget" min="0" value={form.budget} onChange={handleChange} />
              <Input label="Main concerns" name="concerns" required value={form.concerns} onChange={handleChange} placeholder="acne, redness" />
              <Input label="Known ingredient allergies" name="allergies" value={form.allergies} onChange={handleChange} placeholder="fragrance, lanolin" />
              <Input label="Sleep quality" name="sleep_quality" value={form.sleep_quality} onChange={handleChange} placeholder="poor, fair, good, excellent" />
            </div>
            <div className="max-w-sm">
              <Input label="Hydration level" name="hydration_level" value={form.hydration_level} onChange={handleChange} placeholder="low, moderate, high" />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" isLoading={saving} icon={Sparkles}>{routine ? 'Save new routine' : 'Generate routine'}</Button>
              {routine && <Button variant="ghost" onClick={() => setShowGenerator(false)}>Cancel</Button>}
            </div>
          </form>
        </section>
      )}

      {loading ? (
        <p className="py-8 text-sm text-slate-500">Loading your routine...</p>
      ) : routine ? (
        <>
          <section className="grid gap-5 md:grid-cols-[1fr_260px]">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Today’s checklist</h2>
              <p className="mt-1 text-sm text-slate-600">{routine.summary}</p>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                {sections.map(({ key, label, icon: Icon }) => (
                  <div key={key} className="border-t-2 border-emerald-600 pt-3">
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900"><Icon className="h-4 w-4 text-emerald-700" />{label}</h3>
                    <ul className="space-y-2">
                      {(routine.routine[key] || []).map((step, index) => {
                        const stepKey = `${key}:${index}`;
                        const checked = completed.has(stepKey);
                        return (
                          <li key={stepKey}>
                            <label className={`flex cursor-pointer items-start gap-3 border-b border-slate-100 py-2.5 text-sm ${checked ? 'text-slate-500' : 'text-slate-800'}`}>
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={updatingStep === stepKey}
                                onChange={(event) => handleToggle(stepKey, event.target.checked)}
                                className="mt-0.5 h-4 w-4 accent-emerald-700"
                              />
                              <span className={checked ? 'line-through decoration-slate-400' : ''}>{step}</span>
                              {checked && <Check aria-hidden="true" className="ml-auto h-4 w-4 shrink-0 text-emerald-700" />}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <aside className="border-l border-slate-200 pl-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assessment score</div>
              <div className="mt-1 text-4xl font-semibold text-slate-950">{routine.assessment_score}<span className="ml-1 text-base font-medium text-slate-500">/100</span></div>
              <div className="mt-5 flex items-baseline justify-between">
                <h3 className="font-semibold text-slate-900">7-day adherence</h3>
                <span className="text-xl font-semibold text-emerald-800">{weeklyAdherence}%</span>
              </div>
              <div className="mt-4 grid grid-cols-7 items-end gap-2" aria-label="Daily routine completion over the past 7 days">
                {routine.recent_progress.map((day) => (
                  <div key={day.record_date} className="flex flex-col items-center gap-2" title={day.total_steps ? `${day.record_date}: ${day.adherence_percentage}%` : 'Routine not active'}>
                    <div className="flex h-20 w-full items-end overflow-hidden bg-slate-100">
                      <div className="w-full bg-emerald-600 transition-[height]" style={{ height: `${day.adherence_percentage}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-500">{new Date(`${day.record_date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">Today: {routine.today_completed_steps} of {routine.today_total_steps} daily steps</p>
            </aside>
          </section>

          {routine.routine.weekly?.length > 0 && (
            <section className="border-t border-slate-200 pt-5">
              <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-900"><CalendarDays className="h-4 w-4 text-emerald-700" />Weekly care</h2>
              <ul className="grid gap-x-8 sm:grid-cols-2">
                {routine.routine.weekly.map((step, index) => <li key={index} className="border-b border-slate-100 py-2.5 text-sm text-slate-700">{step}</li>)}
              </ul>
            </section>
          )}
          <p className="border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-500">This educational routine is not a medical diagnosis or treatment. Patch-test new products and consult a dermatologist for persistent, severe, or worsening symptoms.</p>
        </>
      ) : (
        !showGenerator && <p className="py-8 text-sm text-slate-600">No active routine yet.</p>
      )}
    </div>
  );
}
