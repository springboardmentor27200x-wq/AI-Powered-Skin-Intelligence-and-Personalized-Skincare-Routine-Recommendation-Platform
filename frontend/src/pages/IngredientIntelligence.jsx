
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./IngredientIntelligence.css";

const API_BASE = "http://127.0.0.1:8000";

function getIngredientName(item) {
  if (typeof item === "string") return item;

  return (
    item?.name ||
    item?.ingredient_name ||
    item?.ingredient ||
    item?.title ||
    "Unnamed ingredient"
  );
}

function getList(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((part) => part.trim()).filter(Boolean);
  }

  return [];
}

function getUserId(storedUser) {
  return (
    storedUser?.user?.id ??
    storedUser?.user?.user_id ??
    storedUser?.id ??
    storedUser?.user_id ??
    storedUser?.data?.user?.id ??
    storedUser?.data?.id ??
    null
  );
}

function readableValue(value) {
  if (value == null || value === "") return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.map(readableValue).filter(Boolean).join(", ");
  }

  return "";
}

function findField(object, keys) {
  if (!object || typeof object !== "object" || Array.isArray(object)) {
    return "";
  }

  for (const key of keys) {
    const value = object[key];
    const text = readableValue(value);

    if (text) return text;
  }

  return "";
}

function getInteractionData(result) {
  if (Array.isArray(result)) {
    return { items: result, summary: "" };
  }

  if (!result || typeof result !== "object") {
    return { items: [], summary: readableValue(result) };
  }

  const nested =
    result.result ||
    result.analysis ||
    result.interaction_result ||
    result.data;

  if (nested && typeof nested === "object") {
    const normalized = getInteractionData(nested);

    return {
      items: normalized.items,
      summary:
        normalized.summary ||
        findField(result, [
          "summary",
          "message",
          "explanation",
          "recommendation",
        ]),
      severity:
        findField(result, ["severity", "risk_level", "risk", "status"]) ||
        normalized.severity,
      precautions:
        findField(result, ["precautions", "safety_notes", "warnings"]) ||
        normalized.precautions,
      aiGenerated:
        result.ai_generated ??
        result.ai_powered ??
        normalized.aiGenerated,
    };
  }

  const list =
    result.interactions ||
    result.warnings ||
    result.results ||
    result.recommendations;

  const items = Array.isArray(list)
    ? list
    : list && typeof list === "object"
      ? [list]
      : [];

  const summary = findField(result, [
    "summary",
    "message",
    "explanation",
    "analysis",
    "recommendation",
    "overall_assessment",
    "overall_result",
    "details",
  ]);

  return {
    items,
    summary,
    severity: findField(result, [
      "severity",
      "risk_level",
      "risk",
      "status",
      "compatibility",
    ]),
    precautions: findField(result, [
      "precautions",
      "safety_notes",
      "warnings",
      "usage_guidance",
      "guidance",
    ]),
    aiGenerated:
      result.ai_generated ??
      result.ai_powered ??
      result.used_ai ??
      result.source === "gemini",
  };
}

function getSeverityClass(value) {
  const severity = String(value || "").toLowerCase();

  if (
    severity.includes("high") ||
    severity.includes("severe") ||
    severity.includes("danger")
  ) {
    return "high";
  }

  if (
    severity.includes("moderate") ||
    severity.includes("caution") ||
    severity.includes("medium")
  ) {
    return "moderate";
  }

  if (
    severity.includes("low") ||
    severity.includes("safe") ||
    severity.includes("compatible")
  ) {
    return "low";
  }

  return "unknown";
}

