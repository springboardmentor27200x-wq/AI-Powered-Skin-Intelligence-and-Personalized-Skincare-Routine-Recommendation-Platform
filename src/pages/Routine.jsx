import { useEffect, useMemo } from "react";
import generateRoutine from "../utils/routineEngine";

function Routine({ assessmentData }) {
  const routine = useMemo(
    () =>
      generateRoutine({
        skinType: assessmentData.skinType,
        concerns: assessmentData.concerns,
        allergies: assessmentData.allergies,
        exercise: assessmentData.exercise,
        stress: assessmentData.stress,
        sleep: assessmentData.sleep,
        water: assessmentData.water,
        ageGroup: assessmentData.ageGroup,
      }),
    [assessmentData]
  );

  // Save the exact routine shown here so the Progress page can reuse it.
  useEffect(() => {
    try {
      localStorage.setItem(
        "skinsenseGeneratedRoutine",
        JSON.stringify({
          morning: routine.morning || [],
          night: routine.night || [],
          weekly: routine.weekly || [],
        })
      );
    } catch (error) {
      console.error("Could not save generated routine:", error);
    }
  }, [routine]);

  return (
    <div className="assessment-page">
      <div className="assessment-header">
        <p className="tagline">YOUR PERSONALIZED ROUTINE</p>
        <h1>Your skincare routine ✨</h1>
        <p>
          Your routine is personalized using your skin type, concerns,
          lifestyle and wellness information.
        </p>
      </div>

      <div className="assessment-card routine-card">
        <section className="routine-section">
          <div className="routine-title">
            <span>☀️</span>
            <div>
              <h2>Morning Routine</h2>
              <p>Start your day with simple skin support.</p>
            </div>
          </div>
          <div className="routine-list">
            {(routine.morning || []).map((item, index) => (
              <div className="routine-item" key={`morning-${index}`}>
                <div className="routine-number">{index + 1}</div>
                <div>
                  <strong>{item.name}</strong>
                  {item.ingredient && (
                    <p><strong>Ingredient:</strong> {item.ingredient}</p>
                  )}
                  <p>{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="routine-section">
          <div className="routine-title">
            <span>🌙</span>
            <div>
              <h2>Night Routine</h2>
              <p>Keep your evening routine simple and consistent.</p>
            </div>
          </div>
          <div className="routine-list">
            {(routine.night || []).map((item, index) => (
              <div className="routine-item" key={`night-${index}`}>
                <div className="routine-number">{index + 1}</div>
                <div>
                  <strong>{item.name}</strong>
                  {item.ingredient && (
                    <p><strong>Ingredient:</strong> {item.ingredient}</p>
                  )}
                  <p>{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="routine-section">
          <div className="routine-title">
            <span>📅</span>
            <div>
              <h2>Weekly Care</h2>
              <p>Additional care based on your concerns.</p>
            </div>
          </div>
          <div className="routine-list">
            {(routine.weekly || []).map((item, index) => (
              <div className="routine-item" key={`weekly-${index}`}>
                <div className="routine-number">{index + 1}</div>
                <div>
                  <strong>{item.name}</strong>
                  {item.ingredient && (
                    <p><strong>Ingredient:</strong> {item.ingredient}</p>
                  )}
                  <p>{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {Array.isArray(routine.insights) && routine.insights.length > 0 && (
          <section className="routine-section">
            <div className="routine-title">
              <span>🌿</span>
              <div>
                <h2>Lifestyle Insights</h2>
                <p>Small changes that may support your skin health.</p>
              </div>
            </div>
            <div className="routine-list">
              {routine.insights.map((insight, index) => (
                <div className="routine-item" key={`insight-${index}`}>
                  <div className="routine-number">💡</div>
                  <div><p>{insight}</p></div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="routine-note">
          <h2>Why this routine? 🌿</h2>
          <p>
            Your routine is based on your selected skin type and concerns:{" "}
            <strong>{assessmentData.skinType}</strong> skin with{" "}
            <strong>
              {(assessmentData.concerns || []).join(", ") || "your selected concerns"}
            </strong>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Routine;
