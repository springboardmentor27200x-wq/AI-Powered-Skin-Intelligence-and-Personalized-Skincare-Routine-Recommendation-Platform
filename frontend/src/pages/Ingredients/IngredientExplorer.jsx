import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronRight, FlaskConical, AlertTriangle, CheckCircle, Info, X, Zap } from 'lucide-react';
import { ingredientService } from '../../services/ingredientService';

const CATEGORIES = [
  { key: '', label: 'All' },
  { key: 'NIACINAMIDE', label: 'Niacinamide' },
  { key: 'RETINOIDS', label: 'Retinoids' },
  { key: 'VITAMIN_C', label: 'Vitamin C' },
  { key: 'HYALURONIC_ACID', label: 'Hyaluronic Acid' },
  { key: 'SALICYLIC_ACID', label: 'Salicylic Acid' },
  { key: 'CERAMIDES', label: 'Ceramides' },
  { key: 'PEPTIDES', label: 'Peptides' },
  { key: 'AHAS_BHAS', label: 'AHAs / BHAs' },
];

const SUITABILITY_CONFIG = {
  suitable: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', label: 'Suitable', icon: CheckCircle },
  conditionally_suitable: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Use with Care', icon: AlertTriangle },
  unsuitable: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Not Suitable', icon: AlertTriangle },
  unknown: { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: 'Profile Needed', icon: Info },
};

// ── Suitability Badge ──────────────────────────────────────────────────────────
const SuitabilityBadge = ({ status }) => {
  const cfg = SUITABILITY_CONFIG[status] || SUITABILITY_CONFIG.unknown;
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
};

// ── Ingredient Card ────────────────────────────────────────────────────────────
const IngredientCard = ({ ingredient, suitability, onSelect }) => (
  <button
    onClick={() => onSelect(ingredient)}
    className="w-full text-left rounded-2xl border border-[#e8e4dc] bg-white p-5 hover:border-[#b5a397] hover:shadow-md transition-all duration-200 group"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical size={15} className="text-[#8b7355] shrink-0" />
          <span className="font-semibold text-[#2c2417] text-sm truncate">{ingredient.name}</span>
        </div>
        <p className="text-xs text-[#8b7355] mb-2 line-clamp-2">{ingredient.common_uses || ingredient.suitability_notes}</p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-[#f5f0e8] text-[#8b7355] px-2 py-0.5 rounded-full font-medium">
            {ingredient.category?.replace(/_/g, ' ')}
          </span>
          {suitability && <SuitabilityBadge status={suitability.status} />}
        </div>
      </div>
      <ChevronRight size={16} className="text-[#b5a397] group-hover:text-[#8b7355] mt-1 shrink-0 transition-colors" />
    </div>
  </button>
);

// ── Interaction Badge ──────────────────────────────────────────────────────────
const InteractionBadge = ({ type, severity }) => {
  const colors = {
    AVOID: '#ef4444', CAUTION: '#f59e0b', SEQUENCE: '#3b82f6', SEPARATE: '#8b5cf6', SYNERGY: '#22c55e',
  };
  const color = colors[type] || '#94a3b8';
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border" style={{ borderColor: color, color }}>
      {type} · {severity}
    </span>
  );
};

