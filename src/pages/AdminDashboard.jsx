
import { useCallback, useEffect, useMemo, useState } from "react";

const API = "http://localhost:8000";

const COLORS = {
  bg: "#FBF7F4",
  card: "#FFFFFF",
  burgundy: "#70283D",
  burgundyDark: "#4C192A",
  rose: "#F3E1E5",
  roseLight: "#FAF0F2",
  text: "#34252A",
  muted: "#8B7B80",
  border: "#EDE2E3",
  green: "#267653",
  greenBg: "#E8F5ED",
  red: "#B4233D",
  redBg: "#FCE9ED",
};

const ROLES = ["user", "dermatologist", "consultant", "admin"];

const EMPTY_STATS = {
  total_users: 0,
  total_dermatologists: 0,
  total_consultants: 0,
  total_assessments: 0,
  pending_consultations: 0,
};

const css = {
  page: {
    minHeight: "100vh",
    background: COLORS.bg,
    color: COLORS.text,
    fontFamily:
      "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    padding: "clamp(16px, 3vw, 36px)",
    boxSizing: "border-box",
  },
  container: {
    maxWidth: "1440px",
    margin: "0 auto",
  },
  eyebrow: {
    color: COLORS.burgundy,
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "2.5px",
    textTransform: "uppercase",
    marginBottom: "10px",
  },
  title: {
    margin: 0,
    fontSize: "clamp(28px, 4vw, 40px)",
    fontWeight: 750,
    letterSpacing: "-1.5px",
    color: COLORS.burgundyDark,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: "14px",
    lineHeight: 1.7,
    marginTop: "10px",
  },
  card: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 8px 28px rgba(91, 35, 53, 0.035)",
    minWidth: 0,
  },
  sectionTitle: {
    margin: 0,
    fontSize: "19px",
    fontWeight: 750,
    color: COLORS.burgundyDark,
  },
  muted: {
    color: COLORS.muted,
    fontSize: "13px",
    lineHeight: 1.6,
  },
  input: {
    width: "100%",
    minWidth: 0,
    padding: "12px 14px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: "11px",
    background: "#FFFEFD",
    color: COLORS.text,
    fontSize: "13px",
    outlineColor: COLORS.burgundy,
    boxSizing: "border-box",
  },
  button: {
    padding: "11px 17px",
    border: "none",
    borderRadius: "11px",
    background: COLORS.burgundy,
    color: "#FFFFFF",
    fontWeight: 700,
    fontSize: "13px",
    cursor: "pointer",
  },
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function getInitials(name) {
  return (name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.detail || data.message || `Request failed (${response.status})`
    );
  }

  return data;
}

function StatCard({ label, value, description, icon, accent, loading }) {
  return (
    <div
      style={{
        ...css.card,
        padding: "23px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          background: accent,
          opacity: 0.45,
          right: "-38px",
          top: "-40px",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          position: "relative",
        }}
      >
        <span style={{ ...css.muted, fontWeight: 650 }}>{label}</span>

        <div
          style={{
            width: "43px",
            height: "43px",
            borderRadius: "14px",
            display: "grid",
            placeItems: "center",
            background: accent,
            color: COLORS.burgundy,
            fontSize: "20px",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>

      <div
        style={{
          marginTop: "23px",
          fontSize: "clamp(28px, 3vw, 35px)",
          fontWeight: 800,
          letterSpacing: "-1px",
          color: COLORS.burgundyDark,
          position: "relative",
        }}
      >
        {loading ? "..." : formatNumber(value)}
      </div>

      <div style={{ ...css.muted, marginTop: "6px", fontSize: "12px" }}>
        {description}
      </div>
    </div>
  );
}

function RoleBadge({ role }) {
  const backgrounds = {
    admin: "#F3E1E5",
    dermatologist: "#E7EDF9",
    consultant: "#F8EDD8",
    user: "#E9F4EC",
  };

  const foregrounds = {
    admin: COLORS.burgundy,
    dermatologist: "#365B9D",
    consultant: "#93671A",
    user: "#267653",
  };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "6px 10px",
        borderRadius: "8px",
        background: backgrounds[role] || "#F0ECEC",
        color: foregrounds[role] || COLORS.text,
        fontSize: "11px",
        fontWeight: 800,
        textTransform: "capitalize",
        whiteSpace: "nowrap",
      }}
    >
      {role || "user"}
    </span>
  );
}

