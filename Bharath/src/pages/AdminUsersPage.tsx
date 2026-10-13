import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  AdminUserSummary,
  AdminUserDetail,
  AdminStats,
  DatabaseStatus,
  UserRole,
  PageRoute,
} from "../types";
import { api } from "../services/api";
import { RoleBadge } from "../components/RoleBadge";
import {
  Users,
  Database,
  Search,
  Plus,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  HeartPulse,
  Moon,
  Droplet,
  Sun,
  Shield,
  Layers,
  Activity,
  Calendar,
  Check,
  Filter,
  ShoppingBag,
  Zap,
} from "lucide-react";

interface AdminUsersPageProps {
  onNavigate: (route: PageRoute) => void;
  initialTab?: "users" | "database";
}

export const AdminUsersPage: React.FC<AdminUsersPageProps> = ({
  onNavigate,
  initialTab = "users",
}) => {
  const { user: currentAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<"users" | "database">(initialTab);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [profileFilter, setProfileFilter] = useState<string>("ALL");

  // Selected user for inspection dossier
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [dossierTab, setDossierTab] = useState<"profile" | "assessment" | "routine" | "activity">("profile");

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState<string>("");
  const [newUserEmail, setNewUserEmail] = useState<string>("");
  const [newUserPassword, setNewUserPassword] = useState<string>("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("USER");
  const [isCreatingUser, setIsCreatingUser] = useState<boolean>(false);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<AdminUserSummary | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editEmail, setEditEmail] = useState<string>("");
  const [editRole, setEditRole] = useState<UserRole>("USER");
  const [isUpdatingUser, setIsUpdatingUser] = useState<boolean>(false);

  // Delete User Confirmation State
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Reseed State
  const [isReseeding, setIsReseeding] = useState<boolean>(false);

  const fetchAdminData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [usersData, statsData, dbData] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminStats(),
        api.getDatabaseStatus(),
      ]);
      setUsers(usersData);
      setStats(statsData);
      setDbStatus(dbData);
    } catch (err: any) {
      setError(err.message || "Failed to load administration data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Fetch full details when user dossier is opened
  const handleOpenDossier = async (userId: number) => {
    setSelectedUserId(userId);
    setIsLoadingDetail(true);
    setDossierTab("profile");
    try {
      const detail = await api.getAdminUserDetail(userId);
      setSelectedUserDetail(detail);
    } catch (err: any) {
      setError(err.message || "Failed to fetch user dossier details.");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsCreatingUser(true);
    setError(null);
    try {
      await api.createAdminUser({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword,
        role: newUserRole,
      });
      setIsAddModalOpen(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("USER");
      setSuccessNotice("New user account created successfully in MongoDB.");
      setTimeout(() => setSuccessNotice(null), 4000);
      await fetchAdminData();
    } catch (err: any) {
      setError(err.message || "Failed to create user account.");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleStartEdit = (u: AdminUserSummary) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdatingUser(true);
    setError(null);
    try {
      await api.updateAdminUser(editingUser.id, {
        name: editName.trim(),
        email: editEmail.trim(),
        role: editRole,
      });
      setEditingUser(null);
      setSuccessNotice(`Updated account details for ${editName}.`);
      setTimeout(() => setSuccessNotice(null), 4000);
      await fetchAdminData();
    } catch (err: any) {
      setError(err.message || "Failed to update user.");
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    setIsDeleting(true);
    setError(null);
    try {
      await api.deleteAdminUser(userId);
      setDeletingUserId(null);
      if (selectedUserId === userId) {
        setSelectedUserId(null);
        setSelectedUserDetail(null);
      }
      setSuccessNotice("User and associated records removed successfully.");
      setTimeout(() => setSuccessNotice(null), 4000);
      await fetchAdminData();
    } catch (err: any) {
      setError(err.message || "Failed to delete user.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReseedDb = async () => {
    setIsReseeding(true);
    setError(null);
    try {
      const res = await api.reseedDatabase();
      setDbStatus(res.stats);
      setSuccessNotice("Database collections re-seeded with demo records.");
      setTimeout(() => setSuccessNotice(null), 4000);
      await fetchAdminData();
    } catch (err: any) {
      setError(err.message || "Failed to sync database.");
    } finally {
      setIsReseeding(false);
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.skin_type && u.skin_type.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;

    let matchesProfile = true;
    if (profileFilter === "WITH_PROFILE") matchesProfile = u.has_profile;
    if (profileFilter === "NO_PROFILE") matchesProfile = !u.has_profile;
    if (profileFilter === "WITH_ASSESSMENT") matchesProfile = u.has_assessment;
    if (profileFilter === "WITH_ROUTINE") matchesProfile = u.has_routine;

    return matchesSearch && matchesRole && matchesProfile;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-3xl border border-[#E5E0D5] p-6 sm:p-8 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F0F5F1] border border-[#8BA88E]/40 flex items-center justify-center text-[#5A6D5C]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#333333] tracking-tight">
                  Admin Management
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF0EE] text-[#B85D52] border border-[#E8D2CC]">
                  ADMIN ACCESS
                </span>
              </div>
              <p className="text-xs text-[#7A746B] font-medium">
                User accounts directory, clinical skin dossiers & database architecture
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selector & Actions */}
        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 bg-[#FAF7F2] border border-[#E5E0D5] rounded-2xl">
            <button
              id="admin-tab-users"
              onClick={() => setActiveTab("users")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "users"
                  ? "bg-[#5A6D5C] text-white shadow-xs"
                  : "text-[#7A746B] hover:text-[#333333]"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users Details ({users.length})</span>
            </button>
            <button
              id="admin-tab-database"
              onClick={() => setActiveTab("database")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "database"
                  ? "bg-[#5A6D5C] text-white shadow-xs"
                  : "text-[#7A746B] hover:text-[#333333]"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>MongoDB Engine</span>
            </button>
          </div>

          <button
            id="admin-refresh-btn"
            onClick={fetchAdminData}
            disabled={isLoading}
            className="p-2 rounded-xl border border-[#E5E0D5] bg-[#FAF7F2] hover:bg-[#F2EDE4] text-[#4A4742] transition-colors cursor-pointer"
            title="Refresh administrative data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successNotice && (
        <div className="p-4 rounded-2xl bg-[#F0F5F1] border border-[#8BA88E]/40 text-[#5A6D5C] text-xs flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-medium">{successNotice}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-[#FAF0EE] border border-[#E8D2CC] text-[#B85D52] text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-[#B85D52] hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Summary Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-[#E5E0D5] shadow-xs">
            <div className="text-[11px] font-medium text-[#7A746B] flex items-center gap-1.5 mb-1">
              <Users className="w-3.5 h-3.5 text-[#5A6D5C]" />
              Total Users
            </div>
            <div className="text-xl font-bold font-serif text-[#333333]">{stats.total_users}</div>
            <div className="text-[10px] text-[#9E978C] mt-0.5">
              {stats.total_standard_users} Users • {stats.total_dermatologists ?? 1} Derm • {stats.total_admins} Admins
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E5E0D5] shadow-xs">
            <div className="text-[11px] font-medium text-[#7A746B] flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#9E6572]" />
              Skin Profiles
            </div>
            <div className="text-xl font-bold font-serif text-[#333333]">{stats.total_profiles}</div>
            <div className="text-[10px] text-[#5A6D5C] font-semibold mt-0.5">
              {Math.round((stats.total_profiles / (stats.total_users || 1)) * 100)}% setup rate
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E5E0D5] shadow-xs">
            <div className="text-[11px] font-medium text-[#7A746B] flex items-center gap-1.5 mb-1">
              <Activity className="w-3.5 h-3.5 text-[#5A6D5C]" />
              Assessments
            </div>
            <div className="text-xl font-bold font-serif text-[#333333]">{stats.total_assessments}</div>
            <div className="text-[10px] text-[#7A746B] mt-0.5">Milestone 2 AI Scores</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E5E0D5] shadow-xs">
            <div className="text-[11px] font-medium text-[#7A746B] flex items-center gap-1.5 mb-1">
              <Layers className="w-3.5 h-3.5 text-[#B89358]" />
              Routines
            </div>
            <div className="text-xl font-bold font-serif text-[#333333]">{stats.total_routines}</div>
            <div className="text-[10px] text-[#7A746B] mt-0.5">Custom AM/PM plans</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E5E0D5] shadow-xs">
            <div className="text-[11px] font-medium text-[#7A746B] flex items-center gap-1.5 mb-1">
              <HeartPulse className="w-3.5 h-3.5 text-[#557889]" />
              Lifestyle Logs
            </div>
            <div className="text-xl font-bold font-serif text-[#333333]">{stats.total_lifestyle_records}</div>
            <div className="text-[10px] text-[#7A746B] mt-0.5">Water & environmental</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E5E0D5] shadow-xs">
            <div className="text-[11px] font-medium text-[#7A746B] flex items-center gap-1.5 mb-1">
              <Moon className="w-3.5 h-3.5 text-[#5A6D5C]" />
              Sleep Records
            </div>
            <div className="text-xl font-bold font-serif text-[#333333]">{stats.total_sleep_records}</div>
            <div className="text-[10px] text-[#7A746B] mt-0.5">Nightly sleep entries</div>
          </div>
        </div>
      )}

      {/* TAB 1: USERS DETAILS & MANAGEMENT */}
      {activeTab === "users" && (
        <div className="space-y-6">
          {/* Controls Bar: Search, Filters, Add User */}
          <div className="bg-white rounded-3xl border border-[#E5E0D5] p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#9E978C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-user-search-input"
                  type="text"
                  placeholder="Search user by name, email, or skin type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-[#FAF7F2] border border-[#E5E0D5] rounded-xl text-xs text-[#333333] focus:bg-white focus:border-[#5A6D5C] focus:outline-none transition-all"
                />
              </div>

              {/* Role Filter */}
              <div className="flex items-center gap-1.5 text-xs text-[#7A746B]">
                <Filter className="w-3.5 h-3.5 text-[#9E978C]" />
                <select
                  id="admin-role-filter-select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-[#FAF7F2] border border-[#E5E0D5] rounded-xl text-xs text-[#333333] focus:outline-none focus:border-[#5A6D5C]"
                >
                  <option value="ALL">All Roles</option>
                  <option value="USER">Users Only</option>
                  <option value="DERMATOLOGIST">Dermatologists Only</option>
                  <option value="ADMIN">Admins Only</option>
                </select>
              </div>

              {/* Profile / Assessment Filter */}
              <select
                id="admin-profile-filter-select"
                value={profileFilter}
                onChange={(e) => setProfileFilter(e.target.value)}
                className="px-3 py-2 bg-[#FAF7F2] border border-[#E5E0D5] rounded-xl text-xs text-[#333333] focus:outline-none focus:border-[#5A6D5C]"
              >
                <option value="ALL">All Profile States</option>
                <option value="WITH_PROFILE">Has Skin Profile</option>
                <option value="NO_PROFILE">Missing Skin Profile</option>
                <option value="WITH_ASSESSMENT">Has Assessment</option>
                <option value="WITH_ROUTINE">Has Routine</option>
              </select>
            </div>

            {/* Add User Button */}
            <button
              id="admin-add-user-btn"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create User</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-3xl border border-[#E5E0D5] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#F2EDE4] bg-[#FAF7F2] text-[#7A746B] uppercase font-semibold text-[10px] tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">User Details</th>
                    <th className="py-3.5 px-3 font-semibold">Role</th>
                    <th className="py-3.5 px-3 font-semibold">Skin Profile</th>
                    <th className="py-3.5 px-3 font-semibold">Assessment Score</th>
                    <th className="py-3.5 px-3 font-semibold">Personalized Routine</th>
                    <th className="py-3.5 px-3 font-semibold">Logged Activity</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EDE4] text-[#4A4742]">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                        {/* User Identity */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#5A6D5C] text-white flex items-center justify-center font-serif font-bold text-sm shrink-0 shadow-xs">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-[#333333] text-sm flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {u.id === currentAdmin?.id && (
                                  <span className="text-[10px] bg-[#F0F5F1] text-[#5A6D5C] px-1.5 py-0.2 rounded font-mono">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#7A746B]">{u.email}</div>
                              <div className="text-[10px] text-[#9E978C] font-mono mt-0.5">
                                ID: #{u.id} • Registered {new Date(u.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3.5 px-3">
                          <RoleBadge role={u.role} size="sm" />
                        </td>

                        {/* Skin Profile Summary */}
                        <td className="py-3.5 px-3">
                          {u.has_profile ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F8F2F4] text-[#9E6572] border border-[#D1A6A6]/40">
                                {u.skin_type} • {u.age_group}
                              </span>
                              <div className="text-[10px] text-[#7A746B]">
                                {u.concerns_count} concerns • {u.allergies_count} allergies
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#9E978C] italic">
                              Profile not setup
                            </span>
                          )}
                        </td>

                        {/* Assessment Score */}
                        <td className="py-3.5 px-3">
                          {u.has_assessment && u.assessment_score !== undefined ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F0F5F1] text-[#5A6D5C] border border-[#8BA88E]/40">
                                {u.assessment_score}/100
                              </span>
                              <div className="text-[10px] text-[#7A746B]">{u.assessment_category}</div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#9E978C] italic">Pending</span>
                          )}
                        </td>

                        {/* Routine */}
                        <td className="py-3.5 px-3">
                          {u.has_routine ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" />
                              {u.routine_steps_count} Steps Active
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#9E978C] italic">Not generated</span>
                          )}
                        </td>

                        {/* Logged Activity */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-0.5 text-[11px] text-[#7A746B]">
                            <div>
                              <strong className="text-[#333333]">{u.lifestyle_count}</strong> Lifestyle logs
                            </div>
                            <div>
                              <strong className="text-[#333333]">{u.sleep_count}</strong> Sleep logs
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              id={`admin-view-user-${u.id}-btn`}
                              onClick={() => handleOpenDossier(u.id)}
                              className="p-1.5 rounded-lg border border-[#E5E0D5] bg-[#FAF7F2] hover:bg-[#5A6D5C] hover:text-white hover:border-[#5A6D5C] text-[#4A4742] transition-colors cursor-pointer"
                              title="View Full Skin Dossier"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`admin-edit-user-${u.id}-btn`}
                              onClick={() => handleStartEdit(u)}
                              className="p-1.5 rounded-lg border border-[#E5E0D5] bg-[#FAF7F2] hover:bg-[#F2EDE4] text-[#4A4742] transition-colors cursor-pointer"
                              title="Edit User Info / Role"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {u.id !== currentAdmin?.id && (
                              <button
                                id={`admin-delete-user-${u.id}-btn`}
                                onClick={() => setDeletingUserId(u.id)}
                                className="p-1.5 rounded-lg border border-[#E8D2CC] bg-[#FAF0EE] hover:bg-[#B85D52] hover:text-white text-[#B85D52] transition-colors cursor-pointer"
                                title="Delete User Account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#7A746B]">
                        No user accounts match the current search and filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MONGODB DATABASE ENGINE & COLLECTIONS */}
      {activeTab === "database" && (
        <div className="bg-white rounded-3xl border border-[#E5E0D5] p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#F2EDE4] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F0F5F1] border border-[#8BA88E]/40 flex items-center justify-center text-[#5A6D5C]">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-serif font-bold text-[#333333]">MongoDB Document Engine</h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F0F5F1] text-[#5A6D5C] border border-[#8BA88E]/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5A6D5C] animate-pulse"></span>
                    {dbStatus?.status || "Connected"}
                  </span>
                </div>
                <p className="text-xs text-[#7A746B] mt-0.5">
                  Database: <code className="text-[#5A6D5C] font-semibold">{dbStatus?.dbName || "skincare_db"}</code> • Total Documents: <strong className="text-[#333333]">{dbStatus?.totalDocuments ?? 0}</strong>
                </p>
              </div>
            </div>

            <button
              id="admin-reseed-db-btn"
              onClick={handleReseedDb}
              disabled={isReseeding}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E5E0D5] bg-[#FAF7F2] hover:bg-[#F2EDE4] text-[#4A4742] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReseeding ? "animate-spin" : ""}`} />
              <span>{isReseeding ? "Syncing Demo Data..." : "Reseed Demo Data"}</span>
            </button>
          </div>

          {/* Collections Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dbStatus?.collections.map((col) => (
              <div
                key={col.name}
                className="border border-[#E5E0D5] rounded-2xl p-4 bg-[#FAF7F2] space-y-2 hover:border-[#5A6D5C]/60 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#5A6D5C]" />
                    <span className="font-mono text-xs font-bold text-[#333333]">{col.name}</span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-white text-[#5A6D5C] border border-[#E5E0D5] rounded-lg text-xs font-bold font-mono">
                    {col.count} {col.count === 1 ? "doc" : "docs"}
                  </span>
                </div>
                <p className="text-xs text-[#7A746B] leading-snug">{col.description}</p>
                {col.indexes && (
                  <div className="pt-1.5 border-t border-[#E5E0D5]/60 text-[10px] text-[#9E978C] font-mono">
                    <strong>Indexes:</strong> {col.indexes.join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* USER DOSSIER INSPECTION MODAL */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E5E0D5] shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#F2EDE4] flex items-center justify-between bg-[#FAF7F2]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#5A6D5C] text-white flex items-center justify-center font-serif font-bold text-base shadow-xs">
                  {selectedUserDetail?.user.name.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-serif font-bold text-[#333333]">
                      {selectedUserDetail?.user.name || "User Dossier"}
                    </h2>
                    {selectedUserDetail && <RoleBadge role={selectedUserDetail.user.role} size="sm" />}
                  </div>
                  <p className="text-xs text-[#7A746B]">
                    {selectedUserDetail?.user.email} • ID #{selectedUserDetail?.user.id}
                  </p>
                </div>
              </div>

              <button
                id="admin-close-dossier-btn"
                onClick={() => {
                  setSelectedUserId(null);
                  setSelectedUserDetail(null);
                }}
                className="p-2 rounded-xl text-[#7A746B] hover:text-[#333333] hover:bg-[#F2EDE4] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Tabs */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#F2EDE4] bg-white">
              <button
                onClick={() => setDossierTab("profile")}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                  dossierTab === "profile"
                    ? "border-[#5A6D5C] text-[#5A6D5C]"
                    : "border-transparent text-[#7A746B] hover:text-[#333333]"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Skin Profile</span>
              </button>

              <button
                onClick={() => setDossierTab("assessment")}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                  dossierTab === "assessment"
                    ? "border-[#5A6D5C] text-[#5A6D5C]"
                    : "border-transparent text-[#7A746B] hover:text-[#333333]"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Skin Assessment</span>
              </button>

              <button
                onClick={() => setDossierTab("routine")}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                  dossierTab === "routine"
                    ? "border-[#5A6D5C] text-[#5A6D5C]"
                    : "border-transparent text-[#7A746B] hover:text-[#333333]"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Personalized Routine</span>
              </button>

              <button
                onClick={() => setDossierTab("activity")}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                  dossierTab === "activity"
                    ? "border-[#5A6D5C] text-[#5A6D5C]"
                    : "border-transparent text-[#7A746B] hover:text-[#333333]"
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5" />
                <span>Lifestyle & Sleep ({selectedUserDetail?.lifestyle_records.length ?? 0}/{selectedUserDetail?.sleep_records.length ?? 0})</span>
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {isLoadingDetail ? (
                <div className="py-12 text-center text-xs text-[#7A746B] flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#5A6D5C]" />
                  <span>Loading full user clinical dossier...</span>
                </div>
              ) : selectedUserDetail ? (
                <>
                  {/* TAB: SKIN PROFILE */}
                  {dossierTab === "profile" && (
                    <div className="space-y-4">
                      {selectedUserDetail.skin_profile ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5E0D5] space-y-3">
                            <h3 className="text-xs font-bold text-[#333333] uppercase tracking-wider">
                              Biometric Attributes
                            </h3>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between py-1 border-b border-[#E5E0D5]/60">
                                <span className="text-[#7A746B]">Skin Type:</span>
                                <span className="font-semibold text-[#333333]">
                                  {selectedUserDetail.skin_profile.skin_type}
                                </span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-[#E5E0D5]/60">
                                <span className="text-[#7A746B]">Age Group:</span>
                                <span className="font-semibold text-[#333333]">
                                  {selectedUserDetail.skin_profile.age_group}
                                </span>
                              </div>
                              <div className="flex justify-between py-1">
                                <span className="text-[#7A746B]">Updated At:</span>
                                <span className="text-[#333333]">
                                  {new Date(selectedUserDetail.skin_profile.updated_at).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5E0D5] space-y-3">
                            <h3 className="text-xs font-bold text-[#333333] uppercase tracking-wider">
                              Target Concerns & Sensitivities
                            </h3>
                            <div className="space-y-2 text-xs">
                              <div>
                                <span className="text-[#7A746B] block mb-1">Skin Concerns:</span>
                                <div className="flex flex-wrap gap-1">
                                  {selectedUserDetail.skin_profile.skin_concerns.map((c, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 bg-white border border-[#E5E0D5] text-[#333333] rounded-lg text-[11px] font-medium"
                                    >
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <span className="text-[#7A746B] block mb-1">Known Allergies:</span>
                                <div className="flex flex-wrap gap-1">
                                  {selectedUserDetail.skin_profile.allergies.length > 0 ? (
                                    selectedUserDetail.skin_profile.allergies.map((a, i) => (
                                      <span
                                        key={i}
                                        className="px-2 py-0.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[11px] font-medium"
                                      >
                                        {a}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[#9E978C] italic text-[11px]">None declared</span>
                                  )}
                                </div>
                              </div>

                              <div>
                                <span className="text-[#7A746B] block mb-1">Sensitivities:</span>
                                <div className="flex flex-wrap gap-1">
                                  {selectedUserDetail.skin_profile.sensitivities.length > 0 ? (
                                    selectedUserDetail.skin_profile.sensitivities.map((s, i) => (
                                      <span
                                        key={i}
                                        className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[11px] font-medium"
                                      >
                                        {s}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[#9E978C] italic text-[11px]">None declared</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 text-center text-xs text-[#7A746B] bg-[#FAF7F2] rounded-2xl border border-[#E5E0D5]">
                          This user has not yet configured their Skin Profile.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: SKIN ASSESSMENT */}
                  {dossierTab === "assessment" && (
                    <div className="space-y-4">
                      {selectedUserDetail.latest_assessment ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-[#F0F5F1] rounded-2xl border border-[#8BA88E]/40">
                            <div>
                              <span className="text-xs font-semibold text-[#5A6D5C] uppercase tracking-wider block">
                                Overall Health Score
                              </span>
                              <div className="text-2xl font-serif font-bold text-[#333333]">
                                {selectedUserDetail.latest_assessment.overall_score} / 100
                              </div>
                            </div>
                            <span className="px-3 py-1 bg-white text-[#5A6D5C] font-bold text-xs rounded-full border border-[#8BA88E]/40">
                              {selectedUserDetail.latest_assessment.score_category}
                            </span>
                          </div>

                          {/* Scores breakdown */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                            <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E5E0D5]">
                              <span className="text-[10px] text-[#7A746B] block">Barrier</span>
                              <span className="font-bold text-[#333333]">
                                {selectedUserDetail.latest_assessment.score_breakdown.barrier_health_score}/35
                              </span>
                            </div>
                            <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E5E0D5]">
                              <span className="text-[10px] text-[#7A746B] block">Lifestyle</span>
                              <span className="font-bold text-[#333333]">
                                {selectedUserDetail.latest_assessment.score_breakdown.lifestyle_balance_score}/20
                              </span>
                            </div>
                            <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E5E0D5]">
                              <span className="text-[10px] text-[#7A746B] block">Sleep</span>
                              <span className="font-bold text-[#333333]">
                                {selectedUserDetail.latest_assessment.score_breakdown.sleep_recovery_score}/15
                              </span>
                            </div>
                            <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E5E0D5]">
                              <span className="text-[10px] text-[#7A746B] block">Hydration</span>
                              <span className="font-bold text-[#333333]">
                                {selectedUserDetail.latest_assessment.score_breakdown.hydration_score}/10
                              </span>
                            </div>
                            <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E5E0D5]">
                              <span className="text-[10px] text-[#7A746B] block">Routine</span>
                              <span className="font-bold text-[#333333]">
                                {selectedUserDetail.latest_assessment.score_breakdown.routine_efficacy_score}/20
                              </span>
                            </div>
                          </div>

                          {/* Risk factors & concerns */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5E0D5] space-y-2">
                              <h4 className="text-xs font-bold text-[#333333] uppercase">
                                Prioritized Concerns ({selectedUserDetail.latest_assessment.prioritized_concerns.length})
                              </h4>
                              <div className="space-y-1.5 text-xs">
                                {selectedUserDetail.latest_assessment.prioritized_concerns.map((p, i) => (
                                  <div key={i} className="p-2 bg-white rounded-xl border border-[#E5E0D5]">
                                    <div className="font-semibold text-[#333333] flex items-center justify-between">
                                      <span>#{p.priority} {p.concern}</span>
                                      <span className="text-[10px] font-mono bg-[#F0F5F1] text-[#5A6D5C] px-1.5 rounded">
                                        Severity {p.severity}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-[#7A746B] mt-0.5">{p.rationale}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5E0D5] space-y-2">
                              <h4 className="text-xs font-bold text-[#333333] uppercase">
                                Monitored Risk Factors ({selectedUserDetail.latest_assessment.risk_factors.length})
                              </h4>
                              <div className="space-y-1.5 text-xs">
                                {selectedUserDetail.latest_assessment.risk_factors.map((r, i) => (
                                  <div key={i} className="p-2 bg-white rounded-xl border border-[#E5E0D5]">
                                    <div className="font-semibold text-[#B85D52] flex items-center justify-between">
                                      <span>{r.factor}</span>
                                      <span className="text-[10px] font-mono bg-red-50 text-red-700 px-1.5 rounded">
                                        {r.impact}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-[#7A746B] mt-0.5">{r.mitigation}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 text-center text-xs text-[#7A746B] bg-[#FAF7F2] rounded-2xl border border-[#E5E0D5]">
                          No skin health assessment has been generated for this user yet.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: SKINCARE ROUTINE */}
                  {dossierTab === "routine" && (
                    <div className="space-y-4">
                      {selectedUserDetail.latest_routine ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Morning AM */}
                            <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5E0D5] space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-[#333333] uppercase flex items-center gap-1.5">
                                  <Sun className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Morning AM Regimen ({selectedUserDetail.latest_routine.morning_routine.length} steps)</span>
                                </h4>
                              </div>
                              <div className="space-y-2">
                                {selectedUserDetail.latest_routine.morning_routine.map((st) => (
                                  <div key={st.step_order} className="p-2.5 bg-white rounded-xl border border-[#E5E0D5] text-xs">
                                    <div className="flex items-center justify-between font-semibold text-[#333333]">
                                      <span>Step {st.step_order}: {st.step_name}</span>
                                      <span className="text-[10px] text-[#5A6D5C]">{st.product_category}</span>
                                    </div>
                                    <p className="text-[11px] text-[#7A746B] mt-0.5">{st.instructions}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Evening PM */}
                            <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5E0D5] space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-[#333333] uppercase flex items-center gap-1.5">
                                  <Moon className="w-3.5 h-3.5 text-[#5A6D5C]" />
                                  <span>Evening PM Regimen ({selectedUserDetail.latest_routine.evening_routine.length} steps)</span>
                                </h4>
                              </div>
                              <div className="space-y-2">
                                {selectedUserDetail.latest_routine.evening_routine.map((st) => (
                                  <div key={st.step_order} className="p-2.5 bg-white rounded-xl border border-[#E5E0D5] text-xs">
                                    <div className="flex items-center justify-between font-semibold text-[#333333]">
                                      <span>Step {st.step_order}: {st.step_name}</span>
                                      <span className="text-[10px] text-[#5A6D5C]">{st.product_category}</span>
                                    </div>
                                    <p className="text-[11px] text-[#7A746B] mt-0.5">{st.instructions}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Excluded Ingredients */}
                          {selectedUserDetail.latest_routine.excluded_allergens_and_sensitivities.length > 0 && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 space-y-1">
                              <span className="font-semibold block">Protected Exclusions (Allergens & Sensitivities):</span>
                              <div className="flex flex-wrap gap-1">
                                {selectedUserDetail.latest_routine.excluded_allergens_and_sensitivities.map((ex, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-white rounded-md text-[10px] border border-red-200 font-mono">
                                    🚫 {ex}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-xs text-[#7A746B] bg-[#FAF7F2] rounded-2xl border border-[#E5E0D5]">
                          No skincare routine formulated for this user yet.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: LIFESTYLE & SLEEP */}
                  {dossierTab === "activity" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Lifestyle records */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-[#333333] uppercase flex items-center gap-1.5">
                          <Droplet className="w-3.5 h-3.5 text-[#557889]" />
                          <span>Lifestyle Logs ({selectedUserDetail.lifestyle_records.length})</span>
                        </h4>
                        {selectedUserDetail.lifestyle_records.length > 0 ? (
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {selectedUserDetail.lifestyle_records.map((l) => (
                              <div key={l.id} className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E5E0D5] text-xs space-y-1">
                                <div className="flex justify-between font-semibold text-[#333333]">
                                  <span>Water: {l.water_intake} L</span>
                                  <span className="text-[10px] text-[#7A746B]">
                                    {new Date(l.recorded_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="text-[11px] text-[#7A746B]">
                                  Exposure: {l.environmental_exposure || "Standard"}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#7A746B] italic">No lifestyle entries logged.</p>
                        )}
                      </div>

                      {/* Sleep records */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-[#333333] uppercase flex items-center gap-1.5">
                          <Moon className="w-3.5 h-3.5 text-[#5A6D5C]" />
                          <span>Sleep Logs ({selectedUserDetail.sleep_records.length})</span>
                        </h4>
                        {selectedUserDetail.sleep_records.length > 0 ? (
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {selectedUserDetail.sleep_records.map((s) => (
                              <div key={s.id} className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E5E0D5] text-xs space-y-1">
                                <div className="flex justify-between font-semibold text-[#333333]">
                                  <span>{s.sleep_hours} Hours</span>
                                  <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-[#F0F5F1] text-[#5A6D5C]">
                                    {s.sleep_quality}
                                  </span>
                                </div>
                                <div className="text-[10px] text-[#7A746B]">
                                  {new Date(s.recorded_at).toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#7A746B] italic">No sleep records logged.</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#F2EDE4] bg-[#FAF7F2] flex items-center justify-end">
              <button
                id="admin-close-modal-bottom-btn"
                onClick={() => {
                  setSelectedUserId(null);
                  setSelectedUserDetail(null);
                }}
                className="px-4 py-2 bg-white hover:bg-[#F2EDE4] text-[#4A4742] text-xs font-semibold rounded-xl border border-[#E5E0D5] cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E5E0D5] shadow-xl w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#F2EDE4] pb-3">
              <h2 className="text-base font-serif font-bold text-[#333333]">Create New User Account</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#7A746B] hover:text-[#333333]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#7A746B] mb-1">
                  Full Name
                </label>
                <input
                  id="admin-add-user-name"
                  type="text"
                  required
                  placeholder="e.g. Rachel Adams"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E5E0D5] rounded-xl text-xs text-[#333333] focus:bg-white focus:border-[#5A6D5C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#7A746B] mb-1">
                  Email Address
                </label>
                <input
                  id="admin-add-user-email"
                  type="email"
                  required
                  placeholder="e.g. rachel@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E5E0D5] rounded-xl text-xs text-[#333333] focus:bg-white focus:border-[#5A6D5C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#7A746B] mb-1">
                  Password
                </label>
                <input
                  id="admin-add-user-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E5E0D5] rounded-xl text-xs text-[#333333] focus:bg-white focus:border-[#5A6D5C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#7A746B] mb-1">
                  Assigned Role
                </label>
                <select
                  id="admin-add-user-role"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E5E0D5] rounded-xl text-xs text-[#333333] focus:bg-white focus:border-[#5A6D5C] focus:outline-none"
                >
                  <option value="USER">USER (Standard Patient / Consumer)</option>
                  <option value="DERMATOLOGIST">DERMATOLOGIST (Clinical Specialist)</option>
                  <option value="ADMIN">ADMIN (System & Records Administrator)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F2EDE4]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-[#F2EDE4] text-[#4A4742] font-semibold rounded-xl border border-[#E5E0D5] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="admin-confirm-create-user-btn"
                  type="submit"
                  disabled={isCreatingUser}
                  className="px-4 py-2 bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white font-semibold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isCreatingUser ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E5E0D5] shadow-xl w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#F2EDE4] pb-3">
              <h2 className="text-base font-serif font-bold text-[#333333]">Edit User Account (#{editingUser.id})</h2>
              <button onClick={() => setEditingUser(null)} className="text-[#7A746B] hover:text-[#333333]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#7A746B] mb-1">
                  Full Name
                </label>
                <input
                  id="admin-edit-user-name"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E5E0D5] rounded-xl text-xs text-[#333333] focus:bg-white focus:border-[#5A6D5C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#7A746B] mb-1">
                  Email Address
                </label>
                <input
                  id="admin-edit-user-email"
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E5E0D5] rounded-xl text-xs text-[#333333] focus:bg-white focus:border-[#5A6D5C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#7A746B] mb-1">
                  Assigned Role
                </label>
                <input
                  id="admin-edit-user-role"
                  type="text"
                  disabled
                  value={editRole}
                  className="w-full px-3.5 py-2.5 bg-[#F2EDE4] border border-[#E5E0D5] rounded-xl text-xs text-[#7A746B] cursor-not-allowed"
                />
                <span className="text-[11px] text-[#9E978C] mt-1 block">
                  Account role is locked and cannot be switched after creation.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F2EDE4]">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-white hover:bg-[#F2EDE4] text-[#4A4742] font-semibold rounded-xl border border-[#E5E0D5] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="admin-confirm-edit-user-btn"
                  type="submit"
                  disabled={isUpdatingUser}
                  className="px-4 py-2 bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white font-semibold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingUser ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingUserId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E8D2CC] shadow-xl w-full max-w-sm p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#FAF0EE] text-[#B85D52] flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#333333]">Delete User Account?</h3>
              <p className="text-xs text-[#7A746B] mt-1">
                This action will delete user ID #{deletingUserId} along with their skin profiles, clinical assessments, routines, and tracking logs.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                id="admin-cancel-delete-btn"
                onClick={() => setDeletingUserId(null)}
                className="px-4 py-2 bg-white hover:bg-[#F2EDE4] text-[#4A4742] text-xs font-semibold rounded-xl border border-[#E5E0D5] cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="admin-confirm-delete-btn"
                onClick={() => handleDeleteUser(deletingUserId)}
                disabled={isDeleting}
                className="px-4 py-2 bg-[#B85D52] hover:bg-[#9E4A40] text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
