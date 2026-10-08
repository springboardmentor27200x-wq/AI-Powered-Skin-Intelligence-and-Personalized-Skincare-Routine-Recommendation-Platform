import React, { useState, useEffect } from 'react';
import RoutineStep from './RoutineStep';
import api from '../../services/api';

/**
 * RoutineTimeline — tabbed container for AM/PM/Weekly/Seasonal routines.
 * Manages local step-completion state with live backend adherence syncing.
 */

const TABS = [
  { key: 'morning', label: 'Morning' },
  { key: 'evening', label: 'Evening' },
  { key: 'weekly',  label: 'Weekly'  },
  { key: 'seasonal', label: 'Seasonal Adaptation' },
];

const getTodayKey = () => new Date().toISOString().split('T')[0];

const loadChecked = (routineType) => {
  try {
    const raw = localStorage.getItem(`routine_checked_${routineType}_${getTodayKey()}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

const saveChecked = (routineType, state) => {
  try {
    localStorage.setItem(`routine_checked_${routineType}_${getTodayKey()}`, JSON.stringify(state));
  } catch { /* ignore */ }
};

const RoutineTimeline = ({ plan }) => {
  const [activeTab, setActiveTab] = useState('morning');
  const [checked, setChecked] = useState(() => {
    return {
      morning: loadChecked('morning'),
      evening: loadChecked('evening'),
      weekly:  loadChecked('weekly'),
      seasonal: loadChecked('seasonal'),
    };
  });

  // Sync with backend today_completed_step_ids on mount
  useEffect(() => {
    if (plan?.today_completed_step_ids?.length > 0) {
      const serverSet = new Set(plan.today_completed_step_ids);
      setChecked(prev => {
        const next = { ...prev };
        ['morning', 'evening', 'weekly', 'seasonal'].forEach(t => {
          const tSteps = plan[t]?.steps || [];
          const tabMap = { ...next[t] };
          tSteps.forEach(s => {
            if (serverSet.has(String(s.id))) {
              tabMap[s.id] = true;
            }
          });
          next[t] = tabMap;
        });
        return next;
      });
    }
  }, [plan]);

  const handleCheck = async (stepId, isChecked) => {
    setChecked(prev => {
      const updated = { ...prev[activeTab], [stepId]: isChecked };
      const next = { ...prev, [activeTab]: updated };
      saveChecked(activeTab, updated);
      return next;
    });

    // Sync live with backend adherence engine
    try {
      await api.post('/routines/adherence/toggle', {
        routine_step_id: stepId,
        completed: isChecked,
      });
    } catch {
      // Fallback silently persists locally
    }
  };

  const activeRoutine = plan?.[activeTab];
  const steps = activeRoutine?.steps ?? [];
  const checkedMap = checked[activeTab] ?? {};
  const completedCount = steps.filter(s => checkedMap[s.id]).length;

  // Hide tabs that don't exist
  const availableTabs = TABS.filter(t => plan?.[t.key]?.steps?.length > 0);

  return (
    <div>
      {/* Tab bar */}
      {availableTabs.length > 1 && (
        <div className="flex gap-1 mb-5 bg-[var(--color-surface-3)] rounded-[var(--radius-lg)] p-1" role="tablist">
          {availableTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`flex-1 py-2 text-xs font-semibold rounded-[var(--radius-md)] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] ${
                activeTab === tab.key
                  ? 'bg-white text-[var(--color-brand-dark)] shadow-[var(--shadow-xs)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Completion counter & Adherence score indicator */}
      {steps.length > 0 && (
        <div className="flex items-center justify-between mb-3 bg-gray-50/70 px-3 py-2 rounded-xl border border-gray-100">
          <div className="flex items-center gap-2">
            <p className="text-xs text-[var(--color-text-muted)]">
              Tap step number to mark complete
            </p>
            {plan?.adherence_score !== undefined && (
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                {plan.adherence_score}% Adherence Score
              </span>
            )}
          </div>
          <span className="text-xs font-bold text-[var(--color-text-secondary)]">
            {completedCount} / {steps.length}
          </span>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-2" role="tabpanel">
        {steps.length > 0 ? (
          steps.map((step, i) => (
            <RoutineStep
              key={step.id ?? i}
              step={step}
              index={i}
              checked={!!checkedMap[step.id]}
              onCheck={handleCheck}
            />
          ))
        ) : (
          <p className="text-xs text-[var(--color-text-muted)] text-center py-6">
            No steps in this routine phase.
          </p>
        )}
      </div>
    </div>
  );
};

export default RoutineTimeline;
