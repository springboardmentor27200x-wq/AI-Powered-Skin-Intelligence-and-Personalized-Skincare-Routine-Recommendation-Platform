import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * ErrorState — friendly error display per §31 spec.
 * Shows message + reasons + Retry + secondary action.
 */
const ErrorState = ({
  title = "Something went wrong",
  message,
  reasons,
  onRetry,
  retryLabel = 'Try Again',
  secondaryLabel,
  secondaryTo,
}) => (
  <div className="flex flex-col items-center text-center py-10 px-6 animate-fade-in">
    <div className="w-12 h-12 bg-red-50 rounded-[var(--radius-xl)] flex items-center justify-center mb-4">
      <AlertTriangle size={22} className="text-red-500" aria-hidden="true" />
    </div>
    <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-1">{title}</h3>
    {message && (
      <p className="text-xs text-[var(--color-text-secondary)] max-w-xs leading-relaxed mb-3">{message}</p>
    )}
    {reasons && reasons.length > 0 && (
      <ul className="text-xs text-[var(--color-text-muted)] text-left space-y-1 mb-5 max-w-xs">
        {reasons.map((r, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span className="text-red-400 mt-0.5">•</span>
            {r}
          </li>
        ))}
      </ul>
    )}
    <div className="flex items-center gap-3">
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white text-xs font-bold rounded-[var(--radius-lg)] transition-colors"
        >
          <RefreshCw size={12} aria-hidden="true" />
          {retryLabel}
        </button>
      )}
      {secondaryLabel && secondaryTo && (
        <Link
          to={secondaryTo}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft size={12} aria-hidden="true" />
          {secondaryLabel}
        </Link>
      )}
    </div>
  </div>
);

export default ErrorState;
