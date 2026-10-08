import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";

function ProductRecommendations() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productsData, setProductsData] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeBudget, setActiveBudget] = useState("All");
  const [compareList, setCompareList] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get("http://127.0.0.1:5000/assessment", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setProductsData(res.data.products || {});
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setError("profile_missing");
        } else {
          setError(err.response?.data?.error || "Failed to load product recommendations.");
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const toggleCompare = (product) => {
    setCompareList((prev) => {
      const exists = prev.find((p) => p.name === product.name);
      if (exists) return prev.filter((p) => p.name !== product.name);
      if (prev.length >= 4) {
        alert("You can compare up to 4 products simultaneously.");
        return prev;
      }
      return [...prev, product];
    });
  };

  const isInCompare = (name) => compareList.some((p) => p.name === name);

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b7280" }}>
          <p style={{ fontSize: 16 }}>Finding ML-matched skincare products for your profile...</p>
        </div>
      </Layout>
    );
  }

  if (error === "profile_missing") {
    return (
      <Layout>
        <div style={{ maxWidth: 650, margin: "40px auto", textAlign: "center", background: "white", padding: 36, borderRadius: 18, border: "1px solid #e5e7eb" }}>
          <span style={{ fontSize: 44 }}>🛍️</span>
          <h2 style={{ color: "#1b4332", margin: "14px 0 8px" }}>Skin Profile Required</h2>
          <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>
            Complete your skin profile first so our Cosine Similarity recommendation engine can match safe, optimal products for you.
          </p>
          <Link
            to="/profile"
            style={{
              display: "inline-block",
              background: "#2d6a4f",
              color: "white",
              padding: "12px 24px",
              borderRadius: 10,
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Complete Skin Profile Now →
          </Link>
        </div>
      </Layout>
    );
  }

  const byCategory = productsData?.by_category || {};
  const categories = ["All", ...Object.keys(byCategory)];

  // Gather all products
  let allProducts = [];
  Object.entries(byCategory).forEach(([cat, list]) => {
    if (Array.isArray(list)) {
      list.forEach((p) => {
        allProducts.push({ ...p, category: cat });
      });
    }
  });

  // Filter products by category and budget
  const filtered = allProducts.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchBudget =
      activeBudget === "All" || (p.budget || "").toLowerCase() === activeBudget.toLowerCase();
    return matchCat && matchBudget;
  });

  return (
    <Layout>
      <div style={{ maxWidth: 1040, margin: "0 auto", paddingBottom: 60 }}>
        {/* Header */}
        <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1b4332", margin: 0 }}>
              Personalized Product Recommendations
            </h1>
            <p style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>
              Content-based machine learning matching ingredients and textures to your specific skin needs.
            </p>
          </div>
          <span style={{ fontSize: 12, background: "#e8f5e9", color: "#1b4332", padding: "6px 14px", borderRadius: 20, fontWeight: 600 }}>
            Model: Cosine Similarity v1
          </span>
        </div>

        {/* Category & Budget Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 14, marginBottom: 24 }}>
          {/* Categories */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "7px 16px",
                  borderRadius: 20,
                  border: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: activeCategory === cat ? "#2d6a4f" : "#e8f5e9",
                  color: activeCategory === cat ? "white" : "#1b4332",
                  transition: "all 0.15s ease",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Budget Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#6b7280" }}>Budget:</span>
            {["All", "Budget", "Mid", "Premium"].map((tier) => (
              <button
                key={tier}
                onClick={() => setActiveBudget(tier)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 14,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: activeBudget === tier ? "1.5px solid #2d6a4f" : "1px solid #d1d5db",
                  background: activeBudget === tier ? "#1b4332" : "white",
                  color: activeBudget === tier ? "white" : "#374151",
                }}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* ── Side-by-Side Product Comparison Drawer ── */}
        {compareList.length > 0 && (
          <div
            style={{
              background: "#f0fdf4",
              border: "1.5px solid #86efac",
              borderRadius: 16,
              padding: 20,
              marginBottom: 32,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <strong style={{ color: "#166534", fontSize: 16 }}>
                  Comparing {compareList.length} of 4 Products
                </strong>
                <span style={{ color: "#6b7280", fontSize: 13, marginLeft: 10 }}>
                  Side-by-side suitability and ingredient breakdown
                </span>
              </div>
              <button
                onClick={() => setCompareList([])}
                style={{ background: "none", border: "none", color: "#b91c1c", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
              >
                Clear comparison
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: `repeat(${compareList.length}, 1fr)`, gap: 14 }}>
              {compareList.map((p, idx) => (
                <div key={idx} style={{ background: "white", borderRadius: 12, padding: 14, border: "1px solid #bbf7d0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{p.brand || "Brand"}</div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#1b4332" }}>{p.name}</div>
                    </div>
                    <button
                      onClick={() => toggleCompare(p)}
                      style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 14 }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0 10px" }}>
                    <span style={{ fontWeight: 800, color: "#166534", fontSize: 16 }}>
                      {p.score || p.suitability_score}% Match
                    </span>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>• ₹{p.price || "—"}</span>
                  </div>

                  <div style={{ fontSize: 12, color: "#374151", marginBottom: 6 }}>
                    <strong>Key Ingredients:</strong>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                      {(p.key_ingredients || []).map((ing, iIdx) => (
                        <span key={iIdx} style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: 6, fontSize: 11 }}>
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: "#4b5563" }}>
                    <strong>Why it matches:</strong>
                    <ul style={{ margin: "4px 0 0", paddingLeft: 16, lineHeight: 1.4 }}>
                      {(p.match_reasons || ["Recommended for your profile"]).map((r, rIdx) => (
                        <li key={rIdx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Product Grid ── */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", background: "white", borderRadius: 16 }}>
            <p style={{ color: "#6b7280" }}>No products matched this filter.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 20 }}>
            {filtered.map((product, idx) => {
              const inComp = isInCompare(product.name);
              const matchScore = product.score || product.suitability_score || 70;

              return (
                <div
                  key={idx}
                  style={{
                    background: "white",
                    borderRadius: 16,
                    padding: 20,
                    border: inComp ? "2px solid #2d6a4f" : "1px solid #e5e7eb",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    {/* Top Row: Brand & Category */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>
                        {product.brand || "Skincare"} • {product.category}
                      </span>
                      <span
                        style={{
                          background: "#e8f5e9",
                          color: "#166534",
                          fontWeight: 700,
                          fontSize: 12,
                          padding: "3px 10px",
                          borderRadius: 12,
                        }}
                      >
                        {matchScore}% Match
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3 style={{ margin: "0 0 8px", fontSize: 16, color: "#1b4332", fontWeight: 700 }}>
                      {product.name}
                    </h3>

                    {/* Price & Rating */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, fontSize: 13 }}>
                      <span style={{ fontWeight: 700, color: "#1b4332" }}>₹{product.price || "—"}</span>
                      <span style={{ color: "#6b7280" }}>• Tier: {product.budget || "mid"}</span>
                      {product.rating && (
                        <span style={{ color: "#f59e0b", fontWeight: 600 }}>★ {product.rating}</span>
                      )}
                    </div>

                    {/* Key Ingredients */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>
                        KEY INGREDIENTS
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {(product.key_ingredients || []).slice(0, 4).map((ing, iIdx) => (
                          <span
                            key={iIdx}
                            style={{
                              background: "#f3f4f6",
                              color: "#374151",
                              padding: "2px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 500,
                            }}
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Reasons */}
                    <div style={{ fontSize: 12.5, color: "#4b5563", marginBottom: 16 }}>
                      {(product.match_reasons || []).slice(0, 2).map((reason, rIdx) => (
                        <div key={rIdx} style={{ display: "flex", gap: 6, marginBottom: 3 }}>
                          <span style={{ color: "#16a34a" }}>✓</span>
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Compare Button */}
                  <button
                    onClick={() => toggleCompare(product)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      border: inComp ? "none" : "1.5px solid #2d6a4f",
                      background: inComp ? "#2d6a4f" : "white",
                      color: inComp ? "white" : "#2d6a4f",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {inComp ? "✓ In Comparison" : "+ Compare Product"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Alternative Product Suggestions Section ── */}
        {(productsData?.alternatives || []).length > 0 && (
          <div style={{ marginTop: 42, borderTop: "1px solid #e5e7eb", paddingTop: 28 }}>
            <div style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1b4332", margin: 0 }}>
                  🔄 Alternative Product Suggestions
                </h2>
                <p style={{ color: "#6b7280", marginTop: 4, fontSize: 13.5 }}>
                  Secondary matches and alternative formulas calibrated for your profile.
                </p>
              </div>
              <span style={{ fontSize: 12, background: "#f0fdf4", color: "#166534", padding: "4px 10px", borderRadius: 12, fontWeight: 600 }}>
                {productsData.alternatives.length} Alternatives Available
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {productsData.alternatives.map((altProd, aIdx) => {
                const inComp = isInCompare(altProd.name);
                const matchScore = altProd.score || altProd.suitability_score || 65;

                return (
                  <div
                    key={aIdx}
                    style={{
                      background: "#fafcfb",
                      borderRadius: 14,
                      padding: 18,
                      border: "1px dashed #cbd5e1",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>
                          {altProd.brand || "Skincare"} • {altProd.category}
                        </span>
                        <span style={{ background: "#e0f2fe", color: "#0369a1", fontSize: 11.5, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>
                          {matchScore}% Match
                        </span>
                      </div>

                      <h4 style={{ margin: "0 0 6px", fontSize: 15, color: "#1b4332", fontWeight: 700 }}>
                        {altProd.name}
                      </h4>

                      <div style={{ display: "flex", gap: 8, fontSize: 12.5, color: "#6b7280", marginBottom: 10 }}>
                        <span style={{ fontWeight: 700, color: "#1b4332" }}>₹{altProd.price || "—"}</span>
                        <span>• Tier: {altProd.budget || "mid"}</span>
                      </div>

                      <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 12 }}>
                        {(altProd.match_reasons || []).slice(0, 1).map((r, rIdx) => (
                          <div key={rIdx} style={{ display: "flex", gap: 6 }}>
                            <span style={{ color: "#2563eb" }}>ℹ</span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => toggleCompare(altProd)}
                      style={{
                        padding: "8px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        border: inComp ? "none" : "1px solid #2d6a4f",
                        background: inComp ? "#2d6a4f" : "white",
                        color: inComp ? "white" : "#2d6a4f",
                      }}
                    >
                      {inComp ? "✓ In Comparison" : "+ Compare Alternative"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ProductRecommendations;