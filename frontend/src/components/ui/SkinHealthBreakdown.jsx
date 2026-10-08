import React, { useState } from 'react';

/**
 * SkinHealthBreakdown — 5-pillar score breakdown per §16 spec.
 * Each row is tappable to show explanation.
 */

const PILLARS = [
  { key: 'skin_condition_score',      label: 'Skin Condition',    weight: 35, desc: 'Evaluates your declared skin type, concerns, and sensitivity profile.' },
  { key: 'lifestyle_score',           label: 'Lifestyle Habits',  weight: 20, desc: 'Measures stress level, physical activity, diet quality, and daily habits.' },
  { key: 'sleep_score',               label: 'Sleep Quality',     weight: 15, desc: 'Assesses sleep duration and quality, which directly affects skin repair.' },
  { key: 'routine_consistency_score', label: 'Routine Consistency', weight: 20, desc: 'Tracks how consistently you follow your personalized skincare routine.' },
  { key: 'hydration_score',           label: 'Hydration Level',   weight: 10, desc: 'Evaluates your daily water intake relative to your personal target.' },
];

const pillarColor = (value) => {
  if (value >= 75) return '#22c55e';
  if (value >= 50) return '#f59e0b';
  return '#ef4444';
};

const SkinHealthBreakdown = ({ scores }) => {
  const [activeKey, setActiveKey] = useState(null);

  if (!scores) {
    return (
      <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-sm)]">
        <p className="text-xs text-[var(--color-text-muted)] text-center py-4">Score breakdown not available. Run an assessment first.</p>
      </div>
    );
  }

  const overall = scores.overall_score;

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-light)]">
        <div>
          <p className="text-sm font-bold text-[var(--color-text-primary)]">Skin Health Score</p>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
            Calculated from your assessment data using the standardized scoring model.
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-[var(--color-text-primary)] tabular-nums">{overall}</p>
          <p className="text-[10px] text-[var(--color-text-muted)]">out of 100</p>
        </div>
      </div>

      {/* Pillar rows */}
      <div className="divide-y divide-[var(--color-border-light)]">
        {PILLARS.map((pillar) => {
          const value = scores[pillar.key] ?? 0;
          const contribution = Math.round(value * pillar.weight / 100);
          const isActive = activeKey === pillar.key;
          const color = pillarColor(value);

          return (
            <div key={pillar.key}>
              <button
                onClick={() => setActiveKey(isActive ? null : pillar.key)}
                className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--color-surface-2)] transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-brand)]"
                aria-expanded={isActive}
              >
                {/* Label + weight */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--color-text-primary)]">{pillar.label}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">
                    {value} × {pillar.weight}% = <span className="font-semibold text-[var(--color-text-secondary)]">+{contribution} pts</span>
                  </p>
                </div>

                {/* Mini bar */}
                <div className="w-20 shrink-0">
                  <div className="h-1.5 bg-[var(--color-border-light)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${value}%`, backgroundColor: color, transition: 'width 0.6s ease' }}
                    />
                  </div>
                </div>

                {/* Value */}
                <span className="text-sm font-bold tabular-nums w-8 text-right flex-shrink-0" style={{ color }}>
                  {value}
                </span>
              </button>

              {/* Expanded explanation */}
              {isActive && (
                <div className="px-5 py-3 bg-[var(--color-brand-light)] border-t border-[var(--color-brand-mid)] animate-slide-down">
                  <p className="text-xs text-[var(--color-brand-dark)] leading-relaxed">{pillar.desc}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer disclaimer */}
      <div className="px-5 py-3 bg-[var(--color-surface-2)] border-t border-[var(--color-border-light)]">
        <p className="text-[10px] text-[var(--color-text-muted)]">
          Rule-based calculation. AI analysis is used for concern detection and prioritization only.
        </p>
      </div>
    </div>
  );
};

export { PILLARS };
export default SkinHealthBreakdown;
