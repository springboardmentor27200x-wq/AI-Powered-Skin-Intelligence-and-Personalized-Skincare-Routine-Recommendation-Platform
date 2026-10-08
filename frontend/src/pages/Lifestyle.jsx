import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { trackingService } from '../services/tracking';
import { Activity, CheckCircle2, AlertTriangle, Trash2, Save, Flame, Wine, Cigarette, HeartPulse, ArrowRight, LayoutDashboard } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';
import { DailyTrackingNav } from '../components/ui/DailyTrackingNav';

const Lifestyle = () => {
  const [records, setRecords] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form State
  const [activity, setActivity] = useState('MODERATE');
  const [smoking, setSmoking] = useState('NONE');
  const [alcohol, setAlcohol] = useState('NONE');
  const [stress, setStress] = useState(5);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchRecords = async () => {
    try {
      const data = await trackingService.getLifestyle();
      setRecords(data || []);

      // Find if today's log exists
      const todayLog = (data || []).find(r => r.record_date === todayStr);
      if (todayLog) {
        setTodayRecord(todayLog);
        setActivity(todayLog.physical_activity);
        setSmoking(todayLog.smoking);
        setAlcohol(todayLog.alcohol);
        setStress(todayLog.stress_level);
      } else {
        setTodayRecord(null);
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
      physical_activity: activity,
      smoking,
      alcohol,
      stress_level: parseInt(stress),
      record_date: todayStr,
    };

    try {
      if (todayRecord) {
        const updated = await trackingService.updateLifestyle(todayRecord.id, payload);
        setTodayRecord(updated);
      } else {
        const created = await trackingService.createLifestyle(payload);
        setTodayRecord(created);
      }
      setSuccess(true);
      await fetchRecords();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit lifestyle log.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this log?")) return;
    try {
      await trackingService.deleteLifestyle(id);
      if (todayRecord && todayRecord.id === id) {
        setTodayRecord(null);
        setActivity('MODERATE');
        setSmoking('NONE');
        setAlcohol('NONE');
        setStress(5);
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
        <p className="text-xs text-[var(--color-text-muted)] font-medium">Loading lifestyle data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        badge="Biometric Tracking"
        title="Lifestyle & Daily Habits"
        subtitle="Track physical activity, stress levels, and habits that influence skin barrier health."
      />

      {/* Daily Tracking Stepper Bar */}
      <DailyTrackingNav currentStep="lifestyle" showBottomBar={false} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logger Form */}
        <div className="lg:col-span-1 bg-white border border-[var(--color-border)] rounded-[var(--radius-2xl)] p-6 shadow-[var(--shadow-sm)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
            <h3 className="font-bold text-base text-[var(--color-text-primary)] flex items-center gap-2">
              <Activity className="text-[var(--color-brand)]" size={18} />
              <span>{todayRecord ? 'Update' : 'Log'} Today's Habits</span>
            </h3>
            <span className="text-[11px] font-mono text-[var(--color-text-muted)]">{todayStr}</span>
          </div>

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-[var(--radius-lg)] text-xs space-y-1.5">
              <div className="flex gap-2 items-center">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">Lifestyle habits saved successfully!</span>
              </div>
              <div className="pl-6">
                <Link to="/sleep" className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:text-emerald-950 underline text-xs">
                  Continue to Sleep Tracking <ArrowRight size={12} />
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

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 text-[11px]">
                Physical Activity
              </label>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-xs text-[var(--color-text-primary)] font-medium focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15"
              >
                <option value="SEDENTARY">Sedentary (Low motion)</option>
                <option value="MODERATE">Moderate Activity (30m walks/exercise)</option>
                <option value="ACTIVE">Highly Active (Intense training/sports)</option>
              </select>
            </div>

            <div>
              <label className="block text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 text-[11px]">
                Smoking Exposure
              </label>
              <select
                value={smoking}
                onChange={(e) => setSmoking(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-xs text-[var(--color-text-primary)] font-medium focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15"
              >
                <option value="NONE">None</option>
                <option value="LIGHT">Light / Secondhand</option>
                <option value="HEAVY">Heavy / Daily smoker</option>
              </select>
            </div>

            <div>
              <label className="block text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 text-[11px]">
                Alcohol Consumption
              </label>
              <select
                value={alcohol}
                onChange={(e) => setAlcohol(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-xs text-[var(--color-text-primary)] font-medium focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15"
              >
                <option value="NONE">None</option>
                <option value="LIGHT">Light / Occasional (1-2 drinks)</option>
                <option value="HEAVY">Heavy / Multiple drinks</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[var(--color-text-secondary)] uppercase tracking-wider text-[11px]">
                  Daily Stress Level
                </label>
                <span className="font-bold text-xs text-[var(--color-brand)] bg-[var(--color-brand-light)] px-2 py-0.5 rounded-full">
                  Level {stress}/10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={stress}
                onChange={(e) => setStress(e.target.value)}
                className="w-full accent-[var(--color-brand)] py-2 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[var(--color-text-muted)]">
                <span>1 (Calm)</span>
                <span>5 (Normal)</span>
                <span>10 (Severe)</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 mt-2 bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white text-xs font-bold rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={14} />
                  <span>{todayRecord ? 'Update Today\'s Entry' : 'Save Today\'s Entry'}</span>
                </>
              )}
            </button>

            {/* In-form next navigation */}
            <div className="pt-3 flex items-center justify-between border-t border-[var(--color-border)] mt-4">
              <Link
                to="/dashboard"
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] flex items-center gap-1 font-semibold transition-colors"
              >
                <LayoutDashboard size={13} />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/sleep"
                className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors group shadow-sm"
              >
                <span>Next: Sleep Tracking</span>
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </form>
        </div>

        {/* History List */}
        <div className="lg:col-span-2 bg-white border border-[var(--color-border)] rounded-[var(--radius-2xl)] p-6 shadow-[var(--shadow-sm)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
            <h3 className="font-bold text-base text-[var(--color-text-primary)]">Lifestyle History Log</h3>
            <span className="text-xs text-[var(--color-text-muted)]">{records.length} records</span>
          </div>

          <div className="overflow-x-auto max-h-[380px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Activity</th>
                  <th className="py-2.5 px-3">Smoking</th>
                  <th className="py-2.5 px-3">Alcohol</th>
                  <th className="py-2.5 px-3">Stress</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {records.length > 0 ? (
                  records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-[var(--color-surface-2)] transition-colors">
                      <td className="py-3 px-3 font-semibold text-[var(--color-text-primary)]">{rec.record_date}</td>
                      <td className="py-3 px-3 text-[var(--color-text-secondary)]">{rec.physical_activity}</td>
                      <td className="py-3 px-3 text-[var(--color-text-secondary)]">{rec.smoking}</td>
                      <td className="py-3 px-3 text-[var(--color-text-secondary)]">{rec.alcohol}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-block font-bold px-2 py-0.5 rounded text-[11px] ${
                          rec.stress_level <= 3
                            ? 'bg-emerald-50 text-emerald-700'
                            : rec.stress_level <= 6
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {rec.stress_level}/10
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
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-[var(--color-text-muted)] italic">
                      No lifestyle logs recorded yet. Use the form to record today's habits.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Daily Tracking Navigation Flow Bar */}
      <DailyTrackingNav currentStep="lifestyle" showStepper={false} showBottomBar={true} />
    </div>
  );
};

export default Lifestyle;
