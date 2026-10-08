import React from 'react';
import { CheckCircle2 } from 'lucide-react';

/**
 * AssessmentOption — large visual selectable card per §9 spec.
 * Used in onboarding and assessment flows.
 */
const AssessmentOption = ({
  value,
  label,
  description,
  Icon,
  selected,
  onChange,
  multi = false,  // single select vs multi-select
  disabled = false,
}) => {
  const handleClick = () => {
    if (!disabled) onChange?.(value);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`w-full text-left border-2 rounded-[var(--radius-xl)] p-4 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-brand)] ${
        selected
          ? 'border-[var(--color-brand)] bg-[var(--color-brand-light)] shadow-[var(--shadow-sm)]'
          : 'border-[var(--color-border)] bg-white hover:border-[var(--color-brand-mid)] hover:shadow-[var(--shadow-sm)]'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      aria-pressed={selected}
      aria-label={`${selected ? 'Deselect' : 'Select'} ${label}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        {Icon && (
          <div className={`w-9 h-9 rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0 ${
            selected ? 'bg-[var(--color-brand)]' : 'bg-[var(--color-surface-3)]'
          }`}>
            <Icon size={18} className={selected ? 'text-white' : 'text-[var(--color-text-muted)]'} aria-hidden="true" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold leading-tight ${selected ? 'text-[var(--color-brand-dark)]' : 'text-[var(--color-text-primary)]'}`}>
            {label}
          </p>
          {description && (
            <p className={`text-xs mt-0.5 leading-relaxed ${selected ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-muted)]'}`}>
              {description}
            </p>
          )}
        </div>

        {/* Selection indicator */}
        {selected && (
          <CheckCircle2 size={18} className="text-[var(--color-brand)] flex-shrink-0 mt-0.5 animate-scale-in" aria-hidden="true" />
        )}
      </div>
    </button>
  );
};

export default AssessmentOption;
