import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProductRecommendations, compareProducts } from "../services/api";

const CATEGORIES = ["All", "Face Wash", "Moisturizer", "Sunscreen", "Serum", "Toner", "Face Masks"];
const BUDGET_TIERS = ["All", "Budget", "Mid-range", "Premium"];

export default function ProductRecommendations() {
  const [products, setProducts] = useState([]);
  const [hasProfile, setHasProfile] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBudget, setSelectedBudget] = useState("All");
  const [selectedCompareIds, setSelectedCompareIds] = useState([]);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  const fetchProducts = () => {
    setLoading(true);
    getProductRecommendations(selectedCategory, selectedBudget)
      .then((r) => {
        setProducts(r.data);
        setHasProfile(true);
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setHasProfile(false);
          setProducts([]);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedBudget]);

  const toggleCompare = (id) => {
    if (selectedCompareIds.includes(id)) {
      setSelectedCompareIds(selectedCompareIds.filter((x) => x !== id));
    } else {
      if (selectedCompareIds.length >= 3) {
        alert("You can compare up to 3 products at a time.");
        return;
      }
      setSelectedCompareIds([...selectedCompareIds, id]);
    }
  };

  const handleRunComparison = async () => {
    if (selectedCompareIds.length < 2) {
      alert("Please select at least 2 products to compare.");
      return;
    }
    setComparing(true);
    try {
      const r = await compareProducts(selectedCompareIds);
      setComparisonResults(r.data);
    } catch {
      // ignore
    } finally {
      setComparing(false);
    }
  };

  if (!hasProfile) {
    return (
      <section>
        <div className="dashboard-head">
          <div>
            <p className="eyebrow">Product Intelligence</p>
            <h1>Personalized Product Recommendations</h1>
          </div>
        </div>
        <div className="card empty" style={{ textAlign: "center", padding: "60px 24px", maxWidth: 640, margin: "40px auto" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>🧴</div>
          <h2 style={{ fontSize: 24, marginBottom: 10, color: "var(--text-main)" }}>No Skin Profile Found</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
            Please create your skin profile first. Our recommendation engine matches products and ingredients specifically to your skin type, allergies, budget, and skin goals.
          </p>
          <Link to="/profile" className="primary" style={{ display: "inline-block", padding: "10px 24px", fontSize: 15, textDecoration: "none" }}>
            👉 Create Skin Profile
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="dashboard-head">
        <div>
          <p className="eyebrow">Product Intelligence</p>
          <h1>Personalized Product Recommendations</h1>
          <p style={{ color: "var(--text-muted)", marginTop: 4 }}>
            Dermatologist-grade product recommendations matched to your skin profile, concerns, and budget tier.
          </p>
        </div>
        {selectedCompareIds.length >= 2 && (
          <button className="primary" onClick={handleRunComparison} disabled={comparing}>
            {comparing ? "Comparing..." : `⚖️ Compare Selected (${selectedCompareIds.length})`}
          </button>
        )}
      </div>

      {/* Side-by-Side Product Comparison Section */}
      {comparisonResults && (
        <div className="card" style={{ marginBottom: 32, background: "linear-gradient(135deg, #ffffff 0%, #f4f8f6 100%)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 20 }}>⚖️ Side-by-Side Product Comparison</h3>
            <button className="secondary" onClick={() => setComparisonResults(null)} style={{ padding: "4px 12px", fontSize: 12 }}>
              Close Comparison
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="log-table" style={{ background: "white", borderRadius: 12 }}>
              <thead>
                <tr>
                  <th>Metric / Feature</th>
                  {comparisonResults.map((p) => (
                    <th key={p.id} style={{ minWidth: 200 }}>
                      <strong style={{ fontSize: 15, color: "var(--green-dark)", display: "block" }}>{p.name}</strong>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>by {p.brand}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Suitability Match</strong></td>
                  {comparisonResults.map((p) => (
                    <td key={p.id}>
                      <span className="badge badge-user" style={{ fontSize: 14, fontWeight: 800 }}>
                        {p.suitability_score}% Match
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td><strong>Price & Tier</strong></td>
                  {comparisonResults.map((p) => (
                    <td key={p.id}>
                      <strong style={{ fontSize: 15 }}>${p.price.toFixed(2)}</strong> ({p.budget_tier})
                    </td>
                  ))}
                </tr>
                <tr>
                  <td><strong>Category & Rating</strong></td>
                  {comparisonResults.map((p) => (
                    <td key={p.id}>
                      {p.category} · ⭐ {p.rating}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td><strong>Key Ingredients</strong></td>
                  {comparisonResults.map((p) => (
                    <td key={p.id}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {p.key_ingredients?.map((ing, i) => (
                          <span key={i} style={{ fontSize: 11, background: "var(--green-light)", color: "var(--green-dark)", padding: "2px 6px", borderRadius: 6 }}>
                            {ing}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td><strong>Target Concerns</strong></td>
                  {comparisonResults.map((p) => (
                    <td key={p.id}>
                      {p.target_concerns?.join(", ")}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td><strong>Suitability Rationale</strong></td>
                  {comparisonResults.map((p) => (
                    <td key={p.id} style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {p.suitability_reasons?.join(" ")}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category & Budget Filter Controls */}
      <div className="card" style={{ marginBottom: 28, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          {/* Category Filter */}
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Category
            </span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={selectedCategory === cat ? "primary" : "secondary"}
                  style={{ padding: "6px 14px", fontSize: 12, borderRadius: 8 }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Budget Filter */}
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Budget Tier
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {BUDGET_TIERS.map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedBudget(tier)}
                  className={selectedBudget === tier ? "primary" : "secondary"}
                  style={{ padding: "6px 14px", fontSize: 12, borderRadius: 8 }}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Product Catalog Grid */}
      {loading ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>Loading product recommendations...</div>
      ) : products.length === 0 ? (
        <div className="card empty">
          <h3>No products found</h3>
          <p>Try clearing filters to view products.</p>
        </div>
      ) : (
        <div className="grid-3">
          {products.map((p) => {
            const isComparing = selectedCompareIds.includes(p.id);
            return (
              <div key={p.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", borderLeft: "4px solid var(--green-dark)" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>{p.brand}</span>
                      <h3 style={{ fontSize: 18, margin: "2px 0 4px" }}>{p.name}</h3>
                    </div>
                    <span className="badge badge-user" style={{ fontSize: 13, fontWeight: 800 }}>
                      {p.suitability_score}% Match
                    </span>
                  </div>

                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.5 }}>
                    {p.description}
                  </p>

                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>Key Ingredients:</span>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {p.key_ingredients?.map((ing, idx) => (
                        <span key={idx} style={{ fontSize: 11, background: "var(--green-light)", color: "var(--green-dark)", padding: "2px 6px", borderRadius: 6, fontWeight: 600 }}>
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>

                  {p.suitability_reasons && p.suitability_reasons.length > 0 && (
                    <div style={{ fontSize: 12, color: "var(--green-mid)", background: "var(--green-bg)", padding: 8, borderRadius: 6, marginBottom: 12 }}>
                      ✅ {p.suitability_reasons[0]}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: 16, color: "var(--green-dark)" }}>${p.price.toFixed(2)}</strong>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 6 }}>⭐ {p.rating}</span>
                  </div>
                  <label className="check" style={{ fontSize: 12, margin: 0, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={isComparing}
                      onChange={() => toggleCompare(p.id)}
                    />
                    Compare
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
