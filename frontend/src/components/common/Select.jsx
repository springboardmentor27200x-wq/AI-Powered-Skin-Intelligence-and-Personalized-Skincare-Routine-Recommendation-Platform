import React, { forwardRef } from 'react';

export const Select = forwardRef(function Select(
  {
    label,
    id,
    options = [],
    error,
    helperText,
    required = false,
    className = '',
    placeholder = 'Select an option...',
    ...props
  },
  ref
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        required={required}
        className={`block w-full rounded-xl border transition-all text-sm text-slate-900 bg-white px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent ${
          error
            ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
            : 'border-slate-200 hover:border-slate-300 focus:ring-emerald-500 focus:border-emerald-500'
        } ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value || opt.id : opt;
          const labelText = typeof opt === 'object' ? opt.label || opt.name : opt;
          return (
            <option key={val} value={val}>
              {labelText}
            </option>
          );
        })}
      </select>
      {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
      {!error && helperText && <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>}
    </div>
  );
});
