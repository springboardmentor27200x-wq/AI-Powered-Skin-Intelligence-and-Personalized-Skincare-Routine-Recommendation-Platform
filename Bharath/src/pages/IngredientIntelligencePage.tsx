import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  Ingredient,
  CustomAnalysisResult,
  IngredientCategory,
  PageRoute,
} from "../types";
import {
  Sparkles,
  Zap,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  BookOpen,
  Layers,
  ChevronRight,
  Info,
  Droplet,
  Sun,
  Moon,
  X,
  RefreshCw,
  FlaskConical,
  Flame,
  ArrowRight,
} from "lucide-react";

interface IngredientIntelligencePageProps {
  onNavigate: (route: PageRoute) => void;
}

export const IngredientIntelligencePage: React.FC<IngredientIntelligencePageProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"scanner" | "encyclopedia" | "matrix">("scanner");

  // Scanner state
  const [inciText, setInciText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<CustomAnalysisResult | null>(null);
  const [scanError, setScanError] = useState("");

  // Encyclopedia state
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoadingEncyclopedia, setIsLoadingEncyclopedia] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [maxComedogenic, setMaxComedogenic] = useState<number | "All">("All");
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  // Preset INCI lists for quick demonstration
  const presets = [
    {
      title: "Gentle Barrier Cream (Safe)",
      text: "Water/Aqua, Glycerin, Caprylic/Capric Triglyceride, Squalane, Ceramide NP, Cholesterol, Colloidal Oatmeal, Centella Asiatica Leaf Extract, Allantoin, Panthenol, Sodium Hyaluronate",
    },
    {
      title: "Pure Vitamin C Antioxidant Complex",
      text: "Aqua, Ascorbic Acid, Ethoxydiglycol, Glycerin, Ferulic Acid, Tocopherol, Panthenol, Sodium Hyaluronate, Phenoxyethanol",
    },
    {
      title: "Dangerous Retinol + AHA Peeling Clash",
      text: "Aqua, Retinol, Glycolic Acid, Salicylic Acid, Benzoyl Peroxide, Alcohol Denat, Fragrance/Parfum, Lanolin",
    },
    {
      title: "Clarifying Blemish & Pore Serum",
      text: "Aqua/Water, Niacinamide, Zinc PCA, Salicylic Acid, Camellia Sinensis Leaf Extract, Allantoin, Glycerin, Sodium Hyaluronate",
    },
  ];

  useEffect(() => {
    loadEncyclopedia();
    // Default scan on first load with preset
    handleAnalyze(presets[0].text);
  }, []);

  const loadEncyclopedia = async () => {
    setIsLoadingEncyclopedia(true);
    try {
      const data = await api.getIngredients();
      setIngredients(data || []);
    } catch {
      // Fallback
    } finally {
      setIsLoadingEncyclopedia(false);
    }
  };

  const handleAnalyze = async (textToScan?: string) => {
    const text = textToScan !== undefined ? textToScan : inciText;
    if (!text.trim()) {
      setScanError("Please enter an ingredients list to scan.");
      return;
    }
    setScanError("");
    setIsScanning(true);
    try {
      const res = await api.analyzeIngredients(text);
      setScanResult(res);
      if (textToScan !== undefined) {
        setInciText(textToScan);
      }
    } catch (err: any) {
      setScanError(err.message || "Failed to analyze ingredients.");
    } finally {
      setIsScanning(false);
    }
  };

  const categories = [
    "All",
    "Active",
    "Barrier & Lipid",
    "Hydrator",
    "Antioxidant",
    "Soothing",
    "Exfoliant",
    "Sunscreen Filter",
    "Emollient",
  ];

  const filteredIngredients = ingredients.filter((ing) => {
    if (selectedCategory !== "All" && ing.category !== selectedCategory) return false;
    if (maxComedogenic !== "All" && ing.comedogenic_rating > (maxComedogenic as number)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        ing.name.toLowerCase().includes(q) ||
        ing.inci_name.toLowerCase().includes(q) ||
        ing.common_names.some((cn) => cn.toLowerCase().includes(q)) ||
        ing.function.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-[#EAE6DE] rounded-2xl p-6 sm:p-7 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#8C857B] font-medium">
              <span>Scientific Ingredient Intelligence</span>
              <span aria-hidden="true">·</span>
              <span>INCI Bio-Mechanism & Conflict Engine</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2E2C29]">
              Ingredient Intelligence & Safety Scanner
            </h1>
            <p className="text-xs text-[#6E685E] max-w-2xl leading-relaxed">
              Scan raw cosmetic INCI ingredient decks for active clashes, allergen presence, comedogenic pore-clogging risks, and synergistic compound interactions.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => onNavigate("/products")}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-[#FAF8F5] text-[#2E2C29] border border-[#EAE6DE] transition-colors cursor-pointer"
            >
              <FlaskConical className="w-3.5 h-3.5 text-[#5A6D5C]" />
              <span>Explore Products</span>
            </button>
            <button
              onClick={() => onNavigate("/routine")}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white shadow-2xs transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-[#E8EFE9]" />
              <span>Daily Routine</span>
            </button>
          </div>
        </div>
      </div>

      {/* Segmented Control Tabs */}
      <div className="flex items-center gap-1 bg-[#F5F2EB] p-1 rounded-xl w-fit border border-[#EAE6DE]">
        <button
          onClick={() => setActiveTab("scanner")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "scanner"
              ? "bg-white text-[#2E2C29] shadow-2xs"
              : "text-[#6E685E] hover:text-[#2E2C29]"
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-[#5A6D5C]" />
          <span>INCI Safety Scanner</span>
        </button>
        <button
          onClick={() => setActiveTab("encyclopedia")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "encyclopedia"
              ? "bg-white text-[#2E2C29] shadow-2xs"
              : "text-[#6E685E] hover:text-[#2E2C29]"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-[#5A6D5C]" />
          <span>Ingredient Encyclopedia ({ingredients.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("matrix")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "matrix"
              ? "bg-white text-[#2E2C29] shadow-2xs"
              : "text-[#6E685E] hover:text-[#2E2C29]"
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5 text-[#5A6D5C]" />
          <span>Active Interaction Matrix</span>
        </button>
      </div>

      {/* TAB 1: INCI SAFETY SCANNER */}
      {activeTab === "scanner" && (
        <div className="space-y-8">
          {/* Scanner Input Panel */}
          <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-serif font-bold text-base text-[#333333]">
                  Enter Formulation Ingredients (INCI)
                </h3>
                <p className="text-xs text-[#7A746B]">
                  Paste comma-separated ingredients from cosmetics packaging or select an example preset:
                </p>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-mono text-[#7A746B] font-semibold">Presets:</span>
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnalyze(preset.text)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-[#F7F4EE] hover:bg-[#EFEAE0] text-[#333333] border border-[#E5E0D5] transition-colors cursor-pointer"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <textarea
                rows={4}
                value={inciText}
                onChange={(e) => setInciText(e.target.value)}
                placeholder="e.g. Water/Aqua, Glycerin, Niacinamide, Salicylic Acid, Zinc PCA, Sodium Hyaluronate..."
                className="w-full p-4 bg-[#FDFBF7] border border-[#E5E0D5] rounded-2xl text-xs focus:outline-none focus:border-[#5A6D5C] text-[#333333] leading-relaxed resize-y"
              />
            </div>

            {scanError && (
              <p className="text-xs text-[#B85D52] font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{scanError}</span>
              </p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#7A746B]">
                Checked against personal allergies & dermatological conflict rules
              </span>
              <button
                onClick={() => handleAnalyze()}
                disabled={isScanning}
                className="px-5 py-2.5 rounded-xl bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Formulation...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-[#E8EFE9]" />
                    <span>Run Clinical INCI Scan</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Analysis Results Display */}
          {scanResult && (
            <div className="space-y-6">
              {/* Score Meters & Key Findings */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 1. Safety Score */}
                <div className="bg-white border border-[#E5E0D5] rounded-3xl p-5 shadow-xs space-y-1">
                  <span className="text-[11px] font-mono text-[#7A746B] uppercase tracking-wider block">
                    Formulation Safety Score
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`font-serif font-bold text-3xl ${
                        scanResult.safety_score >= 80
                          ? "text-[#5A6D5C]"
                          : scanResult.safety_score >= 60
                          ? "text-[#D9A321]"
                          : "text-[#B85D52]"
                      }`}
                    >
                      {scanResult.safety_score}
                    </span>
                    <span className="text-xs text-[#7A746B]">/ 100</span>
                  </div>
                  <span className="text-[11px] text-[#555555] block">
                    {scanResult.safety_score >= 80
                      ? "High biocompatibility"
                      : scanResult.safety_score >= 60
                      ? "Moderate irritation potential"
                      : "Severe contraindications detected"}
                  </span>
                </div>

                {/* 2. Comedogenic Risk */}
                <div className="bg-white border border-[#E5E0D5] rounded-3xl p-5 shadow-xs space-y-1">
                  <span className="text-[11px] font-mono text-[#7A746B] uppercase tracking-wider block">
                    Pore-Clogging Potential
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`font-serif font-bold text-2xl ${
                        scanResult.comedogenic_risk === "Very Low" || scanResult.comedogenic_risk === "Low"
                          ? "text-[#5A6D5C]"
                          : scanResult.comedogenic_risk === "Moderate"
                          ? "text-[#D9A321]"
                          : "text-[#B85D52]"
                      }`}
                    >
                      {scanResult.comedogenic_risk}
                    </span>
                    <span className="text-xs text-[#7A746B]">({scanResult.max_comedogenic_rating}/5)</span>
                  </div>
                  <span className="text-[11px] text-[#555555] block">
                    {scanResult.max_comedogenic_rating <= 1 ? "Non-comedogenic formula" : "Pore occlusion possible"}
                  </span>
                </div>

                {/* 3. Allergen Matches */}
                <div className="bg-white border border-[#E5E0D5] rounded-3xl p-5 shadow-xs space-y-1">
                  <span className="text-[11px] font-mono text-[#7A746B] uppercase tracking-wider block">
                    Allergen Quarantine
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`font-serif font-bold text-2xl ${
                        scanResult.allergen_matches.length === 0 ? "text-[#5A6D5C]" : "text-[#B85D52]"
                      }`}
                    >
                      {scanResult.allergen_matches.length === 0 ? "PASSED" : `${scanResult.allergen_matches.length} MATCH`}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#555555] block">
                    {scanResult.allergen_matches.length === 0
                      ? "Zero user allergens detected"
                      : "Contains flagged allergens!"}
                  </span>
                </div>

                {/* 4. Ingredients Recognized */}
                <div className="bg-white border border-[#E5E0D5] rounded-3xl p-5 shadow-xs space-y-1">
                  <span className="text-[11px] font-mono text-[#7A746B] uppercase tracking-wider block">
                    INCI Index Match
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif font-bold text-2xl text-[#333333]">
                      {scanResult.known_ingredients}
                    </span>
                    <span className="text-xs text-[#7A746B]">/ {scanResult.total_ingredients_parsed} Parsed</span>
                  </div>
                  <span className="text-[11px] text-[#555555] block">
                    {scanResult.actives_found.length} active cellular compounds
                  </span>
                </div>
              </div>

              {/* Allergen & Sensitivity Quarantine Alert */}
              {scanResult.allergen_matches.length > 0 && (
                <div className="bg-[#FAF3F2] border border-[#B85D52]/40 rounded-3xl p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-[#B85D52]" />
                    <h4 className="font-serif font-bold text-sm text-[#B85D52]">
                      Personal Allergen Flagged in Formulation!
                    </h4>
                  </div>
                  <div className="space-y-1 text-xs text-[#6B4B48]">
                    {scanResult.allergen_matches.map((m, mIdx) => (
                      <p key={mIdx}>
                        • Ingredient <span className="font-bold font-mono">"{m.ingredient}"</span> matches your flagged allergy <span className="font-bold">"{m.user_allergen}"</span>.
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Clashes / Contraindications */}
              {scanResult.detected_conflicts.length > 0 && (
                <div className="bg-[#FAF3F2] border border-[#B85D52]/30 rounded-3xl p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-[#B85D52]" />
                    <h4 className="font-serif font-bold text-base text-[#B85D52]">
                      Active Ingredient Clashes Detected ({scanResult.detected_conflicts.length})
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {scanResult.detected_conflicts.map((conf, cIdx) => (
                      <div key={cIdx} className="bg-white/80 p-3.5 rounded-2xl border border-[#B85D52]/20 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#B85D52]">
                            {conf.ingredient1} + {conf.ingredient2}
                          </span>
                          <span className="text-[10px] font-mono uppercase bg-[#F4DCD9] text-[#B85D52] px-1.5 py-0.5 rounded">
                            {conf.severity} Risk
                          </span>
                        </div>
                        <p className="text-[#6B4B48] leading-relaxed">{conf.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Synergies Detected */}
              {scanResult.detected_synergies.length > 0 && (
                <div className="bg-[#F0F5F1] border border-[#8BA88E]/40 rounded-3xl p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#5A6D5C]" />
                    <h4 className="font-serif font-bold text-base text-[#5A6D5C]">
                      Synergistic Active Interactions ({scanResult.detected_synergies.length})
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {scanResult.detected_synergies.map((syn, sIdx) => (
                      <div key={sIdx} className="bg-white p-3.5 rounded-2xl border border-[#8BA88E]/30 space-y-1">
                        <span className="font-bold text-[#3B4D3D] block">
                          {syn.ingredient1} + {syn.ingredient2}
                        </span>
                        <p className="text-[#555555] leading-relaxed">{syn.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Usage Guidance */}
              <div className="bg-white border border-[#E5E0D5] rounded-3xl p-5 shadow-xs flex items-start gap-3.5 text-xs">
                <div className="w-8 h-8 rounded-xl bg-[#F0F5F1] text-[#5A6D5C] flex items-center justify-center shrink-0 mt-0.5">
                  <Info className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-[#333333] block">Clinical Usage Recommendation:</span>
                  <p className="text-[#555555] leading-relaxed">{scanResult.usage_recommendation}</p>
                </div>
              </div>

              {/* Itemized INCI Table */}
              <div className="bg-white border border-[#E5E0D5] rounded-3xl overflow-hidden shadow-xs">
                <div className="p-5 border-b border-[#E5E0D5] flex items-center justify-between">
                  <h4 className="font-serif font-bold text-base text-[#333333]">
                    Itemized Ingredient Breakdown ({scanResult.ingredients_details.length})
                  </h4>
                  <span className="text-[11px] text-[#7A746B]">Ranked by descending formulation order</span>
                </div>

                <div className="divide-y divide-[#E5E0D5]/70 max-h-96 overflow-y-auto">
                  {scanResult.ingredients_details.map((ing, iIdx) => (
                    <div key={iIdx} className="p-4 flex items-center justify-between text-xs hover:bg-[#FAF8F5]">
                      <div className="space-y-0.5 max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#333333]">{ing.name}</span>
                          {ing.is_active && (
                            <span className="text-[9px] font-mono uppercase bg-[#F0F5F1] text-[#5A6D5C] font-semibold px-1.5 py-0.5 rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#7A746B]">{ing.function}</p>
                      </div>

                      <div className="flex items-center gap-4 text-right shrink-0">
                        <div>
                          <span className="text-[10px] text-[#7A746B] block uppercase font-mono">Category</span>
                          <span className="text-[#333333]">{ing.category}</span>
                        </div>
                        <div className="w-16">
                          <span className="text-[10px] text-[#7A746B] block uppercase font-mono">Comedogenic</span>
                          <span className="font-semibold text-[#333333]">{ing.comedogenic_rating} / 5</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INGREDIENT ENCYCLOPEDIA */}
      {activeTab === "encyclopedia" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#7A746B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, INCI, or mechanism..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E0D5] rounded-xl text-xs focus:outline-none focus:border-[#5A6D5C] text-[#333333]"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs w-full sm:w-auto">
              <span className="text-[#7A746B] text-[11px] font-semibold uppercase tracking-wider shrink-0">
                Category:
              </span>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 cursor-pointer ${
                    selectedCategory === c
                      ? "bg-[#5A6D5C] text-white"
                      : "bg-white border border-[#E5E0D5] text-[#7A746B] hover:text-[#333333]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredients Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIngredients.map((ing) => (
              <div
                key={ing.id}
                className="bg-white border border-[#E5E0D5] rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-[#5A6D5C] uppercase font-semibold">
                        {ing.category}
                      </span>
                      <h3 className="font-serif font-bold text-base text-[#333333]">
                        {ing.name}
                      </h3>
                      <span className="text-[11px] text-[#7A746B] font-mono block">INCI: {ing.inci_name}</span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-mono text-[#7A746B] block">Comedogenic</span>
                      <span className="font-serif font-bold text-sm text-[#333333]">{ing.comedogenic_rating} / 5</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#555555] line-clamp-2 leading-relaxed">
                    {ing.function}
                  </p>

                  {/* Contraindication & Synergy Tags */}
                  <div className="pt-2 border-t border-[#E5E0D5]/70 space-y-1.5 text-xs">
                    {ing.contraindications.length > 0 && (
                      <div className="text-[11px] text-[#B85D52] flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span className="line-clamp-1">
                          Conflicts: {ing.contraindications.map((c) => c.ingredient).join(", ")}
                        </span>
                      </div>
                    )}
                    {ing.synergies.length > 0 && (
                      <div className="text-[11px] text-[#5A6D5C] flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 shrink-0" />
                        <span className="line-clamp-1">
                          Synergy: {ing.synergies.map((s) => s.ingredient).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-[#E5E0D5] flex items-center justify-between text-xs">
                  <span className="text-[#7A746B]">Safety: {ing.safety_score}/10</span>
                  <button
                    onClick={() => setSelectedIngredient(ing)}
                    className="text-[#5A6D5C] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Clinical Profile</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ACTIVE INTERACTION MATRIX */}
      {activeTab === "matrix" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#333333]">
              Active Ingredient Compatibility Matrix
            </h3>
            <p className="text-xs text-[#7A746B] max-w-3xl leading-relaxed">
              Dermatological guidelines regarding direct active layering. Combining conflicting cellular regulators often causes acid mantle neutralization, trans-epidermal moisture loss, and acute contact dermatitis.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              {/* Conflicts Column */}
              <div className="border border-[#B85D52]/30 rounded-2xl p-5 bg-[#FAF3F2]/40 space-y-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#B85D52]" />
                  <h4 className="font-serif font-bold text-sm text-[#B85D52]">
                    High-Risk Active Contraindications (Never Layer Together)
                  </h4>
                </div>
                <div className="space-y-3 text-xs text-[#6B4B48]">
                  <div className="bg-white/90 p-3 rounded-xl border border-[#B85D52]/20 space-y-1">
                    <span className="font-bold text-[#B85D52] block">Retinol + Glycolic / Salicylic Acid</span>
                    <p>Additive keratolytic exfoliation strips the stratum corneum and compromises junctional barrier integrity.</p>
                  </div>
                  <div className="bg-white/90 p-3 rounded-xl border border-[#B85D52]/20 space-y-1">
                    <span className="font-bold text-[#B85D52] block">Benzoyl Peroxide + Pure Retinol</span>
                    <p>Organic peroxide oxidation hydrolyzes and neutralizes the active retinoid molecule completely.</p>
                  </div>
                  <div className="bg-white/90 p-3 rounded-xl border border-[#B85D52]/20 space-y-1">
                    <span className="font-bold text-[#B85D52] block">L-Ascorbic Acid (Vitamin C) + Copper Peptides</span>
                    <p>Direct redox reaction oxidizes copper ions and breaks down the ascorbic acid antioxidant shield.</p>
                  </div>
                </div>
              </div>

              {/* Synergies Column */}
              <div className="border border-[#8BA88E]/40 rounded-2xl p-5 bg-[#F0F5F1]/40 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#5A6D5C]" />
                  <h4 className="font-serif font-bold text-sm text-[#5A6D5C]">
                    Clinically Proven Golden Synergies (Apply Together)
                  </h4>
                </div>
                <div className="space-y-3 text-xs text-[#3B4D3D]">
                  <div className="bg-white p-3 rounded-xl border border-[#8BA88E]/30 space-y-1">
                    <span className="font-bold text-[#5A6D5C] block">Vitamin C (15%) + Ferulic Acid + Vitamin E</span>
                    <p>Increases cutaneous photoprotection by 8x compared to Vitamin C alone, quenching reactive oxygen species.</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#8BA88E]/30 space-y-1">
                    <span className="font-bold text-[#5A6D5C] block">Niacinamide (5%) + Ceramide NP</span>
                    <p>Niacinamide boosts natural lipid biosynthesis while ceramides immediately seal the intercellular lipid matrix.</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#8BA88E]/30 space-y-1">
                    <span className="font-bold text-[#5A6D5C] block">Salicylic Acid (BHA) + Zinc PCA</span>
                    <p>Lipophilic acid unclogs follicular channels allowing zinc to downregulate 5-alpha reductase and curb sebum.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INGREDIENT CLINICAL PROFILE */}
      {selectedIngredient && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 shadow-xl border border-[#E5E0D5]">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono text-[#5A6D5C] uppercase font-semibold">
                  {selectedIngredient.category}
                </span>
                <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#333333]">
                  {selectedIngredient.name}
                </h2>
                <span className="text-xs text-[#7A746B] font-mono">INCI: {selectedIngredient.inci_name}</span>
              </div>
              <button
                onClick={() => setSelectedIngredient(null)}
                className="w-8 h-8 rounded-full bg-[#F2EDE4] hover:bg-[#E5E0D5] flex items-center justify-center text-[#7A746B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-mono font-semibold uppercase text-[#7A746B]">Biological Mechanism of Action:</h4>
              <p className="text-xs text-[#555555] leading-relaxed bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E5E0D5]">
                {selectedIngredient.mechanism_of_action}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-[#F7F4EE] p-2.5 rounded-xl text-center border border-[#E5E0D5]">
                <span className="text-[10px] text-[#7A746B] block uppercase font-mono">Comedogenic</span>
                <span className="font-bold text-[#333333]">{selectedIngredient.comedogenic_rating} / 5</span>
              </div>
              <div className="bg-[#F7F4EE] p-2.5 rounded-xl text-center border border-[#E5E0D5]">
                <span className="text-[10px] text-[#7A746B] block uppercase font-mono">Safety Score</span>
                <span className="font-bold text-[#5A6D5C]">{selectedIngredient.safety_score} / 10</span>
              </div>
              <div className="bg-[#F7F4EE] p-2.5 rounded-xl text-center border border-[#E5E0D5]">
                <span className="text-[10px] text-[#7A746B] block uppercase font-mono">Irritation</span>
                <span className="font-bold text-[#333333]">{selectedIngredient.irritation_potential}</span>
              </div>
              <div className="bg-[#F7F4EE] p-2.5 rounded-xl text-center border border-[#E5E0D5]">
                <span className="text-[10px] text-[#7A746B] block uppercase font-mono">Time of Day</span>
                <span className="font-bold text-[#5A6D5C]">{selectedIngredient.usage_advice.time_of_day}</span>
              </div>
            </div>

            {/* Contraindications & Synergies List */}
            {selectedIngredient.contraindications.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-mono font-semibold uppercase text-[#B85D52] block">
                  Contraindicated Combinations:
                </span>
                <div className="space-y-1.5 text-xs">
                  {selectedIngredient.contraindications.map((c, cIdx) => (
                    <div key={cIdx} className="bg-[#FAF3F2] p-2.5 rounded-xl border border-[#B85D52]/20">
                      <span className="font-bold text-[#B85D52]">• {c.ingredient}: </span>
                      <span className="text-[#6B4B48]">{c.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedIngredient.synergies.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-mono font-semibold uppercase text-[#5A6D5C] block">
                  Synergistic Enhancers:
                </span>
                <div className="space-y-1.5 text-xs">
                  {selectedIngredient.synergies.map((s, sIdx) => (
                    <div key={sIdx} className="bg-[#F0F5F1] p-2.5 rounded-xl border border-[#8BA88E]/30">
                      <span className="font-bold text-[#5A6D5C]">• {s.ingredient} ({s.benefit}): </span>
                      <span className="text-[#555555]">{s.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end pt-3 border-t border-[#E5E0D5]">
              <button
                onClick={() => setSelectedIngredient(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#5A6D5C] text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
