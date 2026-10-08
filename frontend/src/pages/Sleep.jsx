
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSleep } from "../services/api";

function Sleep() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const [formData, setFormData] = useState({
    sleep_hours: "",
    sleep_quality: "",
    date: "",
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
      const sleepData = {
        user_id: user.user_id,
        sleep_hours: Number(formData.sleep_hours),
        sleep_quality: Number(formData.sleep_quality),
        date: formData.date,
      };

      await createSleep(sleepData);

      setMessage("Sleep data saved successfully! 🌙");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);
    } catch (err) {
      setError(err.message || "Unable to save sleep data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`

        * {
          box-sizing: border-box;
        }

        .sleep-page {
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
              rgba(101, 174, 163, 0.13),
              transparent 28%
            ),
            radial-gradient(
              circle at 95% 90%,
              rgba(119, 171, 184, 0.12),
              transparent 30%
            ),
            linear-gradient(
              135deg,
              #f7fcfb 0%,
              #edf7f6 50%,
              #f9fcfb 100%
            );
        }


        /* ================================================
           BACKGROUND CIRCLES
        ================================================= */

        .sleep-circle {
          position: absolute;

          border-radius: 50%;

          pointer-events: none;

          animation: sleepFloat 8s ease-in-out infinite;
        }

        .sleep-circle-one {
          width: 280px;
          height: 280px;

          left: -150px;
          top: 12%;

          background: rgba(72, 156, 148, 0.07);
        }

        .sleep-circle-two {
          width: 230px;
          height: 230px;

          right: -110px;
          top: 20%;

          background: rgba(99, 160, 176, 0.07);

          animation-delay: 2s;
        }

        .sleep-circle-three {
          width: 190px;
          height: 190px;

          left: 45%;
          bottom: -130px;

          background: rgba(78, 148, 142, 0.06);

          animation-delay: 4s;
        }

        @keyframes sleepFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-18px);
          }
        }


        /* ================================================
           TOP BAR
        ================================================= */

        .sleep-topbar {
          width: 100%;
          max-width: 1050px;

          margin: 0 auto 25px;

          display: flex;

          align-items: center;

          justify-content: space-between;

          position: relative;

          z-index: 2;
        }

        .sleep-brand {
          display: flex;

          align-items: center;

          gap: 10px;

          cursor: pointer;
        }

        .sleep-brand-icon {
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

        .sleep-brand-name {
          color: #285c54;

          font-size: 14px;

          font-weight: 750;
        }

        .sleep-brand-subtitle {
          margin-top: 2px;

          color: #8aa09b;

          font-size: 9px;

          letter-spacing: 0.6px;
        }

        .sleep-back-button {
          padding: 10px 16px;

          border: 1px solid #dce9e5;

          border-radius: 10px;

          background: rgba(255,255,255,0.75);

          color: #54736d;

          font-family: inherit;

          font-size: 11px;

          font-weight: 650;

          cursor: pointer;

          transition: all 0.2s ease;
        }

        .sleep-back-button:hover {
          background: white;

          color: #2f897b;

          transform: translateY(-1px);

          box-shadow:
            0 7px 18px rgba(45,108,96,0.08);
        }


        /* ================================================
           MAIN CONTAINER
        ================================================= */

        .sleep-container {
          width: 100%;
          max-width: 1050px;

          margin: 0 auto;

          display: grid;

          grid-template-columns: 0.85fr 1.15fr;

          position: relative;

          z-index: 2;

          overflow: hidden;

          border-radius: 28px;

          background: rgba(255,255,255,0.91);

          border: 1px solid rgba(255,255,255,0.9);

          box-shadow:
            0 25px 70px rgba(39,91,81,0.12);

          backdrop-filter: blur(20px);

          animation: sleepAppear 0.55s ease;
        }

        @keyframes sleepAppear {
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

        .sleep-info {
          padding: 50px;

          display: flex;

          flex-direction: column;

          justify-content: center;

          background:
            linear-gradient(
              145deg,
              #e4f5f2,
              #dceff0
            );
        }

        .sleep-info-icon {
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

          animation: moonFloat 4s ease-in-out infinite;
        }

        @keyframes moonFloat {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }

          50% {
            transform: translateY(-7px) rotate(-3deg);
          }
        }

        .sleep-info-label {
          margin: 0 0 10px;

          color: #4b978a;

          font-size: 10px;

          font-weight: 750;

          letter-spacing: 1.7px;
        }

        .sleep-info h1 {
          margin: 0 0 17px;

          color: #28574f;

          font-size: 39px;

          line-height: 1.1;

          letter-spacing: -1px;
        }

        .sleep-info h1 span {
          color: #348c7d;
        }

        .sleep-info-description {
          max-width: 350px;

          margin: 0;

          color: #66847e;

          font-size: 13px;

          line-height: 1.8;
        }


        /* ================================================
           BENEFITS
        ================================================= */

        .sleep-benefits {
          display: flex;

          flex-direction: column;

          gap: 13px;

          margin-top: 32px;
        }

        .sleep-benefit {
          display: flex;

          align-items: center;

          gap: 11px;

          color: #5b7c75;

          font-size: 11px;

          font-weight: 600;
        }

        .sleep-benefit-icon {
          width: 29px;
          height: 29px;

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

        .sleep-form-section {
          padding: 50px;

          display: flex;

          align-items: center;
        }

        .sleep-form-wrapper {
          width: 100%;

          max-width: 470px;

          margin: 0 auto;
        }


        /* ================================================
           FORM HEADER
        ================================================= */

        .sleep-form-header {
          margin-bottom: 30px;
        }

        .sleep-form-header p {
          margin: 0 0 7px;

          color: #68a397;

          font-size: 10px;

          font-weight: 750;

          letter-spacing: 1.5px;
        }

        .sleep-form-header h2 {
          margin: 0 0 7px;

          color: #293f3b;

          font-size: 28px;

          letter-spacing: -0.6px;
        }

        .sleep-form-header span {
          color: #899a96;

          font-size: 11px;

          line-height: 1.6;
        }


        /* ================================================
           FORM
        ================================================= */

        .sleep-form {
          display: flex;

          flex-direction: column;

          gap: 16px;
        }


        /* ================================================
           INPUT CARD
        ================================================= */

        .sleep-input-card {
          padding: 16px;

          border: 1px solid #e0ebe8;

          border-radius: 15px;

          background: #fbfdfc;

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            transform 0.2s ease;
        }

        .sleep-input-card:focus-within {
          border-color: #70b3a7;

          background: white;

          transform: translateY(-1px);

          box-shadow:
            0 8px 25px rgba(48,133,120,0.08);
        }

        .sleep-input-top {
          display: flex;

          align-items: center;

          gap: 11px;

          margin-bottom: 10px;
        }

        .sleep-input-icon {
          width: 35px;
          height: 35px;

          display: flex;

          align-items: center;
          justify-content: center;

          flex-shrink: 0;

          border-radius: 10px;

          background: #edf8f5;

          font-size: 17px;
        }

        .sleep-input-title {
          color: #526963;

          font-size: 11px;

          font-weight: 700;
        }

        .sleep-input-description {
          margin-top: 2px;

          color: #9baaa7;

          font-size: 9px;
        }

        .sleep-input {
          width: 100%;

          height: 43px;

          padding: 0 12px;

          border: 1px solid #e1e9e7;

          border-radius: 10px;

          outline: none;

          background: white;

          color: #30443f;

          font-family: inherit;

          font-size: 12px;

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .sleep-input:hover {
          border-color: #cbded9;
        }

        .sleep-input:focus {
          border-color: #68aa9e;

          box-shadow:
            0 0 0 3px rgba(63,155,141,0.07);
        }

        .sleep-input::placeholder {
          color: #b2bdba;
        }


        /* ================================================
           SLEEP QUALITY
        ================================================= */

        .sleep-quality-display {
          display: flex;

          justify-content: space-between;

          margin-top: 9px;

          color: #9aa8a5;

          font-size: 9px;
        }

        .sleep-quality-value {
          color: #388b7e;

          font-size: 10px;

          font-weight: 750;
        }


        /* ================================================
           SAVE BUTTON
        ================================================= */

        .sleep-save-button {
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

        .sleep-save-button:hover:not(:disabled) {
          transform: translateY(-2px);

          box-shadow:
            0 13px 28px rgba(47,143,131,0.28);
        }

        .sleep-save-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .sleep-save-button:disabled {
          opacity: 0.7;

          cursor: not-allowed;
        }


        /* ================================================
           LOADING
        ================================================= */

        .sleep-loading {
          display: inline-flex;

          align-items: center;

          justify-content: center;

          gap: 8px;
        }

        .sleep-spinner {
          width: 14px;
          height: 14px;

          border: 2px solid rgba(255,255,255,0.4);

          border-top-color: white;

          border-radius: 50%;

          animation: sleepSpin 0.7s linear infinite;
        }

        @keyframes sleepSpin {
          to {
            transform: rotate(360deg);
          }
        }


        /* ================================================
           SUCCESS
        ================================================= */

        .sleep-success {
          margin-top: 15px;

          padding: 12px 14px;

          border-radius: 11px;

          background: #effaf6;

          border: 1px solid #cde9e0;

          color: #328171;

          font-size: 11px;

          text-align: center;

          animation: sleepMessage 0.3s ease;
        }


        /* ================================================
           ERROR
        ================================================= */

        .sleep-error {
          margin-top: 15px;

          padding: 12px 14px;

          border-radius: 11px;

          background: #fff4f2;

          border: 1px solid #f0d8d3;

          color: #ae584d;

          font-size: 11px;

          text-align: center;

          animation: sleepMessage 0.3s ease;
        }

        @keyframes sleepMessage {
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

        .sleep-footer {
          margin-top: 18px;

          color: #a1adaa;

          font-size: 9px;

          text-align: center;

          line-height: 1.5;
        }


        /* ================================================
           RESPONSIVE
        ================================================= */

        @media (max-width: 850px) {

          .sleep-container {
            grid-template-columns: 1fr;
          }

          .sleep-info {
            padding: 40px;
          }

          .sleep-form-section {
            padding: 40px;
          }

          .sleep-benefits {
            flex-direction: row;

            flex-wrap: wrap;
          }
        }


        @media (max-width: 550px) {

          .sleep-page {
            padding: 20px 14px;
          }

          .sleep-topbar {
            margin-bottom: 18px;
          }

          .sleep-brand-name {
            font-size: 12px;
          }

          .sleep-brand-subtitle {
            font-size: 8px;
          }

          .sleep-back-button {
            padding: 8px 11px;

            font-size: 9px;
          }

          .sleep-info {
            padding: 30px 25px;
          }

          .sleep-info-icon {
            width: 55px;
            height: 55px;

            font-size: 25px;
          }

          .sleep-info h1 {
            font-size: 31px;
          }

          .sleep-benefits {
            display: none;
          }

          .sleep-form-section {
            padding: 30px 25px 35px;
          }

          .sleep-form-header h2 {
            font-size: 25px;
          }
        }

      `}</style>


      {/* =====================================================
          PAGE
      ====================================================== */}

      <div className="sleep-page">

        {/* Background */}

        <div className="sleep-circle sleep-circle-one"></div>

        <div className="sleep-circle sleep-circle-two"></div>

        <div className="sleep-circle sleep-circle-three"></div>


        {/* =================================================
            TOP BAR
        ================================================= */}

        <div className="sleep-topbar">

          <div
            className="sleep-brand"
            onClick={() => navigate("/dashboard")}
          >

            <div className="sleep-brand-icon">
              🌿
            </div>

            <div>

              <div className="sleep-brand-name">
                Skin Intelligence
              </div>

              <div className="sleep-brand-subtitle">
                PERSONALIZED SKINCARE
              </div>

            </div>

          </div>


          <button
            className="sleep-back-button"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>

        </div>


        {/* =================================================
            MAIN CONTAINER
        ================================================= */}

        <div className="sleep-container">


          {/* =================================================
              LEFT INFORMATION
          ================================================= */}

          <section className="sleep-info">

            <div className="sleep-info-icon">
              🌙
            </div>

            <p className="sleep-info-label">
              REST & RECOVERY
            </p>

            <h1>
              Better sleep,
              <br />
              <span>better wellness.</span>
            </h1>

            <p className="sleep-info-description">
              Sleep plays an important role in overall
              wellness. Track your sleep duration and
              quality to understand your daily habits
              more clearly.
            </p>


            <div className="sleep-benefits">

              <div className="sleep-benefit">

                <span className="sleep-benefit-icon">
                  🌙
                </span>

                Track sleep duration

              </div>


              <div className="sleep-benefit">

                <span className="sleep-benefit-icon">
                  ⭐
                </span>

                Monitor sleep quality

              </div>


              <div className="sleep-benefit">

                <span className="sleep-benefit-icon">
                  📅
                </span>

                Keep daily records

              </div>

            </div>

          </section>


          {/* =================================================
              FORM
          ================================================= */}

          <section className="sleep-form-section">

            <div className="sleep-form-wrapper">


              <div className="sleep-form-header">

                <p>
                  SLEEP TRACKER
                </p>

                <h2>
                  How did you sleep?
                </h2>

                <span>
                  Record your latest night's sleep below.
                </span>

              </div>


              <form
                className="sleep-form"
                onSubmit={handleSubmit}
              >


                {/* =================================================
                    SLEEP HOURS
                ================================================= */}

                <div className="sleep-input-card">

                  <div className="sleep-input-top">

                    <span className="sleep-input-icon">
                      🛌
                    </span>

                    <div>

                      <div className="sleep-input-title">
                        Sleep Hours
                      </div>

                      <div className="sleep-input-description">
                        How long did you sleep?
                      </div>

                    </div>

                  </div>


                  <input
                    className="sleep-input"
                    type="number"
                    name="sleep_hours"
                    placeholder="e.g. 7.5"
                    step="0.1"
                    min="0"
                    max="24"
                    value={formData.sleep_hours}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* =================================================
                    SLEEP QUALITY
                ================================================= */}

                <div className="sleep-input-card">

                  <div className="sleep-input-top">

                    <span className="sleep-input-icon">
                      ⭐
                    </span>

                    <div>

                      <div className="sleep-input-title">
                        Sleep Quality
                      </div>

                      <div className="sleep-input-description">
                        Rate how restful your sleep was
                      </div>

                    </div>

                    <span
                      className="sleep-quality-value"
                      style={{
                        marginLeft: "auto",
                      }}
                    >
                      {formData.sleep_quality
                        ? `${formData.sleep_quality}/10`
                        : "—"}
                    </span>

                  </div>


                  <input
                    className="sleep-input"
                    type="number"
                    name="sleep_quality"
                    placeholder="1-10"
                    min="1"
                    max="10"
                    value={formData.sleep_quality}
                    onChange={handleChange}
                    required
                  />


                  <div className="sleep-quality-display">

                    <span>
                      Poor
                    </span>

                    <span>
                      Excellent
                    </span>

                  </div>

                </div>


                {/* =================================================
                    DATE
                ================================================= */}

                <div className="sleep-input-card">

                  <div className="sleep-input-top">

                    <span className="sleep-input-icon">
                      📅
                    </span>

                    <div>

                      <div className="sleep-input-title">
                        Sleep Date
                      </div>

                      <div className="sleep-input-description">
                        Which night are you recording?
                      </div>

                    </div>

                  </div>


                  <input
                    className="sleep-input"
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* =================================================
                    SAVE
                ================================================= */}

                <button
                  className="sleep-save-button"
                  type="submit"
                  disabled={loading}
                >

                  {loading ? (

                    <span className="sleep-loading">

                      <span className="sleep-spinner"></span>

                      Saving sleep data...

                    </span>

                  ) : (

                    <>
                      Save Sleep Data

                      <span style={{ marginLeft: "8px" }}>
                        →
                      </span>
                    </>

                  )}

                </button>

              </form>


              {/* Success */}

              {message && (

                <div className="sleep-success">
                  ✓ {message}
                </div>

              )}


              {/* Error */}

              {error && (

                <div className="sleep-error">
                  ⚠️ {error}
                </div>

              )}


              <div className="sleep-footer">
                Consistent sleep tracking can help you understand
                your wellness patterns over time.
              </div>

            </div>

          </section>

        </div>

      </div>
    </>
  );
}

export default Sleep;