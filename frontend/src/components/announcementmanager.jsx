import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchAnnouncements, createAnnouncement, deleteAnnouncement } from "../api/client";

export default function AnnouncementManager() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnnouncements(token)
      .then(setItems)
      .catch((err) => setError(err.message));
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const created = await createAnnouncement(token, { title, message });
      setItems((list) => [created, ...list]);
      setTitle("");
      setMessage("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    setError("");
    try {
      await deleteAnnouncement(token, id);
      setItems((list) => list.filter((a) => a.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2 className="font-display text-lg text-ink">Platform announcements</h2>
      <p className="mt-1 text-sm text-ink/60">
        Anything you publish appears in every user's notification bell until you remove it.
      </p>

      {error && <p className="mt-4 rounded-lg bg-bloom-200/60 px-3 py-2 text-sm text-bloom-600">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-2xl border border-clay bg-white p-5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          required
          placeholder="Title"
          className="focus-ring w-full rounded-xl border border-clay bg-white px-4 py-2.5 text-ink"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={1000}
          required
          rows={2}
          placeholder="Message"
          className="focus-ring w-full rounded-xl border border-clay bg-white px-4 py-2.5 text-ink"
        />
        <button
          type="submit"
          disabled={busy}
          className="focus-ring rounded-full bg-clinical-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-clinical-600 disabled:opacity-60"
        >
          {busy ? "Publishing..." : "Publish announcement"}
        </button>
      </form>

      {items.length > 0 && (
        <ul className="mt-4 space-y-2">
          {items.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-4 rounded-xl border border-clay bg-white px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{a.title}</p>
                <p className="mt-0.5 text-xs text-ink/60">{a.message}</p>
                <p className="mt-1 text-xs text-ink/40">{new Date(a.created_at).toLocaleString()}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(a.id)}
                className="focus-ring shrink-0 rounded-full border border-clay px-3 py-1 text-xs text-ink/70 transition hover:border-bloom-600 hover:text-bloom-600"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}