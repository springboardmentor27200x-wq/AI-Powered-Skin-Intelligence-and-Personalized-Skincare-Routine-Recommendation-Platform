import React, { useState, useEffect } from "react";
import { SleepRecord, PageRoute } from "../types";
import { api } from "../services/api";
import {
  Moon,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Sparkles,
  Clock,
  BatteryCharging,
  Droplets,
} from "lucide-react";

interface SleepProps {
  onNavigate?: (route: PageRoute) => void;
}

export const Sleep: React.FC<SleepProps> = ({ onNavigate }) => {
  const [records, setRecords] = useState<SleepRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [sleepQuality, setSleepQuality] = useState<string>("Good");

  // Edit State
  const [editingRecord, setEditingRecord] = useState<SleepRecord | null>(null);
  const [editHours, setEditHours] = useState<number>(7.0);
  const [editQuality, setEditQuality] = useState<string>("Good");

  const qualityOptions = [
    { value: "Poor", label: "Poor", desc: "< 5 hrs / Frequent awakenings", color: "bg-[#FAF0EE] text-[#B85D52] border-[#E8D2CC]" },
    { value: "Fair", label: "Fair", desc: "Light sleep, woke up tired", color: "bg-[#FBF6EE] text-[#B89358] border-[#EBDDCB]" },
    { value: "Good", label: "Good", desc: "Restful, adequate recovery", color: "bg-[#F0F5F1] text-[#5A6D5C] border-[#8BA88E]/40" },
    { value: "Excellent", label: "Excellent", desc: "Uninterrupted, energized", color: "bg-[#EAF2EC] text-[#426447] border-[#8BA88E]" },
    { value: "Deep", label: "Deep", desc: "Optimal REM & physical repair", color: "bg-[#F0F2F5] text-[#556578] border-[#8BA8B6]/40" },
  ];

  const loadRecords = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getSleepRecords();
      setRecords(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load sleep logs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (sleepHours <= 0 || sleepHours > 24) {
      setErrorMessage("Sleep hours must be between 0.1 and 24.0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newEntry = await api.createSleepRecord({
        sleep_hours: Number(sleepHours),
        sleep_quality: sleepQuality,
      });
      setRecords([newEntry, ...records]);
      setSuccessMessage("Sleep entry logged successfully!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to log sleep record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteSleepRecord(id);
      setRecords(records.filter((r) => r.id !== id));
      setSuccessMessage("Sleep record deleted.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete sleep record.");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    try {
      const updated = await api.updateSleepRecord(editingRecord.id, {
        sleep_hours: Number(editHours),
        sleep_quality: editQuality,
      });
      setRecords(records.map((r) => (r.id === updated.id ? updated : r)));
      setEditingRecord(null);
      setSuccessMessage("Sleep record updated.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update record.");
    }
  };

  const getQualityBadgeClass = (quality: string) => {
    const found = qualityOptions.find((q) => q.value.toLowerCase() === quality.toLowerCase());
    return found ? found.color : "bg-stone-100 text-stone-700 border-stone-200";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#EAE6DE]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2E2C29] tracking-tight">
            Sleep Duration & Recovery Log
          </h1>
          <p className="text-xs text-[#6E685E] mt-1">
            Log sleep metrics to capture nocturnal skin barrier regeneration.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onNavigate && (
            <div className="inline-flex p-1 bg-[#FAF8F5] border border-[#EAE6DE] rounded-xl">
              <button
                type="button"
                onClick={() => onNavigate("/lifestyle")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#6E685E] hover:text-[#2E2C29] flex items-center gap-1.5 cursor-pointer"
              >
                <Droplets className="w-3.5 h-3.5" />
                <span>Water & Lifestyle</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("/sleep")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#5A6D5C] text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Sleep Tracker</span>
              </button>
            </div>
          )}

          <button
            id="sleep-refresh-btn"
            type="button"
            onClick={loadRecords}
            className="p-2 rounded-lg border border-[#EAE6DE] bg-white hover:bg-[#FAF8F5] text-[#4A4742] transition-colors cursor-pointer"
            title="Refresh Records"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#5A6D5C] ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-[#F0F5F1] border border-[#8BA88E]/40 text-[#5A6D5C] text-xs flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#5A6D5C]" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-[#FAF0EE] border border-[#E8D2CC] text-[#B85D52] text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#B85D52]" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Container (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl border border-[#E5E0D5] p-6 sm:p-7 shadow-xs sticky top-24">
            <h2 className="text-base font-serif font-bold text-[#333333] mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#5A6D5C]" />
              <span>Log Sleep Record</span>
            </h2>

            <form onSubmit={handleCreate} className="space-y-5">
              {/* 1. Sleep Duration */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#7A746B] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#556578]" />
                    <span>Duration (Hours)</span>
                  </label>
                  <span className="text-sm font-bold text-[#556578] bg-[#F0F2F5] px-2.5 py-0.5 rounded-lg border border-[#8BA8B6]/30">
                    {sleepHours.toFixed(1)} hrs
                  </span>
                </div>

                <input
                  id="sleep-hours-range"
                  type="range"
                  min="3.0"
                  max="14.0"
                  step="0.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#F2EDE4] rounded-lg appearance-none cursor-pointer accent-[#5A6D5C]"
                />

                <div className="flex justify-between items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setSleepHours(Math.max(1, +(sleepHours - 0.5).toFixed(1)))}
                    className="px-2.5 py-1 rounded-xl bg-[#FAF7F2] hover:bg-[#F2EDE4] text-[#4A4742] text-xs font-medium border border-[#E5E0D5] cursor-pointer"
                  >
                    - 0.5h
                  </button>
                  <div className="text-[11px] text-[#9E978C]">Target ~ 7.5 - 9.0h</div>
                  <button
                    type="button"
                    onClick={() => setSleepHours(Math.min(24, +(sleepHours + 0.5).toFixed(1)))}
                    className="px-2.5 py-1 rounded-xl bg-[#FAF7F2] hover:bg-[#F2EDE4] text-[#4A4742] text-xs font-medium border border-[#E5E0D5] cursor-pointer"
                  >
                    + 0.5h
                  </button>
                </div>
              </div>

              {/* 2. Sleep Quality */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A746B] mb-2 flex items-center gap-1.5">
                  <BatteryCharging className="w-3.5 h-3.5 text-[#556578]" />
                  <span>Subjective Sleep Quality</span>
                </label>

                <div className="space-y-2">
                  {qualityOptions.map((q) => {
                    const isSelected = sleepQuality === q.value;
                    return (
                      <button
                        type="button"
                        key={q.value}
                        id={`sleep-quality-${q.value.toLowerCase()}`}
                        onClick={() => setSleepQuality(q.value)}
                        className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#5A6D5C] border-[#5A6D5C] text-white shadow-xs"
                            : "bg-[#FAF7F2] border-[#E5E0D5] text-[#333333] hover:bg-[#F2EDE4]"
                        }`}
                      >
                        <div>
                          <span className="font-semibold text-xs block">{q.label}</span>
                          <span className={`text-[11px] ${isSelected ? "text-[#E8EFE9]" : "text-[#7A746B]"}`}>
                            {q.desc}
                          </span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#E8EFE9]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                id="sleep-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-[#5A6D5C] text-white font-medium text-xs hover:bg-[#4A5D4C] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Saving Record...</span>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Log Sleep Entry</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* History List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-serif font-bold text-[#333333]">
              Recorded Sleep History ({records.length})
            </h2>
          </div>

          {records.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#E5E0D5] p-8 text-center text-[#7A746B] text-xs">
              <Moon className="w-8 h-8 mx-auto mb-2 text-[#9E978C]" />
              <p className="font-medium text-[#333333]">No sleep records logged yet.</p>
              <p className="mt-1 text-[#9E978C]">Use the form on the left to record your first night.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  id={`sleep-record-${record.id}`}
                  className="bg-white rounded-3xl border border-[#E5E0D5] p-5 shadow-xs hover:border-[#8BA88E] transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F0F2F5] text-[#556578] flex items-center justify-center font-bold text-xs">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#333333]">
                          {record.sleep_hours} Hours
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${getQualityBadgeClass(
                            record.sleep_quality
                          )}`}
                        >
                          {record.sleep_quality}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#9E978C] flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(record.recorded_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      id={`sleep-edit-btn-${record.id}`}
                      onClick={() => {
                        setEditingRecord(record);
                        setEditHours(record.sleep_hours);
                        setEditQuality(record.sleep_quality);
                      }}
                      className="p-1.5 rounded-lg text-[#9E978C] hover:text-[#333333] hover:bg-[#F2EDE4] cursor-pointer"
                      title="Edit entry"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`sleep-delete-btn-${record.id}`}
                      onClick={() => handleDelete(record.id)}
                      className="p-1.5 rounded-lg text-[#9E978C] hover:text-[#B85D52] hover:bg-[#FAF0EE] cursor-pointer"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-[#E5E0D5] max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-serif font-bold text-[#333333]">Edit Sleep Entry</h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1 rounded-lg text-[#9E978C] hover:text-[#333333] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A746B] mb-1">
                  Sleep Duration (Hours)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="24"
                  required
                  value={editHours}
                  onChange={(e) => setEditHours(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E5E0D5] rounded-xl text-[#333333] focus:bg-white focus:border-[#5A6D5C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A746B] mb-1">
                  Sleep Quality
                </label>
                <select
                  value={editQuality}
                  onChange={(e) => setEditQuality(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E5E0D5] rounded-xl text-[#333333] focus:bg-white focus:border-[#5A6D5C] focus:outline-none cursor-pointer"
                >
                  {qualityOptions.map((q) => (
                    <option key={q.value} value={q.value}>
                      {q.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-xl border border-[#E5E0D5] text-xs font-medium text-[#4A4742] hover:bg-[#FAF7F2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#5A6D5C] text-white text-xs font-medium hover:bg-[#4A5D4C] cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
