import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  PageRoute,
  AdminUserSummary,
  AdminUserDetail,
  AdminStats,
  CustomAnalysisResult,
  DermatologyConsultation,
  Product,
} from "../types";
import { api } from "../services/api";
import {
  Stethoscope,
  Users,
  Activity,
  Zap,
  FileSpreadsheet,
  Search,
  RefreshCw,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Droplets,
  Moon,
  Sparkles,
  Layers,
  ShieldAlert,
  MessageSquarePlus,
  Clock,
  Send,
  ShoppingBag,
} from "lucide-react";

interface DermatologistDashboardProps {
  onNavigate: (route: PageRoute) => void;
}

export const DermatologistDashboard: React.FC<DermatologistDashboardProps> = ({
  onNavigate,
}) => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<AdminUserSummary[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<AdminUserDetail | null>(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Patient Consultation Queries state
  const [consultations, setConsultations] = useState<DermatologyConsultation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeSolveId, setActiveSolveId] = useState<number | null>(null);
  const [clinicalResponse, setClinicalResponse] = useState("");
  const [recommendedActivesInput, setRecommendedActivesInput] = useState(
    "Ceramide NP, Niacinamide, Panthenol"
  );
  const [recommendedProductId, setRecommendedProductId] = useState<string>("");
  const [isSolvingQuery, setIsSolvingQuery] = useState(false);
  const [solveSuccessMsg, setSolveSuccessMsg] = useState<string | null>(null);

  // Quick INCI Formulation Lab state for Dermatologist
  const [inciInput, setInciInput] = useState(
    "Aqua, Niacinamide, Zinc PCA, Retinol, Glycolic Acid, Ceramide NP, Hyaluronic Acid"
  );
  const [inciResult, setInciResult] = useState<CustomAnalysisResult | null>(null);
  const [isAnalyzingInci, setIsAnalyzingInci] = useState(false);

  const loadClinicalOverview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [usersList, statsData, consultList, prodList] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminStats(),
        api.getConsultations(),
        api.getProducts(),
      ]);
      const patientAccounts = usersList.filter((u) => u.role === "USER");
      setPatients(patientAccounts);
      setStats(statsData);
      setConsultations(consultList);
      setProducts(prodList);

      // Default open first pending query for quick resolution
      const firstPending = consultList.find((c) => c.status === "Pending");
      if (firstPending && activeSolveId === null) {
        setActiveSolveId(firstPending.id);
        setClinicalResponse("");
        setRecommendedActivesInput("Ceramide NP, Niacinamide, Panthenol");
        setRecommendedProductId("");
      }

      // Load first patient with a profile by default for immediate clinical review
      const defaultPatient =
        patientAccounts.find((p) => p.has_profile) || patientAccounts[0];
      if (defaultPatient) {
        handleInspectPatient(defaultPatient.id);
      }
    } catch (err: any) {
      setError(err.message || "Unable to load clinical patient data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClinicalOverview();
    handleAnalyzeInci(
      "Aqua, Niacinamide, Zinc PCA, Retinol, Glycolic Acid, Ceramide NP, Hyaluronic Acid"
    );
  }, []);

  const handleOpenQueryForSolve = (item: DermatologyConsultation) => {
    setActiveSolveId(item.id);
    setClinicalResponse(item.clinical_response || "");
    setRecommendedActivesInput(
      item.recommended_actives && item.recommended_actives.length > 0
        ? item.recommended_actives.join(", ")
        : "Ceramide NP, Niacinamide, Panthenol"
    );
    setRecommendedProductId(
      item.recommended_product_id ? String(item.recommended_product_id) : ""
    );
    setSolveSuccessMsg(null);
  };

  const handleSolvePatientQuery = async (e: React.FormEvent, consultationId: number) => {
    e.preventDefault();
    if (!clinicalResponse.trim()) {
      setError("Please enter a clinical solution before marking the query as solved.");
      return;
    }

    setIsSolvingQuery(true);
    setError(null);
    try {
      const parsedActives = recommendedActivesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const selectedProd = recommendedProductId
        ? products.find((p) => p.id === Number(recommendedProductId))
        : undefined;

      await api.solveConsultation(consultationId, {
        clinical_response: clinicalResponse.trim(),
        recommended_actives: parsedActives,
        recommended_product_id: selectedProd ? selectedProd.id : undefined,
        recommended_product_name: selectedProd
          ? `${selectedProd.brand} — ${selectedProd.name}`
          : undefined,
      });

      const updatedConsultations = await api.getConsultations();
      setConsultations(updatedConsultations);
      setSolveSuccessMsg("Patient query solved and clinical guidance sent to user.");
      const nextPending = updatedConsultations.find((c) => c.status === "Pending");
      setActiveSolveId(nextPending ? nextPending.id : null);
    } catch (err: any) {
      setError(err.message || "Failed to solve patient consultation query.");
    } finally {
      setIsSolvingQuery(false);
    }
  };

  const handleInspectPatient = async (patientId: number) => {
    setIsLoadingPatient(true);
    try {
      const detail = await api.getAdminUserDetail(patientId);
      setSelectedPatient(detail);
    } catch (err: any) {
      setError(err.message || "Failed to load patient clinical dossier.");
    } finally {
      setIsLoadingPatient(false);
    }
  };

  const handleAnalyzeInci = async (textToAnalyze?: string) => {
    const targetText = textToAnalyze ?? inciInput;
    if (!targetText.trim()) return;
    setIsAnalyzingInci(true);
    try {
      const res = await api.analyzeIngredients(targetText);
      setInciResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to analyze INCI formulation.");
    } finally {
      setIsAnalyzingInci(false);
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.skin_type && p.skin_type.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const evaluatedPatients = patients.filter(
    (p) => p.has_assessment && p.assessment_score !== undefined
  );
  const avgHealthScore =
    evaluatedPatients.length > 0
      ? Math.round(
          evaluatedPatients.reduce((sum, p) => sum + (p.assessment_score || 0), 0) /
            evaluatedPatients.length
        )
      : 78;

  const pendingQueriesCount = consultations.filter((c) => c.status === "Pending").length;
  const solvedQueriesCount = consultations.filter((c) => c.status === "Solved").length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Dermatologist Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EAE6DE]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#6E685E]">
            <Stethoscope className="w-3.5 h-3.5 text-[#5A6D5C]" />
            <span>Dermatology Clinical Console</span>
            <span aria-hidden="true">·</span>
            <span>Signed in as {user?.name || "Dermatologist"}</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2E2C29]">
            Dermatologist Dashboard
          </h1>
          <p className="text-xs text-[#6E685E]">
            Solve patient consultation queries, review skin assessments, and manage clinical product formulations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => onNavigate("/consultations")}
            className="px-3.5 py-2 bg-[#2E2C29] hover:bg-[#1E1C1A] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <MessageSquarePlus className="w-3.5 h-3.5 text-[#A3C1A6]" />
            <span>Patient Queries ({pendingQueriesCount} Pending)</span>
          </button>
          <button
            onClick={() => onNavigate("/products")}
            className="px-3.5 py-2 bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Formulations & Shelf</span>
          </button>
          <button
            onClick={() => onNavigate("/ingredients")}
            className="px-3.5 py-2 bg-white hover:bg-[#FAF8F5] text-[#2E2C29] border border-[#EAE6DE] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Zap className="w-3.5 h-3.5 text-[#5A6D5C]" />
            <span>INCI Lab</span>
          </button>
          <button
            onClick={loadClinicalOverview}
            disabled={isLoading}
            className="p-2 rounded-lg border border-[#EAE6DE] bg-white hover:bg-[#FAF8F5] text-[#6E685E] transition-colors cursor-pointer"
            title="Refresh Clinical Data"
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

      {solveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-[#F0F5F1] border border-[#8BA88E]/40 text-[#2D382E] text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#5A6D5C]" />
            <span className="font-medium">{solveSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSolveSuccessMsg(null)}
            className="text-xs font-semibold text-[#5A6D5C] hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4 Essential Dermatologist KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate("/consultations")}
          className="text-left bg-white rounded-xl border border-[#EAE6DE] hover:border-[#5A6D5C] transition-colors p-5 space-y-1 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[#6E685E]">
            <span>Patient Queries</span>
            <MessageSquarePlus className="w-4 h-4 text-[#5A6D5C]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#2E2C29] tabular-nums">
            {pendingQueriesCount} Pending
          </div>
          <p className="text-xs text-[#5A6D5C] font-medium flex items-center gap-1">
            <span>{solvedQueriesCount} solved · Review & solve</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </button>

        <div className="bg-white rounded-xl border border-[#EAE6DE] p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#6E685E]">
            <span>Patient Cases</span>
            <Users className="w-4 h-4 text-[#5A6D5C]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#2E2C29] tabular-nums">
            {patients.length} Patients
          </div>
          <p className="text-xs text-[#8C857B]">
            {patients.filter((p) => p.has_profile).length} with active skin profiles
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#EAE6DE] p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#6E685E]">
            <span>Mean Skin Health Score</span>
            <Activity className="w-4 h-4 text-[#5A6D5C]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#2E2C29] tabular-nums">
            {avgHealthScore} / 100
          </div>
          <p className="text-xs text-[#8C857B]">
            Across {evaluatedPatients.length} evaluated patient cases
          </p>
        </div>

        <button
          onClick={() => onNavigate("/products")}
          className="text-left bg-white rounded-xl border border-[#EAE6DE] hover:border-[#5A6D5C] transition-colors p-5 space-y-1 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[#6E685E]">
            <span>Clinical Formulations</span>
            <ShoppingBag className="w-4 h-4 text-[#5A6D5C]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#2E2C29] tabular-nums">
            {products.length} Products
          </div>
          <p className="text-xs text-[#5A6D5C] font-medium flex items-center gap-1">
            <span>Add or prescribe products</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </button>
      </div>

      {/* Patient Consultation Queries & Resolution Panel */}
      <div className="bg-white rounded-xl border border-[#EAE6DE] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EAE6DE]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-base text-[#2E2C29]">
                User Consultation Queries & Clinical Resolution
              </h2>
              <span className="text-xs font-semibold text-amber-700">
                {pendingQueriesCount} Awaiting Resolution
              </span>
            </div>
            <p className="text-xs text-[#6E685E]">
              Review user skin questions, prescribe targeted active ingredients or products, and solve their queries.
            </p>
          </div>
          <button
            onClick={() => onNavigate("/consultations")}
            className="text-xs font-semibold text-[#5A6D5C] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto whitespace-nowrap"
          >
            <span>Open Full Consultation Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {consultations.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DE] text-xs text-[#6E685E]">
            No user consultation queries submitted yet.
          </div>
        ) : (
          <div className="space-y-3">
            {consultations.slice(0, 4).map((item) => {
              const isSolvingThis = activeSolveId === item.id;
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 transition-colors space-y-3 ${
                    item.status === "Pending"
                      ? "bg-[#FAF8F5] border-amber-300/80"
                      : "bg-white border-[#EAE6DE]"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-[#2E2C29]">
                          {item.user_name}
                        </span>
                        <span className="text-[#8C857B]">·</span>
                        <span className="text-[#5A6D5C] font-medium">
                          {item.skin_type || "Profile"} Skin
                        </span>
                        <span className="text-[#8C857B]">·</span>
                        <span className="text-[#6E685E]">
                          Concern: {item.primary_concern}
                        </span>
                        <span className="text-[#8C857B]">·</span>
                        <span
                          className={`font-semibold ${
                            item.urgency === "Urgent"
                              ? "text-rose-700"
                              : item.urgency === "Moderate"
                              ? "text-amber-700"
                              : "text-[#6E685E]"
                          }`}
                        >
                          {item.urgency} Priority
                        </span>
                      </div>
                      <h3 className="font-serif font-bold text-sm text-[#2E2C29]">
                        {item.subject}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {item.status === "Solved" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#5A6D5C]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Solved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </span>
                      )}

                      <button
                        onClick={() =>
                          isSolvingThis
                            ? setActiveSolveId(null)
                            : handleOpenQueryForSolve(item)
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          item.status === "Pending"
                            ? "bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white"
                            : "bg-[#FAF8F5] hover:bg-[#F2EDE4] text-[#2E2C29] border border-[#EAE6DE]"
                        }`}
                      >
                        {isSolvingThis
                          ? "Close Form"
                          : item.status === "Pending"
                          ? "Solve Query"
                          : "Edit Solution"}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#4A4742] leading-relaxed">
                    {item.query_text}
                  </p>

                  {item.current_routine_notes && (
                    <div className="text-[11px] text-[#6E685E] bg-white/80 p-2.5 rounded-lg border border-[#EAE6DE]">
                      <span className="font-semibold text-[#2E2C29]">
                        Patient's Current Routine:{" "}
                      </span>
                      {item.current_routine_notes}
                    </div>
                  )}

                  {item.status === "Solved" && !isSolvingThis && item.clinical_response && (
                    <div className="p-3 rounded-lg bg-[#F0F5F1]/70 border border-[#8BA88E]/30 space-y-1 text-xs">
                      <div className="font-semibold text-[#2D382E] flex items-center justify-between">
                        <span>
                          Clinical Resolution by {item.dermatologist_name || "Dermatologist"}
                        </span>
                        {item.recommended_product_name && (
                          <span className="text-[11px] text-[#5A6D5C]">
                            Prescribed: {item.recommended_product_name}
                          </span>
                        )}
                      </div>
                      <p className="text-[#333333] leading-relaxed">
                        {item.clinical_response}
                      </p>
                    </div>
                  )}

                  {isSolvingThis && (
                    <form
                      onSubmit={(e) => handleSolvePatientQuery(e, item.id)}
                      className="pt-3 border-t border-[#EAE6DE] space-y-3 text-xs"
                    >
                      <div>
                        <label className="block font-semibold text-[#2E2C29] mb-1">
                          Dermatologist Clinical Solution & Regimen Instructions *
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={clinicalResponse}
                          onChange={(e) => setClinicalResponse(e.target.value)}
                          placeholder="Provide clear clinical advice, AM/PM layering instructions, and frequency adjustments to solve the patient's query..."
                          className="w-full p-2.5 bg-white border border-[#EAE6DE] rounded-lg text-xs text-[#2E2C29] focus:border-[#5A6D5C] focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-[#2E2C29] mb-1">
                            Recommended Active Ingredients (Comma-separated)
                          </label>
                          <input
                            type="text"
                            value={recommendedActivesInput}
                            onChange={(e) => setRecommendedActivesInput(e.target.value)}
                            placeholder="e.g., Azelaic Acid, Niacinamide, Ceramide NP"
                            className="w-full px-3 py-2 bg-white border border-[#EAE6DE] rounded-lg text-xs text-[#2E2C29] focus:border-[#5A6D5C] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-[#2E2C29] mb-1">
                            Prescribe Product for User's Shelf (Optional)
                          </label>
                          <select
                            value={recommendedProductId}
                            onChange={(e) => setRecommendedProductId(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-[#EAE6DE] rounded-lg text-xs text-[#2E2C29] focus:border-[#5A6D5C] focus:outline-none"
                          >
                            <option value="">— Select clinical product to recommend —</option>
                            {products.map((prod) => (
                              <option key={prod.id} value={prod.id}>
                                {prod.brand} — {prod.name} ({prod.category})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveSolveId(null)}
                          className="px-3 py-1.5 rounded-lg border border-[#EAE6DE] bg-white text-[#6E685E] hover:text-[#2E2C29] font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSolvingQuery}
                          className="px-4 py-1.5 rounded-lg bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>
                            {isSolvingQuery
                              ? "Saving Solution..."
                              : "Submit Clinical Solution"}
                          </span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Clinical Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Patient Cases & Selected Patient Dossier (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Patient Triage Table */}
          <div className="bg-white rounded-xl border border-[#EAE6DE] overflow-hidden">
            <div className="p-5 border-b border-[#EAE6DE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-serif font-bold text-base text-[#2E2C29]">
                  Patient Skin Profiles & Assessments
                </h2>
                <p className="text-xs text-[#6E685E]">
                  Select any patient to inspect their skin barrier score, allergies, and AM/PM routine.
                </p>
              </div>

              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-[#8C857B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patient or skin type..."
                  className="w-full pl-8 pr-3 py-1.5 bg-[#FAF8F5] border border-[#EAE6DE] rounded-lg text-xs text-[#2E2C29] focus:bg-white focus:border-[#5A6D5C] focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#EAE6DE] bg-[#FAF8F5] text-[#6E685E]">
                    <th className="py-3 px-4 font-semibold">Patient</th>
                    <th className="py-3 px-3 font-semibold">Skin Type & Age</th>
                    <th className="py-3 px-3 font-semibold">Concerns & Allergies</th>
                    <th className="py-3 px-3 font-semibold">Health Score</th>
                    <th className="py-3 px-4 font-semibold text-right">Clinical Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EDE4]">
                  {filteredPatients.map((p) => {
                    const isSelected = selectedPatient?.user.id === p.id;
                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors ${
                          isSelected ? "bg-[#F0F5F1]/60" : "hover:bg-[#FAF8F5]"
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#2E2C29]">{p.name}</div>
                          <div className="text-[11px] text-[#8C857B]">{p.email}</div>
                        </td>
                        <td className="py-3 px-3 text-[#4A4742]">
                          {p.has_profile ? (
                            <span>
                              {p.skin_type} · {p.age_group}
                            </span>
                          ) : (
                            <span className="text-[#8C857B]">Pending profile</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-[#6E685E]">
                          {p.has_profile ? (
                            <span>
                              {p.concerns_count} concerns · {p.allergies_count} allergies
                            </span>
                          ) : (
                            <span>—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 tabular-nums">
                          {p.has_assessment && p.assessment_score !== undefined ? (
                            <span className="font-semibold text-[#2E2C29]">
                              {p.assessment_score}/100 ({p.assessment_category})
                            </span>
                          ) : (
                            <span className="text-[#8C857B]">Not assessed</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleInspectPatient(p.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-[#5A6D5C] text-white"
                                : "bg-[#FAF8F5] border border-[#EAE6DE] text-[#2E2C29] hover:border-[#5A6D5C]"
                            }`}
                          >
                            {isSelected ? "Inspecting" : "Inspect Case"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Patient Clinical Dossier */}
          {selectedPatient && (
            <div className="bg-white rounded-xl border border-[#EAE6DE] p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#F2EDE4]">
                <div>
                  <div className="text-xs text-[#5A6D5C] font-semibold">
                    Active Patient Dossier {isLoadingPatient && "(Refreshing...)"}
                  </div>
                  <h3 className="font-serif font-bold text-lg text-[#2E2C29]">
                    {selectedPatient.user.name} ·{" "}
                    {selectedPatient.skin_profile?.skin_type || "No Skin Type Set"} Skin
                  </h3>
                </div>
                <button
                  onClick={() => onNavigate("/admin/users")}
                  className="text-xs font-semibold text-[#5A6D5C] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                >
                  <span>Open Full Patient Records</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {selectedPatient.skin_profile ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#EAE6DE] space-y-1.5">
                    <div className="font-semibold text-[#2E2C29] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#5A6D5C]" />
                      <span>Skin Concerns</span>
                    </div>
                    <p className="text-[#4A4742]">
                      {selectedPatient.skin_profile.skin_concerns.length > 0
                        ? selectedPatient.skin_profile.skin_concerns.join(" · ")
                        : "None reported"}
                    </p>
                    <p className="text-[11px] text-[#8C857B]">
                      Age Group: {selectedPatient.skin_profile.age_group}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#EAE6DE] space-y-1.5">
                    <div className="font-semibold text-[#2E2C29] flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-[#B85D52]" />
                      <span>Allergies & Sensitivities</span>
                    </div>
                    <p className="text-[#4A4742]">
                      {[
                        ...(selectedPatient.skin_profile.allergies || []),
                        ...(selectedPatient.skin_profile.sensitivities || []),
                      ].join(" · ") || "No known allergens"}
                    </p>
                    <p className="text-[11px] text-[#8C857B]">
                      Automatically excluded from routines
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#EAE6DE] space-y-1.5">
                    <div className="font-semibold text-[#2E2C29] flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-[#5A6D5C]" />
                      <span>Hydration & Sleep</span>
                    </div>
                    <p className="text-[#4A4742]">
                      Water: {selectedPatient.lifestyle_records[0]?.water_intake ?? "—"} L/day ·
                      Sleep: {selectedPatient.sleep_records[0]?.sleep_hours ?? "—"} hrs
                    </p>
                    <p className="text-[11px] text-[#8C857B]">
                      Health Score:{" "}
                      {selectedPatient.latest_assessment
                        ? `${selectedPatient.latest_assessment.overall_score}/100 (${selectedPatient.latest_assessment.score_category})`
                        : "Pending"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#8C857B]">
                  This patient has not completed their initial skin profile yet.
                </p>
              )}

              {selectedPatient.latest_routine && (
                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2E2C29]">
                    <Layers className="w-3.5 h-3.5 text-[#5A6D5C]" />
                    <span>
                      Prescribed Regimen ({selectedPatient.latest_routine.morning_routine.length} AM
                      Steps · {selectedPatient.latest_routine.evening_routine.length} PM Steps)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EAE6DE]">
                      <div className="font-semibold text-[#2E2C29] mb-1">Morning (AM)</div>
                      <div className="text-[#6E685E] space-y-1">
                        {selectedPatient.latest_routine.morning_routine.map((s) => (
                          <div key={s.step_number}>
                            {s.step_number}. {s.step_type}:{" "}
                            <span className="text-[#2E2C29] font-medium">{s.key_ingredients[0]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EAE6DE]">
                      <div className="font-semibold text-[#2E2C29] mb-1">Evening (PM)</div>
                      <div className="text-[#6E685E] space-y-1">
                        {selectedPatient.latest_routine.evening_routine.map((s) => (
                          <div key={s.step_number}>
                            {s.step_number}. {s.step_type}:{" "}
                            <span className="text-[#2E2C29] font-medium">{s.key_ingredients[0]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Rapid INCI Conflict & Safety Checker (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-[#EAE6DE] p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-serif font-bold text-base text-[#2E2C29]">
                  Quick INCI Safety Lab
                </h2>
                <Zap className="w-4 h-4 text-[#5A6D5C]" />
              </div>
              <p className="text-xs text-[#6E685E] mt-0.5">
                Test ingredient combinations for active conflicts and comedogenic risk.
              </p>
            </div>

            <div className="space-y-2">
              <textarea
                rows={3}
                value={inciInput}
                onChange={(e) => setInciInput(e.target.value)}
                placeholder="Paste comma-separated INCI ingredients..."
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE6DE] rounded-lg text-xs text-[#2E2C29] focus:bg-white focus:border-[#5A6D5C] focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAnalyzeInci()}
                  disabled={isAnalyzingInci}
                  className="flex-1 py-2 px-3 rounded-lg bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  {isAnalyzingInci ? "Analyzing..." : "Check Formulation Safety"}
                </button>
              </div>
            </div>

            {inciResult && (
              <div className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#EAE6DE] space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#6E685E]">Safety Score</span>
                  <span className="font-serif font-bold text-sm text-[#2E2C29]">
                    {inciResult.safety_score}/100 · {inciResult.comedogenic_risk} Risk
                  </span>
                </div>

                {inciResult.detected_conflicts.length > 0 ? (
                  <div className="space-y-1 text-[#B85D52]">
                    <div className="font-semibold">
                      {inciResult.detected_conflicts.length} Active Conflict(s) Detected:
                    </div>
                    {inciResult.detected_conflicts.map((c, idx) => (
                      <p key={idx} className="text-[11px] leading-snug">
                        • {c.ingredient1} + {c.ingredient2}: {c.reason}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[#5A6D5C] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>No active ingredient conflicts found.</span>
                  </div>
                )}

                {inciResult.detected_synergies.length > 0 && (
                  <div className="text-[11px] text-[#4A4742]">
                    <span className="font-semibold text-[#5A6D5C]">Synergy: </span>
                    {inciResult.detected_synergies[0].ingredient1} +{" "}
                    {inciResult.detected_synergies[0].ingredient2}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => onNavigate("/ingredients")}
              className="w-full py-2 px-3 rounded-lg bg-[#FAF8F5] hover:bg-[#F2EDE4] border border-[#EAE6DE] text-[#2E2C29] text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Open Full Ingredient Encyclopedia</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#5A6D5C]" />
            </button>
          </div>

          <div className="bg-white rounded-xl border border-[#EAE6DE] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-sm text-[#2E2C29]">
                Formulation & Clinical Dataset
              </h3>
              <FileSpreadsheet className="w-4 h-4 text-[#5A6D5C]" />
            </div>
            <p className="text-xs text-[#6E685E] leading-relaxed">
              Review clinical product formulations or explore the 1,200-patient dermatological dataset.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigate("/products")}
                className="py-2 px-3 rounded-lg bg-[#FAF8F5] hover:bg-[#F2EDE4] border border-[#EAE6DE] text-[#2E2C29] text-xs font-semibold text-center cursor-pointer"
              >
                Formulations
              </button>
              <button
                onClick={() => onNavigate("/admin/dataset")}
                className="py-2 px-3 rounded-lg bg-[#FAF8F5] hover:bg-[#F2EDE4] border border-[#EAE6DE] text-[#2E2C29] text-xs font-semibold text-center cursor-pointer"
              >
                1,200 Cases
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
