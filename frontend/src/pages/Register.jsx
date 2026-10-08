import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Logo from "../components/Logo";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://127.0.0.1:5000/register", {
        name,
        email,
        password,
        role,
      });
      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setMessage(err.response?.data?.error || "Registration failed");
    }
  };

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    marginBottom: "16px",
    gap: "12px"
  };

  const labelStyle = {
    width: "90px",
    fontWeight: "500",
    color: "#333",
    textAlign: "right"
  };

  const inputStyle = {
    flex: 1,
    padding: "11px 14px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "15px",
    backgroundColor: "#ffffff",
    color: "#333",
    boxSizing: "border-box",
    outline: "none"
  };

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      background: "linear-gradient(135deg, #e0f2f1, #f3e5f5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      margin: 0,
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      boxSizing: "border-box"
    }}>
      <div style={{
        backgroundColor: "#ffffff",
        padding: "40px",
        borderRadius: "16px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        width: "100%",
        maxWidth: "460px"
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
          <Logo size={74} />
        </div>
        <h2 style={{ textAlign: "center", marginBottom: "24px", color: "#1b4332", fontWeight: 700 }}>
          Create Account
        </h2>

        <form onSubmit={handleRegister}>

          <div style={rowStyle}>
            <label style={labelStyle}>Name :</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter your full name"
              style={inputStyle}
            />
          </div>

          <div style={rowStyle}>
            <label style={labelStyle}>Email :</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              style={inputStyle}
            />
          </div>

          <div style={rowStyle}>
            <label style={labelStyle}>Password :</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Create a password"
              style={inputStyle}
            />
          </div>

          <div style={rowStyle}>
            <label style={labelStyle}>Role :</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="user">User</option>
              <option value="consultant">Skincare Consultant</option>
              <option value="dermatologist">Dermatologist</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button type="submit" style={{
            width: "100%",
            padding: "14px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            marginTop: "10px"
          }}>
            Register
          </button>
        </form>

        {message && (
          <p style={{
            marginTop: "15px",
            textAlign: "center",
            color: message.toLowerCase().includes("success") ? "green" : "red",
            fontWeight: "500"
          }}>
            {message}
          </p>
        )}

        <p style={{ marginTop: "20px", textAlign: "center", color: "#666" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#4CAF50", fontWeight: "600", textDecoration: "none" }}>
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;