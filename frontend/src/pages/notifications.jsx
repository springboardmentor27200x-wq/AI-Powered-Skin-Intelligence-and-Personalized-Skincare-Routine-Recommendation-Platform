import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchAllMyNotifications } from "../api/client";

const DISMISSED_KEY = "dismissed_announcements";

const DOT_COLOR = {
  warning: "bg-bloom-600",
  info: "bg-clinical-400",
  success: "bg-clinical-600",
};

function loadDismissed() {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY)) || [];
  } catch {
    return [];
  }
}

export default function NotificationsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dismissed = loadDismissed();

  useEffect(() => {
    fetchAllMyNotifications(token)
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const reminders = items.filter((n) => n.type !== "platform");
  const announcements = items.filter((n) => n.type === "platform");

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">Notifications</p>
      <h1 className="mt-2 font-display text-3xl text-ink">Everything that needs you</h1>
      <p className="mt-3 max-w-lg text-ink/65">
        Reminders clear on their own once you've done the task. Announcements stay until an administrator removes them.
      </p>

      {error && <p className="mt-6 rounded-lg bg-bloom-200/60 px-3 py-2 text-sm text-bloom-600">{error}</p>}

      {loading ? (
        <p className="mt-10 text-sm text-ink/50">Loading...</p>
      ) : (
        <>
          <section className="mt-10">
            <h2 className="font-display text-lg text-ink">Reminders &amp; alerts</h2>
            {reminders.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-clay bg-white px-5 py-6 text-sm text-ink/50">
                You're all caught up.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {reminders.map((n) => (
                  <li key={n.id} className="flex items-start gap-3 rounded-2xl border border-clay bg-white px-5 py-4">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT_COLOR[n.severity] ?? DOT_COLOR.info}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{n.title}</p>
                      <p className="mt-0.5 text-sm text-ink/60">{n.message}</p>
                    </div>
                    {n.action_path && (
                      <Link
                        to={n.action_path}
                        className="focus-ring shrink-0 rounded-full border border-clinical-500 px-3.5 py-1.5 text-xs font-medium text-clinical-600 transition hover:bg-clinical-50"
                      >
                        Take me there
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-10">
            <h2 className="font-display text-lg text-ink">Announcements</h2>
            {announcements.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-clay bg-white px-5 py-6 text-sm text-ink/50">
                No announcements yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {announcements.map((n) => (
                  <li key={n.id} className="rounded-2xl border border-clay bg-white px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-ink">{n.title}</p>
                      {dismissed.includes(n.id) && (
                        <span className="shrink-0 rounded-full bg-mist px-2.5 py-0.5 text-xs text-ink/50">
                          Dismissed from bell
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-ink/60">{n.message}</p>
                    {n.created_at && (
                      <p className="mt-1.5 text-xs text-ink/40">{new Date(n.created_at).toLocaleString()}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}