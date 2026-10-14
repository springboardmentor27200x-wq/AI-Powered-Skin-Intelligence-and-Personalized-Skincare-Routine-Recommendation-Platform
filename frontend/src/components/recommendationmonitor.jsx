import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchRecommendationMonitoring } from "../api/client";

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-clay bg-white p-5">
      <p className="font-display text-2xl text-ink">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-ink/50">{label}</p>
      {hint && <p className="mt-1 text-xs text-ink/40">{hint}</p>}
    </div>
  );
}

function ProductCell({ p }) {
  return (
    <td className="px-4 py-2">
      <p className="text-ink">{p.name}</p>
      <p className="text-xs text-ink/50">{[p.brand, p.category].filter(Boolean).join(" · ")}</p>
    </td>
  );
}

export default function RecommendationMonitor() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRecommendationMonitoring(token)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div>
      <h2 className="font-display text-lg text-ink">Recommendation monitoring</h2>
      <p className="mt-1 text-sm text-ink/60">
        What the recommendation engine is suggesting across every user with a skin profile. A product counts as
        recommended for a user when it scores {data?.recommended_min_score ?? 80} or higher for them.
      </p>

      {error && <p className="mt-4 rounded-lg bg-bloom-200/60 px-3 py-2 text-sm text-bloom-600">{error}</p>}
      {loading && <p className="mt-4 text-sm text-ink/50">Loading...</p>}

      {data && data.users_evaluated === 0 && (
        <p className="mt-4 rounded-2xl border border-clay bg-white px-5 py-6 text-sm text-ink/50">
          No users have a skin profile yet, so there are no recommendations to monitor.
        </p>
      )}

      {data && data.users_evaluated > 0 && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Users evaluated" value={data.users_evaluated} />
            <Stat label="Products evaluated" value={data.products_evaluated} />
            <Stat label="Avg. recommendation score" value={data.average_score ?? "—"} />
            <Stat
              label="Allergen conflicts"
              value={data.allergen_conflict_pairs}
              hint={data.conflict_rate != null ? `${data.conflict_rate}% of ${data.total_pairs} pairings` : null}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-medium text-ink">Most recommended products</h3>
              <div className="overflow-x-auto rounded-xl border border-clay bg-white">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-clay bg-mist text-xs uppercase tracking-wide text-ink/50">
                      <th className="px-4 py-2 font-medium">Product</th>
                      <th className="px-4 py-2 font-medium">Suits</th>
                      <th className="px-4 py-2 font-medium">Avg score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_products.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-4 text-center text-ink/50">
                          No product reaches the threshold for any user.
                        </td>
                      </tr>
                    ) : (
                      data.top_products.map((p) => (
                        <tr key={p.product_id} className="border-b border-clay/60 last:border-0">
                          <ProductCell p={p} />
                          <td className="px-4 py-2 text-ink/70">
                            {p.times_recommended} of {data.users_evaluated}
                          </td>
                          <td className="px-4 py-2 text-ink/70">{p.average_score}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium text-ink">Most flagged products</h3>
              <div className="overflow-x-auto rounded-xl border border-clay bg-white">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-clay bg-mist text-xs uppercase tracking-wide text-ink/50">
                      <th className="px-4 py-2 font-medium">Product</th>
                      <th className="px-4 py-2 font-medium">Allergen</th>
                      <th className="px-4 py-2 font-medium">Caution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.most_flagged_products.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-4 text-center text-ink/50">
                          No product is flagged for any user.
                        </td>
                      </tr>
                    ) : (
                      data.most_flagged_products.map((p) => (
                        <tr key={p.product_id} className="border-b border-clay/60 last:border-0">
                          <ProductCell p={p} />
                          <td className="px-4 py-2 text-ink/70">{p.allergen_conflicts}</td>
                          <td className="px-4 py-2 text-ink/70">{p.caution_flags}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-ink/40">
                Allergen = a user's stated allergy matches an ingredient. Caution = the product needs care for
                that user's skin type or sensitivities.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-2 text-sm font-medium text-ink">Average score by category</h3>
            <div className="space-y-2 rounded-xl border border-clay bg-white p-4">
              {data.category_scores.map((c) => (
                <div key={c.category} className="flex items-center gap-3 text-sm">
                  <span className="w-32 shrink-0 text-ink/70">{c.category}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-mist">
                    <div
                      className="h-full rounded-full bg-clinical-500"
                      style={{ width: `${Math.max(0, Math.min(100, c.average_score))}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-ink">{c.average_score}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}