import { useState } from "react";

function Signup({ onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Signup failed");
        return;
      }

      setMessage("Account created successfully! ✨");

      setName("");
      setEmail("");
      setPassword("");
    } catch (error) {
      setError("Cannot connect to SkinSense server.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="tagline">WELCOME TO SKINSENSE ✨</p>

        <h1>Create your account</h1>

        <p className="auth-subtitle">
          Start your personalized skincare journey.
        </p>

        <form onSubmit={handleSignup}>
          <label>Name</label>

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

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
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="auth-error">{error}</p>}

          {message && <p className="auth-success">{message}</p>}

          <button type="submit" className="continue-button">
            Create Account →
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <button type="button" onClick={onLogin}>
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default Signup;
