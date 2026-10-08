import React from 'react';
import { Sparkles, BarChart2 } from 'lucide-react';

/**
 * AIBadge — clearly labels AI-generated vs Rule-based content per §17 spec.
 */

const AIBadge = ({ type = 'ai', className = '' }) => {
  if (type === 'ai') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-100 ${className}`}
      >
        <Sparkles size={9} aria-hidden="true" />
        AI Analysis
      </span>
    );
  }

  if (type === 'rule') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[var(--color-brand-light)] text-[var(--color-brand-dark)] border border-[var(--color-brand-mid)] ${className}`}
      >
        <BarChart2 size={9} aria-hidden="true" />
        Rule-Based
      </span>
    );
  }

  return null;
};

export default AIBadge;
