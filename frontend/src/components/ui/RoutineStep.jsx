import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, Sparkles } from 'lucide-react';
import ProductRecommendationModal from './ProductRecommendationModal';

/**
 * RoutineStep — numbered expandable routine step per §18 spec.
 * Shows title, purpose, key actives, why selected, safety notes,
 * and Curated Clinical Product Matches with allergen clearance.
 * Local checkbox state (persists in parent via onCheck).
 */
const RoutineStep = ({
  step,
  index,
  checked = false,
  onCheck,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  return (
    <div
      className={`border rounded-[var(--radius-xl)] overflow-hidden transition-all duration-200 ${
        checked
          ? 'border-[var(--color-brand-mid)] bg-[var(--color-brand-light)]'
          : 'border-[var(--color-border)] bg-white hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-sm)]'
      }`}
    >
      {/* Step row */}
      <div className="flex items-center gap-4 p-4">
        {/* Number + checkbox */}
        <button
          onClick={() => onCheck?.(step.id, !checked)}
          className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2 ${
            checked
              ? 'bg-[var(--color-brand)] border-[var(--color-brand)]'
              : 'border-[var(--color-border-strong)] hover:border-[var(--color-brand)]'
          }`}
          aria-label={checked ? `Mark step ${index + 1} incomplete` : `Mark step ${index + 1} complete`}
          aria-pressed={checked}
        >
          {checked ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <span className="text-[11px] font-bold text-[var(--color-text-muted)]">{String(index + 1).padStart(2, '0')}</span>
          )}
        </button>

        {/* Title + category */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold leading-tight ${checked ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text-primary)]'}`}>
            {step.title}
          </p>
          {step.category && (
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                {step.category} · {step.frequency}
              </span>
              {step.product_recommendations && step.product_recommendations.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                  <Sparkles size={10} className="text-emerald-600" /> {step.product_recommendations.length} Products Recommended
                </span>
              )}
            </div>
          )}
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex-shrink-0 p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-brand)] hover:bg-[var(--color-brand-light)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] cursor-pointer"
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse step details' : 'Expand step details'}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[var(--color-border-light)] pt-3 animate-slide-down">
          <div className="ml-12 space-y-3">
            {/* Purpose */}
            {step.description && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Purpose</p>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{step.description}</p>
              </div>
            )}

            {/* Key Actives */}
            {step.key_actives && step.key_actives.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Key Actives</p>
                <div className="flex flex-wrap gap-1.5">
                  {step.key_actives.map((active, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-white border border-[var(--color-border)] rounded-full text-[10px] font-medium text-[var(--color-text-secondary)]"
                    >
                      {active}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Curated Product Matches */}
            {step.product_recommendations && step.product_recommendations.length > 0 && (
              <div className="pt-1 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                    <Sparkles size={12} className="text-emerald-600" />
                    Recommended Medical-Grade Products ({step.product_recommendations.length})
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowProductModal(true)}
                    className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    View All {step.product_recommendations.length} Options →
                  </button>
                </div>

                {/* Top Matched Product Preview Card */}
                {step.product_recommendations[0] && (
                  <div className="p-3.5 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 rounded-xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                          {step.product_recommendations[0].brand}
                        </span>
                        <h5 className="text-xs font-bold text-gray-900">
                          {step.product_recommendations[0].name}
                        </h5>
                        <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                          {step.product_recommendations[0].match_score}% Match
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-snug">
                        {step.product_recommendations[0].clinical_summary}
                      </p>
                      {step.product_recommendations[0].key_actives?.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {step.product_recommendations[0].key_actives.map((act, idx) => (
                            <span key={idx} className="text-[9px] font-semibold text-gray-600 bg-white/90 px-1.5 py-0.5 rounded border border-gray-200">
                              {act}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowProductModal(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors text-xs font-bold cursor-pointer self-start sm:self-auto shadow-sm whitespace-nowrap"
                    >
                      <Sparkles size={12} />
                      View Details
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Safety notes */}
            {step.safety_notes && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-[var(--radius-md)] px-3 py-2">
                <AlertTriangle size={13} className="text-amber-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <p className="text-xs text-amber-700 leading-relaxed">{step.safety_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Recommendation Modal */}
      <ProductRecommendationModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        stepTitle={step.title}
        stepCategory={step.category}
        products={step.product_recommendations || []}
      />
    </div>
  );
};

export default RoutineStep;
