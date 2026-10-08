import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, CloudRain, Snowflake, Wind, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

export default function SeasonalAdvisoryCard({ environment, seasonalRoutine, className = '' }) {
  const month = new Date().getMonth() + 1; // 1-12

  let seasonData;
  if ([12, 1, 2].includes(month)) {
    seasonData = {
      name: 'Winter Cryo-Defense',
      period: 'Winter Season (Dec – Feb)',
      icon: Snowflake,
      accentColor: 'from-blue-600 to-indigo-700',
      climate: 'Low ambient humidity, cold winds, dry indoor heating',
      tewlRisk: 'High (Accelerated stratum corneum delipidation)',
      priorityActives: ['Ceramides NP/AP/EOP', 'Squalane', 'Cholesterol', 'Colloidal Oat'],
      advisory: 'Low environmental moisture accelerates Transepidermal Water Loss (TEWL). Prioritize rich lipid replenishment creams, reduce chemical exfoliation frequency to 1x weekly, and avoid steaming hot water cleanses.',
    };
  } else if ([3, 4, 5].includes(month)) {
    seasonData = {
      name: 'Spring Renewal & Allergen Shield',
      period: 'Spring Transition (Mar – May)',
      icon: Wind,
      accentColor: 'from-emerald-600 to-teal-700',
      climate: 'Rising UV levels, pollen allergen surges, fluctuating humidity',
      tewlRisk: 'Moderate (Sensory hyper-reactivity peaks)',
      priorityActives: ['Madecassoside', 'Allantoin', 'Trehalose', 'Centella Asiatica'],
      advisory: 'Atmospheric allergen counts trigger neuro-sensory redness and histaminic reactivity. Introduce adaptogenic soothing botanicals and reinforce the skin envelope with medium-weight moisture balance.',
    };
  } else if ([6, 7, 8].includes(month)) {
    seasonData = {
      name: 'Summer Photo-Protection & Sebum Balance',
      period: 'Summer Season (Jun – Aug)',
      icon: Sun,
      accentColor: 'from-amber-500 to-orange-600',
      climate: 'High UV index (UV 8+), elevated heat, sweat-induced follicular occlusion',
      tewlRisk: 'Low–Moderate (Sebum oxidation & hyperpigmentation risk)',
      priorityActives: ['Zinc Oxide (Non-Nano)', 'Niacinamide (5%)', 'Vitamin C', 'Zinc PCA'],
      advisory: 'Elevated ambient heat accelerates sebaceous gland excretion. Use non-comedogenic gel-creams, apply broad-spectrum mineral SPF 50+ every 2 hours outdoors, and incorporate antioxidants to neutralize solar free radicals.',
    };
  } else {
    seasonData = {
      name: 'Autumn / Monsoon Barrier Equilibrium',
      period: 'Autumn & Monsoon Season (Sep – Nov)',
      icon: CloudRain,
      accentColor: 'from-teal-600 to-cyan-700',
      climate: 'Shifting humidity gradients, fungal acne flare risk, atmospheric particulates',
      tewlRisk: 'Moderate (Microbial microbiome imbalance)',
      priorityActives: ['Zinc PCA', 'Hyaluronic Acid', 'Thermal Spring Water', 'Multi-Ceramides'],
      advisory: 'Transitioning atmospheric humidity demands lightweight humectant layering that prevents trans-epidermal moisture loss without suffocating pores or encouraging microbial follicular imbalance.',
    };
  }

  const IconComponent = seasonData.icon;

  return (
    <div className={`bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
      {/* Top Banner */}
      <div className={`bg-gradient-to-r ${seasonData.accentColor} p-6 text-white relative overflow-hidden`}>
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold uppercase tracking-wider border border-white/20">
              <IconComponent size={14} />
              {seasonData.period}
            </div>
            <h3 className="text-xl font-black tracking-tight">{seasonData.name}</h3>
            <p className="text-xs text-white/80 max-w-xl leading-relaxed">
              {seasonData.climate}
            </p>
          </div>

          <Link
            to="/routine"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 hover:bg-white/90 text-xs font-bold rounded-xl shadow-md transition-all self-start md:self-auto flex-shrink-0 cursor-pointer"
          >
            <span>View Seasonal Steps</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Body Insights */}
      <div className="p-6 space-y-4">
        {/* Advisory Quote */}
        <div className="p-4 rounded-2xl bg-[#f8faf9] border border-gray-100 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#4a8c6e] flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldCheck size={18} />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Chief Dermatologist Climate Advisory
            </span>
            <p className="text-xs text-gray-700 leading-relaxed">
              "{seasonData.advisory}"
            </p>
          </div>
        </div>

        {/* Priority Actives Matrix */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
              Formulation Actives Recommended This Season
            </span>
            <div className="flex flex-wrap gap-1.5">
              {seasonData.priorityActives.map((act, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80"
                >
                  {act}
                </span>
              ))}
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-gray-100 sm:pl-4 flex-shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Stratum Corneum TEWL Risk
            </span>
            <span className="text-xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-block mt-1">
              {seasonData.tewlRisk}
            </span>
          </div>
        </div>

        {/* Seasonal Routine Steps Preview */}
        {(() => {
          const seasonalSteps = Array.isArray(seasonalRoutine)
            ? seasonalRoutine
            : (seasonalRoutine?.steps || []);
          if (seasonalSteps.length === 0) return null;
          return (
            <div className="pt-2 border-t border-gray-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                Your Prescribed Seasonal Adaptation Regimen ({seasonalSteps.length} Steps)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {seasonalSteps.map((st, i) => (
                  <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400">Step {i + 1}</span>
                      <span className="text-[9px] font-bold text-emerald-700 uppercase">{st.category}</span>
                    </div>
                    <p className="text-xs font-bold text-gray-800 line-clamp-1">{st.title}</p>
                    {st.key_actives?.length > 0 && (
                      <p className="text-[10px] text-gray-500 line-clamp-1">
                        {st.key_actives.join(' · ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
