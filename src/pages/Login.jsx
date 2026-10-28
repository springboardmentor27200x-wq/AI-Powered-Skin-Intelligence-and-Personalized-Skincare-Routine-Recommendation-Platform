
import { useState } from "react";

function Login({ onSignup, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Login failed");
        return;
      }

      // Get the logged-in user's actual role
      const meResponse = await fetch("http://localhost:8000/me", {
        method: "GET",
        credentials: "include",
      });

      if (!meResponse.ok) {
        setError("Login succeeded, but user details could not be loaded.");
        return;
      }

      const user = await meResponse.json();

      // Pass user details to App.jsx
      onLoginSuccess(user);
    } catch (error) {
      setError("Cannot connect to SkinSense server.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="tagline">WELCOME BACK ✨</p>

        <h1>Login to SkinSense</h1>

        <p className="auth-subtitle">
          Continue your personalized skincare journey.
        </p>

        <form onSubmit={handleLogin}>
          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="continue-button">
            Login →
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{" "}
          <button type="button" onClick={onSignup}>
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
