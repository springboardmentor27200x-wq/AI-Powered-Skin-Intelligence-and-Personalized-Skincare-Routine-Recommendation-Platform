import React from 'react';
import { Brain } from 'lucide-react';

/**
 * InsightCard — AI-generated insight with contextual copy per §10 spec.
 */
const InsightCard = ({ title = 'AI Insight', insight, footer }) => (
  <div className="bg-gradient-to-br from-[#2d4f40] to-[#1c3328] rounded-[var(--radius-xl)] p-5 text-white relative overflow-hidden shadow-[var(--shadow-md)]">
    {/* Decorative glow */}
    <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
    <div className="relative">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-white/15 rounded-[var(--radius-md)] flex items-center justify-center">
          <Brain size={14} className="text-white" aria-hidden="true" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">{title}</p>
      </div>
      {insight ? (
        <p className="text-sm text-white/85 leading-relaxed">{insight}</p>
      ) : (
        <p className="text-xs text-white/40 italic">Run an assessment to generate insights.</p>
      )}
      {footer && (
        <p className="text-[9px] text-white/30 mt-3 pt-2 border-t border-white/10">{footer}</p>
      )}
    </div>
  </div>
);

export default InsightCard;
