const SEGMENTS = [
  { label: "Condition", weight: 35, color: "#2F6B57" },
  { label: "Lifestyle", weight: 20, color: "#4B8F76" },
  { label: "Routine", weight: 20, color: "#D98E82" },
  { label: "Sleep", weight: 15, color: "#E4A597" },
  { label: "Hydration", weight: 10, color: "#F2D3CA" },
];

const RADIUS = 84;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function SkinScoreDial() {
  let offset = 0;
  const arcs = SEGMENTS.map((seg) => {
    const length = (seg.weight / 100) * CIRCUMFERENCE;
    const gap = 4;
    const arc = {
      ...seg,
      dasharray: `${length - gap} ${CIRCUMFERENCE - (length - gap)}`,
      dashoffset: -offset,
    };
    offset += length;
    return arc;
  });

  return (
    <div className="relative flex flex-col items-center">
      <svg
        viewBox="0 0 200 200"
        width="260"
        height="260"
        className="animate-[spin_1.4s_ease-out_1]"
        style={{ transformOrigin: "50% 50%" }}
      >
        <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="#E4DED4" strokeWidth="14" />
        {arcs.map((arc) => (
          <circle
            key={arc.label}
            cx="100"
            cy="100"
            r={RADIUS}
            fill="none"
            stroke={arc.color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={arc.dasharray}
            strokeDashoffset={arc.dashoffset}
            transform="rotate(-90 100 100)"
          />
        ))}
        <text
          x="100"
          y="94"
          textAnchor="middle"
          className="fill-ink font-mono"
          style={{ fontSize: "34px", fontWeight: 500 }}
        >
          82
        </text>
        <text x="100" y="118" textAnchor="middle" className="fill-clinical-500 font-body" style={{ fontSize: "11px" }}>
          SKIN HEALTH SCORE
        </text>
      </svg>

      <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-xs text-ink/70">
        {SEGMENTS.map((seg) => (
          <li key={seg.label} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.color }} />
            {seg.label} &middot; {seg.weight}%
          </li>
        ))}
      </ul>
    </div>
  );
}
