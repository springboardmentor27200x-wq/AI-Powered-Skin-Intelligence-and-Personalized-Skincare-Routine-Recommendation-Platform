import { NavLink, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/* ── Navigation structure ─────────────────────────────────────── */
const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard",  icon: "🏠", label: "Dashboard" },
      { to: "/scanner",    icon: "💬", label: "AI Skin Chat",  highlight: true },
      { to: "/assessment", icon: "🔬", label: "Assessment" },
      { to: "/profile",    icon: "🧬", label: "Skin Profile" },
    ],
  },
  {
    label: "Skincare",
    items: [
      { to: "/routine",     icon: "🌿", label: "Routine Planner" },
      { to: "/products",    icon: "🧴", label: "Products" },
      { to: "/ingredients", icon: "⚗️",  label: "Ingredients" },
    ],
  },
  {
    label: "Tracking",
    items: [
      { to: "/progress", icon: "📈", label: "Progress" },
      { to: "/reports",  icon: "📋", label: "Reports" },
    ],
  },
  {
    label: "Professional",
    items: [
      { to: "/dermatologist",     icon: "🩺", label: "Dermatologist" },
      { to: "/send-notification", icon: "🔔", label: "Notifications" },
    ],
  },
];

const ROLE_LABELS = {
  user: "User",
  admin: "Administrator",
  skincare_consultant: "Consultant",
  dermatologist: "Dermatologist",
};

/* ── Sidebar component ────────────────────────────────────────── */
export default function Sidebar({ user, role, logout, mobileOpen, onClose }) {
  const showAdmin   = role === "admin";
  const showClients = ["admin", "skincare_consultant", "dermatologist"].includes(role);
  const roleLabel   = ROLE_LABELS[role] || role;
  const initial     = (user?.full_name || user?.username || "U")[0].toUpperCase();

  return (
    <>
      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="sb-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar panel ── */}
      <aside className={`sb-sidebar${mobileOpen ? " sb-sidebar--open" : ""}`}>

        {/* Brand */}
        <div className="sb-brand">
          <Link to="/" className="sb-brand-link" onClick={onClose}>
            <span className="sb-brand-leaf">🌿</span>
            <div>
              <div className="sb-brand-name">Skin<strong>AI</strong></div>
              <div className="sb-brand-sub">Intelligence Platform</div>
            </div>
          </Link>
          <button className="sb-close-btn" onClick={onClose} aria-label="Close menu">
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="sb-nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="sb-nav-section">
              <div className="sb-section-label">{section.label}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    [
                      "sb-nav-item",
                      isActive     ? "sb-nav-item--active"    : "",
                      item.highlight ? "sb-nav-item--highlight" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }
                >
                  <span className="sb-nav-icon">{item.icon}</span>
                  <span className="sb-nav-text">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}

          {/* Role-gated items */}
          {(showAdmin || showClients) && (
            <div className="sb-nav-section">
              <div className="sb-section-label">Admin</div>
              {showAdmin && (
                <NavLink
                  to="/admin"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `sb-nav-item${isActive ? " sb-nav-item--active" : ""}`
                  }
                >
                  <span className="sb-nav-icon">⚙️</span>
                  <span className="sb-nav-text">Admin Panel</span>
                </NavLink>
              )}
              {showClients && (
                <NavLink
                  to="/clients"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `sb-nav-item${isActive ? " sb-nav-item--active" : ""}`
                  }
                >
                  <span className="sb-nav-icon">👥</span>
                  <span className="sb-nav-text">Clients</span>
                </NavLink>
              )}
            </div>
          )}
        </nav>

        {/* User footer */}
        <div className="sb-footer">
          <div className="sb-user-row">
            <div className="sb-avatar">{initial}</div>
            <div className="sb-user-info">
              <div className="sb-user-name">
                {user?.full_name || user?.username || "User"}
              </div>
              <div className="sb-user-role">{roleLabel}</div>
            </div>
          </div>
          <div className="sb-footer-links">
            <NavLink
              to="/account"
              onClick={onClose}
              className={({ isActive }) =>
                `sb-footer-btn${isActive ? " sb-footer-btn--active" : ""}`
              }
            >
              <span>👤</span> My Account
            </NavLink>
            <button className="sb-footer-btn sb-footer-btn--danger" onClick={logout}>
              <span>🚪</span> Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
