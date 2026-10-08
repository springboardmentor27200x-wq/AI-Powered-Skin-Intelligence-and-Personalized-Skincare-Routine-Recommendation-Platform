import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Assessment from "./pages/Assessment";
import Checklist from "./pages/Checklist";
import Progress from "./pages/Progress";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import SkinAnalysis from "./pages/SkinAnalysis";
import ProductRecommendations from "./pages/ProductRecommendations";
import DermatologistDashboard from "./pages/DermatologistDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/assessment" element={<SkinAnalysis />} />
        <Route path="/checklist" element={<Checklist />} />
        <Route path="/products" element={<ProductRecommendations />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/dermatologist" element={<DermatologistDashboard />} />
        <Route path="/consultant" element={<DermatologistDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;