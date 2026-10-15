import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Edit3, Sun, Monitor, Dumbbell } from 'lucide-react';
import { Card } from '../common/Card';

export function LifestyleSummaryCard({ lifestyle }) {
  if (!lifestyle) {
    return (
      <Card
        title="Lifestyle & Exposures"
        subtitle="Activity, screen time & environment"
        icon={Activity}
        action={
          <Link
            to="/lifestyle"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
          >
            Create <Edit3 className="w-3 h-3" />
          </Link>
        }
      >
        <div className="py-6 text-center">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
            <Activity className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-700">No lifestyle profile recorded</p>
          <p className="text-xs text-slate-500 mt-1 mb-4">Track physical activity, outdoor exposures and screen habits</p>
          <Link
            to="/lifestyle"
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 shadow-sm"
          >
            Add Lifestyle Information
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Lifestyle & Exposures"
      subtitle="Daily habits & environment"
      icon={Activity}
      action={
        <Link
          to="/lifestyle"
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
        >
          Edit <Edit3 className="w-3 h-3" />
        </Link>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
          <Dumbbell className="w-4 h-4 text-teal-600 mt-0.5" />
          <div>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">Activity</span>
            <span className="text-xs font-bold text-slate-800">{lifestyle.physical_activity}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
          <Monitor className="w-4 h-4 text-sky-600 mt-0.5" />
          <div>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">Screen Time</span>
            <span className="text-xs font-bold text-slate-800">{lifestyle.screen_time_hours} hrs / day</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5 col-span-2">
          <Sun className="w-4 h-4 text-amber-500 mt-0.5" />
          <div>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">Outdoor & Sun</span>
            <span className="text-xs font-bold text-slate-800">{lifestyle.outdoor_exposure}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Smoking: <strong className="text-slate-700">{lifestyle.smoking}</strong></span>
        <span>Alcohol: <strong className="text-slate-700">{lifestyle.alcohol_consumption}</strong></span>
      </div>
    </Card>
  );
}
