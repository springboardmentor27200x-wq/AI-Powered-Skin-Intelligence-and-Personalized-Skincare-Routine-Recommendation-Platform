import { Link } from "react-router-dom";
import Logo from "../components/Logo";

function Home() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #e0f2f1 0%, #f3e5f5 50%, #e3f2fd 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "40px 20px",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      
      {/* Main Card */}
      <div style={{
        backgroundColor: "white",
        padding: "50px 40px",
        borderRadius: "20px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
        maxWidth: "600px",
        width: "100%"
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <Logo size={96} />
        </div>

        <h1 style={{
          fontSize: "2.6rem",
          margin: "0 0 10px",
          color: "#1a1a1a",
          fontWeight: "700"
        }}>
          AI Skin Intelligence
        </h1>

        <h2 style={{
          fontSize: "1.3rem",
          fontWeight: "400",
          color: "#555",
          margin: "0 0 25px"
        }}>
          Personalized Skincare Planner
        </h2>

        <p style={{
          fontSize: "1.05rem",
          color: "#666",
          lineHeight: "1.6",
          marginBottom: "35px"
        }}>
          Get personalized skincare routines based on your skin type, lifestyle, 
          sleep patterns, and environmental factors — powered by AI.
        </p>

        <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/register" style={{
            padding: "14px 36px",
            backgroundColor: "#4CAF50",
            color: "white",
            textDecoration: "none",
            borderRadius: "10px",
            fontSize: "1.05rem",
            fontWeight: "600",
            boxShadow: "0 4px 15px rgba(76, 175, 80, 0.3)",
            transition: "0.2s"
          }}>
            Get Started
          </Link>

          <Link to="/login" style={{
            padding: "14px 36px",
            backgroundColor: "white",
            color: "#333",
            textDecoration: "none",
            borderRadius: "10px",
            fontSize: "1.05rem",
            fontWeight: "600",
            border: "2px solid #ddd"
          }}>
            Login
          </Link>
        </div>
      </div>

      <p style={{ marginTop: "30px", color: "#777", fontSize: "0.9rem" }}>
      </p>
    </div>
  );
}

export default Home;