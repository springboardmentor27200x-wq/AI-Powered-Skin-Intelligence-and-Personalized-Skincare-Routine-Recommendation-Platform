import React from 'react';
import { Link } from 'react-router-dom';
import { Droplets, Plus } from 'lucide-react';
import { Card } from '../common/Card';
import { ProgressBar } from '../common/ProgressBar';
import { formatMl } from '../../utils/formatters';

export function HydrationSummaryCard({ todayHydrationMl = 0, onQuickAdd }) {
  const goalMl = 2000;
  const percentage = Math.min(100, Math.round((todayHydrationMl / goalMl) * 100));
  const glasses = Math.round(todayHydrationMl / 250);

  return (
    <Card
      title="Hydration Tracking"
      subtitle="Daily water intake tracker"
      icon={Droplets}
      action={
        <Link
          to="/hydration"
          className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
        >
          History <Plus className="w-3.5 h-3.5" />
        </Link>
      }
    >
      <div className="space-y-3">
        <div className="p-3.5 rounded-xl bg-sky-50/50 border border-sky-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-sky-600 uppercase tracking-wider block">Today's Intake</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {formatMl(todayHydrationMl)}{' '}
              <span className="text-xs font-normal text-slate-500">/ {formatMl(goalMl)} goal</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-sky-600">~{glasses} glasses</span>
            <span className="block text-[10px] text-slate-400">250ml each</span>
          </div>
        </div>

        <ProgressBar value={percentage} max={100} label="Daily Hydration Goal" showLabel={true} size="md" variant="primary" />

        {onQuickAdd && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500">Quick Log:</span>
            <button
              onClick={() => onQuickAdd(250)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition border border-sky-200"
            >
              +250 ml (Cup)
            </button>
            <button
              onClick={() => onQuickAdd(500)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition border border-sky-200"
            >
              +500 ml (Bottle)
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
