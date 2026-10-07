import { useEffect, useState } from "react";
import { getIngredientsCatalog, analyzeFormula } from "../services/api";

export default function IngredientIntelligence() {
  const [catalog, setCatalog] = useState([]);
  const [ingredientsInput, setIngredientsInput] = useState("Water, Retinol, Salicylic Acid, Niacinamide, Ceramides NP");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getIngredientsCatalog()
      .then((r) => setCatalog(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!ingredientsInput.trim()) return;
    setAnalyzing(true);
    try {
      const r = await analyzeFormula(ingredientsInput);
      setAnalysisResult(r.data);
    } catch {
      // fallback
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <section>
      <div className="dashboard-head">
        <div>
          <p className="eyebrow">Ingredient Intelligence</p>
          <h1>Ingredient Education & Formula Analyzer</h1>
          <p style={{ color: "var(--text-muted)", marginTop: 4 }}>
            Explore skincare actives, detect ingredient conflicts, and analyze product formulas for skin safety.
          </p>
        </div>
      </div>

      {/* Interactive Formula Analyzer */}
      <div className="card" style={{ marginBottom: 32, background: "linear-gradient(135deg, #ffffff 0%, #f4f8f6 100%)" }}>
        <h3 style={{ fontSize: 20, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
          🧪 Interactive Formula Analyzer
        </h3>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 14 }}>
          Paste an ingredient list from any cosmetic label to check for active ingredient conflicts, user allergy warnings, and formula compatibility!
        </p>

        <form onSubmit={handleAnalyze} style={{ display: "grid", gap: 12 }}>
          <textarea
            rows={3}
            value={ingredientsInput}
            onChange={(e) => setIngredientsInput(e.target.value)}
            placeholder="Paste ingredients separated by commas (e.g. Water, Retinol, Salicylic Acid, Niacinamide)..."
            style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid var(--border)", font: "inherit" }}
          />
          <div>
            <button className="primary" disabled={analyzing} style={{ padding: "10px 20px" }}>
              {analyzing ? "Analyzing Formula..." : "⚡ Analyze Formula"}
            </button>
          </div>
        </form>

        {/* Analysis Results Display */}
        {analysisResult && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
              <h4 style={{ fontSize: 16 }}>Formula Analysis Results</h4>
              <span className={`badge ${analysisResult.overall_suitability_score >= 80 ? 'badge-user' : 'badge-admin'}`} style={{ fontSize: 14, padding: "6px 14px" }}>
                {analysisResult.overall_suitability_score}% Formula Suitability
              </span>
            </div>

            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 16 }}>{analysisResult.summary}</p>

            {/* Interaction Conflicts */}
            {analysisResult.detected_conflicts?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h5 style={{ fontSize: 14, color: "var(--red)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  ⚠️ Interaction Conflicts Detected ({analysisResult.detected_conflicts.length})
                </h5>
                <div style={{ display: "grid", gap: 10 }}>
                  {analysisResult.detected_conflicts.map((c, i) => (
                    <div key={i} style={{ padding: 12, borderRadius: 8, background: "#fee2e2", borderLeft: "4px solid var(--red)" }}>
                      <strong style={{ fontSize: 14, color: "#991b1b" }}>Conflict: {c.ingredient_a} + {c.ingredient_b}</strong>
                      <p style={{ fontSize: 13, color: "#7f1d1d", margin: "4px 0" }}>{c.issue}</p>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#991b1b" }}>💡 Solution: {c.recommendation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Allergy Warnings */}
            {analysisResult.allergy_warnings?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h5 style={{ fontSize: 14, color: "var(--orange)", marginBottom: 8 }}>
                  🚨 Allergy & Sensitivity Alerts ({analysisResult.allergy_warnings.length})
                </h5>
                <div style={{ display: "grid", gap: 8 }}>
                  {analysisResult.allergy_warnings.map((a, i) => (
                    <div key={i} style={{ padding: 10, borderRadius: 8, background: "#fef3c7", borderLeft: "4px solid var(--orange)" }}>
                      <strong style={{ fontSize: 13, color: "#92400e" }}>{a.ingredient} - {a.risk_level}</strong>
                      <p style={{ fontSize: 12, color: "#78350f", margin: 0 }}>{a.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Parsed Actives */}
            <div>
              <h5 style={{ fontSize: 14, marginBottom: 8 }}>Identified Key Ingredients</h5>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {analysisResult.analyzed_ingredients?.map((ing, i) => (
                  <span key={i} style={{ fontSize: 12, background: "var(--green-light)", color: "var(--green-dark)", padding: "4px 10px", borderRadius: 12, fontWeight: 600 }}>
                    {ing.name} ({ing.category})
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ingredient Education Directory */}
      <p className="section-title">Skincare Ingredients Directory & Education</p>
      {loading ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>Loading ingredient directory...</div>
      ) : (
        <div className="grid-3">
          {catalog.map((ing) => (
            <div key={ing.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <h3 style={{ fontSize: 18, margin: 0 }}>{ing.name}</h3>
                  <span className="badge badge-consultant">{ing.category}</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 12 }}>
                  {ing.description}
                </p>
                
                <div style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>Key Benefits:</span>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {ing.key_benefits?.map((b, i) => (
                      <span key={i} style={{ fontSize: 11, background: "var(--green-bg)", border: "1px solid var(--border)", padding: "2px 6px", borderRadius: 6 }}>
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                {ing.conflicting_ingredients?.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--red)" }}>Avoid Using With:</span>
                    <span style={{ fontSize: 11, color: "var(--red)", marginLeft: 6 }}>
                      {ing.conflicting_ingredients.join(", ")}
                    </span>
                  </div>
                )}
              </div>

              {ing.allergen_warning && (
                <p style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic", marginTop: 8, margin: 0 }}>
                  ℹ️ {ing.allergen_warning}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
