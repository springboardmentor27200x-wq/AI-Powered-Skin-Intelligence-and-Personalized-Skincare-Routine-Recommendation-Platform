import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchProductCatalog, fetchMyProducts, startUsingProduct, stopUsingProduct } from "../api/client";

const LIFESPAN_OPTIONS = [30, 45, 60, 90];

const STATUS_STYLE = {
  ok: { label: "On track", badge: "bg-clinical-50 text-clinical-700", bar: "bg-clinical-500" },
  low: { label: "Running low", badge: "bg-[#fdf1d8] text-[#8a5a0b]", bar: "bg-[#d9902a]" },
  empty: { label: "Time to restock", badge: "bg-bloom-200/60 text-bloom-600", bar: "bg-bloom-600" },
};

function daysText(p) {
  if (p.days_left > 0) return `${p.days_left} day${p.days_left === 1 ? "" : "s"} left`;
  if (p.days_left === 0) return "Runs out today";
  const n = Math.abs(p.days_left);
  return `Ran out ${n} day${n === 1 ? "" : "s"} ago`;
}

export default function MyProducts() {
  const { user, token } = useAuth();
  if (user.role !== "user") return <Navigate to="/dashboard" replace />;

  const [catalog, setCatalog] = useState([]);
  const [mine, setMine] = useState([]);
  const [productId, setProductId] = useState("");
  const [lifespan, setLifespan] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetchProductCatalog(), fetchMyProducts(token)])
      .then(([products, tracked]) => {
        setCatalog(products);
        setMine(tracked);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  function upsert(saved) {
    setMine((list) => {
      const others = list.filter((p) => p.product_id !== saved.product_id);
      return [...others, saved].sort((a, b) => a.days_left - b.days_left);
    });
  }

  async function handleStart(e) {
    e.preventDefault();
    if (!productId) return;
    setError("");
    setBusy(true);
    try {
      const saved = await startUsingProduct(token, productId, lifespan ? Number(lifespan) : null);
      upsert(saved);
      setProductId("");
      setLifespan("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRestart(p) {
    setError("");
    try {
      upsert(await startUsingProduct(token, p.product_id, null));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemove(p) {
    setError("");
    try {
      await stopUsingProduct(token, p.product_id);
      setMine((list) => list.filter((x) => x.product_id !== p.product_id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">My products</p>
      <h1 className="mt-2 font-display text-3xl text-ink">What you're using</h1>
      <p className="mt-3 max-w-lg text-ink/65">
        Tell us when you start a product and we'll remind you before it runs out.
      </p>

      {error && <p className="mt-6 rounded-lg bg-bloom-200/60 px-3 py-2 text-sm text-bloom-600">{error}</p>}

      <form onSubmit={handleStart} className="mt-8 rounded-2xl border border-clay bg-white p-5">
        <h2 className="font-display text-lg text-ink">Start using a product</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            className="focus-ring min-w-[14rem] flex-1 rounded-xl border border-clay bg-white px-4 py-2.5 text-ink"
          >
            <option value="">Choose a product...</option>
            {catalog.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.category}
              </option>
            ))}
          </select>
          <select
            value={lifespan}
            onChange={(e) => setLifespan(e.target.value)}
            className="focus-ring rounded-xl border border-clay bg-white px-4 py-2.5 text-ink"
            aria-label="How long it lasts"
          >
            <option value="">Typical lifespan</option>
            {LIFESPAN_OPTIONS.map((d) => (
              <option key={d} value={d}>
                Lasts {d} days
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={busy || !productId}
            className="focus-ring rounded-full bg-clinical-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-clinical-600 disabled:opacity-60"
          >
            {busy ? "Saving..." : "Start using"}
          </button>
        </div>
        <p className="mt-3 text-xs text-ink/50">
          Picking a product you already track restarts its timer, as if you'd opened a new one today.
        </p>
      </form>

      <section className="mt-8">
        {loading ? (
          <p className="text-sm text-ink/50">Loading...</p>
        ) : mine.length === 0 ? (
          <p className="rounded-2xl border border-clay bg-white px-5 py-8 text-center text-sm text-ink/50">
            You're not tracking any products yet. Choose one above to start.
          </p>
        ) : (
          <ul className="space-y-3">
            {mine.map((p) => {
              const style = STATUS_STYLE[p.status] ?? STATUS_STYLE.ok;
              const pct = Math.max(0, Math.min(100, (p.days_left / p.lasts_days) * 100));
              return (
                <li key={p.product_id} className="rounded-2xl border border-clay bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{p.name}</p>
                      <p className="mt-0.5 text-xs text-ink/50">
                        {[p.brand, p.category].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${style.badge}`}>{style.label}</span>
                  </div>

                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-mist">
                    <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-ink/60">
                      {daysText(p)} · started {new Date(p.started_on).toLocaleDateString()} · lasts {p.lasts_days} days
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleRestart(p)}
                        className="focus-ring rounded-full border border-clinical-500 px-3.5 py-1 text-xs font-medium text-clinical-600 transition hover:bg-clinical-50"
                      >
                        Started a new one
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(p)}
                        className="focus-ring rounded-full border border-clay px-3.5 py-1 text-xs text-ink/70 transition hover:border-bloom-600 hover:text-bloom-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}