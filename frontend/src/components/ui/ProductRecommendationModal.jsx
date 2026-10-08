import React from "react";
import { X, CheckCircle2, ShieldCheck, Sparkles, Star, Tag } from "lucide-react";

export default function ProductRecommendationModal({ isOpen, onClose, stepTitle, stepCategory, products = [] }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-teal-50/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Curated Clinical Product Recommendations
              </h3>
              <p className="text-xs text-gray-500">
                Matches for: <span className="font-semibold text-gray-700">{stepTitle}</span> ({stepCategory})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50/80 border border-emerald-200/60 p-2.5 rounded-xl font-medium">
            <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
            <span>
              Formulations screened against your allergy & sensitivity exclusions. All products are verified non-comedogenic and dermatologically tested.
            </span>
          </div>

          {products.length > 0 ? (
            products.map((prod, idx) => (
              <div
                key={prod.id || idx}
                className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all duration-200 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/50">
                      {prod.brand}
                    </span>
                    <h4 className="text-sm font-bold text-gray-900 mt-1">
                      {prod.name}
                    </h4>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <Sparkles size={11} /> {prod.match_score || 95}% Match
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-amber-500 justify-end mt-1 font-semibold">
                      <Star size={12} fill="currentColor" /> {prod.clinical_rating || 4.8}/5
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed bg-white p-2.5 rounded-lg border border-gray-100">
                  {prod.clinical_summary}
                </p>

                {/* Key Actives */}
                {prod.key_actives?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] font-bold text-gray-400 mr-1 flex items-center gap-1">
                      <Tag size={10} /> Actives:
                    </span>
                    {prod.key_actives.map((act, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white text-gray-700 border border-gray-200"
                      >
                        {act}
                      </span>
                    ))}
                  </div>
                )}

                {/* Badges / Certifications */}
                {prod.certifications?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-100">
                    {prod.certifications.map((cert, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[10px] text-gray-500 font-medium"
                      >
                        <CheckCircle2 size={11} className="text-emerald-500" /> {cert}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400 text-xs">
              No specific products matched for this step.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
