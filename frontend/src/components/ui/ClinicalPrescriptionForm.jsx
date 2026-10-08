import React, { useState, useEffect } from "react";
import { Pill, Send, CheckCircle2, AlertCircle, Clock, FileText } from "lucide-react";
import api from "../../services/api";

export default function ClinicalPrescriptionForm({
  patientId,
  patientName,
  onPrescriptionCreated,
  onPrescriptionSubmitted,
}) {
  const [title, setTitle] = useState("Targeted Barrier Fortification & Active Care Protocol");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [prescribedActives, setPrescribedActives] = useState("Ceramide NP, Niacinamide 4%, Panthenol 5%");
  const [contraindications, setContraindications] = useState("Suspend high-strength BHA/AHA exfoliants during barrier recovery");
  const [followUpWeeks, setFollowUpWeeks] = useState(4);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [pastRecommendations, setPastRecommendations] = useState([]);

  useEffect(() => {
    if (patientId) {
      fetchPastRecommendations();
    }
  }, [patientId]);

  const fetchPastRecommendations = async () => {
    try {
      const res = await api.get(`/recommendations/patient/${patientId}`);
      if (res.data) {
        setPastRecommendations(res.data);
      }
    } catch {
      setPastRecommendations([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clinicalNotes.trim() || clinicalNotes.trim().length < 10) {
      setSuccessMsg("");
      setErrorMsg("Please enter detailed clinical advisory notes (minimum 10 characters).");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const activesList = prescribedActives
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

      const contraList = contraindications
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      const payload = {
        patient_id: patientId,
        title: title.trim(),
        clinical_notes: clinicalNotes.trim(),
        prescribed_actives: activesList,
        recommended_products: [
          { name: "CeraVe Hydrating Cleanser", timing: "Morning & Evening" },
          { name: "La Roche-Posay Toleriane Double Repair", timing: "Morning" },
        ],
        contraindications: contraList,
        follow_up_weeks: parseInt(followUpWeeks, 10) || 4,
      };

      await api.post("/recommendations", payload);
      setErrorMsg("");
      setSuccessMsg("Clinical recommendation successfully prescribed and synced to patient chart!");
      setClinicalNotes("");

      // Isolated refresh so UI does not fail after successful prescription
      try {
        await fetchPastRecommendations();
      } catch (err) {
        console.warn("Failed to fetch past recommendations:", err);
      }

      try {
        if (onPrescriptionCreated) {
          await onPrescriptionCreated();
        }
        if (onPrescriptionSubmitted) {
          await onPrescriptionSubmitted();
        }
      } catch (err) {
        console.warn("Failed to refresh parent patient chart:", err);
      }

      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMsg("");
      }, 5000);

    } catch (err) {
      setSuccessMsg("");
      setErrorMsg(err.response?.data?.detail || "Failed to submit clinical recommendation. Verify connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pt-2 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Pill size={14} />
          </div>
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Clinical Recommendation & Treatment Prescriber
          </h4>
        </div>
        <span className="text-[10px] text-gray-400">Patient ID: {String(patientId).slice(0, 8)}...</span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-[#fcfdfd] border border-gray-200/80 rounded-2xl p-4 space-y-3">
        {successMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle size={14} className="text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
            Protocol Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full text-xs font-medium bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-[#4a8c6e]"
            placeholder="e.g. Lipid Barrier Fortification Protocol"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
            Clinical Notes & Diagnosis Rationale
          </label>
          <textarea
            rows={3}
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            required
            placeholder={`Enter clinical instructions and dosage guidance for ${patientName || "the patient"}...`}
            className="w-full text-xs bg-white border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:border-[#4a8c6e] resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
              Prescribed Actives (comma separated)
            </label>
            <input
              type="text"
              value={prescribedActives}
              onChange={(e) => setPrescribedActives(e.target.value)}
              className="w-full text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-[#4a8c6e]"
              placeholder="e.g. Ceramide NP, Azelaic Acid 10%"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
              Contraindications & Hazards
            </label>
            <input
              type="text"
              value={contraindications}
              onChange={(e) => setContraindications(e.target.value)}
              className="w-full text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-[#4a8c6e]"
              placeholder="e.g. Avoid strong retinoids with AHAs"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Follow-up Review:
            </span>
            <select
              value={followUpWeeks}
              onChange={(e) => setFollowUpWeeks(e.target.value)}
              className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1 text-gray-800 font-semibold focus:outline-none"
            >
              <option value={2}>In 2 weeks</option>
              <option value={4}>In 4 weeks</option>
              <option value={6}>In 6 weeks</option>
              <option value={8}>In 8 weeks</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-[#183a2d] hover:bg-[#112d22] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Send size={12} />
            {submitting ? "Prescribing..." : "Prescribe to Patient"}
          </button>
        </div>
      </form>

      {/* Past Recommendations Log */}
      {pastRecommendations.length > 0 && (
        <div className="space-y-2 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
            Previously Prescribed Advisories ({pastRecommendations.length})
          </span>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {pastRecommendations.map((r) => (
              <div
                key={r.id}
                className="p-3 bg-white rounded-xl border border-gray-200/70 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">{r.title}</span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-600 text-[11px] italic">"{r.clinical_notes}"</p>
                {r.prescribed_actives?.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {r.prescribed_actives.map((act, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                      >
                        {act}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
