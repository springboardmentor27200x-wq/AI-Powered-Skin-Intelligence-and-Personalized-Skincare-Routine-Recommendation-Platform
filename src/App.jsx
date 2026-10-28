
import AdminDashboard from "./pages/AdminDashboard";
import DermatologistDashboard from "./pages/DermatologistDashboard";
import ConsultantDashboard from "./pages/ConsultantDashboard";


import ConsultDermatologist from "./pages/ConsultDermatologist";
import { useEffect, useState } from "react";

import {
  Routes,
  Route,
  Navigate,
  useSearchParams,
  useNavigate,
} from "react-router-dom";



import Navbar from "./components/Navbar";

import Progress from "./pages/Progress";

import EnvironmentalExposure from "./pages/EnvironmentalExposure";

import VerifyEmail from "./pages/VerifyEmail";

import Login from "./pages/Login";

import Signup from "./pages/Signup";

import Home from "./pages/Home";

import Profile from "./pages/Profile";



import SkinAssessment from "./pages/SkinAssessment";

import BasicInformation from "./pages/BasicInformation";

import Allergies from "./pages/Allergies";

import Lifestyle from "./pages/Lifestyle";

import SleepHydration from "./pages/SleepHydration";

import SkinAnalysis from "./pages/SkinAnalysis";

import ResultsDashboard from "./pages/ResultsDashboard";

import IngredientRecommendation from "./pages/IngredientRecommendation";

import ProductRecommendations from "./pages/ProductRecommendations";

import Routine from "./pages/Routine";



// function Progress() {

//   return (

//     <div className="app-page">

//       <h1>Your Progress 📈</h1>

//       <p>

//         Your skin progress and improvement trends will appear here.

//       </p>

//     </div>

//   );

// }



