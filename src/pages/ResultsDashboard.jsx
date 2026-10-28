import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ResultsDashboard({ assessmentData, score }) {
  const navigate = useNavigate();

  const [healthScore, setHealthScore] = useState(null);
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const [healthResponse, riskResponse] =
          await Promise.all([
            fetch("http://localhost:8000/health-score", {
              method: "GET",
              credentials: "include",
            }),

            fetch("http://localhost:8000/risk-analysis", {
              method: "GET",
              credentials: "include",
            }),
          ]);

        const healthData = await healthResponse.json();
        const riskData = await riskResponse.json();

        if (!healthResponse.ok) {
          console.error(
            "Failed to fetch health score:",
            healthData
          );
        } else {
          setHealthScore(healthData);
        }

        if (!riskResponse.ok) {
          console.error(
            "Failed to fetch risk analysis:",
            riskData
          );
        } else {
          setRiskAnalysis(riskData);
        }
      } catch (error) {
        console.error("Results fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const displayScore = healthScore
    ? healthScore.overall_score
    : score;

  return (
  <div className="assessment-page">

      {/* HEADER */}

      <div className="assessment-header">
        <p className="tagline">
          YOUR PERSONALIZED RESULTS
        </p>

        <h1>Your skin health overview ✨</h1>

        <p>
          Here's what we learned from your skin assessment.
        </p>
      </div>

      <div className="assessment-card results-card">

        {/* SCORE */}

        <div className="score-circle">
          <span>
            {loading ? "..." : displayScore}
          </span>

          <small>/100</small>
        </div>

        <h2>
          {displayScore >= 80
            ? "Good skin health 🌿"
            : displayScore >= 60
            ? "Some areas need attention 💚"
            : "Let's improve your skin health ✨"}
        </h2>

        {/* SKIN PROFILE */}

        <section className="results-section">
          <h2>Your Skin Profile</h2>

          <div className="results-grid">

            <div className="result-box">
              <span>Skin Type</span>

              <strong>
                {assessmentData.skinType}
              </strong>
            </div>

            <div className="result-box">
              <span>Age Group</span>

              <strong>
                {assessmentData.ageGroup}
              </strong>
            </div>

          </div>
        </section>

        {/* CONCERNS */}

        <section className="results-section">
          <h2>Your Main Concerns</h2>

          <div className="concerns-list">
            {assessmentData.concerns.map((concern) => (
              <span
                className="concern-tag"
                key={concern}
              >
                {concern}
              </span>
            ))}
          </div>
        </section>

        {/* PRIORITIZED CONCERNS */}

        {riskAnalysis &&
          riskAnalysis.prioritized_concerns &&
          riskAnalysis.prioritized_concerns.length > 0 && (
            <section className="results-section">

              <h2>Priority Concerns 🎯</h2>

              <div className="results-grid">

                {riskAnalysis.prioritized_concerns.map(
                  (item) => (
                    <div
                      className="result-box"
                      key={item.concern}
                    >

                      <span>
                        {item.concern}
                      </span>

                      <strong>
                        {item.priority_score}/100
                      </strong>

                    </div>
                  )
                )}

              </div>

            </section>
          )}

        {/* RISK FACTORS */}

        {riskAnalysis &&
          riskAnalysis.risk_factors &&
          riskAnalysis.risk_factors.length > 0 && (
            <section className="results-section">

              <h2>Risk Factors ⚠️</h2>

              <div className="risk-factors-list">

                {riskAnalysis.risk_factors.map(
                  (risk, index) => (
                    <div
                      className="result-box"
                      key={`${risk.factor}-${index}`}
                    >

                      <strong>
                        {risk.factor}
                      </strong>

                      <p>
                        {risk.impact}
                      </p>

                      {risk.related_concerns &&
                        risk.related_concerns.length > 0 && (
                          <small>
                            Related concerns:{" "}
                            {risk.related_concerns.join(
                              ", "
                            )}
                          </small>
                        )}

                    </div>
                  )
                )}

              </div>

            </section>
          )}

        {/* LIFESTYLE */}

        <section className="results-section">

          <h2>Lifestyle Overview</h2>

          <div className="results-grid">

            <div className="result-box">
              <span>Activity</span>

              <strong>
                {assessmentData.exercise}
              </strong>
            </div>

            <div className="result-box">
              <span>Stress</span>

              <strong>
                {assessmentData.stress}
              </strong>
            </div>

            <div className="result-box">
              <span>Sleep</span>

              <strong>
                {assessmentData.sleep}
              </strong>
            </div>

            <div className="result-box">
              <span>Water Intake</span>

              <strong>
                {assessmentData.water}
              </strong>
            </div>

          </div>

        </section>

        {/* ENVIRONMENT */}

        <section className="results-section">

          <h2>
            Environmental Exposure 🌍
          </h2>

          <div className="results-grid">

            <div className="result-box">
              <span>Sun Exposure</span>

              <strong>
                {assessmentData.sunExposure}
              </strong>
            </div>

            <div className="result-box">
              <span>Pollution Exposure</span>

              <strong>
                {assessmentData.pollutionExposure}
              </strong>
            </div>

            <div className="result-box">
              <span>Environment</span>

              <strong>
                {assessmentData.environment}
              </strong>
            </div>

          </div>

        </section>

        {/* SCORE BREAKDOWN */}

        {healthScore && (
          <section className="results-section">

            <h2>
              Health Score Breakdown
            </h2>

            <div className="results-grid">

              <div className="result-box">
                <span>Skin Condition</span>

                <strong>
                  {healthScore.skin_condition_score}/100
                </strong>
              </div>

              <div className="result-box">
                <span>Lifestyle</span>

                <strong>
                  {healthScore.lifestyle_score}/100
                </strong>
              </div>

              <div className="result-box">
                <span>Sleep Quality</span>

                <strong>
                  {healthScore.sleep_score}/100
                </strong>
              </div>

              <div className="result-box">
                <span>Routine Consistency</span>

                <strong>
                  {healthScore.routine_consistency_score}/100
                </strong>
              </div>

              <div className="result-box">
                <span>Hydration</span>

                <strong>
                  {healthScore.hydration_score}/100
                </strong>
              </div>

            </div>

          </section>
        )}

        {/* NEXT STEP */}

        
        {/* NEXT STEP */}
{/* NEXT STEP */}
<div className="next-step-box">
  <h2>What's your next step? ✨</h2>

  <p>
    Explore AI-powered ingredient suggestions or
    request a personalized review from a dermatologist.
  </p>

  <div className="results-grid">
    <div className="result-box">
      <h3>Explore Ingredients 🧪</h3>
      <p>
        Discover ingredients based on your skin type,
        concerns and reported allergies.
      </p>

      <button
        type="button"
        className="continue-button"
        onClick={() => navigate("/ingredients")}
      >
        Explore Ingredients →
      </button>
    </div>

    <div className="result-box">
      <h3>Consult a Dermatologist 👩‍⚕️</h3>
      <p>
        Request a professional review of your complete
        skin assessment and receive personalized advice.
      </p>

      <button
        type="button"
        className="continue-button"
        onClick={() => navigate("/consultation")}
      >
        Consult Dermatologist →
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

);
}

export default ResultsDashboard;