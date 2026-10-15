import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export function Alert({ type = 'info', title, children, className = '' }) {
  const configs = {
    info: {
      bg: 'bg-sky-50 border-sky-200 text-sky-900',
      icon: Info,
      iconColor: 'text-sky-600',
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: AlertCircle,
      iconColor: 'text-rose-600',
    },
  };

  const current = configs[type] || configs.info;
  const Icon = current.icon;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${current.bg} ${className}`}>
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${current.iconColor}`} />
      <div className="text-sm">
        {title && <h4 className="font-semibold mb-0.5">{title}</h4>}
        <div className="text-slate-700 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
