import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  PageRoute,
  AdminUserSummary,
  AdminStats,
  DatabaseStatus,
  UserRole,
} from "../types";
import { api } from "../services/api";
import {
  Users,
  Database,
  FileSpreadsheet,
  Shield,
  ArrowRight,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Activity,
  Sparkles,
} from "lucide-react";

interface AdminDashboardProps {
  onNavigate: (route: PageRoute) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadAdminOverview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [usersList, statsData, dbData] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminStats(),
        api.getDatabaseStatus(),
      ]);
      setUsers(usersList);
      setStats(statsData);
      setDbStatus(dbData);
    } catch (err: any) {
      setError(err.message || "Unable to load admin dashboard data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminOverview();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const dermCount =
    stats?.total_dermatologists ??
    users.filter((u) => u.role === "DERMATOLOGIST").length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Simple Admin Header (Strictly System, Users & Dataset - No Product Catalog) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EAE6DE]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#6E685E]">
            <Shield className="w-3.5 h-3.5 text-[#5A6D5C]" />
            <span>Administrator Console</span>
            <span aria-hidden="true">·</span>
            <span>Signed in as {user?.name || "Admin"}</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2E2C29]">
            Admin Dashboard
          </h1>
          <p className="text-xs text-[#6E685E]">
            Manage user accounts, inspect database status, and review clinical datasets.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => onNavigate("/admin/users")}
            className="px-3.5 py-2 bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manage Users</span>
          </button>
          <button
            onClick={() => onNavigate("/admin/dataset")}
            className="px-3.5 py-2 bg-white hover:bg-[#FAF8F5] text-[#2E2C29] border border-[#EAE6DE] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#5A6D5C]" />
            <span>Clinical Dataset</span>
          </button>
          <button
            onClick={loadAdminOverview}
            disabled={isLoading}
            className="p-2 rounded-lg border border-[#EAE6DE] bg-white hover:bg-[#FAF8F5] text-[#6E685E] transition-colors cursor-pointer"
            title="Refresh Admin Dashboard"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Alerts */}
      {notice && (
        <div className="p-3.5 rounded-xl bg-[#F0F5F1] border border-[#8BA88E]/40 text-[#5A6D5C] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-medium">{notice}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Essential Admin KPIs (No Product Catalog) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#EAE6DE] p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#6E685E]">
            <span>Total Accounts</span>
            <Users className="w-4 h-4 text-[#5A6D5C]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#2E2C29] tabular-nums">
            {stats?.total_users ?? users.length}
          </div>
          <p className="text-xs text-[#8C857B]">
            {stats?.total_standard_users ?? 3} Users · {dermCount} Derm · {stats?.total_admins ?? 1} Admin
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#EAE6DE] p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#6E685E]">
            <span>Active Skin Profiles</span>
            <Sparkles className="w-4 h-4 text-[#5A6D5C]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#2E2C29] tabular-nums">
            {stats?.total_profiles ?? 3}
          </div>
          <p className="text-xs text-[#8C857B]">
            Configured skin & allergy profiles
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#EAE6DE] p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#6E685E]">
            <span>Assessments & Plans</span>
            <Activity className="w-4 h-4 text-[#5A6D5C]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#2E2C29] tabular-nums">
            {stats?.total_assessments ?? 2} / {stats?.total_routines ?? 2}
          </div>
          <p className="text-xs text-[#8C857B]">
            Evaluations & active routines
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#EAE6DE] p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#6E685E]">
            <span>Database Engine</span>
            <Database className="w-4 h-4 text-[#5A6D5C]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#2E2C29] tabular-nums">
            {dbStatus?.collections?.length ?? 10} Collections
          </div>
          <p className="text-xs text-[#8C857B]">
            {dbStatus?.totalDocuments ?? 125} total documents stored
          </p>
        </div>
      </div>

      {/* Main Admin Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: User Accounts & Role Management (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-[#EAE6DE] overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-[#EAE6DE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-serif font-bold text-base text-[#2E2C29]">
                  Registered User Accounts
                </h2>
                <p className="text-xs text-[#6E685E]">
                  View registered accounts, assigned roles, and skin profile status.
                </p>
              </div>

              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-[#8C857B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, email, role..."
                  className="w-full pl-8 pr-3 py-1.5 bg-[#FAF8F5] border border-[#EAE6DE] rounded-lg text-xs text-[#2E2C29] focus:bg-white focus:border-[#5A6D5C] focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#EAE6DE] bg-[#FAF8F5] text-[#6E685E]">
                    <th className="py-3 px-4 font-semibold">User</th>
                    <th className="py-3 px-3 font-semibold">Role</th>
                    <th className="py-3 px-3 font-semibold">Skin Profile</th>
                    <th className="py-3 px-3 font-semibold">Health Score</th>
                    <th className="py-3 px-4 font-semibold text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EDE4]">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#FAF8F5]/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#2E2C29]">{u.name}</div>
                        <div className="text-[11px] text-[#8C857B]">{u.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-semibold text-xs ${
                            u.role === "ADMIN"
                              ? "text-[#B85D52]"
                              : u.role === "DERMATOLOGIST"
                              ? "text-[#4A6B53]"
                              : "text-[#557889]"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#4A4742]">
                        {u.has_profile ? (
                          <span>
                            {u.skin_type} · {u.age_group}
                          </span>
                        ) : (
                          <span className="text-[#8C857B]">Not configured</span>
                        )}
                      </td>
                      <td className="py-3 px-3 tabular-nums">
                        {u.has_assessment && u.assessment_score !== undefined ? (
                          <span className="font-semibold text-[#2E2C29]">
                            {u.assessment_score}/100
                          </span>
                        ) : (
                          <span className="text-[#8C857B]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onNavigate("/admin/users")}
                          className="text-xs font-semibold text-[#5A6D5C] hover:underline cursor-pointer whitespace-nowrap"
                        >
                          Manage →
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#8C857B]">
                        No matching users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 border-t border-[#EAE6DE] bg-[#FAF8F5] flex items-center justify-between text-xs">
            <span className="text-[#6E685E]">
              Showing {filteredUsers.length} of {users.length} registered accounts
            </span>
            <button
              onClick={() => onNavigate("/admin/users")}
              className="font-semibold text-[#5A6D5C] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Open Full User Management (Create / Edit / Delete)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Essential Admin Tools & Storage (4 cols - No Product Catalog) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Clinical Dataset */}
          <div className="bg-white rounded-xl border border-[#EAE6DE] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#5A6D5C]" />
                <h3 className="font-serif font-bold text-sm text-[#2E2C29]">
                  Clinical Dataset & ML Model
                </h3>
              </div>
              <span className="text-xs text-[#6E685E] tabular-nums">1,200 rows</span>
            </div>
            <p className="text-xs text-[#6E685E] leading-relaxed">
              Inspect the 1,200-record dermatology dataset, test the k-NN prediction simulator, or download Excel/CSV files.
            </p>
            <button
              onClick={() => onNavigate("/admin/dataset")}
              className="w-full py-2 px-3 rounded-lg bg-[#FAF8F5] hover:bg-[#F2EDE4] border border-[#EAE6DE] text-[#2E2C29] text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Open Clinical Dataset Explorer</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#5A6D5C]" />
            </button>
          </div>

          {/* Card 2: Database Collections */}
          <div className="bg-white rounded-xl border border-[#EAE6DE] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#5A6D5C]" />
                <h3 className="font-serif font-bold text-sm text-[#2E2C29]">
                  Database Collections
                </h3>
              </div>
              <span className="text-xs text-[#5A6D5C] font-semibold">
                {dbStatus?.status || "Active"}
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              {(dbStatus?.collections || []).slice(0, 6).map((col) => (
                <div
                  key={col.name}
                  className="flex items-center justify-between py-1 border-b border-[#F2EDE4] last:border-0"
                >
                  <span className="font-mono text-[#6E685E]">{col.name}</span>
                  <span className="font-mono font-semibold text-[#2E2C29] tabular-nums">
                    {col.count} records
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => onNavigate("/admin/database")}
              className="w-full py-2 px-3 rounded-lg bg-[#FAF8F5] hover:bg-[#F2EDE4] border border-[#EAE6DE] text-[#2E2C29] text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Inspect Database & Reseed</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#5A6D5C]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
