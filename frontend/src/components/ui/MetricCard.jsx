import React from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * MetricCard — VALUE + STATUS + EXPLANATION + ACTION per §2 core UX principle.
 * Every important metric must provide all four.
 */

const STATUS_CONFIG = {
  excellent: { label: 'Excellent',       color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  good:      { label: 'Good',            color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  fair:      { label: 'Fair',            color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200'   },
  attention: { label: 'Needs Attention', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200'   },
  critical:  { label: 'Needs Care',      color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200'     },
};

const MetricCard = ({
  Icon,
  iconColor = 'bg-[var(--color-brand)]',
  label,
  value,
  status,         // 'excellent' | 'good' | 'fair' | 'attention' | 'critical'
  explanation,
  action,
  actionTo,
  onClick,
}) => {
  const st = STATUS_CONFIG[status] ?? STATUS_CONFIG['fair'];
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={`bg-white border border-[var(--color-border)] rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-sm)] text-left w-full ${
        onClick ? 'hover:shadow-[var(--shadow-md)] hover:border-[var(--color-border-strong)] transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]' : ''
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        {Icon && (
          <div className={`w-9 h-9 rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0 ${iconColor}`}>
            <Icon size={16} className="text-white" aria-hidden="true" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{label}</p>
          <p className="text-xl font-black text-[var(--color-text-primary)] tabular-nums mt-0.5">{value}</p>
        </div>
        {status && (
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex-shrink-0 ${st.color} ${st.bg} ${st.border}`}>
            {st.label}
          </span>
        )}
      </div>

      {explanation && (
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-3">{explanation}</p>
      )}

      {action && (
        <button className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] transition-colors">
          {action}
          <ArrowRight size={11} aria-hidden="true" />
        </button>
      )}
    </Wrapper>
  );
};

export default MetricCard;
