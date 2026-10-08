import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";

function Settings() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Account State
  const [account, setAccount] = useState({
    name: "",
    email: "",
    role: "user",
    created_at: "",
  });
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountMsg, setAccountMsg] = useState(null);

  // Security / Password State
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);

  // Preferences State
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem("skin_preferences");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      morningReminder: true,
      eveningReminder: true,
      hydrationAlerts: true,
      weatherAlerts: true,
      currency: "INR",
    };
  });
  const [prefNotice, setPrefNotice] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    // Fetch live account info
    axios
      .get("http://127.0.0.1:5000/api/user/account", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setAccount({
          name: res.data.name || "",
          email: res.data.email || "",
          role: res.data.role || "user",
          created_at: res.data.created_at || "Recent",
        });
      })
      .catch(() => {
        // Fallback to local storage user
        const local = localStorage.getItem("user");
        if (local) {
          try {
            const u = JSON.parse(local);
            setAccount((prev) => ({
              ...prev,
              name: u.name || "",
              email: u.email || "",
              role: u.role || "user",
            }));
          } catch {
            // ignore
          }
        }
      })
      .finally(() => setLoadingAccount(false));
  }, [token, navigate]);

  // Handle Account Update
  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setAccountMsg(null);

    if (!account.name.trim() || !account.email.trim()) {
      setAccountMsg({ type: "error", text: "Name and email cannot be empty." });
      return;
    }

    setSavingAccount(true);
    try {
      const res = await axios.post(
        "http://127.0.0.1:5000/api/user/account",
        { name: account.name, email: account.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update localStorage so Layout/Navbar syncs immediately
      const stored = localStorage.getItem("user");
      const currentObj = stored ? JSON.parse(stored) : {};
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...currentObj,
          name: res.data.user?.name || account.name,
          email: res.data.user?.email || account.email,
        })
      );

      setAccountMsg({
        type: "success",
        text: "Account details updated successfully! Reload or navigate to see changes reflected across the app.",
      });
    } catch (err) {
      setAccountMsg({
        type: "error",
        text: err.response?.data?.error || "Failed to update account details.",
      });
    } finally {
      setSavingAccount(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!passwordForm.current_password || !passwordForm.new_password) {
      setPasswordMsg({
        type: "error",
        text: "Please enter your current password and a new password.",
      });
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setPasswordMsg({
        type: "error",
        text: "New password must be at least 6 characters long.",
      });
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMsg({
        type: "error",
        text: "The new passwords do not match. Please re-check.",
      });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await axios.post(
        "http://127.0.0.1:5000/api/user/change-password",
        {
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPasswordMsg({
        type: "success",
        text: res.data?.message || "Password changed successfully!",
      });
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      setPasswordMsg({
        type: "error",
        text: err.response?.data?.error || "Failed to change password.",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  // Toggle Preferences
  const handleTogglePref = (key) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    localStorage.setItem("skin_preferences", JSON.stringify(updated));
    showPrefNotice();
  };

  const handleCurrencyChange = (curr) => {
    const updated = { ...preferences, currency: curr };
    setPreferences(updated);
    localStorage.setItem("skin_preferences", JSON.stringify(updated));
    showPrefNotice();
  };

  const showPrefNotice = () => {
    setPrefNotice("Preference saved!");
    setTimeout(() => setPrefNotice(""), 2400);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  const getRoleBadge = (role) => {
    const r = (role || "user").toLowerCase();
    if (r === "dermatologist") {
      return { label: "Doctor / Dermatologist", bg: "#e0f2fe", color: "#0369a1" };
    }
    if (r === "consultant") {
      return { label: "Skincare Consultant", bg: "#f3e8ff", color: "#7e22ce" };
    }
    if (r === "admin") {
      return { label: "System Administrator", bg: "#fef3c7", color: "#92400e" };
    }
    return { label: "Standard Member", bg: "#d1fae5", color: "#065f46" };
  };

  const badge = getRoleBadge(account.role);

  return (
    <Layout>
      <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 60 }}>
        {/* Header Title */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              margin: 0,
              fontSize: "2rem",
              color: "#1b4332",
              fontFamily: "Georgia, serif",
              fontWeight: 700,
            }}
          >
            Settings & Preferences
          </h1>
          <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: 14 }}>
            Manage your personal profile, security credentials, daily notification alerts, and application preferences.
          </p>
        </div>

        {/* 2-Column Responsive Layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* ================= COLUMN 1: Profile & Preferences ================= */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Card 1: Account Information */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <span style={iconCircleStyle}>👤</span>
                <div>
                  <h2 style={cardTitleStyle}>Personal Account Details</h2>
                  <p style={cardSubStyle}>Update your name and primary login email.</p>
                </div>
              </div>

              {accountMsg && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    marginBottom: 16,
                    fontSize: 13,
                    background: accountMsg.type === "success" ? "#dcfce7" : "#fee2e2",
                    color: accountMsg.type === "success" ? "#166534" : "#991b1b",
                    border: `1px solid ${accountMsg.type === "success" ? "#86efac" : "#fca5a5"}`,
                  }}
                >
                  {accountMsg.text}
                </div>
              )}

              {loadingAccount ? (
                <p style={{ fontSize: 14, color: "#6b7280" }}>Loading account details...</p>
              ) : (
                <form onSubmit={handleSaveAccount} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <input
                      type="text"
                      value={account.name}
                      onChange={(e) => setAccount({ ...account, name: e.target.value })}
                      placeholder="e.g. Dr. Jane Doe"
                      required
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input
                      type="email"
                      value={account.email}
                      onChange={(e) => setAccount({ ...account, email: e.target.value })}
                      placeholder="e.g. jane@example.com"
                      required
                      style={inputStyle}
                    />
                  </div>

                  {/* Metadata display */}
                  <div
                    style={{
                      background: "#f8faf9",
                      padding: "12px 16px",
                      borderRadius: 10,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      border: "1px solid #e5e7eb",
                      marginTop: 4,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Assigned Role
                      </div>
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: 4,
                          padding: "3px 10px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          background: badge.bg,
                          color: badge.color,
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Member Since
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginTop: 4 }}>
                        {account.created_at || "Active Member"}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingAccount}
                    style={{
                      ...btnPrimaryStyle,
                      marginTop: 6,
                      opacity: savingAccount ? 0.7 : 1,
                      cursor: savingAccount ? "not-allowed" : "pointer",
                    }}
                  >
                    {savingAccount ? "Saving..." : "Save Profile Details"}
                  </button>
                </form>
              )}
            </div>

            {/* Card 2: Skincare & Notification Preferences */}
            <div style={cardStyle}>
              <div style={{ ...cardHeaderStyle, justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={iconCircleStyle}>🔔</span>
                  <div>
                    <h2 style={cardTitleStyle}>Routine & Alerts Preferences</h2>
                    <p style={cardSubStyle}>Customize daily alarms, reminders, and currency.</p>
                  </div>
                </div>
                {prefNotice && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#166534",
                      background: "#dcfce7",
                      padding: "4px 8px",
                      borderRadius: 6,
                    }}
                  >
                    {prefNotice}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Morning Reminder Toggle */}
                <div style={prefRowStyle}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1f2937" }}>
                      Morning Regimen Reminder (AM)
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      Gentle reminder at 8:00 AM for cleanser, serum & sunscreen.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={preferences.morningReminder}
                    onChange={() => handleTogglePref("morningReminder")}
                  />
                </div>

                {/* Evening Reminder Toggle */}
                <div style={prefRowStyle}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1f2937" }}>
                      Evening Regimen Reminder (PM)
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      Reminder at 9:30 PM for double cleansing and nocturnal barrier repair.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={preferences.eveningReminder}
                    onChange={() => handleTogglePref("eveningReminder")}
                  />
                </div>

                {/* Hydration Water Alert */}
                <div style={prefRowStyle}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1f2937" }}>
                      Hydration & Water Goal Alerts
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      Periodic prompts to meet your target 2.5L daily hydration.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={preferences.hydrationAlerts}
                    onChange={() => handleTogglePref("hydrationAlerts")}
                  />
                </div>

                {/* Weather & UV Adaptive Tips */}
                <div style={prefRowStyle}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1f2937" }}>
                      Weather & High-UV Alerts
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      Dynamic notifications when local UV index exceeds 6.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={preferences.weatherAlerts}
                    onChange={() => handleTogglePref("weatherAlerts")}
                  />
                </div>

                {/* Preferred Currency Selector */}
                <div style={{ paddingTop: 8, borderTop: "1px solid #f0fdf4" }}>
                  <label style={labelStyle}>Product Price Currency</label>
                  <select
                    value={preferences.currency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    <option value="INR">INR (₹ - Indian Rupee)</option>
                    <option value="USD">USD ($ - US Dollar)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ================= COLUMN 2: Security & Actions ================= */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Card 3: Security & Password */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <span style={iconCircleStyle}>🔒</span>
                <div>
                  <h2 style={cardTitleStyle}>Security & Password</h2>
                  <p style={cardSubStyle}>Update your account password regularly for security.</p>
                </div>
              </div>

              {passwordMsg && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    marginBottom: 16,
                    fontSize: 13,
                    background: passwordMsg.type === "success" ? "#dcfce7" : "#fee2e2",
                    color: passwordMsg.type === "success" ? "#166534" : "#991b1b",
                    border: `1px solid ${passwordMsg.type === "success" ? "#86efac" : "#fca5a5"}`,
                  }}
                >
                  {passwordMsg.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.current_password}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, current_password: e.target.value })
                    }
                    placeholder="Enter existing password"
                    required
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>New Password (min. 6 characters)</label>
                  <input
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, new_password: e.target.value })
                    }
                    placeholder="Enter new password"
                    required
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
                    }
                    placeholder="Re-type new password"
                    required
                    style={inputStyle}
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingPassword}
                  style={{
                    ...btnPrimaryStyle,
                    background: "#2d6a4f",
                    marginTop: 6,
                    opacity: savingPassword ? 0.7 : 1,
                    cursor: savingPassword ? "not-allowed" : "pointer",
                  }}
                >
                  {savingPassword ? "Updating Password..." : "Update Password"}
                </button>
              </form>
            </div>

            {/* Card 4: Quick Shortcuts & Health Portal Actions */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <span style={iconCircleStyle}>⚡</span>
                <div>
                  <h2 style={cardTitleStyle}>Skincare Portal Actions</h2>
                  <p style={cardSubStyle}>Quick access to your assessment, reports, and session.</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  onClick={() => navigate("/profile")}
                  style={shortcutBtnStyle}
                >
                  <span style={{ fontSize: 16 }}>📋</span>
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#1b4332" }}>
                      Retake Skin Questionnaire
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      Update skin type, concerns, sleep & lifestyle factors
                    </div>
                  </div>
                  <span style={{ color: "#2d6a4f", fontWeight: 700 }}>→</span>
                </button>

                <button
                  onClick={() => navigate("/reports")}
                  style={shortcutBtnStyle}
                >
                  <span style={{ fontSize: 16 }}>📄</span>
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#1b4332" }}>
                      Download Clinical PDF Reports
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      Export Assessment, Routine Plan & Product Recommendations
                    </div>
                  </div>
                  <span style={{ color: "#2d6a4f", fontWeight: 700 }}>→</span>
                </button>

                <button
                  onClick={() => navigate("/progress")}
                  style={shortcutBtnStyle}
                >
                  <span style={{ fontSize: 16 }}>📈</span>
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#1b4332" }}>
                      View Progress & Score Analytics
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      Track skin health score changes over the past 30 days
                    </div>
                  </div>
                  <span style={{ color: "#2d6a4f", fontWeight: 700 }}>→</span>
                </button>
              </div>

              {/* Sign Out Card */}
              <div
                style={{
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: "1px solid #fee2e2",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#991b1b" }}>
                    Sign Out of Account
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Safely log out of this browser session.
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  style={{
                    background: "#fee2e2",
                    color: "#991b1b",
                    border: "1px solid #fca5a5",
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "#fecaca")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "#fee2e2")}
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Privacy & Clinical Compliance Notice */}
            <div
              style={{
                background: "#f0fdf4",
                borderRadius: 14,
                padding: "16px 20px",
                border: "1px solid #bbf7d0",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: 18 }}>🛡️</span>
              <div style={{ fontSize: 12, color: "#166534", lineHeight: 1.5 }}>
                <b>Data Security & Privacy:</b> Your skin assessment responses, routine checklists, and clinical notes are encrypted. They are strictly utilized to compute personalized health insights and recommendation matches.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Custom Toggle Switch Component
function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      style={{
        position: "relative",
        width: 46,
        height: 24,
        borderRadius: 12,
        background: checked ? "#1b4332" : "#d1d5db",
        border: "none",
        cursor: "pointer",
        outline: "none",
        transition: "background 0.25s ease",
        padding: 0,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 24 : 2,
          width: 20,
          height: 20,
          borderRadius: 10,
          background: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "left 0.25s ease",
        }}
      />
    </button>
  );
}

// Styles
const cardStyle = {
  background: "white",
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 4px 18px rgba(27,67,50,0.05)",
  border: "1px solid #edf5f0",
};

const cardHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 18,
};

const iconCircleStyle = {
  width: 36,
  height: 36,
  borderRadius: 10,
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 17,
};

const cardTitleStyle = {
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
  color: "#1b4332",
};

const cardSubStyle = {
  margin: "2px 0 0",
  fontSize: 12,
  color: "#6b7280",
};

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.4px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 14,
  color: "#111827",
  outline: "none",
  transition: "border 0.2s",
};

const btnPrimaryStyle = {
  background: "#1b4332",
  color: "white",
  border: "none",
  padding: "11px 18px",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  transition: "background 0.2s",
};

const prefRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 0",
  borderBottom: "1px solid #f3f4f6",
};

const shortcutBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: "#f8faf9",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "12px 14px",
  cursor: "pointer",
  width: "100%",
  transition: "all 0.15s ease",
};

export default Settings;