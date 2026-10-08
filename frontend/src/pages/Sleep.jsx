import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { trackingService } from '../services/tracking';
import { Moon, CheckCircle2, AlertTriangle, Trash2, Save, Clock, BedDouble, Award, ArrowRight, ArrowLeft, LayoutDashboard } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';
import { DailyTrackingNav } from '../components/ui/DailyTrackingNav';

const Sleep = () => {
  const [records, setRecords] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form State
  const [bedtime, setBedtime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('06:00');
  const [duration, setDuration] = useState(8); // in hours
  const [quality, setQuality] = useState('GOOD');

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchRecords = async () => {
    try {
      const data = await trackingService.getSleep();
      setRecords(data || []);

      const todayLog = (data || []).find(r => r.record_date === todayStr);
      if (todayLog) {
        setTodayRecord(todayLog);
        setBedtime(todayLog.bedtime);
        setWakeTime(todayLog.wake_time);
        setDuration(todayLog.duration_minutes / 60);
        setQuality(todayLog.quality);
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
      duration_minutes: Math.round(parseFloat(duration) * 60),
      quality,
      bedtime,
      wake_time: wakeTime,
      record_date: todayStr,
    };

    try {
      if (todayRecord) {
        const updated = await trackingService.updateSleep(todayRecord.id, payload);
        setTodayRecord(updated);
      } else {
        const created = await trackingService.createSleep(payload);
        setTodayRecord(created);
      }
      setSuccess(true);
      await fetchRecords();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit sleep log.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this log?")) return;
    try {
      await trackingService.deleteSleep(id);
      if (todayRecord && todayRecord.id === id) {
        setTodayRecord(null);
        setBedtime('22:00');
        setWakeTime('06:00');
        setDuration(8);
        setQuality('GOOD');
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
        <p className="text-xs text-[var(--color-text-muted)] font-medium">Loading sleep metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        badge="Circadian Biometrics"
        title="Sleep & Cellular Regeneration"
        subtitle="Deep REM sleep triggers nocturnal cellular repair and collagen synthesis essential for radiant skin."
      />

      {/* Daily Tracking Stepper Bar */}
      <DailyTrackingNav currentStep="sleep" showBottomBar={false} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card */}
        <div className="lg:col-span-1 bg-white border border-[var(--color-border)] rounded-[var(--radius-2xl)] p-6 shadow-[var(--shadow-sm)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
            <h3 className="font-bold text-base text-[var(--color-text-primary)] flex items-center gap-2">
              <Moon className="text-[var(--color-brand)]" size={18} />
              <span>{todayRecord ? 'Update' : 'Log'} Sleep Metrics</span>
            </h3>
            <span className="text-[11px] font-mono text-[var(--color-text-muted)]">{todayStr}</span>
          </div>

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-[var(--radius-lg)] text-xs space-y-1.5">
              <div className="flex gap-2 items-center">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">Sleep metrics saved successfully!</span>
              </div>
              <div className="pl-6">
                <Link to="/hydration" className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:text-emerald-950 underline text-xs">
                  Continue to Hydration Tracking <ArrowRight size={12} />
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 text-[11px]">
                  Bedtime
                </label>
                <input
                  type="time"
                  value={bedtime}
                  onChange={(e) => setBedtime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-xs text-[var(--color-text-primary)] font-medium focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15"
                />
              </div>
              <div>
                <label className="block text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 text-[11px]">
                  Wake Time
                </label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-xs text-[var(--color-text-primary)] font-medium focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 text-[11px]">
                  Duration (Hrs)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-xs text-[var(--color-text-primary)] font-medium focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15"
                />
              </div>
              <div>
                <label className="block text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 text-[11px]">
                  Sleep Quality
                </label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-xs text-[var(--color-text-primary)] font-medium focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15"
                >
                  <option value="POOR">Poor (Disrupted)</option>
                  <option value="FAIR">Fair (Intermittent)</option>
                  <option value="GOOD">Good (Restorative)</option>
                  <option value="EXCELLENT">Excellent (Deep REM)</option>
                </select>
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
                  <span>{todayRecord ? 'Update Sleep Entry' : 'Save Sleep Entry'}</span>
                </>
              )}
            </button>

            {/* In-form step navigation */}
            <div className="pt-3 flex items-center justify-between border-t border-[var(--color-border)] mt-4">
              <Link
                to="/lifestyle"
                className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1 font-semibold transition-colors"
              >
                <ArrowLeft size={13} />
                <span>Prev: Lifestyle</span>
              </Link>
              <Link
                to="/hydration"
                className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors group shadow-sm"
              >
                <span>Next: Hydration</span>
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </form>
        </div>

        {/* History Card */}
        <div className="lg:col-span-2 bg-white border border-[var(--color-border)] rounded-[var(--radius-2xl)] p-6 shadow-[var(--shadow-sm)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
            <h3 className="font-bold text-base text-[var(--color-text-primary)]">Sleep History Logs</h3>
            <span className="text-xs text-[var(--color-text-muted)]">{records.length} records</span>
          </div>

          <div className="overflow-x-auto max-h-[380px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Schedule</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Quality</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {records.length > 0 ? (
                  records.map((rec) => {
                    const hours = Math.round((rec.duration_minutes / 60) * 10) / 10;
                    return (
                      <tr key={rec.id} className="hover:bg-[var(--color-surface-2)] transition-colors">
                        <td className="py-3 px-3 font-semibold text-[var(--color-text-primary)]">{rec.record_date}</td>
                        <td className="py-3 px-3 text-[var(--color-text-secondary)] font-mono text-[11px]">
                          {rec.bedtime} - {rec.wake_time}
                        </td>
                        <td className="py-3 px-3 text-[var(--color-text-primary)] font-semibold">{hours} hrs</td>
                        <td className="py-3 px-3">
                          <span className={`inline-block font-bold px-2 py-0.5 rounded text-[11px] ${
                            rec.quality === 'EXCELLENT' || rec.quality === 'GOOD'
                              ? 'bg-emerald-50 text-emerald-700'
                              : rec.quality === 'FAIR'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            {rec.quality}
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
                      No sleep logs found. Track your night's sleep above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Daily Tracking Navigation Flow Bar */}
      <DailyTrackingNav currentStep="sleep" showStepper={false} showBottomBar={true} />
    </div>
  );
};

export default Sleep;