function InteractionResultCard({ result, first, second }) {
  const data = getInteractionData(result);

  const severity = data.severity || "Review recommended";
  const severityClass = getSeverityClass(severity);

  const summary =
    data.summary ||
    (data.items.length
      ? ""
      : "The API returned a response, but did not provide a recognized explanation field. Check the backend response structure.");

  const hasDetails =
    data.items.length > 0 ||
    summary ||
    data.precautions;

  return (
    <div className="ingredient-interaction-result" role="status">
      <div className="interaction-result-heading">
        <div>
          <span className="ingredient-eyebrow">
            COMPATIBILITY ANALYSIS
          </span>
          <h3>
            {first} + {second}
          </h3>
        </div>

        <span className={`interaction-severity ${severityClass}`}>
          {severity}
        </span>
      </div>

      {data.aiGenerated === true && (
        <span className="interaction-ai-label">
          ✦ AI-assisted analysis
        </span>
      )}

      {data.aiGenerated === false && (
        <span className="interaction-ai-label">
          Rule-based analysis
        </span>
      )}

      {summary && (
        <div className="interaction-result-block">
          <h4>Analysis</h4>
          <p>{summary}</p>
        </div>
      )}

      {data.items.length > 0 && (
        <div className="interaction-result-block">
          <h4>Interaction details</h4>

          <div className="interaction-result-list">
            {data.items.map((item, index) => {
              if (typeof item === "string") {
                return <p key={index}>{item}</p>;
              }

              const title = findField(item, [
                "title",
                "ingredient",
                "interaction",
                "name",
                "type",
              ]);

              const explanation = findField(item, [
                "explanation",
                "message",
                "description",
                "details",
                "reason",
                "warning",
                "recommendation",
              ]);

              const itemSeverity = findField(item, [
                "severity",
                "risk_level",
                "risk",
              ]);

              const fallback = Object.entries(item || {})
                .map(([key, value]) => {
                  const text = readableValue(value);
                  return text ? `${key.replaceAll("_", " ")}: ${text}` : "";
                })
                .filter(Boolean)
                .join(" · ");

              return (
                <article className="interaction-detail-item" key={index}>
                  {title && <h5>{title}</h5>}

                  {itemSeverity && (
                    <span
                      className={`interaction-severity ${getSeverityClass(
                        itemSeverity
                      )}`}
                    >
                      {itemSeverity}
                    </span>
                  )}

                  <p>{explanation || fallback || "No further details supplied."}</p>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {data.precautions && (
        <div className="interaction-result-block interaction-precautions">
          <h4>Precautions and usage guidance</h4>
          <p>{data.precautions}</p>
        </div>
      )}

      {!hasDetails && (
        <p>
          The backend response could not be interpreted. Verify the API
          response fields in your browser's Network tab.
        </p>
      )}

      <p className="interaction-medical-note">
        This information is general skincare guidance, not a medical
        diagnosis. Concentration, formulation, skin sensitivity, and
        frequency of use can affect irritation risk.
      </p>
    </div>
  );
}

function IngredientIntelligence() {
  const navigate = useNavigate();

  const [ingredients, setIngredients] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [education, setEducation] = useState(null);
  const [educationLoading, setEducationLoading] = useState(false);
  const [educationError, setEducationError] = useState("");

  const [firstInteraction, setFirstInteraction] = useState("");
  const [secondInteraction, setSecondInteraction] = useState("");
  const [interactionResult, setInteractionResult] = useState(null);
  const [interactionLoading, setInteractionLoading] = useState(false);
  const [interactionError, setInteractionError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    let cancelled = false;

    async function loadIngredients() {
      setLoading(true);
      setError("");

      try {
        const storedUser = JSON.parse(
          localStorage.getItem("user") || "null"
        );

        const userId = getUserId(storedUser);
        const authToken = localStorage.getItem("token");

        if (!authToken) {
          throw new Error(
            "Please log in to view ingredient recommendations."
          );
        }

        if (userId == null) {
          throw new Error(
            "Your user ID was not found in the login response."
          );
        }

        const response = await fetch(
          `${API_BASE}/api/ingredients/${encodeURIComponent(userId)}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            result.detail ||
              `Unable to load ingredient recommendations (HTTP ${response.status}).`
          );
        }

        const list = Array.isArray(result)
          ? result
          : result.recommendations ??
            result.ingredients ??
            result.items ??
            result.data ??
            [];

        if (!Array.isArray(list)) {
          throw new Error("Unexpected ingredient API response format.");
        }

        if (!cancelled) {
          setIngredients(list);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load ingredients.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadIngredients();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const values = ingredients.map(
      (item) => item?.category || item?.ingredient_type || "General"
    );

    return ["All", ...new Set(values)];
  }, [ingredients]);

  const filteredIngredients = useMemo(() => {
    const term = search.trim().toLowerCase();

    return ingredients.filter((item) => {
      const name = getIngredientName(item);
      const category = item?.category || item?.ingredient_type || "General";

      const searchableText = [
        name,
        category,
        item?.description,
        item?.benefits,
        item?.skin_types,
        item?.concerns,
        item?.function,
      ]
        .map((value) =>
          Array.isArray(value) ? value.join(" ") : value || ""
        )
        .join(" ")
        .toLowerCase();

      return (
        (!term || searchableText.includes(term)) &&
        (selectedCategory === "All" || category === selectedCategory)
      );
    });
  }, [ingredients, search, selectedCategory]);

  async function openIngredientEducation(item) {
    const name = getIngredientName(item);

    setSelectedIngredient(item);
    setEducation(null);
    setEducationError("");
    setEducationLoading(true);

    try {
      const authToken = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE}/api/ingredients/education/${encodeURIComponent(name)}`,
        {
          headers: authToken
            ? { Authorization: `Bearer ${authToken}` }
            : {},
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.detail ||
            `Could not load ingredient education (HTTP ${response.status}).`
        );
      }

      setEducation(result);
    } catch (err) {
      setEducationError(
        err.message || "Could not load ingredient education."
      );
    } finally {
      setEducationLoading(false);
    }
  }

  async function checkInteraction(event) {
    event.preventDefault();

    setInteractionResult(null);
    setInteractionError("");

    const first = firstInteraction.trim();
    const second = secondInteraction.trim();

    if (!first || !second) {
      setInteractionError("Enter both ingredient names.");
      return;
    }

    if (first.toLowerCase() === second.toLowerCase()) {
      setInteractionError("Enter two different ingredient names.");
      return;
    }

    setInteractionLoading(true);

    try {
      const authToken = localStorage.getItem("token");

      if (!authToken) {
        throw new Error(
          "Please log in to check ingredient interactions."
        );
      }

      const response = await fetch(
        `${API_BASE}/api/ingredients/interactions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },

          // The backend service expects a list of ingredient names.
          body: JSON.stringify([first, second]),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : `Interaction check failed (HTTP ${response.status}).`
        );
      }

      setInteractionResult(result);
    } catch (err) {
      setInteractionError(
        err.message || "Unable to check ingredient interactions."
      );
    } finally {
      setInteractionLoading(false);
    }
  }

  const educationName = education
    ? getIngredientName(education) !== "Unnamed ingredient"
      ? getIngredientName(education)
      : getIngredientName(selectedIngredient)
    : "";

  const educationDescription =
    education?.description ||
    education?.education ||
    education?.summary ||
    education?.details ||
    "";

  return (
    <div className="ingredient-page">
      <header className="ingredient-topbar">
        <button
          className="ingredient-back-button"
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>

        <div className="ingredient-brand">
          <span className="ingredient-brand-icon">D</span>
          <span>DermaGenie</span>
        </div>
      </header>

      <main className="ingredient-main">
        <section className="ingredient-hero">
          <div className="ingredient-hero-copy">
            <span className="ingredient-eyebrow">
              YOUR PERSONAL SKINCARE GUIDE
            </span>

            <h1>
              Understand your
              <br />
              <span>ingredients.</span>
            </h1>

            <p>
              Explore your personalized ingredient recommendations, learn
              about skincare ingredients, and check potential ingredient
              interactions with helpful explanations.
            </p>

            <div className="ingredient-search">
              <span aria-hidden="true">⌕</span>

              <input
                type="search"
                aria-label="Search ingredients"
                placeholder="Search ingredients, benefits, or concerns..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && search.trim()) {
                    event.preventDefault();
                    openIngredientEducation({ name: search.trim() });
                  }
                }}
              />

              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                >
                  ×
                </button>
              )}

              <button
                type="button"
                aria-label="Search ingredient education"
                onClick={() => {
                  if (search.trim()) {
                    openIngredientEducation({ name: search.trim() });
                  }
                }}
              >
                Search
              </button>
            </div>
          </div>

          <div className="ingredient-hero-art" aria-hidden="true">
            <div className="ingredient-orbit ingredient-orbit-one" />
            <div className="ingredient-orbit ingredient-orbit-two" />
            <div className="ingredient-molecule">✳</div>
            <span className="ingredient-art-dot dot-one" />
            <span className="ingredient-art-dot dot-two" />
            <span className="ingredient-art-dot dot-three" />
          </div>
        </section>

        <section className="ingredient-content">
          <div className="ingredient-section-heading">
            <div>
              <span className="ingredient-eyebrow">INGREDIENT LIBRARY</span>
              <h2>Your ingredient recommendations</h2>
              <p>
                Recommendations retrieved from your DermaGenie backend.
              </p>
            </div>

            <span className="ingredient-count">
              {loading ? "Loading..." : `${filteredIngredients.length} found`}
            </span>
          </div>

          {!loading && ingredients.length > 0 && (
            <div className="ingredient-filters">
              {categories.map((category) => (
                <button
                  key={category}
                  className={
                    selectedCategory === category
                      ? "ingredient-filter active"
                      : "ingredient-filter"
                  }
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="ingredient-status">
              <div className="ingredient-spinner" />
              <h3>Loading your recommendations</h3>
              <p>Connecting to DermaGenie...</p>
            </div>
          )}

          {!loading && error && (
            <div className="ingredient-status ingredient-error">
              <div className="ingredient-status-icon">!</div>
              <h3>Ingredient recommendations unavailable</h3>
              <p>{error}</p>
              <button
                className="ingredient-primary-button"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && ingredients.length === 0 && (
            <div className="ingredient-status">
              <div className="ingredient-status-icon">✳</div>
              <h3>No recommendations returned</h3>
              <p>
                No ingredient records were returned for this user. Check
                your skin profile and backend response.
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            ingredients.length > 0 &&
            filteredIngredients.length === 0 && (
              <div className="ingredient-status">
                <h3>No matching ingredients</h3>
                <p>Try another search term or category.</p>
                <button
                  className="ingredient-primary-button"
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("All");
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}

          {!loading && !error && filteredIngredients.length > 0 && (
            <div className="ingredient-grid">
              {filteredIngredients.map((item, index) => {
                const name = getIngredientName(item);
                const category =
                  item?.category || item?.ingredient_type || "General";

                const benefits = getList(
                  item?.benefits || item?.functions || item?.function
                );

                const description =
                  item?.description ||
                  item?.summary ||
                  item?.details ||
                  "Select View details to request ingredient education.";

                return (
                  <article
                    className="ingredient-card"
                    key={item?.id ?? `${name}-${index}`}
                  >
                    <div className="ingredient-card-top">
                      <div className="ingredient-card-symbol">
                        {name.charAt(0).toUpperCase()}
                      </div>

                      <span className="ingredient-category">
                        {category}
                      </span>
                    </div>

                    <h3>{name}</h3>
                    <p className="ingredient-description">{description}</p>

                    {benefits.length > 0 && (
                      <div className="ingredient-tags">
                        {benefits.slice(0, 3).map((benefit, i) => (
                          <span key={i}>{benefit}</span>
                        ))}
                      </div>
                    )}

                    <button
                      className="ingredient-details-button"
                      onClick={() => openIngredientEducation(item)}
                    >
                      View details <span>↗</span>
                    </button>
                  </article>
                );
              })}
            </div>
          )}

          <section className="ingredient-interaction-section">
            <span className="ingredient-eyebrow">
              INGREDIENT COMPATIBILITY
            </span>

            <h2>Check ingredient interactions</h2>

            <p>
              Analyze two ingredients and review potential compatibility
              concerns, precautions, and available AI-generated guidance.
            </p>

            <form
              className="ingredient-interaction-form"
              onSubmit={checkInteraction}
            >
              <label>
                First ingredient
                <input
                  value={firstInteraction}
                  onChange={(event) =>
                    setFirstInteraction(event.target.value)
                  }
                  placeholder="e.g. Retinol"
                  required
                />
              </label>

              <label>
                Second ingredient
                <input
                  value={secondInteraction}
                  onChange={(event) =>
                    setSecondInteraction(event.target.value)
                  }
                  placeholder="e.g. Salicylic acid"
                  required
                />
              </label>

              <button
                className="ingredient-primary-button"
                type="submit"
                disabled={interactionLoading}
              >
                {interactionLoading
                  ? "Analyzing ingredients..."
                  : "✦ Analyze interaction"}
              </button>
            </form>

            {interactionLoading && (
              <div className="ingredient-status">
                <div className="ingredient-spinner" />
                <h3>Analyzing your ingredients</h3>
                <p>
                  Checking the backend for interaction details and guidance.
                </p>
              </div>
            )}

            {interactionError && (
              <p className="ingredient-interaction-error" role="alert">
                {interactionError}
              </p>
            )}

            {interactionResult && !interactionLoading && (
              <InteractionResultCard
                result={interactionResult}
                first={firstInteraction.trim()}
                second={secondInteraction.trim()}
              />
            )}
          </section>

          <section className="ingredient-disclaimer">
            <span>ⓘ</span>
            <p>
              <strong>Remember:</strong> Ingredient suitability depends on
              concentration, formulation, skin sensitivity, and frequency
              of use. Patch-test new products and seek professional advice
              for persistent skin problems.
            </p>
          </section>
        </section>
      </main>

      {selectedIngredient && (
        <div
          className="ingredient-modal-backdrop"
          onClick={() => setSelectedIngredient(null)}
        >
          <section
            className="ingredient-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ingredient-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="ingredient-modal-close"
              aria-label="Close details"
              onClick={() => setSelectedIngredient(null)}
            >
              ×
            </button>

            <span className="ingredient-eyebrow">INGREDIENT EDUCATION</span>

            <h2 id="ingredient-modal-title">
              {educationName || getIngredientName(selectedIngredient)}
            </h2>

            {educationLoading && <p>Loading ingredient education...</p>}

            {educationError && (
              <p className="ingredient-interaction-error" role="alert">
                {educationError}
              </p>
            )}

            {!educationLoading && education && (
              <>
                {educationDescription && <p>{educationDescription}</p>}

                {[
                  [
                    "Benefits",
                    education.benefits ||
                      education.functions ||
                      education.function,
                  ],
                  [
                    "Suitable skin types",
                    education.skin_types || education.suitable_skin_types,
                  ],
                  [
                    "Skin concerns",
                    education.concerns || education.skin_concerns,
                  ],
                  ["Usage", education.usage || education.how_to_use],
                  [
                    "Precautions",
                    education.safety_notes ||
                      education.precautions ||
                      education.warnings,
                  ],
                ].map(([label, value]) => {
                  const values = getList(value);
                  const display = values.length
                    ? values.join(", ")
                    : typeof value === "string"
                      ? value
                      : "";

                  if (!display) return null;

                  return (
                    <div className="ingredient-detail-row" key={label}>
                      <h4>{label}</h4>
                      <p>{display}</p>
                    </div>
                  );
                })}

                {!educationDescription &&
                  !education.benefits &&
                  !education.functions &&
                  !education.function &&
                  !education.skin_types &&
                  !education.suitable_skin_types &&
                  !education.concerns &&
                  !education.skin_concerns &&
                  !education.usage &&
                  !education.how_to_use &&
                  !education.safety_notes &&
                  !education.precautions &&
                  !education.warnings && (
                    <pre className="ingredient-education-json">
                      {JSON.stringify(education, null, 2)}
                    </pre>
                  )}
              </>
            )}

            <button
              className="ingredient-primary-button"
              onClick={() => {
                setSelectedIngredient(null);
                setEducation(null);
                setEducationError("");
              }}
            >
              Close details
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

export default IngredientIntelligence;