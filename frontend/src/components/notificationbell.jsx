import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchMyNotifications } from "../api/client";

const DISMISSED_KEY = "dismissed_announcements";
const REFRESH_MS = 60000;

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

export default function NotificationBell() {
  const { token } = useAuth();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(loadDismissed);
  const wrapperRef = useRef(null);

  const load = useCallback(() => {
    if (!token) return;
    fetchMyNotifications(token)
      .then(setItems)
      .catch(() => {});
  }, [token]);

  // Refresh whenever the user navigates, and once a minute while the app is open.
  useEffect(() => {
    load();
    setOpen(false);
  }, [load, location.pathname]);

  useEffect(() => {
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  // Close the panel when clicking anywhere outside it.
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) load();
  }

  function dismiss(id) {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
  }

  const visible = items.filter((n) => !dismissed.includes(n.id));

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={visible.length ? `Notifications, ${visible.length} new` : "Notifications"}
        aria-expanded={open}
        className="focus-ring relative rounded-full p-2 text-ink/70 transition hover:bg-clinical-50 hover:text-ink"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {visible.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-clinical-500 px-1 text-[10px] font-medium text-white">
            {visible.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-2xl border border-clay bg-white shadow-lg">
          <div className="border-b border-clay/60 px-4 py-3">
            <p className="font-display text-base text-ink">Notifications</p>
          </div>

          {visible.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-ink/50">You're all caught up.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {visible.map((n) => (
                <li key={n.id} className="border-b border-clay/50 last:border-0">
                  <div className="flex gap-3 px-4 py-3">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT_COLOR[n.severity] ?? DOT_COLOR.info}`}
                    />
                    <div className="min-w-0 flex-1 whitespace-normal">
                      <p className="text-sm font-medium text-ink">{n.title}</p>
                      <p className="mt-0.5 text-xs text-ink/60">{n.message}</p>
                      {n.action_path && (
                        <Link
                          to={n.action_path}
                          onClick={() => setOpen(false)}
                          className="mt-1.5 inline-block text-xs font-medium text-clinical-600 hover:underline"
                        >
                          Take me there →
                        </Link>
                      )}
                    </div>
                    {n.type === "platform" && (
                      <button
                        type="button"
                        onClick={() => dismiss(n.id)}
                        aria-label="Dismiss announcement"
                        className="shrink-0 self-start text-lg leading-none text-ink/40 hover:text-ink"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-clay/60 px-4 py-2.5 text-center">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-clinical-600 hover:underline"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}