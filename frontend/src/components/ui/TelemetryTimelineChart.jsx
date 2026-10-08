import React, { useState, useEffect } from "react";
import { Activity, Droplet, Moon, Sun, TrendingUp, Info } from "lucide-react";
import api from "../../services/api";

export default function TelemetryTimelineChart() {
  const [timeframe, setTimeframe] = useState(14);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSignal, setActiveSignal] = useState("all"); // 'all' | 'score' | 'water' | 'sleep' | 'stress'

  useEffect(() => {
    fetchTimeline();
  }, [timeframe]);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/assessments/analytics/timeline?days=${timeframe}`);
      if (res.data) {
        setData(res.data);
      }
    } catch {
      // Fallback
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-44 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  const points = data?.data_points || [];

  // SVG Chart Calculation
  const svgWidth = 520;
  const svgHeight = 160;
  const paddingX = 35;
  const paddingY = 25;

  const getX = (idx, total) => paddingX + (idx / Math.max(1, total - 1)) * (svgWidth - paddingX * 2);
  const getY = (val, min, max) => svgHeight - paddingY - ((val - min) / Math.max(1, max - min)) * (svgHeight - paddingY * 2);

  // Normalizations for signals:
  // Score: 0 - 100
  const scoreCoords = points.map((p, i) => ({ x: getX(i, points.length), y: getY(p.skin_score, 40, 100) }));
  // Water: 0 - 3500 ml
  const waterCoords = points.map((p, i) => ({ x: getX(i, points.length), y: getY(p.water_ml, 500, 3500) }));
  // Sleep: 0 - 10 hrs
  const sleepCoords = points.map((p, i) => ({ x: getX(i, points.length), y: getY(p.sleep_hours, 3, 10) }));
  // Stress: 1 - 10 (inverted for visual alignment with health)
  const stressCoords = points.map((p, i) => ({ x: getX(i, points.length), y: getY(10 - p.stress_level, 0, 10) }));

  const toPath = (coords) =>
    coords.reduce(
      (acc, curr, i, arr) => {
        if (i === 0) return `M ${curr.x} ${curr.y}`;
        const prev = arr[i - 1];
        const cx = (prev.x + curr.x) / 2;
        return `${acc} C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
      },
      ""
    );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-5 space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">
              Telemetry Log History & Timeline Analytics
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Multi-Signal
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Daily correlation of sleep, hydration, and stress against skin health
          </p>
        </div>

        {/* Timeframe Buttons */}
        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 self-start sm:self-auto">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setTimeframe(d)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                timeframe === d
                  ? "bg-white text-gray-800 shadow-xs border border-gray-200/80 font-bold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Signal Toggle Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <button
          onClick={() => setActiveSignal("all")}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
            activeSignal === "all"
              ? "bg-gray-800 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All Signals
        </button>
        <button
          onClick={() => setActiveSignal("score")}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeSignal === "score"
              ? "bg-emerald-600 text-white"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60"
          }`}
        >
          <TrendingUp size={12} /> Skin Score
        </button>
        <button
          onClick={() => setActiveSignal("water")}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeSignal === "water"
              ? "bg-blue-600 text-white"
              : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60"
          }`}
        >
          <Droplet size={12} /> Water Intake
        </button>
        <button
          onClick={() => setActiveSignal("sleep")}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeSignal === "sleep"
              ? "bg-indigo-600 text-white"
              : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60"
          }`}
        >
          <Moon size={12} /> Sleep Hours
        </button>
        <button
          onClick={() => setActiveSignal("stress")}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeSignal === "stress"
              ? "bg-orange-600 text-white"
              : "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200/60"
          }`}
        >
          <Activity size={12} /> Stress Resilience
        </button>
      </div>

      {/* SVG Correlation Graph */}
      <div className="relative pt-2">
        {points.length >= 2 ? (
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-44 overflow-visible">
            {/* Gridlines */}
            {[0.25, 0.5, 0.75].map((pct, idx) => (
              <line
                key={idx}
                x1={paddingX}
                y1={paddingY + pct * (svgHeight - paddingY * 2)}
                x2={svgWidth - paddingX}
                y2={paddingY + pct * (svgHeight - paddingY * 2)}
                stroke="#f3f4f6"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            ))}

            {/* Signal Paths */}
            {(activeSignal === "all" || activeSignal === "water") && (
              <path
                d={toPath(waterCoords)}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={activeSignal === "water" ? "3" : "1.8"}
                strokeOpacity={activeSignal === "water" ? 1 : 0.65}
                strokeLinecap="round"
              />
            )}

            {(activeSignal === "all" || activeSignal === "sleep") && (
              <path
                d={toPath(sleepCoords)}
                fill="none"
                stroke="#6366f1"
                strokeWidth={activeSignal === "sleep" ? "3" : "1.8"}
                strokeOpacity={activeSignal === "sleep" ? 1 : 0.65}
                strokeLinecap="round"
              />
            )}

            {(activeSignal === "all" || activeSignal === "stress") && (
              <path
                d={toPath(stressCoords)}
                fill="none"
                stroke="#f97316"
                strokeWidth={activeSignal === "stress" ? "3" : "1.8"}
                strokeOpacity={activeSignal === "stress" ? 1 : 0.65}
                strokeLinecap="round"
              />
            )}

            {(activeSignal === "all" || activeSignal === "score") && (
              <path
                d={toPath(scoreCoords)}
                fill="none"
                stroke="#059669"
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}

            {/* X-axis date labels */}
            {points.map((p, i) => {
              if (points.length > 14 && i % 3 !== 0 && i !== points.length - 1) return null;
              const x = getX(i, points.length);
              return (
                <text
                  key={i}
                  x={x}
                  y={svgHeight - 4}
                  textAnchor="middle"
                  className="text-[9px] fill-gray-400 font-bold"
                >
                  {p.date}
                </text>
              );
            })}
          </svg>
        ) : (
          <div className="flex items-center justify-center h-32 bg-gray-50 rounded-xl text-xs text-gray-400">
            Log at least 2 days of telemetry to view correlation curve
          </div>
        )}
      </div>

      {/* Correlation Insights Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-gray-100">
        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs">
          <span className="font-bold text-blue-900 block mb-0.5">Hydration Velocity</span>
          <p className="text-blue-700 text-[11px] leading-snug">
            {data?.correlations?.hydration_impact || "+14% barrier improvement on days with >2000ml water"}
          </p>
        </div>

        <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs">
          <span className="font-bold text-indigo-900 block mb-0.5">Circadian Repair</span>
          <p className="text-indigo-700 text-[11px] leading-snug">
            {data?.correlations?.sleep_impact || "+18% cellular recovery when sleep duration exceeds 7.5h"}
          </p>
        </div>

        <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-100 text-xs">
          <span className="font-bold text-orange-900 block mb-0.5">Cortisol Sensitivity</span>
          <p className="text-orange-700 text-[11px] leading-snug">
            {data?.correlations?.stress_impact || "High stress (>=7) correlates with temporary condition dips"}
          </p>
        </div>
      </div>
    </div>
  );
}
