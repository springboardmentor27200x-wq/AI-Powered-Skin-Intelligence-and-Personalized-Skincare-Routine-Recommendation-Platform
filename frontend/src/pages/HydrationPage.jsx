import React, { useState, useEffect, useCallback } from 'react';
import { Droplets, Plus, Trash2, Calendar, Coffee, Sparkles } from 'lucide-react';
import { hydrationService } from '../services/hydrationService';
import { useNotification } from '../hooks/useNotification';
import { formatDate, formatMl } from '../utils/formatters';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ProgressBar } from '../components/common/ProgressBar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function HydrationPage() {
  const { notifySuccess, notifyError } = useNotification();

  const [records, setRecords] = useState([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customMl, setCustomMl] = useState(250);
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchHydration = useCallback(async () => {
    try {
      const data = await hydrationService.getSummary();
      setRecords(data.records || []);
      setTodayTotal(data.today_total_ml || 0);
    } catch (err) {
      console.error('Failed to load hydration:', err);
      notifyError('Failed to load hydration history.');
    } finally {
      setIsLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    fetchHydration();
  }, [fetchHydration]);

  const handleLogIntake = async (amount) => {
    const ml = amount || customMl;
    if (!ml || ml <= 0) {
      notifyError('Please enter a valid water amount in ml.');
      return;
    }

    setIsSubmitting(true);
    try {
      await hydrationService.logHydration({
        water_intake_ml: parseFloat(ml),
        record_date: logDate,
      });
      notifySuccess(`Recorded +${formatMl(ml)} of water!`);
      fetchHydration();
    } catch (err) {
      console.error('Failed to record hydration:', err);
      notifyError('Failed to record hydration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this hydration log entry?')) return;

    try {
      await hydrationService.deleteHydration(id);
      notifySuccess('Hydration entry deleted.');
      fetchHydration();
    } catch (err) {
      console.error('Failed to delete hydration entry:', err);
      notifyError('Failed to delete entry.');
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading hydration records..." />;
  }

  const goalMl = 2000;
  const percentage = Math.min(100, Math.round((todayTotal / goalMl) * 100));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Droplets className="w-6 h-6 text-sky-600" />
          Hydration Tracking
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor your daily fluid intake to ensure optimal cellular hydration and barrier resilience.
        </p>
      </div>

      {/* Today's Gauge & Quick Log */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gauge card */}
        <Card className="md:col-span-1 bg-gradient-to-b from-sky-50 to-white border-sky-100 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider block">
              Today's Water Intake
            </span>
            <div className="text-3xl font-black text-slate-900 mt-2">
              {formatMl(todayTotal)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Daily standard target: {formatMl(goalMl)}</p>
          </div>

          <div className="mt-6 space-y-2">
            <ProgressBar value={percentage} max={100} showLabel={true} label="Hydration Target" size="lg" />
            <div className="flex justify-between text-[11px] font-medium text-slate-500 pt-1">
              <span>~{Math.round(todayTotal / 250)} standard cups</span>
              <span className="font-bold text-sky-700">{percentage}%</span>
            </div>
          </div>
        </Card>

        {/* Quick Log Presets */}
        <Card title="Quick Log Intake" subtitle="Tap a preset or enter a custom amount" className="md:col-span-2">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleLogIntake(250)}
                disabled={isSubmitting}
                className="p-3.5 rounded-2xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100/70 hover:border-sky-300 transition text-center group"
              >
                <span className="text-lg font-black text-sky-800 block group-hover:scale-105 transition-transform">
                  +250 ml
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Standard Glass</span>
              </button>

              <button
                type="button"
                onClick={() => handleLogIntake(500)}
                disabled={isSubmitting}
                className="p-3.5 rounded-2xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100/70 hover:border-sky-300 transition text-center group"
              >
                <span className="text-lg font-black text-sky-800 block group-hover:scale-105 transition-transform">
                  +500 ml
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Water Bottle</span>
              </button>

              <button
                type="button"
                onClick={() => handleLogIntake(750)}
                disabled={isSubmitting}
                className="p-3.5 rounded-2xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100/70 hover:border-sky-300 transition text-center group"
              >
                <span className="text-lg font-black text-sky-800 block group-hover:scale-105 transition-transform">
                  +750 ml
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Large Flask</span>
              </button>
            </div>

            {/* Custom Log */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-slate-700 block mb-2">Custom Amount & Date</span>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    type="number"
                    min="50"
                    step="50"
                    placeholder="Milliliters (ml)"
                    value={customMl}
                    onChange={(e) => setCustomMl(e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => handleLogIntake()}
                  isLoading={isSubmitting}
                  variant="primary"
                  icon={Plus}
                  className="whitespace-nowrap"
                >
                  Log Water
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* History Log Table */}
      <Card
        title="Hydration History Log"
        subtitle="Chronological list of all recorded intake events"
        bodyClassName="p-0"
      >
        {records.length === 0 ? (
          <div className="py-12 text-center">
            <Droplets className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No hydration logs found</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">Use the quick log buttons above to record your first glass</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200/80 text-[11px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Volume (ml)</th>
                  <th className="py-3 px-4">Equivalent</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {formatDate(r.record_date)}
                    </td>
                    <td className="py-3 px-4 font-bold text-sky-700">
                      {formatMl(r.water_intake_ml)}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      ~{(r.water_intake_ml / 250).toFixed(1)} glasses
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
