import { useState, useEffect } from "react";
import {
  listUsersForNotification,
  sendNotificationToUser,
  broadcastNotification,
} from "../services/api";

const NOTIF_TYPES = [
  { value: "system", label: "📢 System Message" },
  { value: "routine_reminder", label: "🌿 Routine Reminder" },
  { value: "hydration_reminder", label: "💧 Hydration Reminder" },
  { value: "sleep_reminder", label: "😴 Sleep Reminder" },
  { value: "progress_alert", label: "📊 Progress Alert" },
  { value: "replenishment", label: "🛒 Product Replenishment" },
];

const TEMPLATES = [
  { label: "Custom Message", title: "", message: "", type: "system" },
  {
    label: "Routine Reminder",
    title: "🌿 Daily Routine Reminder",
    message: "Hi! Just a gentle reminder to follow your skincare routine today. Consistency is the key to healthy, glowing skin!",
    type: "routine_reminder",
  },
  {
    label: "Hydration Alert",
    title: "💧 Stay Hydrated!",
    message: "Don't forget to drink enough water today. Aim for at least 8 glasses — your skin will thank you!",
    type: "hydration_reminder",
  },
  {
    label: "Sleep Reminder",
    title: "😴 Sleep Well Tonight",
    message: "Getting 7-9 hours of quality sleep is essential for skin repair. Try winding down 30 minutes before bed.",
    type: "sleep_reminder",
  },
  {
    label: "Progress Check-in",
    title: "📊 How's Your Skin Doing?",
    message: "It's time for a skin progress check-in! Log your current skin condition and track your improvement over time.",
    type: "progress_alert",
  },
  {
    label: "Appointment Reminder",
    title: "📅 Upcoming Appointment",
    message: "This is a reminder about your upcoming skin consultation. Please make sure your skin profile is up to date.",
    type: "system",
  },
  {
    label: "Product Restock",
    title: "🛒 Time to Restock?",
    message: "It may be time to restock your skincare products. Check your routine and ensure you have all the essentials.",
    type: "replenishment",
  },
];

