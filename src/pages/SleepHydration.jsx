import { useState } from "react";

function SleepHydration({ onContinue }) {
  const [sleep, setSleep] = useState("");
  const [water, setWater] = useState("");

  const sleepOptions = [
    "Less than 5 hours",
    "5–6 hours",
    "7–8 hours",
    "More than 8 hours",
  ];

  const waterOptions = [
    "Less than 1 L",
    "1–2 L",
    "2–3 L",
    "More than 3 L",
  ];

  return (
    <div className="assessment-page">

      <div className="assessment-header">
        <p className="tagline">STEP 5 OF 6</p>

        <h1>Let's talk about your daily habits 💧</h1>

        <p>
          Sleep and hydration help us understand your overall skin health.
        </p>
      </div>

      <div className="assessment-card">

        {/* SLEEP */}

        <section>
          <h2>How much do you usually sleep?</h2>

          <p className="question-subtitle">
            Select your average sleep duration.
          </p>

          <div className="options-grid">
            {sleepOptions.map((option) => (
              <button
                key={option}
                className={`option-button ${
                  sleep === option ? "selected" : ""
                }`}
                onClick={() => setSleep(option)}
              >
                {sleep === option ? "✓ " : ""}
                {option}
              </button>
            ))}
          </div>
        </section>

        {/* WATER */}

        <section>
          <h2>How much water do you drink daily?</h2>

          <p className="question-subtitle">
            Choose your approximate daily water intake.
          </p>

          <div className="options-grid">
            {waterOptions.map((option) => (
              <button
                key={option}
                className={`option-button ${
                  water === option ? "selected" : ""
                }`}
                onClick={() => setWater(option)}
              >
                {water === option ? "✓ " : ""}
                {option}
              </button>
            ))}
          </div>
        </section>

        <button
          className="continue-button"
          onClick={() => {
            if (!sleep || !water) {
              alert("Please answer both questions.");
              return;
            }

onContinue({
  sleep: sleep,
  water: water
});          }}
        >
          Continue →
        </button>

      </div>
    </div>
  );
}

export default SleepHydration;