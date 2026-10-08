import React from "react";

function ProductCompareModal({ products = [], onClose }) {
  if (!products || products.length === 0) return null;

  // Sort by suitability score (highest first)
  const sorted = [...products].sort(
    (a, b) => (b.suitability_score || 0) - (a.suitability_score || 0)
  );

  const bestScore = sorted[0]?.suitability_score || 0;

  return (
    <div style={overlay}>
      <div style={modal}>
        {/* Header */}
        <div style={header}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#1b4332" }}>
              Product Comparison
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
              Comparing {sorted.length} selected products
            </p>
          </div>

          <button onClick={onClose} style={closeBtn}>
            ✕
          </button>
        </div>

        {/* Comparison Grid */}
        <div style={grid}>
          {sorted.map((product, index) => {
            const isBest = product.suitability_score === bestScore;

            return (
              <div
                key={product.name + index}
                style={{
                  ...card,
                  border: isBest ? "2px solid #2d6a4f" : "1px solid #e2ebe4",
                  background: isBest ? "#f1f8f3" : "white",
                }}
              >
                {/* Rank Badge */}
                {isBest && (
                  <div style={bestBadge}>Best Match</div>
                )}

                {/* Product Name */}
                <h3 style={productName}>{product.name}</h3>

                {/* Score */}
                <div style={scoreRow}>
                  <span style={scoreValue}>
                    {product.suitability_score || 0}%
                  </span>
                  <span style={scoreLabel}>match</span>
                </div>

                {/* Budget */}
                {product.budget && (
                  <div style={tag}>
                    {product.budget.charAt(0).toUpperCase() + product.budget.slice(1)} Budget
                  </div>
                )}

                {/* Category */}
                <div style={meta}>
                  <strong>Category:</strong> {product.category || "—"}
                </div>

                {/* Match Reasons */}
                <div style={{ marginTop: 12 }}>
                  <p style={sectionTitle}>Why this product?</p>
                  <ul style={reasonList}>
                    {(product.match_reasons || ["Recommended for your skin profile"]).map(
                      (reason, i) => (
                        <li key={i} style={reasonItem}>
                          ✓ {reason}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                {/* Key Ingredients */}
                {product.key_ingredients && product.key_ingredients.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <p style={sectionTitle}>Key Ingredients</p>
                    <div style={ingredientWrap}>
                      {product.key_ingredients.map((ing, i) => (
                        <span key={i} style={ingredientTag}>
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Avoid If */}
                {product.avoid_if && product.avoid_if.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ ...sectionTitle, color: "#b45309" }}>
                      Avoid if
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "#92400e" }}>
                      {product.avoid_if.join(", ")}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={footer}>
          <button onClick={onClose} style={primaryBtn}>
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===================== STYLES ===================== */

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: 20,
};

const modal = {
  background: "white",
  borderRadius: 18,
  width: "100%",
  maxWidth: 1000,
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  padding: "20px 24px 12px",
  borderBottom: "1px solid #e5ebe6",
};

const closeBtn = {
  background: "#f1f5f9",
  border: "none",
  width: 32,
  height: 32,
  borderRadius: "50%",
  cursor: "pointer",
  fontSize: 16,
  color: "#475569",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
  padding: 24,
};

const card = {
  borderRadius: 14,
  padding: 16,
  position: "relative",
};

const bestBadge = {
  position: "absolute",
  top: 12,
  right: 12,
  background: "#2d6a4f",
  color: "white",
  fontSize: 11,
  fontWeight: 700,
  padding: "3px 8px",
  borderRadius: 20,
};

const productName = {
  margin: "0 0 10px",
  fontSize: 15,
  fontWeight: 700,
  color: "#1b4332",
  lineHeight: 1.3,
  paddingRight: 60,
};

const scoreRow = {
  display: "flex",
  alignItems: "baseline",
  gap: 6,
  marginBottom: 8,
};

const scoreValue = {
  fontSize: 28,
  fontWeight: 800,
  color: "#1b4332",
};

const scoreLabel = {
  fontSize: 13,
  color: "#6b7280",
};

const tag = {
  display: "inline-block",
  background: "#e8f5e9",
  color: "#2d6a4f",
  fontSize: 11,
  fontWeight: 600,
  padding: "3px 8px",
  borderRadius: 20,
  marginBottom: 10,
};

const meta = {
  fontSize: 12,
  color: "#4b5563",
  marginBottom: 4,
};

const sectionTitle = {
  margin: "0 0 6px",
  fontSize: 12,
  fontWeight: 700,
  color: "#374151",
};

const reasonList = {
  margin: 0,
  paddingLeft: 0,
  listStyle: "none",
};

const reasonItem = {
  fontSize: 12,
  color: "#374151",
  marginBottom: 4,
  lineHeight: 1.4,
};

const ingredientWrap = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};

const ingredientTag = {
  background: "#f0fdf4",
  color: "#166534",
  fontSize: 11,
  padding: "3px 8px",
  borderRadius: 20,
};

const footer = {
  padding: "16px 24px 20px",
  borderTop: "1px solid #e5ebe6",
  display: "flex",
  justifyContent: "flex-end",
};

const primaryBtn = {
  background: "#2d6a4f",
  color: "white",
  border: "none",
  padding: "10px 20px",
  borderRadius: 10,
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 14,
};

export default ProductCompareModal;