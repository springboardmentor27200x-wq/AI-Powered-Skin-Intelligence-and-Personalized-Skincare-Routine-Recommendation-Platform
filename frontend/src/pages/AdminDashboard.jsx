import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users"); // "users" | "analytics" | "recommendations" | "reports"
  const [stats, setStats] = useState(null);
  const [topConcerns, setTopConcerns] = useState({});
  const [recMonitoring, setRecMonitoring] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
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

    const statsPromise = axios.get("http://127.0.0.1:5000/api/admin/stats", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const usersPromise = axios.get("http://127.0.0.1:5000/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    });

    Promise.all([statsPromise, usersPromise])
      .then(([statsRes, usersRes]) => {
        setStats(statsRes.data.stats || {});
        setTopConcerns(statsRes.data.top_concerns || {});
        setRecMonitoring(statsRes.data.recommendation_monitoring || {});
        setSystemHealth(statsRes.data.system_health || {});
        setAuditLogs(statsRes.data.audit_logs || []);
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
      setRoleMessage(`User role updated to ${newRole} successfully!`);
      loadAdminData();
    } catch {
      alert("Failed to update user role.");
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This will remove all their profiles and records.`)) {
      return;
    }

    try {
      await axios.delete(`http://127.0.0.1:5000/api/admin/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoleMessage(`User "${userName}" has been deleted.`);
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
      <div style={{ maxWidth: 1120, margin: "0 auto", paddingBottom: 60 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28 }}>🛡️</span>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: "#991b1b", margin: 0 }}>
                Platform Administration Portal
              </h1>
            </div>
            <p style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>
              User access control, platform telemetry, recommendation system monitoring, and system audit reports.
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
            Role: {user?.role || "Administrator"}
          </span>
        </div>

        {error ? (
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 14, padding: 24, textAlign: "center" }}>
            <h3 style={{ color: "#991b1b", margin: "0 0 8px" }}>Access Restricted</h3>
            <p style={{ color: "#7f1d1d", fontSize: 14, margin: 0 }}>{error}</p>
          </div>
        ) : (
          <>
            {/* 4 Feature Tab Navigation Bar */}
            <div style={{ display: "flex", gap: 10, marginBottom: 24, borderBottom: "2px solid #e5e7eb", paddingBottom: 10 }}>
              <button
                onClick={() => setActiveTab("users")}
                style={{
                  ...tabBtn,
                  background: activeTab === "users" ? "#991b1b" : "#f3f4f6",
                  color: activeTab === "users" ? "white" : "#374151",
                }}
              >
                👥 User Management ({users.length})
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                style={{
                  ...tabBtn,
                  background: activeTab === "analytics" ? "#991b1b" : "#f3f4f6",
                  color: activeTab === "analytics" ? "white" : "#374151",
                }}
              >
                📊 Platform Analytics
              </button>
              <button
                onClick={() => setActiveTab("recommendations")}
                style={{
                  ...tabBtn,
                  background: activeTab === "recommendations" ? "#991b1b" : "#f3f4f6",
                  color: activeTab === "recommendations" ? "white" : "#374151",
                }}
              >
                🎯 Recommendation Monitoring
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                style={{
                  ...tabBtn,
                  background: activeTab === "reports" ? "#991b1b" : "#f3f4f6",
                  color: activeTab === "reports" ? "white" : "#374151",
                }}
              >
                📜 System Reports & Audits
              </button>
            </div>

            {/* TAB 1: USER MANAGEMENT */}
            {activeTab === "users" && (
              <div>
                {/* Search Bar & Feedback message */}
                <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  <input
                    type="text"
                    placeholder="Search users by name, email, or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: "1px solid #d1d5db",
                      fontSize: 14,
                      outline: "none",
                      background: "white",
                    }}
                  />
                </div>

                {roleMessage && (
                  <div style={{ background: "#dcfce7", color: "#166534", padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
                    {roleMessage}
                  </div>
                )}

                <div style={{ background: "white", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                        <th style={{ padding: "12px 16px", color: "#334155" }}>User</th>
                        <th style={{ padding: "12px 16px", color: "#334155" }}>Current Role</th>
                        <th style={{ padding: "12px 16px", color: "#334155" }}>Profile Status</th>
                        <th style={{ padding: "12px 16px", color: "#334155" }}>Registered</th>
                        <th style={{ padding: "12px 16px", color: "#334155" }}>Role Assignment</th>
                        <th style={{ padding: "12px 16px", color: "#334155", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ fontWeight: 600, color: "#0f172a" }}>{u.name}</div>
                            <div style={{ color: "#64748b", fontSize: 12 }}>{u.email}</div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span
                              style={{
                                background:
                                  u.role === "admin"
                                    ? "#fee2e2"
                                    : u.role === "dermatologist"
                                    ? "#dbeafe"
                                    : u.role === "consultant"
                                    ? "#dcfce7"
                                    : "#f3f4f6",
                                color:
                                  u.role === "admin"
                                    ? "#991b1b"
                                    : u.role === "dermatologist"
                                    ? "#1e40af"
                                    : u.role === "consultant"
                                    ? "#166534"
                                    : "#374151",
                                padding: "4px 10px",
                                borderRadius: 14,
                                fontWeight: 700,
                                fontSize: 11,
                                textTransform: "capitalize",
                              }}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ color: u.has_profile ? "#16a34a" : "#94a3b8", fontWeight: 600 }}>
                              {u.has_profile ? "✓ Profile Created" : "○ Pending"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", color: "#64748b" }}>{u.created_at || "—"}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: 8,
                                border: "1px solid #cbd5e1",
                                fontSize: 12,
                                fontWeight: 600,
                                outline: "none",
                                background: "white",
                              }}
                            >
                              <option value="user">User (Consumer)</option>
                              <option value="consultant">Consultant</option>
                              <option value="dermatologist">Dermatologist</option>
                              <option value="admin">Administrator</option>
                            </select>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right" }}>
                            {u.id !== user?.id ? (
                              <button
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                style={{
                                  background: "#fee2e2",
                                  color: "#dc2626",
                                  border: "1px solid #fca5a5",
                                  borderRadius: 8,
                                  padding: "6px 12px",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                Delete
                              </button>
                            ) : (
                              <span style={{ fontSize: 11, color: "#9ca3af" }}>Current Account</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: PLATFORM ANALYTICS */}
            {activeTab === "analytics" && (
              <div>
                {/* Stats Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
                  <div style={statCard}>
                    <div style={statLabel}>Total Platform Users</div>
                    <div style={statVal}>{stats?.total_users ?? 0}</div>
                  </div>
                  <div style={statCard}>
                    <div style={statLabel}>Completed Skin Profiles</div>
                    <div style={statVal}>{stats?.profiles_created ?? 0}</div>
                  </div>
                  <div style={statCard}>
                    <div style={statLabel}>Assessments Conducted</div>
                    <div style={statVal}>{stats?.total_assessments ?? 0}</div>
                  </div>
                  <div style={statCard}>
                    <div style={statLabel}>Platform Avg Skin Score</div>
                    <div style={{ ...statVal, color: "#166534" }}>{stats?.average_skin_score ?? 0}/100</div>
                  </div>
                  <div style={statCard}>
                    <div style={statLabel}>Licensed Dermatologists</div>
                    <div style={statVal}>{stats?.total_dermatologists ?? 0}</div>
                  </div>
                  <div style={statCard}>
                    <div style={statLabel}>Skincare Consultants</div>
                    <div style={statVal}>{stats?.total_consultants ?? 0}</div>
                  </div>
                </div>

                {/* Concerns Breakdown */}
                <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb" }}>
                  <h3 style={{ margin: "0 0 16px", color: "#0f172a", fontSize: 18 }}>Most Prevalent Skin Concerns Across Platform</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {Object.entries(topConcerns).map(([concern, count]) => {
                      const total = stats?.profiles_created || 1;
                      const pct = Math.min(Math.round((count / total) * 100), 100);
                      return (
                        <div key={concern}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                            <strong>{concern}</strong>
                            <span style={{ color: "#64748b" }}>{count} users ({pct}%)</span>
                          </div>
                          <div style={{ width: "100%", height: 10, background: "#f1f5f9", borderRadius: 5, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: "#991b1b" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: RECOMMENDATION MONITORING */}
            {activeTab === "recommendations" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 24 }}>
                  <div style={statCard}>
                    <div style={statLabel}>Engine Architecture</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#1e3a8a", marginTop: 4 }}>
                      Multi-Hot Vector Cosine Similarity
                    </div>
                  </div>
                  <div style={statCard}>
                    <div style={statLabel}>Total Products Indexed</div>
                    <div style={statVal}>{recMonitoring?.total_products_indexed ?? stats?.catalog_products ?? 0}</div>
                  </div>
                  <div style={statCard}>
                    <div style={statLabel}>Active Ingredient Classes</div>
                    <div style={statVal}>8 Classes</div>
                  </div>
                  <div style={statCard}>
                    <div style={statLabel}>Pairwise Conflict Matrix</div>
                    <div style={statVal}>28 Rules Active</div>
                  </div>
                </div>

                <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb" }}>
                  <h3 style={{ margin: "0 0 16px", color: "#0f172a", fontSize: 18 }}>Product Catalog Category Distribution</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
                    {recMonitoring?.categories &&
                      Object.entries(recMonitoring.categories).map(([cat, count]) => (
                        <div key={cat} style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                          <div style={{ fontSize: 13, color: "#64748b" }}>{cat}</div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>{count}</div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SYSTEM REPORTS & AUDITS */}
            {activeTab === "reports" && (
              <div>
                {/* System Health Status */}
                <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb", marginBottom: 20 }}>
                  <h3 style={{ margin: "0 0 16px", color: "#0f172a", fontSize: 18 }}>System Health & Infrastructure Telemetry</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontSize: 13 }}>
                    <div style={{ background: "#f0fdf4", border: "1px solid #86efac", padding: 14, borderRadius: 10 }}>
                      <strong style={{ color: "#166534" }}>Primary Relational Database:</strong>
                      <div style={{ color: "#15803d", marginTop: 4 }}>{systemHealth?.database_status || "PostgreSQL 15 Connected"}</div>
                    </div>
                    <div style={{ background: "#eff6ff", border: "1px solid #93c5fd", padding: 14, borderRadius: 10 }}>
                      <strong style={{ color: "#1e40af" }}>Machine Learning Engine:</strong>
                      <div style={{ color: "#1d4ed8", marginTop: 4 }}>{systemHealth?.ml_model_status || "XGBoost Regressor Online"}</div>
                    </div>
                    <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", padding: 14, borderRadius: 10 }}>
                      <strong>REST API Gateway:</strong>
                      <div style={{ color: "#475569", marginTop: 4 }}>{systemHealth?.api_gateway || "Nominal (<50ms)"}</div>
                    </div>
                    <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", padding: 14, borderRadius: 10 }}>
                      <strong>Storage & Multi-Part Uploader:</strong>
                      <div style={{ color: "#475569", marginTop: 4 }}>{systemHealth?.storage || "File System Operational"}</div>
                    </div>
                  </div>
                </div>

                {/* Export Buttons */}
                <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb", marginBottom: 20 }}>
                  <h3 style={{ margin: "0 0 12px", color: "#0f172a", fontSize: 18 }}>Platform Master Export Dossiers</h3>
                  <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>
                    Download system-wide clinical audits and comprehensive relational database backups.
                  </p>
                  <div style={{ display: "flex", gap: 14 }}>
                    <a
                      href="http://127.0.0.1:5000/api/reports/pdf/skin_assessment"
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: "#991b1b",
                        color: "white",
                        padding: "10px 18px",
                        borderRadius: 10,
                        textDecoration: "none",
                        fontWeight: 700,
                        fontSize: 13,
                        display: "inline-block",
                      }}
                    >
                      📥 Download Platform PDF Master Report
                    </a>
                    <a
                      href="http://127.0.0.1:5000/api/reports/excel"
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: "#166534",
                        color: "white",
                        padding: "10px 18px",
                        borderRadius: 10,
                        textDecoration: "none",
                        fontWeight: 700,
                        fontSize: 13,
                        display: "inline-block",
                      }}
                    >
                      📊 Export Complete Database to Excel (.xlsx)
                    </a>
                  </div>
                </div>

                {/* Audit Logs */}
                <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb" }}>
                  <h3 style={{ margin: "0 0 16px", color: "#0f172a", fontSize: 18 }}>System Event Audit Trail</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {auditLogs.map((log, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f8fafc", borderRadius: 8, fontSize: 13 }}>
                        <div>
                          <span style={{ fontWeight: 700, color: "#334155", marginRight: 8 }}>[{log.type}]</span>
                          <span style={{ color: "#475569" }}>{log.event}</span>
                        </div>
                        <span style={{ color: "#94a3af", fontSize: 12 }}>{log.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

const tabBtn = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const statCard = {
  background: "white",
  borderRadius: 14,
  padding: "18px 20px",
  border: "1px solid #e5e7eb",
};

const statLabel = {
  fontSize: 12,
  fontWeight: 600,
  color: "#6b7280",
};

const statVal = {
  fontSize: 26,
  fontWeight: 800,
  color: "#0f172a",
  marginTop: 6,
};

export default AdminDashboard;
