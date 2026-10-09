import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import Logo from "../components/Logo";

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [score, setScore] = useState(null);
  const [hydration, setHydration] = useState(null);
  const [routineDone, setRoutineDone] = useState(0);
  const [routineTotal, setRoutineTotal] = useState(0);
  const [change, setChange] = useState(0);
  const [product, setProduct] = useState(null);
  const [checklist, setChecklist] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token) {
      navigate("/login");
      return;
    }
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      const userRole = (parsedUser.role || "").toLowerCase();
      if (userRole === "admin") {
        navigate("/admin");
        return;
      }
      if (userRole === "dermatologist") {
        navigate("/dermatologist");
        return;
      }
      if (userRole === "consultant") {
        navigate("/consultant");
        return;
      }
    }

    const headers = { Authorization: `Bearer ${token}` };

    // Assessment + product recommendation
    axios
      .get("http://127.0.0.1:5000/assessment", { headers })
      .then((res) => {
        setScore(res.data.assessment?.score ?? null);
        setHydration(res.data.assessment?.breakdown?.hydration ?? null);

        const rec =
          res.data.products?.by_category?.Moisturizer?.[0] ||
          res.data.products?.top?.[0] ||
          null;
        setProduct(rec);
      })
      .catch(() => {});

    // Checklist
    axios
      .get("http://127.0.0.1:5000/checklist", { headers })
      .then((res) => {
        const morning = res.data.morning || [];
        const evening = res.data.evening || [];
        const all = [...morning, ...evening];
        setChecklist(all);
        setRoutineTotal(all.length);
        setRoutineDone(all.filter((i) => i.is_completed).length);
      })
      .catch(() => {});

    // Progress change
    axios
      .get("http://127.0.0.1:5000/progress", { headers })
      .then((res) => setChange(res.data.change || 0))
      .catch(() => {});
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const level = getLevel(score);
  const routinePct = routineTotal ? Math.round((routineDone / routineTotal) * 100) : 0;

  const hydrationLabel =
    hydration == null
      ? "—"
      : hydration >= 80
      ? "Well hydrated"
      : hydration >= 60
      ? "Moderately hydrated"
      : "Needs more hydration";

  const role = (user?.role || "").toLowerCase();

  const sidebarItems = [
    { path: "/dashboard", label: "Dashboard", icon: "⌂" },
    { path: "/assessment", label: "Skin Analysis", icon: "🔬" },
    { path: "/checklist", label: "Routine", icon: "⏱" },
    { path: "/products", label: "Products", icon: "🛍️" },
    { path: "/progress", label: "Progress", icon: "📈" },
    { path: "/reports", label: "Reports", icon: "📄" },
    { path: "/profile", label: "Profile", icon: "👤" },
    { path: "/settings", label: "Settings", icon: "⚙️" },
  ];

  if (["dermatologist", "consultant", "admin"].includes(role)) {
    sidebarItems.push({
      path: "/dermatologist",
      label: role === "consultant" ? "Consultant Portal" : "Doctor Portal",
      icon: "🩺",
    });
  }

  if (role === "admin") {
    sidebarItems.push({ path: "/admin", label: "Admin Portal", icon: "🛡️" });
  }

  const topNavItems = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/profile", label: "Profile" },
    { path: "/assessment", label: "Skin Analysis" },
    { path: "/checklist", label: "Checklist" },
    { path: "/products", label: "Products" },
    { path: "/progress", label: "Progress" },
    { path: "/reports", label: "Reports" },
  ];

  if (["dermatologist", "consultant", "admin"].includes(role)) {
    topNavItems.push({ path: "/dermatologist", label: "Doctor Portal" });
  }
  if (role === "admin") {
    topNavItems.push({ path: "/admin", label: "Admin" });
  }

  const greeting = getGreeting();

  // Show only first 6 checklist items in the preview
  const previewChecklist = checklist.slice(0, 6);

  return (
    <div style={s.page}>
      {/* ──────────── LEFT SIDEBAR ──────────── */}
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

      {/* ──────────── MAIN CONTENT ──────────── */}
      <div style={s.main}>
        {/* Top Header */}
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

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={s.bell}>🔔</button>
            <div style={s.userChip}>
              <div style={s.avatarSmall}>{user?.name?.[0]?.toUpperCase() || "U"}</div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{user?.name || "User"}</span>
            </div>
            <button onClick={handleLogout} style={s.logout}>
              Logout
            </button>
          </div>
        </header>

        <div style={s.content}>
          {/* Greeting */}
          <div style={s.greetingRow}>
            <div>
              <h1 style={s.greeting}>
                {greeting}, {user?.name || "there"}!
              </h1>
              <p style={s.sub}>
                Here’s your skin intelligence overview for today. Small steps. Healthier skin. Brighter you.
              </p>
            </div>
            <div style={s.dateBadge}>
              📅{" "}
              {new Date().toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>

          {/* ── Top 3 Stats ── */}
          <div style={s.statsGrid}>
            {/* Skin Health Score */}
            <div style={s.card}>
              <div style={s.cardHead}>
                <span style={s.cardLabel}>Skin Health Score</span>
                <span style={s.cardIcon}>✦</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0" }}>
                <span style={s.bigNum}>{score ?? "--"}</span>
                <span style={s.badge(level.color)}>{level.label}</span>
              </div>
              <div style={s.barTrack}>
                <div
                  style={{
                    ...s.barFill,
                    width: `${score || 0}%`,
                    background: "linear-gradient(90deg,#52b788,#2d6a4f)",
                  }}
                />
              </div>
              <p style={s.note}>Your skin is doing well. Keep building healthy habits.</p>
            </div>

            {/* Routine Adherence */}
            <div style={s.card}>
              <div style={s.cardHead}>
                <span style={s.cardLabel}>Routine Adherence</span>
                <span style={s.cardIcon}>📅</span>
              </div>
              <div style={{ margin: "8px 0" }}>
                <span style={s.bigNum}>{routinePct}%</span>
              </div>
              <p style={{ margin: "0 0 6px", fontSize: 13, color: "#4d6b57" }}>
                {routineDone} of {routineTotal || 8} steps completed
              </p>
              <div style={s.barTrack}>
                <div
                  style={{
                    ...s.barFill,
                    width: `${routinePct}%`,
                    background: "linear-gradient(90deg,#34d399,#059669)",
                  }}
                />
              </div>
              <p style={s.note}>
                {routinePct >= 80 ? "Great consistency! Keep it up." : "Keep going — you’re building a habit."}
              </p>
            </div>

            {/* Hydration */}
            <div style={s.card}>
              <div style={s.cardHead}>
                <span style={s.cardLabel}>Hydration</span>
                <span style={s.cardIcon}>💧</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "8px 0 4px" }}>
                <span style={s.bigNum}>{hydration ?? "--"}</span>
                <span style={{ fontSize: 15, color: "#6b7280" }}>/ 100</span>
              </div>
              <p style={{ margin: "0 0 6px", fontSize: 13, color: "#4d6b57" }}>{hydrationLabel}</p>
              <div style={s.barTrack}>
                <div
                  style={{
                    ...s.barFill,
                    width: `${hydration || 0}%`,
                    background: "linear-gradient(90deg,#60a5fa,#3b82f6)",
                  }}
                />
              </div>
              <p style={s.note}>Keep drinking water and using hydrating products.</p>
            </div>
          </div>

          {/* ── Today's Focus + Daily Checklist ── */}
          <div style={s.twoCol}>
            {/* Today's Focus (Personalized Routine) */}
            <div style={s.card}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={s.roundIcon}>◎</div>
                <div>
                  <h3 style={s.sectionTitle}>Today’s Focus</h3>
                  <p style={s.sectionSub}>Personalized focus areas for your skin today.</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
                <FocusCard
                  icon="💧"
                  title="Hydrate"
                  text="Boost moisture barrier with hydrating actives."
                />
                <FocusCard
                  icon="🛡"
                  title="Protect"
                  text="Shield your skin from UV and environmental stressors."
                />
                <FocusCard
                  icon="✨"
                  title="Repair"
                  text="Support overnight repair with nourishing ingredients."
                />
              </div>

              <Link to="/checklist" style={s.primaryBtn}>
                View My Routine →
              </Link>
            </div>

            {/* Daily Checklist */}
            <div style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ ...s.roundIcon, background: "#d1fae5" }}>✓</div>
                  <div>
                    <h3 style={s.sectionTitle}>Daily Checklist</h3>
                    <p style={s.sectionSub}>Your progress for today</p>
                  </div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#2d6a4f" }}>
                  {routineDone} of {routineTotal || 8} completed
                </span>
              </div>

              <div style={s.barTrack}>
                <div
                  style={{
                    ...s.barFill,
                    width: `${routinePct}%`,
                    background: "linear-gradient(90deg,#34d399,#059669)",
                  }}
                />
              </div>

              <div style={{ marginTop: 14 }}>
                {previewChecklist.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#6b7280" }}>No checklist items yet.</p>
                ) : (
                  previewChecklist.map((item, idx) => (
                    <div key={idx} style={s.checkRow}>
                      <span style={item.is_completed ? s.checkOn : s.checkOff}>
                        {item.is_completed ? "✓" : ""}
                      </span>
                      <span style={{ flex: 1, fontSize: 13.5 }}>{item.item}</span>
                      <span style={{ fontSize: 12, color: item.is_completed ? "#059669" : "#9ca3af" }}>
                        {item.is_completed ? "Done" : "Pending"}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <Link to="/checklist" style={s.linkBtn}>
                Open full checklist →
              </Link>
            </div>
          </div>

          {/* ── Progress + Product Recommendation ── */}
          <div style={s.twoCol}>
            {/* Progress Tracking */}
            <div style={s.card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>📈</span>
                <h3 style={s.sectionTitle}>Progress</h3>
              </div>
              <p style={s.sectionSub}>Your skin health progress over time.</p>

              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
                <div>
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 700,
                      color: change > 0 ? "#059669" : change < 0 ? "#dc2626" : "#6b7280",
                    }}
                  >
                    {change > 0 ? `+${change}` : change < 0 ? change : "—"} points
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                    Vs previous assessment
                  </p>
                </div>

                {/* Simple trend line */}
                <svg width="140" height="50" viewBox="0 0 140 50" style={{ marginLeft: "auto" }}>
                  <path
                    d="M5 40 C 30 36, 50 28, 70 22 S 110 12, 135 8"
                    fill="none"
                    stroke="#74c69d"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="135" cy="8" r="4" fill="#2d6a4f" />
                </svg>
              </div>

              <Link to="/progress" style={{ ...s.secondaryBtn, marginTop: 16 }}>
                View Progress →
              </Link>
            </div>

            {/* Product Recommendation */}
            <div style={s.card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>🎁</span>
                <h3 style={s.sectionTitle}>Recommended for You</h3>
              </div>
              <p style={s.sectionSub}>Personalized product recommendation</p>

              <div style={{ display: "flex", gap: 14, marginTop: 12, alignItems: "center" }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 14,
                    background: "linear-gradient(135deg,#d8f3dc,#b7e4c7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                  }}
                >
                  🧴
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1b4332" }}>
                    {product?.name || "Hydra Barrier Moisturizer"}
                  </div>
                  <div style={{ fontSize: 12, color: "#059669", fontWeight: 600, margin: "3px 0" }}>
                    {product?.suitability_score
                      ? `${product.suitability_score}% match`
                      : "95% match"}
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>
                    {product?.match_reasons?.[0] ||
                      "Ceramide-rich daily moisturizer for deep hydration and barrier support."}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                <span style={s.tag}>Hydration</span>
                <span style={s.tag}>Barrier Support</span>
              </div>

              <Link to="/assessment" style={{ ...s.secondaryBtn, marginTop: 14 }}>
                View Product →
              </Link>
            </div>
          </div>

          {/* Footer line */}
          <p style={s.footerLine}>✦ Consistency today. Radiance tomorrow. That’s Skin Intelligence.</p>
        </div>
      </div>
    </div>
  );
}

/* ── Small Components ── */

function FocusCard({ icon, title, text }) {
  return (
    <div
      style={{
        flex: 1,
        background: "#f0fdf4",
        borderRadius: 14,
        padding: "14px 12px",
        border: "1px solid #d8f3dc",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 13, color: "#1b4332", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 11.5, color: "#6b7280", lineHeight: 1.35 }}>{text}</div>
    </div>
  );
}

function getLevel(score) {
  if (score == null) return { color: "#6b7280", label: "—" };
  if (score < 40) return { color: "#dc2626", label: "Needs Attention" };
  if (score < 60) return { color: "#ea580c", label: "Fair" };
  if (score < 75) return { color: "#d97706", label: "Average" };
  if (score < 90) return { color: "#16a34a", label: "Good" };
  return { color: "#15803d", label: "Excellent" };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ── Styles ── */

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
  greetingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 22,
    gap: 16,
  },
  greeting: {
    margin: 0,
    fontSize: "1.75rem",
    fontWeight: 600,
    color: "#1b4332",
    fontFamily: "Georgia, 'Times New Roman', serif",
  },
  sub: { margin: "5px 0 0", fontSize: 13.5, color: "#6b7280", maxWidth: 460 },
  dateBadge: {
    background: "white",
    border: "1px solid #d8f3dc",
    padding: "7px 13px",
    borderRadius: 18,
    fontSize: 12.5,
    color: "#2d6a4f",
    fontWeight: 500,
    whiteSpace: "nowrap",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1.15fr 1fr 1fr",
    gap: 14,
    marginBottom: 14,
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1.15fr 1fr",
    gap: 14,
    marginBottom: 14,
  },
  card: {
    background: "white",
    borderRadius: 16,
    padding: "18px 20px",
    boxShadow: "0 3px 14px rgba(27,67,50,0.05)",
    border: "1px solid #edf5f0",
  },
  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  cardLabel: { fontSize: 13, fontWeight: 600, color: "#4d6b57" },
  cardIcon: {
    width: 26,
    height: 26,
    borderRadius: "50%",
    background: "#f0fdf4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
  },
  bigNum: { fontSize: 34, fontWeight: 700, color: "#1b4332", lineHeight: 1 },
  badge: (color) => ({
    background: `${color}18`,
    color,
    padding: "2px 9px",
    borderRadius: 20,
    fontSize: 11.5,
    fontWeight: 600,
  }),
  barTrack: {
    height: 6,
    background: "#e5e7eb",
    borderRadius: 20,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 20, transition: "width 0.5s ease" },
  note: { margin: "9px 0 0", fontSize: 12, color: "#6b7280", lineHeight: 1.4 },
  roundIcon: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#e0f2fe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
  },
  sectionTitle: { margin: 0, fontSize: 15, color: "#1b4332", fontWeight: 700 },
  sectionSub: { margin: "2px 0 0", fontSize: 12.5, color: "#6b7280" },
  primaryBtn: {
    display: "inline-block",
    width: "100%",
    textAlign: "center",
    padding: "11px 0",
    background: "linear-gradient(135deg,#2d6a4f,#1b4332)",
    color: "white",
    textDecoration: "none",
    borderRadius: 12,
    fontSize: 13.5,
    fontWeight: 600,
  },
  secondaryBtn: {
    display: "inline-block",
    padding: "8px 14px",
    background: "#f0fdf4",
    color: "#1b4332",
    textDecoration: "none",
    borderRadius: 20,
    fontSize: 12.5,
    fontWeight: 600,
    border: "1px solid #d8f3dc",
  },
  linkBtn: {
    display: "inline-block",
    marginTop: 12,
    fontSize: 13,
    fontWeight: 600,
    color: "#2d6a4f",
    textDecoration: "none",
  },
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "7px 0",
    borderBottom: "1px solid #f3f4f6",
  },
  checkOn: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "#10b981",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
  },
  checkOff: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    border: "1.5px solid #d1d5db",
  },
  tag: {
    background: "#f0fdf4",
    color: "#2d6a4f",
    fontSize: 11,
    fontWeight: 600,
    padding: "3px 9px",
    borderRadius: 20,
  },
  footerLine: {
    textAlign: "center",
    marginTop: 28,
    fontSize: 12.5,
    color: "#6b7280",
  },
};

export default Dashboard;