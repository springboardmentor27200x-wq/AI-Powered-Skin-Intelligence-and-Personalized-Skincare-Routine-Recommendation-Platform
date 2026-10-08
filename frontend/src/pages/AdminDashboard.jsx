import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [topConcerns, setTopConcerns] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleMessage, setRoleMessage] = useState("");

  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    loadAdminData();
  }, [navigate]);

  const loadAdminData = () => {
    setLoading(true);
    setError("");

    // Load stats
    const statsPromise = axios.get("http://127.0.0.1:5000/api/admin/stats", {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Load users
    const usersPromise = axios.get("http://127.0.0.1:5000/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    });

    Promise.all([statsPromise, usersPromise])
      .then(([statsRes, usersRes]) => {
        setStats(statsRes.data.stats || {});
        setTopConcerns(statsRes.data.top_concerns || {});
        setUsers(usersRes.data.users || []);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Admin access required to view this portal.");
      })
      .finally(() => setLoading(false));
  };

  const handleRoleChange = async (userId, newRole) => {
    setRoleMessage("");
    try {
      await axios.post(
        `http://127.0.0.1:5000/api/admin/user/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRoleMessage(`User role updated to ${newRole}!`);
      loadAdminData();
    } catch {
      alert("Failed to update user role.");
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This will delete all their profiles and records.`)) {
      return;
    }

    try {
      await axios.delete(`http://127.0.0.1:5000/api/admin/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoleMessage(`User ${userName} deleted.`);
      loadAdminData();
    } catch {
      alert("Failed to delete user.");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.role || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div style={{ maxWidth: 1040, margin: "0 auto", paddingBottom: 60 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }}>🛡️</span>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1b4332", margin: 0 }}>
                Platform Administration Portal
              </h1>
            </div>
            <p style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>
              User management, role assignment, platform-wide health analytics, and system monitoring.
            </p>
          </div>

          <span
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "6px 16px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Role: {user?.role || "Admin"}
          </span>
        </div>

        {error ? (
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 14, padding: 24, textAlign: "center" }}>
            <h3 style={{ color: "#991b1b", margin: "0 0 8px" }}>Access Restricted</h3>
            <p style={{ color: "#7f1d1d", fontSize: 14, margin: "0 0 16px" }}>{error}</p>
            <p style={{ fontSize: 13, color: "#6b7280" }}>
              Only users with the <strong>Admin</strong> role can view system-wide user records and statistics.
            </p>
            <Link
              to="/dashboard"
              style={{
                display: "inline-block",
                marginTop: 12,
                background: "#1b4332",
                color: "white",
                padding: "8px 18px",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Return to User Dashboard
            </Link>
          </div>
        ) : loading ? (
          <p style={{ color: "#6b7280" }}>Loading administration metrics...</p>
        ) : (
          <>
            {roleMessage && (
              <div style={{ background: "#d1fae5", color: "#065f46", padding: 12, borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: 600 }}>
                {roleMessage}
              </div>
            )}

            {/* ── System Overview Cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
              <div style={statBox}>
                <div style={statLabel}>Total Users</div>
                <div style={statNum}>{stats?.total_users ?? 0}</div>
              </div>
              <div style={statBox}>
                <div style={statLabel}>Dermatologists & Consultants</div>
                <div style={statNum}>{(stats?.total_dermatologists ?? 0) + (stats?.total_consultants ?? 0)}</div>
              </div>
              <div style={statBox}>
                <div style={statLabel}>Completed Skin Profiles</div>
                <div style={statNum}>{stats?.profiles_created ?? 0}</div>
              </div>
              <div style={statBox}>
                <div style={statLabel}>Total AI Assessments</div>
                <div style={statNum}>{stats?.total_assessments ?? 0}</div>
              </div>
              <div style={statBox}>
                <div style={statLabel}>Average Platform Skin Score</div>
                <div style={{ ...statNum, color: "#166534" }}>{stats?.average_skin_score ?? 0}/100</div>
              </div>
            </div>

            {/* ── Platform Insights & Concerns Distribution ── */}
            <div style={{ background: "white", borderRadius: 16, padding: 22, border: "1px solid #e5e7eb", marginBottom: 28 }}>
              <h2 style={{ fontSize: 16, color: "#1b4332", margin: "0 0 14px", fontWeight: 700 }}>
                📊 Top Reported Skin Concerns Across All Users
              </h2>
              {Object.keys(topConcerns).length === 0 ? (
                <p style={{ color: "#6b7280", fontSize: 13 }}>No concern statistics available yet.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                  {Object.entries(topConcerns).map(([concern, count]) => (
                    <div key={concern} style={{ background: "#f8faf9", borderRadius: 12, padding: 12, border: "1px solid #e2ebe4" }}>
                      <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>{concern}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#1b4332", marginTop: 4 }}>
                        {count} <span style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af" }}>users</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── User Management Section ── */}
            <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div>
                  <h2 style={{ fontSize: 18, color: "#1b4332", margin: 0, fontWeight: 700 }}>
                    👥 User Management & Role-Based Access Control (RBAC)
                  </h2>
                  <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
                    Assign roles: User, Consultant, Dermatologist, or Admin.
                  </p>
                </div>

                <input
                  type="text"
                  placeholder="Filter by name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                    fontSize: 13,
                    width: 250,
                  }}
                />
              </div>

              {/* Users Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13.5 }}>
                  <thead>
                    <tr style={{ borderBottom: "1.5px solid #e5e7eb", color: "#6b7280" }}>
                      <th style={{ padding: "10px 12px" }}>ID</th>
                      <th style={{ padding: "10px 12px" }}>Name</th>
                      <th style={{ padding: "10px 12px" }}>Email</th>
                      <th style={{ padding: "10px 12px" }}>Role</th>
                      <th style={{ padding: "10px 12px" }}>Joined Date</th>
                      <th style={{ padding: "10px 12px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "12px", color: "#6b7280" }}>#{u.id}</td>
                        <td style={{ padding: "12px", fontWeight: 600, color: "#1b4332" }}>{u.name}</td>
                        <td style={{ padding: "12px", color: "#4b5563" }}>{u.email}</td>
                        <td style={{ padding: "12px" }}>
                          <select
                            value={u.role || "user"}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 8,
                              border: "1px solid #d1d5db",
                              fontSize: 12.5,
                              fontWeight: 600,
                              background:
                                u.role === "admin"
                                  ? "#fee2e2"
                                  : u.role === "dermatologist"
                                  ? "#dbeafe"
                                  : u.role === "consultant"
                                  ? "#fef3c7"
                                  : "#f3f4f6",
                              color:
                                u.role === "admin"
                                  ? "#991b1b"
                                  : u.role === "dermatologist"
                                  ? "#1e40af"
                                  : u.role === "consultant"
                                  ? "#92400e"
                                  : "#374151",
                            }}
                          >
                            <option value="user">User</option>
                            <option value="consultant">Consultant</option>
                            <option value="dermatologist">Dermatologist</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </td>
                        <td style={{ padding: "12px", color: "#6b7280" }}>{u.created_at || "—"}</td>
                        <td style={{ padding: "12px" }}>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#dc2626",
                              cursor: "pointer",
                              fontSize: 12.5,
                              fontWeight: 600,
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

const statBox = {
  background: "white",
  borderRadius: 14,
  padding: "16px 20px",
  border: "1px solid #e5e7eb",
};

const statLabel = {
  fontSize: 11.5,
  fontWeight: 600,
  color: "#6b7280",
  marginBottom: 6,
};

const statNum = {
  fontSize: 26,
  fontWeight: 800,
  color: "#1b4332",
};

export default AdminDashboard;
