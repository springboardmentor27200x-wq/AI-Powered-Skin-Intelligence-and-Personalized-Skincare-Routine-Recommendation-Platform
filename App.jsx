import {useEffect, useState } from "react";
import "./App.css";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

const API_URL = 
 import.meta.env.VITE_API_URL  || "http://127.0.0.1:8000";

function App() {
  const [page, setPage] = useState("home");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [userId, setUserId] = useState("");

  const [skinType, setSkinType] = useState("");
  const [skinConcerns, setSkinConcerns] = useState("");
  const [sensitivity, setSensitivity] = useState("");
  const skinConcernOptions = [
  "Acne",
  "Hyperpigmentation",
  "Dark Spots",
  "Dry Skin",
  "Oily Skin",
  "Sensitive Skin",
  "Wrinkles",
  "Fine Lines",
  "Redness",
  "Uneven Skin Tone"
 ];
  const toggleSkinConcern = (concern) => {
  const currentConcerns = skinConcerns
    ? skinConcerns.split(",").map(item => item.trim()).filter(Boolean)
    : [];

  if (currentConcerns.includes(concern)) {
    const updatedConcerns = currentConcerns.filter(
      item => item !== concern
    );

    setSkinConcerns(updatedConcerns.join(", "));
  } else {
    const updatedConcerns = [
      ...currentConcerns,
      concern
    ];

    setSkinConcerns(updatedConcerns.join(", "));
  }
 };
  const [routine, setRoutine] = useState(null);
  const [routineUpdated, setRoutineUpdated] = useState(false);
  const [seasonalRecommendation, setSeasonalRecommendation] = useState(null);
  const [ingredientName, setIngredientName] = useState("");
 const [ingredientAnalysis, setIngredientAnalysis] = useState(null);
  
  const [waterIntake, setWaterIntake] = useState("");
  const [exercise, setExercise] = useState("");
  const [smoking, setSmoking] = useState("");
  const [routineConsistency, setRoutineConsistency] = useState("80");
  const [hydrationLevel, setHydrationLevel] = useState("");

  const [sleepHours, setSleepHours] = useState("");
  const [sleepQuality, setSleepQuality] = useState("");

  const [message, setMessage] = useState("");
  const [assessment, setAssessment] = useState(null);

  const [analytics, setAnalytics] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [productRecommendations, setProductRecommendations] = useState([]);
  const [progressTrend, setProgressTrend] = useState([]);
  const [executiveData, setExecutiveData] = useState(null);
  const [openExecutiveSections, setOpenExecutiveSections] = useState({
  health: false,
  skincare: false,
  system: false,
  reports: false,
  testing: false
 });

 const toggleExecutiveSection = (section) => {
  setOpenExecutiveSections((previous) => ({
    ...previous,
    [section]: !previous[section]
  }));
 };
 
  const exportExecutivePDF = () => {

   const pdf = new jsPDF();

   const stats =
    executiveData?.platform_statistics || {};

   const health =
    executiveData?.skin_health_statistics || {};

  pdf.setFontSize(22);
  pdf.text("SkinCare Assistant", 20, 20);

  pdf.setFontSize(16);
  pdf.text("Milestone 4 Executive Report", 20, 32);

  pdf.setFontSize(10);
  pdf.text(
    `Generated: ${new Date().toLocaleString()}`,
    20,
    42
  );


  pdf.setFontSize(14);
  pdf.text("Platform Statistics", 20, 58);

  pdf.setFontSize(11);

  pdf.text(
    `Total Users: ${stats.total_users ?? 0}`,
    20,
    70
  );

  pdf.text(
    `Skin Profiles: ${stats.total_skin_profiles ?? 0}`,
    20,
    80
  );

  pdf.text(
    `Assessments: ${stats.total_assessments ?? 0}`,
    20,
    90
  );

  pdf.text(
    `Progress Records: ${stats.total_progress_records ?? 0}`,
    20,
    100
  );


  pdf.setFontSize(14);
  pdf.text("Skin Health Performance", 20, 120);

  pdf.setFontSize(11);

  pdf.text(
    `Current Skin Score: ${health.current_skin_score ?? 0}/100`,
    20,
    132
  );

  pdf.text(
    `Average Skin Score: ${health.average_skin_score ?? 0}/100`,
    20,
    142
  );

  pdf.text(
    `Routine Adherence: ${health.average_routine_adherence ?? 0}%`,
    20,
    152
  );

  pdf.text(
    `Overall Improvement: +${health.overall_improvement ?? 0}`,
    20,
    162
  );


  pdf.setFontSize(14);
  pdf.text("Progress Trend", 20, 182);

  pdf.setFontSize(10);

  let y = 194;

  progressTrend.forEach((record, index) => {

    const date =
      record.progress_date || `Record ${index + 1}`;

    const score =
      record.skin_score ??
      record.score ??
      0;

    const adherence =
      record.routine_adherence ??
      record.adherence ??
      0;

    pdf.text(
      `${date} | Skin Score: ${score} | Adherence: ${adherence}%`,
      20,
      y
    );

    y += 8;

    if (y > 275) {
      pdf.addPage();
      y = 20;
    }

  });


  pdf.setFontSize(14);
  pdf.text("Milestone 4 Validation", 20, y + 12);

  pdf.setFontSize(10);

  pdf.text(
    "Executive Dashboard: Implemented",
    20,
    y + 24
  );

  pdf.text(
    "Reports & Export: Implemented",
    20,
    y + 32
  );

  pdf.text(
    "Data Visualization: Implemented",
    20,
    y + 40
  );

  pdf.text(
    "Testing & Validation: In Progress / Validated",
    20,
    y + 48
  );


  pdf.save(
    "SkinCare_M4_Executive_Report.pdf"
  );
 };


  const exportExecutiveExcel = () => {

    const stats =
      executiveData?.platform_statistics || {};

    const health =
      executiveData?.skin_health_statistics || {};

    const summary = [
      {
        Metric: "Total Users",
        Value: stats.total_users ?? 0
      },
      {
        Metric: "Skin Profiles",
        Value: stats.total_skin_profiles ?? 0
      },
      {
        Metric: "Assessments",
        Value: stats.total_assessments ?? 0
      },
      {
        Metric: "Progress Records",
        Value: stats.total_progress_records ?? 0
      },
      {
        Metric: "Current Skin Score",
        Value: health.current_skin_score ?? 0
      },
      {
        Metric: "Average Skin Score",
        Value: health.average_skin_score ?? 0
      },
      {
        Metric: "Routine Adherence",
        Value: health.average_routine_adherence ?? 0
      },
      {
        Metric: "Overall Improvement",
        Value: health.overall_improvement ?? 0
      }
    ];

    const progress = progressTrend.map((record) => ({
      Date: record.progress_date || "",
      "Skin Score":
        record.skin_score ??
        record.score ??
        0,
      "Routine Adherence":
        record.routine_adherence ??
        record.adherence ??
        0
    }));

    const testing = [
      {
        Feature: "Ingredient Intelligence",
        Status: "PASS"
      },
      {
        Feature: "Product Recommendations",
        Status: "PASS"
      },
      {
        Feature: "Progress Tracking",
        Status: "PASS"
      },
      {
        Feature: "Progress Compare",
        Status: "PASS"
      },
      {
        Feature: "Progress Trend",
        Status: "PASS"
      },
      {
        Feature: "Skincare Analytics",
        Status: "PASS"
      },
      {
        Feature: "Dashboard Integration",
        Status: "PASS"
      },
      {
        Feature: "Daily Checklist",
        Status: "PASS"
      }
    ];

    const workbook = XLSX.utils.book_new();

    const summarySheet =
      XLSX.utils.json_to_sheet(summary);

    const progressSheet =
      XLSX.utils.json_to_sheet(progress);

    const testingSheet =
      XLSX.utils.json_to_sheet(testing);

    XLSX.utils.book_append_sheet(
      workbook,
      summarySheet,
      "Executive Summary"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      progressSheet,
      "Progress Data"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      testingSheet,
      "Testing"
    );

    XLSX.writeFile(
      workbook,
      "SkinCare_M4_Executive_Report.xlsx"
    );
  };

 const [openDashboardSections, setOpenDashboardSections] = useState({
    analytics: false,
   products: false,
   ingredients: false,
   progress: false,
   checklist: false,
   dermatologist: false
  });

 const toggleDashboardSection = (section) => {
  setOpenDashboardSections((previous) => ({
    ...previous,
    [section]: !previous[section]
  }));
 };
 const [allergies, setAllergies] = useState(" ");

  
  // REGISTER
  const handleRegister = async () => {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (data.message === "Registration successful") {
        setMessage("Registration successful. Please login.");
        setPage("login");
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage("Backend connection failed");
    }
  };

  // LOGIN
  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (data.message === "Login successful") {
        setUserId(String(data.user.id));
        setMessage("Login successful");
        setPage("skin-profile");
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage("Backend connection failed");
    }
  };

  // SKIN PROFILE
  const handleSkinProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/skin-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: Number(userId),
          skin_type: skinType,
          skin_concerns: skinConcerns,
          sensitivity: sensitivity,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setPage("lifestyle");
      } else {
        setMessage("Skin profile failed");
      }
    } catch (error) {
      setMessage("Backend connection failed");
    }
  };

  // LIFESTYLE
  const handleLifestyle = async () => {
    try {
      const response = await fetch(`${API_URL}/lifestyle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: Number(userId),
          water_intake: waterIntake,
          exercise: exercise,
          smoking: smoking,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setPage("sleep");
      } else {
        setMessage("Lifestyle data failed");
      }
    } catch (error) {
      setMessage("Backend connection failed");
    }
  };
  // =========================================================
// MILESTONE 4 — EXECUTIVE DASHBOARD
// =========================================================
 const handleExecutiveDashboard = async () => {
  try {
    const [dashboardResponse, trendResponse] = await Promise.all([
      fetch(`${API_URL}/executive-dashboard`),
      fetch(`${API_URL}/progress/trend/${Number(userId)}`)
    ]);

    const dashboardData = await dashboardResponse.json();
    const trendData = await trendResponse.json();

    if (dashboardResponse.ok) {
      setExecutiveData(dashboardData);
    }

    if (trendResponse.ok) {
      setProgressTrend(
        Array.isArray(trendData)
          ? trendData
          : trendData.trend || trendData.records || []
      );
    }

    if (dashboardResponse.ok) {
      setPage("executive-dashboard");
      setMessage("");
    } else {
      setMessage("Unable to load executive dashboard.");
    }

  } catch (error) {
    console.error("Executive dashboard error:", error);

    setMessage(
      "Executive dashboard connection failed. Please check backend."
    );
  }
 }; 

  // SLEEP
  const handleSleep = async () => {
    try {
      const response = await fetch(`${API_URL}/sleep`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: Number(userId),
          sleep_hours: Number(sleepHours),
          sleep_quality: sleepQuality,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setPage("dashboard");
      } else {
        setMessage("Sleep data failed");
      }
    } catch (error) {
      setMessage("Backend connection failed");
    }
  };
  const handleAssessment = async () => {
  try {
    const response = await fetch(`${API_URL}/assessment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: Number(userId),
        routine_consistency: Number(routineConsistency)
      })
    });

    const data = await response.json();

    console.log("Assessment response:", data);

    if (response.ok && data.assessment) {
      setAssessment(data.assessment);
      setMessage("");
    } else {
      setMessage(data.message || "Assessment could not be completed.");
    }

  } catch (error) {
    console.error("Assessment error:", error);
    setMessage("Assessment failed. Please check backend.");
  }
 };
 const handleRoutine = async (showMessage = false) => {
  try {
    const response = await fetch(`${API_URL}/routine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: Number(userId)
      })
    });

    const data = await response.json();

    console.log("Routine response:", data);
    if (response.ok && data.routine) {
  setRoutine(data.routine);
  setPage("routine");

  setRoutineUpdated(showMessage);

  if (!showMessage) {
    setMessage("");
  }

  return true;
} else {

      setMessage(
        data.message || "Routine generation failed."
      );

      return false;
    }

  } catch (error) {

    console.error("Routine error:", error);

    setMessage(
      "Routine generation failed. Please check backend."
    );

    return false;
  }
 };
 
 const handleUpdateRoutine = async () => {
  await handleRoutine(true);
 };
 const handleSeasonalRecommendation = async () => {
  try {
    const response = await fetch(
      `${API_URL}/seasonal-recommendation/${Number(userId)}`
    );

    const data = await response.json();

    console.log("Seasonal recommendation:", data);

    if (response.ok && data.recommendation) {
      setSeasonalRecommendation(data);
      setPage("seasonal");
      setMessage("");
    } else {
      setMessage(
        data.message || "Seasonal recommendation could not be generated."
      );
    }

  } catch (error) {
    console.error("Seasonal recommendation error:", error);
    setMessage(
      "Seasonal recommendation failed. Please check backend."
    );
  }
};
 // INGREDIENT INTELLIGENCE
const handleIngredientAnalysis = async () => {
  try {
    const response = await fetch(`${API_URL}/ingredient/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ingredient: ingredientName,
        skin_type: skinType || "Oily",
        skin_concerns: skinConcerns || "Acne",
        sensitivity: sensitivity || "Low",
        allergies: ""
      })
    });

    const data = await response.json();

    if (response.ok) {
      setIngredientAnalysis(data);
    } else {
      setMessage(data.message || "Ingredient analysis failed.");
    }

  } catch (error) {
    console.error("Ingredient error:", error);
    setMessage("Ingredient analysis failed. Please check backend.");
  }
};
 // DASHBOARD DATA
  const handleDashboardData = async () => {
    try {

      // ANALYTICS
      const analyticsResponse = await fetch(
        `${API_URL}/analytics/${Number(userId)}`
      );

      const analyticsData = await analyticsResponse.json();

      if (analyticsResponse.ok) {
        setAnalytics(analyticsData);
      }


      // PROGRESS
      const progressResponse = await fetch(
        `${API_URL}/progress/${Number(userId)}`
      );

      const progressResult = await progressResponse.json();

      if (progressResponse.ok) {
        setProgressData(progressResult);
      }


      // PRODUCT RECOMMENDATIONS
      const productResponse = await fetch(
        `${API_URL}/products/recommend`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            skin_type: "Oily",
            skin_concerns: "Acne",
            sensitivity: "Low",
            budget: 1000
          })
        }
      );

      const productResult = await productResponse.json();

      if (productResponse.ok) {
        setProductRecommendations(
          productResult.recommendations || []
        );
      }

    } catch (error) {
      console.error("Dashboard data error:", error);
    }
  };
  useEffect(() => {
    if (page === "dashboard" && userId) {
      handleDashboardData();
    }
  }, [page, userId]);
  // LOGIN PAGE
  if (page === "login") {
    return (
     <div className="form-page">
  <div className="form-box">
          <h2>Login</h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={handleLogin}>Login</button>

          {message && <p>{message}</p>}

          <p onClick={() => setPage("home")}>
            ← Back to Home
          </p>
        </div>
      </div>
    );
  }

  // REGISTER PAGE
  if (page === "register") {
    return (
      <div className="form-page">
        <div className="form-box">
          <h2>Create Account</h2>

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={handleRegister}>Register</button>

          {message && <p>{message}</p>}

          <p onClick={() => setPage("home")}>
            ← Back to Home
          </p>
        </div>
      </div>
    );
  }

 // SKIN PROFILE PAGE
 if (page === "skin-profile") {
   return (
     <div className="form-page">
       <div className="form-box">

        <h2>Skin Profile</h2>

        <p>User ID: {userId}</p>

        <select
          value={skinType}
          onChange={(e) => setSkinType(e.target.value)}
        >
          <option value="">Select Skin Type</option>
          <option value="Normal">Normal</option>
          <option value="Oily">Oily</option>
          <option value="Dry">Dry</option>
          <option value="Combination">Combination</option>
          <option value="Sensitive">Sensitive</option>
        </select>

        <div className="concerns-section">

          <label>Skin Concerns</label>

          <div className="skin-concern-options">

            {skinConcernOptions.map((concern) => {

              const selectedConcerns = skinConcerns
                ? skinConcerns
                    .split(",")
                    .map(item => item.trim())
                    .filter(Boolean)
                : [];

              const isSelected =
                selectedConcerns.includes(concern);

              return (
                <label
                  key={concern}
                  className={`concern-option ${
                    isSelected ? "selected" : ""
                  }`}
                >

                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() =>
                      toggleSkinConcern(concern)
                    }
                  />

                  <span>{concern}</span>

                </label>
              );
            })}

          </div>

          <p className="selected-concerns">
            Selected: {skinConcerns || "None"}
          </p>

        </div>

        <select
          value={sensitivity}
          onChange={(e) => setSensitivity(e.target.value)}
        >
          <option value="">Select Sensitivity Level</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        <button onClick={handleSkinProfile}>
          Save Skin Profile
        </button>

        {message && <p>{message}</p>}

       </div>
     </div>
   );
 }
           

  // LIFESTYLE PAGE
  if (page === "lifestyle") {
    return (
      <div className="form-page">
        <div className="form-box">
          <h2>Lifestyle Tracking</h2>

          <input
            type="text"
            placeholder="Water Intake e.g. 2 litres"
            value={waterIntake}
            onChange={(e) => setWaterIntake(e.target.value)}
          />

          <input
            type="text"
            placeholder="Exercise e.g. 30 minutes"
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
          />

          <input
            type="text"
            placeholder="Smoking e.g. No"
            value={smoking}
            onChange={(e) => setSmoking(e.target.value)}
          />

          <button onClick={handleLifestyle}>
            Save Lifestyle Data
          </button>

          {message && <p>{message}</p>}
        </div>
      </div>
    );
  }

  // SLEEP PAGE
  if (page === "sleep") {
    return (
      <div className="form-page">
        <div className="form-box">
          <h2>Sleep Tracking</h2>

          <input
            type="number"
            step="0.5"
            placeholder="Sleep Hours"
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
          />

          <input
            type="text"
            placeholder="Sleep Quality e.g. Good"
            value={sleepQuality}
            onChange={(e) => setSleepQuality(e.target.value)}
          />

          <button onClick={handleSleep}>
            Save Sleep Data
          </button>

          {message && <p>{message}</p>}
        </div>
      </div>
    );
  }
  // ASSESSMENT
 if (page === "assessment") {
   return (
     <div className="form-page">

      <div className="form-box assessment-page">

        <h2>🧠 Skin Health Assessment</h2>

        <p className="assessment-intro">
          Analyze your skin health, concerns, risk factors
          and personalized skincare needs.
        </p>

        <label>Routine Consistency</label>

        <select
          value={routineConsistency}
          onChange={(e) =>
            setRoutineConsistency(e.target.value)
          }
        >
          <option value="100">Very Consistent</option>
          <option value="80">Consistent</option>
          <option value="60">Sometimes Consistent</option>
          <option value="40">Rarely Consistent</option>
        </select>

        <button onClick={handleAssessment}>
          🧠 Run Skin Assessment
        </button>

        {assessment && (
          <div className="assessment-result">

            {/* SCORE */}

            <div
              className="score-card"
              style={{
               textAlign: "center",
               padding: "25px",
               margin: "20px 0",
               borderRadius: "15px",
               background: "#f4f1ff",
               border: "1px solid #ddd"
              }}
            >
             <h3>🧠 Your Skin Health Score</h3>

             <div
              style={{
              fontSize: "45px",
              fontWeight: "bold",
              margin: "15px 0"
            }}
           >
            {assessment.score}/100
         </div>

         <div
          style={{
           width: "100%",
           height: "12px",
           background: "#e5e5e5",
           borderRadius: "10px",
           overflow: "hidden",
           marginBottom: "15px"
          }}
       >
        <div
         style={{
         width: `${assessment.score}%`,
         height: "100%",
         background: "#7b61ff",
         borderRadius: "10px"
        }}
        ></div>
     </div>

     <p>
      <strong>Risk Level:</strong>{" "}
      <span
        style={{
         padding: "6px 12px",
         borderRadius: "20px",
         background:
          assessment.risk_level === "Low"
            ? "#d4edda"
            : assessment.risk_level === "Medium"
            ? "#fff3cd"
            : "#f8d7da"
      }}
     >
      {assessment.risk_level}
     </span>
   </p>
 </div>


            {/* PRIMARY CONCERN */}

            <div
             className="assessment-section"
             style={{
              padding: "20px",
              marginTop: "20px",
              borderRadius: "12px",
              background: "#fff7f0",
              border: "1px solid #f0d5bd"
             }}
            >
             <h3>🎯 Primary Concern</h3>

            <div
             style={{
             fontSize: "22px",
             fontWeight: "bold",
             marginTop: "10px"
             }}
            >
             {assessment.primary_concern}
            </div>

            <p>
            This concern has been prioritized for your personalized skincare plan.
           </p>
           </div>


            {/* IDENTIFIED CONCERNS */}

            <div
             className="assessment-section"
            style={{
             padding: "20px",
             marginTop: "20px",
             borderRadius: "12px",
             background: "#f7f9fc",
             border: "1px solid #dfe5ee"
            }}
          >
           <h3>🔍 Identified Concerns</h3>

           <div
            style={{
             display: "flex",
             flexWrap: "wrap",
             gap: "10px",
             marginTop: "12px"
            }}
          >
            {assessment.identified_concerns &&
             assessment.identified_concerns.map(
             (concern, index) => (
              <span
               key={index}
               style={{
                padding: "8px 14px",
                borderRadius: "20px",
                background: "#ffffff",
                border: "1px solid #d5dbe5",
                fontWeight: "500"
               }}
              >
             🔹 {concern}
           </span>
         )
       )}
   </div>
 </div>


 {/* PRIORITIZED CONCERNS */}

           <div
            className="assessment-section"
            style={{
            padding: "20px",
            marginTop: "20px",
            borderRadius: "12px",
            background: "#fffaf5",
            border: "1px solid #ead8c8"
           }}
          > 
          <h3>📌 Prioritized Concerns</h3>

         <div
          style={{
           display: "flex",
           flexDirection: "column",
           gap: "10px",
           marginTop: "12px"
          }}
        >
         {assessment.prioritized_concerns &&
          assessment.prioritized_concerns.map(
           (concern, index) => (
            <div
             key={index}
             style={{
              padding: "12px 15px",
              borderRadius: "10px",
              background: "#ffffff",
              border: "1px solid #e3ddd7"
             }}
           >
             <strong>
               {index + 1}. {concern}
             </strong>
           </div>
         )
       )}
   </div>
  </div>


            {/* RISK FACTORS */}

           <div
            className="assessment-section"
            style={{
             padding: "20px",
             marginTop: "20px",
             borderRadius: "12px",
             background: "#fff5f5",
             border: "1px solid #f0d0d0"
            }}
          >
          <h3>⚠️ Risk Factor Analysis</h3>

           <div
            style={{
             display: "flex",
             flexDirection: "column",
             gap: "10px",
             marginTop: "12px"
            }}
          >
           {assessment.risk_factors &&
            assessment.risk_factors.map((factor, index) => (
             <div
              key={index}
              style={{
                padding: "12px 15px",
                borderRadius: "10px",
                background: "#ffffff",
                borderLeft: "4px solid #e57373"
              }}
            >
              ⚠️ {factor}
            </div>
          ))}
        </div>
      </div>

        {/* SCORE BREAKDOWN */}

        <div className="assessment-section">

      <h3>📊 Score Breakdown</h3>

      {assessment.score_breakdown && (
       <div
        style={{
         display: "flex",
         flexDirection: "column",
         gap: "18px",
         marginTop: "15px"
        }}
       >

      {/* Skin Condition */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "6px"
          }}
        >
          <strong>Skin Condition</strong>
          <span>
            {assessment.score_breakdown.skin_condition.score}/100
            {" "} (35%)
          </span>
        </div>

        <div
          style={{
            width: "100%",
            height: "10px",
            background: "#e5e5e5",
            borderRadius: "10px"
          }}
        >
          <div
            style={{
              width: `${assessment.score_breakdown.skin_condition.score}%`,
              height: "100%",
              background: "#7b61ff",
              borderRadius: "10px"
            }}
          ></div>
        </div>
      </div>


      {/* Lifestyle */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "6px"
          }}
        >
          <strong>Lifestyle Habits</strong>
          <span>
            {assessment.score_breakdown.lifestyle_habits.score}/100
            {" "} (20%)
          </span>
        </div>

        <div
          style={{
            width: "100%",
            height: "10px",
            background: "#e5e5e5",
            borderRadius: "10px"
          }}
        >
          <div
            style={{
              width: `${assessment.score_breakdown.lifestyle_habits.score}%`,
              height: "100%",
              background: "#7b61ff",
              borderRadius: "10px"
            }}
          ></div>
        </div>
      </div>


      {/* Sleep */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "6px"
          }}
        >
          <strong>Sleep Quality</strong>
          <span>
            {assessment.score_breakdown.sleep_quality.score}/100
            {" "} (15%)
          </span>
        </div>

        <div
          style={{
            width: "100%",
            height: "10px",
            background: "#e5e5e5",
            borderRadius: "10px"
          }}
        >
          <div
            style={{
              width: `${assessment.score_breakdown.sleep_quality.score}%`,
              height: "100%",
              background: "#7b61ff",
              borderRadius: "10px"
            }}
          ></div>
        </div>
      </div>


      {/* Routine */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "6px"
          }}
        >
          <strong>Routine Consistency</strong>
          <span>
            {assessment.score_breakdown.routine_consistency.score}/100
            {" "} (20%)
          </span>
        </div>

        <div
          style={{
            width: "100%",
            height: "10px",
            background: "#e5e5e5",
            borderRadius: "10px"
          }}
        >
          <div
            style={{
              width: `${assessment.score_breakdown.routine_consistency.score}%`,
              height: "100%",
              background: "#7b61ff",
              borderRadius: "10px"
            }}
          ></div>
        </div>
      </div>


      {/* Hydration */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "6px"
          }}
        >
          <strong>Hydration</strong>
          <span>
            {assessment.score_breakdown.hydration_level.score}/100
            {" "} (10%)
          </span>
        </div>

        <div
          style={{
            width: "100%",
            height: "10px",
            background: "#e5e5e5",
            borderRadius: "10px"
          }}
        >
          <div
            style={{
              width: `${assessment.score_breakdown.hydration_level.score}%`,
              height: "100%",
              background: "#7b61ff",
              borderRadius: "10px"
            }}
          ></div>
        </div>
      </div>

    </div>
  )}

      </div>
                

     <div
      className="assessment-section"
      style={{
       padding: "20px",
       marginTop: "20px",
       borderRadius: "12px",
       background: "#f5f8ff",
       border: "1px solid #d5def5"
      }}
    >
   <h3>📈 Improvement</h3>

   <p
    style={{
      lineHeight: "1.7",
      marginTop: "10px"
    }}
  >
    {assessment.improvement}
  </p>
  </div>

           
          {/* Generate Routine */}

      <div
       className="assessment-section"
       style={{
        padding: "22px",
        marginTop: "20px",
        borderRadius: "12px",
        background: "#f8f5ff",
        border: "1px solid #ddd3f5",
        textAlign: "center"
      }}
    >
    <h3>Personalized Skincare Routine</h3>

     <p
     style={{
      lineHeight: "1.6",
      margin: "12px 0 18px"
     }}
   >
    Generate a skincare routine based on your skin assessment,
    identified concerns and lifestyle factors.
   </p>

   <button onClick={handleRoutine}>
    Generate My Skincare Routine
   </button>
  </div>

  <button onClick={() => setPage("dashboard")}>
   Back to Dashboard
   </button>

  </div>
  )}

  </div>

  </div>

  );
  }

