import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ProductRecommendations() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [flaggedProducts, setFlaggedProducts] = useState([]);
  const [avoidedProducts, setAvoidedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/product-recommendations",
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();

        console.log("PRODUCT RECOMMENDATION RESPONSE:", data);

        if (response.ok) {
          setProducts(
            Array.isArray(data.recommendations?.recommended)
              ? data.recommendations.recommended
              : []
          );

          setFlaggedProducts(
            Array.isArray(data.recommendations?.flagged)
              ? data.recommendations.flagged
              : []
          );

          setAvoidedProducts(
            Array.isArray(data.recommendations?.avoid)
              ? data.recommendations.avoid
              : []
          );
        } else {
          console.error(
            "Product recommendation API error:",
            data
          );
        }
      } catch (error) {
        console.error(
          "Product recommendation error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <p>Finding products for your skin profile...</p>
      </div>
    );
  }

  return (
    <div className="page-container">

      {/* ========================= */}
      {/* PAGE HEADER */}
      {/* ========================= */}

      <div className="page-header">
        <p className="page-eyebrow">
          PRODUCT INTELLIGENCE
        </p>

        <h1>Recommended Products</h1>

        <p>
          Personalized products selected based on your
          skin profile and recommended ingredients.
        </p>
      </div>

      {/* ========================= */}
      {/* RECOMMENDED PRODUCTS */}
      {/* ========================= */}

      {products.length === 0 ? (
        <div className="empty-state">
          <h2>No products found</h2>

          <p>
            Complete your skin assessment to receive
            personalized product recommendations.
          </p>

          <button
            className="primary-button"
            onClick={() => navigate("/assessment")}
          >
            Complete Assessment
          </button>
        </div>
      ) : (
        <div className="product-grid">

          {products.map((product, index) => (
            <div
              className="product-card"
              key={product.product_id || `product-${index}`}
            >

              {/* PRODUCT NAME */}

              <h2>
                {product.name}
              </h2>

              {/* BRAND */}

              <p className="product-brand">
                {product.brand || "Brand unavailable"}
              </p>

              {/* RECOMMENDED INGREDIENTS */}

              <div className="product-details">

                <p>
                  <strong>
                    Recommended ingredients:
                  </strong>
                </p>

                {product.ingredient_matches?.length > 0 ? (
                  <ul>
                    {product.ingredient_matches.map(
                      (ingredient, ingredientIndex) => (
                        <li key={ingredientIndex}>
                          {ingredient}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p>
                    Not available
                  </p>
                )}

                {/* PRICE */}

               <p>
  <strong>
    Price:
  </strong>{" "}
  {product.price_usd != null
    ? `₹${Math.round(product.price_usd * 96.33).toLocaleString("en-IN")}`
    : "Price unavailable"}
</p>

              </div>

            </div>
          ))}

        </div>
      )}

      {/* ========================= */}
      {/* FLAGGED PRODUCTS */}
      {/* ========================= */}

      {flaggedProducts.length > 0 && (
        <div className="product-section">

          <div className="page-header">
            <p className="page-eyebrow">
              SAFETY REVIEW
            </p>

            <h2>
              Products Requiring Caution
            </h2>

            <p>
              These products require additional review
              based on your reported sensitivities.
            </p>
          </div>

          <div className="product-grid">

            {flaggedProducts.map((product, index) => (
              <div
                className="product-card"
                key={
                  product.product_id ||
                  `flagged-${index}`
                }
              >

                {/* PRODUCT NAME */}

                <h2>
                  {product.name}
                </h2>

                {/* BRAND */}

                <p className="product-brand">
                  {product.brand || "Brand unavailable"}
                </p>

                {/* RECOMMENDED INGREDIENTS */}

                <div className="product-details">

                  <p>
                    <strong>
                      Recommended ingredients:
                    </strong>
                  </p>

                  {product.ingredient_matches?.length > 0 ? (
                    <ul>
                      {product.ingredient_matches.map(
                        (ingredient, ingredientIndex) => (
                          <li key={ingredientIndex}>
                            {ingredient}
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p>
                      Not available
                    </p>
                  )}

                  {/* PRICE */}

                  <p>
                    <strong>
                      Price:
                    </strong>{" "}
                    {product.price_usd != null
                      ? `$${product.price_usd}`
                      : "Price unavailable"}
                  </p>

                </div>

              </div>
            ))}

          </div>

        </div>
      )}

      {/* ========================= */}
      {/* AVOIDED PRODUCTS */}
      {/* ========================= */}

      {avoidedProducts.length > 0 && (
        <div className="product-section">

          <div className="page-header">

            <p className="page-eyebrow">
              SAFETY FILTER
            </p>

            <h2>
              Products Avoided
            </h2>

            <p>
              These products were removed because they
              conflict with your reported allergy
              information.
            </p>

          </div>

          <div className="product-grid">

            {avoidedProducts.map((product, index) => (
              <div
                className="product-card"
                key={
                  product.product_id ||
                  `avoid-${index}`
                }
              >

                {/* PRODUCT NAME */}

                <h2>
                  {product.name}
                </h2>

                {/* BRAND */}

                <p className="product-brand">
                  {product.brand || "Brand unavailable"}
                </p>

                {/* RECOMMENDED INGREDIENTS */}

                <div className="product-details">

                  <p>
                    <strong>
                      Recommended ingredients:
                    </strong>
                  </p>

                  {product.ingredient_matches?.length > 0 ? (
                    <ul>
                      {product.ingredient_matches.map(
                        (ingredient, ingredientIndex) => (
                          <li key={ingredientIndex}>
                            {ingredient}
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p>
                      Not available
                    </p>
                  )}

                  {/* PRICE */}

                  <p>
                    <strong>
                      Price:
                    </strong>{" "}
                    {product.price_usd != null
                      ? `$${product.price_usd}`
                      : "Price unavailable"}
                  </p>

                </div>

              </div>
            ))}

          </div>

        </div>
      )}

      {/* ========================= */}
      {/* NEXT STEP */}
      {/* ========================= */}

      <div className="next-step-card">

        <div>
          <h2>
            Build your personalized routine
          </h2>

          <p>
            Use your ingredient and product
            recommendations to create your morning
            and evening skincare routine.
          </p>
        </div>

        <button
          onClick={() => navigate("/routine")}
          className="primary-button"
        >
          Create My Routine →
        </button>

      </div>

    </div>
  );
}

export default ProductRecommendations;