import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  SkincareRoutine,
  SkinAssessment,
  SkinProfile,
  PageRoute,
  RoutineStep,
  WeeklyTreatment,
  UserShelfItem,
  RoutineConflictReport,
  AdherenceStreakSummary,
} from "../types";
import {
  Sun,
  Moon,
  Calendar,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Info,
  ShieldX,
  Check,
  ShoppingBag,
  Flame,
  Compass,
  ChevronRight,
} from "lucide-react";
import { SeasonalRoutineView } from "../components/SeasonalRoutineView";

interface RoutinePageProps {
  onNavigate: (route: PageRoute) => void;
}

export const RoutinePage: React.FC<RoutinePageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [routine, setRoutine] = useState<SkincareRoutine | null>(null);
  const [assessment, setAssessment] = useState<SkinAssessment | null>(null);
  const [skinProfile, setSkinProfile] = useState<SkinProfile | null>(null);

  // Milestone 3 state
  const [shelfItems, setShelfItems] = useState<UserShelfItem[]>([]);
  const [conflictReport, setConflictReport] = useState<RoutineConflictReport | null>(null);
  const [streakSummary, setStreakSummary] = useState<AdherenceStreakSummary | null>(null);
  const [todayLog, setTodayLog] = useState<{
    am_completed: boolean;
    pm_completed: boolean;
    skin_reaction: string;
    reaction_notes: string;
  }>({
    am_completed: true,
    pm_completed: false,
    skin_reaction: "Calm & Radiant",
    reaction_notes: "",
  });
  const [isSavingLog, setIsSavingLog] = useState(false);
  const [showLogDrawer, setShowLogDrawer] = useState(false);

  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"am" | "pm" | "seasonal" | "weekly">("am");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Skin Profile
      let profile: SkinProfile | null = null;
      try {
        profile = await api.getSkinProfile();
        setSkinProfile(profile);
      } catch {
        setSkinProfile(null);
      }

      // 2. Fetch Assessment
      let assess: SkinAssessment | null = null;
      try {
        assess = await api.getSkinAssessment();
        setAssessment(assess);
      } catch {
        if (profile) {
          assess = await api.generateSkinAssessment();
          setAssessment(assess);
        }
      }

      // 3. Fetch Routine
      try {
        const existingRoutine = await api.getSkincareRoutine();
        setRoutine(existingRoutine);
      } catch {
        if (profile) {
          const generated = await api.generateSkincareRoutine();
          setRoutine(generated);
        } else {
          setRoutine(null);
        }
      }

      // 4. Milestone 3: Fetch Shelf, Conflicts & Adherence Logs
      try {
        const shelf = await api.getUserShelf();
        setShelfItems(shelf);
      } catch {
        // Fallback
      }

      try {
        const conflicts = await api.checkRoutineConflicts();
        setConflictReport(conflicts);
      } catch {
        // Fallback
      }

      try {
        const logData = await api.getRoutineLogs();
        setStreakSummary(logData.summary);
        const todayStr = new Date().toISOString().split("T")[0];
        const todaysEntry = logData.logs.find((l) => l.date === todayStr);
        if (todaysEntry) {
          setTodayLog({
            am_completed: todaysEntry.am_completed,
            pm_completed: todaysEntry.pm_completed,
            skin_reaction: todaysEntry.skin_reaction || "Calm & Radiant",
            reaction_notes: todaysEntry.reaction_notes || "",
          });
        }
      } catch {
        // Fallback
      }
    } catch (err: any) {
      setError(err.message || "Failed to load personalized routine.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDailyLog = async (override?: Partial<typeof todayLog>) => {
    setIsSavingLog(true);
    setError(null);
    try {
      const payload = { ...todayLog, ...override };
      const todayStr = new Date().toISOString().split("T")[0];
      const res = await api.logDailyRoutine({
        date: todayStr,
        am_completed: payload.am_completed,
        pm_completed: payload.pm_completed,
        skin_reaction: payload.skin_reaction,
        reaction_notes: payload.reaction_notes,
      });
      setStreakSummary(res.summary);
      setSuccessMessage("Daily routine log updated!");
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setError(err.message || "Failed to save daily routine log.");
    } finally {
      setIsSavingLog(false);
    }
  };

  const getAssignedProductForStep = (prefix: "AM" | "PM", stepNum: number) => {
    const slotKey = `${prefix}_${stepNum}`;
    return shelfItems.find((item) => item.assigned_slots.includes(slotKey as any));
  };

  const handleRegenerate = async () => {
    if (!skinProfile) {
      onNavigate("/skin-profile");
      return;
    }

    setRegenerating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const regenerated = await api.generateSkincareRoutine();
      setRoutine(regenerated);
      setSuccessMessage("Your routine has been updated based on your clinical assessment.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to regenerate skincare routine.");
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#5A6D5C] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-[#8C857B] uppercase tracking-wider">
          Loading Personalized Routine...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EAE6DE]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#8C857B] mb-1 font-medium">
            <span>Dermatological Protocols</span>
            <span aria-hidden="true">·</span>
            <span>{skinProfile ? `${skinProfile.skin_type} Skin Profile` : "Customized"}</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2E2C29]">
            Personalized Skincare Plan
          </h1>
          <p className="text-xs text-[#6E685E] mt-1 max-w-2xl leading-relaxed">
            Evidence-based morning, evening, weekly, and seasonal climate protocols tailored for your skin barrier.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="regenerate-routine-btn"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#5A6D5C] text-white hover:bg-[#4A5D4C] shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />
            <span>{regenerating ? "Recalibrating..." : "Recalibrate Plan"}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Profile Missing Warning */}
      {!skinProfile && (
        <div className="bg-white rounded-2xl p-8 text-center border border-[#EAE6DE] max-w-md mx-auto shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-[#E8EFE9] text-[#4A5D4C] flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-lg font-bold text-[#2E2C29] mb-1">Set Up Skin Profile</h3>
          <p className="text-xs text-[#6E685E] mb-5">
            Configure your skin type, concerns, and allergies to generate your personalized routine.
          </p>
          <button
            onClick={() => onNavigate("/skin-profile")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#5A6D5C] text-white hover:bg-[#4A5D4C] cursor-pointer"
          >
            <span>Configure Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {routine && skinProfile && (
        <div className="space-y-6">
          {/* Streamlined Daily Tracker & Safety Strip */}
          <div className="bg-white rounded-2xl border border-[#EAE6DE] p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Quick AM / PM Check-In */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-[#2E2C29] block sm:inline">Today's Protocol:</span>

              <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                todayLog.am_completed ? "bg-[#FAF7F2] border-[#8BA88E] text-[#3E5240]" : "bg-white border-[#EAE6DE] text-[#6E685E]"
              }`}>
                <input
                  type="checkbox"
                  checked={todayLog.am_completed}
                  onChange={(e) => {
                    const updated = { ...todayLog, am_completed: e.target.checked };
                    setTodayLog(updated);
                    handleSaveDailyLog(updated);
                  }}
                  className="rounded text-[#5A6D5C] focus:ring-[#5A6D5C] w-3.5 h-3.5"
                />
                <Sun className="w-3.5 h-3.5 text-amber-600" />
                <span>Morning Completed</span>
              </label>

              <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                todayLog.pm_completed ? "bg-[#F5F7FD] border-[#9AAFD9] text-[#243B6B]" : "bg-white border-[#EAE6DE] text-[#6E685E]"
              }`}>
                <input
                  type="checkbox"
                  checked={todayLog.pm_completed}
                  onChange={(e) => {
                    const updated = { ...todayLog, pm_completed: e.target.checked };
                    setTodayLog(updated);
                    handleSaveDailyLog(updated);
                  }}
                  className="rounded text-[#5A6D5C] focus:ring-[#5A6D5C] w-3.5 h-3.5"
                />
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Evening Completed</span>
              </label>
            </div>

            {/* Right: Streak & Safety Indicators */}
            <div className="flex items-center gap-3 text-xs border-t md:border-t-0 pt-3 md:pt-0 border-[#F2EDE4]">
              {/* Streak */}
              <div className="flex items-center gap-1.5 font-semibold text-amber-700">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>{streakSummary ? `${streakSummary.current_streak_days}d Streak` : "Active Streak"}</span>
              </div>

              <span className="text-[#EAE6DE]">|</span>

              {/* Safety Tag */}
              <div className="flex items-center gap-1 text-[#5A6D5C] font-medium text-xs">
                <ShieldCheck className="w-4 h-4 text-[#5A6D5C]" />
                <span>Allergen Safe</span>
              </div>

              {/* Detailed check-in toggle button */}
              <button
                onClick={() => setShowLogDrawer(!showLogDrawer)}
                className="text-xs text-[#5A6D5C] font-semibold hover:underline cursor-pointer ml-1"
              >
                {showLogDrawer ? "Close Note" : "Log Reaction"}
              </button>
            </div>
          </div>

          {/* Optional Reaction Drawer (Clean & Uncluttered) */}
          {showLogDrawer && (
            <div className="bg-[#FAF8F5] rounded-xl border border-[#EAE6DE] p-4 text-xs space-y-3 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#2E2C29]">Skin Reaction:</span>
                  <select
                    value={todayLog.skin_reaction}
                    onChange={(e) => setTodayLog({ ...todayLog, skin_reaction: e.target.value })}
                    className="p-1.5 bg-white border border-[#EAE6DE] rounded-lg text-xs text-[#2E2C29]"
                  >
                    <option value="Calm & Radiant">Calm & Radiant (Optimal)</option>
                    <option value="Hydrated & Normal">Hydrated & Normal (Well Tolerated)</option>
                    <option value="Mild Tingling">Mild Tingling (Tolerated Active)</option>
                    <option value="Slight Redness">Slight Redness / Warmth</option>
                    <option value="Dryness / Flaking">Dryness / Peeling</option>
                    <option value="Breakout">Breakout Observed</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <input
                    type="text"
                    value={todayLog.reaction_notes}
                    onChange={(e) => setTodayLog({ ...todayLog, reaction_notes: e.target.value })}
                    placeholder="Optional notes: e.g. skin felt smooth, no stinging..."
                    className="flex-1 p-1.5 bg-white border border-[#EAE6DE] rounded-lg text-xs text-[#2E2C29]"
                  />
                  <button
                    onClick={() => {
                      handleSaveDailyLog();
                      setShowLogDrawer(false);
                    }}
                    disabled={isSavingLog}
                    className="px-3 py-1.5 bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                  >
                    {isSavingLog ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Conflict Warning Banner (if conflicts exist) */}
          {conflictReport && conflictReport.has_conflicts && (
            <div className="bg-[#FAF0EE] border border-[#E8D2CC] rounded-xl p-4 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-[#B85D52]">
                  <AlertTriangle className="w-4 h-4 text-[#B85D52]" />
                  <span>Routine Active Conflict Detected ({conflictReport.conflict_count} issues)</span>
                </div>
                <button
                  onClick={() => onNavigate("/products")}
                  className="font-semibold text-[#B85D52] hover:underline"
                >
                  Manage Shelf Products →
                </button>
              </div>
              {conflictReport.conflicts.map((c, i) => (
                <p key={i} className="text-[#6E3C36] pl-6">
                  <strong>{c.slot}:</strong> {c.description} — {c.clinical_recommendation}
                </p>
              ))}
            </div>
          )}

          {/* Routine Tabs Segmented Control */}
          <div className="flex items-center p-1 bg-[#F5F2EB] rounded-xl self-start overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab("am")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "am"
                  ? "bg-white text-[#2E2C29] shadow-2xs"
                  : "text-[#6E685E] hover:text-[#2E2C29]"
              }`}
            >
              <Sun className={`w-3.5 h-3.5 ${activeTab === "am" ? "text-amber-600" : "text-[#8C857B]"}`} />
              <span>Morning Routine (AM)</span>
            </button>

            <button
              onClick={() => setActiveTab("pm")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "pm"
                  ? "bg-white text-[#2E2C29] shadow-2xs"
                  : "text-[#6E685E] hover:text-[#2E2C29]"
              }`}
            >
              <Moon className={`w-3.5 h-3.5 ${activeTab === "pm" ? "text-indigo-600" : "text-[#8C857B]"}`} />
              <span>Evening Routine (PM)</span>
            </button>

            <button
              onClick={() => setActiveTab("seasonal")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "seasonal"
                  ? "bg-white text-[#2E2C29] shadow-2xs"
                  : "text-[#6E685E] hover:text-[#2E2C29]"
              }`}
            >
              <Compass className={`w-3.5 h-3.5 ${activeTab === "seasonal" ? "text-amber-700" : "text-[#8C857B]"}`} />
              <span>Seasonal Climate Protocol</span>
            </button>

            <button
              onClick={() => setActiveTab("weekly")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "weekly"
                  ? "bg-white text-[#2E2C29] shadow-2xs"
                  : "text-[#6E685E] hover:text-[#2E2C29]"
              }`}
            >
              <Calendar className={`w-3.5 h-3.5 ${activeTab === "weekly" ? "text-teal-700" : "text-[#8C857B]"}`} />
              <span>Weekly Treatments</span>
            </button>
          </div>

          {/* VIEW 1: Morning Routine */}
          {activeTab === "am" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#8C857B] pb-1">
                <span>4 Steps · Defend, hydrate, and shield the skin barrier</span>
                <span className="font-semibold text-[#5A6D5C]">AM Protocol</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {routine.morning_routine.map((step) => {
                  const assignedProduct = getAssignedProductForStep("AM", step.step_number);
                  return (
                    <div
                      key={step.step_number}
                      className="bg-white rounded-xl border border-[#EAE6DE] p-5 shadow-2xs space-y-3 flex flex-col justify-between hover:border-[#8BA88E] transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-serif font-bold text-[#8C857B] text-sm">Step 0{step.step_number}</span>
                          <span className="font-semibold uppercase tracking-wider text-amber-800 text-[10px]">
                            {step.category}
                          </span>
                        </div>

                        <h3 className="font-serif font-bold text-base text-[#2E2C29]">{step.name}</h3>

                        <p className="text-xs text-[#6E685E] leading-relaxed">{step.purpose}</p>

                        <div className="text-[11px] text-[#8C857B] pt-1">
                          Actives: <span className="text-[#2E2C29] font-medium">{step.key_ingredients.join(", ")}</span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#EAE6DE] text-[11px] text-[#555048] leading-relaxed">
                          <strong>Ritual:</strong> {step.instructions}
                        </div>
                      </div>

                      {/* Shelf Product Assignment Bar */}
                      <div className="pt-3 border-t border-[#F2EDE4] flex items-center justify-between text-xs">
                        <span className="text-[#8C857B] text-[11px]">Assigned Shelf:</span>
                        {assignedProduct ? (
                          <span className="font-semibold text-[#5A6D5C] truncate max-w-[180px]">
                            {assignedProduct.custom_product_name}
                          </span>
                        ) : (
                          <button
                            onClick={() => onNavigate("/products")}
                            className="text-[#5A6D5C] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>Assign from Shelf</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: Evening Routine */}
          {activeTab === "pm" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#8C857B] pb-1">
                <span>4 Steps · Deep cleanse, cellular repair, and barrier recovery</span>
                <span className="font-semibold text-indigo-700">PM Protocol</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {routine.evening_routine.map((step) => {
                  const assignedProduct = getAssignedProductForStep("PM", step.step_number);
                  return (
                    <div
                      key={step.step_number}
                      className="bg-white rounded-xl border border-[#EAE6DE] p-5 shadow-2xs space-y-3 flex flex-col justify-between hover:border-[#8BA88E] transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-serif font-bold text-[#8C857B] text-sm">Step 0{step.step_number}</span>
                          <span className="font-semibold uppercase tracking-wider text-indigo-700 text-[10px]">
                            {step.category}
                          </span>
                        </div>

                        <h3 className="font-serif font-bold text-base text-[#2E2C29]">{step.name}</h3>

                        <p className="text-xs text-[#6E685E] leading-relaxed">{step.purpose}</p>

                        <div className="text-[11px] text-[#8C857B] pt-1">
                          Actives: <span className="text-[#2E2C29] font-medium">{step.key_ingredients.join(", ")}</span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#EAE6DE] text-[11px] text-[#555048] leading-relaxed">
                          <strong>Ritual:</strong> {step.instructions}
                        </div>
                      </div>

                      {/* Shelf Product Assignment Bar */}
                      <div className="pt-3 border-t border-[#F2EDE4] flex items-center justify-between text-xs">
                        <span className="text-[#8C857B] text-[11px]">Assigned Shelf:</span>
                        {assignedProduct ? (
                          <span className="font-semibold text-[#5A6D5C] truncate max-w-[180px]">
                            {assignedProduct.custom_product_name}
                          </span>
                        ) : (
                          <button
                            onClick={() => onNavigate("/products")}
                            className="text-[#5A6D5C] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>Assign from Shelf</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 3: Seasonal Climate Routine */}
          {activeTab === "seasonal" && (
            <SeasonalRoutineView
              skinProfile={skinProfile}
              onNavigate={onNavigate}
              onProductAddedToShelf={loadData}
            />
          )}

          {/* VIEW 4: Weekly Treatments */}
          {activeTab === "weekly" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#8C857B] pb-1">
                <span>Targeted Weekly Treatments · Exfoliation & Deep Moisture Infusion</span>
                <span className="font-semibold text-teal-800">Weekly Protocol</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {routine.weekly_treatments.map((treatment, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl border border-[#EAE6DE] p-5 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-teal-800">{treatment.category}</span>
                      <span className="text-[#8C857B] font-medium">{treatment.frequency}</span>
                    </div>

                    <h3 className="font-serif font-bold text-base text-[#2E2C29]">{treatment.name}</h3>

                    <p className="text-xs text-[#6E685E] leading-relaxed">{treatment.instructions}</p>

                    {treatment.cautions && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                        <strong>Clinical Caution:</strong> {treatment.cautions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quiet Clinical Recommendations Footer Strip */}
          <div className="bg-[#FAF8F5] rounded-xl border border-[#EAE6DE] p-5 text-xs space-y-3">
            <div className="flex items-center gap-2 text-[#2E2C29] font-bold">
              <Info className="w-4 h-4 text-[#5A6D5C]" />
              <span className="font-serif text-sm">Dermatological Guidance</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#6E685E]">
              {routine.recommendations.slice(0, 4).map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#5A6D5C] shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
