import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function IngredientRecommendation() {
  const navigate = useNavigate();

  const [ingredientData, setIngredientData] = useState({
    safe: [],
    flagged: [],
    avoid: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/ingredient-recommendations",
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (response.ok) {
          setIngredientData(data);
        }
      } catch (error) {
        console.error("Ingredient recommendation error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIngredients();
  }, []);

  const renderIngredient = (item, type) => (
<div className={`ingredient-card ${type}`} key={item.ingredient}>      <div className="ingredient-card-header">
<h3>{item.ingredient}</h3>
        {item.score !== undefined && (
          <span className="ingredient-score">
            {item.score}/100
          </span>
        )}
      </div>

      {item.purpose && (
        <p>
          <strong>Purpose:</strong> {item.purpose}
        </p>
      )}

      {item.reason && (
        <p>
          <strong>Why:</strong> {item.reason}
        </p>
      )}

      {item.safety_status && (
        <span className="safety-status">
          {item.safety_status}
        </span>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="page-container">
        <p>Analyzing ingredients for your skin profile...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <p className="page-eyebrow">INGREDIENT INTELLIGENCE</p>

        <h1>Ingredients for Your Skin</h1>

        <p>
          Personalized ingredient recommendations based on your skin
          profile, concerns, and reported allergies.
        </p>
      </div>

      {/* SAFE */}
      <section className="recommendation-section">
        <div className="section-heading">
          <h2>Recommended Ingredients</h2>
          <p>Ingredients matched to your current skin profile.</p>
        </div>

        {ingredientData.safe.length > 0 ? (
          <div className="ingredient-grid">
            {ingredientData.safe.map((item) =>
              renderIngredient(item, "safe")
            )}
          </div>
        ) : (
          <div className="empty-state">
            No recommended ingredients found.
          </div>
        )}
      </section>

      {/* FLAGGED */}
      {ingredientData.flagged.length > 0 && (
        <section className="recommendation-section">
          <div className="section-heading">
            <h2>Ingredients to Review</h2>
            <p>
              These ingredients may require additional attention based
              on your profile.
            </p>
          </div>

          <div className="ingredient-grid">
            {ingredientData.flagged.map((item) =>
              renderIngredient(item, "flagged")
            )}
          </div>
        </section>
      )}

      {/* AVOID */}
      {ingredientData.avoid.length > 0 && (
        <section className="recommendation-section">
          <div className="section-heading">
            <h2>Ingredients to Avoid</h2>
            <p>
              These ingredients were flagged based on your reported
              allergy information.
            </p>
          </div>

          <div className="ingredient-grid">
            {ingredientData.avoid.map((item) =>
              renderIngredient(item, "avoid")
            )}
          </div>
        </section>
      )}

      <div className="next-step-card">
        <div>
          <h2>Ready to find suitable products?</h2>
          <p>
            Explore products matched with your skin type and concerns.
          </p>
        </div>

        <button
          onClick={() => navigate("/products")}
          className="primary-button"
        >
          View Product Recommendations →
        </button>
      </div>
    </div>
  );
}

export default IngredientRecommendation;