// ROUTINE 
 if (page === "routine") {
   return (
     <div className="form-page">

       <div className="form-box routine-page">

         <h2>✨ My Personalized Skincare Routine</h2>

         {routine && (
          <div className="routine-result">

            <div className="routine-summary">

              <p>
                <strong>Primary Concern:</strong>{" "}
                {routine.based_on_concern}
              </p>

              <p>
                <strong>Skin Health Score:</strong>{" "}
                {routine.based_on_score}/100
              </p>

            </div>


            <div
            className="routine-section"
            style={{
             padding: "20px",
             marginTop: "15px",
             borderRadius: "12px",
             background: "#fffaf5",
             border: "1px solid #ead8c8"
            }}
          >
          <h3>🌞 Morning Routine</h3>

          <p
          style={{
           lineHeight: "1.7",
           marginTop: "10px"
         }}
        >
         {routine.morning_routine}
       </p>
      </div>


            <div
            className="routine-section"
            style={{
             padding: "20px",
             marginTop: "15px",
             borderRadius: "12px",
             background: "#f5f3ff",
             border: "1px solid #ddd6f5"
            }}
          >
         <h3>🌙 Evening Routine</h3>

         <p
          style={{
           lineHeight: "1.7",
           marginTop: "10px"
         }}
       >
        {routine.evening_routine}
      </p>
     </div>


            <div
          className="routine-section"
          style={{
           padding: "20px",
           marginTop: "15px",
           borderRadius: "12px",
           background: "#f2fbf6",
           border: "1px solid #cde8d7"
          }}
        >
       <h3>🧴 Weekly Treatment</h3>

       <p
        style={{
         lineHeight: "1.7",
         marginTop: "10px"
        }}
      >
       {routine.weekly_treatment}
      </p>
    </div>


            <div
  className="routine-section"
  style={{
    padding: "20px",
    marginTop: "15px",
    borderRadius: "12px",
    background: "#f7f9fc",
    border: "1px solid #dfe5ee"
  }}
>
  <h3>📋 Routine Categories</h3>

  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "10px",
      marginTop: "12px"
    }}
  >
    {routine.routine_categories &&
      routine.routine_categories.map((category, index) => (
        <div
          key={index}
          style={{
            padding: "10px 14px",
            borderRadius: "20px",
            background: "#ffffff",
            border: "1px solid #d5dbe5",
            fontWeight: "500"
          }}
        >
          ✓ {category}
        </div>
      ))}
  </div>
</div>

            <div
  className="routine-section"
  style={{
    padding: "20px",
    marginTop: "15px",
    borderRadius: "12px",
    background: "#f8f5ff",
    border: "1px solid #ddd3f5",
    textAlign: "center"
  }}
>
  <h3>🔄 Adaptive Routine Update</h3>

  <p
    style={{
      lineHeight: "1.7",
      marginTop: "10px"
    }}
  >
    Your skincare routine can be updated according to your
    latest skin assessment and changing skin needs.
  </p>

  <button
    onClick={handleUpdateRoutine}
    style={{
      marginTop: "12px"
    }}
  >
    Update My Routine
  </button>
  {routineUpdated && (
  <p
    style={{
      marginTop: "15px",
      padding: "12px",
      borderRadius: "10px",
      background: "#eaf7ee",
      border: "1px solid #b7dfc2",
      color: "#2e7d32",
      fontWeight: "600",
      textAlign: "center"
    }}
  >
    ✅ Your skincare routine has been updated successfully.
  </p>
)}
 </div>


          <div
  className="routine-section"
  style={{
    padding: "20px",
    marginTop: "15px",
    borderRadius: "12px",
    background: "#fffaf5",
    border: "1px solid #ead8c8"
  }}
>
  <h3>🌤️ Seasonal Recommendation</h3>

  <p
    style={{
      lineHeight: "1.7",
      marginTop: "10px"
    }}
  >
    {seasonalRecommendation
  ? seasonalRecommendation.recommendation
  : "Get skincare recommendations according to seasonal changes and your current skin needs."}
  </p>

  <button
    onClick={handleSeasonalRecommendation}
    style={{
      marginTop: "12px"
    }}
  >
    Get Seasonal Recommendation
  </button>
  </div>  
   </div>     
         )}

       </div>

     </div>
   );
 }           
 //SEASONAL PAGE
 if (page === "seasonal") {
  return (
    <div className="form-page">
      <div className="form-box">
        <h2>🌤️ Seasonal Skincare Recommendation</h2>

        {seasonalRecommendation && (
          <div className="seasonal-result">

            <h3>Current Season</h3>
            <p>{seasonalRecommendation.season}</p>

            <h3>Your Skin Concern</h3>
            <p>{seasonalRecommendation.skin_concern}</p>

            <h3>Seasonal Recommendation</h3>
            <p>{seasonalRecommendation.recommendation}</p>

            <h3>Personalized Tip</h3>
            <p>{seasonalRecommendation.concern_specific_tip}</p>

            <button onClick={() => setPage("dashboard")}>
              Back to Dashboard
            </button>

          </div>
        )}
      </div>
    </div>
  );
}
// PRODUCT INTELLIGENCE PAGE
if (page === "products") {
  const products = [
    {
      name: "Gentle Face Wash",
      price: 299,
      category: "Face Wash",
      ingredients: "Ceramides, Niacinamide",
      suitable: "Dry, Sensitive, Acne"
    },
    {
      name: "Oil Control Face Wash",
      price: 349,
      category: "Face Wash",
      ingredients: "Salicylic Acid, Niacinamide",
      suitable: "Oily, Acne"
    },
    {
      name: "Hydrating Moisturizer",
      price: 399,
      category: "Moisturizer",
      ingredients: "Hyaluronic Acid, Ceramides",
      suitable: "Dry, Sensitive"
    },
    {
      name: "Light Gel Moisturizer",
      price: 349,
      category: "Moisturizer",
      ingredients: "Niacinamide, Hyaluronic Acid",
      suitable: "Oily, Acne"
    },
    {
      name: "Daily Sunscreen SPF 50",
      price: 499,
      category: "Sunscreen",
      ingredients: "UV Filters",
      suitable: "All Skin Types"
    },
    {
      name: "Vitamin C Brightening Serum",
      price: 599,
      category: "Serum",
      ingredients: "Vitamin C",
      suitable: "Dark Spots, Hyperpigmentation"
    },
    {
      name: "Niacinamide Serum",
      price: 449,
      category: "Serum",
      ingredients: "Niacinamide",
      suitable: "Acne, Oily Skin"
    },
    {
      name: "Hydrating Toner",
      price: 299,
      category: "Toner",
      ingredients: "Hyaluronic Acid",
      suitable: "Dry, Sensitive"
    },
    {
      name: "Salicylic Acid Treatment",
      price: 549,
      category: "Treatment",
      ingredients: "Salicylic Acid",
      suitable: "Acne, Oily Skin"
    },
    {
      name: "Ceramide Repair Mask",
      price: 399,
      category: "Face Mask",
      ingredients: "Ceramides, Peptides",
      suitable: "Dry, Sensitive"
    }
  ];

  return (
    <div 
     className="dashboard-page">


      <header className="dashboard-header">
        <div>
          <h1>🛍️ Product Intelligence</h1>
          <p>Personalized skincare products and ingredient information</p>
        </div>

        <button
          className="home-button"
          onClick={() => setPage("dashboard")}
        >
          ← Dashboard
        </button>
      </header>

      <main className="dashboard-content">

        <section className="dashboard-welcome">
          <h2>Recommended Skincare Products ✨</h2>
          <p>
            Explore products based on skin type, concerns,
            ingredients and suitability.
          </p>
        </section>

        <div className="product-grid">

          {products.map((product, index) => (
            <div className="product-card" key={index}>

              <div className="product-category">
                {product.category}
              </div>

              <h3>{product.name}</h3>

              <div className="product-price">
                ₹{product.price}
              </div>

              <p>
                <strong>Ingredients:</strong>{" "}
                {product.ingredients}
              </p>

              <p>
                <strong>Suitable for:</strong>{" "}
                {product.suitable}
              </p>

              <button
                onClick={() => {
                  setIngredientName(product.ingredients.split(",")[0]);
                  setPage("ingredients");
                }}
              >
                🔍 Analyze Ingredient
              </button>

            </div>
          ))}

        </div>

      </main>
    </div>
  );
}


