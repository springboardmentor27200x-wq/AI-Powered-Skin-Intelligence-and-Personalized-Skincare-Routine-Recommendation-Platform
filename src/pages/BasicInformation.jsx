import { useState } from "react";

function BasicInformation({ onContinue }) {  const [ageGroup, setAgeGroup] = useState("");

  const ageGroups = [
    "Under 18",
    "18–24",
    "25–34",
    "35–44",
    "45+",
  ];

  return (
    <div className="assessment-page">

      <div className="assessment-header">
        <p className="tagline">STEP 2 OF 6</p>

        <h1>Tell us about yourself ✨</h1>

        <p>
          A few basic details will help us personalize your skincare plan.
        </p>
      </div>

      <div className="assessment-card">

        <section>
          <h2>What is your age group?</h2>
          <p className="question-subtitle">
            Choose the option that best describes you.
          </p>

          <div className="options-grid">
            {ageGroups.map((age) => (
              <button
                key={age}
                className={`option-button ${
                  ageGroup === age ? "selected" : ""
                }`}
                onClick={() => setAgeGroup(age)}
              >
                {ageGroup === age ? "✓ " : ""}
                {age}
              </button>
            ))}
          </div>
        </section>

        <button
          className="continue-button"
          onClick={() => {
            if (!ageGroup) {
              alert("Please select your age group.");
              return;
            }

onContinue({
  ageGroup: ageGroup
});         }}
        >
          Continue →
        </button>

      </div>
    </div>
  );
}

export default BasicInformation;