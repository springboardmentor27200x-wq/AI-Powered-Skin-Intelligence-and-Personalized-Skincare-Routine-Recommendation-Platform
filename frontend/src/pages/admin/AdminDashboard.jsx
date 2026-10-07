import { useEffect, useState } from "react";
import { listUsers, updateRole, deleteUser, getAdminAnalytics, adminCreateUser } from "../../services/api";

const ROLES = [
  { value: "user", label: "User" },
  { value: "skincare_consultant", label: "Consultant" },
  { value: "dermatologist", label: "Dermatologist" },
  { value: "admin", label: "Admin" },
];

const BADGE_CLASS = {
  user: "badge-user",
  skincare_consultant: "badge-consultant",
  dermatologist: "badge-dermatologist",
  admin: "badge-admin",
};

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [analytics, setAnalytics] = useState(null);

  // New User / Dermatologist Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    age: 32,
    gender: "Female",
    role: "dermatologist",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  const load = () =>
    listUsers()
      .then((r) => setUsers(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    getAdminAnalytics()
      .then((r) => setAnalytics(r.data))
      .catch(() => {}); // non-critical
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setMsg("");
    try {
      await updateRole(userId, newRole);
      setMsg("Role updated successfully.");
      load();
    } catch (err) {
      setMsg(err.response?.data?.detail || "Failed to update role.");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);
    try {
      await adminCreateUser({
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        phone: addForm.phone.trim() || undefined,
        password: addForm.password,
        age: Number(addForm.age),
        gender: addForm.gender,
        role: addForm.role,
      });
      setMsg(`New ${addForm.role.replace('_', ' ')} "${addForm.name}" created successfully!`);
      setShowAddModal(false);
      setAddForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        age: 32,
        gender: "Female",
        role: "dermatologist",
      });
      load();
    } catch (err) {
      setAddError(err.response?.data?.detail || "Failed to create user.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This cannot be undone.`)) return;
    setMsg("");
    try {
      await deleteUser(userId);
      setMsg(`User "${userName}" deleted.`);
      load();
    } catch (err) {
      setMsg(err.response?.data?.detail || "Failed to delete user.");
    }
  };

  // Stats
  const stats = {
    total: users.length,
    users: users.filter((u) => u.role === "user").length,
    consultants: users.filter((u) => u.role === "skincare_consultant").length,
    dermatologists: users.filter((u) => u.role === "dermatologist").length,
    admins: users.filter((u) => u.role === "admin").length,
  };

  return (
    <section>
      <p className="eyebrow">Administration</p>
      <h1 style={{ marginBottom: 8 }}>Admin Dashboard</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
        Manage users, roles, and platform overview.
      </p>

      {msg && <div className="info" style={{ marginBottom: 16 }}>{msg}</div>}

      {/* Stats */}
      <div className="grid" style={{ marginBottom: 28 }}>
        <div className="card stat">
          <span>Total Users</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="card stat">
          <span>Regular Users</span>
          <strong>{stats.users}</strong>
        </div>
        <div className="card stat">
          <span>Consultants</span>
          <strong>{stats.consultants}</strong>
        </div>
        <div className="card stat">
          <span>Dermatologists</span>
          <strong>{stats.dermatologists}</strong>
        </div>
        <div className="card stat">
          <span>Admins</span>
          <strong>{stats.admins}</strong>
        </div>
      </div>

      {/* Platform Analytics */}
      {analytics && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontWeight: 700, color: "#1f2937", marginBottom: 16 }}>📊 Platform Analytics</h3>
          <div className="grid">
            {[
              { label: "Total Assessments", value: analytics.total_assessments, icon: "🧪" },
              { label: "Total Routines", value: analytics.total_routines, icon: "📋" },
              { label: "Progress Logs", value: analytics.total_progress_logs, icon: "📈" },
              { label: "Avg Skin Score", value: analytics.avg_platform_skin_score?.toFixed(1) || "—", icon: "⭐" },
              { label: "New Users (30d)", value: analytics.new_users_last_30_days, icon: "🆕" },
              { label: "Active Users (7d)", value: analytics.active_users_last_7_days, icon: "🟢" },
            ].map((item) => (
              <div key={item.label} className="card stat" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", marginBottom: 6 }}>{item.icon}</div>
                <strong style={{ fontSize: "1.6rem", color: "#7c3aed" }}>{item.value}</strong>
                <span style={{ display: "block", fontSize: "0.8rem", color: "#6b7280", marginTop: 4 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb" }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: 700, color: "#1f2937" }}>All Users & Specialists</h3>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Total: {users.length} accounts</span>
          </div>
          <button
            className="primary"
            style={{ padding: "8px 18px", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 6 }}
            onClick={() => { setShowAddModal(true); setAddError(""); }}
          >
            ➕ Add Dermatologist / User
          </button>
        </div>

        {/* Add User / Dermatologist Modal */}
        {showAddModal && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.5)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20
          }}>
            <div className="card" style={{ width: "100%", maxWidth: 520, background: "white", borderRadius: 16, padding: 28, position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h3 style={{ margin: 0, fontWeight: 700, color: "#1f2937" }}>🩺 Add New Dermatologist or User</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "#9ca3af" }}
                >✕</button>
              </div>

              {addError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{addError}</div>}

              <form onSubmit={handleCreateUser} style={{ display: "grid", gap: 14 }}>
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: 4, color: "#374151" }}>Account Role *</label>
                  <select
                    className="input"
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    style={{ width: "100%", padding: "10px" }}
                    required
                  >
                    <option value="dermatologist">🩺 Dermatologist</option>
                    <option value="skincare_consultant">🌿 Skincare Consultant</option>
                    <option value="user">👤 Skincare Consumer / User</option>
                    <option value="admin">👑 Administrator</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: 4, color: "#374151" }}>Full Name *</label>
                  <input
                    className="input"
                    placeholder="e.g. Dr. Emily Watson"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    style={{ width: "100%", padding: "10px" }}
                    required
                    minLength={2}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: 4, color: "#374151" }}>Email *</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="doctor@hospital.com"
                      value={addForm.email}
                      onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                      style={{ width: "100%", padding: "10px" }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: 4, color: "#374151" }}>Phone Number</label>
                    <input
                      type="tel"
                      className="input"
                      placeholder="+1 (555) 000-0000"
                      value={addForm.phone}
                      onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                      style={{ width: "100%", padding: "10px" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: 4, color: "#374151" }}>Password * (min 8 chars)</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Initial password"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    style={{ width: "100%", padding: "10px" }}
                    required
                    minLength={8}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: 4, color: "#374151" }}>Age</label>
                    <input
                      type="number"
                      className="input"
                      value={addForm.age}
                      onChange={(e) => setAddForm({ ...addForm, age: e.target.value })}
                      style={{ width: "100%", padding: "10px" }}
                      min={18} max={100} required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: 4, color: "#374151" }}>Gender</label>
                    <select
                      className="input"
                      value={addForm.gender}
                      onChange={(e) => setAddForm({ ...addForm, gender: e.target.value })}
                      style={{ width: "100%", padding: "10px" }}
                      required
                    >
                      <option>Female</option>
                      <option>Male</option>
                      <option>Non-binary</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button
                    type="submit"
                    className="primary"
                    disabled={addLoading}
                    style={{ flex: 1, padding: "12px", fontSize: "0.95rem" }}
                  >
                    {addLoading ? "Creating..." : `Create ${addForm.role.replace('_', ' ')}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="secondary"
                    style={{ padding: "12px 20px" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <p style={{ padding: 22, color: "var(--text-muted)" }}>Loading users…</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Age</th>
                  <th>Role</th>
                  <th>Change Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>{u.age}</td>
                    <td>
                      <span className={`badge ${BADGE_CLASS[u.role] || "badge-user"}`}>
                        {ROLES.find((r) => r.value === u.role)?.label || u.role}
                      </span>
                    </td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        className="danger"
                        style={{ padding: "5px 12px", fontSize: 12 }}
                        onClick={() => handleDelete(u.id, u.name)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
