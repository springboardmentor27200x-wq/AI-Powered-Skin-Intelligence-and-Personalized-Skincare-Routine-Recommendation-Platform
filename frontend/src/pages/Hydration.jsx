import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { trackingService } from '../services/tracking';
import { Droplet, CheckCircle2, AlertTriangle, Plus, Trash2, Save, Target, ArrowRight, ArrowLeft, LayoutDashboard } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';
import { DailyTrackingNav } from '../components/ui/DailyTrackingNav';

const Hydration = () => {
  const [records, setRecords] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form State
  const [waterIntake, setWaterIntake] = useState(0);
  const [targetWater, setTargetWater] = useState(2000);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchRecords = async () => {
    try {
      const data = await trackingService.getHydration();
      setRecords(data || []);

      const todayLog = (data || []).find(r => r.record_date === todayStr);
      if (todayLog) {
        setTodayRecord(todayLog);
        setWaterIntake(todayLog.water_intake_ml);
        setTargetWater(todayLog.target_water_ml);
      } else {
        setTodayRecord(null);
        setWaterIntake(0);
        setTargetWater(2000);
      }
    } catch (err) {
      console.error("Failed to load records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSubmitting(true);

    const payload = {
      water_intake_ml: parseInt(waterIntake) || 0,
      target_water_ml: parseInt(targetWater) || 2000,
      record_date: todayStr,
    };

    try {
      if (todayRecord) {
        const updated = await trackingService.updateHydration(todayRecord.id, payload);
        setTodayRecord(updated);
      } else {
        const created = await trackingService.createHydration(payload);
        setTodayRecord(created);
      }
      setSuccess(true);
      await fetchRecords();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save hydration.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAdd = async (amount) => {
    setError('');
    const newAmount = waterIntake + amount;
    setWaterIntake(newAmount);

    const payload = {
      water_intake_ml: newAmount,
      target_water_ml: targetWater,
      record_date: todayStr,
    };

    try {
      if (todayRecord) {
        const updated = await trackingService.updateHydration(todayRecord.id, payload);
        setTodayRecord(updated);
      } else {
        const created = await trackingService.createHydration(payload);
        setTodayRecord(created);
      }
      await fetchRecords();
    } catch (err) {
      setError('Failed to log water.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this log?")) return;
    try {
      await trackingService.deleteHydration(id);
      if (todayRecord && todayRecord.id === id) {
        setTodayRecord(null);
        setWaterIntake(0);
      }
      await fetchRecords();
    } catch (err) {
      setError("Failed to delete log.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="h-8 w-8 border-3 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[var(--color-text-muted)] font-medium">Loading hydration data...</p>
      </div>
    );
  }

  const hydrationProgress = Math.min(Math.round((waterIntake / (targetWater || 2000)) * 100), 100);

  return (
    <div className="space-y-6">
      <SectionHeader
        badge="Hydration Biometrics"
        title="Hydration & Skin Elasticity"
        subtitle="Sufficient cellular hydration sustains the skin lipid matrix and optimizes transepidermal water barrier."
      />

      {/* Daily Tracking Stepper Bar */}
      <DailyTrackingNav currentStep="hydration" showBottomBar={false} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logging Card */}
        <div className="lg:col-span-1 bg-white border border-[var(--color-border)] rounded-[var(--radius-2xl)] p-6 shadow-[var(--shadow-sm)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
            <h3 className="font-bold text-base text-[var(--color-text-primary)] flex items-center gap-2">
              <Droplet className="text-[var(--color-brand)]" size={18} />
              <span>Hydration Logging</span>
            </h3>
            <span className="text-[11px] font-mono text-[var(--color-text-muted)]">{todayStr}</span>
          </div>

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-[var(--radius-lg)] text-xs space-y-1.5">
              <div className="flex gap-2 items-center">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">Hydration entry saved successfully!</span>
              </div>
              <div className="pl-6">
                <Link to="/environment" className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:text-emerald-950 underline text-xs">
                  Continue to Environmental Exposome <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-[var(--radius-lg)] text-xs flex gap-2 items-center">
              <AlertTriangle size={16} className="text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Progress Display */}
          <div className="space-y-2.5 text-center bg-[var(--color-surface-2)] p-4 rounded-[var(--radius-xl)] border border-[var(--color-border)]">
            <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider">Today's Progress</p>
            <p className="text-2xl font-black text-[var(--color-text-primary)]">{waterIntake} <span className="text-xs font-normal text-[var(--color-text-muted)]">/ {targetWater} ml</span></p>
            <div className="h-2.5 w-full bg-[var(--color-border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-brand)] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${hydrationProgress}%` }}
              />
            </div>
            <p className="text-[11px] font-bold text-[var(--color-brand)]">{hydrationProgress}% of daily target</p>
          </div>

          {/* Quick Add Buttons */}
          <div>
            <label className="block text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 text-[10px] font-bold">
              Quick Add
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[250, 500, 750].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickAdd(amt)}
                  className="py-2 bg-[var(--color-brand-light)] hover:bg-[var(--color-brand-light)]/80 text-[var(--color-brand-dark)] text-xs font-bold rounded-[var(--radius-lg)] border border-[var(--color-brand)]/20 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>{amt}ml</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs font-semibold pt-3 border-t border-[var(--color-border)]">
            <div>
              <label className="block text-[var(--color-text-secondary)] uppercase tracking-wider mb-1 text-[11px]">
                Total Volume (ml)
              </label>
              <input
                type="number"
                step="50"
                min="0"
                value={waterIntake}
                onChange={(e) => setWaterIntake(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-xs text-[var(--color-text-primary)] font-medium focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15"
              />
            </div>

            <div>
              <label className="block text-[var(--color-text-secondary)] uppercase tracking-wider mb-1 text-[11px]">
                Target Goal (ml)
              </label>
              <input
                type="number"
                step="250"
                min="500"
                value={targetWater}
                onChange={(e) => setTargetWater(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-xs text-[var(--color-text-primary)] font-medium focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 mt-1 bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white text-xs font-bold rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={14} />
                  <span>{todayRecord ? 'Update Hydration' : 'Save Hydration'}</span>
                </>
              )}
            </button>

            {/* In-form step navigation */}
            <div className="pt-3 flex items-center justify-between border-t border-[var(--color-border)] mt-4">
              <Link
                to="/sleep"
                className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1 font-semibold transition-colors"
              >
                <ArrowLeft size={13} />
                <span>Prev: Sleep</span>
              </Link>
              <Link
                to="/environment"
                className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors group shadow-sm"
              >
                <span>Next: Environment</span>
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </form>
        </div>

        {/* History Card */}
        <div className="lg:col-span-2 bg-white border border-[var(--color-border)] rounded-[var(--radius-2xl)] p-6 shadow-[var(--shadow-sm)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
            <h3 className="font-bold text-base text-[var(--color-text-primary)]">Hydration History Logs</h3>
            <span className="text-xs text-[var(--color-text-muted)]">{records.length} records</span>
          </div>

          <div className="overflow-x-auto max-h-[380px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Water Intake</th>
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-3">Achievement</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {records.length > 0 ? (
                  records.map((rec) => {
                    const pct = Math.round((rec.water_intake_ml / (rec.target_water_ml || 2000)) * 100);
                    return (
                      <tr key={rec.id} className="hover:bg-[var(--color-surface-2)] transition-colors">
                        <td className="py-3 px-3 font-semibold text-[var(--color-text-primary)]">{rec.record_date}</td>
                        <td className="py-3 px-3 font-semibold text-[var(--color-text-primary)]">{rec.water_intake_ml} ml</td>
                        <td className="py-3 px-3 text-[var(--color-text-secondary)]">{rec.target_water_ml} ml</td>
                        <td className="py-3 px-3">
                          <span className={`inline-block font-bold px-2 py-0.5 rounded text-[11px] ${
                            pct >= 100
                              ? 'bg-emerald-50 text-emerald-700'
                              : pct >= 75
                              ? 'bg-brand-50 text-brand-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {pct}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleDelete(rec.id)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-[var(--color-text-muted)] italic">
                      No hydration logs recorded. Start tracking above!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Daily Tracking Navigation Flow Bar */}
      <DailyTrackingNav currentStep="hydration" showStepper={false} showBottomBar={true} />
    </div>
  );
};

export default Hydration;