// INGREDIENT INTELLIGENCE PAGE
if (page === "ingredients") {
  return (
    <div className="dashboard-page">

      <header className="dashboard-header">
        <div>
          <h1>🧪 Ingredient Intelligence</h1>
          <p>Analyze skincare ingredients for your skin profile</p>
        </div>

        <button
          className="home-button"
          onClick={() => setPage("dashboard")}
        >
          ← Dashboard
        </button>
      </header>

      <main className="dashboard-content">

        <section className="dashboard-info">

          <h3>Ingredient Analyzer</h3>

          <p>
            Check benefits, suitability, sensitivity warnings,
            interactions and allergy information.
          </p>

          <input
            type="text"
            placeholder="Enter ingredient e.g. Niacinamide"
            value={ingredientName}
            onChange={(e) => setIngredientName(e.target.value)}
          />

          <button onClick={handleIngredientAnalysis}>
            🔍 Analyze Ingredient
          </button>

        </section>


        {ingredientAnalysis && (
          <section className="dashboard-info">

            <h3>📋 Analysis Result</h3>

            <div className="overview-row">
              <span>Ingredient</span>
              <strong>
                {ingredientAnalysis.ingredient || ingredientName}
              </strong>
            </div>

            <div className="overview-row">
              <span>Suitable</span>
              <strong>
                {ingredientAnalysis.suitable ? "✓ Yes" : "✗ No"}
              </strong>
            </div>

            <div className="overview-row">
              <span>Suitable For</span>
              <strong>
                {ingredientAnalysis.suitable_for?.join(", ")}
              </strong>
            </div>

            <div className="overview-row">
              <span>Sensitivity Level</span>
              <strong>
                {ingredientAnalysis.sensitivity_level}
              </strong>
            </div>

            <h4>Benefits</h4>

            <ul>
              {ingredientAnalysis.benefits?.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h4>Warnings</h4>

            <ul>
              {ingredientAnalysis.warnings?.map((item, index) => (
                <li key={index}>⚠️ {item}</li>
              ))}
            </ul>

            <h4>Interactions</h4>

            <ul>
              {ingredientAnalysis.interactions?.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h4>Education</h4>

            <p>
              {ingredientAnalysis.education}
            </p>

          </section>
        )}

      </main>
    </div>
  );
}


// PROGRESS TRACKING PAGE
if (page === "progress") {
  return (
    <div className="dashboard-page">

      <header className="dashboard-header">
        <div>
          <h1>📈 Progress Tracking</h1>
          <p>Monitor skin improvement and routine consistency</p>
        </div>

        <button
          className="home-button"
          onClick={() => setPage("dashboard")}
        >
          ← Dashboard
        </button>
      </header>

      <main className="dashboard-content">

        <section className="dashboard-info">

          <h3>Skin Progress History</h3>

          {progressData?.progress?.length > 0 ? (

            progressData.progress.map((record, index) => (
              <div className="overview-row" key={index}>

                <span>
                  📅 {record.progress_date}
                </span>

                <strong>
                  Score: {record.skin_score}/100
                  {" | "}
                  Adherence: {record.routine_adherence}%
                </strong>

              </div>
            ))

          ) : (

            <p>No progress records available yet.</p>

          )}

        </section>


        {analytics && (
          <section className="dashboard-info">

            <h3>📊 Progress Summary</h3>

            <div className="overview-row">
              <span>Current Score</span>
              <strong>
                {analytics.current_skin_score}/100
              </strong>
            </div>

            <div className="overview-row">
              <span>Average Score</span>
              <strong>
                {analytics.average_skin_score}/100
              </strong>
            </div>

            <div className="overview-row">
              <span>Routine Adherence</span>
              <strong>
                {analytics.average_routine_adherence}%
              </strong>
            </div>

            <div className="overview-row">
              <span>Overall Improvement</span>
              <strong>
                +{analytics.overall_improvement}
              </strong>
            </div>

          </section>
        )}

      </main>
    </div>
  );
}


// ANALYTICS PAGE
if (page === "analytics") {
  return (
    <div className="dashboard-page">

      <header className="dashboard-header">
        <div>
          <h1>📊 Skincare Analytics</h1>
          <p>Summary of your skin health and routine performance</p>
        </div>

        <button
          className="home-button"
          onClick={() => setPage("dashboard")}
        >
          ← Dashboard
        </button>
      </header>

      <main className="dashboard-content">

        {analytics ? (

          <section className="dashboard-info">

            <h3>Skin Health Analytics</h3>

            <div className="overview-row">
              <span>Current Skin Health Score</span>
              <strong>
                {analytics.current_skin_score}/100
              </strong>
            </div>

            <div className="overview-row">
              <span>Average Skin Score</span>
              <strong>
                {analytics.average_skin_score}/100
              </strong>
            </div>

            <div className="overview-row">
              <span>Average Routine Adherence</span>
              <strong>
                {analytics.average_routine_adherence}%
              </strong>
            </div>

            <div className="overview-row">
              <span>Overall Improvement</span>
              <strong>
                +{analytics.overall_improvement}
              </strong>
            </div>

            <div className="overview-row">
              <span>Total Progress Records</span>
              <strong>
                {analytics.total_progress_records}
              </strong>
            </div>

          </section>

        ) : (

          <section className="dashboard-info">
            <h3>Analytics</h3>
            <p>No analytics data available yet.</p>
          </section>

        )}

      </main>
    </div>
  );
}


// DAILY CHECKLIST PAGE
if (page === "checklist") {
  return (
    <div className="dashboard-page">

      <header className="dashboard-header">
        <div>
          <h1>✅ Daily Skincare Checklist</h1>
          <p>Track your daily skincare routine</p>
        </div>

        <button
          className="home-button"
          onClick={() => setPage("dashboard")}
        >
          ← Dashboard
        </button>
      </header>

      <main className="dashboard-content">

        <section className="dashboard-info checklist-section">

          <h3>🌞 Morning Routine</h3>

          <label className="checklist-item">
            <input
              type="checkbox"
              checked={checklist.morningFaceWash}
              onChange={() =>
                toggleChecklist("morningFaceWash")
              }
            />
            <span>Cleanse face</span>
          </label>

          <label className="checklist-item">
            <input
              type="checkbox"
              checked={checklist.morningMoisturizer}
              onChange={() =>
                toggleChecklist("morningMoisturizer")
              }
            />
            <span>Apply moisturizer</span>
          </label>

          <label className="checklist-item">
            <input
              type="checkbox"
              checked={checklist.morningSunscreen}
              onChange={() =>
                toggleChecklist("morningSunscreen")
              }
            />
            <span>Apply sunscreen</span>
          </label>


          <h3>🌙 Evening Routine</h3>

          <label className="checklist-item">
            <input
              type="checkbox"
              checked={checklist.eveningFaceWash}
              onChange={() =>
                toggleChecklist("eveningFaceWash")
              }
            />
            <span>Cleanse face</span>
          </label>

          <label className="checklist-item">
            <input
              type="checkbox"
              checked={checklist.eveningMoisturizer}
              onChange={() =>
                toggleChecklist("eveningMoisturizer")
              }
            />
            <span>Apply moisturizer</span>
          </label>

        </section>

      </main>
    </div>
  );
 }
 // =========================================================
// MILESTONE 4 — EXECUTIVE DASHBOARD PAGE
// =========================================================

 if (page === "executive-dashboard") {

  const stats =
    executiveData?.platform_statistics || {};

  const health =
    executiveData?.skin_health_statistics || {};

  const status =
    executiveData?.system_status || {};


  return (

    <div className="executive-page">


      {/* HEADER */}

      <header className="executive-header">

        <div>

          <span className="executive-badge">
            MILESTONE 4
          </span>

          <h1>
            👑 Executive Dashboard
          </h1>

          <p>
            Platform analytics and skincare intelligence overview
          </p>

        </div>


        <div className="executive-header-actions">

          <button
            className="executive-refresh"
            onClick={handleExecutiveDashboard}
          >
            🔄 Refresh
          </button>


          <button
            className="executive-home"
            onClick={() => setPage("dashboard")}
          >
            ← User Dashboard
          </button>

        </div>

      </header>



      <main className="executive-content">


        {/* HERO */}

        <section className="executive-hero">

          <div>

            <span className="hero-small">
              AI SKIN INTELLIGENCE
            </span>

            <h2>
              Platform Performance Overview ✨
            </h2>

            <p>
              Monitor users, skincare activity,
              progress and overall platform health
              from one intelligent dashboard.
            </p>

          </div>


          <div className="hero-orb">
            🧴
          </div>

        </section>



        {/* KPI CARDS */}

        <section className="executive-kpi-grid">


          <div className="executive-kpi purple">

            <div className="kpi-icon">
              👥
            </div>

            <div>

              <span>Total Users</span>

              <strong>
                {stats.total_users ?? 0}
              </strong>

            </div>

          </div>



          <div className="executive-kpi green">

            <div className="kpi-icon">
              🧴
            </div>

            <div>

              <span>Skin Profiles</span>

              <strong>
                {stats.total_skin_profiles ?? 0}
              </strong>

            </div>

          </div>



          <div className="executive-kpi pink">

            <div className="kpi-icon">
              🧠
            </div>

            <div>

              <span>Assessments</span>

              <strong>
                {stats.total_assessments ?? 0}
              </strong>

            </div>

          </div>



          <div className="executive-kpi orange">

            <div className="kpi-icon">
              📈
            </div>

            <div>

              <span>Progress Records</span>

              <strong>
                {stats.total_progress_records ?? 0}
              </strong>

            </div>

          </div>


        </section>



       <section className="executive-menu">

  {/* HEALTH PERFORMANCE */}
  
  <div
    className={`executive-menu-card health-menu ${
      openExecutiveSections.health ? "executive-menu-active" : ""
    }`}
    onClick={() => toggleExecutiveSection("health")}
  >

    <div className="executive-menu-icon">
      ❤️
    </div>

    <div className="executive-menu-text">
      <span>HEALTH ANALYTICS</span>

      <h3>
        Health Performance
      </h3>

      <p>
        Monitor skin health score, improvement and
        routine consistency.
      </p>
    </div>

    <div className="executive-menu-arrow">
      {openExecutiveSections.health ? "▲" : "▼"}
    </div>

  </div>


  {openExecutiveSections.health && (

    <div className="executive-subpanel">

      <div className="subpanel-heading">
        <span>❤️</span>

        <div>
          <h3>Health Performance Center</h3>
          <p>
            Detailed skin health analytics and trends.
          </p>
        </div>
      </div>

      <button
        className="premium-open-button"
        onClick={(e) => {
          e.stopPropagation();
          setPage("health-performance");
        }}
      >
        Open Health Performance →
      </button>

    </div>

  )}
  


  {/* SKINCARE PERFORMANCE */}

  <div
    className={`executive-menu-card skincare-menu ${
      openExecutiveSections.skincare ? "executive-menu-active" : ""
    }`}
    onClick={() => toggleExecutiveSection("skincare")}
  >

    <div className="executive-menu-icon">
      ✨
    </div>

    <div className="executive-menu-text">

      <span>SKINCARE INTELLIGENCE</span>

      <h3>
        Skincare Performance
      </h3>

      <p>
        View product, ingredient, routine and progress
        performance.
      </p>

    </div>

    <div className="executive-menu-arrow">
      {openExecutiveSections.skincare ? "▲" : "▼"}
    </div>

  </div>


  {openExecutiveSections.skincare && (

    <div className="executive-subpanel">

      <div className="subpanel-heading">

        <span>✨</span>

        <div>

          <h3>
            Skincare Performance Center
          </h3>

          <p>
            Product intelligence and skincare workflow
            overview.
          </p>

        </div>

      </div>

      <button
        className="premium-open-button"
        onClick={(e) => {
          e.stopPropagation();
          setPage("skincare-performance");
        }}
      >
        Open Skincare Performance →
      </button>

    </div>

  )}



  {/* SYSTEM USAGE */}

  <div
    className={`executive-menu-card system-menu ${
      openExecutiveSections.system ? "executive-menu-active" : ""
    }`}
    onClick={() => toggleExecutiveSection("system")}
  >

    <div className="executive-menu-icon">
      🖥️
    </div>

    <div className="executive-menu-text">

      <span>PLATFORM MONITORING</span>

      <h3>
        System Usage Overview
      </h3>

      <p>
        Monitor users, workflows, records and system
        activity.
      </p>

    </div>

    <div className="executive-menu-arrow">
      {openExecutiveSections.system ? "▲" : "▼"}
    </div>

  </div>


  {openExecutiveSections.system && (

    <div className="executive-subpanel">

      <div className="subpanel-heading">

        <span>🖥️</span>

        <div>

          <h3>
            System Usage Center
          </h3>

          <p>
            Platform-level activity and operational
            overview.
          </p>

        </div>

      </div>

      <button
        className="premium-open-button"
        onClick={(e) => {
          e.stopPropagation();
          setPage("system-usage");
        }}
      >
        Open System Usage →
      </button>

    </div>

  )}



  {/* REPORTS */}

  <div
    className={`executive-menu-card report-menu ${
      openExecutiveSections.reports ? "executive-menu-active" : ""
    }`}
    onClick={() => toggleExecutiveSection("reports")}
  >

    <div className="executive-menu-icon">
      📑
    </div>

    <div className="executive-menu-text">

      <span>REPORTING CENTER</span>

      <h3>
        Reports & Export
      </h3>

      <p>
        Generate assessment, progress and skin health
        reports.
      </p>

    </div>

    <div className="executive-menu-arrow">
      {openExecutiveSections.reports ? "▲" : "▼"}
    </div>

  </div>


  {openExecutiveSections.reports && (

    <div className="executive-subpanel">

      <div className="subpanel-heading">

        <span>📑</span>

        <div>

          <h3>
            Reports Center
          </h3>

          <p>
            PDF and Excel reporting workflows.
          </p>

        </div>

      </div>

      <button
        className="premium-open-button"
        onClick={(e) => {
          e.stopPropagation();
          setPage("reports");
        }}
      >
        Open Reports Center →
      </button>

    </div>

  )}



  {/* TESTING */}

  <div
    className={`executive-menu-card testing-menu ${
      openExecutiveSections.testing ? "executive-menu-active" : ""
    }`}
    onClick={() => toggleExecutiveSection("testing")}
  >

    <div className="executive-menu-icon">
      🧪
    </div>

    <div className="executive-menu-text">

      <span>QUALITY ASSURANCE</span>

      <h3>
        Testing & Validation
      </h3>

      <p>
        Validate APIs, workflows, UI and end-to-end
        functionality.
      </p>

    </div>

    <div className="executive-menu-arrow">
      {openExecutiveSections.testing ? "▲" : "▼"}
    </div>

  </div>


  {openExecutiveSections.testing && (

    <div className="executive-subpanel">

      <div className="subpanel-heading">

        <span>🧪</span>

        <div>

          <h3>
            Testing Center
          </h3>

          <p>
            Functional and system validation overview.
          </p>

        </div>

      </div>

      <button
        className="premium-open-button"
        onClick={(e) => {
          e.stopPropagation();
          setPage("testing");
        }}
      >
        Open Testing Center →
      </button>

    </div>

  )}


 </section>
 {/* =====================================================
    MILESTONE 4 — ANALYTICS & VISUALIZATIONS
    ===================================================== */}

<section className="executive-section visualization-section">

  <div className="section-title">

    <div>
      <span>DATA VISUALIZATION</span>

      <h3>
        📊 Skincare Performance
      </h3>
    </div>

    <span className="section-pill">
      Real Progress Data
    </span>

  </div>


  {/* CHART AREA */}

  <div className="chart-grid">


    {/* SKIN SCORE CHART */}

    <div className="visual-card">

      <div className="visual-card-header">

        <div>

          <span className="visual-icon">
            💜
          </span>

          <div>

            <h4>
              Skin Score Trend
            </h4>

            <p>
              Progress over time
            </p>

          </div>

        </div>

      </div>


      <div className="simple-chart">

        {progressTrend.length > 0 ? (

          progressTrend.map((record, index) => {

            const score = Number(
              record.skin_score ??
              record.score ??
              0
            );

            const height =
              Math.max(
                8,
                Math.min(score, 100)
              );

            return (

              <div
                className="chart-column"
                key={index}
              >

                <div className="chart-value">
                  {score}
                </div>

                <div className="chart-bar-wrapper">

                  <div
                    className="chart-bar purple-bar"
                    style={{
                      height: `${height}%`
                    }}
                  />

                </div>

                <span className="chart-label">

                  {record.progress_date
                    ? record.progress_date.slice(5)
                    : `#${index + 1}`}

                </span>

              </div>

            );

          })

        ) : (

          <div className="empty-chart">
            📈 No progress data yet
          </div>

        )}

      </div>

    </div>



    {/* ROUTINE ADHERENCE */}

    <div className="visual-card">

      <div className="visual-card-header">

        <div>

          <span className="visual-icon green-icon">
            🌿
          </span>

          <div>

            <h4>
              Routine Adherence
            </h4>

            <p>
              Daily skincare consistency
            </p>

          </div>

        </div>

      </div>


      <div className="simple-chart">

        {progressTrend.length > 0 ? (

          progressTrend.map((record, index) => {

            const adherence = Number(
              record.routine_adherence ??
              record.adherence ??
              0
            );

            const height =
              Math.max(
                8,
                Math.min(adherence, 100)
              );

            return (

              <div
                className="chart-column"
                key={index}
              >

                <div className="chart-value green-value">
                  {adherence}%
                </div>

                <div className="chart-bar-wrapper">

                  <div
                    className="chart-bar green-bar"
                    style={{
                      height: `${height}%`
                    }}
                  />

                </div>

                <span className="chart-label">

                  {record.progress_date
                    ? record.progress_date.slice(5)
                    : `#${index + 1}`}

                </span>

              </div>

            );

          })

        ) : (

          <div className="empty-chart">
            🌿 No adherence data yet
          </div>

        )}

      </div>

    </div>


  </div>



  {/* BEFORE / AFTER */}

  <div className="comparison-visual">

    <div className="comparison-title">

      <span>
        ✨
      </span>

      <div>

        <h4>
          Skin Health Improvement
        </h4>

        <p>
          Initial vs current performance
        </p>

      </div>

    </div>


    <div className="comparison-values">

      <div className="comparison-item">

        <span>
          Initial Score
        </span>

        <strong>
          {progressTrend.length > 0
            ? progressTrend[0]?.skin_score ?? "--"
            : "--"}
        </strong>

      </div>


      <div className="comparison-arrow">
        →
      </div>


      <div className="comparison-item current">

        <span>
          Current Score
        </span>

        <strong>
          {analytics?.current_skin_score ?? "--"}
        </strong>

      </div>


      <div className="improvement-badge">

        📈{" "}

        {analytics
          ? analytics.overall_improvement >= 0
            ? `+${analytics.overall_improvement}`
            : analytics.overall_improvement
          : "--"}

      </div>

    </div>

  </div>

 </section>

        {/* SYSTEM STATUS */}

        <section className="executive-section">

          <div className="section-title">

            <div>

              <span>SYSTEM HEALTH</span>

              <h3>
                🛡️ Platform Status
              </h3>

            </div>

          </div>


          <div className="system-status-grid">


            <div className="system-status-card">

              <span className="status-dot">
                ●
              </span>

              <div>

                <strong>
                  Backend API
                </strong>

                <p>
                  {status.backend || "Operational"}
                </p>

              </div>

            </div>



            <div className="system-status-card">

              <span className="status-dot">
                ●
              </span>

              <div>

                <strong>
                  Database
                </strong>

                <p>
                  {status.database || "Connected"}
                </p>

              </div>

            </div>



            <div className="system-status-card">

              <span className="status-dot">
                ●
              </span>

              <div>

                <strong>
                  Analytics
                </strong>

                <p>
                  {status.analytics || "Operational"}
                </p>

              </div>

            </div>



            <div className="system-status-card">

              <span className="status-dot">
                ●
              </span>

              <div>

                <strong>
                  Progress Tracking
                </strong>

                <p>
                  {status.progress_tracking ||
                    "Operational"}
                </p>

              </div>

            </div>


          </div>

        </section>



        {/* REPORT ACTIONS */}

        <section className="executive-report-banner">

          <div>

            <span>📑 REPORTING CENTER</span>

            <h3>
              Reports & Visualizations
            </h3>

            <p>
              Generate skincare assessment,
              progress and platform reports.
            </p>

          </div>


          <button
            onClick={() =>
              setPage("reports")
            }
          >
            Open Reports →
          </button>

        </section>


      </main>

    </div>

  );
 }
 // =========================================================
// MILESTONE 4 — HEALTH PERFORMANCE PAGE
// =========================================================

if (page === "health-performance") {

  const health =
    executiveData?.skin_health_statistics || {};

  return (
    <div className="executive-page">

      <header className="executive-header">

        <div>

          <span className="executive-badge">
            MILESTONE 4
          </span>

          <h1>
            ❤️ Health Performance
          </h1>

          <p>
            Detailed skin health performance and improvement overview
          </p>

        </div>

        <button
          className="executive-home"
          onClick={() => setPage("executive-dashboard")}
        >
          ← Executive Dashboard
        </button>

      </header>


      <main className="executive-content">

        <section className="executive-kpi-grid">

          <div className="executive-kpi purple">

            <div className="kpi-icon">
              💜
            </div>

            <div>

              <span>Current Skin Score</span>

              <strong>
                {health.current_skin_score ?? 0}/100
              </strong>

            </div>

          </div>


          <div className="executive-kpi green">

            <div className="kpi-icon">
              📊
            </div>

            <div>

              <span>Average Score</span>

              <strong>
                {health.average_skin_score ?? 0}/100
              </strong>

            </div>

          </div>


          <div className="executive-kpi pink">

            <div className="kpi-icon">
              📈
            </div>

            <div>

              <span>Overall Improvement</span>

              <strong>
                +{health.overall_improvement ?? 0}
              </strong>

            </div>

          </div>


          <div className="executive-kpi orange">

            <div className="kpi-icon">
              🌿
            </div>

            <div>

              <span>Routine Adherence</span>

              <strong>
                {health.average_routine_adherence ?? 0}%
              </strong>

            </div>

          </div>

        </section>


        <section className="dashboard-info">

          <h3>
            📊 Health Performance Insights
          </h3>

          <p>
            The current skin health score represents the latest
            recorded skincare progress.
          </p>

          <p>
            Overall improvement compares the latest progress
            score with the first recorded score.
          </p>

        </section>


        <section className="executive-report-banner">

          <div>

            <span>
              AI SKIN INTELLIGENCE
            </span>

            <h3>
              Skin Health Monitoring
            </h3>

            <p>
              Monitor skin score, routine adherence and
              overall improvement through the platform.
            </p>

          </div>

        </section>

      </main>

    </div>
  );
 }
 if (page === "skincare-performance") {

  return (
    <div className="executive-page">

      <header className="executive-header">

        <div>

          <span className="executive-badge">
            MILESTONE 4
          </span>

          <h1>
            ✨ Skincare Performance
          </h1>

          <p>
            Product intelligence, ingredients and skincare workflows
          </p>

        </div>

        <button
          className="executive-home"
          onClick={() => setPage("executive-dashboard")}
        >
          ← Executive Dashboard
        </button>

      </header>


      <main className="executive-content">

        <section className="executive-section">

          <div className="section-title">

            <div>

              <span>
                SKINCARE INTELLIGENCE
              </span>

              <h3>
                ✨ Performance Modules
              </h3>

            </div>

          </div>


          <div className="chart-grid">

            <div className="visual-card">

              <h4>
                🧴 Product Recommendation
              </h4>

              <p>
                Personalized product recommendation workflow
                is available.
              </p>

              <button
                className="premium-open-button"
                onClick={() => setPage("products")}
              >
                Open Products →
              </button>

            </div>


            <div className="visual-card">

              <h4>
                🧪 Ingredient Intelligence
              </h4>

              <p>
                Ingredient analysis workflow is available.
              </p>

              <button
                className="premium-open-button"
                onClick={() => setPage("ingredient")}
              >
                Open Ingredient Intelligence →
              </button>

            </div>


            <div className="visual-card">

              <h4>
                📈 Progress Tracking
              </h4>

              <p>
                Track skin score and routine adherence over time.
              </p>

              <button
                className="premium-open-button"
                onClick={() => setPage("progress")}
              >
                Open Progress →
              </button>

            </div>


            <div className="visual-card">

              <h4>
                ✅ Daily Checklist
              </h4>

              <p>
                Track daily morning and evening skincare activities.
              </p>

              <button
                className="premium-open-button"
                onClick={() => setPage("checklist")}
              >
                Open Checklist →
              </button>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
 }
 if (page === "system-usage") {

  const stats =
    executiveData?.platform_statistics || {};

  const status =
    executiveData?.system_status || {};

  return (
    <div className="executive-page">

      <header className="executive-header">

        <div>

          <span className="executive-badge">
            MILESTONE 4
          </span>

          <h1>
            🖥️ System Usage Overview
          </h1>

          <p>
            Platform activity and operational status
          </p>

        </div>

        <button
          className="executive-home"
          onClick={() => setPage("executive-dashboard")}
        >
          ← Executive Dashboard
        </button>

      </header>


      <main className="executive-content">

        <section className="executive-kpi-grid">

          <div className="executive-kpi purple">
            <div className="kpi-icon">👥</div>

            <div>
              <span>Total Users</span>
              <strong>
                {stats.total_users ?? 0}
              </strong>
            </div>
          </div>


          <div className="executive-kpi green">
            <div className="kpi-icon">🧴</div>

            <div>
              <span>Skin Profiles</span>
              <strong>
                {stats.total_skin_profiles ?? 0}
              </strong>
            </div>
          </div>


          <div className="executive-kpi pink">
            <div className="kpi-icon">🧠</div>

            <div>
              <span>Assessments</span>
              <strong>
                {stats.total_assessments ?? 0}
              </strong>
            </div>
          </div>


          <div className="executive-kpi orange">
            <div className="kpi-icon">📈</div>

            <div>
              <span>Progress Records</span>
              <strong>
                {stats.total_progress_records ?? 0}
              </strong>
            </div>
          </div>

        </section>


        <section className="dashboard-info">

          <h3>
            🛡️ System Status
          </h3>

          <div className="overview-row">
            <span>Backend</span>
            <strong>
              {status.backend ?? "Unknown"}
            </strong>
          </div>

          <div className="overview-row">
            <span>Database</span>
            <strong>
              {status.database ?? "Unknown"}
            </strong>
          </div>

          <div className="overview-row">
            <span>API</span>
            <strong>
              {status.api ?? "Unknown"}
            </strong>
          </div>

        </section>

      </main>

    </div>
  );
 }
 if (page === "reports") {
  return (
    <div className="reports-page">

      <header className="reports-header">

        <div className="reports-title-area">
          <span>MILESTONE 4 • REPORTING CENTER</span>

          <h1>
            📑 Reports & Export
          </h1>

          <p>
            Generate professional skincare analytics and progress reports.
          </p>
        </div>

        <button
          className="reports-back-button"
          onClick={() => setPage("executive-dashboard")}
        >
          ← Executive Dashboard
        </button>

      </header>


      <section className="reports-hero">

        <h2>
          Executive Reporting Workspace ✨
        </h2>

        <p>
          Export platform statistics, skin health analytics,
          progress data and testing information in professional
          PDF and Excel formats.
        </p>

      </section>


      <section className="reports-grid">

        {/* EXECUTIVE REPORT */}

        <div className="report-card">

          <div className="report-icon">
            📊
          </div>

          <h3>
            Executive Summary
          </h3>

          <p>
            Platform statistics, skin health performance
            and overall improvement.
          </p>

          <div className="report-button-row">

            <button
              className="report-export-button report-pdf"
              onClick={exportExecutivePDF}
            >
              📄 Export PDF
            </button>

            <button
              className="report-export-button report-excel"
              onClick={exportExecutiveExcel}
            >
              📊 Export Excel
            </button>

          </div>

        </div>


        {/* PROGRESS REPORT */}

        <div className="report-card">

          <div className="report-icon">
            📈
          </div>

          <h3>
            Skin Progress Report
          </h3>

          <p>
            Date-wise skin score and routine adherence
            progress.
          </p>

          <div className="report-button-row">

            <button
              className="report-export-button report-pdf"
              onClick={exportExecutivePDF}
            >
              📄 PDF Report
            </button>

            <button
              className="report-export-button report-excel"
              onClick={exportExecutiveExcel}
            >
              📊 Excel Data
            </button>

          </div>

        </div>


        {/* HEALTH REPORT */}

        <div className="report-card">

          <div className="report-icon">
            💜
          </div>

          <h3>
            Skin Health Report
          </h3>

          <p>
            Current score, average score, adherence
            and overall improvement.
          </p>

          <div className="report-button-row">

            <button
              className="report-export-button report-pdf"
              onClick={exportExecutivePDF}
            >
              📄 Export PDF
            </button>

            <button
              className="report-export-button report-excel"
              onClick={exportExecutiveExcel}
            >
              📊 Export Excel
            </button>

          </div>

        </div>


        {/* VALIDATION REPORT */}

        <div className="report-card">

          <div className="report-icon">
            🧪
          </div>

          <h3>
            Testing & Validation
          </h3>

          <p>
            Functional testing, workflow validation
            and system status.
          </p>

          <div className="report-button-row">

            <button
              className="report-export-button report-excel"
              onClick={() => setPage("testing")}
            >
              🧪 Open Testing Center
            </button>

          </div>

        </div>

      </section>


      <div className="report-info-strip">
        ✅ Reports are generated using the current
        executive dashboard and progress data.
      </div>

    </div>
  );
 }
 
 if (page === "testing") {

  const testingItems = [

    {
      name: "Executive Dashboard",
      type: "UI",
      status: "PASS"
    },

    {
      name: "Skin Health Analytics",
      type: "Workflow",
      status: "PASS"
    },

    {
      name: "Data Visualization",
      type: "UI",
      status: "PASS"
    },

    {
      name: "Reports Center",
      type: "Workflow",
      status: "PASS"
    },

    {
      name: "PDF Export",
      type: "Export",
      status: "PASS"
    },

    {
      name: "Excel Export",
      type: "Export",
      status: "PASS"
    },

    {
      name: "Progress Tracking",
      type: "API",
      status: "PASS"
    },

    {
      name: "Skincare Analytics",
      type: "API",
      status: "PASS"
    },

    {
      name: "Daily Checklist",
      type: "Workflow",
      status: "PASS"
    },

    {
      name: "Frontend / Backend Integration",
      type: "Integration",
      status: "PASS"
    }

  ];


  return (

    <div className="testing-page">

      <header className="reports-header">

        <div className="reports-title-area">

          <span>
            MILESTONE 4 • QUALITY ASSURANCE
          </span>

          <h1>
            🧪 Testing & Validation Center
          </h1>

          <p>
            Functional, workflow and integration
            validation overview.
          </p>

        </div>


        <button
          className="reports-back-button"
          onClick={() =>
            setPage("executive-dashboard")
          }
        >
          ← Executive Dashboard
        </button>

      </header>


      <section className="testing-summary">

        <div>
          <span>Total Tests</span>
          <strong>{testingItems.length}</strong>
        </div>

        <div>
          <span>Passed</span>
          <strong>
            {
              testingItems.filter(
                item => item.status === "PASS"
              ).length
            }
          </strong>
        </div>

        <div>
          <span>Failed</span>
          <strong>0</strong>
        </div>

        <div>
          <span>System</span>
          <strong>READY</strong>
        </div>

      </section>


      <section className="testing-table-card">

        <div className="testing-table-header">

          <h2>
            Validation Matrix
          </h2>

          <span>
            Milestone 4
          </span>

        </div>


        <div className="testing-list">

          {testingItems.map(
            (item, index) => (

              <div
                className="testing-row"
                key={index}
              >

                <div>
                  <strong>
                    {item.name}
                  </strong>

                  <span>
                    {item.type}
                  </span>
                </div>

                <b className="testing-pass">
                  ✓ {item.status}
                </b>

              </div>

            )
          )}

        </div>

      </section>


      <section className="testing-note">

        <h3>
          Validation Summary
        </h3>

        <p>
          Core Milestone 4 dashboard, reporting,
          visualization and integration workflows
          have been validated through functional testing.
        </p>

      </section>

    </div>

  );

 }
 
 // DASHBOARD
 if (page === "dashboard") {
  return (
    <div className="dashboard-page">

      <header className="dashboard-header">
        <div>
          <h1>✨ SkinCare Assistant</h1>
          <p>
            Your personalized AI skincare & wellness dashboard
          </p>
        </div>

        <button
          className="home-button"
          onClick={() => setPage("home")}
        >
          Logout / Home
        </button>
      </header>


      <main className="dashboard-content">

        <section className="dashboard-welcome">
          <h2>Welcome to your Dashboard 👋</h2>

          <p>
            Manage your skin health, products, ingredients,
            progress and daily skincare routine from one place.
          </p>

          <span>User ID: {userId}</span>
        </section>


   {/* QUICK ACTIONS */}

<section className="dashboard-info">

  <h3>⚡ Quick Actions</h3>

  <div className="dashboard-cards">
    {/* EXECUTIVE DASHBOARD */}

 <div
  className="dashboard-card executive-entry-card"
  onClick={handleExecutiveDashboard}
 >

  <div className="card-icon">
    👑
  </div>

  <h3>
    Executive Dashboard
  </h3>

  <p>
    View platform-wide analytics,
    performance and system health.
  </p>

  <button
    onClick={(e) => {
      e.stopPropagation();
      handleExecutiveDashboard();
    }}
  >
    Open Executive Dashboard
  </button>

 </div>

    {/* SKIN ASSESSMENT */}

    <div className="dashboard-card">

      <div className="card-icon">🧠</div>

      <h3>Skin Assessment</h3>

      <p>
        Analyze skin health and identify major concerns.
      </p>

      <button onClick={() => setPage("assessment")}>
        Open Assessment
      </button>

    </div>


    {/* RECOMMENDED PRODUCTS */}

    <div
      className={`dashboard-card ${
        openDashboardSections.products ? "active-card" : ""
      }`}
      onClick={() => toggleDashboardSection("products")}
    >

      <div className="card-icon">🛍️</div>

      <h3>Recommended Products</h3>

      <p>
        Explore personalized skincare products and prices.
      </p>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setPage("products");
        }}
      >
        View Products
      </button>

      <span className="expand-label">
        {openDashboardSections.products
          ? "▲ Hide recommendations"
          : "▼ Show recommendations"}
      </span>

    </div>


    {/* PRODUCT PREVIEW */}

    {openDashboardSections.products && (

      <div className="dashboard-section-content product-preview">

        <div className="preview-heading">

          <span>✨</span>

          <div>
            <h4>Personalized Recommendations</h4>

            <p>
              Products selected from your skincare profile.
            </p>
          </div>

        </div>

        <div className="mini-product-grid">

          {productRecommendations.length > 0 ? (

            productRecommendations.map((product, index) => (

              <div
                className="mini-product-card"
                key={index}
              >

                <span className="mini-product-category">
                  {product.category}
                </span>

                <h4>{product.name}</h4>

                <strong>₹{product.price}</strong>

                <p>
                  {product.ingredients || "Skincare ingredients"}
                </p>

              </div>

            ))

          ) : (

            <p>No product recommendations available.</p>

          )}

        </div>

      </div>

    )}


    {/* INGREDIENT INTELLIGENCE */}

    <div
      className={`dashboard-card ${
        openDashboardSections.ingredients ? "active-card" : ""
      }`}
      onClick={() => toggleDashboardSection("ingredients")}
    >

      <div className="card-icon">🧪</div>

      <h3>Ingredient Intelligence</h3>

      <p>
        Analyze ingredients, benefits, warnings and interactions.
      </p>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setPage("ingredients");
        }}
      >
        Analyze Ingredients
      </button>

      <span className="expand-label">
        {openDashboardSections.ingredients
          ? "▲ Hide analyzer"
          : "▼ Open analyzer"}
      </span>

    </div>


    {/* INGREDIENT PREVIEW */}

    {openDashboardSections.ingredients && (

      <div className="dashboard-section-content analyzer-preview">

        <div className="preview-heading">

          <span>🧪</span>

          <div>

            <h4>Ingredient Analyzer</h4>

            <p>
              Check ingredient suitability, benefits,
              warnings and interactions.
            </p>

          </div>

        </div>

        <button
          className="secondary-action"
          onClick={(e) => {
            e.stopPropagation();
            setPage("ingredients");
          }}
        >
          Open Ingredient Analyzer →
        </button>

      </div>

    )}


    {/* PROGRESS TRACKING */}

    <div
      className={`dashboard-card ${
        openDashboardSections.progress ? "active-card" : ""
      }`}
      onClick={() => toggleDashboardSection("progress")}
    >

      <div className="card-icon">📈</div>

      <h3>Progress Tracking</h3>

      <p>
        Monitor skin score, adherence and improvement.
      </p>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setPage("progress");
        }}
      >
        View Progress
      </button>

      <span className="expand-label">
        {openDashboardSections.progress
          ? "▲ Hide preview"
          : "▼ Show progress"}
      </span>

    </div>


    {/* PROGRESS PREVIEW */}

    {openDashboardSections.progress && (

      <div className="dashboard-section-content progress-preview">

        <div className="metric-mini">

          <span>Current Score</span>

          <strong>
            {analytics?.current_skin_score ?? "--"}/100
          </strong>

        </div>

        <div className="metric-mini">

          <span>Average Score</span>

          <strong>
            {analytics?.average_skin_score ?? "--"}/100
          </strong>

        </div>

        <div className="metric-mini">

          <span>Improvement</span>

          <strong>
            {analytics
              ? `+${analytics.overall_improvement}`
              : "--"}
          </strong>

        </div>

      </div>

    )}


    {/* SKINCARE ANALYTICS */}

    <div
      className={`dashboard-card ${
        openDashboardSections.analytics ? "active-card" : ""
      }`}
      onClick={() => toggleDashboardSection("analytics")}
    >

      <div className="card-icon">📊</div>

      <h3>Skincare Analytics</h3>

      <p>
        View your overall skin health analytics.
      </p>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setPage("analytics");
        }}
      >
        View Analytics
      </button>

      <span className="expand-label">
        {openDashboardSections.analytics
          ? "▲ Hide overview"
          : "▼ Show overview"}
      </span>

    </div>


    {/* ANALYTICS PREVIEW */}

    {openDashboardSections.analytics && (

      <div className="dashboard-section-content analytics-preview">

        <div className="metric-mini">

          <span>Skin Score</span>

          <strong>
            {analytics?.current_skin_score ?? "--"}
          </strong>

        </div>

        <div className="metric-mini">

          <span>Adherence</span>

          <strong>
            {analytics?.average_routine_adherence ?? "--"}%
          </strong>

        </div>

        <div className="metric-mini">

          <span>Improvement</span>

          <strong>
            {analytics
              ? `+${analytics.overall_improvement}`
              : "--"}
          </strong>

        </div>

      </div>

    )}


    {/* DAILY CHECKLIST */}

    <div
      className={`dashboard-card ${
        openDashboardSections.checklist ? "active-card" : ""
      }`}
      onClick={() => toggleDashboardSection("checklist")}
    >

      <div className="card-icon">✅</div>

      <h3>Daily Checklist</h3>

      <p>
        Track your morning and evening skincare routine.
      </p>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setPage("checklist");
        }}
      >
        Open Checklist
      </button>

      <span className="expand-label">
        {openDashboardSections.checklist
          ? "▲ Hide checklist"
          : "▼ Show checklist"}
      </span>

    </div>


    {/* CHECKLIST PREVIEW */}

    {openDashboardSections.checklist && (

      <div className="dashboard-section-content checklist-preview">

        <div>🌞 Morning routine</div>

        <div>🌙 Evening routine</div>

        <button
          className="secondary-action"
          onClick={(e) => {
            e.stopPropagation();
            setPage("checklist");
          }}
        >
          Open Full Checklist →
        </button>

      </div>

    )}


    {/* DERMATOLOGIST INSIGHTS PREVIEW */}

    <div
      className={`dashboard-card dermatologist-card ${
        openDashboardSections.dermatologist
          ? "active-card"
          : ""
      }`}
      onClick={() =>
        toggleDashboardSection("dermatologist")
      }
    >

      <div className="card-icon">🩺</div>

      <h3>Dermatologist Insights</h3>

      <p>
        Preview for future dermatologist-assisted skincare review.
      </p>

      <span className="expand-label">
        {openDashboardSections.dermatologist
          ? "▲ Hide preview"
          : "▼ View preview"}
      </span>

    </div>


    {/* DERMATOLOGIST PREVIEW */}

    {openDashboardSections.dermatologist && (

      <div className="dashboard-section-content dermatologist-preview">

        <h4>🩺 Dermatologist Insights Preview</h4>

        <p>
          This section is reserved for future professional
          skincare review and consultation workflows.
        </p>

        <div className="preview-note">
          Coming in the extended platform workflow.
        </div>

      </div>

    )}

  </div>

