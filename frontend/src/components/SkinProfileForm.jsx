import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchSkinProfile, saveSkinProfile } from "../api/client";

const SKIN_TYPES = ["oily", "dry", "combination", "normal", "sensitive"];
const AGE_GROUPS = ["teen", "20s", "30s", "40s", "50+"];
const SKIN_CONCERNS = [
  "acne", "hyperpigmentation", "dark_spots", "dry_skin", "oily_skin",
  "sensitive_skin", "wrinkles", "fine_lines", "redness", "uneven_skin_tone",
];

const EMPTY_FORM = {
  skin_type: "",
  age_group: "",
  skin_concerns: [],
  allergies: "",
  sensitivities: "",
};

function label(word) {
  return word.replace(/_/g, " ");
}

function toggleInList(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function SkinProfileForm() {
  const { token } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    fetchSkinProfile(token)
      .then((profile) => {
        setForm({
          skin_type: profile.skin_type || "",
          age_group: profile.age_group || "",
          skin_concerns: profile.skin_concerns || [],
          allergies: (profile.allergies || []).join(", "),
          sensitivities: (profile.sensitivities || []).join(", "),
        });
      })
      .catch((err) => {
        if (err.status !== 404) setError(err.message);
        // 404 just means no profile saved yet — keep the empty form
      })
      .finally(() => setLoading(false));
  }, [token]);

  function csvToList(value) {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        skin_type: form.skin_type || null,
        age_group: form.age_group || null,
        skin_concerns: form.skin_concerns,
        allergies: csvToList(form.allergies),
        sensitivities: csvToList(form.sensitivities),
      };
      await saveSkinProfile(token, payload);
      setSavedAt(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-ink/50">Loading your skin profile...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/80">Skin type</label>
          <select
            value={form.skin_type}
            onChange={(e) => setForm((f) => ({ ...f, skin_type: e.target.value }))}
            className="focus-ring w-full rounded-xl border border-clay bg-white px-4 py-2.5 text-ink"
          >
            <option value="">Select...</option>
            {SKIN_TYPES.map((t) => (
              <option key={t} value={t}>{label(t)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/80">Age group</label>
          <select
            value={form.age_group}
            onChange={(e) => setForm((f) => ({ ...f, age_group: e.target.value }))}
            className="focus-ring w-full rounded-xl border border-clay bg-white px-4 py-2.5 text-ink"
          >
            <option value="">Select...</option>
            {AGE_GROUPS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-ink/80">Skin concerns</span>
        <div className="flex flex-wrap gap-2">
          {SKIN_CONCERNS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setForm((f) => ({ ...f, skin_concerns: toggleInList(f.skin_concerns, c) }))}
              className={`focus-ring rounded-full border px-3 py-1.5 text-xs transition ${
                form.skin_concerns.includes(c)
                  ? "border-clinical-500 bg-clinical-50 text-clinical-700"
                  : "border-clay bg-white text-ink/60 hover:border-clinical-400"
              }`}
            >
              {label(c)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/80">Allergies</label>
          <input
            value={form.allergies}
            onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))}
            placeholder="comma-separated, e.g. fragrance, nuts"
            className="focus-ring w-full rounded-xl border border-clay bg-white px-4 py-2.5 text-ink"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/80">Sensitivities</label>
          <input
            value={form.sensitivities}
            onChange={(e) => setForm((f) => ({ ...f, sensitivities: e.target.value }))}
            placeholder="comma-separated, e.g. retinol, alcohol"
            className="focus-ring w-full rounded-xl border border-clay bg-white px-4 py-2.5 text-ink"
          />
        </div>
      </div>

      {error && <p className="rounded-lg bg-bloom-200/60 px-3 py-2 text-sm text-bloom-600">{error}</p>}
      {savedAt && !error && (
        <p className="text-sm text-clinical-600">Saved at {savedAt.toLocaleTimeString()}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="focus-ring rounded-full bg-clinical-500 px-6 py-2.5 font-medium text-white transition hover:bg-clinical-600 disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save skin profile"}
      </button>
    </form>
  );
}