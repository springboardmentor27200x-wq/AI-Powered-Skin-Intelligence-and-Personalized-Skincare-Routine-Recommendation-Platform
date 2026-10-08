import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Filter, CheckCircle, AlertTriangle, XCircle, Star, ChevronRight, RefreshCw, SlidersHorizontal, ArrowRightLeft } from 'lucide-react';
import { productService } from '../../services/productService';
import { formatPrice } from '../../utils/formatters';
import { Link, useNavigate } from 'react-router-dom';

const CATEGORIES = [
  { key: '', label: 'All' },
  { key: 'FACE_WASH', label: 'Face Wash' },
  { key: 'MOISTURIZER', label: 'Moisturizer' },
  { key: 'SUNSCREEN', label: 'Sunscreen' },
  { key: 'SERUM', label: 'Serum' },
  { key: 'TONER', label: 'Toner' },
  { key: 'TREATMENT', label: 'Treatment' },
  { key: 'FACE_MASK', label: 'Face Mask' },
];

const BUDGET_BANDS = [
  { key: '', label: 'Any Budget' },
  { key: 'BUDGET', label: 'Budget (< ₹1,500)' },
  { key: 'MODERATE', label: 'Moderate (₹1,500–₹2,500)' },
  { key: 'PREMIUM', label: 'Premium (> ₹2,500)' },
];

// ── Safety Badge ─────────────────────────────────────────────────────────────
const SafetyBadge = ({ status, exclusionReason }) => {
  if (status === 'ALLERGEN_CONFLICT' || exclusionReason === 'ALLERGEN_CONFLICT') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
        <XCircle size={11} /> Excluded — declared allergy conflict
      </span>
    );
  }
  if (status === 'CAUTION') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
        <AlertTriangle size={11} /> Use with care
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
      <CheckCircle size={11} /> Safe for your profile
    </span>
  );
};

// ── Match Score Ring ──────────────────────────────────────────────────────────
const MatchRing = ({ score }) => {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#94a3b8';
  return (
    <div className="flex flex-col items-center">
      <div
        className="flex items-center justify-center w-14 h-14 rounded-full font-bold text-sm"
        style={{ background: `conic-gradient(${color} ${score}%, #f0ede8 0)`, boxShadow: `0 0 0 3px white, 0 0 0 4px ${color}30` }}
      >
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
          <span style={{ color }} className="text-sm font-bold">{score}%</span>
        </div>
      </div>
      <span className="text-[10px] text-[#8b7355] mt-1 font-medium">Match</span>
    </div>
  );
};

