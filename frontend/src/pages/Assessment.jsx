import { useState } from "react";

function Assessment() {
  const [compareList, setCompareList] = useState([]);

  const productData = {
    Cleanser: [
      {
        id: 1,
        name: "CeraVe Foaming Facial Cleanser",
        match: 99,
        tag: "budget",
        isBest: true,
        points: ["Excellent match for combination skin", "Targets acne"],
      },
      {
        id: 2,
        name: "La Roche-Posay Toleriane Cleanser",
        match: 86,
        tag: "mid",
        isBest: false,
        points: ["Not specifically made for combination skin", "Contains Niacinamide — helpful for acne"],
      },
    ],
    Serum: [
      {
        id: 3,
        name: "The Ordinary Niacinamide 10% + Zinc 1%",
        match: 97,
        tag: "budget",
        isBest: true,
        points: ["Not specifically made for combination skin", "Targets acne"],
      },
      {
        id: 4,
        name: "The Ordinary Vitamin C Suspension",
        match: 87,
        tag: "budget",
        isBest: false,
        points: ["Not specifically made for combination skin", "Targets hyperpigmentation"],
      },
    ],
    Moisturizer: [
      {
        id: 5,
        name: "CeraVe PM Facial Moisturizing Lotion",
        match: 95,
        tag: "budget",
        isBest: true,
        points: ["Great for combination skin", "Contains ceramides & niacinamide"],
      },
      {
        id: 6,
        name: "Neutrogena Hydro Boost",
        match: 82,
        tag: "mid",
        isBest: false,
        points: ["Lightweight gel texture", "Good hydration but less barrier support"],
      },
    ],
  };

  const toggleCompare = (product) => {
    setCompareList((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) return prev.filter((p) => p.id !== product.id);
      if (prev.length >= 4) {
        alert("You can compare up to 4 products only");
        return prev;
      }
      return [...prev, product];
    });
  };

  const isInCompare = (id) => compareList.some((p) => p.id === id);

  return (
    <div style={{ display: "flex", gap: 36, alignItems: "flex-start", padding: "10px 8px 50px" }}>
      
      {/* ==================== LEFT SIDE ==================== */}
      <div style={{ flex: 1 }}>
        
        {/* Highlighted Heading */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ 
                margin: 0, 
                fontSize: 26, 
                fontWeight: 750, 
                color: "#1b4332",
                letterSpacing: "-0.3px"
              }}>
                Personalized Product Recommendations
              </h1>
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "#6b7280" }}>
                Select products to compare their suitability, ingredients and benefits.
              </p>
            </div>
            <span style={{
              background: "#d8f3dc",
              color: "#1b4332",
              padding: "7px 14px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: "nowrap"
            }}>
              Compare up to 4
            </span>
          </div>
        </div>

        {/* Compare Bar */}
        {compareList.length > 0 && (
          <div style={{
            background: "#e8f5e9",
            border: "1px solid #c8e6c9",
            borderRadius: 16,
            padding: 18,
            marginBottom: 32,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <strong style={{ color: "#1b4332", fontSize: 15 }}>
                Comparing {compareList.length} product{compareList.length > 1 ? "s" : ""}
              </strong>
              <button
                onClick={() => setCompareList([])}
                style={{
                  background: "none",
                  border: "none",
                  color: "#b91c1c",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Clear all
              </button>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {compareList.map((p) => (
                <div key={p.id} style={{
                  background: "white",
                  borderRadius: 12,
                  padding: "12px 16px",
                  fontSize: 13,
                  minWidth: 190,
                  border: "1px solid #d1fae5"
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{p.name}</div>
                  <div style={{ color: "#166534", fontWeight: 700 }}>{p.match}% match</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product Categories */}
        {Object.entries(productData).map(([category, products]) => (
          <div key={category} style={{ marginBottom: 42 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>
                {category === "Cleanser" ? "🧼" : category === "Serum" ? "💧" : "🧴"}
              </span>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#1b4332" }}>{category}</span>
              <span style={{ fontSize: 13, color: "#6b7280" }}>{products.length} recommendations</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {products.map((product) => (
                <div
                  key={product.id}
                  style={{
                    background: product.isBest ? "#f0fdf4" : "white",
                    border: product.isBest ? "1.5px solid #86efac" : "1px solid #e5e7eb",
                    borderRadius: 16,
                    padding: 20,
                    position: "relative",
                  }}
                >
                  {product.isBest && (
                    <span style={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      background: "#166534",
                      color: "white",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 20,
                    }}>
                      Best Match
                    </span>
                  )}

                  <div style={{ 
                    fontWeight: 700, 
                    fontSize: 15, 
                    marginBottom: 10, 
                    paddingRight: 80,
                    color: "#1b4332"
                  }}>
                    {product.name}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontWeight: 750, color: "#166534", fontSize: 16 }}>
                      {product.match}% match
                    </span>
                    <span style={{
                      background: "#f3f4f6",
                      color: "#4b5563",
                      fontSize: 12,
                      padding: "3px 10px",
                      borderRadius: 12,
                      fontWeight: 500
                    }}>
                      {product.tag}
                    </span>
                  </div>

                  <ul style={{ 
                    margin: "0 0 18px 0", 
                    paddingLeft: 18, 
                    fontSize: 13.5, 
                    color: "#374151",
                    lineHeight: 1.5
                  }}>
                    {product.points.map((point, idx) => (
                      <li key={idx} style={{ marginBottom: 5 }}>{point}</li>
                    ))}
                  </ul>

                  <button
                    onClick={() => toggleCompare(product)}
                    style={{
                      width: "100%",
                      padding: "11px 0",
                      borderRadius: 12,
                      border: isInCompare(product.id) ? "none" : "1.5px solid #86efac",
                      background: isInCompare(product.id) ? "#166534" : "white",
                      color: isInCompare(product.id) ? "white" : "#166534",
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    {isInCompare(product.id) ? "✓ Added" : "+ Compare"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ==================== RIGHT SIDE ==================== */}
      <div style={{ width: 310, flexShrink: 0, display: "flex", flexDirection: "column", gap: 20 }}>
        
        {/* Seasonal Tips */}
        <div style={{
          background: "white",
          borderRadius: 18,
          padding: 22,
          border: "1px solid #e5e7eb",
        }}>
          <h3 style={{ margin: "0 0 18px 0", fontSize: 17, fontWeight: 700, color: "#1b4332" }}>
            Seasonal Tips
          </h3>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 22 }}>🍂</span>
            <span style={{ fontWeight: 700, color: "#166534", fontSize: 15 }}>Balanced / mixed</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              "Keep SPF daily",
              "Adjust moisturizer thickness if weather changes",
              "Do not add too many new actives at once",
            ].map((tip, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13.5 }}>
                <span style={{ color: "#16a34a", fontWeight: 700, fontSize: 15 }}>✓</span>
                <span style={{ color: "#374151", lineHeight: 1.4 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weather Related Tips */}
        <div style={{
          background: "white",
          borderRadius: 18,
          padding: 22,
          border: "1px solid #e5e7eb",
        }}>
          <h3 style={{ margin: "0 0 18px 0", fontSize: 17, fontWeight: 700, color: "#1b4332" }}>
            Weather Related Tips
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { icon: "🌧️", title: "Humid / Rainy", tip: "Use lighter moisturizer and focus on oil control" },
              { icon: "☀️", title: "Hot & Sunny", tip: "Reapply sunscreen every 2–3 hours and add antioxidants" },
              { icon: "❄️", title: "Cold / Dry", tip: "Switch to richer cream and add a hydrating serum" },
              { icon: "💨", title: "Windy", tip: "Strengthen skin barrier with ceramides" },
            ].map((item, idx) => (
              <div key={idx} style={{ display: "flex", gap: 12 }}>
                <span style={{ fontSize: 20, marginTop: 1 }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1b4332", marginBottom: 3 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.4 }}>
                    {item.tip}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Assessment;