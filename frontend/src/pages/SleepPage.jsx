import React, { useState, useEffect, useCallback } from 'react';
import { Moon, Plus, Trash2, Edit2, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import { sleepService } from '../services/sleepService';
import { useNotification } from '../hooks/useNotification';
import { SLEEP_QUALITY_OPTIONS, SLEEP_CONSISTENCY_OPTIONS } from '../utils/constants';
import { formatDate } from '../utils/formatters';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function SleepPage() {
  const { notifySuccess, notifyError } = useNotification();

  const [records, setRecords] = useState([]);
  const [avgDuration, setAvgDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Log / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    sleep_duration_hours: 7.5,
    sleep_quality: 'Good',
    bedtime: '23:00',
    wake_time: '07:00',
    sleep_consistency: 'Consistent',
    record_date: new Date().toISOString().split('T')[0],
  });

  const fetchSleepData = useCallback(async () => {
    try {
      const data = await sleepService.getHistory();
      setRecords(data.records || []);
      setAvgDuration(data.average_duration || 0);
    } catch (err) {
      console.error('Failed to load sleep history:', err);
      notifyError('Failed to load sleep history.');
    } finally {
      setIsLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    fetchSleepData();
  }, [fetchSleepData]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      sleep_duration_hours: 7.5,
      sleep_quality: 'Good',
      bedtime: '23:00',
      wake_time: '07:00',
      sleep_consistency: 'Consistent',
      record_date: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingId(record.id);
    setFormData({
      sleep_duration_hours: record.sleep_duration_hours,
      sleep_quality: record.sleep_quality,
      bedtime: record.bedtime || '23:00',
      wake_time: record.wake_time || '07:00',
      sleep_consistency: record.sleep_consistency || 'Consistent',
      record_date: record.record_date,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        ...formData,
        sleep_duration_hours: parseFloat(formData.sleep_duration_hours),
      };

      if (editingId) {
        await sleepService.updateSleep(editingId, payload);
        notifySuccess('Sleep record updated successfully!');
      } else {
        await sleepService.logSleep(payload);
        notifySuccess('New sleep record logged successfully!');
      }

      setIsModalOpen(false);
      fetchSleepData();
    } catch (err) {
      console.error('Failed to save sleep record:', err);
      notifyError('Failed to save sleep record.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sleep entry?')) return;

    try {
      await sleepService.deleteSleep(id);
      notifySuccess('Sleep record deleted.');
      fetchSleepData();
    } catch (err) {
      console.error('Failed to delete sleep record:', err);
      notifyError('Failed to delete record.');
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading sleep tracking records..." />;
  }

  const qualityBadgeVariants = {
    Poor: 'danger',
    Fair: 'warning',
    Good: 'primary',
    Excellent: 'purple',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Moon className="w-6 h-6 text-purple-600" />
            Restorative Sleep Tracking
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Log your sleep duration, subjective quality, and nightly schedules.
          </p>
        </div>
        <Button onClick={openCreateModal} variant="primary" icon={Plus}>
          Log Sleep Record
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-purple-50/40 border-purple-100">
          <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">
            Average Sleep Duration
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {avgDuration > 0 ? `${avgDuration} hrs` : '--'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across all logged history</p>
        </Card>

        <Card className="bg-emerald-50/40 border-emerald-100">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            Total Sleep Entries
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{records.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Logged sleep sessions</p>
        </Card>

        <Card className="bg-teal-50/40 border-teal-100">
          <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
            Latest Quality Rating
          </span>
          <div className="text-lg font-bold text-slate-900 mt-1">
            {records.length > 0 ? (
              <Badge variant={qualityBadgeVariants[records[0].sleep_quality] || 'primary'} size="md" dot>
                {records[0].sleep_quality}
              </Badge>
            ) : (
              '--'
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Subjective recovery state</p>
        </Card>
      </div>

      {/* History Log Table */}
      <Card
        title="Sleep History Log"
        subtitle="Recent nightly entries and sleep metrics"
        bodyClassName="p-0"
      >
        {records.length === 0 ? (
          <div className="py-12 text-center">
            <Moon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No sleep records logged yet</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Click the button below to add your first sleep log
            </p>
            <Button onClick={openCreateModal} variant="primary" size="sm" icon={Plus}>
              Add Sleep Entry
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200/80 text-[11px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Quality</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Consistency</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {formatDate(r.record_date)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {r.sleep_duration_hours} hrs
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={qualityBadgeVariants[r.sleep_quality] || 'default'} size="sm" dot>
                        {r.sleep_quality}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {r.bedtime || '--'} → {r.wake_time || '--'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {r.sleep_consistency || 'Standard'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(r)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Log / Edit Sleep Record Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Sleep Entry' : 'Log Nightly Sleep'}
        subtitle="Record your sleep hours, subjective restorative quality, and timeline"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Date of Sleep"
            type="date"
            required
            value={formData.record_date}
            onChange={(e) => setFormData({ ...formData, record_date: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Duration (Hours) <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                required
                value={formData.sleep_duration_hours}
                onChange={(e) => setFormData({ ...formData, sleep_duration_hours: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <span className="text-xs font-bold text-slate-500 min-w-[50px]">hours</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Sleep Quality <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SLEEP_QUALITY_OPTIONS.map((q) => (
                <button
                  type="button"
                  key={q.id}
                  onClick={() => setFormData({ ...formData, sleep_quality: q.id })}
                  className={`py-2 rounded-xl text-xs font-semibold border text-center transition ${
                    formData.sleep_quality === q.id
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Typical Bedtime"
              type="time"
              value={formData.bedtime}
              onChange={(e) => setFormData({ ...formData, bedtime: e.target.value })}
            />
            <Input
              label="Wake-Up Time"
              type="time"
              value={formData.wake_time}
              onChange={(e) => setFormData({ ...formData, wake_time: e.target.value })}
            />
          </div>

          <Select
            label="Schedule Consistency"
            options={SLEEP_CONSISTENCY_OPTIONS}
            value={formData.sleep_consistency}
            onChange={(e) => setFormData({ ...formData, sleep_consistency: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              {editingId ? 'Update Record' : 'Save Sleep Entry'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
