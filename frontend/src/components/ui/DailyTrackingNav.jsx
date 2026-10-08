import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Moon, Droplet, Sun, ArrowRight, ArrowLeft, LayoutDashboard, CheckCircle2, ChevronRight } from 'lucide-react';

export const TRACKING_STEPS = [
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    title: 'Lifestyle & Habits',
    path: '/lifestyle',
    icon: Activity,
    stepNum: 1,
    desc: 'Activity, alcohol, stress',
  },
  {
    id: 'sleep',
    name: 'Sleep',
    title: 'Circadian Sleep',
    path: '/sleep',
    icon: Moon,
    stepNum: 2,
    desc: 'Sleep duration & quality',
  },
  {
    id: 'hydration',
    name: 'Hydration',
    title: 'Hydration Volume',
    path: '/hydration',
    icon: Droplet,
    stepNum: 3,
    desc: 'Daily water intake',
  },
  {
    id: 'environment',
    name: 'Environment',
    title: 'Environmental Exposome',
    path: '/environment',
    icon: Sun,
    stepNum: 4,
    desc: 'UV index & climate',
  },
];

/**
 * DailyTrackingNav — Seamless stepper & navigation for daily tracking entries.
 */
export const DailyTrackingNav = ({ currentStep = 'lifestyle', showStepper = true, showBottomBar = true }) => {
  const currentIndex = TRACKING_STEPS.findIndex(s => s.id === currentStep);
  const current = TRACKING_STEPS[currentIndex] || TRACKING_STEPS[0];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === TRACKING_STEPS.length - 1;

  const prevStep = !isFirst ? TRACKING_STEPS[currentIndex - 1] : null;
  const nextStep = !isLast ? TRACKING_STEPS[currentIndex + 1] : null;

  return (
    <div className="space-y-4 my-2">
      {/* ── Top Stepper Bar ── */}
      {showStepper && (
        <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-2xl)] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border-light)]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-brand-light)] text-[var(--color-brand-dark)]">
                Daily Flow • Step {current.stepNum} of 4
              </span>
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                {current.title}
              </span>
            </div>

            {/* Quick action: Next or Dashboard */}
            {isLast ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-brand-dark)] hover:text-[var(--color-brand)] bg-[var(--color-brand-light)] hover:bg-emerald-100 px-3 py-1 rounded-xl transition-colors"
              >
                <LayoutDashboard size={14} />
                <span>Go to Dashboard</span>
                <ArrowRight size={13} />
              </Link>
            ) : (
              <Link
                to={nextStep.path}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-brand-dark)] hover:text-[var(--color-brand)] bg-[var(--color-brand-light)] hover:bg-emerald-100 px-3 py-1 rounded-xl transition-colors"
              >
                <span>Next: {nextStep.name}</span>
                <ArrowRight size={13} />
              </Link>
            )}
          </div>

          {/* Stepper pills grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
            {TRACKING_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isPassed = idx < currentIndex;

              return (
                <Link
                  key={step.id}
                  to={step.path}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left group ${
                    isActive
                      ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)] shadow-sm'
                      : isPassed
                      ? 'bg-emerald-50/70 hover:bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-[var(--color-surface-2)] hover:bg-gray-100 text-[var(--color-text-secondary)] border-[var(--color-border)]'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : isPassed
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 size={15} /> : step.stepNum}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-[var(--color-text-primary)]'}`}>
                      {step.name}
                    </p>
                    <p className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-[var(--color-text-muted)]'}`}>
                      {step.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Bottom Page Bar ── */}
      {showBottomBar && (
        <div className="bg-gradient-to-r from-white via-[var(--color-surface-2)] to-white border border-[var(--color-border)] rounded-[var(--radius-2xl)] p-4 shadow-[var(--shadow-sm)] flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
            <span className="font-bold text-[var(--color-text-primary)]">
              Daily Tracking Progress:
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-brand)]">
              Step {current.stepNum} of 4 ({Math.round((current.stepNum / 4) * 100)}%)
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {isFirst ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-[var(--color-border)] hover:bg-gray-50 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs font-bold rounded-xl transition-colors"
              >
                <LayoutDashboard size={14} />
                <span>Dashboard</span>
              </Link>
            ) : (
              <Link
                to={prevStep.path}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-[var(--color-border)] hover:bg-gray-50 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs font-bold rounded-xl transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Previous: {prevStep.name}</span>
              </Link>
            )}

            {isLast ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2 bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <LayoutDashboard size={15} />
                <span>All Done! Go to Dashboard</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <Link
                to={nextStep.path}
                className="inline-flex items-center gap-2 px-5 py-2 bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <span>Next: {nextStep.name}</span>
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyTrackingNav;
