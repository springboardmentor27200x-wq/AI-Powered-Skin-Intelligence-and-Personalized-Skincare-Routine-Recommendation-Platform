import { useState } from "react";

function EnvironmentalExposure({ onContinue }) {
  const [sunExposure, setSunExposure] = useState("");
  const [pollutionExposure, setPollutionExposure] = useState("");
  const [environment, setEnvironment] = useState("");

  const exposureOptions = ["Low", "Moderate", "High"];

  const environmentOptions = [
    "Mostly Indoor",
    "Mostly Outdoor",
    "Mixed",
  ];

  const handleContinue = () => {
    if (!sunExposure || !pollutionExposure || !environment) {
      alert("Please answer all questions.");
      return;
    }

    onContinue({
      sunExposure,
      pollutionExposure,
      environment,
    });
  };

  return (
    <div className="assessment-page">

      <div className="assessment-header">
        <p className="tagline">STEP 5 OF 7</p>

        <h1>Let's understand your environment ☀️</h1>

        <p>
          Your exposure to sunlight and pollution can help us
          personalize your skin analysis.
        </p>
      </div>

      <div className="assessment-card">

        {/* SUN EXPOSURE */}

        <section>
          <h2>How much sun exposure do you usually get?</h2>

          <p className="question-subtitle">
            Consider your typical daily outdoor exposure.
          </p>

          <div className="options-grid">
            {exposureOptions.map((option) => (
              <button
                key={option}
                className={`option-button ${
                  sunExposure === option ? "selected" : ""
                }`}
                onClick={() => setSunExposure(option)}
              >
                {sunExposure === option ? "✓ " : ""}
                {option}
              </button>
            ))}
          </div>
        </section>

        {/* POLLUTION */}

        <section>
          <h2>How much pollution exposure do you usually have?</h2>

          <p className="question-subtitle">
            Consider your daily surroundings and commute.
          </p>

          <div className="options-grid">
            {exposureOptions.map((option) => (
              <button
                key={option}
                className={`option-button ${
                  pollutionExposure === option ? "selected" : ""
                }`}
                onClick={() => setPollutionExposure(option)}
              >
                {pollutionExposure === option ? "✓ " : ""}
                {option}
              </button>
            ))}
          </div>
        </section>

        {/* ENVIRONMENT */}

        <section>
          <h2>What type of environment are you mostly in?</h2>

          <p className="question-subtitle">
            Choose the option that best describes your daily routine.
          </p>

          <div className="options-grid">
            {environmentOptions.map((option) => (
              <button
                key={option}
                className={`option-button ${
                  environment === option ? "selected" : ""
                }`}
                onClick={() => setEnvironment(option)}
              >
                {environment === option ? "✓ " : ""}
                {option}
              </button>
            ))}
          </div>
        </section>

        <button
          className="continue-button"
          onClick={handleContinue}
        >
          Continue →
        </button>

      </div>
    </div>
  );
}

export default EnvironmentalExposure;