import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  compareProducts,
  getProductAlternatives,
  getProductCombos,
  getProductRecommendations,
} from "../services/api";
import "./ProductRecommendations.css";

const inr = (value) =>
  value == null
    ? "Price unavailable"
    : `₹${Number(value).toLocaleString("en-IN")}`;

const getScoreClass = (score) => {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  return "moderate";
};


export default function ProductRecommendations() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    category: "",
    min_price_inr: "",
    max_price_inr: "",
    concern: "",
  });

  const [selected, setSelected] = useState([]);
  const [comparison, setComparison] = useState([]);
  const [alternatives, setAlternatives] = useState({});
  const [combos, setCombos] = useState([]);
  const [hydrationNudge, setHydrationNudge] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadProducts = async () => {
    setBusy(true);
    setError("");

    try {
      const result = await getProductRecommendations(filters);

      setProducts(result.products || []);
      setHydrationNudge(result.hydration_nudge || "");
    } catch (err) {
      setError(err.message);
      setProducts([]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    let active = true;

    getProductRecommendations()
      .then((result) => {
        if (active) {
          setProducts(result.products || []);
          setHydrationNudge(result.hydration_nudge || "");
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      });

    return () => {
      active = false;
    };
  }, []);

  const toggleCompare = (id) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id].slice(-4)
    );
  };

  const compare = async () => {
    try {
      const result = await compareProducts(selected);
      setComparison(result.products || []);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const showAlternatives = async (product) => {
    try {
      const result = await getProductAlternatives(product.id);

      setAlternatives((current) => ({
        ...current,
        [product.id]: result.alternatives || [],
      }));
    } catch (err) {
      setError(err.message);
    }
  };

  const loadCombos = async () => {
    try {
      const result = await getProductCombos();
      setCombos(result.combos || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      min_price_inr: "",
      max_price_inr: "",
      concern: "",
    });
  };

  return (
    <main className="product-page">
       {/* BACK TO DASHBOARD */}
      <div className="back-dashboard-wrapper">
        <button
          type="button"
          className="back-dashboard-btn"
          onClick={() => navigate("/dashboard")}
        >
          <span className="back-arrow">←</span>
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* HERO */}
      <section className="product-hero">
        <div className="hero-content">
          <span className="hero-eyebrow">
            ✦ AI-POWERED SKINCARE
          </span>

          <h1>Products picked for your skin</h1>

          <p>
            Discover skincare products matched to your skin profile,
            concerns, sensitivities and budget.
          </p>

          <div className="hero-stats">
            <div>
              <strong>{products.length}</strong>
              <span>Recommendations</span>
            </div>

            <div>
              <strong>AI</strong>
              <span>Personalized matching</span>
            </div>

            <div>
              <strong>₹</strong>
              <span>Budget aware</span>
            </div>
          </div>
        </div>

        <div className="hero-decoration">
          <div className="hero-circle">
            <span>🧴</span>
          </div>
          <div className="floating-bubble bubble-one">✨</div>
          <div className="floating-bubble bubble-two">🌿</div>
          <div className="floating-bubble bubble-three">💧</div>
        </div>
      </section>

      {/* SAFETY NOTE */}
      <div className="medical-note">
        <div className="note-icon">ⓘ</div>

        <div>
          <strong>Personalized guidance, not medical advice</strong>
          <p>
            Check full ingredient labels and patch test when appropriate.
            Consult a qualified dermatologist for medical concerns.
          </p>
        </div>
      </div>

      {/* HYDRATION */}
      {hydrationNudge && (
        <div className="hydration-banner">
          <span className="hydration-icon">💧</span>
          <div>
            <strong>Skin hydration reminder</strong>
            <p>{hydrationNudge}</p>
          </div>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="product-error" role="alert">
          <span>⚠️</span>
          {error}
        </div>
      )}

      {/* FILTERS */}
      <section className="filter-card">
        <div className="filter-header">
          <div>
            <span className="section-kicker">FIND YOUR MATCH</span>
            <h2>Filter products</h2>
          </div>

          <button
            className="clear-filter-btn"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>

        <div className="filter-grid">

          <label className="filter-field">
            <span>Category</span>

            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  category: e.target.value,
                })
              }
            >
              <option value="">All categories</option>

              {[
                "Cleanser",
                "Serum",
                "Moisturizer",
                "Sunscreen",
                "Face Mask",
                "Treatment",
                "Eye Care",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>Skin concern</span>

            <select
              value={filters.concern}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  concern: e.target.value,
                })
              }
            >
              <option value="">All concerns</option>

              {[
                "Acne",
                "Oiliness",
                "Dryness",
                "Dehydration",
                "Dullness",
                "Redness/Sensitivity",
                "Fine Lines/Aging",
                "Hyperpigmentation",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>Minimum price</span>

            <input
              type="number"
              min="0"
              value={filters.min_price_inr}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  min_price_inr: e.target.value,
                })
              }
              placeholder="₹0"
            />
          </label>

          <label className="filter-field">
            <span>Maximum budget</span>

            <input
              type="number"
              min="0"
              value={filters.max_price_inr}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  max_price_inr: e.target.value,
                })
              }
              placeholder="Use profile budget"
            />
          </label>
        </div>

        <div className="filter-actions">
          <button
            className="primary-product-btn"
            onClick={loadProducts}
          >
            🔍 Find products
          </button>

          <button
            className="secondary-product-btn"
            onClick={loadCombos}
          >
            ✨ Build routine combos
          </button>

          {selected.length > 0 && (
            <button
              className="compare-product-btn"
              onClick={compare}
            >
              ⚖ Compare {selected.length} product
              {selected.length > 1 ? "s" : ""}
            </button>
          )}
        </div>
      </section>

      {/* PRODUCT SECTION */}
      <section className="recommendation-section">

        <div className="section-title-row">
          <div>
            <span className="section-kicker">
              YOUR PERSONALIZED PICKS
            </span>

            <h2>Recommended products</h2>

            <p>
              Products ranked according to your skin profile.
            </p>
          </div>

          {!busy && products.length > 0 && (
            <span className="result-count">
              {products.length} products
            </span>
          )}
        </div>

        {busy ? (
          <div className="loading-box">
            <div className="loading-spinner"></div>
            <h3>Finding your best matches...</h3>
            <p>
              We're analyzing your preferences and product compatibility.
            </p>
          </div>
        ) : (
          <div className="product-grid">

            {products.map((product) => {
              const score = Number(product.suitability_score || 0);
              const scoreClass = getScoreClass(score);

              return (
                <article
                  className="product-card"
                  key={product.id}
                >

                  {/* PRODUCT TOP */}
                  <div className="product-card-top">

                    <div className="product-icon">
                      🧴
                    </div>

                    <div className="product-category">
                      <span>{product.category}</span>
                    </div>

                    <div className={`match-score ${scoreClass}`}>
                      <strong>{score}</strong>
                      <small>/100</small>
                      <span>Match</span>
                    </div>
                  </div>

                  {/* PRODUCT INFO */}
                  <div className="product-info">

                    <span className="product-brand">
                      {product.brand}
                    </span>

                    <h3>{product.name}</h3>

                    <div className="product-price">
                      {inr(product.price_inr)}
                    </div>

                    <div className="recommendation-reason">
                      <span>✦</span>
                      <p>{product.why_recommended}</p>
                    </div>

                    {/* INGREDIENTS */}
                    <div className="ingredient-section">

                      <span className="ingredient-title">
                        Key matching ingredients
                      </span>

                      <div className="ingredient-tags">
                        {product.key_matching_ingredients?.length ? (
                          product.key_matching_ingredients.map(
                            (ingredient, index) => (
                              <span key={index}>
                                {ingredient}
                              </span>
                            )
                          )
                        ) : (
                          <span className="no-data">
                            No ingredient data available
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CARD ACTIONS */}
                  <div className="product-actions">

                    <label className="compare-check">
                      <input
                        type="checkbox"
                        checked={selected.includes(product.id)}
                        onChange={() =>
                          toggleCompare(product.id)
                        }
                      />

                      <span>Compare</span>
                    </label>

                    <button
                      className="alternative-btn"
                      onClick={() =>
                        showAlternatives(product)
                      }
                    >
                      View alternatives →
                    </button>
                  </div>

                  {/* ALTERNATIVES */}
                  {alternatives[product.id] && (
                    <div className="alternatives-panel">

                      <div className="alternative-heading">
                        <strong>Similar options</strong>
                        <span>↗</span>
                      </div>

                      {alternatives[product.id].length ? (
                        alternatives[product.id].map((item) => (
                          <div
                            className="alternative-item"
                            key={item.id}
                          >
                            <div>
                              <strong>{item.brand}</strong>
                              <p>{item.name}</p>
                            </div>

                            <div className="alternative-price">
                              <strong>
                                {inr(item.price_inr)}
                              </strong>

                              <span>
                                {Math.round(
                                  item.similarity * 100
                                )}
                                % similar
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="no-alternatives">
                          No safe same-category alternatives found.
                        </p>
                      )}
                    </div>
                  )}

                </article>
              );
            })}
          </div>
        )}

        {!busy && products.length === 0 && !error && (
          <div className="empty-products">
            <div>🧴</div>
            <h3>No matching products found</h3>
            <p>
              Try changing your filters or run the product
              cleaning and seed steps first.
            </p>
          </div>
        )}
      </section>

      {/* COMPARISON */}
      {comparison.length > 0 && (
        <section className="special-section">

          <div className="section-title-row">
            <div>
              <span className="section-kicker">
                SIDE-BY-SIDE ANALYSIS
              </span>

              <h2>Product comparison</h2>
            </div>
          </div>

          <div className="comparison-grid">

            {comparison.map((item) => (
              <article
                className="comparison-card"
                key={item.id}
              >
                <div className="comparison-icon">
                  🧴
                </div>

                <span className="product-brand">
                  {item.brand}
                </span>

                <h3>{item.name}</h3>

                <div className="comparison-price">
                  {inr(item.price_inr)}
                </div>

                <div className="comparison-score">
                  <span>Suitability</span>
                  <strong>
                    {item.suitability_score}/100
                  </strong>
                </div>

                <div className="score-bar">
                  <span
                    style={{
                      width: `${Math.min(
                        Number(item.suitability_score || 0),
                        100
                      )}%`,
                    }}
                  ></span>
                </div>

                <p className="similarity-text">
                  Ingredient/category similarity to first
                  selected product:
                  <strong>
                    {" "}
                    {Math.round(
                      (item.similarity_to_first || 0) * 100
                    )}
                    %
                  </strong>
                </p>

                <p className="comparison-reason">
                  {item.why_recommended}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* COMBOS */}
      {combos.length > 0 && (
        <section className="special-section combo-section">

          <div className="section-title-row">
            <div>
              <span className="section-kicker">
                SMART ROUTINE BUILDER
              </span>

              <h2>Routine bundles</h2>

              <p>
                Curated combinations designed around value
                and routine compatibility.
              </p>
            </div>
          </div>

          <div className="combo-grid">

            {combos.map((combo, index) => (
              <article
                className="combo-card"
                key={index}
              >
                <div className="combo-header">
                  <span className="combo-tier">
                    {combo.tier}
                  </span>

                  <span className="best-value">
                    ★ Best value
                  </span>
                </div>

                <h3>
                  {inr(combo.total_price_inr)}
                </h3>

                <p className="combo-description">
                  {combo.why_better}
                </p>

                <div className="combo-products">
                  {combo.products.map((x) => (
                    <div key={x.id}>
                      <span>{x.category}</span>
                      <strong>{x.name}</strong>
                      <em>{inr(x.price_inr)}</em>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

    </main>
  );
}