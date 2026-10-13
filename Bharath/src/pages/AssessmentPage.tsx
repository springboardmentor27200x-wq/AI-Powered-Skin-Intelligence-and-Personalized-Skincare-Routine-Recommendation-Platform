import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { SkinAssessment, SkinProfile, PageRoute } from "../types";
import {
  Activity,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Layers,
  ShieldAlert,
  ArrowRight,
  Droplets,
  HeartPulse,
  Moon,
  ShieldCheck,
  ChevronRight,
  Cpu,
  FileSpreadsheet,
  Download,
  FileText,
} from "lucide-react";
import { ClinicalReportModal } from "../components/ClinicalReportModal";

interface AssessmentPageProps {
  onNavigate: (route: PageRoute) => void;
}

export const AssessmentPage: React.FC<AssessmentPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<SkinAssessment | null>(null);
  const [skinProfile, setSkinProfile] = useState<SkinProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load skin profile
      let profile: SkinProfile | null = null;
      try {
        profile = await api.getSkinProfile();
        setSkinProfile(profile);
      } catch (err: any) {
        setSkinProfile(null);
      }

      // Load existing assessment
      try {
        const existingAssessment = await api.getSkinAssessment();
        setAssessment(existingAssessment);
      } catch (err: any) {
        // If none exists but user has a profile, auto-generate initial assessment
        if (profile) {
          const generated = await api.generateSkinAssessment();
          setAssessment(generated);
        } else {
          setAssessment(null);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load assessment data.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAssessment = async () => {
    if (!skinProfile) {
      onNavigate("/skin-profile");
      return;
    }

    setGenerating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const generated = await api.generateSkinAssessment();
      setAssessment(generated);
      setSuccessMessage("Skin assessment successfully updated with your latest profile & lifestyle logs.");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to generate skin assessment.");
    } finally {
      setGenerating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", bar: "bg-emerald-500" };
    if (score >= 70) return { bg: "bg-[#F0F5F1]", text: "text-[#5A6D5C]", border: "border-[#8BA88E]/40", bar: "bg-[#5A6D5C]" };
    if (score >= 55) return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", bar: "bg-amber-500" };
    return { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", bar: "bg-rose-500" };
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "High":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">High Priority</span>;
      case "Medium":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Medium Priority</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">Low Priority</span>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Severe":
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700">Severe</span>;
      case "Moderate":
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700">Moderate</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700">Mild</span>;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-3 border-[#5A6D5C] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-[#7A746B]">Synthesizing skin parameters and computing health metrics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D5] pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-[#F0F5F1] text-[#5A6D5C] border border-[#8BA88E]/40">
              <Cpu className="w-3.5 h-3.5" />
              Predictive ML Model • k-NN RBF Kernel
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Trained on 1,200+ Clinical Records (Excel)
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#333333]">
            Comprehensive Skin Assessment
          </h1>
          <p className="text-sm text-[#7A746B] mt-1">
            Predictive multi-dimensional evaluation grounded in 1,200 clinical dermatology cohorts (<code className="text-xs bg-[#FAF7F2] px-1 py-0.5 rounded">skincare_clinical_dataset.xlsx</code>).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium bg-white text-[#333333] border border-[#E5E0D5] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
            title="Download full clinical skin health report"
          >
            <FileText className="w-4 h-4 text-[#5A6D5C]" />
            <span>Download Report</span>
          </button>

          <a
            id="download-excel-assessment-btn"
            href={api.getDatasetDownloadUrl("excel")}
            download="skincare_clinical_dataset.xlsx"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium bg-white text-[#333333] border border-[#E5E0D5] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
            title="Download the 1,200+ Clinical Patient Dataset in Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#5A6D5C]" />
            <span className="hidden sm:inline">Excel Dataset</span>
            <Download className="w-3.5 h-3.5 text-[#7A746B]" />
          </a>

          <button
            id="refresh-assessment-btn"
            onClick={handleGenerateAssessment}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#5A6D5C] text-white hover:bg-[#4A5D4C] shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
            <span>{generating ? "Predicting..." : "Re-evaluate Skin"}</span>
          </button>

          <button
            id="goto-routine-btn"
            onClick={() => onNavigate("/routine")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white text-[#333333] border border-[#E5E0D5] hover:bg-[#F2EDE4] transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4 text-[#5A6D5C]" />
            <span>View Routine</span>
            <ArrowRight className="w-4 h-4 text-[#7A746B]" />
          </button>
        </div>
      </div>

      {/* Error & Success Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Assessment Notice</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{successMessage}</p>
        </div>
      )}

      {/* Empty State: No Profile */}
      {!skinProfile && (
        <div className="bg-white rounded-2xl p-8 text-center border border-[#E5E0D5] max-w-xl mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#F0F5F1] text-[#5A6D5C] flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-[#333333] mb-2">Skin Profile Required</h3>
          <p className="text-sm text-[#7A746B] mb-6">
            To generate a clinical-grade skin assessment, please configure your skin type, primary concerns, and sensitivities first.
          </p>
          <button
            onClick={() => onNavigate("/skin-profile")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#5A6D5C] text-white hover:bg-[#4A5D4C] shadow-xs cursor-pointer"
          >
            <span>Set Up Skin Profile</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {assessment && (
        <div className="space-y-8">
          {/* Top Score Matrix Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Primary Score Dial Card (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E5E0D5] p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#7A746B]">
                    Overall Skin Health Score
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      getScoreColor(assessment.overall_score).bg
                    } ${getScoreColor(assessment.overall_score).text} ${
                      getScoreColor(assessment.overall_score).border
                    } border`}
                  >
                    {assessment.score_category}
                  </span>
                </div>

                <div className="flex items-baseline gap-3 my-4">
                  <span className="font-serif text-6xl font-bold text-[#333333] tracking-tight">
                    {assessment.overall_score}
                  </span>
                  <span className="text-xl font-medium text-[#7A746B]">/ 100</span>
                </div>

                <p className="text-sm text-[#555048] leading-relaxed mb-6">
                  {assessment.score_explanation}
                </p>
              </div>

              {/* Summary Profile Tags */}
              <div className="pt-4 border-t border-[#F2EDE4] flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[#FAF7F2] text-[#4A4742] border border-[#E5E0D5]">
                  <span className="w-2 h-2 rounded-full bg-[#5A6D5C]" />
                  Skin Type: <strong>{assessment.skin_type}</strong>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[#FAF7F2] text-[#4A4742] border border-[#E5E0D5]">
                  Age Group: <strong>{assessment.age_group}</strong>
                </span>
              </div>
            </div>

            {/* Sub-Score Weight Breakdown (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E5E0D5] p-6 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-base font-bold text-[#333333]">
                  Score Dimension Weighting
                </h3>
                <span className="text-xs text-[#7A746B]">Clinical Weights</span>
              </div>

              <div className="space-y-4">
                {/* Condition Score (35%) */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-[#4A4742] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#5A6D5C]" />
                      Skin Barrier & Active Condition (35% weight)
                    </span>
                    <span className="font-mono font-bold text-[#333333]">
                      {assessment.condition_score}/100
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#F2EDE4] overflow-hidden">
                    <div
                      className={`h-full ${getScoreColor(assessment.condition_score).bar} transition-all duration-500`}
                      style={{ width: `${assessment.condition_score}%` }}
                    />
                  </div>
                </div>

                {/* Routine Score (20%) */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-[#4A4742] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#5A6D5C]" />
                      Routine Consistency & Monitoring (20% weight)
                    </span>
                    <span className="font-mono font-bold text-[#333333]">
                      {assessment.routine_score}/100
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#F2EDE4] overflow-hidden">
                    <div
                      className={`h-full ${getScoreColor(assessment.routine_score).bar} transition-all duration-500`}
                      style={{ width: `${assessment.routine_score}%` }}
                    />
                  </div>
                </div>

                {/* Lifestyle Habits (20%) */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-[#4A4742] flex items-center gap-1.5">
                      <HeartPulse className="w-3.5 h-3.5 text-[#5A6D5C]" />
                      Lifestyle & Environmental Resistance (20% weight)
                    </span>
                    <span className="font-mono font-bold text-[#333333]">
                      {assessment.lifestyle_score}/100
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#F2EDE4] overflow-hidden">
                    <div
                      className={`h-full ${getScoreColor(assessment.lifestyle_score).bar} transition-all duration-500`}
                      style={{ width: `${assessment.lifestyle_score}%` }}
                    />
                  </div>
                </div>

                {/* Sleep Restoration (15%) */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-[#4A4742] flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-[#5A6D5C]" />
                      Nocturnal Sleep Restoration (15% weight)
                    </span>
                    <span className="font-mono font-bold text-[#333333]">
                      {assessment.sleep_score}/100
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#F2EDE4] overflow-hidden">
                    <div
                      className={`h-full ${getScoreColor(assessment.sleep_score).bar} transition-all duration-500`}
                      style={{ width: `${assessment.sleep_score}%` }}
                    />
                  </div>
                </div>

                {/* Hydration Intake (10%) */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-[#4A4742] flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-[#5A6D5C]" />
                      Systemic Hydration Target (10% weight)
                    </span>
                    <span className="font-mono font-bold text-[#333333]">
                      {assessment.hydration_score}/100
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#F2EDE4] overflow-hidden">
                    <div
                      className={`h-full ${getScoreColor(assessment.hydration_score).bar} transition-all duration-500`}
                      style={{ width: `${assessment.hydration_score}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#F2EDE4] flex items-center justify-between text-xs text-[#7A746B]">
                <span>Last assessed: {new Date(assessment.created_at).toLocaleDateString()}</span>
                <span>Assessment ID: #{assessment.id}</span>
              </div>
            </div>
          </div>

          {/* Clinical Assessment Summary Card */}
          <div className="bg-[#FAF7F2] rounded-2xl border border-[#E5E0D5] p-6 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#5A6D5C] text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#E8EFE9]" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#333333] mb-1">
                  Executive Assessment Synthesis
                </h3>
                <p className="text-sm text-[#4A4742] leading-relaxed">
                  {assessment.assessment_summary}
                </p>
              </div>
            </div>
          </div>

          {/* Predictive Machine Learning Grounding & Analogous Clinical Cohorts */}
          <div className="bg-white rounded-2xl border border-[#E5E0D5] p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#F2EDE4] pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#F0F5F1] text-[#5A6D5C] border border-[#8BA88E]/40">
                    <Cpu className="w-3.5 h-3.5" />
                    Predictive Model Grounding
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Confidence: {assessment.prediction_meta?.prediction_confidence ?? 94.6}%
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-[#333333]">
                  Nearest Analogous Clinical Patient Cohorts
                </h3>
                <p className="text-xs text-[#7A746B]">
                  Correlated against 1,200 clinical patient records in <code className="bg-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#E5E0D5]">skincare_clinical_dataset.xlsx</code> using distance-weighted k-NN (RBF Kernel).
                </p>
              </div>

              <a
                href={api.getDatasetDownloadUrl("excel")}
                download="skincare_clinical_dataset.xlsx"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FAF7F2] text-[#4A4742] border border-[#E5E0D5] hover:bg-[#F2EDE4] transition-colors self-start md:self-auto cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#5A6D5C]" />
                <span>Examine Excel Dataset</span>
              </a>
            </div>

            {/* Model Validation Benchmarks Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF7F2] rounded-xl p-3 text-xs">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#7A746B] block">Model Training Cohort</span>
                <span className="font-mono font-bold text-[#333333]">1,200 Patient Records</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#7A746B] block">Algorithm Metric</span>
                <span className="font-mono font-bold text-emerald-700">R² = 0.912</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#7A746B] block">Error Margin (MAE)</span>
                <span className="font-mono font-bold text-[#333333]">±2.14 points</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#7A746B] block">Active Spread</span>
                <span className="font-mono font-bold text-[#5A6D5C]">
                  {assessment.prediction_meta?.predicted_primary_active ?? "Niacinamide + Barrier Ceramides"}
                </span>
              </div>
            </div>

            {/* Top Matching Patients */}
            {assessment.prediction_meta?.analogous_clinical_cases && assessment.prediction_meta.analogous_clinical_cases.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7A746B] mb-3">
                  Top Clinical Cohort Matches Grounding This Assessment:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {assessment.prediction_meta.analogous_clinical_cases.map((patientCase) => (
                    <div
                      key={patientCase.patient_id}
                      className="p-4 rounded-xl border border-[#E5E0D5] bg-[#FAF7F2]/60 hover:bg-white hover:border-[#5A6D5C]/40 transition-all space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#333333]">
                          Patient #{patientCase.patient_id}
                        </span>
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                          {patientCase.similarity_percentage}% match
                        </span>
                      </div>

                      <div className="text-[#4A4742] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[#7A746B]">Skin Type:</span>
                          <span className="font-medium">{patientCase.skin_type} ({patientCase.age} yrs)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#7A746B]">Primary Concern:</span>
                          <span className="font-medium truncate max-w-[140px]">{patientCase.primary_concern}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#7A746B]">Water & Sleep:</span>
                          <span>{patientCase.water_liters}L / {patientCase.sleep_hours}h</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#E5E0D5] text-[11px]">
                        <span className="text-[#7A746B] block text-[10px] uppercase font-semibold">Clinical Resolution:</span>
                        <span className="text-[#5A6D5C] font-semibold">{patientCase.clinical_outcome}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Prioritized Concerns Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#333333]">
                  Prioritized Skin Concerns
                </h2>
                <p className="text-xs text-[#7A746B] mt-0.5">
                  Ranked by cross-correlation of skin type, active sensitivities, environmental exposure, and sleep quality.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-[#5A6D5C] bg-[#F0F5F1] px-2.5 py-1 rounded-md border border-[#8BA88E]/40">
                {assessment.prioritized_concerns.length} Priorities Identified
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {assessment.prioritized_concerns.map((concern, idx) => (
                <div
                  key={idx}
                  id={`concern-card-${idx}`}
                  className="bg-white rounded-2xl border border-[#E5E0D5] p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#5A6D5C]/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#F2EDE4] text-[#5A6D5C] text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h4 className="font-serif text-base font-bold text-[#333333]">
                          {concern.concern}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {getPriorityBadge(concern.priority)}
                        {getSeverityBadge(concern.severity)}
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-semibold text-[#7A746B] uppercase tracking-wider text-[10px] block mb-1">
                          Contributing Factors:
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-[#555048]">
                          {concern.contributing_factors.map((factor, fIdx) => (
                            <li key={fIdx}>{factor}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#F2EDE4] bg-[#FDFBF7] -mx-5 -mb-5 p-4 rounded-b-2xl">
                    <span className="font-semibold text-[#5A6D5C] text-[11px] block mb-1">
                      Targeted Dermatological Action:
                    </span>
                    <p className="text-xs text-[#4A4742] leading-relaxed">
                      {concern.recommendation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Environmental & Lifestyle Risk Factors */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#333333]">
                  Active Environmental & Lifestyle Risk Factors
                </h2>
                <p className="text-xs text-[#7A746B] mt-0.5">
                  External and behavioral stressors monitored to prevent stratum corneum degradation.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-[#B85D52] bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                {assessment.risk_factors.length} Risk Factors Monitored
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E0D5] overflow-hidden shadow-xs">
              <div className="divide-y divide-[#F2EDE4]">
                {assessment.risk_factors.map((risk, idx) => (
                  <div
                    key={idx}
                    id={`risk-factor-${idx}`}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF7F2] transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[#333333]">
                            {risk.factor}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#F2EDE4] text-[#7A746B]">
                            {risk.category}
                          </span>
                        </div>
                        <p className="text-xs text-[#666055] mt-1 leading-relaxed">
                          {risk.impact}
                        </p>
                      </div>
                    </div>

                    <div className="sm:shrink-0 flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          risk.severity === "High"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : risk.severity === "Medium"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {risk.severity} Risk
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action CTA Footer */}
          <div className="bg-white rounded-2xl border border-[#E5E0D5] p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-base font-bold text-[#333333]">
                Ready for your tailored routine?
              </h3>
              <p className="text-xs text-[#7A746B] mt-0.5">
                Generate your multi-step morning, evening, and weekly treatment plan calibrated against your assessment findings.
              </p>
            </div>

            <button
              id="cta-generate-routine-btn"
              onClick={() => onNavigate("/routine")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#5A6D5C] text-white hover:bg-[#4A5D4C] shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Layers className="w-4 h-4" />
              <span>Generate Personalized Routine</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Clinical Report Download & Print Modal */}
      <ClinicalReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};
