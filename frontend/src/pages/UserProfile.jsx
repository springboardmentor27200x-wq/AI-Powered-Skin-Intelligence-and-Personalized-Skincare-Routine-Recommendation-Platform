import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateCurrentUser, changePassword } from "../services/api";

const ROLE_LABELS = {
  user: "User",
  skincare_consultant: "Skincare Consultant",
  dermatologist: "Dermatologist",
  admin: "Administrator",
};
const ROLE_BADGES = {
  user: "badge-user",
  skincare_consultant: "badge-consultant",
  dermatologist: "badge-dermatologist",
  admin: "badge-admin",
};

export default function UserProfile({ user, setUser, onLogout }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
  });
  const [pw, setPw] = useState({ current_password: "", new_password: "", confirm: "" });
  const [msg, setMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [error, setError] = useState("");
  const [pwError, setPwError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const changeField = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const changePw = (e) => setPw({ ...pw, [e.target.name]: e.target.value });

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      if (setUser) setUser(null);
      navigate("/login");
    }
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    setMsg(""); setError(""); setSaving(true);
    try {
      const r = await updateCurrentUser(form);
      setUser(r.data);
      setMsg("Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update profile.");
    } finally { setSaving(false); }
  };

  const submitPw = async (e) => {
    e.preventDefault();
    setPwMsg(""); setPwError(""); 
    if (pw.new_password !== pw.confirm) return setPwError("New passwords do not match.");
    setSavingPw(true);
    try {
      await changePassword({ current_password: pw.current_password, new_password: pw.new_password });
      setPwMsg("Password changed successfully.");
      setPw({ current_password: "", new_password: "", confirm: "" });
    } catch (err) {
      setPwError(err.response?.data?.detail || "Failed to change password.");
    } finally { setSavingPw(false); }
  };

  return (
    <section className="profile-section">
      <p className="eyebrow">My Account</p>
      <h1 style={{ marginBottom: 8 }}>Account Settings</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 4 }}>
        {user?.email} &nbsp;
        <span className={`badge ${ROLE_BADGES[user?.role] || "badge-user"}`}>
          {ROLE_LABELS[user?.role] || user?.role}
        </span>
      </p>

      {/* Profile form */}
      <div className="card" style={{ marginTop: 24 }}>
        <h2>Personal Information</h2>
        {msg && <div className="success">{msg}</div>}
        {error && <div className="error">{error}</div>}
        <form onSubmit={submitProfile} style={{ display: "grid", gap: 14, marginTop: 14 }}>
          <label>
            Full Name
            <input name="name" value={form.name} onChange={changeField} required minLength={2} />
          </label>
          <label>
            Phone
            <input name="phone" value={form.phone} onChange={changeField} placeholder="Optional" />
          </label>
          <label>
            Bio
            <textarea name="bio" value={form.bio} onChange={changeField} placeholder="Tell us a bit about yourself" rows={3} />
          </label>
          <button className="primary" disabled={saving}>
            {saving ? "Saving…" : "Update Profile"}
          </button>
        </form>
      </div>

      {/* Password change */}
      <div className="card" style={{ marginTop: 20 }}>
        <h2>Change Password</h2>
        {pwMsg && <div className="success">{pwMsg}</div>}
        {pwError && <div className="error">{pwError}</div>}
        <form onSubmit={submitPw} style={{ display: "grid", gap: 14, marginTop: 14 }}>
          <label>
            Current Password
            <input name="current_password" type="password" value={pw.current_password} onChange={changePw} required />
          </label>
          <label>
            New Password
            <input name="new_password" type="password" value={pw.new_password} onChange={changePw} minLength={8} required />
          </label>
          <label>
            Confirm New Password
            <input name="confirm" type="password" value={pw.confirm} onChange={changePw} required />
          </label>
          <button className="primary" disabled={savingPw}>
            {savingPw ? "Changing…" : "Change Password"}
          </button>
        </form>
      </div>

      {/* Account Session & Logout */}
      <div className="card" style={{ marginTop: 20, borderTop: "4px solid #ef4444", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#1f2937" }}>Account Session</h2>
          <p style={{ color: "var(--text-muted)", margin: "4px 0 0", fontSize: "0.85rem" }}>
            Signed in as <strong>{user?.email}</strong>. Click below to sign out securely.
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
            color: "white",
            border: "none",
            borderRadius: 10,
            padding: "10px 24px",
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 2px 8px rgba(239, 68, 68, 0.25)",
            transition: "all 0.2s",
          }}
        >
          🚪 Sign Out / Logout
        </button>
      </div>
    </section>
  );
}
