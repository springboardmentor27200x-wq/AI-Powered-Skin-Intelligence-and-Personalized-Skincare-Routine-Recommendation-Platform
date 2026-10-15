import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Activity,
  Moon,
  Droplets,
  Settings,
  Shield,
  HeartHandshake,
  PackageSearch,
  ListChecks,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function Sidebar() {
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Skin Profile', href: '/skin-profile', icon: Sparkles },
    { name: 'Lifestyle', href: '/lifestyle', icon: Activity },
    { name: 'Sleep Tracking', href: '/sleep', icon: Moon },
    { name: 'Hydration', href: '/hydration', icon: Droplets },
    { name: 'Routine & Progress', href: '/routine', icon: ListChecks },
    { name: 'Ingredient Match', href: '/recommendations', icon: PackageSearch },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  if (user?.role === 'ADMINISTRATOR') {
    navigation.push({ name: 'User Management', href: '/admin/users', icon: Shield, badge: 'Admin' });
  }

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col fixed inset-y-0 pt-16 border-r border-slate-200/80 bg-white">
      <div className="flex-1 flex flex-col min-h-0 px-4 py-6">
        <div className="space-y-1 flex-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Core Modules
          </div>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-100 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Milestone info banner in sidebar */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-sm mt-auto">
          <div className="flex items-center gap-2 mb-1.5">
            <HeartHandshake className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Skin Intelligence</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Personalized assessments, ingredient guidance, product matching, and routine progress tracking.
          </p>
        </div>
      </div>
    </aside>
  );
}
