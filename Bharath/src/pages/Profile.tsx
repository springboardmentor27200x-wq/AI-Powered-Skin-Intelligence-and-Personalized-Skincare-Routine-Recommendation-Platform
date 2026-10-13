import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { RoleBadge } from "../components/RoleBadge";
import { DatabaseStatus } from "../types";
import { api } from "../services/api";
import {
  User as UserIcon,
  Mail,
  Shield,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  KeyRound,
  Database,
  Layers,
} from "lucide-react";

export const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    api.getDatabaseStatus().then(setDbStatus).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage("Full name cannot be blank.");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Email address cannot be blank.");
      return;
    }

    setIsSaving(true);
    try {
      await updateUser({ name: name.trim(), email: email.trim() });
      setSuccessMessage("User profile updated successfully in database!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#E5E0D5] text-[#5A6D5C] text-xs font-semibold mb-2">
          <UserIcon className="w-3.5 h-3.5" />
          <span>User Profile Management</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#333333] tracking-tight">
          Account & Profile
        </h1>
        <p className="text-xs text-[#7A746B] mt-1 font-medium">
          Manage your account credentials, view role permissions, and modify registration details.
        </p>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-[#F0F5F1] border border-[#8BA88E]/40 text-[#5A6D5C] text-xs flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#5A6D5C]" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-[#FAF0EE] border border-[#E8D2CC] text-[#B85D52] text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#B85D52]" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Summary Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-[#E5E0D5] p-6 shadow-xs text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-[#5A6D5C] text-white flex items-center justify-center text-xl font-serif font-bold mx-auto shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#333333]">{user?.name}</h2>
              <p className="text-xs text-[#7A746B] truncate">{user?.email}</p>
            </div>

            <div className="pt-2">
              {user && <RoleBadge role={user.role} size="md" />}
            </div>

            <div className="pt-4 border-t border-[#F2EDE4] text-left text-xs space-y-2 text-[#4A4742]">
              <div className="flex items-center justify-between">
                <span className="text-[#9E978C] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Registered:
                </span>
                <span className="font-medium text-[#333333]">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Active"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9E978C] flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  Auth Type:
                </span>
                <span className="font-medium text-[#333333]">JWT (HS256)</span>
              </div>
            </div>
          </div>

          {/* RBAC Info Card */}
          <div className="bg-[#FAF7F2] rounded-3xl border border-[#E5E0D5] p-5 text-xs text-[#4A4742] space-y-2">
            <div className="font-serif font-bold text-[#333333] flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#5A6D5C]" />
              <span>Role Permissions (RBAC)</span>
            </div>
            <p className="text-[11px] text-[#7A746B] leading-relaxed">
              Your role <strong className="text-[#333333]">{user?.role}</strong> grants access to personal profile updates, skin profile configurations, and tracking logs.
            </p>
          </div>

          {/* MongoDB Database Info Card - Admin Only */}
          {user?.role === "ADMIN" && (
            <div className="bg-white rounded-3xl border border-[#E5E0D5] p-5 text-xs text-[#4A4742] space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#F2EDE4] pb-2">
                <div className="font-serif font-bold text-[#333333] flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-[#5A6D5C]" />
                  <span>MongoDB Storage</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-[#F0F5F1] text-[#5A6D5C] font-semibold rounded-full border border-[#8BA88E]/40">
                  {dbStatus?.dbName || "skincare_db"}
                </span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                {dbStatus?.collections.map((col) => (
                  <div key={col.name} className="flex items-center justify-between py-0.5">
                    <span className="font-mono text-[#7A746B]">{col.name}</span>
                    <span className="font-mono font-semibold text-[#333333]">{col.count} docs</span>
                  </div>
                )) || (
                  <span className="text-[#9E978C]">Fetching database info...</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Edit Form */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-3xl border border-[#E5E0D5] p-6 sm:p-7 shadow-xs space-y-6">
            <div className="border-b border-[#F2EDE4] pb-4">
              <h2 className="text-base font-serif font-bold text-[#333333]">Personal Details</h2>
              <p className="text-xs text-[#7A746B] mt-0.5">
                Update the display name and contact email tied to your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A746B] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#9E978C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="profile-name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-[#FAF7F2] border border-[#E5E0D5] rounded-xl text-sm text-[#333333] focus:bg-white focus:border-[#5A6D5C] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A746B] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#9E978C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="profile-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-[#FAF7F2] border border-[#E5E0D5] rounded-xl text-sm text-[#333333] focus:bg-white focus:border-[#5A6D5C] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A746B] mb-1.5">
                  Assigned Platform Role
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-[#9E978C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="profile-role-display"
                    type="text"
                    disabled
                    value={user?.role || "USER"}
                    className="w-full pl-10 pr-3 py-2.5 bg-[#F2EDE4] border border-[#E5E0D5] rounded-xl text-sm text-[#7A746B] cursor-not-allowed"
                  />
                </div>
                <span className="text-[11px] text-[#9E978C] mt-1 block">
                  Your role is permanently assigned to your account and cannot be switched.
                </span>
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-[#F2EDE4]">
                <button
                  id="profile-save-btn"
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white text-xs font-medium transition-all flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
