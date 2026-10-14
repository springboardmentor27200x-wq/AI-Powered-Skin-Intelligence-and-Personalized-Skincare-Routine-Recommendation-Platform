import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchRecommendations, compareProducts, fetchAlternatives } from "../api/client";

const CATEGORIES = ["Face Wash", "Moisturizer", "Sunscreen", "Serum", "Toner", "Treatment Products", "Face Masks"];

function scoreStyle(score) {
  if (score >= 80) return "bg-clinical-50 text-clinical-700 border-clinical-500";
  if (score >= 50) return "bg-amber-100 text-amber-700 border-amber-400";
  return "bg-bloom-200/70 text-bloom-600 border-bloom-500";
}

function ProductCard({ product, selected, onToggleSelect, onShowAlternatives }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-clay">
      <div className="flex items-center gap-3 px-4 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="focus-ring h-4 w-4 shrink-0 accent-clinical-500"
          aria-label={`Select ${product.name} for comparison`}
        />
        <button type="button" onClick={() => setOpen((o) => !o)} className="focus-ring flex flex-1 items-center justify-between gap-4 text-left">
          <div>
            <p className="text-sm font-medium text-ink">{product.name}</p>
            <p className="text-xs text-ink/50">{product.brand} · {product.category} · ₹{product.price}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${scoreStyle(product.score)}`}>
              {product.score}/100
            </span>
            <span className="text-ink/40">{open ? "−" : "+"}</span>
          </div>
        </button>
      </div>

      {open && (
        <div className="space-y-3 border-t border-clay/60 px-4 py-3 text-sm">
          <p className="text-ink/80">{product.description}</p>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Why this score</p>
            <div className="mt-1 space-y-1">
              {product.reasons.map((r, i) => (
                <p key={i} className="text-ink/70">• {r}</p>
              ))}
            </div>
          </div>
          {product.ingredients.length > 0 && (
            <p><span className="font-medium text-ink">Contains: </span><span className="text-ink/70">{product.ingredients.join(", ")}</span></p>
          )}
          <button
            type="button"
            onClick={() => onShowAlternatives(product)}
            className="focus-ring text-xs font-medium text-clinical-600 hover:underline"
          >
            See alternatives in this category
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProductRecommendations() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selected, setSelected] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [alternatives, setAlternatives] = useState(null);
  const [altFor, setAltFor] = useState(null);

  function load() {
    setLoading(true);
    setError("");
    fetchRecommendations(token, { category: category || undefined, maxPrice: maxPrice || undefined })
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function applyFilters(e) {
    e.preventDefault();
    load();
  }

  function toggleSelect(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < 3 ? [...s, id] : s));
    setComparison(null);
  }

  async function handleCompare() {
    if (selected.length < 2) return;
    setComparing(true);
    setError("");
    try {
      const result = await compareProducts(token, selected);
      setComparison(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setComparing(false);
    }
  }

  async function handleShowAlternatives(product) {
    setAltFor(product);
    setAlternatives(null);
    try {
      const result = await fetchAlternatives(token, product.id);
      setAlternatives(result);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="rounded-2xl border border-clay bg-white p-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">Product recommendations</p>
      <p className="mt-2 text-sm text-ink/60">Scored against your skin type, allergies, and priority concerns.</p>

      <form onSubmit={applyFilters} className="mt-5 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink/60">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="focus-ring rounded-lg border border-clay bg-white px-3 py-2 text-sm text-ink"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink/60">Max price (₹)</label>
          <input
            type="number"
            min="0"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="No limit"
            className="focus-ring w-32 rounded-lg border border-clay bg-white px-3 py-2 text-sm text-ink"
          />
        </div>
        <button
          type="submit"
          className="focus-ring rounded-full bg-clinical-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-clinical-600"
        >
          Filter
        </button>
      </form>

      {error && <p className="mt-4 rounded-lg bg-bloom-200/60 px-3 py-2 text-sm text-bloom-600">{error}</p>}

      {loading ? (
        <p className="mt-5 text-sm text-ink/50">Loading recommendations...</p>
      ) : products.length === 0 ? (
        <p className="mt-5 text-sm text-ink/50">No products match these filters.</p>
      ) : (
        <div className="mt-5 space-y-2">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              selected={selected.includes(p.id)}
              onToggleSelect={() => toggleSelect(p.id)}
              onShowAlternatives={handleShowAlternatives}
            />
          ))}
        </div>
      )}

      {selected.length > 0 && (
        <div className="mt-5 flex items-center gap-3 rounded-xl bg-mist p-3.5">
          <p className="flex-1 text-sm text-ink/70">{selected.length} selected for comparison</p>
          <button
            type="button"
            onClick={handleCompare}
            disabled={selected.length < 2 || comparing}
            className="focus-ring rounded-full bg-clinical-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-clinical-600 disabled:opacity-50"
          >
            {comparing ? "Comparing..." : "Compare Selected"}
          </button>
        </div>
      )}

      {comparison && (
        <div className="mt-5 overflow-x-auto rounded-xl border border-clay">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-clay bg-mist text-xs uppercase tracking-wide text-ink/50">
                <th className="px-4 py-2 font-medium">Product</th>
                <th className="px-4 py-2 font-medium">Price</th>
                <th className="px-4 py-2 font-medium">Score</th>
                <th className="px-4 py-2 font-medium">Top reason</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((p) => (
                <tr key={p.id} className="border-b border-clay/60 last:border-0">
                  <td className="px-4 py-2 text-ink">{p.name}</td>
                  <td className="px-4 py-2 text-ink/70">₹{p.price}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${scoreStyle(p.score)}`}>
                      {p.score}/100
                    </span>
                  </td>
                  <td className="px-4 py-2 text-ink/70">{p.reasons[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {altFor && (
        <div className="mt-5 rounded-xl bg-mist p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">Alternatives to {altFor.name}</p>
            <button type="button" onClick={() => setAltFor(null)} className="focus-ring text-xs text-ink/50 hover:text-ink">
              Close
            </button>
          </div>
          {!alternatives ? (
            <p className="mt-2 text-sm text-ink/50">Loading...</p>
          ) : alternatives.length === 0 ? (
            <p className="mt-2 text-sm text-ink/50">No other products in this category yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {alternatives.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                  <span className="text-sm text-ink">{a.name} <span className="text-ink/50">· ₹{a.price}</span></span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${scoreStyle(a.score)}`}>
                    {a.score}/100
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}