import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchMySuitability, fetchIngredientDetail } from "../api/client";

const STATUS_STYLES = {
  avoid: { label: "Avoid", pill: "bg-bloom-200/70 text-bloom-600 border-bloom-500" },
  caution: { label: "Caution", pill: "bg-amber-100 text-amber-700 border-amber-400" },
  suitable: { label: "Suitable", pill: "bg-clinical-50 text-clinical-700 border-clinical-500" },
};

function StatusPill({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.suitable;
  return (
    <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${s.pill}`}>
      {s.label}
    </span>
  );
}

export default function IngredientLibrary() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchMySuitability(token)
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function toggleExpand(item) {
    if (expandedId === item.ingredient_id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(item.ingredient_id);
    if (!detailCache[item.ingredient_id]) {
      setDetailLoading(true);
      try {
        const detail = await fetchIngredientDetail(token, item.ingredient_id);
        setDetailCache((c) => ({ ...c, [item.ingredient_id]: detail }));
      } catch (err) {
        setError(err.message);
      } finally {
        setDetailLoading(false);
      }
    }
  }

  if (loading) {
    return <p className="text-sm text-ink/50">Loading ingredient suitability...</p>;
  }

  if (error) {
    return <p className="rounded-lg bg-bloom-200/60 px-3 py-2 text-sm text-bloom-600">{error}</p>;
  }

  return (
    <div className="rounded-2xl border border-clay bg-white p-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">Ingredient intelligence</p>
      <p className="mt-2 text-sm text-ink/60">
        Checked against your skin type, allergies, and sensitivities.
      </p>

      <div className="mt-5 space-y-2">
        {items.map((item) => {
          const isOpen = expandedId === item.ingredient_id;
          const detail = detailCache[item.ingredient_id];
          return (
            <div key={item.ingredient_id} className="rounded-xl border border-clay">
              <button
                type="button"
                onClick={() => toggleExpand(item)}
                className="focus-ring flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{item.name}</p>
                  <p className="text-xs text-ink/50">{item.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill status={item.status} />
                  <span className="text-ink/40">{isOpen ? "−" : "+"}</span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-clay/60 px-4 py-3 text-sm">
                  <div className="space-y-1">
                    {item.reasons.map((r, i) => (
                      <p key={i} className="text-ink/70">• {r}</p>
                    ))}
                  </div>

                  {detailLoading && !detail && (
                    <p className="mt-3 text-xs text-ink/40">Loading details...</p>
                  )}

                  {detail && (
                    <div className="mt-3 space-y-2 border-t border-clay/60 pt-3">
                      <p className="text-ink/80">{detail.description}</p>
                      <p><span className="font-medium text-ink">Benefits: </span><span className="text-ink/70">{detail.benefits}</span></p>
                      {detail.caution_notes && (
                        <p><span className="font-medium text-ink">Notes: </span><span className="text-ink/70">{detail.caution_notes}</span></p>
                      )}
                      {detail.conflicts.length > 0 && (
                        <div>
                          <p className="font-medium text-ink">Don't combine with:</p>
                          <ul className="mt-1 space-y-1">
                            {detail.conflicts.map((c, i) => (
                              <li key={i} className="text-ink/70">
                                <span className="font-medium">{c.name}</span> — {c.reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}