import React, { useEffect, useRef } from 'react';

/**
 * ScoreRing — animated SVG circular gauge for skin health score.
 * Animates from 0 → score on mount.
 */
const scoreTheme = (score) => {
  if (score >= 75) return { color: '#22c55e', label: 'Excellent', textClass: 'text-emerald-600' };
  if (score >= 55) return { color: '#f59e0b', label: 'Fair',      textClass: 'text-amber-600'  };
  return               { color: '#ef4444', label: 'Needs Care', textClass: 'text-red-600'    };
};

const ScoreRing = ({
  score = 0,
  size = 120,
  stroke = 9,
  showLabel = true,
  animate = true,
  darkMode = false,
}) => {
  const circleRef = useRef(null);
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const targetDash = (Math.min(100, Math.max(0, score)) / 100) * circ;
  const theme = scoreTheme(score);

  useEffect(() => {
    if (!animate || !circleRef.current) return;
    circleRef.current.style.strokeDasharray = `0 ${circ}`;
    const raf = requestAnimationFrame(() => {
      setTimeout(() => {
        if (circleRef.current) {
          circleRef.current.style.transition = 'stroke-dasharray 1.4s cubic-bezier(0.4, 0, 0.2, 1)';
          circleRef.current.style.strokeDasharray = `${targetDash} ${circ}`;
        }
      }, 100);
    });
    return () => cancelAnimationFrame(raf);
  }, [score, circ, targetDash, animate]);

  const textColor = darkMode ? '#ffffff' : theme.color;
  const trackColor = darkMode ? 'rgba(255,255,255,0.08)' : '#f0ede7';

  return (
    <div
      className="relative flex-shrink-0 flex flex-col items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Skin health score: ${score} out of 100, ${theme.label}`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        {/* Score arc */}
        <circle
          ref={circleRef}
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={theme.color} strokeWidth={stroke}
          strokeDasharray={animate ? `0 ${circ}` : `${targetDash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-black leading-none tabular-nums"
          style={{ fontSize: size * 0.22, color: textColor }}
        >
          {score}
        </span>
        {showLabel && (
          <span
            className="font-semibold uppercase tracking-wider leading-none mt-1"
            style={{ fontSize: size * 0.085, color: darkMode ? 'rgba(255,255,255,0.5)' : '#a09890' }}
          >
            {theme.label}
          </span>
        )}
      </div>
    </div>
  );
};

export { scoreTheme };
export default ScoreRing;
