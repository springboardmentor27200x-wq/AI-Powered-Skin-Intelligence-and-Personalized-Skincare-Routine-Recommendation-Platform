import { useState } from "react";

function Allergies({ onContinue }) {
  const [allergyStatus, setAllergyStatus] = useState("");
  const [allergies, setAllergies] = useState([]);

  const allergyOptions = [
    "Fragrance",
    "Essential Oils",
    "Alcohol",
    "Preservatives",
    "Latex",
    "Nickel / Metals",
    "Other",
  ];

  const handleAllergyChange = (allergy) => {
    if (allergies.includes(allergy)) {
      setAllergies(
        allergies.filter((item) => item !== allergy)
      );
    } else {
      setAllergies([...allergies, allergy]);
    }
  };

  const handleContinue = () => {
    if (!allergyStatus) {
      alert("Please select an option.");
      return;
    }

    if (
      allergyStatus === "Yes" &&
      allergies.length === 0
    ) {
      alert("Please select at least one allergy or sensitivity.");
      return;
    }

    onContinue({
      allergies:
        allergyStatus === "Yes"
          ? allergies.join(", ")
          : allergyStatus
    });
  };

  return (
    <div className="assessment-page">

      <div className="assessment-header">
        <p className="tagline">STEP 3 OF 7</p>

        <h1>Any allergies or sensitivities? 🌿</h1>

        <p>
          Tell us about anything your skin may react to.
        </p>
      </div>

      <div className="assessment-card">

        <section>
          <h2>Do you have any known allergies?</h2>

          <div className="options-grid">
            {["Yes", "No", "Not sure"].map((option) => (
              <button
                key={option}
                className={`option-button ${
                  allergyStatus === option
                    ? "selected"
                    : ""
                }`}
                onClick={() => {
                  setAllergyStatus(option);

                  if (option !== "Yes") {
                    setAllergies([]);
                  }
                }}
              >
                {allergyStatus === option ? "✓ " : ""}
                {option}
              </button>
            ))}
          </div>
        </section>

        {allergyStatus === "Yes" && (
          <section>
            <h2>What are you allergic or sensitive to?</h2>

            <p className="question-subtitle">
              Select anything you know you react to.
            </p>

            <div className="options-grid">
              {allergyOptions.map((allergy) => (
                <button
                  key={allergy}
                  className={`option-button ${
                    allergies.includes(allergy)
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    handleAllergyChange(allergy)
                  }
                >
                  {allergies.includes(allergy)
                    ? "✓ "
                    : ""}
                  {allergy}
                </button>
              ))}
            </div>
          </section>
        )}

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

export default Allergies;