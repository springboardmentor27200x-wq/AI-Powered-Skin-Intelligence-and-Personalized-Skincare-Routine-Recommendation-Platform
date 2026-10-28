import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  const [healthScore, setHealthScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealthScore = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/health-score",
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setHealthScore(null);
          return;
        }

        setHealthScore(data.overall_score);
      } catch (error) {
        console.error("Health score error:", error);
        setHealthScore(null);
      } finally {
        setLoading(false);
      }
    };

    fetchHealthScore();
  }, []);

  return (
    <div className="home-page">

      <section className="home-hero">
        <div>
          <p className="home-eyebrow">WELCOME TO SKINSENSE ✨</p>

          <h1>
            Understand your skin.
            <br />
            Build a routine that works.
          </h1>

          <p className="home-description">
            Your personalized skincare journey starts here.
            Track your skin, understand your concerns, and
            build smarter routines.
          </p>

          <button
            className="home-primary-button"
            onClick={() => navigate("/assessment")}
          >
            Start Skin Assessment →
          </button>
        </div>

        <div className="home-hero-card">
          <span>YOUR SKIN SCORE</span>

          <div className="score-circle">
            <strong>
              {loading ? "..." : healthScore ?? "--"}
            </strong>

            <small>/ 100</small>
          </div>

          <p>
            {healthScore
              ? "Your latest skin health score."
              : "Complete your assessment to get your score."}
          </p>
        </div>
      </section>

    </div>
  );
}

export default Home;