import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import PriorityBadge from './PriorityBadge';
import AnimatedBar from './AnimatedBar';

/**
 * ConcernCard — full concern card per §13 spec.
 * VALUE + STATUS + EXPLANATION + ACTION
 */

const CONCERN_META = {
  ACNE:              { label: 'Acne',             icon: '●', color: '#ef4444' },
  HYPERPIGMENTATION: { label: 'Hyperpigmentation', icon: '●', color: '#a855f7' },
  DARK_SPOTS:        { label: 'Dark Spots',        icon: '●', color: '#8b5cf6' },
  DRY_SKIN:          { label: 'Dry Skin',          icon: '●', color: '#3b82f6' },
  OILY_SKIN:         { label: 'Oily Skin',         icon: '●', color: '#f59e0b' },
  SENSITIVE_SKIN:    { label: 'Sensitive Skin',    icon: '●', color: '#f97316' },
  WRINKLES:          { label: 'Wrinkles',          icon: '●', color: '#6366f1' },
  FINE_LINES:        { label: 'Fine Lines',        icon: '●', color: '#818cf8' },
  REDNESS:           { label: 'Redness',           icon: '●', color: '#f43f5e' },
  UNEVEN_TONE:       { label: 'Uneven Tone',       icon: '●', color: '#84cc16' },
};

const probToColor = (prob) => {
  if (prob >= 0.6) return '#ef4444';
  if (prob >= 0.3) return '#f59e0b';
  return '#22c55e';
};

const ConcernCard = ({ concern, index, compact = false }) => {
  const [expanded, setExpanded] = useState(false);

  const meta = CONCERN_META[concern.concern_name] ?? {
    label: concern.concern_name?.replace(/_/g, ' ') ?? 'Unknown',
    icon: '●',
    color: '#6b7280',
  };

  const prob = concern.ml_probability ?? (concern.confidence / 100);
  const pct  = Math.round(Math.min(100, Math.max(0, prob * 100)));
  const barColor = probToColor(prob);

  if (compact) {
    return (
      <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">{meta.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tabular-nums" style={{ color: barColor }}>{pct}%</span>
            <PriorityBadge priority={concern.priority} />
          </div>
        </div>
        <AnimatedBar value={pct} color={barColor} height={4} delay={index * 60} />
      </div>
    );
  }

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] overflow-hidden transition-shadow duration-200 hover:shadow-[var(--shadow-md)]">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
              style={{ backgroundColor: meta.color }}
              aria-hidden="true"
            />
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{meta.label}</h3>
          </div>
          <PriorityBadge priority={concern.priority} />
        </div>

        {/* Score + bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-[var(--color-text-muted)]">AI Confidence</span>
            <span className="text-sm font-bold tabular-nums" style={{ color: barColor }}>{pct} / 100</span>
          </div>
          <AnimatedBar value={pct} color={barColor} height={6} delay={index * 80} />
        </div>

        {/* Short explanation */}
        {concern.reasons && concern.reasons.length > 0 && (
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            {concern.reasons[0]}
          </p>
        )}
      </div>

      {/* Expandable "Why?" panel per §14 */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-3 border-t border-[var(--color-border-light)] text-xs font-semibold text-[var(--color-brand)] hover:bg-[var(--color-brand-light)] transition-colors"
        aria-expanded={expanded}
        aria-controls={`concern-detail-${concern.id}`}
      >
        <span>Why is this a priority?</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div
          id={`concern-detail-${concern.id}`}
          className="px-5 py-4 bg-[var(--color-brand-light)] animate-slide-down"
        >
          <p className="text-xs font-semibold text-[var(--color-brand-dark)] mb-2">Your assessment indicates:</p>
          <ul className="space-y-1">
            {concern.reasons?.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
                <span className="text-[var(--color-brand)] mt-0.5 flex-shrink-0">•</span>
                {r}
              </li>
            ))}
            {(!concern.reasons || concern.reasons.length === 0) && (
              <li className="text-xs text-[var(--color-text-muted)] italic">Analysis based on your skin profile and lifestyle data.</li>
            )}
          </ul>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-3 pt-2 border-t border-[var(--color-brand-mid)]">
            AI analysis indicates {meta.label.toLowerCase()} as a relevant concern. Not a medical diagnosis.
          </p>
        </div>
      )}
    </div>
  );
};

export { CONCERN_META, probToColor };
export default ConcernCard;