function VerificationBadge({ verified }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "12px",
        fontWeight: 650,
        color: verified ? COLORS.green : COLORS.red,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: verified ? COLORS.green : COLORS.red,
        }}
      />
      {verified ? "Verified" : "Unverified"}
    </span>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(EMPTY_STATS);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [savingUserId, setSavingUserId] = useState(null);

  const loadOverview = useCallback(async () => {
    const data = await apiRequest("/admin/overview");
    setStats({ ...EMPTY_STATS, ...data });
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);

    try {
      const data = await apiRequest("/admin/users");
      setUsers(Array.isArray(data.users) ? data.users : []);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      await Promise.all([loadOverview(), loadUsers()]);
    } catch (err) {
      setError(err.message || "Unable to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  }, [loadOverview, loadUsers]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        String(user.id).includes(query) ||
        (user.name || "").toLowerCase().includes(query) ||
        (user.email || "").toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "all" || (user.role || "user") === roleFilter;

      const matchesVerification =
        verificationFilter === "all" ||
        (verificationFilter === "verified" && user.email_verified) ||
        (verificationFilter === "unverified" && !user.email_verified);

      return matchesSearch && matchesRole && matchesVerification;
    });
  }, [users, search, roleFilter, verificationFilter]);

  async function updateRole(user, newRole) {
    if (!newRole || newRole === user.role) return;

    const confirmed = window.confirm(
      `Change ${user.name || user.email}'s role to "${newRole}"?`
    );

    if (!confirmed) return;

    setSavingUserId(user.id);
    setError("");
    setNotice("");

    try {
      await apiRequest(`/admin/users/${user.id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole }),
      });

      setUsers((previous) =>
        previous.map((item) =>
          item.id === user.id ? { ...item, role: newRole } : item
        )
      );

      setNotice(`Role updated successfully for ${user.name || user.email}.`);

      await loadOverview();
    } catch (err) {
      setError(err.message || "Unable to update user role.");
    } finally {
      setSavingUserId(null);
    }
  }

  const navItems = [
    { id: "overview", label: "Overview", icon: "▦" },
    { id: "users", label: "User Management", icon: "♙" },
  ];

  return (
    <div style={css.page}>
      <style>{`
        * { box-sizing: border-box; }
        .admin-layout { display: grid; grid-template-columns: 238px minmax(0, 1fr); gap: 26px; align-items: start; }
        .admin-sidebar { background: #fff; border: 1px solid ${COLORS.border}; border-radius: 22px; padding: 25px 15px; position: sticky; top: 20px; }
        .admin-main { min-width: 0; }
        .admin-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 17px; }
        .admin-table-wrap { width: 100%; overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; text-align: left; min-width: 760px; }
        .admin-table th { padding: 15px 13px; color: ${COLORS.muted}; background: #FCF8F7; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; font-weight: 800; white-space: nowrap; }
        .admin-table td { padding: 17px 13px; border-bottom: 1px solid ${COLORS.border}; font-size: 13px; vertical-align: middle; }
        .admin-table tr:last-child td { border-bottom: none; }
        .admin-nav { display: flex; width: 100%; gap: 11px; align-items: center; text-align: left; border: none; padding: 13px 14px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; margin-top: 7px; }
        .admin-filter-grid { display: grid; grid-template-columns: minmax(180px, 1fr) 170px 170px; gap: 12px; }
        .admin-mobile-nav { display: none; }
        .admin-role-select { border: 1px solid ${COLORS.border}; border-radius: 9px; padding: 9px 10px; background: #fff; color: ${COLORS.text}; font-size: 12px; max-width: 155px; }
        @media (max-width: 1000px) {
          .admin-layout { grid-template-columns: 1fr; }
          .admin-sidebar { position: static; }
          .admin-sidebar-nav { display: flex; gap: 8px; flex-wrap: wrap; }
          .admin-nav { width: auto; margin: 0; }
          .admin-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 600px) {
          .admin-stats { grid-template-columns: 1fr; }
          .admin-filter-grid { grid-template-columns: 1fr; }
          .admin-header { align-items: flex-start !important; flex-direction: column; }
          .admin-card { padding: 17px !important; }
        }
      `}</style>

      <div style={css.container}>
        <header
          className="admin-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <div>
            <div style={css.eyebrow}>SKINSENSE AI · ADMINISTRATION</div>
            <h1 style={css.title}>Admin Dashboard</h1>
            <p style={css.subtitle}>
              Manage your skincare platform with clarity and confidence.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            style={{
              ...css.button,
              opacity: loading ? 0.7 : 1,
              whiteSpace: "nowrap",
            }}
          >
            ↻ {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </header>

        {error && (
          <div
            role="alert"
            style={{
              padding: "14px 17px",
              marginBottom: "20px",
              borderRadius: "12px",
              border: "1px solid #F0C6CE",
              background: COLORS.redBg,
              color: COLORS.red,
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            <strong>Something went wrong:</strong> {error}
            <div style={{ marginTop: "5px" }}>
              Check that the backend is running, you are logged in as admin,
              and the three admin APIs have been added.
            </div>
          </div>
        )}

        {notice && (
          <div
            role="status"
            style={{
              padding: "13px 16px",
              marginBottom: "20px",
              borderRadius: "12px",
              background: COLORS.greenBg,
              color: COLORS.green,
              fontSize: "13px",
            }}
          >
            ✓ {notice}
          </div>
        )}

        <div className="admin-layout">
          <aside className="admin-sidebar">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "11px",
                padding: "0 8px 24px",
                borderBottom: `1px solid ${COLORS.border}`,
                marginBottom: "19px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "15px",
                  background: COLORS.burgundy,
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "22px",
                }}
              >
                ✿
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 850,
                    fontSize: "16px",
                    color: COLORS.burgundyDark,
                    letterSpacing: "-0.4px",
                  }}
                >
                  SkinSense
                </div>
                <div
                  style={{
                    color: COLORS.muted,
                    fontSize: "10px",
                    letterSpacing: "1.5px",
                    marginTop: "3px",
                  }}
                >
                  ADMIN PANEL
                </div>
              </div>
            </div>

            <div
              style={{
                ...css.muted,
                fontSize: "10px",
                letterSpacing: "1.4px",
                fontWeight: 800,
                padding: "0 12px",
                marginBottom: "10px",
                textTransform: "uppercase",
              }}
            >
              Workspace
            </div>

            <div className="admin-sidebar-nav">
              {navItems.map((item) => {
                const selected = activeTab === item.id;

                return (
                  <button
                    type="button"
                    key={item.id}
                    className="admin-nav"
                    onClick={() => {
                      setActiveTab(item.id);
                      setError("");
                      setNotice("");
                    }}
                    style={{
                      background: selected ? COLORS.rose : "transparent",
                      color: selected ? COLORS.burgundy : COLORS.muted,
                    }}
                  >
                    <span style={{ fontSize: "20px", width: "23px" }}>
                      {item.icon}
                    </span>
                    {item.label}
                    {selected && (
                      <span
                        style={{
                          marginLeft: "auto",
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: COLORS.burgundy,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div
              style={{
                marginTop: "30px",
                padding: "17px 14px",
                borderRadius: "15px",
                background: COLORS.roseLight,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <div style={{ fontSize: "20px", marginBottom: "9px" }}>♡</div>
              <div
                style={{
                  color: COLORS.burgundyDark,
                  fontSize: "13px",
                  fontWeight: 800,
                }}
              >
                Care starts here.
              </div>
              <p
                style={{
                  ...css.muted,
                  fontSize: "11px",
                  marginBottom: 0,
                }}
              >
                Keep your platform and care team organized.
              </p>
            </div>
          </aside>

          <main className="admin-main">
            {activeTab === "overview" && (
              <section>
                <div style={{ marginBottom: "22px" }}>
                  <div style={css.eyebrow}>YOUR PLATFORM AT A GLANCE</div>
                  <h2 style={css.sectionTitle}>Overview</h2>
                  <p style={css.muted}>
                    A live snapshot of your SkinSense AI platform.
                  </p>
                </div>

                <div className="admin-stats">
                  <StatCard
                    label="Total Users"
                    value={stats.total_users}
                    description="All registered accounts"
                    icon="♙"
                    accent="#F3E1E5"
                    loading={loading}
                  />
                  <StatCard
                    label="Dermatologists"
                    value={stats.total_dermatologists}
                    description="Dermatologist accounts"
                    icon="✚"
                    accent="#E9EAF8"
                    loading={loading}
                  />
                  <StatCard
                    label="Consultants"
                    value={stats.total_consultants}
                    description="Consultant accounts"
                    icon="♧"
                    accent="#F8EEDC"
                    loading={loading}
                  />
                  <StatCard
                    label="Assessments"
                    value={stats.total_assessments}
                    description="Saved skin profiles"
                    icon="♡"
                    accent="#E5F3E9"
                    loading={loading}
                  />
                  <StatCard
                    label="Pending Consultations"
                    value={stats.pending_consultations}
                    description="Requests awaiting assignment"
                    icon="◷"
                    accent="#F9E6E7"
                    loading={loading}
                  />
                  <div
                    style={{
                      ...css.card,
                      background: COLORS.burgundy,
                      color: "#fff",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minHeight: "165px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: "#EBCBD3",
                          fontSize: "10px",
                          fontWeight: 800,
                          letterSpacing: "1.8px",
                        }}
                      >
                        PLATFORM SNAPSHOT
                      </div>
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: 800,
                          lineHeight: 1.3,
                          marginTop: "17px",
                        }}
                      >
                        Built around better skin health.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("users")}
                      style={{
                        ...css.button,
                        background: "#FFFFFF",
                        color: COLORS.burgundy,
                        alignSelf: "flex-start",
                        marginTop: "20px",
                      }}
                    >
                      Manage users →
                    </button>
                  </div>
                </div>

                <div
                  className="admin-card"
                  style={{
                    ...css.card,
                    marginTop: "22px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h3 style={css.sectionTitle}>User Management</h3>
                    <p style={css.muted}>
                      Search accounts, review verification, and manage roles.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("users")}
                    style={css.button}
                  >
                    View all users →
                  </button>
                </div>
              </section>
            )}

            {activeTab === "users" && (
              <section>
                <div
                  className="admin-header"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    marginBottom: "22px",
                  }}
                >
                  <div>
                    <div style={css.eyebrow}>PEOPLE & PERMISSIONS</div>
                    <h2 style={css.sectionTitle}>User Management</h2>
                    <p style={css.muted}>
                      {formatNumber(filteredUsers.length)} matching accounts
                      out of {formatNumber(users.length)} total.
                    </p>
                  </div>

                  <button
                    type="button"
                    style={css.button}
                    onClick={async () => {
                      setError("");
                      setNotice("");
                      try {
                        await loadUsers();
                      } catch (err) {
                        setError(err.message);
                      }
                    }}
                    disabled={usersLoading}
                  >
                    ↻ {usersLoading ? "Loading..." : "Refresh Users"}
                  </button>
                </div>

                <div
                  className="admin-card"
                  style={{ ...css.card, marginBottom: "18px" }}
                >
                  <div className="admin-filter-grid">
                    <input
                      aria-label="Search users"
                      style={css.input}
                      placeholder="⌕  Search name, email or user ID..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />

                    <select
                      aria-label="Filter by role"
                      style={css.input}
                      value={roleFilter}
                      onChange={(event) => setRoleFilter(event.target.value)}
                    >
                      <option value="all">All roles</option>
                      {ROLES.map((role) => (
                        <option value={role} key={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </option>
                      ))}
                    </select>

                    <select
                      aria-label="Filter by verification"
                      style={css.input}
                      value={verificationFilter}
                      onChange={(event) =>
                        setVerificationFilter(event.target.value)
                      }
                    >
                      <option value="all">All verification</option>
                      <option value="verified">Verified</option>
                      <option value="unverified">Unverified</option>
                    </select>
                  </div>
                </div>

                <div className="admin-card" style={css.card}>
                  {usersLoading ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "55px 15px",
                        color: COLORS.muted,
                      }}
                    >
                      Loading user accounts...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "55px 15px",
                      }}
                    >
                      <div style={{ fontSize: "35px", marginBottom: "12px" }}>
                        ♙
                      </div>
                      <h3 style={css.sectionTitle}>No users found</h3>
                      <p style={css.muted}>
                        Try changing your search or filters.
                      </p>
                      <button
                        type="button"
                        style={css.button}
                        onClick={() => {
                          setSearch("");
                          setRoleFilter("all");
                          setVerificationFilter("all");
                        }}
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>User ID</th>
                            <th>Role</th>
                            <th>Email Status</th>
                            <th>Manage Role</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((user) => (
                            <tr key={user.id}>
                              <td>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "11px",
                                    minWidth: "190px",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "39px",
                                      height: "39px",
                                      borderRadius: "13px",
                                      display: "grid",
                                      placeItems: "center",
                                      flexShrink: 0,
                                      background: COLORS.rose,
                                      color: COLORS.burgundy,
                                      fontSize: "12px",
                                      fontWeight: 850,
                                    }}
                                  >
                                    {getInitials(user.name)}
                                  </div>
                                  <div style={{ minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontWeight: 750,
                                        color: COLORS.text,
                                        marginBottom: "4px",
                                      }}
                                    >
                                      {user.name || "Unnamed user"}
                                    </div>
                                    <div
                                      style={{
                                        color: COLORS.muted,
                                        fontSize: "12px",
                                        overflowWrap: "anywhere",
                                      }}
                                    >
                                      {user.email}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td
                                style={{
                                  color: COLORS.muted,
                                  fontVariantNumeric: "tabular-nums",
                                }}
                              >
                                #{user.id}
                              </td>

                              <td>
                                <RoleBadge role={user.role || "user"} />
                              </td>

                              <td>
                                <VerificationBadge
                                  verified={user.email_verified}
                                />
                              </td>

                              <td>
                                <select
                                  aria-label={`Change role for ${user.name || user.email}`}
                                  className="admin-role-select"
                                  value={user.role || "user"}
                                  disabled={savingUserId === user.id}
                                  onChange={(event) =>
                                    updateRole(user, event.target.value)
                                  }
                                >
                                  {ROLES.map((role) => (
                                    <option value={role} key={role}>
                                      {role.charAt(0).toUpperCase() +
                                        role.slice(1)}
                                    </option>
                                  ))}
                                </select>

                                {savingUserId === user.id && (
                                  <div
                                    style={{
                                      ...css.muted,
                                      fontSize: "10px",
                                      marginTop: "5px",
                                    }}
                                  >
                                    Saving...
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div
                    style={{
                      borderTop: `1px solid ${COLORS.border}`,
                      marginTop: "14px",
                      paddingTop: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <span style={css.muted}>
                      Showing {filteredUsers.length} of {users.length} users
                    </span>
                    <span style={{ ...css.muted, fontSize: "11px" }}>
                      Role changes require confirmation.
                    </span>
                  </div>
                </div>
              </section>
            )}

            <footer
              style={{
                marginTop: "28px",
                padding: "17px 4px",
                borderTop: `1px solid ${COLORS.border}`,
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "8px",
                color: COLORS.muted,
                fontSize: "11px",
              }}
            >
              <span>© SkinSense AI · Admin Workspace</span>
              <span>Personalized skincare, thoughtfully managed.</span>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
