import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchClients, fetchClientDetail, fetchClientNotes, addClientNote } from "../api/client";

function scoreColor(score) {
  if (score == null) return "text-ink/40";
  if (score >= 80) return "text-clinical-600";
  if (score >= 50) return "text-bloom-600";
  return "text-bloom-600";
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const LABEL_SETS = {
  skincare_consultant: {
    rosterTitle: "Client profiles",
    assessmentTitle: "Skin assessment reports",
    historyTitle: "Progress monitoring",
    routineTitle: "Recommendation management",
    notesTitle: "Recommendation notes",
    notesPlaceholder: "e.g. Suggested switching to a gentler cleanser, follow up in 2 weeks...",
    notesEmpty: "No recommendation notes yet.",
    addButton: "Add recommendation note",
  },
  dermatologist: {
    rosterTitle: "Patient insights",
    assessmentTitle: "Skin condition reports",
    historyTitle: "Progress analytics",
    routineTitle: "Treatment recommendations",
    notesTitle: "Treatment notes",
    notesPlaceholder: "e.g. Prescribed topical retinoid, monitor for irritation...",
    notesEmpty: "No treatment notes yet.",
    addButton: "Add treatment note",
  },
};

export default function ClientRoster({ role }) {
  const { token, user } = useAuth();
  const labels = LABEL_SETS[role] || LABEL_SETS.skincare_consultant;

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    fetchClients(token)
      .then(setClients)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadNotes(clientId) {
    setNotesLoading(true);
    try {
      const result = await fetchClientNotes(token, clientId);
      setNotes(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setNotesLoading(false);
    }
  }

  async function selectClient(id) {
    if (selectedId === id) {
      setSelectedId(null);
      setDetail(null);
      setNotes([]);
      return;
    }
    setSelectedId(id);
    setDetail(null);
    setNotes([]);
    setNoteContent("");
    setDetailLoading(true);
    try {
      const result = await fetchClientDetail(token, id);
      setDetail(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
    loadNotes(id);
  }

  async function handleAddNote(e) {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setSubmittingNote(true);
    setError("");
    try {
      await addClientNote(token, selectedId, noteContent.trim());
      setNoteContent("");
      await loadNotes(selectedId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingNote(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-ink/50">Loading...</p>;
  }

  if (error) {
    return <p className="rounded-lg bg-bloom-200/60 px-3 py-2 text-sm text-bloom-600">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-clay bg-white p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">{labels.rosterTitle}</p>
        <p className="mt-2 text-sm text-ink/60">{clients.length} user{clients.length === 1 ? "" : "s"} on the platform.</p>

        {clients.length === 0 ? (
          <p className="mt-4 text-sm text-ink/50">No users yet.</p>
        ) : (
          <div className="mt-5 space-y-2">
            {clients.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => selectClient(c.id)}
                className={`focus-ring flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition ${
                  selectedId === c.id ? "border-clinical-500 bg-clinical-50" : "border-clay bg-white hover:border-clinical-400"
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-ink">{c.full_name}</p>
                  <p className="text-xs text-ink/50">{c.email} {c.skin_type && `· ${c.skin_type} skin`}</p>
                </div>
                <span className={`font-display text-xl font-bold ${scoreColor(c.latest_score)}`}>
                  {c.latest_score ?? "—"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedId && (
        <div className="space-y-6">
          {detailLoading ? (
            <p className="text-sm text-ink/50">Loading details...</p>
          ) : detail ? (
            <>
              <div className="rounded-2xl border border-clay bg-white p-6">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">{labels.assessmentTitle}</p>
                <h3 className="mt-2 font-display text-xl text-ink">{detail.full_name}</h3>
                <p className="text-sm text-ink/50">
                  {detail.skin_type} skin · {detail.age_group} ·{" "}
                  {detail.skin_concerns.join(", ") || "no stated concerns"}
                </p>

                {detail.latest_assessment ? (
                  <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-start">
                    <div className="shrink-0">
                      <p className={`font-display text-5xl font-bold ${scoreColor(detail.latest_assessment.score)}`}>
                        {detail.latest_assessment.score}
                      </p>
                      <p className="text-xs uppercase tracking-wide text-ink/40">out of 100</p>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Priority concerns</p>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {detail.latest_assessment.prioritized_concerns.map((c) => (
                            <span key={c} className="rounded-full border border-clay bg-mist px-3 py-1 text-xs text-ink">{c}</span>
                          ))}
                        </div>
                      </div>
                      {detail.latest_assessment.risk_factors.length > 0 && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Risk factors</p>
                          <div className="mt-1 space-y-1">
                            {detail.latest_assessment.risk_factors.map((r, i) => (
                              <p key={i} className="text-sm text-ink/70">• {r}</p>
                            ))}
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-ink/40">Last run {formatDate(detail.latest_assessment.created_at)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-ink/60">No assessment on file yet.</p>
                )}
              </div>

              <div className="rounded-2xl border border-clay bg-white p-6">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">{labels.historyTitle}</p>
                {detail.assessment_history.length === 0 ? (
                  <p className="mt-4 text-sm text-ink/60">No history yet.</p>
                ) : (
                  <div className="mt-5 flex items-end gap-2" style={{ height: "100px" }}>
                    {[...detail.assessment_history].reverse().map((a, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                        <div
                          className="w-full rounded-t-md bg-clinical-500"
                          style={{ height: `${Math.max(a.score, 4)}%` }}
                          title={`${a.score}/100`}
                        />
                        <span className="text-[9px] text-ink/40">{formatDate(a.created_at).split(",")[0]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-clay bg-white p-6">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">{labels.routineTitle}</p>
                {detail.current_routine ? (
                  <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <h4 className="mb-2 font-display text-sm text-ink">Morning</h4>
                      <ul className="space-y-1.5">
                        {detail.current_routine.morning.map((s, i) => (
                          <li key={i} className="text-sm text-ink/70">
                            <span className="font-medium text-ink">{s.category.replace(/_/g, " ")}:</span> {s.instruction}
                            {s.frequency !== "daily" && <span className="ml-1 text-xs text-bloom-600">({s.frequency.replace("_", "/")})</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="mb-2 font-display text-sm text-ink">Evening</h4>
                      <ul className="space-y-1.5">
                        {detail.current_routine.evening.map((s, i) => (
                          <li key={i} className="text-sm text-ink/70">
                            <span className="font-medium text-ink">{s.category.replace(/_/g, " ")}:</span> {s.instruction}
                            {s.frequency !== "daily" && <span className="ml-1 text-xs text-bloom-600">({s.frequency.replace("_", "/")})</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-ink/60">No routine generated yet.</p>
                )}
              </div>

              <div className="rounded-2xl border border-clay bg-white p-6">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">{labels.notesTitle}</p>
                <p className="mt-1 text-xs text-ink/40">Only visible to {role === "dermatologist" ? "dermatologists" : "consultants"} — the other role keeps its own separate notes.</p>

                {notesLoading ? (
                  <p className="mt-4 text-sm text-ink/50">Loading notes...</p>
                ) : notes.length === 0 ? (
                  <p className="mt-4 text-sm text-ink/60">{labels.notesEmpty}</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {notes.map((n) => (
                      <div key={n.id} className="rounded-xl bg-mist p-3.5">
                        <p className="text-sm text-ink">{n.content}</p>
                        <p className="mt-1.5 text-xs text-ink/40">
                          {n.author_name}{n.author_id === user.id ? " (you)" : ""} · {formatDateTime(n.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleAddNote} className="mt-5 space-y-3">
                  <textarea
                    rows={3}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder={labels.notesPlaceholder}
                    className="focus-ring w-full rounded-xl border border-clay bg-white px-4 py-2.5 text-sm text-ink"
                  />
                  <button
                    type="submit"
                    disabled={submittingNote || !noteContent.trim()}
                    className="focus-ring rounded-full bg-clinical-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-clinical-600 disabled:opacity-50"
                  >
                    {submittingNote ? "Saving..." : labels.addButton}
                  </button>
                </form>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}