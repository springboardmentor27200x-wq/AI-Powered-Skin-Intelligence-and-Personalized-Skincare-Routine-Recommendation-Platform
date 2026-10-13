import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  DermatologyConsultation,
  Product,
  PageRoute,
  SkinProfile,
} from "../types";
import {
  Stethoscope,
  MessageSquarePlus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  Send,
  RefreshCw,
  User as UserIcon,
  Plus,
  ArrowRight,
  Layers,
} from "lucide-react";

interface ConsultationsPageProps {
  onNavigate: (route: PageRoute) => void;
}

export const ConsultationsPage: React.FC<ConsultationsPageProps> = ({
  onNavigate,
}) => {
  const { user } = useAuth();
  const isDermatologist =
    user?.role === "DERMATOLOGIST" || user?.role === "ADMIN";

  const [consultations, setConsultations] = useState<DermatologyConsultation[]>(
    []
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [skinProfile, setSkinProfile] = useState<SkinProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // User New Query Form State
  const [subject, setSubject] = useState("");
  const [primaryConcern, setPrimaryConcern] = useState(
    "Acne & Post-Blemish Erythema"
  );
  const [urgency, setUrgency] = useState<"Routine" | "Moderate" | "Urgent">(
    "Routine"
  );
  const [queryText, setQueryText] = useState("");
  const [currentRoutineNotes, setCurrentRoutineNotes] = useState("");

  // Dermatologist Filter & Solve Form State
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Solved">(
    "All"
  );
  const [activeSolveId, setActiveSolveId] = useState<number | null>(null);
  const [clinicalResponse, setClinicalResponse] = useState("");
  const [recommendedActivesInput, setRecommendedActivesInput] = useState(
    "Ceramide NP, Niacinamide, Panthenol"
  );
  const [recommendedProductId, setRecommendedProductId] = useState<string>("");

  const loadConsultationData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [consultList, prodList] = await Promise.all([
        api.getConsultations(),
        api.getProducts(),
      ]);
      setConsultations(consultList);
      setProducts(prodList);

      // Default open first pending query for dermatologist
      if (isDermatologist) {
        const firstPending = consultList.find((c) => c.status === "Pending");
        if (firstPending && activeSolveId === null) {
          openSolvePanel(firstPending);
        }
      } else {
        try {
          const prof = await api.getSkinProfile();
          setSkinProfile(prof);
          if (prof?.skin_concerns?.[0]) {
            setPrimaryConcern(prof.skin_concerns[0]);
          }
        } catch {
          // User may not have a skin profile yet
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load dermatology consultations.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConsultationData();
  }, [user?.role]);

  const openSolvePanel = (item: DermatologyConsultation) => {
    setActiveSolveId(item.id);
    setClinicalResponse(
      item.clinical_response ||
        `Based on your ${item.skin_type || "Combination"} skin profile and ${item.primary_concern.toLowerCase()}, reduce exfoliating frequency to 2 nights per week and buffer with a ceramide-rich barrier moisturizer.`
    );
    setRecommendedActivesInput(
      item.recommended_actives?.length
        ? item.recommended_actives.join(", ")
        : "Ceramide NP, Panthenol, Azelaic Acid"
    );
    setRecommendedProductId(
      item.recommended_product_id ? String(item.recommended_product_id) : "101"
    );
  };

  const handleUserSubmitQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !queryText.trim()) {
      setErrorMsg("Please enter a subject and describe your skin concern.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await api.createConsultation({
        primary_concern: primaryConcern,
        subject: subject.trim(),
        query_text: queryText.trim(),
        current_routine_notes: currentRoutineNotes.trim(),
        urgency,
      });

      setSubject("");
      setQueryText("");
      setCurrentRoutineNotes("");
      setSuccessMsg(
        "Your clinical query has been sent to the Dermatologist! You will see the solution here once reviewed."
      );
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadConsultationData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit consultation query.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDermSolveSubmit = async (
    e: React.FormEvent,
    consultationId: number
  ) => {
    e.preventDefault();
    if (!clinicalResponse.trim()) {
      setErrorMsg("Please enter your clinical solution and recommendation.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const actives = recommendedActivesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await api.solveConsultation(consultationId, {
        clinical_response: clinicalResponse.trim(),
        recommended_actives: actives,
        recommended_product_id: recommendedProductId
          ? Number(recommendedProductId)
          : undefined,
      });

      setSuccessMsg("Patient query solved and clinical prescription sent!");
      setTimeout(() => setSuccessMsg(null), 4000);
      setActiveSolveId(null);
      await loadConsultationData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save clinical response.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddRecommendedToShelf = async (productId: number) => {
    try {
      await api.addToShelf(
        productId,
        ["PM_2"],
        "Prescribed via Dermatologist Consultation"
      );
      setSuccessMsg("Prescribed product added to your Skincare Shelf!");
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not add product to shelf.");
    }
  };

  const pendingCount = consultations.filter(
    (c) => c.status === "Pending"
  ).length;
  const solvedCount = consultations.filter((c) => c.status === "Solved").length;

  const filteredConsultations = consultations.filter((c) => {
    if (statusFilter === "All") return true;
    return c.status === statusFilter;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#EAE6DE] rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#6E685E]">
            <Stethoscope className="w-3.5 h-3.5 text-[#5A6D5C]" />
            <span>
              {isDermatologist
                ? "Clinical Query Resolution Console"
                : "Direct Dermatologist Consultation"}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {pendingCount} Pending · {solvedCount} Solved
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2E2C29]">
            {isDermatologist
              ? "Solve Patient Skincare Queries"
              : "Consult a Dermatologist"}
          </h1>
          <p className="text-xs text-[#6E685E] max-w-2xl">
            {isDermatologist
              ? "Inspect patient questions, review their skin biology and active routines, and prescribe clinical solutions with targeted product recommendations."
              : "Ask a board-certified dermatologist about routine conflicts, stubborn skin concerns, or active ingredient compatibility and receive personalized clinical guidance."}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onNavigate("/products")}
            className="px-3.5 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F2EDE4] border border-[#EAE6DE] text-[#2E2C29] text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#5A6D5C]" />
            <span>Recommendations & Shelf</span>
          </button>
          <button
            onClick={loadConsultationData}
            disabled={isLoading}
            className="p-2 rounded-lg border border-[#EAE6DE] bg-white hover:bg-[#FAF8F5] text-[#6E685E] cursor-pointer"
            title="Refresh Consultations"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="bg-[#F0F5F1] border border-[#8BA88E]/40 text-[#3B4D3D] px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#5A6D5C] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* =========================================================
          VIEW 1: USER SIDE — SUBMIT QUERY & VIEW SOLUTIONS
         ========================================================= */}
      {!isDermatologist && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Ask a Dermatologist Form (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-[#EAE6DE] rounded-2xl p-6 space-y-4">
              <div className="border-b border-[#F2EDE4] pb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#5A6D5C]">
                  <MessageSquarePlus className="w-4 h-4" />
                  <span>New Clinical Consultation</span>
                </div>
                <h2 className="font-serif font-bold text-lg text-[#2E2C29] mt-0.5">
                  Ask a Dermatologist
                </h2>
                <p className="text-xs text-[#6E685E]">
                  Your skin type ({skinProfile?.skin_type || "Combination"}) is
                  automatically attached for clinical context.
                </p>
              </div>

              <form onSubmit={handleUserSubmitQuery} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#2E2C29] mb-1">
                    Query Subject / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Can I layer Retinol 0.3% with Azelaic Acid at night?"
                    className="w-full px-3 py-2 rounded-lg border border-[#EAE6DE] bg-[#FAF8F5] focus:bg-white focus:border-[#5A6D5C] focus:outline-none text-[#2E2C29]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#2E2C29] mb-1">
                      Primary Concern
                    </label>
                    <select
                      value={primaryConcern}
                      onChange={(e) => setPrimaryConcern(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#EAE6DE] bg-[#FAF8F5] focus:bg-white focus:border-[#5A6D5C] focus:outline-none text-[#2E2C29]"
                    >
                      <option value="Acne & Post-Blemish Erythema">
                        Acne & Breakouts
                      </option>
                      <option value="Hyperpigmentation">
                        Hyperpigmentation & Dark Spots
                      </option>
                      <option value="Compromised Barrier & Redness">
                        Compromised Barrier & Redness
                      </option>
                      <option value="Dryness & Dehydration">
                        Dryness & Flaking
                      </option>
                      <option value="Routine & Ingredient Layering">
                        Routine & Ingredient Layering
                      </option>
                      <option value="Fine Lines & Anti-Aging">
                        Fine Lines & Anti-Aging
                      </option>
                      <option value="Sensitivity / Allergic Reaction">
                        Sensitivity / Reaction
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#2E2C29] mb-1">
                      Urgency Level
                    </label>
                    <select
                      value={urgency}
                      onChange={(e) =>
                        setUrgency(
                          e.target.value as "Routine" | "Moderate" | "Urgent"
                        )
                      }
                      className="w-full px-3 py-2 rounded-lg border border-[#EAE6DE] bg-[#FAF8F5] focus:bg-white focus:border-[#5A6D5C] focus:outline-none text-[#2E2C29]"
                    >
                      <option value="Routine">Routine Check</option>
                      <option value="Moderate">Moderate Concern</option>
                      <option value="Urgent">Urgent Flare-Up</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#2E2C29] mb-1">
                    Describe Your Question or Symptoms *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    placeholder="Describe what your skin is experiencing, how long it has lasted, and what guidance you need from the dermatologist..."
                    className="w-full px-3 py-2 rounded-lg border border-[#EAE6DE] bg-[#FAF8F5] focus:bg-white focus:border-[#5A6D5C] focus:outline-none text-[#2E2C29]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#2E2C29] mb-1">
                    Current Routine / Products Used (Optional)
                  </label>
                  <input
                    type="text"
                    value={currentRoutineNotes}
                    onChange={(e) => setCurrentRoutineNotes(e.target.value)}
                    placeholder="e.g., AM: Amino Cleanser + SPF 50. PM: Niacinamide + Ceramide Cream"
                    className="w-full px-3 py-2 rounded-lg border border-[#EAE6DE] bg-[#FAF8F5] focus:bg-white focus:border-[#5A6D5C] focus:outline-none text-[#2E2C29]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isSubmitting
                      ? "Submitting Query..."
                      : "Submit Query to Dermatologist"}
                  </span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: User's Queries & Dermatologist Solutions (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-bold text-lg text-[#2E2C29]">
                Your Consultations & Dermatologist Solutions (
                {consultations.length})
              </h2>
              <div className="flex items-center gap-1 bg-[#F5F2EB] p-1 rounded-lg text-xs">
                {(["All", "Pending", "Solved"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                      statusFilter === tab
                        ? "bg-white text-[#2E2C29] shadow-2xs"
                        : "text-[#6E685E] hover:text-[#2E2C29]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {filteredConsultations.length === 0 ? (
              <div className="bg-white border border-[#EAE6DE] rounded-2xl p-8 text-center space-y-2">
                <Stethoscope className="w-7 h-7 text-[#8C857B] mx-auto" />
                <h3 className="font-serif font-bold text-base text-[#2E2C29]">
                  No consultations found
                </h3>
                <p className="text-xs text-[#6E685E]">
                  Use the form on the left to ask a dermatologist your first
                  skincare question.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredConsultations.map((item) => {
                  const isSolved = item.status === "Solved";
                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-[#EAE6DE] rounded-2xl p-5 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-3 border-b border-[#F2EDE4]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-[#6E685E]">
                            <span className="font-semibold text-[#2E2C29]">
                              {item.primary_concern}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{item.urgency} Priority</span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="font-serif font-bold text-base text-[#2E2C29]">
                            {item.subject}
                          </h3>
                        </div>

                        <span
                          className={`text-xs font-semibold flex items-center gap-1.5 shrink-0 ${
                            isSolved ? "text-[#5A6D5C]" : "text-amber-700"
                          }`}
                        >
                          {isSolved ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Solved by Dermatologist</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5" />
                              <span>Awaiting Dermatologist Review</span>
                            </>
                          )}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <p className="text-[#4A4742] leading-relaxed">
                          {item.query_text}
                        </p>
                        {item.current_routine_notes && (
                          <p className="text-[#6E685E]">
                            <span className="font-semibold text-[#2E2C29]">
                              Current Routine:{" "}
                            </span>
                            {item.current_routine_notes}
                          </p>
                        )}
                      </div>

                      {/* Dermatologist Solution Block */}
                      {isSolved && item.clinical_response ? (
                        <div className="bg-[#F0F5F1] border border-[#8BA88E]/40 rounded-xl p-4 space-y-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#2E2C29] flex items-center gap-1.5">
                              <Stethoscope className="w-3.5 h-3.5 text-[#5A6D5C]" />
                              <span>
                                Clinical Solution from{" "}
                                {item.dermatologist_name || "Dr. Clara Chen"}
                              </span>
                            </span>
                            {item.solved_at && (
                              <span className="text-[11px] text-[#6E685E]">
                                {new Date(item.solved_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          <p className="text-[#2E2C29] leading-relaxed">
                            {item.clinical_response}
                          </p>

                          {item.recommended_actives &&
                            item.recommended_actives.length > 0 && (
                              <div className="text-[#4A4742]">
                                <span className="font-semibold text-[#2E2C29]">
                                  Recommended Actives:{" "}
                                </span>
                                {item.recommended_actives.join(" · ")}
                              </div>
                            )}

                          {item.recommended_product_name && (
                            <div className="pt-2 border-t border-[#8BA88E]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <span className="text-[11px] text-[#5A6D5C] font-semibold block">
                                  Prescribed Clinical Product:
                                </span>
                                <span className="font-semibold text-[#2E2C29]">
                                  {item.recommended_product_name}
                                </span>
                              </div>
                              {item.recommended_product_id && (
                                <button
                                  onClick={() =>
                                    handleAddRecommendedToShelf(
                                      item.recommended_product_id!
                                    )
                                  }
                                  className="px-3 py-1.5 rounded-lg bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add to My Shelf</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-[#FAF8F5] border border-[#EAE6DE] rounded-xl p-3 text-xs text-[#6E685E] flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>
                            Your query is in the Dermatologist clinical triage
                            queue. Once solved, the prescription and product
                            recommendation will appear here.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          VIEW 2: DERMATOLOGIST SIDE — SOLVE USER QUERIES
         ========================================================= */}
      {isDermatologist && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#EAE6DE] rounded-xl p-4">
            <div className="flex items-center gap-1 bg-[#F5F2EB] p-1 rounded-lg text-xs">
              {(["All", "Pending", "Solved"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer ${
                    statusFilter === tab
                      ? "bg-white text-[#2E2C29] shadow-2xs"
                      : "text-[#6E685E] hover:text-[#2E2C29]"
                  }`}
                >
                  {tab} Queries (
                  {tab === "All"
                    ? consultations.length
                    : tab === "Pending"
                    ? pendingCount
                    : solvedCount}
                  )
                </button>
              ))}
            </div>

            <div className="text-xs text-[#6E685E]">
              Click <span className="font-semibold text-[#2E2C29]">Solve Query</span> on any patient case to write your clinical prescription and recommend a formulation.
            </div>
          </div>

          {filteredConsultations.length === 0 ? (
            <div className="bg-white border border-[#EAE6DE] rounded-2xl p-10 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#5A6D5C] mx-auto" />
              <h3 className="font-serif font-bold text-base text-[#2E2C29]">
                No patient queries in this view
              </h3>
              <p className="text-xs text-[#6E685E]">
                Switch filter tabs to view all patient consultations.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredConsultations.map((item) => {
                const isSolved = item.status === "Solved";
                const isEditingThis = activeSolveId === item.id;

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-[#EAE6DE] rounded-2xl p-6 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-[#F2EDE4]">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E685E]">
                          <span className="font-semibold text-[#2E2C29] flex items-center gap-1">
                            <UserIcon className="w-3.5 h-3.5 text-[#5A6D5C]" />
                            {item.user_name} ({item.user_email})
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{item.skin_type || "Combination"} Skin</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.primary_concern}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              item.urgency === "Urgent"
                                ? "text-rose-700 font-semibold"
                                : "text-[#6E685E]"
                            }
                          >
                            {item.urgency} Priority
                          </span>
                        </div>
                        <h3 className="font-serif font-bold text-lg text-[#2E2C29]">
                          {item.subject}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-xs font-semibold flex items-center gap-1 ${
                            isSolved ? "text-[#5A6D5C]" : "text-amber-700"
                          }`}
                        >
                          {isSolved ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Solved</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5" />
                              <span>Pending Review</span>
                            </>
                          )}
                        </span>

                        <button
                          onClick={() =>
                            isEditingThis
                              ? setActiveSolveId(null)
                              : openSolvePanel(item)
                          }
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                            isEditingThis
                              ? "bg-[#2E2C29] text-white"
                              : isSolved
                              ? "bg-[#FAF8F5] border border-[#EAE6DE] text-[#2E2C29] hover:border-[#5A6D5C]"
                              : "bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white"
                          }`}
                        >
                          {isEditingThis
                            ? "Close Form"
                            : isSolved
                            ? "Update Solution"
                            : "Solve Query"}
                        </button>
                      </div>
                    </div>

                    {/* Patient Question Details */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DE] space-y-2 text-xs">
                      <div className="font-semibold text-[#2E2C29]">
                        Patient Query:
                      </div>
                      <p className="text-[#4A4742] leading-relaxed">
                        {item.query_text}
                      </p>
                      {item.current_routine_notes && (
                        <p className="text-[#6E685E] pt-1 border-t border-[#EAE6DE]">
                          <span className="font-semibold text-[#2E2C29]">
                            Reported Routine:{" "}
                          </span>
                          {item.current_routine_notes}
                        </p>
                      )}
                    </div>

                    {/* Existing Solution Display (when not editing) */}
                    {isSolved && !isEditingThis && item.clinical_response && (
                      <div className="p-4 rounded-xl bg-[#F0F5F1] border border-[#8BA88E]/40 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-semibold text-[#2E2C29]">
                          <span>
                            Solved by {item.dermatologist_name || "Dermatologist"}
                          </span>
                          {item.solved_at && (
                            <span className="text-[11px] text-[#6E685E]">
                              {new Date(item.solved_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-[#2E2C29] leading-relaxed">
                          {item.clinical_response}
                        </p>
                        {item.recommended_actives &&
                          item.recommended_actives.length > 0 && (
                            <div className="text-[#4A4742]">
                              <span className="font-semibold">
                                Prescribed Actives:{" "}
                              </span>
                              {item.recommended_actives.join(" · ")}
                            </div>
                          )}
                        {item.recommended_product_name && (
                          <div className="text-[#5A6D5C] font-semibold">
                            Recommended Product: {item.recommended_product_name}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Inline Dermatologist Resolution Form */}
                    {isEditingThis && (
                      <form
                        onSubmit={(e) => handleDermSolveSubmit(e, item.id)}
                        className="p-5 rounded-xl bg-[#F0F5F1]/60 border border-[#5A6D5C]/30 space-y-4 text-xs"
                      >
                        <div className="font-serif font-bold text-sm text-[#2E2C29] flex items-center gap-1.5">
                          <Stethoscope className="w-4 h-4 text-[#5A6D5C]" />
                          <span>
                            Write Clinical Solution for {item.user_name}
                          </span>
                        </div>

                        <div>
                          <label className="block font-semibold text-[#2E2C29] mb-1">
                            Clinical Assessment & Treatment Solution *
                          </label>
                          <textarea
                            rows={3}
                            required
                            value={clinicalResponse}
                            onChange={(e) =>
                              setClinicalResponse(e.target.value)
                            }
                            placeholder="Provide clear dermatological instructions, routine adjustments, and safety precautions..."
                            className="w-full p-3 rounded-lg bg-white border border-[#EAE6DE] focus:border-[#5A6D5C] focus:outline-none text-[#2E2C29]"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block font-semibold text-[#2E2C29] mb-1">
                              Recommended Active Ingredients (comma-separated)
                            </label>
                            <input
                              type="text"
                              value={recommendedActivesInput}
                              onChange={(e) =>
                                setRecommendedActivesInput(e.target.value)
                              }
                              placeholder="Azelaic Acid, Ceramide NP, Panthenol"
                              className="w-full px-3 py-2 rounded-lg bg-white border border-[#EAE6DE] focus:border-[#5A6D5C] focus:outline-none text-[#2E2C29]"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-[#2E2C29] mb-1">
                              Prescribe Product from Catalog (Optional)
                            </label>
                            <select
                              value={recommendedProductId}
                              onChange={(e) =>
                                setRecommendedProductId(e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-lg bg-white border border-[#EAE6DE] focus:border-[#5A6D5C] focus:outline-none text-[#2E2C29]"
                            >
                              <option value="">
                                — Select a clinical product —
                              </option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.brand} · {p.name} ({p.category})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setActiveSolveId(null)}
                            className="px-4 py-2 rounded-lg text-[#6E685E] hover:text-[#2E2C29] font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              {isSubmitting
                                ? "Saving Solution..."
                                : "Mark Query as Solved & Send Solution"}
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
      )}
    </div>
  );
};
