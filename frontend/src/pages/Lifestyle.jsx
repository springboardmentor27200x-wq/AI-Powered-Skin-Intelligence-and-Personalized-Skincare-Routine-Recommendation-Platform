
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createLifestyle } from "../services/api";

function Lifestyle() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const [formData, setFormData] = useState({
    water_intake: "",
    exercise_minutes: "",
    stress_level: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setMessage("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!user) {
      setError("Please login first.");
      return;
    }

    setLoading(true);

    try {
      const lifestyleData = {
        user_id: user.user_id,
        water_intake: Number(formData.water_intake),
        exercise_minutes: Number(formData.exercise_minutes),
        stress_level: Number(formData.stress_level),
      };

      await createLifestyle(lifestyleData);

      setMessage("Lifestyle data saved successfully! 🎉");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);
    } catch (err) {
      setError(err.message || "Unable to save lifestyle data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* =====================================================
          LIFESTYLE PAGE CSS
      ====================================================== */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .lifestyle-page {
          min-height: 100vh;

          padding: 35px 20px;

          position: relative;
          overflow: hidden;

          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

          background:
            radial-gradient(
              circle at 5% 10%,
              rgba(79, 166, 149, 0.14),
              transparent 28%
            ),
            radial-gradient(
              circle at 95% 90%,
              rgba(112, 181, 165, 0.12),
              transparent 30%
            ),
            linear-gradient(
              135deg,
              #f7fcfa 0%,
              #edf8f5 50%,
              #f8fbfa 100%
            );
        }


        /* ================================================
           DECORATIVE CIRCLES
        ================================================= */

        .life-circle {
          position: absolute;

          border-radius: 50%;

          pointer-events: none;

          animation: lifeFloat 7s ease-in-out infinite;
        }

        .life-circle-one {
          width: 280px;
          height: 280px;

          left: -150px;
          top: 10%;

          background: rgba(66, 157, 141, 0.08);
        }

        .life-circle-two {
          width: 220px;
          height: 220px;

          right: -110px;
          top: 15%;

          background: rgba(92, 177, 160, 0.08);

          animation-delay: 2s;
        }

        .life-circle-three {
          width: 190px;
          height: 190px;

          left: 45%;
          bottom: -130px;

          background: rgba(73, 151, 137, 0.06);

          animation-delay: 4s;
        }

        @keyframes lifeFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-18px);
          }
        }


        /* ================================================
           TOP NAVIGATION
        ================================================= */

        .life-topbar {
          width: 100%;
          max-width: 1050px;

          margin: 0 auto 25px;

          display: flex;

          align-items: center;

          justify-content: space-between;

          position: relative;
          z-index: 2;
        }

        .life-brand {
          display: flex;

          align-items: center;

          gap: 10px;

          cursor: pointer;
        }

        .life-brand-icon {
          width: 40px;
          height: 40px;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 13px;

          background: white;

          box-shadow:
            0 7px 20px rgba(45, 108, 96, 0.08);

          font-size: 19px;
        }

        .life-brand-text {
          color: #285c54;

          font-size: 14px;

          font-weight: 750;
        }

        .life-brand-subtitle {
          color: #8aa09b;

          font-size: 9px;

          margin-top: 2px;

          letter-spacing: 0.6px;
        }

        .life-back-button {
          border: 1px solid #dce9e5;

          background: rgba(255,255,255,0.75);

          color: #54736d;

          padding: 10px 16px;

          border-radius: 10px;

          font-family: inherit;

          font-size: 11px;

          font-weight: 650;

          cursor: pointer;

          transition: all 0.2s ease;
        }

        .life-back-button:hover {
          background: white;

          color: #2f897b;

          transform: translateY(-1px);

          box-shadow:
            0 7px 18px rgba(45, 108, 96, 0.08);
        }


        /* ================================================
           MAIN CARD
        ================================================= */

        .life-container {
          width: 100%;
          max-width: 1050px;

          margin: 0 auto;

          display: grid;

          grid-template-columns: 0.85fr 1.15fr;

          position: relative;
          z-index: 2;

          overflow: hidden;

          border-radius: 28px;

          background: rgba(255,255,255,0.90);

          border: 1px solid rgba(255,255,255,0.9);

          box-shadow:
            0 25px 70px rgba(39, 91, 81, 0.12);

          backdrop-filter: blur(20px);

          animation: lifeAppear 0.55s ease;
        }

        @keyframes lifeAppear {
          from {
            opacity: 0;

            transform: translateY(18px);
          }

          to {
            opacity: 1;

            transform: translateY(0);
          }
        }


        /* ================================================
           LEFT INFORMATION PANEL
        ================================================= */

        .life-info {
          padding: 50px;

          display: flex;

          flex-direction: column;

          justify-content: center;

          background:
            linear-gradient(
              145deg,
              #e4f5f0,
              #d9eee8
            );
        }

        .life-info-icon {
          width: 68px;
          height: 68px;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 21px;

          margin-bottom: 27px;

          background: rgba(255,255,255,0.75);

          box-shadow:
            0 12px 25px rgba(45,108,96,0.08);

          font-size: 32px;

          animation: iconFloat 4s ease-in-out infinite;
        }

        @keyframes iconFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-7px);
          }
        }

        .life-info-label {
          margin: 0 0 10px;

          color: #4b978a;

          font-size: 10px;

          font-weight: 750;

          letter-spacing: 1.7px;
        }

        .life-info h1 {
          margin: 0 0 17px;

          color: #28574f;

          font-size: 39px;

          line-height: 1.1;

          letter-spacing: -1px;
        }

        .life-info h1 span {
          color: #348c7d;
        }

        .life-info-description {
          max-width: 350px;

          margin: 0;

          color: #66847e;

          font-size: 13px;

          line-height: 1.8;
        }


        /* ================================================
           BENEFITS
        ================================================= */

        .life-benefits {
          display: flex;

          flex-direction: column;

          gap: 13px;

          margin-top: 32px;
        }

        .life-benefit {
          display: flex;

          align-items: center;

          gap: 11px;

          color: #5b7c75;

          font-size: 11px;

          font-weight: 600;
        }

        .life-benefit-icon {
          width: 28px;
          height: 28px;

          display: flex;

          align-items: center;
          justify-content: center;

          flex-shrink: 0;

          border-radius: 9px;

          background: rgba(255,255,255,0.72);

          font-size: 14px;
        }


        /* ================================================
           FORM SECTION
        ================================================= */

        .life-form-section {
          padding: 50px;

          display: flex;

          align-items: center;
        }

        .life-form-wrapper {
          width: 100%;

          max-width: 470px;

          margin: 0 auto;
        }

        .life-form-header {
          margin-bottom: 30px;
        }

        .life-form-header p {
          margin: 0 0 7px;

          color: #68a397;

          font-size: 10px;

          font-weight: 750;

          letter-spacing: 1.5px;
        }

        .life-form-header h2 {
          margin: 0 0 7px;

          color: #293f3b;

          font-size: 28px;

          letter-spacing: -0.6px;
        }

        .life-form-header span {
          color: #899a96;

          font-size: 11px;
        }


        /* ================================================
           FORM
        ================================================= */

        .life-form {
          display: flex;

          flex-direction: column;

          gap: 18px;
        }


        /* Input Card */

        .life-input-card {
          padding: 17px;

          border: 1px solid #e0ebe8;

          border-radius: 15px;

          background: #fbfdfc;

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            transform 0.2s ease;
        }

        .life-input-card:focus-within {
          border-color: #70b3a7;

          background: white;

          transform: translateY(-1px);

          box-shadow:
            0 8px 25px rgba(48, 133, 120, 0.08);
        }

        .life-input-top {
          display: flex;

          align-items: center;

          justify-content: space-between;

          margin-bottom: 10px;
        }

        .life-label-area {
          display: flex;

          align-items: center;

          gap: 10px;
        }

        .life-input-icon {
          width: 34px;
          height: 34px;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 10px;

          background: #edf8f5;

          font-size: 17px;
        }

        .life-input-label {
          color: #526963;

          font-size: 11px;

          font-weight: 700;
        }

        .life-input-unit {
          color: #9baaa7;

          font-size: 9px;
        }

        .life-input {
          width: 100%;

          height: 43px;

          padding: 0 12px;

          border: 1px solid #e1e9e7;

          border-radius: 10px;

          outline: none;

          background: white;

          color: #30443f;

          font-family: inherit;

          font-size: 13px;

          transition: border-color 0.2s ease;
        }

        .life-input:focus {
          border-color: #68aa9e;
        }

        .life-input::placeholder {
          color: #b2bdba;
        }


        /* Remove number arrows */

        .life-input::-webkit-inner-spin-button,
        .life-input::-webkit-outer-spin-button {
          opacity: 0.5;
        }


        /* ================================================
           STRESS RANGE
        ================================================= */

        .stress-display {
          margin-top: 10px;

          display: flex;

          align-items: center;

          justify-content: space-between;

          color: #98a7a4;

          font-size: 9px;
        }

        .stress-value {
          color: #388b7e;

          font-weight: 750;

          font-size: 10px;
        }


        /* ================================================
           SAVE BUTTON
        ================================================= */

        .life-save-button {
          width: 100%;

          height: 49px;

          margin-top: 5px;

          border: none;

          border-radius: 12px;

          background:
            linear-gradient(
              135deg,
              #3c9a8b,
              #277b70
            );

          color: white;

          font-family: inherit;

          font-size: 12px;

          font-weight: 700;

          cursor: pointer;

          box-shadow:
            0 9px 22px rgba(47,143,131,0.20);

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            opacity 0.2s ease;
        }

        .life-save-button:hover:not(:disabled) {
          transform: translateY(-2px);

          box-shadow:
            0 13px 28px rgba(47,143,131,0.28);
        }

        .life-save-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .life-save-button:disabled {
          opacity: 0.7;

          cursor: not-allowed;
        }


        /* ================================================
           LOADING
        ================================================= */

        .life-loading {
          display: inline-flex;

          align-items: center;

          justify-content: center;

          gap: 8px;
        }

        .life-spinner {
          width: 14px;
          height: 14px;

          border: 2px solid rgba(255,255,255,0.4);

          border-top-color: white;

          border-radius: 50%;

          animation: lifeSpin 0.7s linear infinite;
        }

        @keyframes lifeSpin {
          to {
            transform: rotate(360deg);
          }
        }


        /* ================================================
           SUCCESS MESSAGE
        ================================================= */

        .life-success {
          margin-top: 15px;

          padding: 12px 14px;

          border-radius: 11px;

          background: #effaf6;

          border: 1px solid #cde9e0;

          color: #328171;

          font-size: 11px;

          text-align: center;

          animation: messageAppear 0.3s ease;
        }


        /* ================================================
           ERROR MESSAGE
        ================================================= */

        .life-error {
          margin-top: 15px;

          padding: 12px 14px;

          border-radius: 11px;

          background: #fff4f2;

          border: 1px solid #f0d8d3;

          color: #ae584d;

          font-size: 11px;

          text-align: center;

          animation: messageAppear 0.3s ease;
        }

        @keyframes messageAppear {
          from {
            opacity: 0;

            transform: translateY(-5px);
          }

          to {
            opacity: 1;

            transform: translateY(0);
          }
        }


        /* ================================================
           FOOTER
        ================================================= */

        .life-footer {
          margin-top: 20px;

          color: #a1adaa;

          font-size: 9px;

          text-align: center;

          line-height: 1.5;
        }


        /* ================================================
           RESPONSIVE
        ================================================= */

        @media (max-width: 850px) {

          .life-container {
            grid-template-columns: 1fr;
          }

          .life-info {
            padding: 40px;
          }

          .life-form-section {
            padding: 40px;
          }

          .life-benefits {
            flex-direction: row;

            flex-wrap: wrap;
          }
        }


        @media (max-width: 550px) {

          .lifestyle-page {
            padding: 20px 14px;
          }

          .life-topbar {
            margin-bottom: 18px;
          }

          .life-brand-text {
            font-size: 12px;
          }

          .life-brand-subtitle {
            font-size: 8px;
          }

          .life-back-button {
            padding: 8px 11px;

            font-size: 9px;
          }

          .life-info {
            padding: 30px 25px;
          }

          .life-info-icon {
            width: 55px;
            height: 55px;

            font-size: 25px;
          }

          .life-info h1 {
            font-size: 31px;
          }

          .life-benefits {
            display: none;
          }

          .life-form-section {
            padding: 30px 25px 35px;
          }

          .life-form-header h2 {
            font-size: 25px;
          }
        }

      `}</style>


      {/* =====================================================
          PAGE
      ====================================================== */}

      <div className="lifestyle-page">

        {/* Decorative background */}

        <div className="life-circle life-circle-one"></div>

        <div className="life-circle life-circle-two"></div>

        <div className="life-circle life-circle-three"></div>


        {/* =================================================
            TOP BAR
        ================================================= */}

        <div className="life-topbar">

          <div
            className="life-brand"
            onClick={() => navigate("/dashboard")}
          >

            <div className="life-brand-icon">
              🌿
            </div>

            <div>

              <div className="life-brand-text">
                Skin Intelligence
              </div>

              <div className="life-brand-subtitle">
                PERSONALIZED SKINCARE
              </div>

            </div>

          </div>


          <button
            className="life-back-button"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>

        </div>


        {/* =================================================
            MAIN CONTAINER
        ================================================= */}

        <div className="life-container">

          {/* =================================================
              INFORMATION PANEL
          ================================================= */}

          <section className="life-info">

            <div className="life-info-icon">
              💧
            </div>

            <p className="life-info-label">
              DAILY WELLNESS
            </p>

            <h1>
              Your lifestyle
              <br />
              <span>affects your skin.</span>
            </h1>

            <p className="life-info-description">
              Small daily habits can make a meaningful
              difference to your skin. Track your hydration,
              movement, and stress to understand your
              overall wellness better.
            </p>


            <div className="life-benefits">

              <div className="life-benefit">

                <span className="life-benefit-icon">
                  💧
                </span>

                Track hydration

              </div>


              <div className="life-benefit">

                <span className="life-benefit-icon">
                  🏃
                </span>

                Monitor activity

              </div>


              <div className="life-benefit">

                <span className="life-benefit-icon">
                  🧘
                </span>

                Understand stress

              </div>

            </div>

          </section>


          {/* =================================================
              FORM SECTION
          ================================================= */}

          <section className="life-form-section">

            <div className="life-form-wrapper">

              <div className="life-form-header">

                <p>
                  WELLNESS TRACKER
                </p>

                <h2>
                  How was your day?
                </h2>

                <span>
                  Enter today's lifestyle information below.
                </span>

              </div>


              <form
                className="life-form"
                onSubmit={handleSubmit}
              >

                {/* =================================================
                    WATER
                ================================================= */}

                <div className="life-input-card">

                  <div className="life-input-top">

                    <div className="life-label-area">

                      <span className="life-input-icon">
                        💧
                      </span>

                      <div>

                        <div className="life-input-label">
                          Water Intake
                        </div>

                        <div className="life-input-unit">
                          Litres consumed today
                        </div>

                      </div>

                    </div>

                    <span className="life-input-unit">
                      L / day
                    </span>

                  </div>


                  <input
                    className="life-input"
                    type="number"
                    name="water_intake"
                    placeholder="e.g. 2.5"
                    step="0.1"
                    min="0"
                    max="20"
                    value={formData.water_intake}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* =================================================
                    EXERCISE
                ================================================= */}

                <div className="life-input-card">

                  <div className="life-input-top">

                    <div className="life-label-area">

                      <span className="life-input-icon">
                        🏃
                      </span>

                      <div>

                        <div className="life-input-label">
                          Exercise
                        </div>

                        <div className="life-input-unit">
                          Active minutes today
                        </div>

                      </div>

                    </div>

                    <span className="life-input-unit">
                      min
                    </span>

                  </div>


                  <input
                    className="life-input"
                    type="number"
                    name="exercise_minutes"
                    placeholder="e.g. 30"
                    min="0"
                    max="1440"
                    value={formData.exercise_minutes}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* =================================================
                    STRESS
                ================================================= */}

                <div className="life-input-card">

                  <div className="life-input-top">

                    <div className="life-label-area">

                      <span className="life-input-icon">
                        🧘
                      </span>

                      <div>

                        <div className="life-input-label">
                          Stress Level
                        </div>

                        <div className="life-input-unit">
                          How stressed did you feel?
                        </div>

                      </div>

                    </div>

                    <span className="stress-value">
                      {formData.stress_level
                        ? `${formData.stress_level}/10`
                        : "—"}
                    </span>

                  </div>


                  <input
                    className="life-input"
                    type="number"
                    name="stress_level"
                    placeholder="1-10"
                    min="1"
                    max="10"
                    value={formData.stress_level}
                    onChange={handleChange}
                    required
                  />


                  <div className="stress-display">

                    <span>
                      Low stress
                    </span>

                    <span>
                      High stress
                    </span>

                  </div>

                </div>


                {/* =================================================
                    SAVE
                ================================================= */}

                <button
                  className="life-save-button"
                  type="submit"
                  disabled={loading}
                >

                  {loading ? (

                    <span className="life-loading">

                      <span className="life-spinner"></span>

                      Saving your data...

                    </span>

                  ) : (

                    <>
                      Save Lifestyle Data
                      <span style={{ marginLeft: "8px" }}>
                        →
                      </span>
                    </>

                  )}

                </button>

              </form>


              {/* Success */}

              {message && (
                <div className="life-success">
                  ✓ {message}
                </div>
              )}


              {/* Error */}

              {error && (
                <div className="life-error">
                  ⚠️ {error}
                </div>
              )}


              <div className="life-footer">
                Your lifestyle information helps build a more
                personalized skincare experience.
              </div>

            </div>

          </section>

        </div>

      </div>
    </>
  );
}

export default Lifestyle;