function App() {

const navigate = useNavigate();
const [currentUser, setCurrentUser] = useState(null);

const [searchParams, setSearchParams] = useSearchParams();




  const verificationToken = searchParams.get("token");



  const [assessmentStep, setAssessmentStep] = useState("skin");



  const [assessmentData, setAssessmentData] = useState(() => {
    const defaults = {
      skinType: "",
      concerns: [],
      ageGroup: "",
      allergies: "",
      exercise: "",
      stress: "",
      sunExposure: "",
      pollutionExposure: "",
      environment: "",
      sleep: "",
      water: "",
    };

    try {
      const saved = localStorage.getItem("skinsenseAssessmentData");
      if (!saved) return defaults;

      const parsed = JSON.parse(saved);
      return {
        ...defaults,
        ...parsed,
        concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
      };
    } catch (error) {
      console.error("Could not restore saved assessment:", error);
      return defaults;
    }
  });

  // Persist assessment answers so Profile can show them after navigation or refresh.
  useEffect(() => {
    try {
      localStorage.setItem(
        "skinsenseAssessmentData",
        JSON.stringify(assessmentData)
      );
    } catch (error) {
      console.error("Could not save assessment locally:", error);
    }
  }, [assessmentData]);



  /*

   * EMAIL VERIFICATION

   */



  if (verificationToken) {

    return (

      <VerifyEmail

        token={verificationToken}

        onLogin={() => {

          setSearchParams({});

        }}

      />

    );

  }



  /*

   * SKIN SCORE

   */



  const calculateScore = () => {

    let skinCondition = 100;

    let lifestyle = 100;

    let sleepScore = 100;

    let hydration = 100;



    if (assessmentData.concerns.length >= 4) {

      skinCondition -= 30;

    } else if (assessmentData.concerns.length >= 2) {

      skinCondition -= 15;

    } else {

      skinCondition -= 5;

    }



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



    if (assessmentData.sleep === "Less than 5 hours") {

      sleepScore -= 30;

    } else if (assessmentData.sleep === "5–6 hours") {

      sleepScore -= 15;

    } else if (assessmentData.sleep === "More than 8 hours") {

      sleepScore -= 5;

    }



    if (assessmentData.water === "Less than 1 L") {

      hydration -= 30;

    } else if (assessmentData.water === "1–2 L") {

      hydration -= 15;

    } else if (assessmentData.water === "2–3 L") {

      hydration -= 5;

    }



    const finalScore =

      skinCondition * 0.35 +

      lifestyle * 0.20 +

      sleepScore * 0.15 +

      100 * 0.20 +

      hydration * 0.10;



    return Math.round(finalScore);

  };



  const score = calculateScore();



  /*

   * ASSESSMENT

   */



  function Assessment() {

    if (assessmentStep === "skin") {

      return (

        <SkinAssessment

          onContinue={(data) => {

            setAssessmentData((prev) => ({

              ...prev,

              ...data,

            }));



            setAssessmentStep("basic");

          }}

        />

      );

    }



    if (assessmentStep === "basic") {

      return (

        <BasicInformation

          onContinue={(data) => {

            setAssessmentData((prev) => ({

              ...prev,

              ...data,

            }));



            setAssessmentStep("allergies");

          }}

        />

      );

    }



    if (assessmentStep === "allergies") {

      return (

        <Allergies

          onContinue={(data) => {

            setAssessmentData((prev) => ({

              ...prev,

              ...data,

            }));



            setAssessmentStep("lifestyle");

          }}

        />

      );

    }



    if (assessmentStep === "lifestyle") {

      return (

        <Lifestyle

          onContinue={(data) => {

            setAssessmentData((prev) => ({

              ...prev,

              ...data,

            }));



            setAssessmentStep("environment");

          }}

        />

      );

    }



    if (assessmentStep === "environment") {

      return (

        <EnvironmentalExposure

          onContinue={(data) => {

            console.log("ENVIRONMENT DATA:", data);



            setAssessmentData((prev) => ({

              ...prev,

              ...data,

            }));



            setAssessmentStep("sleep");

          }}

        />

      );

    }



    if (assessmentStep === "sleep") {

      return (

        <SleepHydration

          onContinue={(data) => {

            setAssessmentData((prev) => ({

              ...prev,

              ...data,

            }));



            setAssessmentStep("analysis");

          }}

        />

      );

    }



    if (assessmentStep === "analysis") {

      const handleAnalysisContinue = async () => {

        try {

          const payload = {

            skin_type: assessmentData.skinType,

            concerns: assessmentData.concerns.join(", "),

            allergies: assessmentData.allergies,

            exercise: assessmentData.exercise,

            stress: assessmentData.stress,

            sun_exposure: assessmentData.sunExposure,

            pollution_exposure:

              assessmentData.pollutionExposure,

            environment: assessmentData.environment,

            sleep: assessmentData.sleep,

            water_intake: assessmentData.water,

          };



          console.log(

            "FINAL ASSESSMENT DATA:",

            assessmentData

          );



          console.log(

            "PROFILE PAYLOAD:",

            payload

          );



          const response = await fetch(

            "http://localhost:8000/profile",

            {

              method: "POST",

              headers: {

                "Content-Type": "application/json",

              },

              credentials: "include",

              body: JSON.stringify(payload),

            }

          );



          const data = await response.json();



          if (!response.ok) {

            alert(

              data.detail ||

                "Failed to save your skin profile."

            );

            return;

          }



          console.log(

            "Complete profile saved:",

            data

          );



          setAssessmentStep("results");

        } catch (error) {

          console.error(

            "Profile save error:",

            error

          );



          alert(

            "Cannot connect to SkinSense server."

          );

        }

      };



      return (

        <SkinAnalysis

          assessmentData={assessmentData}

          score={score}

          onContinue={handleAnalysisContinue}

        />

      );

    }



    if (assessmentStep === "results") {

      return (

        <ResultsDashboard

          assessmentData={assessmentData}

          score={score}

          onContinue={() =>

            setAssessmentStep("routine")

          }

        />

      );

    }



    if (assessmentStep === "routine") {

      return (

        <Routine

          assessmentData={assessmentData}

        />

      );

    }



    return null;

  }



  /*

   * MAIN APPLICATION

   */



  return (

    <Routes>

      {/* AUTH */}
<Route
  path="/consultation"
  element={
    <>
      <Navbar />
      <ConsultDermatologist />
    </>
  }
/>


      <Route
  path="/login"
  element={
    <Login
      onSignup={() => navigate("/signup")}
      onLoginSuccess={(user) => {
        setCurrentUser(user);

        const role = user.role || "user";

        if (role === "admin") {
          navigate("/admin");
        } else if (role === "dermatologist") {
          navigate("/dermatologist");
        } else if (role === "consultant") {
          navigate("/consultant");
        } else {
          navigate("/home");
        }
      }}
    />
  }
/>

      <Route

        path="/signup"

        element={

          <Signup

            onLogin={() => {

              window.history.pushState(

                {},

                "",

                "/login"

              );



              window.dispatchEvent(

                new PopStateEvent("popstate")

              );

            }}

          />

        }

      />



      {/* HOME */}



      <Route

        path="/home"

        element={

          <>

            <Navbar />

            <Home />

          </>

        }

      />



      {/* ASSESSMENT */}



      <Route

        path="/assessment"

        element={

          <>

            <Navbar />

            <Assessment />

          </>

        }

      />



      {/* RESULTS */}



      <Route

        path="/results"

        element={

          <>

            <Navbar />

            <ResultsDashboard

              assessmentData={assessmentData}

              score={score}

              onContinue={() =>

                setAssessmentStep("routine")

              }

            />

          </>

        }

      />



      {/* INGREDIENT RECOMMENDATIONS */}



      <Route

        path="/ingredients"

        element={

          <>

            <Navbar />

            <IngredientRecommendation />

          </>

        }

      />



      {/* PRODUCT RECOMMENDATIONS */}



      <Route

        path="/products"

        element={

          <>

            <Navbar />

            <ProductRecommendations />

          </>

        }

      />



      {/* ROUTINE */}



      <Route

        path="/routine"

        element={

          <>

            <Navbar />

            <Routine

              assessmentData={assessmentData}

            />

          </>

        }

      />



      {/* PROGRESS */}



      <Route

  path="/progress"

  element={

    <>

      <Navbar />

      <Progress />

    </>

  }

/>



      {/* PROFILE */}



      <Route

        path="/profile"

        element={

          <>

            <Navbar />

            <Profile assessmentData={assessmentData} />

          </>

        }

      />


{/* ADMIN DASHBOARD */}
<Route
  path="/admin"
  element={
    currentUser?.role === "admin" ? (
      <>
        <Navbar />
        <AdminDashboard />
      </>
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>

{/* DERMATOLOGIST DASHBOARD */}
<Route
  path="/dermatologist"
  element={
    currentUser?.role === "dermatologist" ? (
      <>
        <Navbar />
        <DermatologistDashboard />
      </>
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>

{/* CONSULTANT DASHBOARD */}
<Route
  path="/consultant"
  element={
    currentUser?.role === "consultant" ? (
      <>
        <Navbar />
        <ConsultantDashboard />
      </>
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>


      {/* DEFAULT */}



      <Route

        path="*"

        element={

          <Navigate

            to="/login"

            replace

          />

        }

      />

    </Routes>

  );

}



export default App;