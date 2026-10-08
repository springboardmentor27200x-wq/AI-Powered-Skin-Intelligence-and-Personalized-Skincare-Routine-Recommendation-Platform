import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShoppingBag,
  Sparkles,
  ArrowRightLeft,
  RefreshCw,
  Layers,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { productService } from '../../services/productService';
import { formatPrice } from '../../utils/formatters';

// ── Safety Badge ─────────────────────────────────────────────────────────────
const SafetyBadge = ({ status, exclusionReason }) => {
  if (status === 'ALLERGEN_CONFLICT' || exclusionReason === 'ALLERGEN_CONFLICT') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
        <XCircle size={11} /> Excluded — allergy conflict
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
  if (score == null) return null;
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#94a3b8';
  return (
    <div className="flex flex-col items-center">
      <div
        className="flex items-center justify-center w-12 h-12 rounded-full font-bold text-xs"
        style={{
          background: `conic-gradient(${color} ${score}%, #f0ede8 0)`,
          boxShadow: `0 0 0 3px white, 0 0 0 4px ${color}30`,
        }}
      >
        <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
          <span style={{ color }} className="text-xs font-bold">{score}%</span>
        </div>
      </div>
      <span className="text-[10px] text-[#8b7355] mt-1 font-medium">Match</span>
    </div>
  );
};

