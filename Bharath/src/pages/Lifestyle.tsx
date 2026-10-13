import React, { useState, useEffect } from "react";
import { LifestyleRecord, PageRoute } from "../types";
import { api } from "../services/api";
import {
  HeartPulse,
  Droplets,
  Sun,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Sparkles,
  Moon,
} from "lucide-react";

interface LifestyleProps {
  onNavigate?: (route: PageRoute) => void;
}

export const Lifestyle: React.FC<LifestyleProps> = ({ onNavigate }) => {
  const [records, setRecords] = useState<LifestyleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [waterIntake, setWaterIntake] = useState<number>(2.5);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([
    "Balanced diet",
    "Daily SPF 50",
  ]);
  const [customHabitInput, setCustomHabitInput] = useState("");
  const [environmentalExposure, setEnvironmentalExposure] = useState<string>("Urban pollution & Air-conditioned office");

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<LifestyleRecord | null>(null);
  const [editWater, setEditWater] = useState<number>(2.0);
  const [editExposure, setEditExposure] = useState<string>("");

  const commonHabits = [
    "Balanced diet",
    "High antioxidant foods",
    "Daily SPF 50",
    "Regular exercise",
    "Low stress",
    "Moderate stress",
    "High screen time",
    "High caffeine",
    "Alcohol consumption",
    "Smoking / Vaping",
  ];

  const commonEnvironments = [
    "Urban pollution & Air-conditioned office",
    "High UV outdoor exposure (Sunny climate)",
    "Dry indoor heating / Winter air",
    "Humid tropical environment",
    "Clean coastal air",
    "High elevation UV exposure",
  ];

  const loadRecords = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getLifestyleRecords();
      setRecords(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load lifestyle history.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const toggleHabit = (habit: string) => {
    if (selectedHabits.includes(habit)) {
      setSelectedHabits(selectedHabits.filter((h) => h !== habit));
    } else {
      setSelectedHabits([...selectedHabits, habit]);
    }
  };

  const addCustomHabit = () => {
    if (customHabitInput.trim() && !selectedHabits.includes(customHabitInput.trim())) {
      setSelectedHabits([...selectedHabits, customHabitInput.trim()]);
      setCustomHabitInput("");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (waterIntake < 0 || waterIntake > 20) {
      setErrorMessage("Water intake must be between 0 and 20 Liters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newEntry = await api.createLifestyleRecord({
        lifestyle_habits: selectedHabits,
        water_intake: Number(waterIntake),
        environmental_exposure: environmentalExposure,
      });
      setRecords([newEntry, ...records]);
      setSuccessMessage("Lifestyle record logged successfully!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save lifestyle entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteLifestyleRecord(id);
      setRecords(records.filter((r) => r.id !== id));
      setSuccessMessage("Record deleted.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete record.");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    try {
      const updated = await api.updateLifestyleRecord(editingRecord.id, {
        water_intake: Number(editWater),
        environmental_exposure: editExposure,
      });
      setRecords(records.map((r) => (r.id === updated.id ? updated : r)));
      setEditingRecord(null);
      setSuccessMessage("Record updated successfully.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update record.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#EAE6DE]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2E2C29] tracking-tight">
            Water, Lifestyle & Sleep Tracking
          </h1>
          <p className="text-xs text-[#6E685E] mt-1">
            Log daily hydration, habits, environmental exposure, and nightly sleep quality.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onNavigate && (
            <div className="inline-flex p-1 bg-[#FAF8F5] border border-[#EAE6DE] rounded-xl">
              <button
                type="button"
                onClick={() => onNavigate("/lifestyle")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#5A6D5C] text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Droplets className="w-3.5 h-3.5" />
                <span>Water & Lifestyle</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("/sleep")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#6E685E] hover:text-[#2E2C29] flex items-center gap-1.5 cursor-pointer"
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Sleep Tracker</span>
              </button>
            </div>
          )}

          <button
            id="lifestyle-refresh-btn"
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
              <span>Log New Lifestyle Record</span>
            </h2>

            <form onSubmit={handleCreate} className="space-y-5">
              {/* 1. Water Intake */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#7A746B] flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-[#557889]" />
                    <span>Water Intake (Liters)</span>
                  </label>
                  <span className="text-sm font-bold text-[#557889] bg-[#F0F5F8] px-2 py-0.5 rounded-lg border border-[#8BA8B6]/30">
                    {waterIntake.toFixed(1)} L
                  </span>
                </div>

                <input
                  id="water-intake-range"
                  type="range"
                  min="0.5"
                  max="6.0"
                  step="0.1"
                  value={waterIntake}
                  onChange={(e) => setWaterIntake(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#F2EDE4] rounded-lg appearance-none cursor-pointer accent-[#5A6D5C]"
                />

                <div className="flex justify-between items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setWaterIntake(Math.max(0.5, +(waterIntake - 0.5).toFixed(1)))}
                    className="px-2.5 py-1 rounded-xl bg-[#FAF7F2] hover:bg-[#F2EDE4] text-[#4A4742] text-xs font-medium border border-[#E5E0D5] cursor-pointer"
                  >
                    - 0.5L
                  </button>
                  <div className="text-[11px] text-[#9E978C]">Target ~ 2.5 - 3.0L</div>
                  <button
                    type="button"
                    onClick={() => setWaterIntake(Math.min(6.0, +(waterIntake + 0.5).toFixed(1)))}
                    className="px-2.5 py-1 rounded-xl bg-[#FAF7F2] hover:bg-[#F2EDE4] text-[#4A4742] text-xs font-medium border border-[#E5E0D5] cursor-pointer"
                  >
                    + 0.5L
                  </button>
                </div>
              </div>

              {/* 2. Environmental Exposure */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A746B] mb-2 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-[#B89358]" />
                  <span>Environmental Exposure</span>
                </label>
                <select
                  id="environmental-exposure-select"
                  value={environmentalExposure}
                  onChange={(e) => setEnvironmentalExposure(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E5E0D5] rounded-xl text-[#333333] focus:bg-white focus:border-[#5A6D5C] focus:outline-none cursor-pointer"
                >
                  {commonEnvironments.map((env) => (
                    <option key={env} value={env}>
                      {env}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Lifestyle Habits */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A746B] mb-2">
                  Daily Habits & Factors
                </label>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {commonHabits.map((habit) => {
                    const isSelected = selectedHabits.includes(habit);
                    return (
                      <button
                        type="button"
                        key={habit}
                        onClick={() => toggleHabit(habit)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#5A6D5C] border-[#5A6D5C] text-white shadow-xs"
                            : "bg-[#FAF7F2] border-[#E5E0D5] text-[#4A4742] hover:bg-[#F2EDE4]"
                        }`}
                      >
                        {habit}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <input
                    id="custom-habit-input"
                    type="text"
                    placeholder="Add custom habit..."
                    value={customHabitInput}
                    onChange={(e) => setCustomHabitInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomHabit();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#E5E0D5] rounded-xl text-[#333333] placeholder-[#9E978C] focus:bg-white focus:border-[#5A6D5C] focus:outline-none"
                  />
                  <button
                    id="add-custom-habit-btn"
                    type="button"
                    onClick={addCustomHabit}
                    className="px-3 py-1.5 bg-[#F2EDE4] hover:bg-[#EAE4D8] text-[#333333] rounded-xl text-xs font-medium cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              <button
                id="lifestyle-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-[#5A6D5C] text-white font-medium text-xs hover:bg-[#4A5D4C] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Saving Record...</span>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Log Lifestyle Entry</span>
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
              Recorded Lifestyle History ({records.length})
            </h2>
          </div>

          {records.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#E5E0D5] p-8 text-center text-[#7A746B] text-xs">
              <HeartPulse className="w-8 h-8 mx-auto mb-2 text-[#9E978C]" />
              <p className="font-medium text-[#333333]">No lifestyle records yet.</p>
              <p className="mt-1 text-[#9E978C]">Use the form on the left to add your first record.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => {
                const habitsList = Array.isArray(record.lifestyle_habits)
                  ? record.lifestyle_habits
                  : typeof record.lifestyle_habits === "string" && record.lifestyle_habits
                  ? [record.lifestyle_habits]
                  : [];

                return (
                  <div
                    key={record.id}
                    id={`lifestyle-record-${record.id}`}
                    className="bg-white rounded-3xl border border-[#E5E0D5] p-5 shadow-xs hover:border-[#8BA88E] transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-[#F0F5F8] text-[#557889] flex items-center justify-center font-bold text-xs">
                          <Droplets className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-[#333333]">
                            {record.water_intake} L Water
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#9E978C] flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(record.recorded_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <button
                          id={`lifestyle-edit-btn-${record.id}`}
                          onClick={() => {
                            setEditingRecord(record);
                            setEditWater(record.water_intake);
                            setEditExposure(record.environmental_exposure || "");
                          }}
                          className="p-1.5 rounded-lg text-[#9E978C] hover:text-[#333333] hover:bg-[#F2EDE4] cursor-pointer"
                          title="Edit record"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`lifestyle-delete-btn-${record.id}`}
                          onClick={() => handleDelete(record.id)}
                          className="p-1.5 rounded-lg text-[#9E978C] hover:text-[#B85D52] hover:bg-[#FAF0EE] cursor-pointer"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-[#4A4742] space-y-1.5 pt-1 border-t border-[#F2EDE4]">
                      <div className="flex items-center gap-1.5 text-[#333333]">
                        <Sun className="w-3.5 h-3.5 text-[#B89358] shrink-0" />
                        <span className="font-medium">{record.environmental_exposure || "General indoor environment"}</span>
                      </div>

                      {habitsList.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {habitsList.map((h, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-lg bg-[#FAF7F2] border border-[#E5E0D5] text-[#4A4742] text-[11px] font-medium"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-[#E5E0D5] max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-serif font-bold text-[#333333]">Edit Lifestyle Entry</h3>
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
                  Water Intake (Liters)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  required
                  value={editWater}
                  onChange={(e) => setEditWater(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E5E0D5] rounded-xl text-[#333333] focus:bg-white focus:border-[#5A6D5C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A746B] mb-1">
                  Environmental Exposure
                </label>
                <input
                  type="text"
                  required
                  value={editExposure}
                  onChange={(e) => setEditExposure(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E5E0D5] rounded-xl text-[#333333] focus:bg-white focus:border-[#5A6D5C] focus:outline-none"
                />
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
