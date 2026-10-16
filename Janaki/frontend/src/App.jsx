import React, { useContext } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import './App.css';

// Page Components
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SkinProfilePage from './pages/SkinProfilePage';
import AIAnalysisPage from './pages/AIAnalysisPage';
import ProductsPage from './pages/ProductsPage';
import IngredientsPage from './pages/IngredientsPage';
import ProgressPage from './pages/ProgressPage';
import ConsultationsPage from './pages/ConsultationsPage';
import ConsultationDetailPage from './pages/ConsultationDetailPage';
import SkinCheckinPage from './pages/SkinCheckinPage';
import ExecutiveDashboardPage from './pages/ExecutiveDashboardPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  if (loading) return (
    <div className="loading-page">
      <div className="spinner" />
      <p>Loading...</p>
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  if (loading) return (
    <div className="loading-page">
      <div className="spinner" />
      <p>Loading...</p>
    </div>
  );
  return !isAuthenticated ? children : <Navigate to="/" />;
};

function App() {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/profile', label: 'My Profile', icon: '👤' },
    { path: '/ai-analysis', label: 'AI Analysis', icon: '✨' },
    { path: '/products', label: 'Products', icon: '🧴' },
    { path: '/ingredients', label: 'Ingredients', icon: '🧪' },
    { path: '/progress', label: 'Progress', icon: '📈' },
    { path: '/skin-checkin', label: 'Skin Check-in', icon: '📸' },
  ];

  const professionalItems = [
    { path: '/consultations', label: 'Consultations', icon: '💬' },
    { path: '/executive', label: 'Executive Analytics', icon: '📊' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="app-shell">
      {isAuthenticated && (
        <aside className="topbar">
          <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
            <div className="brand-mark">🧬</div>
            <div>
              <strong>AI Skin Intelligence</strong>
              <span>CLINICAL WORKSPACE</span>
            </div>
          </Link>

          <nav className="main-nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item${isActive(item.path) ? ' active' : ''}`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}

            {professionalItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item professional-nav${isActive(item.path) ? ' active' : ''}`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="topbar-actions">
            <button className="icon-button" title="Notifications">🔔</button>
            <button className="signout-button" onClick={logout}>
              Sign Out
            </button>
          </div>
        </aside>
      )}

      <main className={`main-content${!isAuthenticated ? ' full-width' : ''}`}
            style={!isAuthenticated ? { marginLeft: 0 } : {}}>
        <div className="page-wrap">
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><SkinProfilePage /></ProtectedRoute>} />
            <Route path="/ai-analysis" element={<ProtectedRoute><AIAnalysisPage /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
            <Route path="/ingredients" element={<ProtectedRoute><IngredientsPage /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
            <Route path="/consultations" element={<ProtectedRoute><ConsultationsPage /></ProtectedRoute>} />
            <Route path="/consultations/:id" element={<ProtectedRoute><ConsultationDetailPage /></ProtectedRoute>} />
            <Route path="/skin-checkin" element={<ProtectedRoute><SkinCheckinPage /></ProtectedRoute>} />
            <Route path="/executive" element={<ProtectedRoute><ExecutiveDashboardPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
