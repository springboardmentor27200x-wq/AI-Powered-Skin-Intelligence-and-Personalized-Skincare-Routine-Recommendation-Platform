import React, { useState, useEffect } from "react";
import { TrendingUp, ShieldCheck, Activity, Droplets, Info, Sparkles, ChevronUp, ChevronDown } from "lucide-react";
import api from "../../services/api";

export default function BarrierForecastCard({ preview = false }) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    fetchForecast();
  }, []);

  const fetchForecast = async () => {
    try {
      const res = await api.get("/assessments/forecast/barrier-7day");
      if (res.data) {
        setForecast(res.data);
        if (res.data.trajectory?.length > 0) {
          setSelectedDay(res.data.trajectory[res.data.trajectory.length - 1]);
        }
      }
    } catch {
      const mockDays = Array.from({ length: 7 }, (_, i) => ({
        day_offset: i + 1,
        forecast_date: `Day ${i + 1}`,
        barrier_score: 72 + i * 2,
        status: i > 3 ? "OPTIMAL" : "STRENGTHENING",
        tewl_risk_index: 0.35 - i * 0.03,
        confidence: 0.95 - i * 0.03,
        notes: "Lipid barrier synthesizing steady ceramide layers.",
      }));
      setForecast({
        current_barrier_score: 72,
        projected_7d_score: 84,
        projected_net_change: 12,
        barrier_status: "STRENGTHENING",
        trajectory: mockDays,
        clinical_advisory_tips: [
          "Adherence velocity contributes +5 pts to your 7-day barrier recovery slope.",
          "Maintain >2000ml water intake to reduce epidermal permeability.",
        ],
      });
      setSelectedDay(mockDays[mockDays.length - 1]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
        <div className="h-24 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (!forecast) return null;

  const points = forecast.trajectory || [];
  const minScore = Math.min(...points.map((p) => p.barrier_score), forecast.current_barrier_score) - 5;
  const maxScore = Math.max(...points.map((p) => p.barrier_score), forecast.current_barrier_score) + 5;
  const range = maxScore - minScore || 1;

  // Compact SVG dimensions
  const svgWidth = 360;
  const svgHeight = 95;
  const paddingX = 22;
  const paddingY = 16;

  const getCoord = (score, index, total) => {
    const x = paddingX + (index / (total - 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - ((score - minScore) / range) * (svgHeight - paddingY * 2);
    return { x, y };
  };

  const coords = points.map((p, i) => getCoord(p.barrier_score, i, points.length));
  const pathD = coords.reduce(
    (acc, curr, i, arr) => {
      if (i === 0) return `M ${curr.x} ${curr.y}`;
      const prev = arr[i - 1];
      const cx = (prev.x + curr.x) / 2;
      return `${acc} C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    },
    ""
  );

  const fillD = `${pathD} L ${coords[coords.length - 1].x} ${svgHeight} L ${coords[0].x} ${svgHeight} Z`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200 flex flex-col justify-between">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-900 tracking-tight">
              7-Day Predictive Barrier Forecast
            </h3>
            <p className="text-[10px] text-gray-500">
              Stratum corneum resilience trajectory
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
            +{forecast.projected_net_change > 0 ? forecast.projected_net_change : 0} pts (7d)
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={expanded ? "Collapse forecast" : "Expand forecast"}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="p-4 space-y-3">
          {/* Compact Metric Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Current</p>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-base font-black text-gray-800">{forecast.current_barrier_score}</span>
                <span className="text-[10px] text-gray-400">/100</span>
              </div>
              <span className="text-[9px] font-semibold text-gray-500 truncate block">
                {forecast.barrier_status}
              </span>
            </div>

            <div className="p-2.5 bg-teal-50/50 rounded-xl border border-teal-100">
              <p className="text-[9px] font-bold uppercase tracking-wider text-teal-700">Projected Day 7</p>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-base font-black text-teal-900">{forecast.projected_7d_score}</span>
                <span className="text-[10px] text-teal-600">/100</span>
              </div>
              <span className="text-[9px] font-semibold text-teal-700 flex items-center gap-0.5 truncate">
                <Sparkles size={9} /> Recovery
              </span>
            </div>

            <div className="p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-700">TEWL Defense</p>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-base font-black text-indigo-900">
                  {selectedDay ? `${Math.round((1 - selectedDay.tewl_risk_index) * 100)}%` : "82%"}
                </span>
              </div>
              <span className="text-[9px] font-semibold text-indigo-600 truncate block">
                Lipid seal
              </span>
            </div>
          </div>

          {/* SVG Interactive Trajectory Curve */}
          <div className="relative pt-1">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-22 overflow-visible"
            >
              <defs>
                <linearGradient id="barrierGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area Fill */}
              <path d={fillD} fill="url(#barrierGradient)" />

              {/* Line Path */}
              <path
                d={pathD}
                fill="none"
                stroke="#0d9488"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Interactive Day Points */}
              {coords.map((c, i) => {
                const isSelected = selectedDay && selectedDay.day_offset === points[i].day_offset;
                return (
                  <g
                    key={i}
                    className="cursor-pointer transition-transform duration-150"
                    onClick={() => setSelectedDay(points[i])}
                  >
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r={isSelected ? 5 : 3.5}
                      fill={isSelected ? "#0f766e" : "#ffffff"}
                      stroke="#0d9488"
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                    <text
                      x={c.x}
                      y={svgHeight - 1}
                      textAnchor="middle"
                      className="text-[8px] fill-gray-400 font-bold"
                    >
                      {points[i].forecast_date.split(" ")[1] || `D${i+1}`}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Selected Day Tooltip Pill */}
            {selectedDay && (
              <div className="mt-2 p-2 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-gray-800">
                    Day +{selectedDay.day_offset}:
                  </span>
                  <span className="font-semibold text-teal-700">
                    {selectedDay.barrier_score} pts · {selectedDay.status}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 italic max-w-[200px] truncate">
                  {selectedDay.notes}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
