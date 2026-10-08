import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { getAllUsers } from "../services/api";

function AdminDashboard() {
  const { user, logout } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getAllUsers();
        setUsers(data);
      } catch (err) {
        console.error("Failed to load users:", err);
        setError(err.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const totalUsers = users.filter(
    (item) => item.role === "user"
  ).length;

  const totalDermatologists = users.filter(
    (item) => item.role === "dermatologist"
  ).length;

  const totalConsultants = users.filter(
    (item) => item.role === "consultant"
  ).length;

  const totalAdmins = users.filter(
    (item) => item.role === "admin"
  ).length;

  return (
    <div className="admin-dashboard">

      {/* HEADER */}
      <header className="admin-header">
        <div>
          <p className="admin-label">ADMIN PORTAL</p>

          <h1>
            Welcome, {user?.name || "Admin"} 👋
          </h1>

          <p>
            Manage users and monitor the Skin Intelligence
            system.
          </p>
        </div>

        <button
          className="logout-btn"
          onClick={logout}
        >
          Logout
        </button>
      </header>

      {/* STATISTICS */}
      <section className="admin-stats">

        <div className="admin-stat-card">
          <div className="admin-stat-icon">👥</div>

          <div>
            <span>Total Users</span>
            <strong>
              {loading ? "..." : totalUsers}
            </strong>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">🩺</div>

          <div>
            <span>Dermatologists</span>
            <strong>
              {loading ? "..." : totalDermatologists}
            </strong>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">💼</div>

          <div>
            <span>Consultants</span>
            <strong>
              {loading ? "..." : totalConsultants}
            </strong>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">🛡️</div>

          <div>
            <span>Administrators</span>
            <strong>
              {loading ? "..." : totalAdmins}
            </strong>
          </div>
        </div>

      </section>

      {/* USER MANAGEMENT */}
      <section className="admin-card">

        <div className="admin-card-header">
          <div>
            <h2>User Management</h2>

            <p>
              View all registered accounts and their roles.
            </p>
          </div>
        </div>

        {loading && (
          <div className="admin-loading">
            Loading users...
          </div>
        )}

        {error && (
          <div className="admin-error">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          users.length === 0 && (
            <div className="admin-empty">
              <div>👥</div>

              <h3>No users found</h3>

              <p>
                Registered accounts will appear here.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          users.length > 0 && (

            <div className="admin-user-list">

              {/* TABLE HEADER */}

              <div className="admin-user-row admin-user-heading">
                <span>Name</span>
                <span>Email</span>
                <span>Role</span>
              </div>

              {/* USERS */}

              {users.map((account) => (

                <div
                  className="admin-user-row"
                  key={account.id}
                >

                  <div className="admin-user-name">
                    <div className="admin-avatar">
                      {account.name
                        ? account.name
                            .charAt(0)
                            .toUpperCase()
                        : "U"}
                    </div>

                    <strong>
                      {account.name}
                    </strong>
                  </div>

                  <span>
                    {account.email}
                  </span>

                  <span
                    className={`role-badge role-${account.role}`}
                  >
                    {account.role}
                  </span>

                </div>

              ))}

            </div>

          )}

      </section>

    </div>
  );
}

export default AdminDashboard;