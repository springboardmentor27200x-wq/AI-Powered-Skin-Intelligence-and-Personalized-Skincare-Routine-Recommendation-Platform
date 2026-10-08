// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { registerUser } from "../services/api";

// function Register() {
//   const navigate = useNavigate();

//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//   });

//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     setError("");
//     setSuccess("");
//     setLoading(true);

//     try {
//       await registerUser(formData);

//       setSuccess("Registration successful!");

//       setTimeout(() => {
//         navigate("/login");
//       }, 1000);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="auth-container">
//       <div className="auth-card">
//         <h1>Create Account</h1>

//         <form onSubmit={handleSubmit}>
//           <input
//             type="text"
//             name="name"
//             placeholder="Full Name"
//             value={formData.name}
//             onChange={handleChange}
//             required
//           />

//           <input
//             type="email"
//             name="email"
//             placeholder="Email"
//             value={formData.email}
//             onChange={handleChange}
//             required
//           />

//           <input
//             type="password"
//             name="password"
//             placeholder="Password"
//             value={formData.password}
//             onChange={handleChange}
//             required
//           />

//           <button type="submit" disabled={loading}>
//             {loading ? "Creating Account..." : "Register"}
//           </button>
//         </form>

//         {success && <p className="success">{success}</p>}
//         {error && <p className="error">{error}</p>}

//         <p>
//           Already have an account?{" "}
//           <Link to="/login">Login</Link>
//         </p>
//       </div>
//     </div>
//   );
// }

