import { useState } from "react";

function SkinAssessment({ onContinue }) {
  const [skinType, setSkinType] = useState("");
  const [concerns, setConcerns] = useState([]);

  const skinTypes = [
    "Normal",
    "Dry",
    "Oily",
    "Combination",
    "Sensitive",
  ];

  const skinConcerns = [
    "Acne",
    "Dark Spots",
    "Hyperpigmentation",
    "Redness",
    "Fine Lines",
    "Uneven Skin Tone",
  ];

  const handleConcernChange = (concern) => {
    if (concerns.includes(concern)) {
      setConcerns(concerns.filter((item) => item !== concern));
    } else {
      setConcerns([...concerns, concern]);
    }
  };

  const handleSubmit = () => {
    if (!skinType) {
      alert("Please select your skin type.");
      return;
    }

    if (concerns.length === 0) {
      alert("Please select at least one skin concern.");
      return;
    }

    onContinue({
      skinType: skinType,
      concerns: concerns,
    });
  };

  return (
    <div className="assessment-page">

      <div className="assessment-header">
        <p className="tagline">SKIN INTELLIGENCE</p>

        <h1>Let's understand your skin ✨</h1>

        <p>
          Answer a few questions so we can create a personalized
          skincare plan for you.
        </p>
      </div>

      <div className="assessment-card">

        {/* SKIN TYPE */}

        <section>
          <h2>What is your skin type?</h2>

          <p className="question-subtitle">
            Choose the option that best describes your skin.
          </p>

          <div className="options-grid">
            {skinTypes.map((type) => (
              <button
                key={type}
                className={`option-button ${
                  skinType === type ? "selected" : ""
                }`}
                onClick={() => setSkinType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </section>

        {/* SKIN CONCERNS */}

        <section>
          <h2>What are your main skin concerns?</h2>

          <p className="question-subtitle">
            Select all that apply.
          </p>

          <div className="options-grid">
            {skinConcerns.map((concern) => (
              <button
                key={concern}
                className={`option-button ${
                  concerns.includes(concern) ? "selected" : ""
                }`}
                onClick={() => handleConcernChange(concern)}
              >
                {concerns.includes(concern) ? "✓ " : ""}
                {concern}
              </button>
            ))}
          </div>
        </section>

        <button
          className="continue-button"
          onClick={handleSubmit}
        >
          Continue →
        </button>

      </div>
    </div>
  );
}

export default SkinAssessment;