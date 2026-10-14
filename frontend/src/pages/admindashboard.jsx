import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  fetchAdminUsers,
  fetchAdminStats,
  fetchAdminAnalytics,
  updateUserRole,
  updateUserStatus,
} from "../api/client";
import AnnouncementManager from "../components/announcementmanager";
import RecommendationMonitor from "../components/recommendationmonitor";
import SystemReports from "../components/systemreports";

const ROLES = ["user", "skincare_consultant", "dermatologist", "administrator"];

function label(word) {
  return word ? word.replace(/_/g, " ") : word;
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-clay bg-white p-5">
      <p className="font-display text-2xl text-ink">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-ink/50">{label}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, token } = useAuth();
  if (user.role !== "administrator") return <Navigate to="/dashboard" replace />;

  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [busyId, setBusyId] = useState(null);

  function loadUsers() {
    return fetchAdminUsers(token, { search, role: roleFilter })
      .then(setUsers)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      fetchAdminStats(token).then(setStats),
      fetchAdminAnalytics(token).then(setAnalytics),
      loadUsers(),
    ])
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    loadUsers().finally(() => setLoading(false));
  }

  async function handleRoleChange(targetUser, role) {
    setBusyId(targetUser.id);
    setError("");
    try {
      const updated = await updateUserRole(token, targetUser.id, role);
      setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleStatusToggle(targetUser) {
    setBusyId(targetUser.id);
    setError("");
    try {
      const updated = await updateUserStatus(token, targetUser.id, !targetUser.is_active);
      setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">Administrator</p>
      <h1 className="mt-2 font-display text-3xl text-ink">Platform overview</h1>
      <p className="mt-3 text-ink/65">Manage users, roles, and account status.</p>

      {error && <p className="mt-6 rounded-lg bg-bloom-200/60 px-3 py-2 text-sm text-bloom-600">{error}</p>}

      {stats && (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total users" value={stats.total_users} />
          <StatCard label="Active" value={stats.active_users} />
          <StatCard label="Skin profiles" value={stats.total_skin_profiles} />
          <StatCard label="Daily logs" value={stats.total_daily_logs} />
        </div>
      )}

      {stats && (
        <div className="mt-4 flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <span key={r} className="rounded-full border border-clay bg-white px-3 py-1 text-xs text-ink/70">
              {label(r)}: {stats.users_by_role[r] ?? 0}
            </span>
          ))}
        </div>
      )}

      {analytics && (
        <div className="mt-10">
          <h2 className="font-display text-lg text-ink">Platform analytics</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
            <StatCard label="Assessments run" value={analytics.total_assessments} />
            <StatCard label="Avg. skin score" value={analytics.average_score ?? "—"} />
            <StatCard label="Routines generated" value={analytics.total_routines} />
            <StatCard label="Ingredients tracked" value={analytics.total_ingredients} />
            <StatCard label="Products catalogued" value={analytics.total_products} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="rounded-full border border-clay bg-white px-3 py-1.5 text-xs text-ink/70">
              Top concern: {analytics.top_concern ? label(analytics.top_concern) : "—"}
              {analytics.top_concern && ` (${analytics.top_concern_count} users)`}
            </span>
            <span className="rounded-full border border-clay bg-white px-3 py-1.5 text-xs text-ink/70">
              7-day routine adherence:{" "}
              {analytics.platform_adherence_rate != null ? `${analytics.platform_adherence_rate}%` : "No data yet"}
            </span>
          </div>
        </div>
      )}
       <div className="mt-10">
  <RecommendationMonitor />
</div>

<div className="mt-10">
  <SystemReports />
</div>
       <div className="mt-10">
        <AnnouncementManager />
      </div>
      <form onSubmit={handleSearch} className="mt-10 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email"
          className="focus-ring w-64 rounded-xl border border-clay bg-white px-4 py-2.5 text-ink"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="focus-ring rounded-xl border border-clay bg-white px-4 py-2.5 text-ink"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{label(r)}</option>
          ))}
        </select>
        <button
          type="submit"
          className="focus-ring rounded-full bg-clinical-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-clinical-600"
        >
          Filter
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-clay">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-clay bg-mist text-xs uppercase tracking-wide text-ink/50">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-ink/50">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-ink/50">No users found.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-clay/60 last:border-0">
                  <td className="px-4 py-2 text-ink">{u.full_name}</td>
                  <td className="px-4 py-2 text-ink/70">{u.email}</td>
                  <td className="px-4 py-2">
                    <select
                      value={u.role}
                      disabled={busyId === u.id || u.id === user.id}
                      onChange={(e) => handleRoleChange(u, e.target.value)}
                      className="focus-ring rounded-lg border border-clay bg-white px-2 py-1 text-xs text-ink disabled:opacity-50"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{label(r)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleStatusToggle(u)}
                      disabled={busyId === u.id || u.id === user.id}
                      className={`focus-ring rounded-full px-3 py-1 text-xs transition disabled:opacity-50 ${
                        u.is_active
                          ? "bg-clinical-50 text-clinical-700 hover:bg-clinical-100"
                          : "bg-bloom-200/60 text-bloom-600 hover:bg-bloom-200"
                      }`}
                    >
                      {u.is_active ? "Active" : "Deactivated"}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-ink/60">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}