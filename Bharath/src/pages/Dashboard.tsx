import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  PageRoute,
  SkinProfile,
  LifestyleRecord,
  SleepRecord,
  SkinAssessment,
  SkincareRoutine,
  ProductRecommendation,
  RoutineConflictReport,
  AdherenceStreakSummary,
  DermatologyConsultation,
} from "../types";
import { api } from "../services/api";
import { AdminDashboard } from "./AdminDashboard";
import { DermatologistDashboard } from "./DermatologistDashboard";
import {
  Sparkles,
  HeartPulse,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Sun,
  Moon,
  Layers,
  Activity,
  ShoppingBag,
  Flame,
  Compass,
  ShieldCheck,
  Stethoscope,
  MessageSquarePlus,
  CheckCircle2,
  Clock,
  Download,
  Bell,
} from "lucide-react";
import { ClinicalReportModal } from "../components/ClinicalReportModal";
import { ReminderModal } from "../components/ReminderModal";

interface DashboardProps {
  onNavigate: (route: PageRoute) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  // Display dedicated dashboard based on logged-in role
  if (user?.role === "ADMIN") {
    return <AdminDashboard onNavigate={onNavigate} />;
  }
  if (user?.role === "DERMATOLOGIST") {
    return <DermatologistDashboard onNavigate={onNavigate} />;
  }

  return <UserDashboard onNavigate={onNavigate} />;
};

const UserDashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [skinProfile, setSkinProfile] = useState<SkinProfile | null>(null);
  const [lifestyleRecords, setLifestyleRecords] = useState<LifestyleRecord[]>([]);
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [assessment, setAssessment] = useState<SkinAssessment | null>(null);
  const [routine, setRoutine] = useState<SkincareRoutine | null>(null);

  const [topProduct, setTopProduct] = useState<ProductRecommendation | null>(null);
  const [shelfCount, setShelfCount] = useState<number>(0);
  const [conflictReport, setConflictReport] = useState<RoutineConflictReport | null>(null);
  const [streakSummary, setStreakSummary] = useState<AdherenceStreakSummary | null>(null);
  const [consultations, setConsultations] = useState<DermatologyConsultation[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        profileRes,
        lifeRes,
        sleepRes,
        assessRes,
        routRes,
        recRes,
        shelfRes,
        confRes,
        logRes,
        consultRes,
      ] = await Promise.allSettled([
        api.getSkinProfile(),
        api.getLifestyleRecords(),
        api.getSleepRecords(),
        api.getSkinAssessment(),
        api.getSkincareRoutine(),
        api.getProductRecommendations(),
        api.getUserShelf(),
        api.checkRoutineConflicts(),
        api.getRoutineLogs(),
        api.getConsultations(),
      ]);

      setSkinProfile(profileRes.status === "fulfilled" ? profileRes.value : null);
      setLifestyleRecords(lifeRes.status === "fulfilled" ? lifeRes.value : []);
      setSleepRecords(sleepRes.status === "fulfilled" ? sleepRes.value : []);
      setAssessment(assessRes.status === "fulfilled" ? assessRes.value : null);
      setRoutine(routRes.status === "fulfilled" ? routRes.value : null);
      setTopProduct(
        recRes.status === "fulfilled" ? recRes.value.recommendations?.[0] || null : null
      );
      setShelfCount(shelfRes.status === "fulfilled" ? shelfRes.value.length : 0);
      setConflictReport(confRes.status === "fulfilled" ? confRes.value : null);
      setStreakSummary(logRes.status === "fulfilled" ? logRes.value.summary : null);
      setConsultations(consultRes.status === "fulfilled" ? consultRes.value : []);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const latestLifestyle = lifestyleRecords.length > 0 ? lifestyleRecords[0] : null;
  const latestSleep = sleepRecords.length > 0 ? sleepRecords[0] : null;
  const solvedConsultationsCount = consultations.filter((c) => c.status === "Solved").length;
  const pendingConsultationsCount = consultations.filter((c) => c.status === "Pending").length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Simple User Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EAE6DE]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#6E685E]">
            <span>Personal Skincare Dashboard</span>
            <span aria-hidden="true">·</span>
            <span>{skinProfile ? `${skinProfile.skin_type} Skin` : "Member Account"}</span>
            {streakSummary && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-amber-700 font-semibold tabular-nums">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  {streakSummary.current_streak_days}-Day Streak
                </span>
              </>
            )}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2E2C29]">
            Welcome, {user?.name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-xs text-[#6E685E]">
            Your essential daily skin health score, personalized routine, matched products, and dermatologist consultations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onNavigate("/consultations")}
            className="px-4 py-2 bg-[#2E2C29] hover:bg-[#1E1C1A] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Stethoscope className="w-3.5 h-3.5 text-[#A3C1A6]" />
            <span>Consult Dermatologist</span>
          </button>

          <button
            onClick={() => onNavigate("/routine")}
            className="px-4 py-2 bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Open My Routine</span>
          </button>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-[#FAF8F5] border border-[#EAE6DE] text-[#2E2C29] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            title="Download your comprehensive skin health report"
          >
            <Download className="w-3.5 h-3.5 text-[#5A6D5C]" />
            <span>Download Report</span>
          </button>

          <button
            onClick={() => setIsReminderModalOpen(true)}
            className="p-2 rounded-lg border border-[#EAE6DE] bg-white hover:bg-[#FAF8F5] text-[#6E685E] hover:text-[#2E2C29] transition-colors cursor-pointer relative"
            title="Routine Reminders & Notifications"
          >
            <Bell className="w-3.5 h-3.5 text-[#5A6D5C]" />
            <span className="w-2 h-2 rounded-full bg-amber-600 absolute top-1.5 right-1.5" />
          </button>

          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="p-2 rounded-lg border border-[#EAE6DE] bg-white hover:bg-[#FAF8F5] text-[#6E685E] transition-colors cursor-pointer"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Essential Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Skin Health Score */}
        <button
          onClick={() => onNavigate("/assessment")}
          className="text-left bg-white rounded-xl border border-[#EAE6DE] p-5 hover:border-[#5A6D5C] transition-colors space-y-1 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[#6E685E]">
            <span>Skin Health Score</span>
            <Activity className="w-4 h-4 text-[#5A6D5C]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#2E2C29] tabular-nums">
            {assessment ? `${assessment.overall_score}/100` : "Evaluate"}
          </div>
          <p className="text-xs text-[#5A6D5C] font-medium flex items-center gap-1">
            <span>{assessment ? assessment.score_category : "Run Assessment"}</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </button>

        {/* 2. Skin Profile */}
        <button
          onClick={() => onNavigate("/skin-profile")}
          className="text-left bg-white rounded-xl border border-[#EAE6DE] p-5 hover:border-[#5A6D5C] transition-colors space-y-1 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[#6E685E]">
            <span>Skin Profile</span>
            <Sparkles className="w-4 h-4 text-[#5A6D5C]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#2E2C29] truncate">
            {skinProfile ? skinProfile.skin_type : "Not Set"}
          </div>
          <p className="text-xs text-[#6E685E] flex items-center gap-1">
            <span>
              {skinProfile
                ? `${skinProfile.skin_concerns.length} concerns · ${skinProfile.allergies.length} allergies`
                : "Set up your skin profile"}
            </span>
            <ArrowRight className="w-3 h-3 text-[#5A6D5C] group-hover:translate-x-0.5 transition-transform" />
          </p>
        </button>

        {/* 3. Daily & Seasonal Routine */}
        <button
          onClick={() => onNavigate("/routine")}
          className="text-left bg-white rounded-xl border border-[#EAE6DE] p-5 hover:border-[#5A6D5C] transition-colors space-y-1 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[#6E685E]">
            <span>Active Routine</span>
            <Layers className="w-4 h-4 text-[#5A6D5C]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#2E2C29] tabular-nums">
            {routine
              ? `${routine.morning_routine.length + routine.evening_routine.length} Steps`
              : "8 Steps"}
          </div>
          <p className="text-xs text-[#6E685E] flex items-center gap-1">
            <span>AM, PM, Weekly & Seasonal</span>
            <ArrowRight className="w-3 h-3 text-[#5A6D5C] group-hover:translate-x-0.5 transition-transform" />
          </p>
        </button>

        {/* 4. Water & Sleep Logs */}
        <button
          onClick={() => onNavigate("/lifestyle")}
          className="text-left bg-white rounded-xl border border-[#EAE6DE] p-5 hover:border-[#5A6D5C] transition-colors space-y-1 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[#6E685E]">
            <span>Water & Sleep</span>
            <HeartPulse className="w-4 h-4 text-[#5A6D5C]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#2E2C29] tabular-nums">
            {latestLifestyle ? `${latestLifestyle.water_intake}L` : "2.5L"} ·{" "}
            {latestSleep ? `${latestSleep.sleep_hours}h` : "7.5h"}
          </div>
          <p className="text-xs text-[#6E685E] flex items-center gap-1">
            <span>Update daily lifestyle & sleep</span>
            <ArrowRight className="w-3 h-3 text-[#5A6D5C] group-hover:translate-x-0.5 transition-transform" />
          </p>
        </button>
      </div>

      {/* Two Focused Panels: Today's Routine & Product Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Today's Routine & Seasonal Care (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#EAE6DE] p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2EDE4]">
              <div>
                <h2 className="font-serif font-bold text-base text-[#2E2C29]">
                  Your Skincare Routine
                </h2>
                <p className="text-xs text-[#6E685E]">
                  Morning, evening, and seasonal climate steps
                </p>
              </div>
              <button
                onClick={() => onNavigate("/routine")}
                className="text-xs font-semibold text-[#5A6D5C] hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <span>View Full Routine</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DE] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#2E2C29] flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-600" />
                    Morning (AM)
                  </span>
                  <span className="text-[#8C857B] tabular-nums">
                    {routine ? `${routine.morning_routine.length} steps` : "4 steps"}
                  </span>
                </div>
                <p className="text-xs text-[#6E685E] leading-relaxed">
                  Gentle Cleanser, Antioxidant Serum, Barrier Moisturizer & SPF 50+.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DE] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#2E2C29] flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                    Evening (PM)
                  </span>
                  <span className="text-[#8C857B] tabular-nums">
                    {routine ? `${routine.evening_routine.length} steps` : "4 steps"}
                  </span>
                </div>
                <p className="text-xs text-[#6E685E] leading-relaxed">
                  Cleanse, Targeted Treatment Active & Overnight Ceramide Repair.
                </p>
              </div>
            </div>

            {/* Seasonal Routine Link */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DE] flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-[#5A6D5C] shrink-0" />
                <div>
                  <span className="font-semibold text-[#2E2C29] block">
                    Seasonal Skincare Adaptation
                  </span>
                  <span className="text-[#6E685E]">
                    Switch between Summer, Winter, Spring, Autumn & Monsoon routines.
                  </span>
                </div>
              </div>
              <button
                onClick={() => onNavigate("/routine")}
                className="text-xs font-semibold text-[#5A6D5C] hover:underline whitespace-nowrap cursor-pointer"
              >
                Open Seasonal →
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-[#F2EDE4] flex items-center justify-between text-xs text-[#6E685E]">
            <span className="flex items-center gap-1.5 text-[#5A6D5C] font-medium">
              <ShieldCheck className="w-4 h-4" />
              Allergen & Sensitivity Filter Active
            </span>
            <button
              onClick={() => onNavigate("/skin-profile")}
              className="hover:underline text-[#5A6D5C] font-medium cursor-pointer"
            >
              Edit Allergies
            </button>
          </div>
        </div>

        {/* Right Panel: Product Match & Ingredient Safety (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#EAE6DE] p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2EDE4]">
              <div>
                <h2 className="font-serif font-bold text-base text-[#2E2C29]">
                  Products & Safety
                </h2>
                <p className="text-xs text-[#6E685E]">
                  Matched formulas & shelf conflict check
                </p>
              </div>
              <button
                onClick={() => onNavigate("/products")}
                className="text-xs font-semibold text-[#5A6D5C] hover:underline cursor-pointer whitespace-nowrap"
              >
                My Shelf ({shelfCount})
              </button>
            </div>

            {/* Top Matched Product */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DE] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#5A6D5C]">Top Product Match</span>
                {topProduct && (
                  <span className="font-semibold text-[#2E2C29] tabular-nums">
                    {topProduct.match_score}% Match
                  </span>
                )}
              </div>
              {topProduct ? (
                <div>
                  <span className="text-[11px] text-[#8C857B] block">{topProduct.brand}</span>
                  <h3 className="font-serif font-bold text-sm text-[#2E2C29] line-clamp-1">
                    {topProduct.name}
                  </h3>
                  <p className="text-xs text-[#6E685E] line-clamp-2 mt-0.5">
                    {topProduct.description}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[#8C857B]">
                  Set up your skin profile to see personalized product recommendations.
                </p>
              )}
            </div>

            {/* Shelf Conflict Status */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DE] text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#2E2C29]">Routine Layering Check</span>
                <span className="text-[#8C857B] tabular-nums">{shelfCount} items on shelf</span>
              </div>
              {conflictReport && conflictReport.has_conflicts ? (
                <p className="text-rose-700 font-medium">
                  {conflictReport.conflict_count} active conflict(s) detected on your shelf.
                </p>
              ) : (
                <p className="text-[#5A6D5C] font-medium">
                  No ingredient conflicts detected across your routine.
                </p>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#F2EDE4] flex items-center justify-between text-xs">
            <button
              onClick={() => onNavigate("/products")}
              className="font-semibold text-[#5A6D5C] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Product Matches</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate("/ingredients")}
              className="font-semibold text-[#4A4742] hover:text-[#2E2C29] cursor-pointer"
            >
              INCI Safety Scanner →
            </button>
          </div>
        </div>
      </div>

      {/* Dermatologist Consultation & Clinical Query Panel */}
      <div className="bg-white rounded-xl border border-[#EAE6DE] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F2EDE4]">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#F0F5F1] border border-[#8BA88E]/30 flex items-center justify-center text-[#5A6D5C] shrink-0 mt-0.5">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-base text-[#2E2C29]">
                  Consult a Dermatologist
                </h2>
                <span className="text-[11px] font-semibold text-[#5A6D5C]">
                  {solvedConsultationsCount} Solved · {pendingConsultationsCount} Pending
                </span>
              </div>
              <p className="text-xs text-[#6E685E]">
                Ask a board-certified dermatologist about your skin concerns, active layering, or product reactions.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate("/consultations")}
            className="px-4 py-2 bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>Ask a Dermatologist</span>
          </button>
        </div>

        {consultations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {consultations.slice(0, 2).map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigate("/consultations")}
                className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DE] hover:border-[#5A6D5C] transition-colors cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-[#2E2C29] truncate">
                    {item.subject}
                  </span>
                  {item.status === "Solved" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5A6D5C] shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Solved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      Pending Review
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#6E685E] line-clamp-2">
                  {item.query_text}
                </p>
                {item.status === "Solved" && item.clinical_response && (
                  <div className="pt-2 border-t border-[#EAE6DE] text-xs text-[#2E2C29]">
                    <span className="font-semibold text-[#5A6D5C]">
                      {item.dermatologist_name || "Dermatologist"}:{" "}
                    </span>
                    <span className="line-clamp-2 text-[#4A4742]">
                      {item.clinical_response}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DE] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-[#6E685E]">
              Have a question about retinoid purging, barrier repair, or which product to add to your shelf? Submit a query directly to our dermatology team.
            </div>
            <button
              onClick={() => onNavigate("/consultations")}
              className="text-xs font-semibold text-[#5A6D5C] hover:underline whitespace-nowrap cursor-pointer"
            >
              Submit First Query →
            </button>
          </div>
        )}
      </div>

      {/* Download Clinical Report Modal */}
      <ClinicalReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      {/* Routine Reminders Modal */}
      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
};
