import React from 'react';

/**
 * PriorityBadge — HIGH / MEDIUM / LOW pill with semantic colors.
 */
const PRIORITY_CONFIG = {
  HIGH:     { label: 'High',     bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200'    },
  MEDIUM:   { label: 'Medium',   bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'  },
  LOW:      { label: 'Low',      bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  MODERATE: { label: 'Moderate', bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'  },
};

const PriorityBadge = ({ priority, size = 'sm' }) => {
  const cfg = PRIORITY_CONFIG[priority?.toUpperCase()] ?? {
    label: priority ?? '—',
    bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200',
  };

  const sizeClass = size === 'sm'
    ? 'text-[10px] px-2 py-0.5'
    : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeClass}`}>
      {cfg.label}
    </span>
  );
};

export default PriorityBadge;
