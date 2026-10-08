import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * SafetyWarning — orange safety banner for allergen/sensitivity exclusions per §19 spec.
 */

const SafetyWarning = ({ message, reason }) => (
  <div
    className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-[var(--radius-lg)] px-4 py-3"
    role="alert"
    aria-live="polite"
  >
    <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
    <div>
      <p className="text-xs font-bold text-amber-800">{message ?? 'Not recommended'}</p>
      {reason && (
        <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">{reason}</p>
      )}
    </div>
  </div>
);

export default SafetyWarning;
