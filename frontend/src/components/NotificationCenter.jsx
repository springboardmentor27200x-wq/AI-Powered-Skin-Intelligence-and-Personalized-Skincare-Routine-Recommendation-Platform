import { useState, useEffect, useRef } from "react";
import { getNotifications, markNotificationRead, markAllNotificationsRead, generateReminders } from "../services/api";

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      // silently fail if not logged in
    }
  };

  useEffect(() => {
    if (localStorage.getItem("token")) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000); // poll every minute
      return () => clearInterval(interval);
    }
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      fetchNotifications();
    } catch (err) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      fetchNotifications();
    } catch (err) {}
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await generateReminders();
      await fetchNotifications();
    } catch (err) {}
    setLoading(false);
  };

  const typeIcon = (type) => {
    const icons = {
      routine_reminder: "🌿",
      hydration_reminder: "💧",
      sleep_reminder: "😴",
      progress_alert: "📊",
      replenishment: "🛒",
      system: "✨",
    };
    return icons[type] || "🔔";
  };

  if (!localStorage.getItem("token")) return null;

  return (
    <div style={{ position: "relative" }} ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "1.4rem",
          position: "relative",
          padding: "4px 8px",
          color: "white",
        }}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              background: "#ef4444",
              color: "white",
              borderRadius: "50%",
              fontSize: "0.65rem",
              fontWeight: 700,
              width: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: "340px",
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "12px 16px",
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 700 }}>🔔 Notifications {unreadCount > 0 && `(${unreadCount} new)`}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleGenerate}
                disabled={loading}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  color: "white",
                  borderRadius: 6,
                  padding: "3px 8px",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                }}
                title="Generate daily reminders"
              >
                {loading ? "..." : "Refresh"}
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "none",
                    color: "white",
                    borderRadius: 6,
                    padding: "3px 8px",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: "380px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#9ca3af" }}>
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>🔕</div>
                <p>No notifications yet</p>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  style={{
                    background: "#7c3aed",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    cursor: "pointer",
                    marginTop: 8,
                  }}
                >
                  Generate Reminders
                </button>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f3f4f6",
                    background: n.is_read ? "white" : "#faf5ff",
                    cursor: n.is_read ? "default" : "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{typeIcon(n.notification_type)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: n.is_read ? 500 : 700, fontSize: "0.85rem", color: "#1f2937" }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: 2, lineHeight: 1.4 }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#d1d5db", marginTop: 4 }}>
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                    {!n.is_read && (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#7c3aed",
                          flexShrink: 0,
                          marginTop: 4,
                        }}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
