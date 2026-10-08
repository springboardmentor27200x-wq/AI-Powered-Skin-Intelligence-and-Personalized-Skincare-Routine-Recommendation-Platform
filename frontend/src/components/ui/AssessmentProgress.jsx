import React from 'react';

/**
 * AssessmentProgress — step counter + animated progress bar for wizards.
 */
const AssessmentProgress = ({ currentStep, totalSteps, stepLabel }) => {
  const pct = Math.round(((currentStep) / totalSteps) * 100);

  return (
    <div className="w-full">
      {/* Step text */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
          Step {currentStep} of {totalSteps}
          {stepLabel && <span className="text-[var(--color-text-muted)]"> · {stepLabel}</span>}
        </span>
        <span className="text-[10px] font-bold text-[var(--color-text-muted)]">{pct}%</span>
      </div>

      {/* Progress track */}
      <div
        className="h-1 bg-[var(--color-border)] rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Assessment step ${currentStep} of ${totalSteps}`}
      >
        <div
          className="h-full rounded-full bg-[var(--color-brand)] transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default AssessmentProgress;
