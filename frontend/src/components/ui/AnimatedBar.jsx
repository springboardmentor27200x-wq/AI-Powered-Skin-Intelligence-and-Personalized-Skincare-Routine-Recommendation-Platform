import React from 'react';

/**
 * AnimatedBar — horizontal progress bar.
 * Width animates via CSS transition on mount.
 */
const AnimatedBar = ({
  value = 0,       // 0–100
  color,           // CSS color string; defaults to brand green
  height = 6,      // px
  delay = 0,       // ms
  rounded = true,
  bg = '#f0ede7',
  label,           // optional aria label
}) => {
  const barColor = color ?? 'var(--color-brand)';
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div
      className="w-full overflow-hidden"
      style={{
        height,
        backgroundColor: bg,
        borderRadius: rounded ? 9999 : 0,
      }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className="h-full"
        style={{
          width: `${pct}%`,
          backgroundColor: barColor,
          borderRadius: rounded ? 9999 : 0,
          transition: `width 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
        }}
      />
    </div>
  );
};

export default AnimatedBar;
