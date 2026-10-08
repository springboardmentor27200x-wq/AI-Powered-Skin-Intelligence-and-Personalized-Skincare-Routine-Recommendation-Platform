import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, BarChart3, X, Plus, ShoppingBag, RefreshCw } from 'lucide-react';
import { productService } from '../../services/productService';
import { formatPrice } from '../../utils/formatters';

const SafetyBadge = ({ status, exclusionReason }) => {
  if (status === 'ALLERGEN_CONFLICT' || exclusionReason === 'ALLERGEN_CONFLICT') {
    return (
      <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
        <XCircle size={11} /> Excluded
      </span>
    );
  }
  if (status === 'CAUTION') {
    return (
      <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
        <AlertTriangle size={11} /> Caution
      </span>
    );
  }
  return (
    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
      <CheckCircle size={11} /> Safe
    </span>
  );
};

const MatchBar = ({ score }) => {
  if (score == null) return <span className="text-sm text-[#b5a397]">—</span>;
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#94a3b8';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-[#f0ede8] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-sm font-bold" style={{ color }}>{score}%</span>
    </div>
  );
};

export default function ProductComparison() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Read product IDs from query params (?ids=id1,id2), location.state, or sessionStorage
  const [productIds, setProductIds] = useState(() => {
    const rawIds = searchParams.get('ids');
    if (rawIds) {
      const parsed = rawIds.split(',').map((id) => id.trim()).filter(Boolean);
      if (parsed.length > 0) return parsed.slice(0, 3);
    }
    if (location.state?.productIds?.length) {
      return location.state.productIds.slice(0, 3);
    }
    try {
      const saved = sessionStorage.getItem('comparing_product_ids');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 3);
      }
    } catch {
      // ignore
    }
    return [];
  });

  const loadComparison = useCallback(async (ids) => {
    if (!ids || ids.length < 2) {
      setComparison(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await productService.compare(ids);
      setComparison(res.data);
      try {
        sessionStorage.setItem('comparing_product_ids', JSON.stringify(ids));
      } catch {
        // ignore
      }
      setSearchParams({ ids: ids.join(',') }, { replace: true });
    } catch (err) {
      console.error('Comparison error:', err);
      setError("We couldn't load the comparison right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [setSearchParams]);

  useEffect(() => {
    loadComparison(productIds);
  }, [productIds, loadComparison]);

  const handleRemoveProduct = (productIdToRemove) => {
    const next = productIds.filter((id) => id !== productIdToRemove);
    setProductIds(next);
    try {
      sessionStorage.setItem('comparing_product_ids', JSON.stringify(next));
    } catch {
      // ignore
    }
    if (next.length >= 2) {
      setSearchParams({ ids: next.join(',') });
    } else {
      setSearchParams({});
    }
  };

  const ROWS = [
    { label: 'Category', render: (p) => p?.category?.replace(/_/g, ' ') || '—' },
    { label: 'Brand', render: (p) => p?.brand || '—' },
    { label: 'Price', render: (p) => p?.price != null ? formatPrice(p.price, p.currency) : '—' },
    { label: 'Size', render: (p) => p?.size || '—' },
    { label: 'Budget Tier', render: (p) => p?.budget_band || '—' },
    { label: 'Suitable Skin Types', render: (p) => (p?.skin_types || []).join(', ') || '—' },
    { label: 'Key Concerns', render: (p) => (p?.target_concerns || []).slice(0, 3).join(', ').replace(/_/g, ' ') || '—' },
    { label: 'Active Ingredients', render: (p) => (p?.active_ingredients || []).slice(0, 4).join(', ') || '—' },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf6] pb-16">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e4dc] px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8b7355] hover:text-[#2c2417] transition-colors mb-3"
          >
            <ArrowLeft size={14} /> Back to Recommendations
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={22} className="text-[#8b7355]" />
              <h1 className="text-2xl font-bold text-[#2c2417]">Product Comparison</h1>
            </div>
            {productIds.length < 3 && productIds.length >= 2 && (
              <Link
                to="/products"
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-[#f5f0e8] text-[#8b7355] rounded-xl hover:bg-[#e8e0d4] transition-colors"
              >
                <Plus size={13} /> Add Product (up to 3)
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        {productIds.length < 2 ? (
          <div className="text-center py-20 bg-white border border-[#e8e4dc] rounded-2xl p-8 max-w-lg mx-auto shadow-sm">
            <ShoppingBag size={44} className="text-[#d4cabb] mx-auto mb-3" />
            <h2 className="text-lg font-bold text-[#2c2417] mb-1">Select Products to Compare</h2>
            <p className="text-xs text-[#8b7355] mb-6 leading-relaxed">
              You need at least 2 products selected to view a side-by-side comparison. Return to
              product recommendations to choose products to compare.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8b7355] text-white rounded-xl text-sm font-semibold hover:bg-[#725e45] transition-colors shadow-sm"
            >
              Browse Recommendations
            </Link>
          </div>
        ) : loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-3 border-[#8b7355] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-[#8b7355] font-medium animate-pulse">
              Comparing product formulas and profile compatibility...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white border border-[#e8e4dc] rounded-2xl p-8">
            <p className="text-red-500 text-sm mb-4">{error}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => loadComparison(productIds)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8b7355] text-white rounded-xl text-xs font-semibold hover:bg-[#725e45]"
              >
                <RefreshCw size={13} /> Try Again
              </button>
              <Link to="/products" className="text-xs text-[#8b7355] underline">
                Back to Recommendations
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop: Table */}
            <div className="hidden md:block overflow-x-auto shadow-sm rounded-2xl">
              <table className="w-full bg-white border border-[#e8e4dc] rounded-2xl overflow-hidden">
                <thead>
                  <tr className="bg-[#faf8f5]">
                    <th className="text-left p-4 text-xs font-bold text-[#8b7355] uppercase tracking-widest w-40">
                      Attribute
                    </th>
                    {comparison?.products.map((item) => (
                      <th key={item.product?.id} className="p-4 text-center min-w-[220px] relative">
                        {comparison.products.length > 2 && (
                          <button
                            onClick={() => handleRemoveProduct(item.product?.id)}
                            title="Remove from comparison"
                            className="absolute top-2 right-2 p-1 text-[#b5a397] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        )}
                        <p className="font-bold text-[#2c2417] text-sm mb-0.5">{item.product?.name}</p>
                        <p className="text-xs text-[#b5a397]">{item.product?.brand || 'Brand'}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Profile Match Row */}
                  <tr className="border-t border-[#f0ede8] bg-[#fafaf6]">
                    <td className="p-4 text-xs font-bold text-[#8b7355] uppercase tracking-wide">
                      Profile Match
                    </td>
                    {comparison?.products.map((item) => (
                      <td key={item.product?.id} className="p-4">
                        <MatchBar score={item.match_score} />
                      </td>
                    ))}
                  </tr>
                  {/* Safety Row */}
                  <tr className="border-t border-[#f0ede8]">
                    <td className="p-4 text-xs font-bold text-[#8b7355] uppercase tracking-wide">
                      Safety
                    </td>
                    {comparison?.products.map((item) => (
                      <td key={item.product?.id} className="p-4 text-center">
                        <SafetyBadge status={item.safety_status} exclusionReason={item.exclusion_reason} />
                      </td>
                    ))}
                  </tr>
                  {/* Data Rows */}
                  {ROWS.map((row) => (
                    <tr key={row.label} className="border-t border-[#f0ede8] hover:bg-[#faf8f5] transition-colors">
                      <td className="p-4 text-xs font-semibold text-[#8b7355] uppercase tracking-wide whitespace-nowrap">
                        {row.label}
                      </td>
                      {comparison?.products.map((item) => (
                        <td key={item.product?.id} className="p-4 text-sm text-[#2c2417] text-center capitalize">
                          {row.render(item.product)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Why Recommended */}
                  <tr className="border-t border-[#f0ede8]">
                    <td className="p-4 text-xs font-bold text-[#8b7355] uppercase tracking-wide">
                      Key Highlights
                    </td>
                    {comparison?.products.map((item) => (
                      <td key={item.product?.id} className="p-4 text-left">
                        {item.reasons?.length > 0 ? (
                          <ul className="text-xs text-[#2c2417] space-y-1.5 pl-2">
                            {item.reasons.slice(0, 3).map((r, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-emerald-500 shrink-0 mt-0.5">•</span>
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-xs text-[#b5a397] block text-center">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile: Stacked cards */}
            <div className="md:hidden space-y-4">
              {comparison?.products.map((item) => (
                <div key={item.product?.id} className="bg-white border border-[#e8e4dc] rounded-2xl p-5 shadow-sm relative">
                  {comparison.products.length > 2 && (
                    <button
                      onClick={() => handleRemoveProduct(item.product?.id)}
                      className="absolute top-4 right-4 p-1.5 text-[#b5a397] hover:text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <h3 className="font-bold text-[#2c2417] text-base mb-0.5 pr-6">{item.product?.name}</h3>
                  {item.product?.brand && (
                    <p className="text-xs text-[#b5a397] mb-3">{item.product?.brand}</p>
                  )}
                  <div className="mb-3">
                    <SafetyBadge status={item.safety_status} exclusionReason={item.exclusion_reason} />
                  </div>
                  <div className="mb-4 bg-[#fafaf6] p-3 rounded-xl">
                    <p className="text-xs font-bold text-[#8b7355] mb-1">Profile Match</p>
                    <MatchBar score={item.match_score} />
                  </div>
                  <dl className="space-y-2.5">
                    {ROWS.map((row) => (
                      <div key={row.label} className="flex justify-between gap-2 text-sm border-b border-[#f0ede8] pb-1.5">
                        <dt className="font-semibold text-[#8b7355] text-xs uppercase">{row.label}</dt>
                        <dd className="text-[#2c2417] text-right capitalize font-medium">{row.render(item.product)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-[#b5a397] text-center mt-6">
              Profile Match scores and safety statuses are calculated algorithmically based on your dermatological profile.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
