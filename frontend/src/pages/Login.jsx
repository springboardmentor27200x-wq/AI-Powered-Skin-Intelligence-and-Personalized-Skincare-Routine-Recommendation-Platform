import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";
import { useAuth } from "../context/useAuth";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // =====================================================
  // HANDLE INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // =====================================================
  // HANDLE LOGIN
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      // Login API
      const data = await loginUser(formData);

      console.log("Login response:", data);

      // Save authentication data
      login(data);

      // Get user role
      const role = data?.user?.role ?? data?.role ?? "";

      console.log("Logged-in role:", role);

      // Role-based redirection
      switch (role.toLowerCase()) {
        case "dermatologist":
          navigate("/dermatologist", {
            replace: true,
          });
          break;

        case "consultant":
          navigate("/consultant", {
            replace: true,
          });
          break;

        case "admin":
          navigate("/admin", {
            replace: true,
          });
          break;

        case "user":
        default:
          navigate("/dashboard", {
            replace: true,
          });
          break;
      }
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.message || "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* =====================================================
          LOGIN PAGE STYLES
      ====================================================== */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        /* =====================================================
           MAIN PAGE
        ====================================================== */

        .login-page {
          min-height: 100vh;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 30px;

          position: relative;
          overflow: hidden;

          background:
            radial-gradient(
              circle at 10% 10%,
              rgba(92, 181, 164, 0.20),
              transparent 30%
            ),
            radial-gradient(
              circle at 90% 90%,
              rgba(120, 174, 162, 0.15),
              transparent 30%
            ),
            linear-gradient(
              135deg,
              #f7fcfa 0%,
              #edf8f5 50%,
              #f8fbfa 100%
            );

          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }


        /* =====================================================
           BACKGROUND CIRCLES
        ====================================================== */

        .login-circle {
          position: absolute;

          border-radius: 50%;

          pointer-events: none;

          filter: blur(1px);

          animation:
            floatCircle
            7s
            ease-in-out
            infinite;
        }

        .login-circle-one {
          width: 260px;
          height: 260px;

          top: -100px;
          left: -80px;

          background:
            rgba(83, 168, 151, 0.10);
        }

        .login-circle-two {
          width: 220px;
          height: 220px;

          right: -70px;
          top: 20%;

          background:
            rgba(105, 188, 171, 0.09);

          animation-delay: 1.5s;
        }

        .login-circle-three {
          width: 180px;
          height: 180px;

          left: 20%;
          bottom: -100px;

          background:
            rgba(74, 145, 133, 0.08);

          animation-delay: 3s;
        }

        @keyframes floatCircle {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-18px);
          }
        }


        /* =====================================================
           MAIN LOGIN WRAPPER
        ====================================================== */

        .login-wrapper {
          width: 100%;
          max-width: 1000px;

          display: grid;

          grid-template-columns:
            1fr
            1fr;

          position: relative;

          z-index: 2;

          overflow: hidden;

          border-radius: 28px;

          background:
            rgba(255, 255, 255, 0.90);

          border:
            1px solid
            rgba(255, 255, 255, 0.9);

          box-shadow:
            0
            30px
            80px
            rgba(38, 83, 75, 0.13);

          backdrop-filter:
            blur(20px);

          animation:
            loginAppear
            0.65s
            ease;
        }

        @keyframes loginAppear {
          from {
            opacity: 0;
            transform: translateY(25px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }


        /* =====================================================
           LEFT BRAND SECTION
        ====================================================== */

        .login-brand {
          position: relative;

          min-height: 620px;

          display: flex;

          flex-direction: column;

          justify-content: center;

          padding: 55px;

          overflow: hidden;

          background:
            linear-gradient(
              145deg,
              #e4f5f0,
              #d8eee8 55%,
              #eaf7f4
            );
        }


        /* Decorative ring */

        .login-brand::before {
          content: "";

          position: absolute;

          width: 300px;
          height: 300px;

          right: -130px;
          top: -110px;

          border-radius: 50%;

          border:
            45px
            solid
            rgba(255, 255, 255, 0.25);
        }


        /* Bottom decoration */

        .login-brand::after {
          content: "";

          position: absolute;

          width: 220px;
          height: 220px;

          left: -130px;
          bottom: -110px;

          border-radius: 50%;

          background:
            rgba(255, 255, 255, 0.18);
        }


        /* =====================================================
           BRAND LOGO
        ====================================================== */

        .brand-logo {
          display: flex;

          align-items: center;

          gap: 12px;

          margin-bottom: 65px;

          position: relative;

          z-index: 2;
        }

        .brand-logo-icon {
          width: 48px;
          height: 48px;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 15px;

          background:
            rgba(255, 255, 255, 0.75);

          box-shadow:
            0
            8px
            20px
            rgba(45, 108, 96, 0.10);

          font-size: 23px;
        }

        .brand-logo h2 {
          margin: 0;

          color: #245d54;

          font-size: 21px;

          font-weight: 800;

          letter-spacing: -0.4px;
        }

        .brand-logo p {
          margin: 4px 0 0;

          color: #71918a;

          font-size: 9px;

          font-weight: 700;

          letter-spacing: 1.2px;
        }


        /* =====================================================
           BRAND CONTENT
        ====================================================== */

        .brand-content {
          position: relative;

          z-index: 2;
        }

        .brand-small-title {
          margin-bottom: 12px;

          color: #4d9387;

          font-size: 11px;

          font-weight: 750;

          letter-spacing: 1.8px;
        }

        .brand-content h1 {
          max-width: 420px;

          margin:
            0
            0
            18px;

          color: #24544d;

          font-size:
            clamp(
              35px,
              4vw,
              48px
            );

          line-height: 1.08;

          letter-spacing: -1.5px;
        }

        .brand-content h1 span {
          color: #318b7c;
        }

        .brand-description {
          max-width: 390px;

          color: #66847e;

          font-size: 14px;

          line-height: 1.8;
        }


        /* =====================================================
           FEATURES
        ====================================================== */

        .brand-features {
          display: flex;

          flex-direction: column;

          gap: 13px;

          margin-top: 35px;

          position: relative;

          z-index: 2;
        }

        .brand-feature {
          display: flex;

          align-items: center;

          gap: 10px;

          color: #587770;

          font-size: 12px;

          font-weight: 550;
        }

        .feature-check {
          width: 25px;
          height: 25px;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background:
            rgba(255, 255, 255, 0.75);

          color: #378d7e;

          font-size: 12px;

          box-shadow:
            0
            5px
            12px
            rgba(45, 108, 96, 0.08);
        }


        /* =====================================================
           RIGHT LOGIN SECTION
        ====================================================== */

        .login-form-section {
          display: flex;

          align-items: center;

          justify-content: center;

          padding: 50px;
        }

        .login-card {
          width: 100%;

          max-width: 360px;
        }


        /* =====================================================
           LOGIN HEADING
        ====================================================== */

        .login-heading {
          margin-bottom: 35px;
        }

        .login-heading .mini-label {
          margin-bottom: 8px;

          color: #69a99e;

          font-size: 10px;

          font-weight: 750;

          letter-spacing: 1.5px;
        }

        .login-heading h2 {
          margin:
            0
            0
            8px;

          color: #253c38;

          font-size: 31px;

          font-weight: 750;

          letter-spacing: -0.7px;
        }

        .login-heading p {
          margin: 0;

          color: #899793;

          font-size: 12px;

          line-height: 1.6;
        }


        /* =====================================================
           FORM
        ====================================================== */

        .login-form {
          display: flex;

          flex-direction: column;

          gap: 20px;
        }

        .input-group {
          display: flex;

          flex-direction: column;

          gap: 8px;
        }

        .input-group label {
          color: #536460;

          font-size: 11px;

          font-weight: 650;
        }


        /* =====================================================
           INPUT
        ====================================================== */

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;

          left: 14px;
          top: 50%;

          transform:
            translateY(-50%);

          color: #91aaa5;

          font-size: 15px;

          pointer-events: none;
        }

        .login-input {
          width: 100%;

          height: 48px;

          padding:
            0
            15px
            0
            42px;

          border:
            1px
            solid
            #dfe9e6;

          border-radius: 12px;

          outline: none;

          background: #fbfdfc;

          color: #31443f;

          font-family: inherit;

          font-size: 13px;

          transition:
            border-color
            0.2s
            ease,
            box-shadow
            0.2s
            ease,
            background
            0.2s
            ease;
        }

        .login-input::placeholder {
          color: #aab7b4;
        }

        .login-input:hover {
          border-color: #c7ddd8;
        }

        .login-input:focus {
          border-color: #55a397;

          background: #ffffff;

          box-shadow:
            0
            0
            0
            4px
            rgba(63, 155, 141, 0.10);
        }


        /* =====================================================
           PASSWORD TOGGLE
        ====================================================== */

        .password-toggle {
          position: absolute;

          right: 13px;
          top: 50%;

          transform:
            translateY(-50%);

          border: none;

          background:
            transparent;

          color: #91a29f;

          cursor: pointer;

          font-size: 15px;

          padding: 5px;
        }

        .password-toggle:hover {
          color: #35897c;
        }


        /* =====================================================
           LOGIN BUTTON
        ====================================================== */

        .login-button {
          width: 100%;

          height: 49px;

          margin-top: 5px;

          border: none;

          border-radius: 12px;

          background:
            linear-gradient(
              135deg,
              #3b9b8c,
              #277b70
            );

          color: white;

          font-family: inherit;

          font-size: 13px;

          font-weight: 700;

          letter-spacing: 0.2px;

          cursor: pointer;

          box-shadow:
            0
            9px
            22px
            rgba(47, 143, 131, 0.22);

          transition:
            transform
            0.2s
            ease,
            box-shadow
            0.2s
            ease,
            opacity
            0.2s
            ease;
        }

        .login-button:hover:not(:disabled) {
          transform:
            translateY(-2px);

          box-shadow:
            0
            13px
            28px
            rgba(47, 143, 131, 0.28);
        }

        .login-button:active:not(:disabled) {
          transform:
            translateY(0);
        }

        .login-button:disabled {
          cursor: not-allowed;

          opacity: 0.7;
        }


        /* =====================================================
           LOADING
        ====================================================== */

        .login-loading {
          display: inline-flex;

          align-items: center;

          justify-content: center;

          gap: 8px;
        }

        .loading-dot {
          width: 13px;
          height: 13px;

          border:
            2px
            solid
            rgba(255, 255, 255, 0.4);

          border-top-color: white;

          border-radius: 50%;

          animation:
            loginSpin
            0.7s
            linear
            infinite;
        }

        @keyframes loginSpin {
          to {
            transform: rotate(360deg);
          }
        }


        /* =====================================================
           ERROR
        ====================================================== */

        .login-error {
          display: flex;

          align-items: flex-start;

          gap: 9px;

          margin-top: 15px;

          padding:
            12px
            13px;

          border-radius: 10px;

          background: #fff4f2;

          border:
            1px
            solid
            #f1d8d3;

          color: #ad554b;

          font-size: 11px;

          line-height: 1.5;

          animation:
            errorAppear
            0.25s
            ease;
        }

        @keyframes errorAppear {
          from {
            opacity: 0;

            transform:
              translateY(-5px);
          }

          to {
            opacity: 1;

            transform:
              translateY(0);
          }
        }


        /* =====================================================
           REGISTER
        ====================================================== */

        .register-text {
          margin-top: 27px;

          padding-top: 22px;

          border-top:
            1px
            solid
            #edf1f0;

          color: #8a9794;

          font-size: 11px;

          text-align: center;
        }

        .register-text a {
          color: #328a7c;

          font-weight: 700;

          text-decoration: none;

          transition:
            color
            0.2s
            ease;
        }

        .register-text a:hover {
          color: #216c61;

          text-decoration: underline;
        }


        /* =====================================================
           SECURITY
        ====================================================== */

        .security-note {
          display: flex;

          align-items: center;

          justify-content: center;

          gap: 6px;

          margin-top: 22px;

          color: #a0aba8;

          font-size: 9px;
        }


        /* =====================================================
           TABLET
        ====================================================== */

        @media (max-width: 850px) {

          .login-wrapper {
            grid-template-columns: 1fr;

            max-width: 520px;
          }

          .login-brand {
            min-height: auto;

            padding:
              35px
              40px;
          }

          .brand-logo {
            margin-bottom: 35px;
          }

          .brand-content h1 {
            font-size: 38px;
          }

          .brand-features {
            flex-direction: row;

            flex-wrap: wrap;

            margin-top: 25px;
          }

          .login-form-section {
            padding: 40px;
          }
        }


        /* =====================================================
           MOBILE
        ====================================================== */

        @media (max-width: 550px) {

          .login-page {
            padding: 15px;
          }

          .login-wrapper {
            border-radius: 22px;
          }

          .login-brand {
            padding:
              30px
              25px;
          }

          .brand-logo {
            margin-bottom: 30px;
          }

          .brand-content h1 {
            font-size: 32px;
          }

          .brand-description {
            font-size: 12px;
          }

          .brand-features {
            display: none;
          }

          .login-form-section {
            padding:
              35px
              25px
              40px;
          }

          .login-heading h2 {
            font-size: 27px;
          }
        }

      `}</style>


      {/* =====================================================
          LOGIN PAGE
      ====================================================== */}

      <div className="login-page">

        {/* Decorative background */}

        <div
          className="login-circle login-circle-one"
        />

        <div
          className="login-circle login-circle-two"
        />

        <div
          className="login-circle login-circle-three"
        />


        {/* =================================================
            MAIN CARD
        ================================================= */}

        <div className="login-wrapper">


          {/* =================================================
              LEFT BRANDING SECTION
          ================================================= */}

          <section className="login-brand">

            {/* Brand */}

            <div className="brand-logo">

              <div className="brand-logo-icon">
                🌿
              </div>

              <div>

                <h2>
                  DermaGenie
                </h2>

                <p>
                  AI SKINCARE ASSISTANT
                </p>

              </div>

            </div>


            {/* Main message */}

            <div className="brand-content">

              <p className="brand-small-title">
                YOUR SKIN. YOUR DATA. YOUR CARE.
              </p>

              <h1>

                Understand your skin.
                <br />

                <span>
                  Care for it better.
                </span>

              </h1>

              <p className="brand-description">

                Your intelligent skincare assistant for
                personalized skin insights, lifestyle
                tracking, and smarter skincare decisions.

              </p>

            </div>


            {/* Features */}

            <div className="brand-features">

              <div className="brand-feature">

                <span className="feature-check">
                  ✓
                </span>

                Personalized skin insights

              </div>


              <div className="brand-feature">

                <span className="feature-check">
                  ✓
                </span>

                Lifestyle & wellness tracking

              </div>


              <div className="brand-feature">

                <span className="feature-check">
                  ✓
                </span>

                Your skincare journey in one place

              </div>

            </div>

          </section>


          {/* =================================================
              RIGHT LOGIN SECTION
          ================================================= */}

          <section className="login-form-section">

            <div className="login-card">


              {/* Heading */}

              <div className="login-heading">

                <p className="mini-label">
                  WELCOME BACK
                </p>

                <h2>
                  Sign in 👋
                </h2>

                <p>
                  Continue your personalized skincare journey.
                </p>

              </div>


              {/* =================================================
                  LOGIN FORM
              ================================================= */}

              <form
                className="login-form"
                onSubmit={handleSubmit}
              >


                {/* EMAIL */}

                <div className="input-group">

                  <label htmlFor="email">
                    Email address
                  </label>

                  <div className="input-wrapper">

                    <span className="input-icon">
                      ✉
                    </span>

                    <input
                      id="email"
                      className="login-input"
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                    />

                  </div>

                </div>


                {/* PASSWORD */}

                <div className="input-group">

                  <label htmlFor="password">
                    Password
                  </label>

                  <div className="input-wrapper">

                    <span className="input-icon">
                      🔒
                    </span>

                    <input
                      id="password"
                      className="login-input"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      autoComplete="current-password"
                      style={{
                        paddingRight: "45px",
                      }}
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword
                        ? "🙈"
                        : "👁️"}
                    </button>

                  </div>

                </div>


                {/* LOGIN BUTTON */}

                <button
                  className="login-button"
                  type="submit"
                  disabled={loading}
                >

                  {loading ? (

                    <span className="login-loading">

                      <span className="loading-dot" />

                      Signing you in...

                    </span>

                  ) : (

                    <>
                      Sign In

                      <span
                        style={{
                          marginLeft: "8px",
                        }}
                      >
                        →
                      </span>
                    </>

                  )}

                </button>

              </form>


              {/* =================================================
                  ERROR MESSAGE
              ================================================= */}

              {error && (

                <div className="login-error">

                  <span>
                    ⚠️
                  </span>

                  <span>
                    {error}
                  </span>

                </div>

              )}


              {/* =================================================
                  REGISTER
              ================================================= */}

              <p className="register-text">

                Don't have an account?{" "}

                <Link to="/register">
                  Create an account
                </Link>

              </p>


              {/* =================================================
                  SECURITY
              ================================================= */}

              <div className="security-note">

                <span>
                  🔒
                </span>

                Your account information is securely handled.

              </div>

            </div>

          </section>

        </div>

      </div>
    </>
  );
}

export default Login;