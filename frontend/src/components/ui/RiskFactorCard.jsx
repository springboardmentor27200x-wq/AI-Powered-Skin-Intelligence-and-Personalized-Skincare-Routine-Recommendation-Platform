import React from 'react';
import { Brain, Moon, Droplet, Activity, Sun, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import AnimatedBar from './AnimatedBar';
import PriorityBadge from './PriorityBadge';

/**
 * RiskFactorCard — per §15 spec.
 * Factor, Impact, Evidence from user data, Suggested action.
 */

const RISK_META = {
  STRESS:      { label: 'Stress',       Icon: Brain,    color: '#f97316', bg: '#fff7ed', border: '#fed7aa', route: '/lifestyle'   },
  SLEEP:       { label: 'Sleep',        Icon: Moon,     color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', route: '/sleep'        },
  HYDRATION:   { label: 'Hydration',    Icon: Droplet,  color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', route: '/hydration'   },
  LIFESTYLE:   { label: 'Lifestyle',    Icon: Activity, color: '#10b981', bg: '#f0fdf4', border: '#a7f3d0', route: '/lifestyle'   },
  ENVIRONMENT: { label: 'Environment',  Icon: Sun,      color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', route: '/environment' },
};

const impactBarColor = (level) => {
  if (level === 'HIGH')     return '#ef4444';
  if (level === 'MODERATE') return '#f59e0b';
  return '#22c55e';
};

const RiskFactorCard = ({ risk, index = 0 }) => {
  const meta = RISK_META[risk.factor_type] ?? RISK_META['LIFESTYLE'];
  const { Icon } = meta;
  const barColor = impactBarColor(risk.impact_level);
  const barValue = risk.ml_probability
    ? Math.round(risk.ml_probability * 100)
    : risk.impact_score ?? 50;

  return (
    <div
      className="bg-white border rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow duration-200"
      style={{ borderColor: meta.border }}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: meta.bg }}
        >
          <Icon size={18} style={{ color: meta.color }} aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-sm font-bold text-[var(--color-text-primary)]">{meta.label}</p>
            <PriorityBadge priority={risk.impact_level} />
          </div>

          {/* Bar */}
          <div className="mb-2">
            <AnimatedBar value={barValue} color={barColor} height={5} delay={index * 80} />
          </div>

          {/* Evidence / description */}
          {risk.description && (
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-2">
              {risk.description}
            </p>
          )}

          {/* Action link */}
          <Link
            to={meta.route}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] transition-colors"
            aria-label={`Log ${meta.label} data`}
          >
            Update {meta.label} log
            <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export { RISK_META };
export default RiskFactorCard;
