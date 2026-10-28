function SkinAnalysis({ assessmentData, score, onContinue }) {
  const calculateScore = () => {

    let skinCondition = 100;
    let lifestyle = 100;
    let sleepScore = 100;
    let hydration = 100;

    // -------------------------
    // 1. SKIN CONDITION - 35%
    // -------------------------

    if (assessmentData.concerns.length >= 4) {
      skinCondition -= 30;
    } else if (assessmentData.concerns.length >= 2) {
      skinCondition -= 15;
    } else {
      skinCondition -= 5;
    }

    // -------------------------
    // 2. LIFESTYLE - 20%
    // -------------------------

    if (assessmentData.exercise === "Low") {
      lifestyle -= 20;
    } else if (assessmentData.exercise === "Moderate") {
      lifestyle -= 10;
    }

    if (assessmentData.stress === "High") {
      lifestyle -= 20;
    } else if (assessmentData.stress === "Moderate") {
      lifestyle -= 10;
    }

    // -------------------------
    // 3. SLEEP - 15%
    // -------------------------

    if (assessmentData.sleep === "Less than 5 hours") {
      sleepScore -= 30;
    } else if (assessmentData.sleep === "5–6 hours") {
      sleepScore -= 15;
    } else if (assessmentData.sleep === "7–8 hours") {
      sleepScore -= 0;
    } else if (assessmentData.sleep === "More than 8 hours") {
      sleepScore -= 5;
    }

    // -------------------------
    // 4. HYDRATION - 10%
    // -------------------------

    if (assessmentData.water === "Less than 1 L") {
      hydration -= 30;
    } else if (assessmentData.water === "1–2 L") {
      hydration -= 15;
    } else if (assessmentData.water === "2–3 L") {
      hydration -= 5;
    }

    // -------------------------
    // FINAL SCORE
    // -------------------------

    const finalScore =
      skinCondition * 0.35 +
      lifestyle * 0.20 +
      sleepScore * 0.15 +
      100 * 0.20 +
      hydration * 0.10;

    return Math.round(finalScore);
  };


  return (
    <div className="assessment-page">

      <div className="assessment-header">
        <p className="tagline">YOUR SKIN ANALYSIS</p>

        <h1>Your skin health score ✨</h1>

        <p>
          Based on the information you provided,
          here's your initial skin health score.
        </p>
      </div>

      <div className="assessment-card analysis-card">

        <div className="score-circle">
          <span>{score}</span>
          <small>/100</small>
        </div>

        <h2>
          {score >= 80
            ? "Your skin health looks good! 🌿"
            : score >= 60
            ? "Your skin needs some attention 💚"
            : "Let's work on your skin health ✨"}
        </h2>

        <p className="analysis-description">
          Your score is based on your skin concerns,
          lifestyle, sleep and hydration habits.
        </p>

        <button
          className="continue-button"
onClick={onContinue}        >
          View My Personalized Plan →
        </button>

      </div>

    </div>
  );
}

export default SkinAnalysis;