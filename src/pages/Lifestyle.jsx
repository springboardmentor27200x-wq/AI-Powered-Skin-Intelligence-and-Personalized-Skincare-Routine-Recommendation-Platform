import { useState } from "react";

function Lifestyle({ onContinue }) {
  const [exercise, setExercise] = useState("");
  const [stress, setStress] = useState("");

  const options = ["Low", "Moderate", "High"];

  return (
    <div className="assessment-page">

      <div className="assessment-header">
        <p className="tagline">STEP 4 OF 6</p>

        <h1>Tell us about your lifestyle 🌿</h1>

        <p>
          Your daily habits can help us personalize your skincare plan.
        </p>
      </div>

      <div className="assessment-card">

        <section>
          <h2>How active is your lifestyle?</h2>

          <div className="options-grid">
            {options.map((option) => (
              <button
                key={option}
                className={`option-button ${
                  exercise === option ? "selected" : ""
                }`}
                onClick={() => setExercise(option)}
              >
                {exercise === option ? "✓ " : ""}
                {option}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2>How would you describe your stress level?</h2>

          <div className="options-grid">
            {options.map((option) => (
              <button
                key={option}
                className={`option-button ${
                  stress === option ? "selected" : ""
                }`}
                onClick={() => setStress(option)}
              >
                {stress === option ? "✓ " : ""}
                {option}
              </button>
            ))}
          </div>
        </section>

        <button
          className="continue-button"
          onClick={() => {
            if (!exercise || !stress) {
              alert("Please answer both questions.");
              return;
            }

onContinue({
  exercise: exercise,
  stress: stress
});          }}
        >
          Continue →
        </button>

      </div>
    </div>
  );
}

export default Lifestyle;