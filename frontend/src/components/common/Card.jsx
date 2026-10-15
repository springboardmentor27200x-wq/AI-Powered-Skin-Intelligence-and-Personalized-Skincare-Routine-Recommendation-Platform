import React from 'react';

export function Card({
  children,
  title,
  subtitle,
  icon: Icon,
  action,
  className = '',
  bodyClassName = 'p-6',
  headerClassName = 'p-6 pb-4 border-b border-slate-100',
  footer,
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-100 overflow-hidden transition-all ${className}`}
    >
      {(title || subtitle || Icon || action) && (
        <div className={`flex items-center justify-between ${headerClassName}`}>
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              {title && <h3 className="font-semibold text-slate-900 text-base">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
      {footer && <div className="p-4 bg-slate-50 border-t border-slate-100">{footer}</div>}
    </div>
  );
}
