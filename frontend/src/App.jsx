import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MaintenanceProvider, useMaintenance } from './context/MaintenanceContext';
import Layout from './components/Layout';

// Public Pages
import Landing from './pages/Public/Landing';
import Login from './pages/Public/Login';
import Register from './pages/Public/Register';
import PrivacyPolicy from './pages/Public/PrivacyPolicy';
import TermsOfService from './pages/Public/TermsOfService';
import SecurityStandards from './pages/Public/SecurityStandards';
import MaintenancePage from './pages/Public/MaintenancePage';

// Authenticated Pages
import Dashboard from './pages/Dashboard/Dashboard';
import ProfilePage from './pages/Profile';
import SkinProfilePage from './pages/SkinProfile';
import Lifestyle from './pages/Lifestyle';
import Sleep from './pages/Sleep';
import Hydration from './pages/Hydration';
import Environment from './pages/Environment';
import OnboardingWizard from './pages/Onboarding/OnboardingWizard';
import FindProfessional from './pages/FindProfessional';
import MyConnections from './pages/MyConnections';
import AssessmentWizard from './pages/Assessment/AssessmentWizard';
import RoutinePlanner from './pages/Routines/RoutinePlanner';
import Progress from './pages/Progress/Progress';

// Milestone 3 Pages
import IngredientExplorer from './pages/Ingredients/IngredientExplorer';
import ProductRecommendations from './pages/Products/ProductRecommendations';
import ProductComparison from './pages/Products/ProductComparison';
import ProductAlternatives from './pages/Products/ProductAlternatives';

// Milestone 4 Pages
import Reports from './pages/Reports/Reports';
import Notifications from './pages/Notifications/Notifications';
import Messages from './pages/Messages';

// Role Workspaces
import Consultant from './pages/Consultant';
import Dermatologist from './pages/Dermatologist';
import Admin from './pages/Admin';
import NotFound from './pages/Public/NotFound';

// Error handling & notifications
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';

// Helper to get default homepage per role
const getRoleHomepage = (user) => {
  if (!user) return '/login';
  const nameSlug = user.profile?.name
    ? user.profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    : user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-');

  switch (user.role) {
    case 'SKINCARE_CONSULTANT':
      return `/consultant/${nameSlug}/dashboard`;
    case 'DERMATOLOGIST':
      return `/dermatologist/${nameSlug}/dashboard`;
    case 'ADMINISTRATOR':
      return '/admin/dashboard';
    case 'USER':
    default:
      return '/dashboard';
  }
};

// Route Guard for Authenticated Pages
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fafaf6]">
        <div className="h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const dest = getRoleHomepage(user);
    return <Navigate to={dest} replace />;
  }

  return children;
};

// Route Guard to prevent logged-in users from visiting login/register
const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fafaf6]">
        <div className="h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    const dest = getRoleHomepage(user);
    return <Navigate to={dest} replace />;
  }

  return children;
};

// Route Guard / Interceptor for Platform-Wide Maintenance Mode
const MaintenanceGate = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { maintenanceMode, maintenanceConfig, loading: maintLoading } = useMaintenance();
  const location = useLocation();

  if (maintLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fafaf6]">
        <div className="h-8 w-8 border-4 border-[#1b382d] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If maintenance mode is disabled, proceed as normal
  if (!maintenanceMode) {
    return children;
  }

  const isAdmin = user && user.role === 'ADMINISTRATOR';
  // Allow administrative login and public regulatory documents during maintenance
  const publicExempt = ['/login', '/privacy', '/terms', '/security'].includes(location.pathname);

  if (!isAdmin && !publicExempt) {
    return <MaintenancePage config={maintenanceConfig} />;
  }

  return (
    <>
      {isAdmin && (
        <aside
          role="status"
          aria-label="Maintenance mode notification"
          className="sticky top-0 z-[9999] bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white text-xs font-semibold px-4 py-2 flex flex-wrap items-center justify-between shadow-lg border-b border-amber-600/50"
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-300"></span>
            </span>
            <span>
              <strong>PLATFORM MAINTENANCE ACTIVE</strong> &mdash; Non-administrators and public visitors are blocked. You are operating in <em>Admin Bypass Mode</em>.
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 sm:mt-0">
            <Link
              to="/admin/dashboard"
              className="bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold px-3 py-1 rounded-md transition-colors shadow-2xs"
            >
              Open Admin Studio
            </Link>
          </div>
        </aside>
      )}
      {children}
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
    <ToastProvider>
    <MaintenanceProvider>
      <Router>
        <MaintenanceGate>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/security" element={<SecurityStandards />} />

          {/* Onboarding Wizard (Standalone full-screen workflow) */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <OnboardingWizard />
              </ProtectedRoute>
            }
          />

          {/* Authenticated Routes wrapped in Layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <Layout>
                  <AssessmentWizard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/routine"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <Layout>
                  <RoutinePlanner />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/routines" element={<Navigate to="/routine" replace />} />
          <Route
            path="/progress"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <Layout>
                  <Progress />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={['USER', 'SKINCARE_CONSULTANT', 'DERMATOLOGIST', 'ADMINISTRATOR']}>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={['USER', 'SKINCARE_CONSULTANT', 'DERMATOLOGIST', 'ADMINISTRATOR']}>
                <Layout>
                  <Notifications />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['USER', 'SKINCARE_CONSULTANT', 'DERMATOLOGIST', 'ADMINISTRATOR']}>
                <Layout>
                  <ProfilePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/skin-profile"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <Layout>
                  <SkinProfilePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/lifestyle"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <Layout>
                  <Lifestyle />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sleep"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <Layout>
                  <Sleep />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hydration"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <Layout>
                  <Hydration />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/environment"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <Layout>
                  <Environment />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/find-professional"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <Layout>
                  <FindProfessional />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/professionals"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <Layout>
                  <FindProfessional />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-connections"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <Layout>
                  <MyConnections />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute allowedRoles={['USER', 'SKINCARE_CONSULTANT', 'DERMATOLOGIST', 'ADMINISTRATOR']}>
                <Layout>
                  <Messages />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Milestone 3: Ingredient Intelligence */}
          <Route
            path="/ingredients"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <Layout>
                  <IngredientExplorer />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Milestone 3: Product Recommendations */}
          <Route
            path="/products"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <Layout>
                  <ProductRecommendations />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/compare"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <Layout>
                  <ProductComparison />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/alternatives/:productId"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <Layout>
                  <ProductAlternatives />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Professional Workspaces */}
          <Route
            path="/consultant/:name/dashboard"
            element={
              <ProtectedRoute allowedRoles={['SKINCARE_CONSULTANT']}>
                <Layout>
                  <Consultant />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dermatologist/:name/dashboard"
            element={
              <ProtectedRoute allowedRoles={['DERMATOLOGIST']}>
                <Layout>
                  <Dermatologist />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/DERMATOLOGIST/:name/dashboard"
            element={
              <ProtectedRoute allowedRoles={['DERMATOLOGIST']}>
                <Layout>
                  <Dermatologist />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
                <Layout>
                  <Admin />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </MaintenanceGate>
      </Router>
    </MaintenanceProvider>
    </ToastProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
