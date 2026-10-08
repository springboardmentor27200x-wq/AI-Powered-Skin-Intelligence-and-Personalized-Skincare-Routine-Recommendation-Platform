import React from 'react';

/**
 * SectionHeader — consistent page/section headings.
 */
const SectionHeader = ({ title, subtitle, action, className = '' }) => (
  <div className={`flex items-start justify-between gap-4 ${className}`}>
    <div>
      <h2 className="text-base font-bold text-[var(--color-text-primary)] tracking-tight">{title}</h2>
      {subtitle && (
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">{subtitle}</p>
      )}
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

export default SectionHeader;