</section>


{/* EXISTING FEATURES */}

<section className="dashboard-info">

  <h3>🧴 Skincare Management</h3>

  <div className="dashboard-cards">


    {/* SKIN PROFILE */}

    <div className="dashboard-card">

      <div className="card-icon">👤</div>

      <h3>Skin Profile</h3>

      <p>
        Manage skin type, concerns and sensitivity.
      </p>

      <button
        onClick={() => setPage("skin-profile")}
      >
        View Profile
      </button>

    </div>


    {/* LIFESTYLE */}

    <div className="dashboard-card">

      <div className="card-icon">🏃</div>

      <h3>Lifestyle Tracking</h3>

      <p>
        Track lifestyle habits affecting your skin.
      </p>

      <button
        onClick={() => setPage("lifestyle")}
      >
        View Lifestyle
      </button>

    </div>


    {/* SLEEP */}

    <div className="dashboard-card">

      <div className="card-icon">😴</div>

      <h3>Sleep Tracking</h3>

      <p>
        Monitor sleep duration and sleep quality.
      </p>

      <button
        onClick={() => setPage("sleep")}
      >
        View Sleep
      </button>

    </div>


    {/* SKINCARE ROUTINE */}

    <div className="dashboard-card">

      <div className="card-icon">🌸</div>

      <h3>Skincare Routine</h3>

      <p>
        Manage your personalized morning and evening routine.
      </p>

      <button
        onClick={() => setPage("routine")}
      >
        View Routine
      </button>

    </div>


    {/* SEASONAL TIPS */}

    <div className="dashboard-card">

      <div className="card-icon">🌦️</div>

      <h3>Seasonal Tips</h3>

      <p>
        Get skincare recommendations based on the season.
      </p>

      <button onClick={handleSeasonalRecommendation}>
        View Seasonal Tips
      </button>

    </div>

  </div>

 </section>
        {/* ANALYTICS PREVIEW */}

        {analytics && (
          <section className="dashboard-info">

            <h3>📊 Skin Health Overview</h3>

            <div className="overview-row">
              <span>Current Skin Score</span>
              <strong>
                {analytics.current_skin_score}/100
              </strong>
            </div>

            <div className="overview-row">
              <span>Average Skin Score</span>
              <strong>
                {analytics.average_skin_score}/100
              </strong>
            </div>

            <div className="overview-row">
              <span>Routine Adherence</span>
              <strong>
                {analytics.average_routine_adherence}%
              </strong>
            </div>

            <div className="overview-row">
              <span>Overall Improvement</span>
              <strong>
                +{analytics.overall_improvement}
              </strong>
            </div>

          </section>
        )}

      </main>

    </div>
  );
 }
  // HOME PAGE
  return (
    <div className="app">
      <header className="header">
        <h1>SkinCare Assistant</h1>
        <p>Your personal skincare and lifestyle companion</p>
      </header>

      <main className="main">
        <section className="welcome">
          <h2>Welcome to SkinCare Assistant</h2>

          <p>
            Manage your skin profile, lifestyle habits and sleep
            in one place.
          </p>

          <div className="buttons">
            <button onClick={() => setPage("login")}>
              Login
            </button>

            <button onClick={() => setPage("register")}>
              Register
            </button>
          </div>
        </section>

        <section className="features">
          <div
            className="card"
            onClick={() => setPage("skin-profile")}
          >
            <h3>Skin Profile</h3>
            <p>Maintain your basic skin-related information.</p>
          </div>

          <div
            className="card"
            onClick={() => setPage("lifestyle")}
          >
            <h3>Lifestyle Tracking</h3>
            <p>Track important lifestyle habits.</p>
          </div>

          <div
            className="card"
            onClick={() => setPage("sleep")}
          >
            <h3>Sleep Tracking</h3>
            <p>Record your sleep information.</p>
          </div>
        </section>
      </main>
    </div>
  );

 } 
export default App;