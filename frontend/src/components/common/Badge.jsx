import React from 'react';

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  onRemove,
}) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    wellness: 'bg-teal-50 text-teal-700 border-teal-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-medium px-2.5 py-1',
    lg: 'text-sm font-medium px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border ${variants[variant] || variants.default} ${
        sizes[size] || sizes.md
      } ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === 'primary' || variant === 'wellness'
              ? 'bg-emerald-500'
              : variant === 'danger'
              ? 'bg-rose-500'
              : variant === 'warning'
              ? 'bg-amber-500'
              : 'bg-slate-400'
          }`}
        />
      )}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 hover:text-slate-900 focus:outline-none p-0.5 rounded"
        >
          ×
        </button>
      )}
    </span>
  );
}