export default function SendNotification() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mode, setMode] = useState("single"); // single | broadcast
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notifType, setNotifType] = useState("system");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    listUsersForNotification()
      .then((r) => setUsers(r.data))
      .catch(() => setError("Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  const applyTemplate = (template) => {
    setTitle(template.title);
    setMessage(template.message);
    setNotifType(template.type);
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setError("Title and message are required.");
      return;
    }
    if (mode === "single" && !selectedUser) {
      setError("Please select a user to send the notification to.");
      return;
    }
    setSending(true);
    setError("");
    setSuccess("");
    try {
      if (mode === "broadcast") {
        const res = await broadcastNotification({ title, message, notification_type: notifType });
        setSuccess(res.data.message);
      } else {
        const res = await sendNotificationToUser({
          user_id: selectedUser.id,
          title,
          message,
          notification_type: notifType,
        });
        setSuccess(`${res.data.message} (Email: ${res.data.recipient.email}${res.data.recipient.phone ? `, Phone: ${res.data.recipient.phone}` : ""})`);
      }
      setTitle("");
      setMessage("");
      setNotifType("system");
      if (mode === "single") setSelectedUser(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send notification.");
    }
    setSending(false);
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone || "").includes(searchTerm)
  );

  const role = localStorage.getItem("role");

  if (loading) return <div className="card" style={{ textAlign: "center", padding: 40 }}>Loading users...</div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#1f2937" }}>📨 Send Notification</h2>
        <p style={{ color: "#6b7280" }}>Send personalized notifications to users with their contact details.</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && (
        <div style={{
          background: "#d1fae5", border: "1px solid #10b981", color: "#065f46",
          borderRadius: 10, padding: "14px 20px", marginBottom: 16, fontSize: "0.9rem",
        }}>
          ✅ {success}
        </div>
      )}

      {/* Mode Toggle */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24 }}>
        {[
          { key: "single", label: "👤 Send to User" },
          ...(role === "admin" ? [{ key: "broadcast", label: "📢 Broadcast to All" }] : []),
        ].map((m) => (
          <button
            key={m.key}
            onClick={() => { setMode(m.key); setSelectedUser(null); }}
            style={{
              padding: "10px 24px", border: "2px solid #e5e7eb",
              background: mode === m.key ? "#7c3aed" : "white",
              color: mode === m.key ? "white" : "#6b7280",
              fontWeight: mode === m.key ? 700 : 500,
              cursor: "pointer", fontSize: "0.9rem",
              borderRadius: m.key === "single" ? "10px 0 0 10px" : "0 10px 10px 0",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mode === "single" ? "320px 1fr" : "1fr", gap: 24 }}>

        {/* User List (single mode only) */}
        {mode === "single" && (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "white" }}>
              <h3 style={{ margin: "0 0 10px 0", fontWeight: 700 }}>Users ({filtered.length})</h3>
              <input
                type="text"
                placeholder="🔍 Search by name, email or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 8,
                  border: "none", fontSize: "0.85rem", outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ maxHeight: "520px", overflowY: "auto" }}>
              {filtered.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#9ca3af" }}>No users found.</div>
              ) : (
                filtered.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #f3f4f6",
                      cursor: "pointer",
                      background: selectedUser?.id === u.id ? "#faf5ff" : "white",
                      borderLeft: selectedUser?.id === u.id ? "4px solid #7c3aed" : "4px solid transparent",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 600, color: "#1f2937" }}>{u.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{u.email}</div>
                        {u.phone && (
                          <div style={{ fontSize: "0.78rem", color: "#7c3aed", marginTop: 2 }}>
                            📱 {u.phone}
                          </div>
                        )}
                      </div>
                      <span style={{
                        fontSize: "0.7rem", fontWeight: 600, padding: "2px 8px",
                        borderRadius: 20,
                        background: u.role === "admin" ? "#fee2e2" : u.role === "dermatologist" ? "#dbeafe" : u.role === "skincare_consultant" ? "#d1fae5" : "#f3f4f6",
                        color: u.role === "admin" ? "#991b1b" : u.role === "dermatologist" ? "#1e40af" : u.role === "skincare_consultant" ? "#065f46" : "#6b7280",
                      }}>
                        {u.role.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Compose Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Selected user info */}
          {mode === "single" && selectedUser && (
            <div className="card" style={{
              background: "#faf5ff", borderLeft: "4px solid #7c3aed", padding: "16px 20px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontWeight: 700, color: "#1f2937", fontSize: "1.1rem" }}>
                  📨 Sending to: {selectedUser.name}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: 4 }}>
                  ✉️ {selectedUser.email}
                  {selectedUser.phone && <span style={{ marginLeft: 16 }}>📱 {selectedUser.phone}</span>}
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#9ca3af" }}
              >✕</button>
            </div>
          )}

          {mode === "broadcast" && (
            <div className="card" style={{
              background: "#fef3c7", borderLeft: "4px solid #f59e0b", padding: "16px 20px",
            }}>
              <div style={{ fontWeight: 700, color: "#92400e" }}>📢 Broadcasting to all {users.length} users</div>
              <div style={{ fontSize: "0.85rem", color: "#92400e", marginTop: 4 }}>
                This notification will be sent to every registered user on the platform.
              </div>
            </div>
          )}

          {/* Quick Templates */}
          <div className="card">
            <h4 style={{ fontWeight: 700, color: "#1f2937", marginBottom: 12 }}>⚡ Quick Templates</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {TEMPLATES.map((t, i) => (
                <button
                  key={i}
                  onClick={() => applyTemplate(t)}
                  style={{
                    padding: "6px 14px", borderRadius: 20, border: "2px solid #e5e7eb",
                    background: "white", cursor: "pointer", fontSize: "0.8rem",
                    fontWeight: 500, color: "#374151", transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.target.style.borderColor = "#7c3aed"; e.target.style.background = "#faf5ff"; }}
                  onMouseLeave={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.background = "white"; }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Compose */}
          <div className="card">
            <h4 style={{ fontWeight: 700, color: "#1f2937", marginBottom: 16 }}>✍️ Compose Notification</h4>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={{ fontWeight: 600, display: "block", marginBottom: 6, color: "#374151" }}>
                  Notification Type
                </label>
                <select
                  className="input"
                  value={notifType}
                  onChange={(e) => setNotifType(e.target.value)}
                  style={{ width: "100%" }}
                >
                  {NOTIF_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontWeight: 600, display: "block", marginBottom: 6, color: "#374151" }}>
                  Title *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Notification title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ fontWeight: 600, display: "block", marginBottom: 6, color: "#374151" }}>
                  Message *
                </label>
                <textarea
                  rows={4}
                  className="input"
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ width: "100%", resize: "vertical" }}
                />
              </div>

              {/* Preview */}
              {(title || message) && (
                <div style={{ background: "#f9fafb", borderRadius: 12, padding: "14px 18px", border: "1px solid #e5e7eb" }}>
                  <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: 6, fontWeight: 600 }}>PREVIEW</div>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: "1.2rem" }}>
                      {NOTIF_TYPES.find((t) => t.value === notifType)?.label.split(" ")[0] || "📢"}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, color: "#1f2937", fontSize: "0.9rem" }}>{title || "Untitled"}</div>
                      <div style={{ fontSize: "0.82rem", color: "#6b7280", marginTop: 4, lineHeight: 1.5 }}>{message || "..."}</div>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleSend}
                disabled={sending || !title.trim() || !message.trim() || (mode === "single" && !selectedUser)}
                style={{
                  padding: "14px 28px",
                  background: sending ? "#9ca3af" : mode === "broadcast" ? "linear-gradient(135deg, #f59e0b, #d97706)" : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                  color: "white", border: "none", borderRadius: 10, cursor: "pointer",
                  fontWeight: 700, fontSize: "1rem", transition: "all 0.2s",
                  opacity: (!title.trim() || !message.trim() || (mode === "single" && !selectedUser)) ? 0.5 : 1,
                }}
              >
                {sending
                  ? "Sending..."
                  : mode === "broadcast"
                  ? `📢 Broadcast to All ${users.length} Users`
                  : `📨 Send to ${selectedUser?.name || "..."}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
