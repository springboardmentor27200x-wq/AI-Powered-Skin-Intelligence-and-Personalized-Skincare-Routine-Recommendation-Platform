import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { Card } from '../common/Card';
import { ProgressBar } from '../common/ProgressBar';

export function ProfileCompletionCard({ completion }) {
  const percentage = completion?.completion_percentage || 0;

  const milestones = [
    { name: 'Skin Profile', completed: completion?.skin_profile_completed, link: '/skin-profile', points: '+40%' },
    { name: 'Lifestyle Habits', completed: completion?.lifestyle_completed, link: '/lifestyle', points: '+30%' },
    { name: 'Sleep Log', completed: completion?.has_sleep_records, link: '/sleep', points: '+15%' },
    { name: 'Hydration Log', completed: completion?.has_hydration_records, link: '/hydration', points: '+15%' },
  ];

  return (
    <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Profile Readiness Score</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete your foundational records to prepare for upcoming AI skin analysis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-emerald-600 tracking-tight">{percentage}%</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Ready</span>
        </div>
      </div>

      <ProgressBar value={percentage} max={100} showLabel={false} size="lg" variant="primary" className="mb-5" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
        {milestones.map((m) => (
          <Link
            key={m.name}
            to={m.link}
            className={`p-3 rounded-xl border text-left transition flex flex-col justify-between group ${
              m.completed
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">{m.name}</span>
              {m.completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Circle className="w-4 h-4 text-slate-300 group-hover:text-emerald-400" />
              )}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className={`text-[11px] font-medium ${m.completed ? 'text-emerald-700' : 'text-slate-400'}`}>
                {m.completed ? 'Completed' : 'Pending'}
              </span>
              <span className="text-[10px] font-bold text-slate-400">{m.points}</span>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
