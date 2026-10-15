import React from 'react';

export function ProgressBar({
  value = 0,
  max = 100,
  showLabel = true,
  label,
  size = 'md',
  variant = 'primary',
  className = '',
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const barColors = {
    primary: 'bg-emerald-500',
    wellness: 'bg-teal-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
  };

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-medium text-slate-700">
          <span>{label || 'Progress'}</span>
          <span className="font-semibold text-slate-900">{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${sizeClasses[size] || sizeClasses.md}`}>
        <div
          className={`h-full transition-all duration-500 ease-out rounded-full ${
            barColors[variant] || barColors.primary
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
