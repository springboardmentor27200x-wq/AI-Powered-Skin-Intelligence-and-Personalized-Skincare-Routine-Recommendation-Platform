import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * EmptyState — consistent empty state across all pages per §32 spec.
 */
const EmptyState = ({
  Icon,
  title,
  description,
  cta,
  ctaTo,
  ctaOnClick,
  secondaryCta,
  secondaryTo,
}) => (
  <div className="flex flex-col items-center text-center py-12 px-6 animate-fade-in">
    {Icon && (
      <div className="w-14 h-14 bg-[var(--color-surface-3)] rounded-[var(--radius-xl)] flex items-center justify-center mb-4">
        <Icon size={24} className="text-[var(--color-text-muted)]" aria-hidden="true" />
      </div>
    )}
    <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-1">{title}</h3>
    {description && (
      <p className="text-xs text-[var(--color-text-secondary)] max-w-xs leading-relaxed mb-5">{description}</p>
    )}
    {cta && (ctaTo || ctaOnClick) && (
      <div className="flex flex-col sm:flex-row gap-2 items-center">
        {ctaTo ? (
          <Link
            to={ctaTo}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white text-xs font-bold rounded-[var(--radius-lg)] transition-colors shadow-[var(--shadow-sm)]"
          >
            {cta}
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        ) : (
          <button
            onClick={ctaOnClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white text-xs font-bold rounded-[var(--radius-lg)] transition-colors shadow-[var(--shadow-sm)]"
          >
            {cta}
            <ArrowRight size={13} aria-hidden="true" />
          </button>
        )}
        {secondaryCta && secondaryTo && (
          <Link
            to={secondaryTo}
            className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors underline underline-offset-2"
          >
            {secondaryCta}
          </Link>
        )}
      </div>
    )}
  </div>
);

export default EmptyState;
