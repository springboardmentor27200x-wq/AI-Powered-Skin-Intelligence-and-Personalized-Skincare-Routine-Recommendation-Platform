import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser } from "./services/api";
import Home         from "./pages/Home";
import Register     from "./pages/Register";
import Login        from "./pages/Login";
import Dashboard    from "./pages/Dashboard";
import SkinProfile  from "./pages/SkinProfile";
import UserProfile  from "./pages/UserProfile";
import SleepTracker from "./pages/SleepTracker";
import HydrationTracker     from "./pages/HydrationTracker";
import LifestyleTracker     from "./pages/LifestyleTracker";
import SkinAssessment       from "./pages/SkinAssessment";
import RoutinePlanner       from "./pages/RoutinePlanner";
import IngredientIntelligence   from "./pages/IngredientIntelligence";
import ProductRecommendations   from "./pages/ProductRecommendations";
import ProgressTracker      from "./pages/ProgressTracker";
import AdminDashboard       from "./pages/admin/AdminDashboard";
import ConsultantDashboard  from "./pages/consultant/ConsultantDashboard";
import DermatologistDashboard from "./pages/dermatologist/DermatologistDashboard";
import ReportsExport        from "./pages/ReportsExport";
import SendNotification     from "./pages/SendNotification";
import AISkinChat           from "./pages/AISkinChat";
import NotificationCenter   from "./components/NotificationCenter";
import Sidebar              from "./components/Sidebar";

/* ── Guards ──────────────────────────────────────────────────── */
function Protected({ children }) {
  return localStorage.getItem("token") ? children : <Navigate to="/login" replace />;
}

function ProtectedRole({ roles, children }) {
  const storedRole = localStorage.getItem("role");
  if (!localStorage.getItem("token")) return <Navigate to="/login" replace />;
  if (!roles.includes(storedRole)) return <Navigate to="/dashboard" replace />;
  return children;
}

/* ── Page title map ──────────────────────────────────────────── */
const PAGE_TITLES = {
  "/dashboard":        "Dashboard",
  "/scanner":          "AI Skin Chat",
  "/assessment":       "Skin Assessment",
  "/profile":          "Skin Profile",
  "/routine":          "Routine Planner",
  "/products":         "Product Recommendations",
  "/ingredients":      "Ingredient Intelligence",
  "/progress":         "Progress Tracker",
  "/reports":          "Reports & Export",
  "/dermatologist":    "Dermatologist",
  "/send-notification":"Notifications",
  "/account":          "My Account",
  "/admin":            "Admin Panel",
  "/clients":          "Client Directory",
  "/sleep":            "Sleep Tracker",
  "/hydration":        "Hydration Tracker",
  "/lifestyle":        "Lifestyle Tracker",
};

const ROLE_BADGE = {
  user:                { cls: "badge-user",         label: "User"         },
  skincare_consultant: { cls: "badge-consultant",   label: "Consultant"   },
  dermatologist:       { cls: "badge-dermatologist",label: "Dermatologist"},
  admin:               { cls: "badge-admin",        label: "Admin"        },
};

/* ── AppShell — sidebar layout for authenticated pages ────────── */
function AppShell({ user, setUser, logout, role }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location  = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] || "AI Skin Intelligence";
  const badge     = ROLE_BADGE[role] || ROLE_BADGE.user;

  return (
    <div className="sb-layout">

      {/* ── Left sidebar ── */}
      <Sidebar
        user={user}
        role={role}
        logout={logout}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* ── Main area ── */}
      <div className="sb-main">

        {/* Top bar */}
        <header className="sb-topbar">
          <div className="sb-topbar-left">
            <button
              className="sb-hamburger"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <span /><span /><span />
            </button>
            <span className="sb-page-title">{pageTitle}</span>
          </div>

          <div className="sb-topbar-right">
            {/* Notification bell — styled for light topbar */}
            <div className="sb-notif-wrap">
              <NotificationCenter />
            </div>
            {user && (
              <span className={`badge ${badge.cls} sb-role-badge`}>
                {badge.label}
              </span>
            )}
            <div className="sb-topbar-avatar">
              {(user?.full_name || user?.username || "U")[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content — fade in on route change */}
        <main className="sb-content" key={location.pathname}>
          <Routes>
            <Route path="/dashboard"         element={<Protected><Dashboard user={user} /></Protected>} />
            <Route path="/scanner"           element={<Protected><AISkinChat /></Protected>} />
            <Route path="/assessment"        element={<Protected><SkinAssessment /></Protected>} />
            <Route path="/routine"           element={<Protected><RoutinePlanner /></Protected>} />
            <Route path="/ingredients"       element={<Protected><IngredientIntelligence /></Protected>} />
            <Route path="/products"          element={<Protected><ProductRecommendations /></Protected>} />
            <Route path="/progress"          element={<Protected><ProgressTracker /></Protected>} />
            <Route path="/reports"           element={<Protected><ReportsExport /></Protected>} />
            <Route path="/dermatologist"     element={<Protected><DermatologistDashboard /></Protected>} />
            <Route path="/send-notification" element={<Protected><SendNotification /></Protected>} />
            <Route path="/profile"           element={<Protected><SkinProfile /></Protected>} />
            <Route path="/account"           element={<Protected><UserProfile user={user} setUser={setUser} onLogout={logout} /></Protected>} />
            <Route path="/sleep"             element={<Protected><SleepTracker /></Protected>} />
            <Route path="/hydration"         element={<Protected><HydrationTracker /></Protected>} />
            <Route path="/lifestyle"         element={<Protected><LifestyleTracker /></Protected>} />
            <Route path="/admin"             element={<ProtectedRole roles={["admin"]}><AdminDashboard /></ProtectedRole>} />
            <Route path="/clients"           element={<ProtectedRole roles={["admin","skincare_consultant","dermatologist"]}><ConsultantDashboard /></ProtectedRole>} />
            <Route path="*"                  element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

/* ── Root App ─────────────────────────────────────────────────── */
export default function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      getCurrentUser()
        .then((r) => {
          setUser(r.data);
          if (r.data.role) localStorage.setItem("role", r.data.role);
        })
        .catch(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          setUser(null);
        });
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    if (userData?.role) localStorage.setItem("role", userData.role);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser(null);
    navigate("/login");
  };

  const role = user?.role || localStorage.getItem("role") || "user";

  return (
    <Routes>
      {/* Public — landing page (has its own nav) */}
      <Route path="/"        element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login"    element={<Login onLogin={handleLogin} />} />

      {/* Authenticated — sidebar layout */}
      <Route
        path="/*"
        element={
          <AppShell
            user={user}
            setUser={setUser}
            logout={logout}
            role={role}
          />
        }
      />
    </Routes>
  );
}
