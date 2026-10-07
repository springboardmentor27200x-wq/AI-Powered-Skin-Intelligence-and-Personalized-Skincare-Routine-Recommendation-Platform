import React, { useState } from "react";

const API = "http://127.0.0.1:8000";

function Recommendations({ onBack }) {
  let user = {};

  try {
    user = JSON.parse(
      localStorage.getItem("skinai_user") ||
        localStorage.getItem("user") ||
        "{}"
    );
  } catch (error) {
    console.error("User data error:", error);
    user = {};
  }

  const [age, setAge] = useState(user.age || "");
  const [skinType, setSkinType] = useState(
    user.skin_type || ""
  );
  const [concerns, setConcerns] = useState(
    Array.isArray(user.concerns)
      ? user.concerns
      : []
  );
  const [sensitivity, setSensitivity] = useState(
    user.sensitivity || ""
  );
  const [water, setWater] = useState(
    user.water || ""
  );
  const [sleep, setSleep] = useState(
    user.sleep || ""
  );
  const [exercise, setExercise] = useState(
    user.exercise || ""
  );
  const [season, setSeason] = useState(
    user.season || ""
  );

  const [result, setResult] = useState(null);
  const [selectedDermatologist, setSelectedDermatologist] =
    useState("");
  const [shareMessage, setShareMessage] =
    useState("");
  const [loading, setLoading] =
    useState(false);

  const [issueType, setIssueType] =
    useState("");
  const [issueDescription, setIssueDescription] =
    useState("");
  const [issueMessage, setIssueMessage] =
    useState("");
  const [issueLoading, setIssueLoading] =
    useState(false);

  const handleConcernChange = (concern) => {
    setConcerns((previous) => {
      if (previous.includes(concern)) {
        return previous.filter(
          (item) => item !== concern
        );
      }

      return [...previous, concern];
    });
  };

  const calculateSkinScore = () => {
    let score = 50;

    if (skinType) {
      score += 10;
    }

    if (concerns.length > 0) {
      score += 10;
    }

    if (sensitivity === "Low") {
      score += 10;
    }

    if (Number(water) >= 6) {
      score += 5;
    }

    if (Number(sleep) >= 7) {
      score += 5;
    }

    return Math.min(
      100,
      Math.max(0, score)
    );
  };

  const generateAssessment = async () => {
    if (!skinType) {
      alert(
        "Please select your skin type."
      );
      return;
    }

    if (concerns.length === 0) {
      alert(
        "Please select at least one skin concern."
      );
      return;
    }

    setLoading(true);
    setShareMessage("");
    setIssueMessage("");

    const skinScore =
      calculateSkinScore();

    const mainConcern =
      concerns[0] ||
      "General Skin Health";

    const assessment = {
      id: null,

      email: user.email || "",

      name:
        user.name ||
        user.full_name ||
        "User",

      age: Number(age) || 0,

      skin_type: skinType,

      concerns: concerns,

      sensitivity: sensitivity,

      lifestyle: {
        water: Number(water) || 0,
        sleep: Number(sleep) || 0,
        exercise:
          exercise || "Not provided"
      },

      season: season,

      score: skinScore,

      skin_assessment: {
        summary:
          `Your skin profile indicates ${skinType.toLowerCase()} skin with ${mainConcern.toLowerCase()} as a primary concern.`,

        skin_type_analysis:
          `${skinType} skin requires a consistent skincare routine based on hydration, cleansing and suitable skincare products.`,

        concern_analysis:
          `The assessment focuses on ${concerns.join(", ")}.`,

        sensitivity_analysis:
          sensitivity
            ? `Your reported sensitivity level is ${sensitivity}.`
            : "Sensitivity information was not provided."
      },

      priority: mainConcern,

      risk_factors: [
        Number(water) > 0 &&
        Number(water) < 6
          ? "Low water intake"
          : null,

        Number(sleep) > 0 &&
        Number(sleep) < 7
          ? "Insufficient sleep"
          : null,

        exercise ===
        "No Regular Exercise"
          ? "Low physical activity"
          : null,

        sensitivity === "High"
          ? "High skin sensitivity"
          : null
      ].filter(Boolean),

      treatment_plan: {
        morning: [
          "Gentle cleanser",
          "Suitable moisturizer",
          "Broad-spectrum sunscreen"
        ],

        evening: [
          "Gentle cleanser",
          "Targeted skincare product",
          "Moisturizer"
        ]
      },

      seasonal_advice: season
        ? `During ${season.toLowerCase()}, maintain a skincare routine suitable for your skin type and concerns.`
        : "Maintain a consistent skincare routine throughout the year.",

      weekly_plan: [
        "Monday - Cleanse and moisturize",
        "Tuesday - Follow targeted treatment",
        "Wednesday - Hydrate skin",
        "Thursday - Continue targeted treatment",
        "Friday - Cleanse and moisturize",
        "Saturday - Skin hydration and care",
        "Sunday - Review routine and skin condition"
      ],

      adaptive_recommendation:
        `For ${skinType.toLowerCase()} skin with ${mainConcern.toLowerCase()}, follow a gentle and consistent routine and monitor your skin response.`,

      lifestyle_summary: {
        water: water
          ? `${water} glasses/day`
          : "Not provided",

        sleep: sleep
          ? `${sleep} hours/day`
          : "Not provided",

        exercise:
          exercise || "Not provided"
      },

      created_at:
        new Date().toISOString()
    };

    try {
      const history =
        JSON.parse(
          localStorage.getItem(
            "skinai_assessment_history"
          ) || "[]"
        );

      history.push(assessment);

      localStorage.setItem(
        "skinai_assessment_history",
        JSON.stringify(history)
      );
    } catch (error) {
      console.error(
        "Local assessment save error:",
        error
      );
    }

    try {
      const response =
        await fetch(
          `${API}/assessment`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              email:
                user.email || "",

              age:
                Number(age) || 0,

              skin_type:
                skinType,

              concerns:
                concerns,

              sensitivity:
                sensitivity,

              water:
                Number(water) || 0,

              sleep:
                Number(sleep) || 0,

              exercise:
                exercise || "",

              season:
                season,

              score:
                skinScore
            })
          }
        );

      const data =
        await response.json().catch(
          () => ({})
        );

      if (response.ok) {
        assessment.id =
          data.assessment_id ??
          data.assessmentId ??
          data.id ??
          data.report_id ??
          null;
      }
    } catch (error) {
      console.log(
        "Backend assessment unavailable. Using local assessment."
      );
    }

    setResult({
      ...assessment
    });

    setLoading(false);
  };

  const shareReport = () => {
    if (!result) {
      setShareMessage(
        "Please generate the assessment first."
      );
      return;
    }

    if (!selectedDermatologist) {
      setShareMessage(
        "Please select a dermatologist."
      );
      return;
    }

    try {
      const sharedReport = {
        id: Date.now(),

        assessment_id:
          result.id || null,

        email:
          user.email || "",

        name:
          user.name ||
          user.full_name ||
          "User",

        dermatologist_name:
          selectedDermatologist,

        report: result,

        status: "Shared",

        shared_at:
          new Date().toISOString()
      };

      const existingReports =
        JSON.parse(
          localStorage.getItem(
            "skinai_shared_reports"
          ) || "[]"
        );

      existingReports.push(
        sharedReport
      );

      localStorage.setItem(
        "skinai_shared_reports",
        JSON.stringify(
          existingReports
        )
      );

      setShareMessage(
        `Report shared successfully with ${selectedDermatologist}.`
      );
    } catch (error) {
      console.error(
        "Share report error:",
        error
      );

      setShareMessage(
        "Unable to save shared report."
      );
    }
  };

  const reportRecommendationIssue =
    async () => {
      if (!issueType) {
        setIssueMessage(
          "Please select an issue type."
        );
        return;
      }

      if (!issueDescription.trim()) {
        setIssueMessage(
          "Please describe the issue."
        );
        return;
      }

      if (!user.email) {
        setIssueMessage(
          "User email not found. Please login again."
        );
        return;
      }

      setIssueLoading(true);
      setIssueMessage("");

      try {
        const response =
          await fetch(
            `${API}/recommendation-issues`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                email:
                  user.email,

                issue_type:
                  issueType,

                description:
                  issueDescription.trim()
              })
            }
          );

        const data =
          await response.json().catch(
            () => ({})
          );

        if (
          response.ok &&
          data.success
        ) {
          setIssueMessage(
            "Recommendation issue reported successfully."
          );

          setIssueType("");
          setIssueDescription("");
        } else {
          setIssueMessage(
            data.message ||
              "Unable to report recommendation issue."
          );
        }
      } catch (error) {
        console.error(
          "Recommendation issue error:",
          error
        );

        setIssueMessage(
          "Backend is not connected. Please try again."
        );
      } finally {
        setIssueLoading(false);
      }
    };

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );
  };

  const getScoreLabel = (score) => {
    if (score >= 80) {
      return "Good";
    }

    if (score >= 60) {
      return "Moderate";
    }

    return "Needs Attention";
  };

  const cardStyle = {
    background: "#ffffff",
    border:
      "1px solid #dcefe8",
    borderRadius: "14px",
    padding: "22px",
    marginBottom: "20px",
    boxShadow:
      "0 3px 12px rgba(35,111,90,0.06)"
  };

  const sectionTitleStyle = {
    color: "#236f5a",
    marginTop: 0,
    marginBottom: "15px"
  };

  const buttonStyle = {
    padding: "11px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#236f5a",
    color: "#ffffff",
    fontWeight: "600",
    cursor: "pointer",
    marginRight: "10px",
    marginBottom: "10px"
  };

  // PART 2
  if (result) {
    return (
      <div className="dashboard-page">

        <nav className="dashboard-navbar">
          <div className="logo">
            ✦ SkinAI
          </div>

          <div className="dashboard-actions">
            <div className="dashboard-welcome">
              Welcome,{" "}
              {user.name ||
                user.full_name ||
                "User"}
            </div>

            <button
              className="logout-btn"
              type="button"
              onClick={() => {
                localStorage.removeItem(
                  "skinai_user"
                );

                localStorage.removeItem(
                  "user"
                );

                window.location.href = "/";
              }}
            >
              Logout
            </button>
          </div>
        </nav>

        <main className="dashboard-content">

          <button
            type="button"
            onClick={() => {
              setResult(null);
              setShareMessage("");
              setIssueMessage("");
            }}
            style={buttonStyle}
          >
            ← Back to Assessment
          </button>

          <p className="tagline">
            AI-POWERED SKINCARE
          </p>

          <h1>
            Personalized Skin Assessment
          </h1>

          <p className="dashboard-description">
            Your personalized AI skin assessment
            based on your skin profile, concerns
            and lifestyle.
          </p>

          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>
              Assessment Summary
            </h2>

            <p>
              <strong>Name:</strong>{" "}
              {result.name || "User"}
            </p>

            <p>
              <strong>Email:</strong>{" "}
              {result.email || "—"}
            </p>

            <p>
              <strong>Age:</strong>{" "}
              {result.age || "—"}
            </p>

            <p>
              <strong>Assessment Date:</strong>{" "}
              {formatDate(
                result.created_at
              )}
            </p>

            <p>
              <strong>Assessment ID:</strong>{" "}
              {result.id ||
                "Local Assessment"}
            </p>
          </div>

          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>
              Skin Health Score
            </h2>

            <div
              style={{
                fontSize: "48px",
                fontWeight: "700",
                color: "#236f5a",
                marginBottom: "5px"
              }}
            >
              {result.score || 0}%
            </div>

            <p>
              {getScoreLabel(
                Number(result.score || 0)
              )}
            </p>
          </div>

          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>
              Score Breakdown
            </h2>

            <p>
              <strong>Skin Type:</strong>{" "}
              {result.skin_type || "—"}
            </p>

            <p>
              <strong>Skin Concerns:</strong>{" "}
              {result.concerns &&
              result.concerns.length > 0
                ? result.concerns.join(", ")
                : "—"}
            </p>

            <p>
              <strong>Sensitivity:</strong>{" "}
              {result.sensitivity || "—"}
            </p>

            <p>
              <strong>Water Intake:</strong>{" "}
              {result.lifestyle?.water || 0}{" "}
              glasses/day
            </p>

            <p>
              <strong>Sleep:</strong>{" "}
              {result.lifestyle?.sleep || 0}{" "}
              hours/day
            </p>

            <p>
              <strong>Exercise:</strong>{" "}
              {result.lifestyle?.exercise ||
                "—"}
            </p>
          </div>

          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>
              AI Skin Assessment
            </h2>

            <p>
              <strong>Summary:</strong>{" "}
              {result.skin_assessment?.summary ||
                "Assessment generated based on your profile."}
            </p>

            <p>
              <strong>
                Skin Type Analysis:
              </strong>{" "}
              {result.skin_assessment
                ?.skin_type_analysis ||
                "—"}
            </p>

            <p>
              <strong>
                Concern Analysis:
              </strong>{" "}
              {result.skin_assessment
                ?.concern_analysis ||
                "—"}
            </p>

            <p>
              <strong>
                Sensitivity Analysis:
              </strong>{" "}
              {result.skin_assessment
                ?.sensitivity_analysis ||
                "—"}
            </p>
          </div>

          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>
              Skin Concerns
            </h2>

            {result.concerns &&
            result.concerns.length > 0 ? (
              <ul>
                {result.concerns.map(
                  (concern, index) => (
                    <li key={index}>
                      {concern}
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p>
                No specific concern selected.
              </p>
            )}
          </div>

          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>
              Concern Priority
            </h2>

            <p>
              <strong>
                Primary Concern:
              </strong>{" "}
              {result.priority ||
                "General Skin Health"}
            </p>
          </div>

          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>
              Risk & Contributing Factors
            </h2>

            {result.risk_factors &&
            result.risk_factors.length > 0 ? (
              <ul>
                {result.risk_factors.map(
                  (factor, index) => (
                    <li key={index}>
                      {factor}
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p>
                No major lifestyle risk factors
                identified from the provided data.
              </p>
            )}
          </div>

          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>
              Treatment Planning Module
            </h2>

            <h3>
              Recommended Approach
            </h3>

            <p>
              Follow a consistent skincare
              routine according to your skin
              type and identified concerns.
            </p>

            <h3>
              Morning Routine
            </h3>

            {result.treatment_plan?.morning &&
            result.treatment_plan.morning.length >
              0 ? (
              <ul>
                {result.treatment_plan.morning.map(
                  (item, index) => (
                    <li key={index}>
                      {item}
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p>
                Morning routine information is
                not available.
              </p>
            )}

            <h3>
              Evening Routine
            </h3>

            {result.treatment_plan?.evening &&
            result.treatment_plan.evening.length >
              0 ? (
              <ul>
                {result.treatment_plan.evening.map(
                  (item, index) => (
                    <li key={index}>
                      {item}
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p>
                Evening routine information is
                not available.
              </p>
            )}
          </div>

          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>
              Seasonal Skincare Recommendation
            </h2>

            <p>
              {result.seasonal_advice ||
                "Maintain a consistent skincare routine throughout the year."}
            </p>

            <p>
              <strong>
                Current Season:
              </strong>{" "}
              {result.season ||
                "Not provided"}
            </p>
          </div>

          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>
              7-Day Skincare Plan
            </h2>

            {result.weekly_plan &&
            result.weekly_plan.length > 0 ? (
              <ol>
                {result.weekly_plan.map(
                  (item, index) => (
                    <li
                      key={index}
                      style={{
                        marginBottom: "8px"
                      }}
                    >
                      {item}
                    </li>
                  )
                )}
              </ol>
            ) : (
              <p>
                Weekly skincare plan is not
                available.
              </p>
            )}
          </div>

          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>
              Adaptive Skincare Recommendation
            </h2>

            <p>
              {result.adaptive_recommendation ||
                "Follow a personalized routine and monitor your skin response regularly."}
            </p>
          </div>

          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>
              Lifestyle Summary
            </h2>

            <p>
              <strong>
                Water Intake:
              </strong>{" "}
              {result.lifestyle_summary?.water ||
                "Not provided"}
            </p>

            <p>
              <strong>
                Sleep:
              </strong>{" "}
              {result.lifestyle_summary?.sleep ||
                "Not provided"}
            </p>

            <p>
              <strong>
                Exercise:
              </strong>{" "}
              {result.lifestyle_summary?.exercise ||
                "Not provided"}
            </p>
          </div>

          {/* PART 3 */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>
              Dermatologist Support
            </h2>

            <p>
              You can securely share your
              assessment report with a dermatologist
              for professional review.
            </p>

            <select
              value={selectedDermatologist}
              onChange={(event) =>
                setSelectedDermatologist(
                  event.target.value
                )
              }
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #cfe4dc",
                borderRadius: "8px",
                marginBottom: "15px",
                fontSize: "15px"
              }}
            >
              <option value="">
                Select Dermatologist
              </option>

              <option value="Dr. Priya Sharma">
                Dr. Priya Sharma
              </option>

              <option value="Dr. Rahul Deshmukh">
                Dr. Rahul Deshmukh
              </option>

              <option value="Dr. Sneha Patil">
                Dr. Sneha Patil
              </option>
            </select>

            <button
              type="button"
              style={buttonStyle}
              onClick={shareReport}
            >
              Share Full Report
            </button>

            {shareMessage && (
              <p
                style={{
                  color: "#236f5a",
                  fontWeight: "600",
                  marginTop: "10px"
                }}
              >
                {shareMessage}
              </p>
            )}
          </div>

          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>
              Report a Recommendation Issue
            </h2>

            <p>
              If you think an AI recommendation
              does not match your skin profile,
              you can report it for review.
            </p>

            <select
              value={issueType}
              onChange={(event) =>
                setIssueType(event.target.value)
              }
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #cfe4dc",
                borderRadius: "8px",
                marginBottom: "12px",
                fontSize: "15px"
              }}
            >
              <option value="">
                Select Issue Type
              </option>

              <option value="Wrong Product">
                Wrong Product Recommendation
              </option>

              <option value="Wrong Skin Type">
                Wrong Skin Type Recommendation
              </option>

              <option value="Wrong Concern">
                Wrong Concern Recommendation
              </option>

              <option value="Sensitivity Concern">
                Sensitivity / Allergy Concern
              </option>

              <option value="Other">
                Other
              </option>
            </select>

            <textarea
              value={issueDescription}
              onChange={(event) =>
                setIssueDescription(
                  event.target.value
                )
              }
              placeholder="Describe why the recommendation seems incorrect..."
              rows="5"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px",
                border: "1px solid #cfe4dc",
                borderRadius: "8px",
                resize: "vertical",
                fontSize: "15px",
                marginBottom: "12px"
              }}
            />

            <button
              type="button"
              style={{
                ...buttonStyle,
                opacity: issueLoading ? 0.7 : 1
              }}
              onClick={reportRecommendationIssue}
              disabled={issueLoading}
            >
              {issueLoading
                ? "Reporting..."
                : "Report Issue"}
            </button>

            {issueMessage && (
              <p
                style={{
                  marginTop: "10px",
                  fontWeight: "600",
                  color:
                    issueMessage.includes(
                      "successfully"
                    )
                      ? "#236f5a"
                      : "#b42318"
                }}
              >
                {issueMessage}
              </p>
            )}
          </div>

          <div
            style={{
              ...cardStyle,
              background: "#f3faf7",
              border: "1px solid #cce7dd"
            }}
          >
            <h2 style={sectionTitleStyle}>
              Important Note
            </h2>

            <p>
              SkinAI provides AI-based skincare
              guidance for informational purposes.
              It does not replace professional
              dermatological diagnosis or treatment.
            </p>

            <p>
              If you experience severe irritation,
              allergic reactions, persistent acne,
              sudden skin changes or other serious
              symptoms, consult a qualified
              dermatologist.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "30px"
            }}
          >
            <button
              type="button"
              style={buttonStyle}
              onClick={() => {
                setResult(null);
                setShareMessage("");
                setIssueMessage("");
              }}
            >
              Create New Assessment
            </button>

            <button
              type="button"
              style={{
                ...buttonStyle,
                background: "#ffffff",
                color: "#236f5a",
                border:
                  "1px solid #236f5a"
              }}
              onClick={() => {
                if (onBack) {
                  onBack();
                } else {
                  window.history.back();
                }
              }}
            >
              ← Dashboard
            </button>
          </div>

        </main>

        <footer
          style={{
            textAlign: "center",
            padding: "25px 15px",
            borderTop: "1px solid #dcefe8",
            color: "#66746f",
            marginTop: "20px"
          }}
        >
          <p style={{ margin: 0 }}>
            ✦ SkinAI — Your Skin. Your Intelligence.
          </p>

          <p
            style={{
              margin: "6px 0 0",
              fontSize: "13px"
            }}
          >
            AI-powered personalized skincare
            planner
          </p>
        </footer>
      </div>
    );
  }

  // PART 4
  return (
    <div className="dashboard-page">

      <nav className="dashboard-navbar">
        <div className="logo">
          ✦ SkinAI
        </div>

        <div className="dashboard-actions">
          <div className="dashboard-welcome">
            Welcome,{" "}
            {user.name ||
              user.full_name ||
              "User"}
          </div>

          <button
            className="logout-btn"
            type="button"
            onClick={() => {
              localStorage.removeItem(
                "skinai_user"
              );

              localStorage.removeItem(
                "user"
              );

              window.location.href = "/";
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="dashboard-content">

        <button
          type="button"
          onClick={() => {
            if (onBack) {
              onBack();
            } else {
              window.history.back();
            }
          }}
          style={buttonStyle}
        >
          ← Back to Dashboard
        </button>

        <p className="tagline">
          AI-POWERED SKINCARE
        </p>

        <h1>
          Personalized Skin Assessment
        </h1>

        <p className="dashboard-description">
          Enter your skin profile and lifestyle
          information to generate your
          personalized SkinAI assessment.
        </p>

        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>
            1. Basic Information
          </h2>

          <label>
            <strong>Age</strong>
          </label>

          <input
            type="number"
            min="1"
            max="100"
            value={age}
            onChange={(event) =>
              setAge(event.target.value)
            }
            placeholder="Enter your age"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginTop: "8px",
              marginBottom: "18px",
              border:
                "1px solid #cfe4dc",
              borderRadius: "8px",
              fontSize: "15px"
            }}
          />

          <label>
            <strong>Skin Type *</strong>
          </label>

          <select
            value={skinType}
            onChange={(event) =>
              setSkinType(event.target.value)
            }
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "8px",
              marginBottom: "18px",
              border:
                "1px solid #cfe4dc",
              borderRadius: "8px",
              fontSize: "15px"
            }}
          >
            <option value="">
              Select Skin Type
            </option>

            <option value="Normal">
              Normal
            </option>

            <option value="Dry">
              Dry
            </option>

            <option value="Oily">
              Oily
            </option>

            <option value="Combination">
              Combination
            </option>

            <option value="Sensitive">
              Sensitive
            </option>
          </select>

          <label>
            <strong>
              Skin Sensitivity
            </strong>
          </label>

          <select
            value={sensitivity}
            onChange={(event) =>
              setSensitivity(
                event.target.value
              )
            }
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "8px",
              border:
                "1px solid #cfe4dc",
              borderRadius: "8px",
              fontSize: "15px"
            }}
          >
            <option value="">
              Select Sensitivity
            </option>

            <option value="Low">
              Low
            </option>

            <option value="Medium">
              Medium
            </option>

            <option value="High">
              High
            </option>
          </select>
        </div>

        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>
            2. Skin Concerns *
          </h2>

          <p>
            Select all concerns that apply to
            you.
          </p>

          {[
            "Acne",
            "Pigmentation",
            "Dark Spots",
            "Dryness",
            "Oiliness",
            "Dullness",
            "Uneven Skin Tone"
          ].map((concern) => (
            <label
              key={concern}
              style={{
                display: "block",
                padding: "9px 0",
                cursor: "pointer"
              }}
            >
              <input
                type="checkbox"
                checked={concerns.includes(
                  concern
                )}
                onChange={() =>
                  handleConcernChange(
                    concern
                  )
                }
                style={{
                  marginRight: "10px"
                }}
              />

              {concern}
            </label>
          ))}
        </div>

        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>
            3. Lifestyle Information
          </h2>

          <label>
            <strong>
              Daily Water Intake
            </strong>
          </label>

          <input
            type="number"
            min="0"
            max="30"
            value={water}
            onChange={(event) =>
              setWater(event.target.value)
            }
            placeholder="Glasses per day"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginTop: "8px",
              marginBottom: "18px",
              border:
                "1px solid #cfe4dc",
              borderRadius: "8px",
              fontSize: "15px"
            }}
          />

          <label>
            <strong>
              Average Sleep
            </strong>
          </label>

          <input
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={sleep}
            onChange={(event) =>
              setSleep(event.target.value)
            }
            placeholder="Hours per day"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginTop: "8px",
              marginBottom: "18px",
              border:
                "1px solid #cfe4dc",
              borderRadius: "8px",
              fontSize: "15px"
            }}
          />

          <label>
            <strong>
              Exercise
            </strong>
          </label>

          <select
            value={exercise}
            onChange={(event) =>
              setExercise(event.target.value)
            }
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "8px",
              border:
                "1px solid #cfe4dc",
              borderRadius: "8px",
              fontSize: "15px"
            }}
          >
            <option value="">
              Select Exercise Pattern
            </option>

            <option value="Daily">
              Daily
            </option>

            <option value="3-5 Days a Week">
              3-5 Days a Week
            </option>

            <option value="1-2 Days a Week">
              1-2 Days a Week
            </option>

            <option value="No Regular Exercise">
              No Regular Exercise
            </option>
          </select>
        </div>

        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>
            4. Season
          </h2>

          <select
            value={season}
            onChange={(event) =>
              setSeason(event.target.value)
            }
            style={{
              width: "100%",
              padding: "12px",
              border:
                "1px solid #cfe4dc",
              borderRadius: "8px",
              fontSize: "15px"
            }}
          >
            <option value="">
              Select Current Season
            </option>

            <option value="Summer">
              Summer
            </option>

            <option value="Monsoon">
              Monsoon
            </option>

            <option value="Winter">
              Winter
            </option>
          </select>
        </div>

        <div
          style={{
            textAlign: "center",
            margin: "25px 0 40px"
          }}
        >
          <button
            type="button"
            style={{
              ...buttonStyle,
              padding:
                "14px 28px",
              fontSize: "16px",
              minWidth: "220px",
              opacity: loading ? 0.7 : 1
            }}
            onClick={generateAssessment}
            disabled={loading}
          >
            {loading
              ? "Generating Assessment..."
              : "Generate AI Assessment"}
          </button>
        </div>

        <div
          style={{
            ...cardStyle,
            background: "#f3faf7"
          }}
        >
          <h3
            style={{
              color: "#236f5a",
              marginTop: 0
            }}
          >
            ✦ SkinAI Intelligence
          </h3>

          <p>
            SkinAI analyzes your skin type,
            concerns, sensitivity and lifestyle
            information to generate a personalized
            skincare assessment and routine.
          </p>
        </div>

      </main>

      <footer
        style={{
          textAlign: "center",
          padding: "25px 15px",
          borderTop:
            "1px solid #dcefe8",
          color: "#66746f"
        }}
      >
        <p style={{ margin: 0 }}>
          ✦ SkinAI — Your Skin. Your Intelligence.
        </p>

        <p
          style={{
            margin: "6px 0 0",
            fontSize: "13px"
          }}
        >
          AI-powered personalized skincare planner
        </p>
      </footer>

    </div>
  );
}

export default Recommendations;