export default function ProductAlternatives() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [originalProduct, setOriginalProduct] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comparing, setComparing] = useState([]);
  const [expandedReasons, setExpandedReasons] = useState({});

  const toggleReason = (id) => {
    setExpandedReasons((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const loadData = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch both original product and alternatives in parallel
      const [origRes, altsRes] = await Promise.allSettled([
        productService.getById(productId),
        productService.getAlternatives(productId),
      ]);

      if (origRes.status === 'fulfilled') {
        setOriginalProduct(origRes.value.data);
      }

      if (altsRes.status === 'fulfilled') {
        setAlternatives(altsRes.value.data || []);
      } else {
        throw new Error('Failed to load alternative products');
      }
    } catch (err) {
      console.error('Error fetching alternatives:', err);
      setError("We couldn't load alternative options for this product right now.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadData();
    // Pre-populate compare state from session if available
    try {
      const saved = sessionStorage.getItem('comparing_product_ids');
      if (saved) {
        setComparing(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, [loadData]);

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

  const handleCompareWithOriginal = (altProductId) => {
    const ids = [productId, altProductId];
    try {
      sessionStorage.setItem('comparing_product_ids', JSON.stringify(ids));
    } catch {
      // ignore
    }
    navigate(`/products/compare?ids=${ids.join(',')}`, {
      state: { productIds: ids },
    });
  };

  const handleLaunchCompare = () => {
    if (comparing.length >= 2) {
      navigate(`/products/compare?ids=${comparing.join(',')}`, {
        state: { productIds: comparing },
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf6] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e4dc] px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8b7355] hover:text-[#2c2417] transition-colors mb-3"
          >
            <ArrowLeft size={14} /> Back to Recommendations
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f5f0e8] flex items-center justify-center text-[#8b7355]">
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#2c2417]">Alternative Products</h1>
              <p className="text-xs text-[#8b7355] mt-0.5">
                Safe, dermatologist-grade options in the same category that match your skin profile
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-3 border-[#8b7355] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-[#8b7355] font-medium animate-pulse">
              Finding safe alternatives for your skin profile...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white border border-[#e8e4dc] rounded-2xl p-8">
            <p className="text-red-500 mb-4 text-sm">{error}</p>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#8b7355] text-white rounded-xl text-sm font-medium hover:bg-[#725e45] transition-colors"
            >
              <RefreshCw size={14} /> Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Original Reference Product Card */}
            {originalProduct && (
              <div className="bg-white border-2 border-[#e8e4dc] rounded-2xl p-5 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 bg-[#f5f0e8] text-[#8b7355] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl border-b border-l border-[#e8e4dc]">
                  Current Reference
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold text-[#8b7355] uppercase tracking-wider">
                      {originalProduct.brand || 'Original Selection'}
                    </span>
                    <h2 className="text-lg font-bold text-[#2c2417] mt-0.5">{originalProduct.name}</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs bg-[#f5f0e8] text-[#8b7355] px-2.5 py-0.5 rounded-full font-medium capitalize">
                        {originalProduct.category?.replace(/_/g, ' ')}
                      </span>
                      {originalProduct.price != null && (
                        <span className="text-sm font-bold text-[#2c2417]">
                          {formatPrice(originalProduct.price, originalProduct.currency)}
                        </span>
                      )}
                      {originalProduct.size && (
                        <span className="text-xs text-[#b5a397]">• {originalProduct.size}</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleCompare(originalProduct.id)}
                    className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-all ${
                      comparing.includes(originalProduct.id)
                        ? 'bg-[#8b7355] text-white shadow-sm'
                        : 'bg-[#f5f0e8] text-[#8b7355] hover:bg-[#e8e0d4]'
                    }`}
                  >
                    {comparing.includes(originalProduct.id) ? '✓ In Comparison' : '+ Add to Compare'}
                  </button>
                </div>

                {originalProduct.active_ingredients?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#f0ede8] flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-[#8b7355] font-semibold mr-1">Actives:</span>
                    {originalProduct.active_ingredients.slice(0, 4).map((act, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-[#faf8f5] border border-[#e8e4dc] text-[#5c4d3c] px-2 py-0.5 rounded-md"
                      >
                        {act}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Alternatives List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#8b7355] uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  Safe Alternatives ({alternatives.length})
                </h3>
                <span className="text-xs text-[#8b7355]">
                  Filtered for allergy safety and profile synergy
                </span>
              </div>

              {alternatives.length === 0 ? (
                <div className="bg-white border border-[#e8e4dc] rounded-2xl p-10 text-center">
                  <ShoppingBag size={36} className="text-[#d4cabb] mx-auto mb-3" />
                  <h4 className="text-base font-bold text-[#2c2417] mb-1">No Alternatives Found</h4>
                  <p className="text-xs text-[#8b7355] max-w-md mx-auto mb-4">
                    There are currently no other products in this specific category that meet all
                    your allergy and compatibility safety checks.
                  </p>
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#8b7355] text-white rounded-xl text-xs font-semibold hover:bg-[#725e45] transition-colors"
                  >
                    Browse All Recommendations
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {alternatives.map((rec) => {
                    const prod = rec.product;
                    const isComparingThis = comparing.includes(prod.id);
                    const isExpanded = !!expandedReasons[prod.id];

                    return (
                      <div
                        key={prod.id}
                        className="bg-white border border-[#e8e4dc] rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
                      >
                        <div>
                          {/* Top: Badges & Match Ring */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <SafetyBadge
                                status={rec.safety_status}
                                exclusionReason={rec.exclusion_reason}
                              />
                              <p className="text-[11px] font-bold text-[#8b7355] uppercase tracking-wider mt-2">
                                {prod.brand || 'Alternative Brand'}
                              </p>
                              <h4 className="font-bold text-[#2c2417] text-base leading-snug mt-0.5">
                                {prod.name}
                              </h4>
                            </div>
                            <MatchRing score={rec.match_score} />
                          </div>

                          {/* Price & Category */}
                          <div className="flex items-center justify-between py-2 border-y border-[#f0ede8] mb-3">
                            <span className="text-sm font-bold text-[#2c2417]">
                              {formatPrice(prod.price, prod.currency)}
                            </span>
                            <span className="text-[11px] bg-[#f5f0e8] text-[#8b7355] px-2.5 py-0.5 rounded-full font-medium capitalize">
                              {prod.category?.replace(/_/g, ' ')}
                            </span>
                          </div>

                          {/* Active ingredients */}
                          {prod.active_ingredients?.length > 0 && (
                            <div className="mb-3">
                              <p className="text-[10px] font-bold text-[#8b7355] uppercase tracking-wider mb-1.5">
                                Key Ingredients
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {prod.active_ingredients.slice(0, 3).map((act, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] bg-[#f9f8f6] border border-[#e8e4dc] text-[#5c4d3c] px-2 py-0.5 rounded-md"
                                  >
                                    {act}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Reasons why this alternative */}
                          {rec.reasons?.length > 0 && (
                            <div className="mb-4">
                              <button
                                onClick={() => toggleReason(prod.id)}
                                className="text-[11px] font-semibold text-[#8b7355] flex items-center gap-1 hover:text-[#2c2417] transition-colors"
                              >
                                Why this alternative?
                                <ChevronRight
                                  size={12}
                                  className={`transition-transform ${
                                    isExpanded ? 'rotate-90' : ''
                                  }`}
                                />
                              </button>
                              {isExpanded && (
                                <ul className="mt-2 space-y-1 pl-1">
                                  {rec.reasons.slice(0, 4).map((r, i) => (
                                    <li
                                      key={i}
                                      className="text-xs text-[#2c2417] flex items-start gap-1.5"
                                    >
                                      <span className="text-emerald-500 shrink-0 mt-0.5">•</span>
                                      <span>{r}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="pt-3 border-t border-[#f0ede8] flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleCompareWithOriginal(prod.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-[#f5f0e8] text-[#8b7355] hover:bg-[#e8e0d4] transition-colors"
                          >
                            <ArrowRightLeft size={13} />
                            Compare with Original
                          </button>

                          <button
                            onClick={() => toggleCompare(prod.id)}
                            className={`text-xs font-semibold px-3 py-2 rounded-xl transition-colors ${
                              isComparingThis
                                ? 'bg-[#8b7355] text-white'
                                : 'bg-[#faf8f5] border border-[#e8e4dc] text-[#8b7355] hover:bg-[#f5f0e8]'
                            }`}
                          >
                            {isComparingThis ? '✓ In Queue' : '+ Compare'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
                {comparing.length < 2 ? 'Select 1 more to compare' : 'Max 3 side-by-side'}
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
            <button
              disabled={comparing.length < 2}
              onClick={handleLaunchCompare}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                comparing.length >= 2
                  ? 'bg-[#8b7355] text-white hover:bg-[#9d8363] shadow-md'
                  : 'bg-[#443825] text-[#8b7355] cursor-not-allowed'
              }`}
            >
              Compare Now →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
