import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { getCurrentUser } from "./services/api";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SkinProfile from "./pages/SkinProfile";

function Protected({ children }) {
  return localStorage.getItem("token") ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      getCurrentUser().then(r => setUser(r.data)).catch(() => {
        localStorage.removeItem("token");
        navigate("/login");
      });
    }
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <>
      <header className="nav">
        <Link className="brand" to="/">AI Skin Intelligence</Link>
        <nav>
          {!localStorage.getItem("token") ? <>
            <Link to="/login">Login</Link>
            <Link className="nav-btn" to="/register">Register</Link>
          </> : <>
            <Link to="/dashboard">Dashboard</Link>
            <button onClick={logout}>Logout</button>
          </>}
        </nav>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login onLogin={setUser} />} />
          <Route path="/dashboard" element={<Protected><Dashboard user={user} /></Protected>} />
          <Route path="/profile" element={<Protected><SkinProfile /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
