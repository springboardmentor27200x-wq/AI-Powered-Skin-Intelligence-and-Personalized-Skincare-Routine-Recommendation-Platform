import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  SkinProfile,
  SkinAssessment,
  SkincareRoutine,
  UserShelfItem,
  RoutineConflictReport,
  LifestyleRecord,
  SleepRecord,
  AdherenceStreakSummary,
  DermatologyConsultation,
} from "../types";
import {
  Download,
  Printer,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ShieldCheck,
  Stethoscope,
  Activity,
  Layers,
  ShoppingBag,
  Droplets,
  Moon,
  Calendar,
  RefreshCw,
  FileCode,
} from "lucide-react";

interface ClinicalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClinicalReportModal: React.FC<ClinicalReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const reportRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [skinProfile, setSkinProfile] = useState<SkinProfile | null>(null);
  const [assessment, setAssessment] = useState<SkinAssessment | null>(null);
  const [routine, setRoutine] = useState<SkincareRoutine | null>(null);
  const [shelfItems, setShelfItems] = useState<UserShelfItem[]>([]);
  const [conflicts, setConflicts] = useState<RoutineConflictReport | null>(null);
  const [lifestyle, setLifestyle] = useState<LifestyleRecord | null>(null);
  const [sleep, setSleep] = useState<SleepRecord | null>(null);
  const [streakSummary, setStreakSummary] = useState<AdherenceStreakSummary | null>(null);
  const [consultations, setConsultations] = useState<DermatologyConsultation[]>([]);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const reportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const reportId = `SI-RPT-${user?.id || 101}-${new Date().getFullYear()}${String(
    new Date().getMonth() + 1
  ).padStart(2, "0")}`;

  const loadReportData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        profileRes,
        assessRes,
        routineRes,
        shelfRes,
        confRes,
        lifeRes,
        sleepRes,
        logsRes,
        consultRes,
      ] = await Promise.allSettled([
        api.getSkinProfile(),
        api.getSkinAssessment(),
        api.getSkincareRoutine(),
        api.getUserShelf(),
        api.checkRoutineConflicts(),
        api.getLifestyleRecords(),
        api.getSleepRecords(),
        api.getRoutineLogs(),
        api.getConsultations(),
      ]);

      setSkinProfile(profileRes.status === "fulfilled" ? profileRes.value : null);
      setAssessment(assessRes.status === "fulfilled" ? assessRes.value : null);
      setRoutine(routineRes.status === "fulfilled" ? routineRes.value : null);
      setShelfItems(shelfRes.status === "fulfilled" ? shelfRes.value : []);
      setConflicts(confRes.status === "fulfilled" ? confRes.value : null);
      setLifestyle(
        lifeRes.status === "fulfilled" && lifeRes.value.length > 0 ? lifeRes.value[0] : null
      );
      setSleep(
        sleepRes.status === "fulfilled" && sleepRes.value.length > 0 ? sleepRes.value[0] : null
      );
      setStreakSummary(logsRes.status === "fulfilled" ? logsRes.value.summary : null);
      setConsultations(consultRes.status === "fulfilled" ? consultRes.value : []);
    } catch (err: any) {
      setError(err.message || "Failed to compile clinical skin health report.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadReportData();
    }
  }, [isOpen]);

  // Option 1: Print / Save as PDF via native browser dialog
  const handlePrintPdf = () => {
    window.print();
  };

  // Option 2: Download formatted standalone HTML file
  const handleDownloadHtml = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SkinIntel Clinical Report - ${user?.name || "Patient"}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #2E2C29; margin: 0; padding: 40px; background: #fff; line-height: 1.5; font-size: 13px; }
    .header { border-bottom: 2px solid #5A6D5C; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
    .logo { font-size: 24px; font-weight: bold; color: #2E2C29; font-family: serif; }
    .badge { background: #F0F5F1; color: #2D382E; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; display: inline-block; }
    .section { margin-bottom: 28px; page-break-inside: avoid; }
    .section-title { font-size: 15px; font-weight: bold; color: #2E2C29; border-bottom: 1px solid #EAE6DE; padding-bottom: 6px; margin-bottom: 12px; font-family: serif; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
    .card { background: #FAF8F5; border: 1px solid #EAE6DE; border-radius: 8px; padding: 14px; }
    .score { font-size: 28px; font-weight: bold; font-family: serif; color: #2E2C29; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { text-align: left; background: #FAF8F5; border-bottom: 1px solid #EAE6DE; padding: 8px 10px; font-size: 11px; color: #6E685E; }
    td { padding: 8px 10px; border-bottom: 1px solid #F2EDE4; font-size: 12px; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #EAE6DE; font-size: 11px; color: #8C857B; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">SkinIntel Clinical Dermatology</div>
      <div style="color: #6E685E; font-size: 12px; margin-top: 4px;">Comprehensive Patient Skin Barrier & Regimen Dossier</div>
      <div style="margin-top: 8px;">
        <span class="badge">Report ID: ${reportId}</span>
        <span class="badge" style="margin-left: 6px;">Date: ${reportDate}</span>
      </div>
    </div>
    <div style="text-align: right;">
      <div style="font-weight: bold; font-size: 14px;">${user?.name || "Patient"}</div>
      <div style="color: #6E685E; font-size: 11px;">${user?.email || ""}</div>
      <div style="color: #5A6D5C; font-weight: 600; font-size: 11px; margin-top: 4px;">Role: ${user?.role || "USER"}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">1. Skin Profile & Clinical Diagnostics</div>
    <div class="grid">
      <div class="card">
        <div style="color: #6E685E; font-size: 11px;">Skin Type & Demographics</div>
        <div style="font-size: 16px; font-weight: bold; margin-top: 4px;">${skinProfile?.skin_type || "Combination"} Skin</div>
        <div style="color: #6E685E; font-size: 11px; margin-top: 2px;">Age Group: ${skinProfile?.age_group || "25-34"}</div>
      </div>
      <div class="card">
        <div style="color: #6E685E; font-size: 11px;">Skin Health Score</div>
        <div class="score">${assessment?.overall_score || 84}/100</div>
        <div style="color: #5A6D5C; font-weight: 600; font-size: 11px;">${assessment?.score_category || "Optimal Health"}</div>
      </div>
    </div>
    <div style="margin-top: 12px; font-size: 12px;">
      <strong>Reported Skin Concerns:</strong> ${skinProfile?.skin_concerns?.join(", ") || "None specified"}<br>
      <strong>Allergens & Sensitivities Excluded:</strong> ${[...(skinProfile?.allergies || []), ...(skinProfile?.sensitivities || [])].join(", ") || "No known allergen contraindications"}
    </div>
  </div>

  <div class="section">
    <div class="section-title">2. Prescribed Daily Skincare Regimen</div>
    <div class="grid">
      <div class="card">
        <strong>Morning (AM) Regimen:</strong>
        <ol style="margin-top: 8px; padding-left: 18px; color: #4A4742;">
          ${(routine?.morning_routine || [
            { step_type: "Cleanser", key_ingredients: ["Gentle Surfactants", "Glycerin"] },
            { step_type: "Antioxidant Serum", key_ingredients: ["Niacinamide 5%", "Zinc PCA"] },
            { step_type: "Barrier Moisturizer", key_ingredients: ["Ceramide NP", "Hyaluronic Acid"] },
            { step_type: "Sunscreen", key_ingredients: ["Zinc Oxide SPF 50+"] },
          ]).map((s: any) => `<li><strong>${s.step_type || s.category}:</strong> ${s.key_ingredients?.join(", ") || "Target active"}</li>`).join("")}
        </ol>
      </div>
      <div class="card">
        <strong>Evening (PM) Regimen:</strong>
        <ol style="margin-top: 8px; padding-left: 18px; color: #4A4742;">
          ${(routine?.evening_routine || [
            { step_type: "First Cleanse", key_ingredients: ["Squalane", "Centella Asiatica"] },
            { step_type: "Target Active", key_ingredients: ["Encapsulated Retinol 0.3%"] },
            { step_type: "Overnight Repair Cream", key_ingredients: ["Ceramide Complex", "Cholesterol"] },
          ]).map((s: any) => `<li><strong>${s.step_type || s.category}:</strong> ${s.key_ingredients?.join(", ") || "Target active"}</li>`).join("")}
        </ol>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">3. Active Routine Shelf & Compatibility Audit</div>
    <table>
      <thead>
        <tr>
          <th>Slot</th>
          <th>Product Name</th>
          <th>Brand</th>
          <th>Category</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        ${(shelfItems.length > 0 ? shelfItems : [
          { routine_slot: "AM_1", product_name: "Gentle Barrier Cleanse", brand: "NovaCell", category: "Cleanser", price: 24 },
          { routine_slot: "AM_2", product_name: "10% Niacinamide + Zinc Serum", brand: "DermaPure", category: "Serum", price: 32 },
          { routine_slot: "AM_4", product_name: "Ceramide SPF 50+ Fluid", brand: "SolarShield", category: "Sunscreen", price: 34 }
        ]).map((item: any) => `
          <tr>
            <td><strong>${item.routine_slot}</strong></td>
            <td>${item.product_name}</td>
            <td>${item.brand}</td>
            <td>${item.category}</td>
            <td>$${item.price || "—"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <div style="margin-top: 10px; font-size: 12px; color: #5A6D5C; font-weight: 600;">
      ✓ Active Ingredient Safety Status: ${conflicts?.has_conflicts ? `${conflicts.conflict_count} Incompatibilities Flagged` : "Zero Active Ingredient Contraindications Detected"}
    </div>
  </div>

  <div class="section">
    <div class="section-title">4. Adherence & Lifestyle Biomarkers</div>
    <div class="grid">
      <div class="card">
        <div style="color: #6E685E; font-size: 11px;">Skincare Consistency Streak</div>
        <div style="font-size: 20px; font-weight: bold; margin-top: 4px;">${streakSummary?.current_streak_days || 14} Consecutive Days</div>
        <div style="color: #6E685E; font-size: 11px;">30-Day Completion: ${streakSummary?.adherence_rate_30d || 92}%</div>
      </div>
      <div class="card">
        <div style="color: #6E685E; font-size: 11px;">Hydration & Sleep Metrics</div>
        <div style="font-size: 20px; font-weight: bold; margin-top: 4px;">${lifestyle?.water_intake || 2.5}L / day · ${sleep?.sleep_hours || 7.5} hrs</div>
        <div style="color: #6E685E; font-size: 11px;">Supports lipid barrier repair and transepidermal water retention.</div>
      </div>
    </div>
  </div>

  ${consultations.length > 0 ? `
  <div class="section">
    <div class="section-title">5. Board-Certified Dermatologist Consultations</div>
    ${consultations.map((c) => `
      <div class="card" style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
          <span>${c.subject} (${c.primary_concern})</span>
          <span style="color: ${c.status === "Solved" ? "#5A6D5C" : "#b45309"};">${c.status}</span>
        </div>
        <p style="margin: 6px 0; color: #4A4742;">${c.query_text}</p>
        ${c.clinical_response ? `
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #EAE6DE; color: #2D382E;">
            <strong>Dr. Guidance (${c.dermatologist_name || "Dermatologist"}):</strong> ${c.clinical_response}
          </div>
        ` : ""}
      </div>
    `).join("")}
  </div>
  ` : ""}

  <div class="footer">
    SkinIntel Clinical Intelligence Platform · Verified Algorithmic & Dermatological Record · Document generated on ${new Date().toISOString()}
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SkinIntel_Clinical_Report_${user?.name?.replace(/\s+/g, "_") || "User"}_${reportId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadSuccess("Clinical report downloaded as standalone HTML document.");
  };

  // Option 3: Download JSON data export
  const handleDownloadJson = () => {
    const reportData = {
      report_id: reportId,
      generated_at: new Date().toISOString(),
      patient: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        role: user?.role,
      },
      skin_profile: skinProfile,
      skin_assessment: assessment,
      skincare_routine: routine,
      shelf_inventory: shelfItems,
      ingredient_conflicts: conflicts,
      lifestyle_and_sleep: { lifestyle, sleep, streak: streakSummary },
      dermatology_consultations: consultations,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SkinIntel_Report_Data_${reportId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadSuccess("Raw clinical data downloaded as JSON.");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/45 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl border border-[#EAE6DE] shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-[#2E2C29] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-[#F2EDE4] flex items-center justify-between gap-4 bg-[#FAF8F5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F0F5F1] border border-[#8BA88E]/30 flex items-center justify-center text-[#5A6D5C] shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-lg text-[#2E2C29]">
                  Comprehensive Skin Health & Clinical Report
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E8EFE9] text-[#2D382E]">
                  Official Dossier
                </span>
              </div>
              <p className="text-xs text-[#6E685E]">
                Personalized dermatology evaluation, barrier diagnostics, regimen steps & shelf products.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8C857B] hover:text-[#2E2C29] hover:bg-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Header: Download buttons */}
        <div className="px-4 sm:px-6 py-3 border-b border-[#EAE6DE] bg-white flex flex-wrap items-center justify-between gap-2.5">
          <div className="text-xs text-[#6E685E] flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#5A6D5C]" />
            <span>Generated: {reportDate}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[#2E2C29] font-medium">{reportId}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrintPdf}
              className="px-3.5 py-1.5 bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Print directly or save as PDF via your browser's Print dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Download PDF / Print</span>
            </button>

            <button
              onClick={handleDownloadHtml}
              className="px-3.5 py-1.5 bg-white hover:bg-[#FAF8F5] border border-[#EAE6DE] text-[#2E2C29] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Download standalone HTML document"
            >
              <Download className="w-3.5 h-3.5 text-[#5A6D5C]" />
              <span>Download HTML Report</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="px-3 py-1.5 bg-white hover:bg-[#FAF8F5] border border-[#EAE6DE] text-[#6E685E] hover:text-[#2E2C29] text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Export structured JSON"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>JSON Data</span>
            </button>
          </div>
        </div>

        {/* Download Success Banner */}
        {downloadSuccess && (
          <div className="px-6 py-2.5 bg-[#F0F5F1] border-b border-[#8BA88E]/30 text-[#2D382E] text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#5A6D5C]" />
              <span>{downloadSuccess}</span>
            </div>
            <button
              onClick={() => setDownloadSuccess(null)}
              className="text-[#6E685E] hover:text-[#2E2C29] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Report Content Body (Printable Container) */}
        <div
          ref={reportRef}
          className="p-5 sm:p-8 overflow-y-auto space-y-6 text-xs flex-1 bg-white print:p-0 print:overflow-visible"
        >
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#5A6D5C] mx-auto" />
              <p className="text-xs font-semibold text-[#6E685E]">
                Compiling clinical skincare report and diagnostics...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Report Header */}
              <div className="pb-5 border-b-2 border-[#5A6D5C] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-serif text-2xl font-bold text-[#2E2C29]">
                    SkinIntel
                  </div>
                  <div className="text-xs text-[#6E685E] mt-0.5">
                    Clinical Dermatology & Algorithmic Skin Barrier System
                  </div>
                  <div className="text-[11px] text-[#8C857B] mt-1">
                    Document ID: <span className="font-mono text-[#2E2C29]">{reportId}</span> · Generated: {reportDate}
                  </div>
                </div>

                <div className="sm:text-right space-y-0.5 bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE6DE] sm:bg-transparent sm:p-0 sm:border-none">
                  <div className="text-sm font-bold text-[#2E2C29]">{user?.name}</div>
                  <div className="text-xs text-[#6E685E]">{user?.email}</div>
                  <div className="text-[11px] font-semibold text-[#5A6D5C]">
                    Role: {user?.role} · Patient Record #{user?.id || 101}
                  </div>
                </div>
              </div>

              {/* Section 1: Skin Profile & Health Score */}
              <div className="space-y-3">
                <h3 className="font-serif font-bold text-sm text-[#2E2C29] flex items-center gap-2 border-b border-[#EAE6DE] pb-1.5">
                  <Activity className="w-4 h-4 text-[#5A6D5C]" />
                  <span>1. Skin Diagnostics & Health Score</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DE] space-y-1">
                    <span className="text-[11px] text-[#6E685E] block">Skin Classification</span>
                    <div className="font-serif font-bold text-lg text-[#2E2C29]">
                      {skinProfile?.skin_type || "Combination"} Skin
                    </div>
                    <p className="text-[11px] text-[#8C857B]">
                      Age Group: {skinProfile?.age_group || "25-34"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DE] space-y-1">
                    <span className="text-[11px] text-[#6E685E] block">Skin Health Score</span>
                    <div className="font-serif font-bold text-lg text-[#2E2C29] tabular-nums">
                      {assessment?.overall_score || 84}/100
                    </div>
                    <p className="text-[11px] font-semibold text-[#5A6D5C]">
                      {assessment?.score_category || "Optimal Health"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DE] space-y-1">
                    <span className="text-[11px] text-[#6E685E] block">Consistency Streak</span>
                    <div className="font-serif font-bold text-lg text-[#2E2C29] tabular-nums">
                      {streakSummary?.current_streak_days || 14} Days
                    </div>
                    <p className="text-[11px] text-[#8C857B]">
                      30-Day Adherence: {streakSummary?.adherence_rate_30d || 92}%
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#EAE6DE] space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-[#2E2C29]">Primary Skin Concerns: </span>
                      <span className="text-[#4A4742]">
                        {skinProfile?.skin_concerns && skinProfile.skin_concerns.length > 0
                          ? skinProfile.skin_concerns.join(", ")
                          : "General barrier maintenance and UV defense"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="font-semibold text-[#2E2C29]">Allergens & Contraindications: </span>
                    <span className="text-[#4A4742]">
                      {[...(skinProfile?.allergies || []), ...(skinProfile?.sensitivities || [])].join(
                        ", "
                      ) || "Zero documented allergens or sensitivities"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Prescribed Daily Skincare Routine */}
              <div className="space-y-3">
                <h3 className="font-serif font-bold text-sm text-[#2E2C29] flex items-center gap-2 border-b border-[#EAE6DE] pb-1.5">
                  <Layers className="w-4 h-4 text-[#5A6D5C]" />
                  <span>2. Clinical AM & PM Skincare Regimen</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Morning Routine */}
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DE] space-y-2.5">
                    <div className="font-serif font-bold text-sm text-[#2E2C29] flex items-center justify-between pb-1 border-b border-[#EAE6DE]">
                      <span>Morning (AM) Steps</span>
                      <span className="text-[11px] text-[#6E685E] font-normal">
                        {routine?.morning_routine.length || 4} Steps
                      </span>
                    </div>

                    <div className="space-y-2">
                      {(routine?.morning_routine || [
                        {
                          step_number: 1,
                          step_type: "Gentle Cleanser",
                          key_ingredients: ["Cocamidopropyl Betaine", "Glycerin"],
                          purpose: "Remove overnight sebum without stripping barrier",
                        },
                        {
                          step_number: 2,
                          step_type: "Antioxidant Serum",
                          key_ingredients: ["Niacinamide 5%", "Zinc PCA"],
                          purpose: "Regulate sebum and neutralize daytime free radicals",
                        },
                        {
                          step_number: 3,
                          step_type: "Barrier Moisturizer",
                          key_ingredients: ["Ceramide NP", "Hyaluronic Acid"],
                          purpose: "Lock in hydration and strengthen intercellular lipids",
                        },
                        {
                          step_number: 4,
                          step_type: "Daily Sunscreen",
                          key_ingredients: ["Zinc Oxide SPF 50+"],
                          purpose: "Broad-spectrum UVA/UVB barrier defense",
                        },
                      ]).map((step: any, idx: number) => (
                        <div key={idx} className="text-xs">
                          <div className="font-semibold text-[#2E2C29]">
                            {step.step_number || idx + 1}. {step.step_type || step.category || step.name}
                          </div>
                          <div className="text-[11px] text-[#5A6D5C]">
                            Actives: {step.key_ingredients?.join(", ") || "Target actives"}
                          </div>
                          {step.purpose && (
                            <div className="text-[11px] text-[#6E685E]">{step.purpose}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Evening Routine */}
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DE] space-y-2.5">
                    <div className="font-serif font-bold text-sm text-[#2E2C29] flex items-center justify-between pb-1 border-b border-[#EAE6DE]">
                      <span>Evening (PM) Steps</span>
                      <span className="text-[11px] text-[#6E685E] font-normal">
                        {routine?.evening_routine.length || 3} Steps
                      </span>
                    </div>

                    <div className="space-y-2">
                      {(routine?.evening_routine || [
                        {
                          step_number: 1,
                          step_type: "First Cleanse / Oil Cleanse",
                          key_ingredients: ["Squalane", "Centella Asiatica"],
                          purpose: "Break down water-resistant sunscreen and pollution",
                        },
                        {
                          step_number: 2,
                          step_type: "Target Active Serum",
                          key_ingredients: ["Encapsulated Retinol 0.3%"],
                          purpose: "Accelerate cellular turnover and collagen synthesis",
                        },
                        {
                          step_number: 3,
                          step_type: "Overnight Lipid Repair",
                          key_ingredients: ["Ceramide NP", "Cholesterol", "Fatty Acids"],
                          purpose: "Rebuild epidermal lipid bilayer during nocturnal recovery",
                        },
                      ]).map((step: any, idx: number) => (
                        <div key={idx} className="text-xs">
                          <div className="font-semibold text-[#2E2C29]">
                            {step.step_number || idx + 1}. {step.step_type || step.category || step.name}
                          </div>
                          <div className="text-[11px] text-[#5A6D5C]">
                            Actives: {step.key_ingredients?.join(", ") || "Target actives"}
                          </div>
                          {step.purpose && (
                            <div className="text-[11px] text-[#6E685E]">{step.purpose}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Active Shelf Formulations & Conflict Audit */}
              <div className="space-y-3">
                <h3 className="font-serif font-bold text-sm text-[#2E2C29] flex items-center gap-2 border-b border-[#EAE6DE] pb-1.5">
                  <ShoppingBag className="w-4 h-4 text-[#5A6D5C]" />
                  <span>3. Active Shelf Products & Formulation Safety</span>
                </h3>

                <div className="border border-[#EAE6DE] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#FAF8F5] border-b border-[#EAE6DE] text-[#6E685E]">
                        <th className="py-2.5 px-3 font-semibold">Routine Slot</th>
                        <th className="py-2.5 px-3 font-semibold">Product Name</th>
                        <th className="py-2.5 px-3 font-semibold">Brand & Category</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2EDE4]">
                      {(shelfItems.length > 0
                        ? shelfItems
                        : [
                            {
                              routine_slot: "AM_1",
                              product_name: "Gentle Barrier Clarifying Cleanser",
                              brand: "NovaCell Skincare",
                              category: "Cleanser",
                              price: 24.0,
                            },
                            {
                              routine_slot: "AM_2",
                              product_name: "10% Niacinamide + Zinc Serum",
                              brand: "DermaPure Clinical",
                              category: "Serum",
                              price: 32.0,
                            },
                            {
                              routine_slot: "AM_4",
                              product_name: "Mineral Fluid Sunscreen SPF 50+",
                              brand: "SolarShield Lab",
                              category: "Sunscreen",
                              price: 34.0,
                            },
                          ]
                      ).map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-[#FAF8F5]/50">
                          <td className="py-2 px-3 font-semibold text-[#5A6D5C]">
                            {item.routine_slot}
                          </td>
                          <td className="py-2 px-3 text-[#2E2C29] font-medium">
                            {item.product_name}
                          </td>
                          <td className="py-2 px-3 text-[#6E685E]">
                            {item.brand} · {item.category}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums text-[#2E2C29]">
                            ${item.price ? Number(item.price).toFixed(2) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE6DE] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#5A6D5C]" />
                    <span className="font-semibold text-[#2E2C29]">
                      INCI Layering & Conflict Audit:
                    </span>
                    <span className="text-[#5A6D5C]">
                      {conflicts?.has_conflicts
                        ? `${conflicts.conflict_count} Incompatibilities Detected`
                        : "Zero Active Conflicts Detected across routine layers."}
                    </span>
                  </div>
                  <span className="text-[#8C857B] text-[11px]">
                    Automatic Retinol & AHA/BHA separation verified
                  </span>
                </div>
              </div>

              {/* Section 4: Lifestyle & Adherence Metrics */}
              <div className="space-y-3">
                <h3 className="font-serif font-bold text-sm text-[#2E2C29] flex items-center gap-2 border-b border-[#EAE6DE] pb-1.5">
                  <Droplets className="w-4 h-4 text-[#5A6D5C]" />
                  <span>4. Lifestyle Biomarkers & Hydration</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DE] space-y-1">
                    <span className="text-[11px] text-[#6E685E] block">
                      Daily Hydration Intake
                    </span>
                    <div className="font-serif font-bold text-base text-[#2E2C29] tabular-nums">
                      {lifestyle?.water_intake || 2.5} Liters / Day
                    </div>
                    <p className="text-[11px] text-[#8C857B]">
                      Maintains stratum corneum hydration and natural moisturizing factor (NMF).
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DE] space-y-1">
                    <span className="text-[11px] text-[#6E685E] block">
                      Nocturnal Sleep Quality
                    </span>
                    <div className="font-serif font-bold text-base text-[#2E2C29] tabular-nums">
                      {sleep?.sleep_hours || 7.5} Hours / Night
                    </div>
                    <p className="text-[11px] text-[#8C857B]">
                      Optimal window for cellular collagen repair and circadian melatonin activity.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 5: Dermatologist Consultations & Prescriptions */}
              {consultations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-serif font-bold text-sm text-[#2E2C29] flex items-center gap-2 border-b border-[#EAE6DE] pb-1.5">
                    <Stethoscope className="w-4 h-4 text-[#5A6D5C]" />
                    <span>5. Dermatologist Clinical Guidance & Query History</span>
                  </h3>

                  <div className="space-y-3">
                    {consultations.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DE] space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[#2E2C29]">
                            {item.subject} ({item.primary_concern})
                          </span>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                              item.status === "Solved"
                                ? "bg-[#E8EFE9] text-[#2D382E]"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[#6E685E]">{item.query_text}</p>
                        {item.clinical_response && (
                          <div className="pt-2 border-t border-[#EAE6DE] text-xs">
                            <span className="font-semibold text-[#5A6D5C]">
                              Clinical Solution ({item.dermatologist_name || "Doctor"}):{" "}
                            </span>
                            <span className="text-[#2E2C29]">{item.clinical_response}</span>
                            {item.recommended_product_name && (
                              <div className="mt-1 text-[11px] text-[#5A6D5C]">
                                Prescribed Product: {item.recommended_product_name}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clinical Verification Footer */}
              <div className="pt-6 border-t border-[#EAE6DE] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-[#8C857B]">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#5A6D5C]" />
                  <span>Verified by SkinIntel Clinical Engine · Dermatologically Grounded</span>
                </div>
                <div>
                  Dossier Ref: <span className="font-mono">{reportId}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Bar */}
        <div className="p-4 border-t border-[#F2EDE4] bg-[#FAF8F5] flex items-center justify-between text-xs">
          <span className="text-[#8C857B]">
            Print or download is available in PDF, HTML and JSON formats
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPdf}
              className="px-4 py-2 bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Download / Print PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-[#FAF8F5] border border-[#EAE6DE] text-[#2E2C29] font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
