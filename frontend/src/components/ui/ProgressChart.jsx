import React, { useState, useRef } from 'react';

/**
 * ProgressChart — Pure React + SVG responsive interactive line chart.
 * Zero external dependencies (no recharts required) to ensure 100% reliability
 * across Docker containers, CI/CD, and local dev environments.
 */

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const ProgressChart = ({
  data = [],
  lines = [
    { key: 'score', name: 'Skin Health Score', color: 'var(--color-brand, #2d5a4c)' },
  ],
  height = 240,
}) => {
  const [hoverIndex, setHoverIndex] = useState(null);
  const containerRef = useRef(null);

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-[var(--color-surface-2)] rounded-[var(--radius-xl)] border border-[var(--color-border)]"
        style={{ height }}
      >
        <p className="text-xs text-[var(--color-text-muted)] font-medium">No assessment history recorded yet.</p>
      </div>
    );
  }

  // Dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const padLeft = 40;
  const padRight = 24;
  const padTop = 20;
  const padBottom = 35;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  // Y-Scale: 0 to 100
  const minY = 0;
  const maxY = 100;

  const getX = (index) => {
    if (data.length <= 1) return padLeft + chartW / 2;
    return padLeft + (index / (data.length - 1)) * chartW;
  };

  const getY = (val) => {
    const clamped = Math.max(minY, Math.min(maxY, Number(val) || 0));
    return padTop + chartH - ((clamped - minY) / (maxY - minY)) * chartH;
  };

  // Generate smooth cubic bezier SVG path
  const makePath = (key) => {
    if (data.length === 0) return '';
    if (data.length === 1) {
      const x = getX(0);
      const y = getY(data[0][key]);
      return `M ${x - 20} ${y} L ${x + 20} ${y}`;
    }

    const points = data.map((d, i) => ({ x: getX(i), y: getY(d[key]) }));
    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  // Generate area fill path
  const makeAreaPath = (key) => {
    if (data.length === 0) return '';
    const linePath = makePath(key);
    const lastX = getX(data.length - 1);
    const firstX = getX(0);
    const bottomY = padTop + chartH;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const yTicks = [0, 25, 50, 75, 100];
  const activePoint = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : null;

  const handleMouseMove = (e) => {
    if (!containerRef.current || data.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const svgRelX = (relX / rect.width) * svgWidth;

    let closestIdx = 0;
    let minDiff = Infinity;

    data.forEach((_, i) => {
      const px = getX(i);
      const diff = Math.abs(px - svgRelX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    });

    setHoverIndex(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none"
      style={{ height }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-label="Skin score progress chart"
    >
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          {lines.map((line, idx) => (
            <linearGradient key={idx} id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={line.color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={line.color} stopOpacity="0.0" />
            </linearGradient>
          ))}
        </defs>

        {/* Horizontal Gridlines & Y-Axis Labels */}
        {yTicks.map((tick) => {
          const y = getY(tick);
          return (
            <g key={tick}>
              <line
                x1={padLeft}
                y1={y}
                x2={svgWidth - padRight}
                y2={y}
                stroke="var(--color-border, #e6e4df)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={y + 3.5}
                textAnchor="end"
                fontSize="10"
                fill="var(--color-text-muted, #9ca3af)"
                fontFamily="sans-serif"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* X-Axis Date Labels */}
        {data.map((d, i) => {
          // Filter labels to avoid crowding
          const showLabel =
            data.length <= 8 ||
            i === 0 ||
            i === data.length - 1 ||
            i % Math.ceil(data.length / 6) === 0;

          if (!showLabel) return null;
          const x = getX(i);
          return (
            <text
              key={i}
              x={x}
              y={svgHeight - 10}
              textAnchor="middle"
              fontSize="10"
              fill="var(--color-text-muted, #9ca3af)"
              fontFamily="sans-serif"
            >
              {formatDate(d.date || d.created_at)}
            </text>
          );
        })}

        {/* Area Fills */}
        {lines.map((line, idx) => (
          <path
            key={`area-${idx}`}
            d={makeAreaPath(line.key)}
            fill={`url(#grad-${idx})`}
          />
        ))}

        {/* Curves */}
        {lines.map((line, idx) => (
          <path
            key={`line-${idx}`}
            d={makePath(line.key)}
            fill="none"
            stroke={line.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Data points */}
        {lines.map((line) =>
          data.map((d, i) => {
            const x = getX(i);
            const y = getY(d[line.key]);
            const isHovered = hoverIndex === i;

            return (
              <g key={`pt-${line.key}-${i}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : 4}
                  fill={isHovered ? 'white' : line.color}
                  stroke={line.color}
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150 cursor-pointer"
                />
              </g>
            );
          })
        )}

        {/* Hover vertical guideline */}
        {hoverIndex !== null && (
          <line
            x1={getX(hoverIndex)}
            y1={padTop}
            x2={getX(hoverIndex)}
            y2={padTop + chartH}
            stroke="var(--color-brand, #2d5a4c)"
            strokeDasharray="3 3"
            strokeWidth="1.5"
            opacity="0.6"
          />
        )}
      </svg>

      {/* Floating Tooltip HTML Overlay */}
      {hoverIndex !== null && activePoint && (
        <div
          className="absolute z-20 pointer-events-none bg-white border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] px-3 py-2 text-xs transition-all duration-100 -translate-x-1/2 -translate-y-full"
          style={{
            left: `${(getX(hoverIndex) / svgWidth) * 100}%`,
            top: `${Math.max(10, (getY(activePoint[lines[0]?.key || 'score']) / svgHeight) * 100 - 6)}%`,
          }}
        >
          <p className="text-[10px] font-semibold text-[var(--color-text-muted)] mb-1">
            {formatDate(activePoint.date || activePoint.created_at)}
          </p>
          {lines.map((l, idx) => (
            <div key={idx} className="flex items-center gap-2 font-bold">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="text-[var(--color-text-primary)]">{l.name}:</span>
              <span style={{ color: l.color }}>{activePoint[l.key] ?? '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProgressChart;
