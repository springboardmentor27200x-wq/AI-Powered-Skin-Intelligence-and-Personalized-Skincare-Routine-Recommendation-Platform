import React from 'react';
import { Sparkles, Calendar } from 'lucide-react';
import { formatRoleName } from '../../utils/formatters';

export function WelcomeBanner({ user }) {
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white p-6 sm:p-8 shadow-sm">
      {/* Background ambient glow */}
      <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-32 -bottom-16 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Skin Intelligence Hub • {formatRoleName(user?.role)}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back, {user?.full_name || 'User'}
          </h1>
          <p className="mt-1.5 text-sm text-slate-300 max-w-xl leading-relaxed">
            Your personalized skincare & wellness tracking dashboard. Keep your profiles updated to build the foundation for future intelligent insights.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-300 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 self-start md:self-auto">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>{todayFormatted}</span>
        </div>
      </div>
    </div>
  );
}
