import React from 'react';
import { Link } from 'react-router-dom';
import { Moon, Plus, Clock, Sparkles } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { formatDate } from '../../utils/formatters';

export function SleepSummaryCard({ recentSleep, averageSleepHours }) {
  if (!recentSleep) {
    return (
      <Card
        title="Sleep Tracking"
        subtitle="Duration & quality logging"
        icon={Moon}
        action={
          <Link
            to="/sleep"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
          >
            Log <Plus className="w-3.5 h-3.5" />
          </Link>
        }
      >
        <div className="py-6 text-center">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
            <Moon className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-700">No sleep records logged</p>
          <p className="text-xs text-slate-500 mt-1 mb-4">Track nightly sleep duration and restorative quality</p>
          <Link
            to="/sleep"
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 shadow-sm"
          >
            Log Sleep Entry
          </Link>
        </div>
      </Card>
    );
  }

  const qualityVariants = {
    Poor: 'danger',
    Fair: 'warning',
    Good: 'primary',
    Excellent: 'purple',
  };

  return (
    <Card
      title="Sleep Tracking"
      subtitle="Sleep duration & quality"
      icon={Moon}
      action={
        <Link
          to="/sleep"
          className="text-xs font-semibold text-purple-600 hover:text-purple-700 inline-flex items-center gap-1"
        >
          View All <Plus className="w-3.5 h-3.5" />
        </Link>
      }
    >
      <div className="space-y-3">
        <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-purple-600 uppercase tracking-wider block">
              Latest ({formatDate(recentSleep.record_date)})
            </span>
            <div className="text-lg font-black text-slate-900 mt-0.5">
              {recentSleep.sleep_duration_hours} <span className="text-xs font-normal text-slate-500">hours</span>
            </div>
          </div>
          <Badge variant={qualityVariants[recentSleep.sleep_quality] || 'primary'} size="sm" dot>
            {recentSleep.sleep_quality} Quality
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Average Sleep</span>
            <span className="font-bold text-slate-800 text-sm mt-0.5 block">
              {averageSleepHours ? `${averageSleepHours} hrs` : `${recentSleep.sleep_duration_hours} hrs`}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Bedtime / Wake</span>
            <span className="font-bold text-slate-800 text-sm mt-0.5 block truncate">
              {recentSleep.bedtime || '--'} → {recentSleep.wake_time || '--'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