// ── Product Card ──────────────────────────────────────────────────────────────
const ProductCard = ({ rec, onCompare, isComparing }) => {
  const [expanded, setExpanded] = useState(false);
  const { product, recommendation_status, match_score, reasons, safety_status, exclusion_reason } = rec;

  const isExcluded = recommendation_status === 'EXCLUDED';
  const isAlternative = recommendation_status === 'ALTERNATIVE';

  return (
    <div
      className={`relative bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${
        isExcluded
          ? 'border-red-200 opacity-75'
          : isComparing
          ? 'border-[#8b7355] ring-2 ring-[#8b7355]/30'
          : 'border-[#e8e4dc] hover:border-[#b5a397] hover:shadow-lg'
      }`}
    >
      {/* Status indicator */}
      {isAlternative && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400" />
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold text-[#8b7355] bg-[#f5f0e8] px-2 py-0.5 rounded-full uppercase tracking-wide">
                {product.category?.replace(/_/g, ' ')}
              </span>
              {isAlternative && (
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Alternative</span>
              )}
            </div>
            <h3 className="font-bold text-[#2c2417] text-base leading-tight mt-1">{product.name}</h3>
            {product.brand && <p className="text-xs text-[#b5a397] mt-0.5">{product.brand}</p>}
          </div>
          {!isExcluded && match_score != null && <MatchRing score={match_score} />}
        </div>

        {/* Safety */}
        <div className="mb-3">
          <SafetyBadge status={safety_status} exclusionReason={exclusion_reason} />
        </div>

        {/* Price + Budget */}
        <div className="flex items-center gap-2 mb-3">
          {product.price != null && (
            <span className="text-sm font-semibold text-[#2c2417]">
              {formatPrice(product.price, product.currency)}
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            product.budget_band === 'BUDGET' ? 'bg-green-50 text-green-700' :
            product.budget_band === 'PREMIUM' ? 'bg-purple-50 text-purple-700' :
            'bg-blue-50 text-blue-700'
          }`}>{product.budget_band}</span>
        </div>

        {/* Active Ingredients */}
        {product.active_ingredients?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.active_ingredients.slice(0, 4).map((ing) => (
              <span key={ing} className="text-[10px] bg-[#f5f0e8] text-[#8b7355] px-2 py-0.5 rounded-full capitalize">{ing}</span>
            ))}
          </div>
        )}

        {/* Reasons */}
        {!isExcluded && reasons?.length > 0 && (
          <div className="mb-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-[#8b7355] flex items-center gap-1 font-medium hover:text-[#2c2417] transition-colors"
            >
              Why recommended?
              <ChevronRight size={12} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
            {expanded && (
              <ul className="mt-2 space-y-1.5 pl-1">
                {reasons.filter(r => !r.startsWith('Does not')).slice(0, 4).map((reason, i) => (
                  <li key={i} className="text-xs text-[#2c2417] flex gap-1.5">
                    <span className="text-emerald-500 shrink-0">•</span> {reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Size */}
        {product.size && <p className="text-xs text-[#b5a397]">{product.size}</p>}
      </div>

      {/* Footer actions */}
      {!isExcluded && (
        <div className="border-t border-[#f0ede8] px-5 py-3 flex items-center justify-between">
          <Link
            to={`/products/alternatives/${product.id}`}
            className="text-xs text-[#8b7355] hover:text-[#2c2417] transition-colors"
          >
            See alternatives
          </Link>
          <button
            onClick={() => onCompare(product.id)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
              isComparing
                ? 'bg-[#8b7355] text-white'
                : 'bg-[#f5f0e8] text-[#8b7355] hover:bg-[#e8e0d4]'
            }`}
          >
            {isComparing ? '✓ Comparing' : 'Compare'}
          </button>
        </div>
      )}
    </div>
  );
};

