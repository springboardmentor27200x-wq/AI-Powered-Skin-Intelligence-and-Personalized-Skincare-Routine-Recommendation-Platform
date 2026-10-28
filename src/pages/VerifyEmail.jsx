import { useEffect, useRef, useState } from "react";

function VerifyEmail({ token, onLogin }) {
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");

  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) {
      return;
    }

    hasVerified.current = true;

    const verifyEmail = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/verify-email?token=${token}`
        );

        const data = await response.json();

        if (!response.ok) {
          setStatus("error");
          setMessage(data.detail || "Email verification failed.");
          return;
        }

        setStatus("success");
        setMessage("Your email has been verified successfully! ✨");
      } catch (error) {
        setStatus("error");
        setMessage("Cannot connect to SkinSense server.");
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-card">

        {status === "verifying" && (
          <>
            <p className="tagline">SKINSENSE ✨</p>

            <h1>Verifying your email...</h1>

            <p className="auth-subtitle">
              Please wait while we verify your account.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <p className="tagline">SKINSENSE ✨</p>

            <h1>Email Verified! 🎉</h1>

            <p className="auth-subtitle">
              {message}
            </p>

            <button
              className="continue-button"
              onClick={onLogin}
            >
              Continue to Login →
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <p className="tagline">SKINSENSE ✨</p>

            <h1>Verification Failed</h1>

            <p className="auth-error">
              {message}
            </p>

            <button
              className="continue-button"
              onClick={onLogin}
            >
              Back to Login →
            </button>
          </>
        )}

      </div>
    </div>
  );
}

export default VerifyEmail;