// ── Detail Drawer ──────────────────────────────────────────────────────────────
const IngredientDetailDrawer = ({ ingredient, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [suitability, setSuitability] = useState(null);
  const [interactions, setInteractions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ingredient) return;
    setLoading(true);
    Promise.allSettled([
      ingredientService.getById(ingredient.id),
      ingredientService.evaluateSuitability(ingredient.id),
      ingredientService.checkInteractions([ingredient.name]),
    ]).then(([detailRes, suitRes, interRes]) => {
      if (detailRes.status === 'fulfilled') setDetail(detailRes.value.data);
      if (suitRes.status === 'fulfilled') setSuitability(suitRes.value.data);
      if (interRes.status === 'fulfilled') setInteractions(interRes.value.data);
      setLoading(false);
    });
  }, [ingredient]);

  if (!ingredient) return null;
  const cfg = suitability ? (SUITABILITY_CONFIG[suitability.status] || SUITABILITY_CONFIG.unknown) : null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className="w-full max-w-md bg-white shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#e8e4dc] px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <FlaskConical size={18} className="text-[#8b7355]" />
            <h2 className="font-bold text-[#2c2417] text-lg">{ingredient.name}</h2>
          </div>
          <button onClick={onClose} className="text-[#8b7355] hover:text-[#2c2417] p-1 rounded-lg hover:bg-[#f5f0e8] transition-colors">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-[#f5f0e8] rounded animate-pulse" style={{ width: `${85 - i * 10}%` }} />
            ))}
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Suitability */}
            {suitability && cfg && (
              <div className="rounded-2xl p-4" style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
                <div className="flex items-center gap-2 mb-2">
                  <SuitabilityBadge status={suitability.status} />
                  <span className="text-xs font-semibold" style={{ color: cfg.color }}>Your Profile</span>
                </div>
                {suitability.supporting_factors?.length > 0 && (
                  <ul className="text-xs space-y-1 text-[#2c2417] mt-2">
                    {suitability.supporting_factors.map((f, i) => (
                      <li key={i} className="flex gap-1.5"><span className="text-green-500 shrink-0">✓</span> {f}</li>
                    ))}
                  </ul>
                )}
                {suitability.warnings?.length > 0 && (
                  <ul className="text-xs space-y-1 text-[#2c2417] mt-2">
                    {suitability.warnings.map((w, i) => (
                      <li key={i} className="flex gap-1.5"><AlertTriangle size={11} className="text-amber-500 shrink-0 mt-0.5" /> {w}</li>
                    ))}
                  </ul>
                )}
                {suitability.reasons?.length > 0 && (
                  <p className="text-xs text-[#8b7355] mt-2 italic">{suitability.reasons[0]}</p>
                )}
              </div>
            )}

            {/* What is it */}
            <section>
              <h3 className="text-xs font-bold text-[#8b7355] uppercase tracking-widest mb-2">What is it?</h3>
              <p className="text-sm text-[#2c2417] leading-relaxed">{detail?.description || ingredient.suitability_notes}</p>
            </section>

            {/* Common Uses */}
            <section>
              <h3 className="text-xs font-bold text-[#8b7355] uppercase tracking-widest mb-2">Common Uses</h3>
              <p className="text-sm text-[#2c2417] leading-relaxed">{detail?.common_uses || '—'}</p>
            </section>

            {/* Education */}
            {detail?.education_content && (
              <section>
                <h3 className="text-xs font-bold text-[#8b7355] uppercase tracking-widest mb-2">Why it may be relevant to you</h3>
                <p className="text-sm text-[#2c2417] leading-relaxed">{detail.education_content}</p>
              </section>
            )}

            {/* Cautions */}
            {detail?.caution_notes && (
              <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h3 className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={12} /> Things to be aware of
                </h3>
                <p className="text-sm text-amber-900 leading-relaxed">{detail.caution_notes}</p>
              </section>
            )}

            {/* Interactions */}
            {interactions?.interactions?.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-[#8b7355] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Zap size={12} /> Known Interactions
                </h3>
                <div className="space-y-3">
                  {interactions.interactions.map((intr, i) => (
                    <div key={i} className="bg-[#fafaf6] border border-[#e8e4dc] rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <InteractionBadge type={intr.interaction_type} severity={intr.severity} />
                        <span className="text-xs font-medium text-[#2c2417]">
                          with {intr.ingredient_a === ingredient.name ? intr.ingredient_b : intr.ingredient_a}
                        </span>
                      </div>
                      <p className="text-xs text-[#8b7355] leading-relaxed">{intr.recommendation}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Aliases */}
            {detail?.aliases?.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-[#8b7355] uppercase tracking-widest mb-2">Also known as</h3>
                <div className="flex flex-wrap gap-1.5">
                  {detail.aliases.map((alias) => (
                    <span key={alias} className="text-xs bg-[#f5f0e8] text-[#8b7355] px-2 py-0.5 rounded-full">{alias}</span>
                  ))}
                </div>
              </section>
            )}

            <p className="text-[10px] text-[#b5a397] border-t border-[#e8e4dc] pt-4 leading-relaxed">
              This information is for educational purposes only and does not constitute medical advice. Consult a qualified dermatologist for personal guidance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function IngredientExplorer() {
  const [ingredients, setIngredients] = useState([]);
  const [suitabilityMap, setSuitabilityMap] = useState({});
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const loadIngredients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ingredientService.list({ search: search || undefined, category: category || undefined });
      const items = res.data;
      setIngredients(items);
      // Load suitability for all ingredients in background
      const suitMap = {};
      await Promise.allSettled(
        items.map(async (ing) => {
          try {
            const s = await ingredientService.evaluateSuitability(ing.id);
            suitMap[ing.id] = s.data;
          } catch {}
        })
      );
      setSuitabilityMap(suitMap);
    } catch {
      setError("We couldn't load the ingredient list. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    const timer = setTimeout(loadIngredients, 300);
    return () => clearTimeout(timer);
  }, [loadIngredients]);

  return (
    <div className="min-h-screen bg-[#fafaf6] pb-16">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e4dc] px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <FlaskConical size={22} className="text-[#8b7355]" />
            <h1 className="text-2xl font-bold text-[#2c2417]">Ingredient Intelligence</h1>
          </div>
          <p className="text-sm text-[#8b7355] ml-10">Understand the ingredients in your skincare routine and how they relate to your profile.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6">
        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b5a397]" />
          <input
            type="text"
            placeholder="Search ingredients (e.g. Niacinamide, Retinol)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-[#e8e4dc] rounded-2xl text-sm focus:outline-none focus:border-[#8b7355] focus:ring-2 focus:ring-[#8b7355]/20 transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                category === cat.key
                  ? 'bg-[#8b7355] text-white'
                  : 'bg-white text-[#8b7355] border border-[#e8e4dc] hover:border-[#8b7355]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {error ? (
          <div className="text-center py-16">
            <p className="text-[#ef4444] text-sm mb-3">{error}</p>
            <button onClick={loadIngredients} className="text-sm text-[#8b7355] underline">Try again</button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#e8e4dc] p-5 animate-pulse">
                <div className="h-4 bg-[#f5f0e8] rounded mb-2 w-2/3" />
                <div className="h-3 bg-[#f5f0e8] rounded mb-3 w-full" />
                <div className="h-3 bg-[#f5f0e8] rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : ingredients.length === 0 ? (
          <div className="text-center py-16">
            <FlaskConical size={40} className="text-[#d4cabb] mx-auto mb-4" />
            <p className="text-[#8b7355] font-medium">No ingredients found</p>
            <p className="text-sm text-[#b5a397] mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ingredients.map((ing) => (
              <IngredientCard
                key={ing.id}
                ingredient={ing}
                suitability={suitabilityMap[ing.id]}
                onSelect={setSelected}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selected && (
        <IngredientDetailDrawer ingredient={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