// ── Loading State ─────────────────────────────────────────────────────────────
const LoadingState = () => {
  const steps = ['Analyzing your profile...', 'Checking ingredients...', 'Filtering conflicts...', 'Ranking products...'];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStep((s) => (s + 1) % steps.length), 900);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="text-center py-20">
      <div className="w-12 h-12 border-3 border-[#8b7355] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-sm text-[#8b7355] font-medium animate-pulse">{steps[step]}</p>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProductRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [category, setCategory] = useState('');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [comparing, setComparing] = useState(() => {
    try {
      const saved = sessionStorage.getItem('comparing_product_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (budget) params.budget_band = budget;
      if (category) params.category = category;
      const res = await productService.getRecommendations(params);
      setRecommendations(res.data);
    } catch {
      setError("We couldn't generate recommendations right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [budget, category]);

  useEffect(() => { load(); }, [load]);

  const toggleCompare = (id) => {
    setComparing((prev) => {
      const next = prev.includes(id)
        ? prev.filter((i) => i !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev;
      try {
        sessionStorage.setItem('comparing_product_ids', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const recommended = recommendations.filter((r) => r.recommendation_status === 'RECOMMENDED');
  const alternatives = recommendations.filter((r) => r.recommendation_status === 'ALTERNATIVE');
  const excluded = recommendations.filter((r) => r.recommendation_status === 'EXCLUDED');

  return (
    <div className="min-h-screen bg-[#fafaf6] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e4dc] px-6 py-6">
        <div className="max-w-5xl mx-auto flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag size={22} className="text-[#8b7355]" />
              <h1 className="text-2xl font-bold text-[#2c2417]">Recommendations for You</h1>
            </div>
            <p className="text-sm text-[#8b7355] ml-8">Products matched to your skin profile, concerns, and safety requirements.</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              showFilters ? 'bg-[#8b7355] text-white' : 'bg-[#f5f0e8] text-[#8b7355] hover:bg-[#e8e0d4]'
            }`}
          >
            <SlidersHorizontal size={15} />
            Filters
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white border border-[#e8e4dc] rounded-2xl p-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-[#8b7355] uppercase tracking-widest mb-2 block">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setCategory(cat.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        category === cat.key ? 'bg-[#8b7355] text-white' : 'bg-[#f5f0e8] text-[#8b7355] hover:bg-[#e8e0d4]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[#8b7355] uppercase tracking-widest mb-2 block">Budget</label>
                <div className="flex flex-wrap gap-1.5">
                  {BUDGET_BANDS.map((b) => (
                    <button
                      key={b.key}
                      onClick={() => setBudget(b.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        budget === b.key ? 'bg-[#8b7355] text-white' : 'bg-[#f5f0e8] text-[#8b7355] hover:bg-[#e8e0d4]'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compare banner */}
        {comparing.length >= 2 && (
          <div className="bg-[#8b7355] text-white rounded-2xl p-4 mb-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white text-[#8b7355] text-xs font-bold flex items-center justify-center">
                {comparing.length}
              </span>
              <span className="text-sm font-medium">{comparing.length} products selected for comparison</span>
            </div>
            <Link
              to={`/products/compare?ids=${comparing.join(',')}`}
              state={{ productIds: comparing }}
              className="bg-white text-[#8b7355] text-sm font-bold px-4 py-2 rounded-lg hover:bg-[#f5f0e8] transition-colors"
            >
              Compare Now →
            </Link>
          </div>
        )}

        {loading ? (
          <LoadingState />
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-[#ef4444] mb-3 text-sm">{error}</p>
            <button onClick={load} className="flex items-center gap-2 mx-auto text-sm text-[#8b7355] underline">
              <RefreshCw size={14} /> Try Again
            </button>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag size={40} className="text-[#d4cabb] mx-auto mb-4" />
            <p className="text-[#8b7355] font-medium">Complete your skin assessment to receive personalised recommendations.</p>
          </div>
        ) : (
          <>
            {/* Recommended Section */}
            {recommended.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-bold text-[#8b7355] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-500" />
                  Best Matches ({recommended.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommended.map((rec) => (
                    <ProductCard
                      key={rec.product.id}
                      rec={rec}
                      onCompare={toggleCompare}
                      isComparing={comparing.includes(rec.product.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Alternatives */}
            {alternatives.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-bold text-[#8b7355] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Star size={14} className="text-blue-400" />
                  Alternative Options ({alternatives.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {alternatives.map((rec) => (
                    <ProductCard
                      key={rec.product.id}
                      rec={rec}
                      onCompare={toggleCompare}
                      isComparing={comparing.includes(rec.product.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Excluded */}
            {excluded.length > 0 && (
              <details className="mb-8">
                <summary className="text-sm font-bold text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2 cursor-pointer list-none">
                  <XCircle size={14} className="text-red-500" />
                  Excluded Products ({excluded.length}) — allergen or safety conflicts
                </summary>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {excluded.map((rec) => (
                    <ProductCard
                      key={rec.product.id}
                      rec={rec}
                      onCompare={() => {}}
                      isComparing={false}
                    />
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </div>

      {/* Floating Persistent Compare Dock */}
      {comparing.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg bg-[#2c2417] text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 border border-[#443825] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#8b7355] flex items-center justify-center text-xs font-bold text-white">
              {comparing.length}
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-none">
                {comparing.length === 1
                  ? '1 product selected'
                  : `${comparing.length} products ready to compare`}
              </p>
              <p className="text-[10px] text-[#b5a397] mt-0.5">
                {comparing.length < 2 ? 'Select at least 1 more product to compare' : 'Max 3 side-by-side'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setComparing([]);
                sessionStorage.removeItem('comparing_product_ids');
              }}
              className="text-[11px] text-[#b5a397] hover:text-white px-2 py-1 transition-colors"
            >
              Clear
            </button>
            <Link
              to={comparing.length >= 2 ? `/products/compare?ids=${comparing.join(',')}` : '#'}
              state={{ productIds: comparing }}
              onClick={(e) => {
                if (comparing.length < 2) e.preventDefault();
              }}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                comparing.length >= 2
                  ? 'bg-[#8b7355] text-white hover:bg-[#9d8363] shadow-md'
                  : 'bg-[#443825] text-[#8b7355] cursor-not-allowed opacity-60'
              }`}
            >
              Compare Now →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
