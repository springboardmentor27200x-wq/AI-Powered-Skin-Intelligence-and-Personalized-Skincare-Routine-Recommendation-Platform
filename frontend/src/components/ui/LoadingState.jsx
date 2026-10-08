import React from 'react';

/**
 * LoadingState — skeleton-based loading state per §30 spec.
 * Matches real layout shape to avoid content layout shift.
 */

export const SkeletonLine = ({ width = 'w-full', height = 'h-3', className = '' }) => (
  <div className={`skeleton rounded-[var(--radius-md)] ${width} ${height} ${className}`} />
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-white border border-[var(--color-border)] rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-sm)] space-y-3 ${className}`}>
    <SkeletonLine width="w-1/3" height="h-4" />
    <SkeletonLine width="w-full" height="h-3" />
    <SkeletonLine width="w-4/5" height="h-3" />
    <SkeletonLine width="w-2/3" height="h-3" />
  </div>
);

export const SkeletonDashboard = () => (
  <div className="space-y-5 animate-fade-in">
    {/* Header skeleton */}
    <div className="bg-[var(--color-sidebar-bg)] rounded-[var(--radius-2xl)] p-6 flex items-center justify-between">
      <div className="space-y-2 flex-1">
        <div className="w-24 h-3 bg-white/10 rounded" />
        <div className="w-40 h-6 bg-white/10 rounded" />
        <div className="w-56 h-3 bg-white/10 rounded" />
      </div>
      <div className="w-24 h-24 rounded-full bg-white/10 flex-shrink-0" />
    </div>
    {/* 2-col grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <SkeletonCard className="h-64" />
      <SkeletonCard className="h-64" />
    </div>
    {/* 4 tiles */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-[var(--radius-xl)]" />)}
    </div>
  </div>
);

export const SkeletonAssessment = () => (
  <div className="space-y-5 animate-fade-in">
    <SkeletonCard className="h-24" />
    <SkeletonCard className="h-48" />
    <SkeletonCard className="h-36" />
  </div>
);

export const SkeletonList = ({ count = 3 }) => (
  <div className="space-y-3 animate-fade-in">
    {[...Array(count)].map((_, i) => <SkeletonCard key={i} />)}
  </div>
);

// Generic spinner (use sparingly — prefer skeleton)
export const Spinner = ({ size = 24, className = '' }) => (
  <div
    className={`border-2 border-[var(--color-border-strong)] border-t-[var(--color-brand)] rounded-full animate-spin ${className}`}
    style={{ width: size, height: size }}
    role="status"
    aria-label="Loading"
  />
);

// Analysis sequence component for assessment
export const AnalysisProgress = ({ steps, currentStep }) => (
  <div className="space-y-3" role="status" aria-live="polite">
    {steps.map((step, i) => {
      const done    = i < currentStep;
      const active  = i === currentStep;
      const pending = i > currentStep;
      return (
        <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${pending ? 'opacity-30' : 'opacity-100'}`}>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
            done   ? 'bg-[var(--color-brand)]' :
            active ? 'bg-white/20 border-2 border-white/40' :
                     'bg-white/10'
          }`}>
            {done && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M2 5l2.5 2.5L8 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {active && (
              <div className="w-2 h-2 bg-white rounded-full animate-pulse-slow" />
            )}
          </div>
          <p className={`text-sm font-medium ${
            done   ? 'text-[var(--color-brand)] line-through opacity-60' :
            active ? 'text-white' :
                     'text-white/40'
          }`}>
            {step}
          </p>
        </div>
      );
    })}
  </div>
);
