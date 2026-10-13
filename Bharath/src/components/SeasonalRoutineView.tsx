import React, { useState } from "react";
import { SkinProfile, PageRoute } from "../types";
import {
  Season,
  SEASONS_DATA,
  generateSeasonalRoutine,
} from "../services/seasonalRoutineService";
import { api } from "../services/api";
import {
  Sun,
  Snowflake,
  Flower2,
  Leaf,
  CloudRain,
  ShieldCheck,
  ArrowRight,
  Droplet,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShoppingBag,
  Plus,
  Compass,
  ThermometerSun,
  Moon,
} from "lucide-react";

interface SeasonalRoutineViewProps {
  skinProfile: SkinProfile | null;
  onNavigate?: (route: PageRoute) => void;
  onProductAddedToShelf?: () => void;
}

export const SeasonalRoutineView: React.FC<SeasonalRoutineViewProps> = ({
  skinProfile,
  onNavigate,
  onProductAddedToShelf,
}) => {
  const getDefaultSeason = (): Season => {
    const month = new Date().getMonth();
    if (month >= 5 && month <= 7) return "summer";
    if (month >= 8 && month <= 10) return "autumn";
    if (month === 11 || month === 0 || month === 1) return "winter";
    return "spring";
  };

  const [selectedSeason, setSelectedSeason] = useState<Season>(getDefaultSeason());
  const [subTab, setSubTab] = useState<"routine" | "swaps" | "habits">("routine");
  const [addingProductId, setAddingProductId] = useState<number | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const seasonalPlan = generateSeasonalRoutine(selectedSeason, skinProfile);
  const climate = seasonalPlan.climate_impact;

  const handleAddSwapToShelf = async (product: {
    id: number;
    name: string;
    brand: string;
    category: string;
  }) => {
    setAddingProductId(product.id);
    try {
      const assignedSlot =
        product.category === "Sunscreen"
          ? ["AM_4"]
          : product.category === "Cleanser"
          ? ["AM_1", "PM_1"]
          : product.category === "Moisturizer"
          ? ["AM_3", "PM_3"]
          : ["AM_2"];

      await api.addToShelf(
        product.id,
        assignedSlot,
        `Added from Seasonal Routine (${seasonalPlan.climate_impact.name})`
      );

      setSuccessToast(`Added ${product.name} to your Skincare Shelf!`);
      if (onProductAddedToShelf) {
        onProductAddedToShelf();
      }
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      console.error("Failed to add to shelf:", err);
    } finally {
      setAddingProductId(null);
    }
  };

  const seasonTabs: { id: Season; label: string; icon: any }[] = [
    { id: "summer", label: "Summer", icon: Sun },
    { id: "winter", label: "Winter", icon: Snowflake },
    { id: "spring", label: "Spring", icon: Flower2 },
    { id: "autumn", label: "Autumn", icon: Leaf },
    { id: "monsoon", label: "Monsoon", icon: CloudRain },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Season Switcher */}
      <div className="bg-white rounded-2xl border border-[#EAE6DE] p-6 shadow-2xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#8C857B] mb-1 font-medium">
              <span>Climate & Chrono-Dermatology</span>
              <span aria-hidden="true">·</span>
              <span>Personalized Adaptation</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#2E2C29]">
              Seasonal Skincare Protocol
            </h2>
            <p className="text-xs text-[#6E685E] mt-1 max-w-2xl leading-relaxed">
              Ambient temperature, relative humidity, and UV levels alter your stratum corneum lipid barrier and sebum secretion rate. Select a season to adapt your steps.
            </p>
          </div>

          {/* Clean Segmented Season Switcher */}
          <div className="flex items-center p-1 bg-[#F5F2EB] rounded-xl self-start md:self-auto overflow-x-auto max-w-full">
            {seasonTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedSeason === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedSeason(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-white text-[#2E2C29] shadow-2xs"
                      : "text-[#6E685E] hover:text-[#2E2C29]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#5A6D5C]" : "text-[#8C857B]"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Climate & Skin Impact Summary Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5 border-t border-[#F2EDE4]">
          {/* Column 1: Dermatological Impact */}
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5A6D5C]">
                {climate.name.split("/")[0]} Assessment for {skinProfile?.skin_type || "Oily"} Skin
              </span>
              <span className="text-xs text-[#8C857B]">·</span>
              <span className="text-xs font-medium text-[#6E685E]">
                Barrier Stress: <strong className="text-[#2E2C29]">{seasonalPlan.barrier_stress_rating}</strong>
              </span>
            </div>
            <p className="text-xs text-[#4A4742] leading-relaxed">
              {seasonalPlan.personalized_skin_note}
            </p>
          </div>

          {/* Column 2: Climate Metrics */}
          <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EAE6DE] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#8C857B]">Temperature:</span>
              <span className="font-semibold text-[#2E2C29]">{climate.temp_range.split("(")[0]}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8C857B]">Relative Humidity:</span>
              <span className="font-semibold text-[#2E2C29]">{climate.humidity_level}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8C857B]">UV Index:</span>
              <span className="font-semibold text-amber-700">{climate.uv_index_range}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#EAE6DE]">
              <span className="text-[#8C857B]">TEWL Risk:</span>
              <span className="font-bold text-[#5A6D5C]">{climate.tewl_risk}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-medium">{successToast}</span>
        </div>
      )}

      {/* Neat Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#EAE6DE] pb-2">
        <button
          onClick={() => setSubTab("routine")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            subTab === "routine"
              ? "bg-[#5A6D5C] text-white shadow-2xs"
              : "text-[#6E685E] hover:text-[#2E2C29] hover:bg-[#F2EDE4]"
          }`}
        >
          Daily Step Modifications (AM & PM)
        </button>
        <button
          onClick={() => setSubTab("swaps")}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            subTab === "swaps"
              ? "bg-[#5A6D5C] text-white shadow-2xs"
              : "text-[#6E685E] hover:text-[#2E2C29] hover:bg-[#F2EDE4]"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Curated Product Swaps ({seasonalPlan.recommended_swaps.length})</span>
        </button>
        <button
          onClick={() => setSubTab("habits")}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            subTab === "habits"
              ? "bg-[#5A6D5C] text-white shadow-2xs"
              : "text-[#6E685E] hover:text-[#2E2C29] hover:bg-[#F2EDE4]"
          }`}
        >
          <ThermometerSun className="w-3.5 h-3.5" />
          <span>Climate Lifestyle Habits</span>
        </button>
      </div>

      {/* Sub-Tab 1: Routine Step Modifications */}
      {subTab === "routine" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Morning Adjustments */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#EAE6DE]">
                <Sun className="w-4 h-4 text-amber-600" />
                <h3 className="font-serif font-bold text-base text-[#2E2C29]">
                  Morning (AM) Adjustments
                </h3>
              </div>

              <div className="space-y-3">
                {seasonalPlan.morning_adjustments.map((step) => (
                  <div
                    key={step.step_number}
                    className="p-4 rounded-xl bg-white border border-[#EAE6DE] shadow-2xs space-y-2 hover:border-[#8BA88E] transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-serif font-bold text-[#8C857B]">Step 0{step.step_number}</span>
                      <span className="font-medium text-[#5A6D5C]">{step.category}</span>
                    </div>

                    <h4 className="font-serif text-sm font-bold text-[#2E2C29]">
                      {step.title}
                    </h4>

                    <p className="text-xs text-[#4A4742] leading-relaxed">
                      {step.seasonal_adaptation}
                    </p>

                    <div className="pt-2 border-t border-[#F2EDE4] flex items-center gap-1 text-[11px] text-[#8C857B]">
                      <span className="font-medium text-[#2E2C29]">Actives:</span>
                      <span>{step.recommended_actives.join(", ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Evening Adjustments */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#EAE6DE]">
                <Moon className="w-4 h-4 text-indigo-600" />
                <h3 className="font-serif font-bold text-base text-[#2E2C29]">
                  Evening (PM) Adjustments
                </h3>
              </div>

              <div className="space-y-3">
                {seasonalPlan.evening_adjustments.map((step) => (
                  <div
                    key={step.step_number}
                    className="p-4 rounded-xl bg-white border border-[#EAE6DE] shadow-2xs space-y-2 hover:border-[#8BA88E] transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-serif font-bold text-[#8C857B]">Step 0{step.step_number}</span>
                      <span className="font-medium text-indigo-700">{step.category}</span>
                    </div>

                    <h4 className="font-serif text-sm font-bold text-[#2E2C29]">
                      {step.title}
                    </h4>

                    <p className="text-xs text-[#4A4742] leading-relaxed">
                      {step.seasonal_adaptation}
                    </p>

                    <div className="pt-2 border-t border-[#F2EDE4] flex items-center gap-1 text-[11px] text-[#8C857B]">
                      <span className="font-medium text-[#2E2C29]">Actives:</span>
                      <span>{step.recommended_actives.join(", ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly Treatments */}
          <div className="bg-white rounded-2xl border border-[#EAE6DE] p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#F2EDE4] pb-3">
              <Calendar className="w-4 h-4 text-teal-700" />
              <h3 className="font-serif font-bold text-base text-[#2E2C29]">
                Weekly Seasonal Targeted Interventions
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {seasonalPlan.weekly_adjustments.map((step) => (
                <div key={step.step_number} className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DE] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-teal-800">{step.category}</span>
                    <span className="text-[11px] text-[#8C857B]">Weekly #{step.step_number}</span>
                  </div>
                  <h4 className="font-serif text-sm font-bold text-[#2E2C29]">{step.title}</h4>
                  <p className="text-xs text-[#555048] leading-relaxed">{step.seasonal_adaptation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Curated Product Swaps */}
      {subTab === "swaps" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#6E685E]">
              Replace heavier or uncalibrated formulas with these seasonal clinical alternatives to maintain stratum corneum equilibrium.
            </p>
            {onNavigate && (
              <button
                onClick={() => onNavigate("/products")}
                className="text-xs font-semibold text-[#5A6D5C] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Browse Full Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {seasonalPlan.recommended_swaps.map((prod) => (
              <div
                key={prod.id}
                className="bg-white rounded-xl border border-[#EAE6DE] p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-[#8BA88E] transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8C857B] font-semibold">{prod.category}</span>
                    <span className="font-bold text-[#2E2C29]">${prod.price.toFixed(2)}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#8C857B] uppercase tracking-wider block">{prod.brand}</span>
                    <h4 className="font-serif text-sm font-bold text-[#2E2C29] leading-snug">{prod.name}</h4>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#EAE6DE] text-xs space-y-1">
                    <span className="text-[11px] font-semibold text-amber-800 block">
                      Swap out: {prod.swap_from}
                    </span>
                    <p className="text-[11px] text-[#6E685E] leading-relaxed">{prod.swap_reason}</p>
                  </div>

                  <p className="text-xs text-[#4A4742] leading-relaxed">
                    <strong className="text-[#2E2C29]">Benefit:</strong> {prod.season_benefit}
                  </p>

                  <div className="text-[11px] text-[#8C857B] pt-1">
                    Actives: <span className="text-[#2E2C29] font-medium">{prod.key_actives.join(", ")}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleAddSwapToShelf(prod)}
                  disabled={addingProductId === prod.id}
                  className="w-full py-2 px-3 rounded-lg bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{addingProductId === prod.id ? "Adding..." : "Add to Shelf"}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Climate Lifestyle Habits */}
      {subTab === "habits" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {seasonalPlan.lifestyle_climate_tips.map((tip, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl bg-white border border-[#EAE6DE] shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5A6D5C]">
                  {tip.category}
                </span>
                <h4 className="font-serif text-sm font-bold text-[#2E2C29]">
                  {tip.title}
                </h4>
                <p className="text-xs text-[#6E685E] leading-relaxed">
                  {tip.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#F2EDE4] flex items-center justify-between text-xs">
                <span className="text-[#8C857B]">Recommended Target:</span>
                <span className="font-semibold text-[#2E2C29]">{tip.target_metric}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
