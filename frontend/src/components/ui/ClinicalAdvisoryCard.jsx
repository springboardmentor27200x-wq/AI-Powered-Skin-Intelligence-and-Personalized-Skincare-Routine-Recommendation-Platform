import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Calendar,
  Pill,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import api from "../../services/api";

export default function ClinicalAdvisoryCard({ assessment, skinProfile }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [activeRecIndex, setActiveRecIndex] = useState(0);
  const [showContraindications, setShowContraindications] = useState(false);
  const [showAllPrescriptions, setShowAllPrescriptions] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(false);
      const res = await api.get("/recommendations/my");
      if (res.data) {
        setRecommendations(res.data);
      }
    } catch {
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const score = assessment?.overall_score ?? 75;
  const isCompromised = score < 60;
  const barrierStatus = isCompromised
    ? "Compromised"
    : score < 75
    ? "Stabilizing / Rebuilding"
    : "Resilient & Optimal";

  const contraindications = [
    ...(isCompromised
      ? ["Pause high-strength direct AHA/BHA acids until barrier score exceeds 70."]
      : []),
    "Avoid concurrent application of L-Ascorbic Acid (Vitamin C) with strong Retinoids in the same AM/PM session.",
    "Always seal humectants (Hyaluronic Acid/Glycerin) with a ceramide lipid occlusive to prevent reverse moisture drawdown.",
  ];

  const currentRec = recommendations[activeRecIndex] || recommendations[0];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200 flex flex-col justify-between">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#eaf4ef] flex items-center justify-center text-[#4a8c6e] flex-shrink-0">
            <Stethoscope size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-gray-900 tracking-tight">
                Chief Dermatologist Clinical Advisory
              </h3>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#eaf4ef] text-[#4a8c6e] border border-[#d2e8dd]">
                Clinical Grade
              </span>
            </div>
            <p className="text-[10px] text-gray-500">
              Barrier assessment & verified doctor directives
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={expanded ? "Collapse advisory" : "Expand advisory"}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Body */}
      {expanded && (
        <div className="p-4 space-y-3">
          {/* Streamlined Barrier Health Strip */}
          <div
            className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2.5 ${
              isCompromised
                ? "bg-amber-50/60 border-amber-200/70 text-amber-900"
                : "bg-[#f4f9f6] border-[#d8ebe1] text-[#24523e]"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {isCompromised ? (
                <ShieldAlert className="text-amber-600 flex-shrink-0" size={15} />
              ) : (
                <ShieldCheck className="text-[#4a8c6e] flex-shrink-0" size={15} />
              )}
              <span className="text-[11px] font-bold truncate">
                Barrier: {barrierStatus}
              </span>
            </div>
            <span className="text-[11px] font-black shrink-0 px-2 py-0.5 rounded-md bg-white/80 border border-gray-100/80">
              {score}/100
            </span>
          </div>

          {/* Prescriptions Section */}
          {recommendations.length > 0 ? (
            <div className="space-y-2">
              {/* Prescriptions Header & Pager */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <UserCheck size={13} className="text-[#4a8c6e]" />
                  <span>Prescribed Regimens ({recommendations.length})</span>
                </div>

                {recommendations.length > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowAllPrescriptions(!showAllPrescriptions)}
                      className="text-[10px] text-indigo-600 font-semibold hover:underline mr-1"
                    >
                      {showAllPrescriptions ? "Single View" : "View All"}
                    </button>
                    {!showAllPrescriptions && (
                      <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-1.5 py-0.5">
                        <button
                          disabled={activeRecIndex === 0}
                          onClick={() => setActiveRecIndex((prev) => Math.max(0, prev - 1))}
                          className="text-gray-500 hover:text-gray-900 disabled:opacity-30"
                        >
                          <ChevronLeft size={12} />
                        </button>
                        <span className="text-[10px] font-bold text-gray-700 px-0.5">
                          {activeRecIndex + 1}/{recommendations.length}
                        </span>
                        <button
                          disabled={activeRecIndex === recommendations.length - 1}
                          onClick={() =>
                            setActiveRecIndex((prev) =>
                              Math.min(recommendations.length - 1, prev + 1)
                            )
                          }
                          className="text-gray-500 hover:text-gray-900 disabled:opacity-30"
                        >
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Single Prescription View or Scrollable Multi View */}
              {showAllPrescriptions ? (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {recommendations.map((rec) => (
                    <PrescriptionItem key={rec.id} rec={rec} />
                  ))}
                </div>
              ) : currentRec ? (
                <PrescriptionItem rec={currentRec} />
              ) : null}
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="text-gray-400" size={14} />
                <span className="text-gray-600 text-[11px]">
                  No active doctor prescriptions on file.
                </span>
              </div>
              <Link
                to="/find-professional"
                className="text-[11px] font-bold text-[#4a8c6e] hover:underline flex items-center gap-0.5"
              >
                Connect <ExternalLink size={11} />
              </Link>
            </div>
          )}

          {/* Collapsible Contraindications Safeguard */}
          <div className="border-t border-gray-100 pt-2">
            <button
              onClick={() => setShowContraindications(!showContraindications)}
              className="w-full flex items-center justify-between text-[11px] font-semibold text-gray-600 hover:text-gray-900 transition-colors py-0.5"
            >
              <span className="flex items-center gap-1.5 text-gray-700 font-bold">
                <AlertTriangle size={12} className="text-amber-500" />
                Active Formulation Safeguards ({contraindications.length})
              </span>
              <span className="text-[10px] text-[#4a8c6e] flex items-center gap-0.5">
                {showContraindications ? "Hide" : "Show"}
                <ChevronDown
                  size={12}
                  className={`transition-transform ${
                    showContraindications ? "rotate-180" : ""
                  }`}
                />
              </span>
            </button>

            {showContraindications && (
              <ul className="mt-2 space-y-1 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 text-[11px] text-gray-600">
                {contraindications.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-tight">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 flex-shrink-0" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact individual prescription card
function PrescriptionItem({ rec }) {
  return (
    <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/30 space-y-1.5 relative overflow-hidden text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold">
            Dr
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-800 leading-none">
              {rec.professional_name || "Dermatologist Specialist"}
            </p>
            <p className="text-[9px] text-indigo-600 font-medium">
              {rec.professional_role === "DERMATOLOGIST"
                ? "Board-Certified Dermatologist"
                : "Clinical Skincare Consultant"}
            </p>
          </div>
        </div>
        <span className="text-[9px] text-gray-400 flex items-center gap-1">
          <Calendar size={10} />
          {new Date(rec.created_at).toLocaleDateString()}
        </span>
      </div>

      <h4 className="text-[11px] font-bold text-gray-900 pt-0.5">{rec.title}</h4>

      {rec.clinical_notes && (
        <p className="text-[11px] text-gray-600 italic bg-white/80 p-2 rounded-lg border border-indigo-50 leading-snug line-clamp-2">
          "{rec.clinical_notes}"
        </p>
      )}

      {/* Actives & Products chips inline */}
      <div className="flex flex-wrap gap-1 items-center pt-0.5">
        {rec.prescribed_actives?.length > 0 &&
          rec.prescribed_actives.slice(0, 3).map((act, idx) => (
            <span
              key={idx}
              className="px-1.5 py-0.2 text-[9px] font-semibold bg-white text-indigo-700 border border-indigo-200 rounded-md"
            >
              {act}
            </span>
          ))}
        {rec.recommended_products?.length > 0 && (
          <span className="text-[9px] text-gray-500 font-medium ml-1">
            + {rec.recommended_products.length} product{rec.recommended_products.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {rec.follow_up_weeks && (
        <p className="text-[9px] text-indigo-600 font-medium pt-0.5">
          Next follow-up: in {rec.follow_up_weeks} weeks
        </p>
      )}
    </div>
  );
}
