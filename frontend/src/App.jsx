import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { useEffect } from "react";

import "./App.css";

// =========================
// PAGES
// =========================

import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import SkinProfile from "./pages/SkinProfile";
import Lifestyle from "./pages/Lifestyle";
import Sleep from "./pages/Sleep";
import Progress from "./pages/Progress";
import RoutineAdherence from "./pages/RoutineAdherence";
import Analytics from "./pages/Analytics";
import ProductRecommendations from "./pages/ProductRecommendations";
import HealthDashboard from "./pages/HealthDashboard";
import Reports from "./pages/Reports";
import Consultations from "./pages/Consultations";

// =========================
// ROLE-BASED DASHBOARDS
// =========================

import DermatologistDashboard from "./pages/DermatologistDashboard";
import ConsultantDashboard from "./pages/ConsultantDashboard";
import AdminDashboard from "./pages/AdminDashboard";

// =========================
// AUTH
// =========================

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// =========================================================
// SCROLL TO TOP
// =========================================================

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [pathname]);

  return null;
}

// =========================================================
// PAGE TRANSITION
// =========================================================

function PageTransition({ children }) {
  return (
    <div className="page-transition">
      {children}
    </div>
  );
}

// =========================================================
// 404 PAGE
// =========================================================

function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-card">

        <div className="not-found-icon">
          🌿
        </div>

        <h1 className="not-found-title">
          404
        </h1>

        <h2 className="not-found-heading">
          Page not found
        </h2>

        <p className="not-found-text">
          The page you're looking for doesn't exist
          or may have been moved.
        </p>

        <button
          className="primary-button"
          onClick={() => {
            window.location.href = "/dashboard";
          }}
        >
          Go to Dashboard
        </button>

      </div>
    </div>
  );
}

// =========================================================
// APPLICATION ROUTES
// =========================================================

function AppRoutes() {
  return (
    <>
      <ScrollToTop />

      <Routes>

        {/* =================================================
            DEFAULT ROUTE
        ================================================= */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        {/* =================================================
            AUTHENTICATION
        ================================================= */}

        <Route
          path="/login"
          element={
            <PageTransition>
              <Login />
            </PageTransition>
          }
        />

        <Route
          path="/register"
          element={
            <PageTransition>
              <Register />
            </PageTransition>
          }
        />

        {/* =================================================
            NORMAL USER DASHBOARD
        ================================================= */}

        <Route
          path="/dashboard"
          element={
            <PageTransition>
              <ProtectedRoute allowedRoles={["user"]}>
                <Dashboard />
              </ProtectedRoute>
            </PageTransition>
          }
        />

        {/* =================================================
            USER SKIN PROFILE
        ================================================= */}

        <Route
          path="/skin-profile"
          element={
            <PageTransition>
              <ProtectedRoute allowedRoles={["user"]}>
                <SkinProfile />
              </ProtectedRoute>
            </PageTransition>
          }
        />

        {/* =================================================
            PRODUCT RECOMMENDATIONS
        ================================================= */}

        <Route
          path="/product-recommendations"
          element={
            <PageTransition>
              <ProtectedRoute allowedRoles={["user"]}>
                <ProductRecommendations />
              </ProtectedRoute>
            </PageTransition>
          }
        />

        {/* =================================================
            USER LIFESTYLE
        ================================================= */}

        <Route
          path="/lifestyle"
          element={
            <PageTransition>
              <ProtectedRoute allowedRoles={["user"]}>
                <Lifestyle />
              </ProtectedRoute>
            </PageTransition>
          }
        />

        {/* =================================================
            USER SLEEP
        ================================================= */}

        <Route
          path="/sleep"
          element={
            <PageTransition>
              <ProtectedRoute allowedRoles={["user"]}>
                <Sleep />
              </ProtectedRoute>
            </PageTransition>
          }
        />

        {/* =================================================
            USER PROGRESS
        ================================================= */}

        <Route
          path="/progress"
          element={
            <PageTransition>
              <ProtectedRoute allowedRoles={["user"]}>
                <Progress />
              </ProtectedRoute>
            </PageTransition>
          }
        />

        {/* =================================================
            USER ANALYTICS
        ================================================= */}

        <Route
          path="/analytics"
          element={
            <PageTransition>
              <ProtectedRoute allowedRoles={["user"]}>
                <Analytics />
              </ProtectedRoute>
            </PageTransition>
          }
        />

        {/* =================================================
            HEALTH DASHBOARD
        ================================================= */}

        <Route
          path="/health-dashboard"
          element={
            <PageTransition>
              <ProtectedRoute allowedRoles={["user"]}>
                <HealthDashboard />
              </ProtectedRoute>
            </PageTransition>
          }
        />

        {/* =================================================
            REPORTS
        ================================================= */}

        <Route
          path="/reports"
          element={
            <PageTransition>
              <ProtectedRoute allowedRoles={["user"]}>
                <Reports />
              </ProtectedRoute>
            </PageTransition>
          }
        />

        {/* =================================================
            CONSULTATIONS / FIND A PROFESSIONAL
        ================================================= */}

        <Route
          path="/consultations"
          element={
            <PageTransition>
              <ProtectedRoute allowedRoles={["user"]}>
                <Consultations />
              </ProtectedRoute>
            </PageTransition>
          }
        />

        {/* =================================================
            USER ROUTINE ADHERENCE
        ================================================= */}

        <Route
          path="/routine-adherence"
          element={
            <PageTransition>
              <ProtectedRoute allowedRoles={["user"]}>
                <RoutineAdherence />
              </ProtectedRoute>
            </PageTransition>
          }
        />

        {/* =================================================
            DERMATOLOGIST DASHBOARD
        ================================================= */}

        <Route
          path="/dermatologist"
          element={
            <PageTransition>
              <ProtectedRoute allowedRoles={["dermatologist"]}>
                <DermatologistDashboard />
              </ProtectedRoute>
            </PageTransition>
          }
        />

        {/* =================================================
            CONSULTANT DASHBOARD
        ================================================= */}

        <Route
          path="/consultant"
          element={
            <PageTransition>
              <ProtectedRoute allowedRoles={["consultant"]}>
                <ConsultantDashboard />
              </ProtectedRoute>
            </PageTransition>
          }
        />

        {/* =================================================
            ADMIN DASHBOARD
        ================================================= */}

        <Route
          path="/admin"
          element={
            <PageTransition>
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            </PageTransition>
          }
        />

        {/* =================================================
            404
            KEEP THIS ROUTE LAST
        ================================================= */}

        <Route
          path="*"
          element={
            <NotFound />
          }
        />

      </Routes>
    </>
  );
}

// =========================================================
// MAIN APP
// =========================================================

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;