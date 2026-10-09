import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Logo from "./Logo";

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    let parsedUser = null;
    if (storedUser) {
      parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    }

    const currentRole = (parsedUser?.role || "").toLowerCase();
    const isSpecialistOrAdmin = ["consultant", "dermatologist", "admin"].includes(currentRole);

    if (token && !isSpecialistOrAdmin) {
      axios
        .get("http://127.0.0.1:5000/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setNotifications(res.data.notifications || []))
        .catch(() => {});
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const role = (user?.role || "").toLowerCase();

  let sidebarItems = [];
  let topNavItems = [];

  if (role === "consultant") {
    sidebarItems = [
      { path: "/consultant", label: "Client Profiles", icon: "👥" },
      { path: "/consultant", label: "Assessment Reports", icon: "📑" },
      { path: "/consultant", label: "Progress Monitoring", icon: "📈" },
      { path: "/consultant", label: "Recommendation Management", icon: "💡" },
    ];
    topNavItems = [
      { path: "/consultant", label: "Consultant Portal" },
    ];
  } else if (role === "dermatologist") {
    sidebarItems = [
      { path: "/dermatologist", label: "Patient Insights", icon: "🩺" },
      { path: "/dermatologist", label: "Skin Condition Reports", icon: "📋" },
      { path: "/dermatologist", label: "Treatment Recommendations", icon: "💊" },
      { path: "/dermatologist", label: "Progress Analytics", icon: "📊" },
    ];
    topNavItems = [
      { path: "/dermatologist", label: "Doctor Portal" },
    ];
  } else if (role === "admin") {
    sidebarItems = [
      { path: "/admin", label: "User Management", icon: "👥" },
      { path: "/admin", label: "Platform Analytics", icon: "📊" },
      { path: "/admin", label: "Recommendation Monitoring", icon: "🎯" },
      { path: "/admin", label: "System Reports", icon: "📜" },
    ];
    topNavItems = [
      { path: "/admin", label: "Admin Portal" },
    ];
  } else {
    // Standard End User (Consumer)
    sidebarItems = [
      { path: "/dashboard", label: "Dashboard", icon: "⌂" },
      { path: "/assessment", label: "Skin Analysis", icon: "🔬" },
      { path: "/checklist", label: "Routine Checklist", icon: "⏱" },
      { path: "/products", label: "Product Recommendations", icon: "🛍️" },
      { path: "/progress", label: "Progress Tracking", icon: "📈" },
      { path: "/reports", label: "Reports & Exports", icon: "📄" },
      { path: "/profile", label: "Clinical Profile", icon: "👤" },
      { path: "/settings", label: "Settings", icon: "⚙️" },
    ];
    topNavItems = [
      { path: "/dashboard", label: "Dashboard" },
      { path: "/profile", label: "Profile" },
      { path: "/assessment", label: "Assessment" },
      { path: "/checklist", label: "Checklist" },
      { path: "/products", label: "Products" },
      { path: "/progress", label: "Progress" },
    ];
  }

  return (
    <div style={s.page}>
      {/* LEFT SIDEBAR */}
      <aside style={s.sidebar}>
        <div style={s.sidebarLogo}>
          <Logo size={38} showText={true} />
        </div>

        <nav style={{ marginTop: 28, flex: 1 }}>
          {sidebarItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  ...s.sideLink,
                  ...(active ? s.sideLinkActive : {}),
                }}
              >
                <span style={{ width: 22, fontSize: 15 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={s.sideFooter}>
          <div style={{ fontSize: 12, color: "#2d6a4f", lineHeight: 1.45 }}>
            Your skin is intelligent.
            <br />
            You’re listening.
          </div>
        </div>

        <div style={s.sideUser}>
          <div style={s.avatar}>{user?.name?.[0]?.toUpperCase() || "U"}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.name || "User"}</div>
            <div style={{ fontSize: 11, color: "#6b7280", textTransform: "capitalize" }}>{user?.role || "Member"}</div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={s.main}>
        <header style={s.header}>
          <nav style={{ display: "flex", gap: 6 }}>
            {topNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  ...s.topLink,
                  ...(location.pathname === item.path ? s.topLinkActive : {}),
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
            {/* Notification bell and dropdown - Only visible for consumer users */}
            {!["consultant", "dermatologist", "admin"].includes(role) && (
              <>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{ ...s.bell, position: "relative", cursor: "pointer" }}
                >
                  🔔
                  {notifications.length > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: -4,
                        right: -4,
                        background: "#dc2626",
                        color: "white",
                        borderRadius: "50%",
                        fontSize: 10,
                        fontWeight: 700,
                        width: 17,
                        height: 17,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div
                    style={{
                      position: "absolute",
                      top: 45,
                      right: 80,
                      width: 320,
                      background: "white",
                      borderRadius: 14,
                      boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                      border: "1px solid #e5e7eb",
                      zIndex: 200,
                      padding: 16,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, borderBottom: "1px solid #f3f4f6", paddingBottom: 8 }}>
                      <strong style={{ fontSize: 13.5, color: "#1b4332" }}>
                        Reminders & Alerts ({notifications.length})
                      </strong>
                      <button
                        onClick={() => setNotifications([])}
                        style={{ background: "none", border: "none", color: "#6b7280", fontSize: 11, cursor: "pointer" }}
                      >
                        Clear All
                      </button>
                    </div>

                    {notifications.length === 0 ? (
                      <p style={{ margin: "14px 0", fontSize: 13, color: "#9ca3af", textAlign: "center" }}>
                        No new reminders at this time.
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 320, overflowY: "auto" }}>
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            style={{
                              background: "#f8faf9",
                              border: "1px solid #e2ebe4",
                              borderRadius: 10,
                              padding: 10,
                              fontSize: 12.5,
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                              <span style={{ fontWeight: 700, color: "#1b4332" }}>{n.title}</span>
                              <span style={{ fontSize: 10, color: "#9ca3af" }}>{n.time}</span>
                            </div>
                            <p style={{ margin: "2px 0 6px", color: "#4b5563", lineHeight: 1.35 }}>
                              {n.message}
                            </p>
                            <Link
                              to={n.link}
                              onClick={() => setShowNotifications(false)}
                              style={{ color: "#2d6a4f", fontWeight: 700, textDecoration: "none", fontSize: 11.5 }}
                            >
                              View Details →
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <div style={s.userChip}>
              <div style={s.avatarSmall}>{user?.name?.[0]?.toUpperCase() || "U"}</div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{user?.name || "User"}</span>
            </div>
            <button onClick={handleLogout} style={s.logout}>
              Logout
            </button>
          </div>
        </header>

        <div style={s.content}>{children}</div>
      </div>
    </div>
  );
}

const s = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#eef7f1",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    color: "#1b4332",
  },
  sidebar: {
    width: 210,
    background: "#f7fbf8",
    borderRight: "1px solid #dce8e0",
    display: "flex",
    flexDirection: "column",
    padding: "18px 12px",
    position: "sticky",
    top: 0,
    height: "100vh",
  },
  sidebarLogo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "4px 6px",
  },
  logoIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: "linear-gradient(135deg,#74c69d,#2d6a4f)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 700,
  },
  sideLink: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    borderRadius: 11,
    textDecoration: "none",
    color: "#4d6b57",
    fontSize: 13.5,
    fontWeight: 500,
    marginBottom: 2,
  },
  sideLinkActive: {
    background: "#d8f3dc",
    color: "#1b4332",
    fontWeight: 600,
  },
  sideFooter: {
    background: "#e8f5e9",
    borderRadius: 12,
    padding: "12px",
    marginBottom: 12,
  },
  sideUser: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 6px",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#74c69d,#2d6a4f)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 13,
  },
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  header: {
    height: 56,
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(8px)",
    borderBottom: "1px solid #e2ebe4",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 28px",
    position: "sticky",
    top: 0,
    zIndex: 30,
  },
  topLink: {
    padding: "6px 11px",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 500,
    color: "#4d6b57",
  },
  topLinkActive: {
    color: "#1b4332",
    fontWeight: 600,
    borderBottom: "2px solid #2d6a4f",
    borderRadius: 0,
  },
  bell: { background: "none", border: "none", fontSize: 16, cursor: "pointer" },
  userChip: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    background: "#f0fdf4",
    padding: "3px 10px 3px 3px",
    borderRadius: 20,
  },
  avatarSmall: {
    width: 26,
    height: 26,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#74c69d,#2d6a4f)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
  },
  logout: {
    padding: "6px 13px",
    background: "white",
    border: "1px solid #95d5b2",
    borderRadius: 16,
    fontSize: 12.5,
    fontWeight: 500,
    color: "#1b4332",
    cursor: "pointer",
  },
  content: { padding: "24px 28px 40px", maxWidth: 1080 },
};

export default Layout;