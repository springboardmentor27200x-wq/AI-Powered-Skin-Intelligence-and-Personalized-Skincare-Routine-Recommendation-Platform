import { useState } from "react";

function Register({ onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "https://skinai-backend-xbgd.onrender.com/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name,
            email: email,
            password: password,
            role: role,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("Registration successful! Please login.");
        if (onLogin) {
          onLogin();
        }
      } else {
        alert(data.message || "Registration failed.");
      }
    } catch (error) {
      console.error("Registration Error:", error);
      alert(
        "Backend is not connected. Please make sure the backend is running."
      );
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Create Account</h1>

        <p>Register to start your SkinAI journey.</p>

        <form onSubmit={handleRegister}>
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
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label>Role</label>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="user">User</option>
            <option value="consultant">Consultant</option>
            <option value="dermatologist">Dermatologist</option>
          </select>

          <button type="submit">Register</button>
        </form>

        <p className="register-text">
          Already have an account?{" "}

          <button
            type="button"
            className="register-btn"
            onClick={onLogin}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;