import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";

function SkinAnalysis() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeEduCategory, setActiveEduCategory] = useState("Retinoids");

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
        setData(res.data);
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setError("profile_missing");
        } else {
          setError(err.response?.data?.error || "Failed to load skin analysis.");
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const getScoreInfo = (score) => {
    if (score <= 40) return { label: "Poor", bg: "#fee2e2", color: "#b91c1c" };
    if (score <= 55) return { label: "Fair", bg: "#ffedd5", color: "#c2410c" };
    if (score <= 70) return { label: "Average", bg: "#fef9c3", color: "#a16207" };
    if (score <= 85) return { label: "Good", bg: "#d1fae5", color: "#047857" };
    return { label: "Excellent", bg: "#dcfce7", color: "#15803d" };
  };

  const getSeverityStyle = (level) => {
    if (level === "High") return { bg: "#fee2e2", color: "#991b1b" };
    if (level === "Moderate") return { bg: "#fef3c7", color: "#92400e" };
    return { bg: "#e0f2fe", color: "#0369a1" };
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b7280" }}>
          <p style={{ fontSize: 16 }}>Running AI Skin Intelligence Assessment...</p>
        </div>
      </Layout>
    );
  }

  if (error === "profile_missing") {
    return (
      <Layout>
        <div style={{ maxWidth: 650, margin: "40px auto", textAlign: "center", background: "white", padding: 36, borderRadius: 18, border: "1px solid #e5e7eb" }}>
          <span style={{ fontSize: 44 }}>📋</span>
          <h2 style={{ color: "#1b4332", margin: "14px 0 8px" }}>Skin Profile Required</h2>
          <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>
            Please complete your skin profile questionnaire first so our AI engine can assess your skin condition, score health, and recommend tailored products.
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

  const assessment = data?.assessment || {};
  const score = assessment.score ?? 70;
  const scoreInfo = getScoreInfo(score);
  const breakdown = assessment.breakdown || {};
  const rankedConcerns = assessment.ranked_concerns || [];
  const riskFactors = assessment.risk_factors || [];
  const ingredientInsights = assessment.ingredient_insights || [];
  const seasonalTips = assessment.seasonal_tips || [];
  const weather = assessment.weather || {};

  const ingredientIntelligence = data?.ingredient_intelligence || assessment.ingredient_intelligence || {};
  const allergyWarnings = ingredientIntelligence.allergy_warnings || [];
  const interactions = ingredientIntelligence.interactions || {};
  const categoriesEducation = ingredientIntelligence.categories_education || {};
  const categoriesList = ingredientIntelligence.categories_list || [
    "Retinoids",
    "Niacinamide",
    "Vitamin C",
    "Hyaluronic Acid",
    "Salicylic Acid",
    "Ceramides",
    "Peptides",
    "AHAs/BHAs",
  ];

  return (
    <Layout>
      <div style={{ maxWidth: 960, margin: "0 auto", paddingBottom: 60 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1b4332", margin: 0 }}>
            AI Skin Analysis & Assessment
          </h1>
          <p style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>
            Multi-factor evaluation powered by clinical skin scoring formulas and machine learning.
          </p>
        </div>

        {/* ── Main Skin Health Score Card ── */}
        <div
          style={{
            background: "linear-gradient(135deg, #e8f5e9, #d8f3dc)",
            borderRadius: 18,
            padding: "24px 28px",
            marginBottom: 28,
            border: "1px solid #c8e6c9",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#2d6a4f", letterSpacing: 0.6, marginBottom: 8 }}>
            OVERALL SKIN HEALTH SCORE (WEIGHTED & ML HYBRID)
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
            <span style={{ fontSize: 52, fontWeight: 800, color: "#1b4332" }}>{score}</span>
            <span
              style={{
                background: scoreInfo.bg,
                color: scoreInfo.color,
                padding: "5px 14px",
                borderRadius: 20,
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {scoreInfo.label}
            </span>
          </div>

          <p style={{ color: "#374151", fontSize: 14, margin: "0 0 16px" }}>
            {assessment.summary || `Your overall skin health score is ${score}/100.`}
          </p>

          {/* Progress bar */}
          <div style={{ height: 10, background: "#c8e6c9", borderRadius: 20, marginBottom: 16 }}>
            <div
              style={{
                width: `${score}%`,
                height: "100%",
                background: "linear-gradient(90deg, #52b788, #1b4332)",
                borderRadius: 20,
                transition: "width 0.5s ease",
              }}
            />
          </div>

          {/* Sub-Score Breakdown (35% Condition, 20% Lifestyle, 15% Sleep, 20% Adherence, 10% Hydration) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 18 }}>
            <div style={subScoreBox}>
              <div style={subScoreTitle}>Skin Condition (35%)</div>
              <div style={subScoreVal}>{breakdown.skin_condition ?? "—"}/100</div>
            </div>
            <div style={subScoreBox}>
              <div style={subScoreTitle}>Routine Adherence (20%)</div>
              <div style={subScoreVal}>{breakdown.routine_consistency ?? "—"}/100</div>
            </div>
            <div style={subScoreBox}>
              <div style={subScoreTitle}>Lifestyle Habits (20%)</div>
              <div style={subScoreVal}>{breakdown.lifestyle ?? "—"}/100</div>
            </div>
            <div style={subScoreBox}>
              <div style={subScoreTitle}>Sleep Quality (15%)</div>
              <div style={subScoreVal}>{breakdown.sleep ?? "—"}/100</div>
            </div>
            <div style={subScoreBox}>
              <div style={subScoreTitle}>Hydration (10%)</div>
              <div style={subScoreVal}>{breakdown.hydration ?? "—"}/100</div>
            </div>
          </div>
        </div>

        {/* ── 2 Columns: Priority Concerns & Risk Factors ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
          {/* Priority Concerns */}
          <div style={cardStyle}>
            <h2 style={sectionHead}>🎯 Prioritized Concerns</h2>
            {rankedConcerns.length === 0 ? (
              <p style={{ color: "#6b7280", fontSize: 14 }}>No major skin concerns reported.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {rankedConcerns.map((rc, idx) => {
                  const sStyle = getSeverityStyle(rc.level);
                  return (
                    <div key={idx} style={{ border: "1px solid #f0f3f1", borderRadius: 12, padding: 12, background: "#fafcfb" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: "#1b4332", fontSize: 14 }}>{rc.concern}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: sStyle.bg, color: sStyle.color }}>
                          {rc.level} Priority ({rc.severity})
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12.5, color: "#6b7280" }}>Why: {rc.reason}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Risk Factors */}
          <div style={cardStyle}>
            <h2 style={sectionHead}>⚠️ Detected Risk Factors</h2>
            {riskFactors.length === 0 ? (
              <p style={{ color: "#059669", fontSize: 14 }}>✓ No elevated risk triggers detected.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {riskFactors.map((rf, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13.5, color: "#374151" }}>
                    <span style={{ color: "#d97706", fontWeight: 700 }}>•</span>
                    <span>{rf}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── 1. Allergy & Sensitivity Detection Alert ── */}
        {allergyWarnings.length > 0 && (
          <div
            style={{
              background: "#fff1f2",
              border: "1.5px solid #fecdd3",
              borderRadius: 16,
              padding: "18px 22px",
              marginBottom: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>⚠️</span>
              <h3 style={{ margin: 0, fontSize: 16, color: "#9f1239", fontWeight: 700 }}>
                Allergy & Sensitivity Alerts Detected
              </h3>
              <span style={{ background: "#fda4af", color: "#881337", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>
                High Caution
              </span>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "#4c0519" }}>
              Our allergy safety screener identified ingredients or categories you should strictly avoid or patch-test based on your profile:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {allergyWarnings.map((aw, awIdx) => (
                <div
                  key={awIdx}
                  style={{
                    background: "white",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid #ffe4e6",
                    fontSize: 13,
                    color: "#881337",
                  }}
                >
                  <strong>{aw.severity} Alert:</strong> {aw.warning}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 2. Ingredient Suitability Assessment ── */}
        <div style={{ ...cardStyle, marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h2 style={{ ...sectionHead, margin: 0 }}>🧪 Ingredient Suitability Assessment</h2>
              <p style={{ color: "#6b7280", fontSize: 13.5, margin: "4px 0 0" }}>
                Targeted actives scored against your skin barrier, primary concerns, and sensitivities.
              </p>
            </div>
            <span style={{ fontSize: 12, background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: 12, fontWeight: 700 }}>
              AI Scored
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {ingredientInsights.map((ing, idx) => {
              const suitabilityScore = ing.suitability_score || 85;
              const suitabilityLevel = ing.suitability_level || (suitabilityScore >= 80 ? "Highly Suitable" : "Compatible");

              return (
                <div key={idx} style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 16, background: "white", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>
                          {ing.category || "Active"}
                        </span>
                        <div style={{ fontWeight: 700, color: "#1b4332", fontSize: 15 }}>
                          {ing.ingredient}
                        </div>
                      </div>
                      <span
                        style={{
                          background: suitabilityScore >= 80 ? "#ecfdf5" : "#fef3c7",
                          color: suitabilityScore >= 80 ? "#047857" : "#92400e",
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 8,
                        }}
                      >
                        {suitabilityScore}% • {suitabilityLevel}
                      </span>
                    </div>

                    {ing.best_time && (
                      <div style={{ fontSize: 11.5, color: "#2d6a4f", background: "#f0fdf4", padding: "3px 8px", borderRadius: 6, display: "inline-block", marginBottom: 8, fontWeight: 600 }}>
                        Timing: {ing.best_time}
                      </div>
                    )}

                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>BENEFITS</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {(ing.benefits || []).map((b, bIdx) => (
                          <span key={bIdx} style={{ background: "#ecfdf5", color: "#047857", padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 500 }}>
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ fontSize: 13, color: "#374151", marginBottom: 6 }}>
                      <strong>Why matched:</strong> {ing.reason}
                    </div>
                  </div>

                  {ing.caution && (
                    <div style={{ fontSize: 12, color: "#b45309", background: "#fffbeb", padding: "6px 10px", borderRadius: 8, marginTop: 8 }}>
                      <strong>Caution:</strong> {ing.caution}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 3. Pairwise Ingredient Interaction Analysis ── */}
        <div style={{ ...cardStyle, marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h2 style={{ ...sectionHead, margin: 0 }}>⚗️ Ingredient Interaction Analysis</h2>
              <p style={{ color: "#6b7280", fontSize: 13.5, margin: "4px 0 0" }}>
                Pairwise conflict checks, layering separation, and synergistic active combinations.
              </p>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 12,
                background: (interactions.conflicts || []).length > 0 ? "#fee2e2" : "#dcfce7",
                color: (interactions.conflicts || []).length > 0 ? "#991b1b" : "#166534",
              }}
            >
              Status: {interactions.safety_status || "Safe & Harmonious"}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            {/* Conflicts / Cautions */}
            <div style={{ background: "#fffbfb", border: "1px solid #fee2e2", borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <strong style={{ fontSize: 14, color: "#991b1b" }}>
                  Conflicts & Timing Separations ({(interactions.conflicts || []).length})
                </strong>
              </div>

              {(interactions.conflicts || []).length === 0 ? (
                <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                  No high-risk pairwise conflicts detected among your active treatments.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {interactions.conflicts.map((conf, cIdx) => (
                    <div key={cIdx} style={{ background: "white", padding: 12, borderRadius: 10, border: "1px solid #fecdd3" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#991b1b", marginBottom: 4 }}>
                        {conf.title}
                      </div>
                      <p style={{ margin: "0 0 6px", fontSize: 12.5, color: "#4b5563", lineHeight: 1.4 }}>
                        {conf.explanation}
                      </p>
                      <div style={{ fontSize: 12, color: "#b91c1c", fontWeight: 600 }}>
                        💡 Clinical Advice: {conf.action}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Synergies */}
            <div style={{ background: "#f9fefb", border: "1px solid #bbf7d0", borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 16 }}>✨</span>
                <strong style={{ fontSize: 14, color: "#166534" }}>
                  Synergies & Power Duos ({(interactions.synergies || []).length})
                </strong>
              </div>

              {(interactions.synergies || []).length === 0 ? (
                <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                  Standard biocompatible pairing active.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {interactions.synergies.map((syn, sIdx) => (
                    <div key={sIdx} style={{ background: "white", padding: 12, borderRadius: 10, border: "1px solid #bbf7d0" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#166534", marginBottom: 4 }}>
                        {syn.title}
                      </div>
                      <p style={{ margin: "0 0 6px", fontSize: 12.5, color: "#4b5563", lineHeight: 1.4 }}>
                        {syn.explanation}
                      </p>
                      <div style={{ fontSize: 12, color: "#15803d", fontWeight: 600 }}>
                        💡 How to Layer: {syn.action}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 4. Interactive Ingredient Categories & Education Guide (8 Categories) ── */}
        <div style={{ ...cardStyle, marginBottom: 28 }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ ...sectionHead, margin: 0 }}>📖 Ingredient Education & Category Guide</h2>
            <p style={{ color: "#6b7280", fontSize: 13.5, margin: "4px 0 0" }}>
              Explore the 8 core skincare ingredient families, their biological mechanisms, and application rules.
            </p>
          </div>

          {/* Category Tabs */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {categoriesList.map((catName) => {
              const active = activeEduCategory === catName;
              return (
                <button
                  key={catName}
                  onClick={() => setActiveEduCategory(catName)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 20,
                    border: "none",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    background: active ? "#1b4332" : "#f3f4f6",
                    color: active ? "white" : "#374151",
                    transition: "all 0.15s ease",
                  }}
                >
                  {catName}
                </button>
              );
            })}
          </div>

          {/* Category Detail Card */}
          {categoriesEducation[activeEduCategory] && (
            <div
              style={{
                background: "#f8faf9",
                borderRadius: 14,
                padding: 20,
                border: "1px solid #e5ebe7",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: 18, color: "#1b4332", fontWeight: 700 }}>
                    {categoriesEducation[activeEduCategory].name}
                  </h3>
                  <p style={{ margin: 0, fontSize: 13.5, color: "#4d6b57", lineHeight: 1.45 }}>
                    {categoriesEducation[activeEduCategory].description}
                  </p>
                </div>
                <span style={{ fontSize: 12, background: "#e8f5e9", color: "#166534", padding: "4px 12px", borderRadius: 14, fontWeight: 700, whiteSpace: "nowrap" }}>
                  {categoriesEducation[activeEduCategory].best_time}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 14 }}>
                {/* Benefits */}
                <div style={{ background: "white", padding: 14, borderRadius: 10, border: "1px solid #e5e7eb" }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "#1b4332", marginBottom: 6, textTransform: "uppercase" }}>
                    Primary Benefits
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#374151", lineHeight: 1.5 }}>
                    {(categoriesEducation[activeEduCategory].benefits || []).map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>

                {/* How to use */}
                <div style={{ background: "white", padding: 14, borderRadius: 10, border: "1px solid #e5e7eb" }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "#1b4332", marginBottom: 6, textTransform: "uppercase" }}>
                    Application & Layering
                  </div>
                  <p style={{ margin: "0 0 10px", fontSize: 12.5, color: "#374151", lineHeight: 1.45 }}>
                    {categoriesEducation[activeEduCategory].how_to_use}
                  </p>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "#6b7280", marginBottom: 4, textTransform: "uppercase" }}>
                    Hero Molecules
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {(categoriesEducation[activeEduCategory].hero_ingredients || []).map((hero, hIdx) => (
                      <span key={hIdx} style={{ background: "#ecfdf5", color: "#047857", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 500 }}>
                        {hero}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Caution Callout */}
              <div style={{ marginTop: 14, background: "#fffbeb", border: "1px solid #fef3c7", padding: "10px 14px", borderRadius: 10, fontSize: 12.5, color: "#92400e" }}>
                <strong>Clinical Caution:</strong> {categoriesEducation[activeEduCategory].cautions}
              </div>
            </div>
          )}
        </div>

        {/* ── Seasonal & Live Weather Advice ── */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ ...sectionHead, margin: 0 }}>
              🌤️ Seasonal & Environmental Advice
            </h2>
            {weather.temperature != null && (
              <span style={{ fontSize: 12.5, color: "#2d6a4f", background: "#e8f5e9", padding: "4px 10px", borderRadius: 12, fontWeight: 600 }}>
                Live: {weather.temperature}°C • UV: {weather.uv_index ?? "—"} • Humidity: {weather.humidity}%
              </span>
            )}
          </div>
          <p style={{ color: "#374151", fontSize: 14, margin: "0 0 16px" }}>
            Season: <strong style={{ textTransform: "capitalize" }}>{assessment.season || "Current"}</strong> — {assessment.seasonal_summary || ""}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            {seasonalTips.map((tipObj, idx) => (
              <div key={idx} style={{ display: "flex", gap: 10, background: "#f8faf9", padding: "10px 14px", borderRadius: 10, fontSize: 13 }}>
                <span style={{ color: "#16a34a", fontWeight: 700 }}>✓</span>
                <span style={{ color: "#374151" }}>{tipObj.tip || tipObj}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom CTA Links ── */}
        <div style={{ display: "flex", gap: 16, marginTop: 28 }}>
          <Link
            to="/checklist"
            style={{
              flex: 1,
              textAlign: "center",
              background: "#1b4332",
              color: "white",
              padding: "13px",
              borderRadius: 12,
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            ⏱ View Daily Skincare Checklist →
          </Link>
          <Link
            to="/products"
            style={{
              flex: 1,
              textAlign: "center",
              background: "#2d6a4f",
              color: "white",
              padding: "13px",
              borderRadius: 12,
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            🛍️ Browse Matched Products & Compare →
          </Link>
        </div>
      </div>
    </Layout>
  );
}

const cardStyle = {
  background: "white",
  borderRadius: 16,
  padding: 24,
  border: "1px solid #e5e7eb",
  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
};

const sectionHead = {
  fontSize: 17,
  fontWeight: 700,
  margin: "0 0 14px 0",
  color: "#1b4332",
};

const subScoreBox = {
  background: "white",
  borderRadius: 12,
  padding: "10px 14px",
  border: "1px solid #c8e6c9",
};

const subScoreTitle = {
  fontSize: 11,
  fontWeight: 600,
  color: "#4b5563",
  marginBottom: 4,
};

const subScoreVal = {
  fontSize: 16,
  fontWeight: 700,
  color: "#1b4332",
};

export default SkinAnalysis;