// export default Register;
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await registerUser(formData);

      setSuccess("Account created successfully! 🌿");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
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

        /* =========================================
           PAGE
        ========================================= */

        .register-page {
          min-height: 100vh;

          padding: 30px 20px;

          display: flex;
          align-items: center;
          justify-content: center;

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
              circle at 8% 15%,
              rgba(74, 158, 145, 0.14),
              transparent 27%
            ),
            radial-gradient(
              circle at 92% 85%,
              rgba(92, 157, 173, 0.13),
              transparent 30%
            ),
            linear-gradient(
              135deg,
              #f7fcfb 0%,
              #edf7f5 50%,
              #f9fcfb 100%
            );
        }


        /* =========================================
           FLOATING BACKGROUND SHAPES
        ========================================= */

        .register-circle {
          position: absolute;

          border-radius: 50%;

          pointer-events: none;

          animation: registerFloat 8s ease-in-out infinite;
        }

        .register-circle-one {
          width: 300px;
          height: 300px;

          left: -170px;
          top: 8%;

          background: rgba(62, 148, 137, 0.07);
        }

        .register-circle-two {
          width: 240px;
          height: 240px;

          right: -120px;
          bottom: 8%;

          background: rgba(91, 158, 173, 0.07);

          animation-delay: 2s;
        }

        .register-circle-three {
          width: 130px;
          height: 130px;

          right: 15%;
          top: 5%;

          background: rgba(78, 148, 140, 0.05);

          animation-delay: 4s;
        }

        @keyframes registerFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-18px);
          }
        }


        /* =========================================
           MAIN CARD
        ========================================= */

        .register-card {
          width: 100%;
          max-width: 980px;

          min-height: 590px;

          display: grid;

          grid-template-columns: 0.95fr 1.05fr;

          position: relative;

          z-index: 2;

          overflow: hidden;

          border-radius: 30px;

          background: rgba(255, 255, 255, 0.92);

          border: 1px solid rgba(255, 255, 255, 0.9);

          box-shadow:
            0 30px 80px rgba(38, 91, 82, 0.13);

          backdrop-filter: blur(20px);

          animation: registerAppear 0.6s ease;
        }

        @keyframes registerAppear {
          from {
            opacity: 0;
            transform: translateY(20px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }


        /* =========================================
           LEFT SIDE
        ========================================= */

        .register-info {
          padding: 55px;

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


        /* Logo */

        .register-logo {
          width: 62px;
          height: 62px;

          display: flex;

          align-items: center;
          justify-content: center;

          margin-bottom: 28px;

          border-radius: 19px;

          background: rgba(255, 255, 255, 0.78);

          box-shadow:
            0 12px 28px rgba(42, 110, 98, 0.09);

          font-size: 29px;

          animation: logoFloat 4s ease-in-out infinite;
        }

        @keyframes logoFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-7px);
          }
        }


        .register-label {
          margin: 0 0 10px;

          color: #4a9689;

          font-size: 10px;

          font-weight: 800;

          letter-spacing: 1.8px;
        }


        .register-info h1 {
          margin: 0 0 18px;

          color: #28584f;

          font-size: 38px;

          line-height: 1.12;

          letter-spacing: -1px;
        }

        .register-info h1 span {
          color: #358d7f;
        }


        .register-description {
          max-width: 370px;

          margin: 0;

          color: #66847e;

          font-size: 13px;

          line-height: 1.8;
        }


        /* =========================================
           FEATURES
        ========================================= */

        .register-features {
          display: flex;

          flex-direction: column;

          gap: 13px;

          margin-top: 32px;
        }

        .register-feature {
          display: flex;

          align-items: center;

          gap: 11px;

          color: #5c7c75;

          font-size: 11px;

          font-weight: 600;
        }

        .register-feature-icon {
          width: 30px;
          height: 30px;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 9px;

          background: rgba(255,255,255,0.75);

          font-size: 14px;
        }


        /* =========================================
           RIGHT SIDE
        ========================================= */

        .register-form-section {
          padding: 50px;

          display: flex;

          align-items: center;
        }

        .register-form-wrapper {
          width: 100%;

          max-width: 430px;

          margin: 0 auto;
        }


        /* =========================================
           HEADER
        ========================================= */

        .register-header {
          margin-bottom: 28px;
        }

        .register-header p {
          margin: 0 0 7px;

          color: #67a397;

          font-size: 10px;

          font-weight: 800;

          letter-spacing: 1.5px;
        }

        .register-header h2 {
          margin: 0 0 8px;

          color: #293f3b;

          font-size: 28px;

          letter-spacing: -0.6px;
        }

        .register-header span {
          color: #8b9b97;

          font-size: 11px;

          line-height: 1.6;
        }


        /* =========================================
           FORM
        ========================================= */

        .register-form {
          display: flex;

          flex-direction: column;

          gap: 15px;
        }


        /* =========================================
           INPUT GROUP
        ========================================= */

        .register-input-group {
          position: relative;
        }

        .register-input-label {
          display: block;

          margin-bottom: 7px;

          color: #59706b;

          font-size: 10px;

          font-weight: 700;
        }


        .register-input-wrapper {
          position: relative;
        }

        .register-input-icon {
          position: absolute;

          left: 13px;

          top: 50%;

          transform: translateY(-50%);

          font-size: 14px;

          pointer-events: none;
        }


        .register-input {
          width: 100%;

          height: 46px;

          padding:
            0 14px 0 40px;

          border: 1px solid #e0e9e6;

          border-radius: 11px;

          outline: none;

          background: #fbfdfc;

          color: #30443f;

          font-family: inherit;

          font-size: 12px;

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .register-input:hover {
          border-color: #cbded9;
        }

        .register-input:focus {
          border-color: #68aa9e;

          background: white;

          box-shadow:
            0 0 0 3px rgba(63,155,141,0.07);
        }

        .register-input::placeholder {
          color: #b0bbb8;
        }


        /* =========================================
           PASSWORD HINT
        ========================================= */

        .register-password-hint {
          margin-top: 6px;

          color: #a0aca9;

          font-size: 9px;
        }


        /* =========================================
           REGISTER BUTTON
        ========================================= */

        .register-button {
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

        .register-button:hover:not(:disabled) {
          transform: translateY(-2px);

          box-shadow:
            0 13px 28px rgba(47,143,131,0.28);
        }

        .register-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .register-button:disabled {
          opacity: 0.7;

          cursor: not-allowed;
        }


        /* =========================================
           LOADING
        ========================================= */

        .register-loading {
          display: inline-flex;

          align-items: center;

          justify-content: center;

          gap: 8px;
        }

        .register-spinner {
          width: 14px;
          height: 14px;

          border: 2px solid rgba(255,255,255,0.4);

          border-top-color: white;

          border-radius: 50%;

          animation: registerSpin 0.7s linear infinite;
        }

        @keyframes registerSpin {
          to {
            transform: rotate(360deg);
          }
        }


        /* =========================================
           MESSAGES
        ========================================= */

        .register-success {
          margin-top: 14px;

          padding: 11px 13px;

          border-radius: 10px;

          background: #effaf6;

          border: 1px solid #cde9e0;

          color: #328171;

          font-size: 10px;

          text-align: center;

          animation: registerMessage 0.3s ease;
        }

        .register-error {
          margin-top: 14px;

          padding: 11px 13px;

          border-radius: 10px;

          background: #fff4f2;

          border: 1px solid #f0d8d3;

          color: #ae584d;

          font-size: 10px;

          text-align: center;

          animation: registerMessage 0.3s ease;
        }

        @keyframes registerMessage {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }


        /* =========================================
           LOGIN LINK
        ========================================= */

        .register-login {
          margin: 20px 0 0;

          color: #929e9b;

          font-size: 10px;

          text-align: center;
        }

        .register-login a {
          color: #358d7f;

          font-weight: 750;

          text-decoration: none;

          transition: color 0.2s ease;
        }

        .register-login a:hover {
          color: #246f64;

          text-decoration: underline;
        }


        /* =========================================
           FOOTER
        ========================================= */

        .register-footer {
          margin-top: 18px;

          color: #a2adaa;

          font-size: 9px;

          line-height: 1.5;

          text-align: center;
        }


        /* =========================================
           MOBILE
        ========================================= */

        @media (max-width: 800px) {

          .register-card {
            grid-template-columns: 1fr;

            max-width: 520px;
          }

          .register-info {
            padding: 35px 40px;
          }

          .register-info h1 {
            font-size: 32px;
          }

          .register-features {
            flex-direction: row;

            flex-wrap: wrap;
          }

          .register-form-section {
            padding: 40px;
          }
        }


        @media (max-width: 520px) {

          .register-page {
            padding: 15px;
          }

          .register-info {
            padding: 30px 25px;
          }

          .register-info h1 {
            font-size: 28px;
          }

          .register-description {
            font-size: 11px;
          }

          .register-features {
            display: none;
          }

          .register-form-section {
            padding: 30px 25px 35px;
          }

          .register-header h2 {
            font-size: 24px;
          }
        }

      `}</style>


      {/* =============================================
          PAGE
      ============================================== */}

      <div className="register-page">

        {/* Background decorations */}

        <div className="register-circle register-circle-one"></div>

        <div className="register-circle register-circle-two"></div>

        <div className="register-circle register-circle-three"></div>


        {/* =========================================
            CARD
        ========================================== */}

        <div className="register-card">


          {/* =========================================
              LEFT INFORMATION PANEL
          ========================================== */}

          <section className="register-info">

            <div className="register-logo">
              🌿
            </div>

            <p className="register-label">
              SKIN INTELLIGENCE
            </p>

            <h1>
              Begin your
              <br />
              <span>personal wellness</span>
              <br />
              journey.
            </h1>

            <p className="register-description">
              Create your account and start building
              your personalized skincare profile. Track
              your skin, lifestyle, and sleep information
              in one place.
            </p>


            <div className="register-features">

              <div className="register-feature">

                <span className="register-feature-icon">
                  🧴
                </span>

                Personalized skin profile

              </div>


              <div className="register-feature">

                <span className="register-feature-icon">
                  💧
                </span>

                Lifestyle tracking

              </div>


              <div className="register-feature">

                <span className="register-feature-icon">
                  🌙
                </span>

                Sleep & wellness tracking

              </div>

            </div>

          </section>


          {/* =========================================
              REGISTRATION FORM
          ========================================== */}

          <section className="register-form-section">

            <div className="register-form-wrapper">


              {/* Header */}

              <div className="register-header">

                <p>
                  CREATE YOUR ACCOUNT
                </p>

                <h2>
                  Let's get started
                </h2>

                <span>
                  Enter your details to create your
                  Skin Intelligence account.
                </span>

              </div>


              {/* Form */}

              <form
                className="register-form"
                onSubmit={handleSubmit}
              >


                {/* Name */}

                <div className="register-input-group">

                  <label className="register-input-label">
                    Full Name
                  </label>

                  <div className="register-input-wrapper">

                    <span className="register-input-icon">
                      👤
                    </span>

                    <input
                      className="register-input"
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />

                  </div>

                </div>


                {/* Email */}

                <div className="register-input-group">

                  <label className="register-input-label">
                    Email Address
                  </label>

                  <div className="register-input-wrapper">

                    <span className="register-input-icon">
                      ✉️
                    </span>

                    <input
                      className="register-input"
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />

                  </div>

                </div>


                {/* Password */}

                <div className="register-input-group">

                  <label className="register-input-label">
                    Password
                  </label>

                  <div className="register-input-wrapper">

                    <span className="register-input-icon">
                      🔒
                    </span>

                    <input
                      className="register-input"
                      type="password"
                      name="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />

                  </div>

                  <div className="register-password-hint">
                    Use a secure password to protect your account.
                  </div>

                </div>


                {/* Role */}

                <div className="register-input-group">

                  <label className="register-input-label">
                    I am registering as
                  </label>

                  <div className="register-input-wrapper">

                    <span className="register-input-icon">
                      🧑‍⚕️
                    </span>

                    <select
                      className="register-input"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      required
                    >
                      <option value="user">User</option>
                      <option value="consultant">Skincare Consultant</option>
                      <option value="dermatologist">Dermatologist</option>
                    </select>

                  </div>

                  <div className="register-password-hint">
                    This decides which dashboard and permissions your
                    account gets. Admin accounts are created separately.
                  </div>

                </div>


                {/* Button */}

                <button
                  className="register-button"
                  type="submit"
                  disabled={loading}
                >

                  {loading ? (

                    <span className="register-loading">

                      <span className="register-spinner"></span>

                      Creating Account...

                    </span>

                  ) : (

                    <>
                      Create Account

                      <span style={{ marginLeft: "8px" }}>
                        →
                      </span>
                    </>

                  )}

                </button>

              </form>


              {/* Success */}

              {success && (
                <div className="register-success">
                  ✓ {success}
                </div>
              )}


              {/* Error */}

              {error && (
                <div className="register-error">
                  ⚠️ {error}
                </div>
              )}


              {/* Login */}

              <p className="register-login">

                Already have an account?{" "}

                <Link to="/login">
                  Sign in
                </Link>

              </p>


              {/* Footer */}

              <div className="register-footer">
                Your account helps us personalize your
                skincare and wellness experience.
              </div>

            </div>

          </section>

        </div>

      </div>
    </>
  );
}

export default Register;