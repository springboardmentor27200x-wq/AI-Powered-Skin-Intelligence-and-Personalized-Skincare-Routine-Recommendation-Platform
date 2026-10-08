import React, { useState } from 'react';
import { Sparkles, ShieldCheck, CheckCircle2, Star, ExternalLink, Filter } from 'lucide-react';
import ProductRecommendationModal from './ProductRecommendationModal';

export default function ProductShowcase({ routinePlan, className = '' }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Collect all unique products from routine steps
  const allProductsMap = new Map();
  if (routinePlan) {
    ['morning', 'evening', 'weekly', 'seasonal'].forEach(timeKey => {
      const routineObj = routinePlan[timeKey];
      const steps = Array.isArray(routineObj?.steps)
        ? routineObj.steps
        : (Array.isArray(routinePlan[`${timeKey}_steps`]) ? routinePlan[`${timeKey}_steps`] : []);
      steps.forEach(st => {
        (st.product_recommendations || []).forEach(prod => {
          if (!allProductsMap.has(prod.id)) {
            allProductsMap.set(prod.id, {
              ...prod,
              recommendedInStep: st.title,
              timePeriod: timeKey.toUpperCase(),
            });
          }
        });
      });
    });
  }

  const allProducts = Array.from(allProductsMap.values());
  const categories = ['ALL', ...new Set(allProducts.map(p => p.category))];

  const filteredProducts = categoryFilter === 'ALL'
    ? allProducts
    : allProducts.filter(p => p.category === categoryFilter);

  if (allProducts.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-base font-black text-gray-900 tracking-tight">
              Curated Medical-Grade Product Recommendations
            </h3>
          </div>
          <p className="text-xs text-gray-500">
            Dermatologist-formulated matches cleared for zero allergen conflicts with your skin profile.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-[#142e23] text-white shadow-xs'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/70'
              }`}
            >
              {cat === 'ALL' ? 'All Formulas' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(prod => (
          <div
            key={prod.id}
            className="p-4 rounded-2xl border border-gray-100 bg-[#fbfdfc] hover:border-emerald-200/80 hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                  {prod.brand}
                </span>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  {prod.match_score}% Match
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-900 group-hover:text-emerald-800 transition-colors">
                  {prod.name}
                </h4>
                <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-snug">
                  {prod.clinical_summary}
                </p>
              </div>

              {/* Key Actives */}
              {prod.key_actives?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {prod.key_actives.map((act, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-[10px] font-medium text-gray-700"
                    >
                      {act}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                <ShieldCheck size={13} />
                <span className="text-[10px]">Allergen Tested</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(prod)}
                className="inline-flex items-center gap-1 font-bold text-gray-800 hover:text-emerald-700 transition-colors cursor-pointer"
              >
                <span>Specs</span>
                <ExternalLink size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductRecommendationModal
          isOpen={Boolean(selectedProduct)}
          onClose={() => setSelectedProduct(null)}
          stepTitle={selectedProduct.recommendedInStep || selectedProduct.name}
          stepCategory={selectedProduct.category}
          products={[selectedProduct]}
        />
      )}
    </div>
  );
}
