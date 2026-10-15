import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Activity, Moon, Droplets, UserCheck, ArrowUpRight } from 'lucide-react';

export function QuickActions() {
  const actions = [
    {
      title: 'Update Skin Profile',
      desc: 'Skin type, age & active concerns',
      to: '/skin-profile',
      icon: Sparkles,
      color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
    },
    {
      title: 'Update Lifestyle Data',
      desc: 'Habits, screen time & sun exposure',
      to: '/lifestyle',
      icon: Activity,
      color: 'bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200',
    },
    {
      title: 'Log Sleep Entry',
      desc: 'Duration, quality & bedtime',
      to: '/sleep',
      icon: Moon,
      color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200',
    },
    {
      title: 'Log Water Intake',
      desc: 'Record today’s hydration',
      to: '/hydration',
      icon: Droplets,
      color: 'bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <Link
            key={act.title}
            to={act.to}
            className={`p-4 rounded-2xl border transition flex flex-col justify-between group shadow-sm bg-white hover:border-emerald-300 hover:shadow-md`}
          >
            <div className="flex items-start justify-between">
              <div className={`p-2.5 rounded-xl border ${act.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                {act.title}
              </h4>
              <p className="text-xs text-slate-500 mt-1">{act.desc}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
