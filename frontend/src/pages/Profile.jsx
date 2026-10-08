import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";

const CONCERN_OPTIONS = [
  "Acne",
  "Hyperpigmentation",
  "Dark Spots",
  "Dry Skin",
  "Oily Skin",
  "Sensitive Skin",
  "Wrinkles",
  "Fine Lines",
  "Redness",
  "Uneven Skin Tone",
];

const SKIN_TYPES = ["Oily", "Dry", "Combination", "Sensitive", "Normal"];
const AGE_GROUPS = ["Under 18", "18-24", "25-34", "35-44", "45-54", "55+"];
const SLEEP_HOURS = ["Less than 5", "5-6 hours", "6-7 hours", "7-8 hours", "8+ hours"];
const SLEEP_QUALITIES = ["Good", "Average", "Poor"];
const STRESS_LEVELS = ["Low", "Moderate", "High", "Very High"];
const EXERCISE_FREQUENCIES = ["Daily", "Weekly", "Sometimes", "Never"];
const WATER_LEVELS = ["High", "Moderate", "Low"];
const WATER_AMOUNTS = ["Less than 1L", "1-2 Liters", "2-3 Liters", "3+ Liters"];
const ENV_OPTIONS = [
  "High Sun Exposure",
  "High Pollution",
  "Indoor / AC",
  "Moderate / Balanced",
  "Dry Climate",
  "Humid Climate",
];

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    skin_type: "Combination",
    age_group: "18-24",
    skin_concerns: ["Acne", "Dark Spots"],
    allergies: "None",
    sensitivities: "None",
    sleep_hours: "7-8 hours",
    sleep_quality: "Average",
    stress_level: "Moderate",
    exercise_frequency: "Weekly",
    water_intake_level: "Moderate",
    average_water_intake: "1-2 Liters",
    environmental_exposure: "Moderate / Balanced",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!token) {
      navigate("/login");
      return;
    }

    if (storedUser) setUser(JSON.parse(storedUser));

    fetchProfile();
  }, [navigate]);

  const fetchProfile = () => {
    setLoading(true);
    axios
      .get("http://127.0.0.1:5000/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data.profile || res.data;
        if (data && data.skin_type) {
          setProfile(data);
          // populate form
          let concernsArray = [];
          if (Array.isArray(data.skin_concerns)) {
            concernsArray = data.skin_concerns;
          } else if (typeof data.skin_concerns === "string" && data.skin_concerns) {
            concernsArray = data.skin_concerns.split(",").map((s) => s.trim()).filter(Boolean);
          }

          setFormData({
            skin_type: data.skin_type || "Combination",
            age_group: data.age_group || "18-24",
            skin_concerns: concernsArray.length > 0 ? concernsArray : ["Acne"],
            allergies: data.allergies || "None",
            sensitivities: data.sensitivities || "None",
            sleep_hours: data.sleep_hours || "7-8 hours",
            sleep_quality: data.sleep_quality || "Average",
            stress_level: data.stress_level || "Moderate",
            exercise_frequency: data.exercise_frequency || "Weekly",
            water_intake_level: data.water_intake_level || "Moderate",
            average_water_intake: data.average_water_intake || "1-2 Liters",
            environmental_exposure: data.environmental_exposure || "Moderate / Balanced",
          });
        } else {
          // No profile yet, show edit form by default
          setIsEditing(true);
        }
      })
      .catch(() => {
        setIsEditing(true);
      })
      .finally(() => setLoading(false));
  };

  const toggleConcern = (concern) => {
    setFormData((prev) => {
      const exists = prev.skin_concerns.includes(concern);
      const updated = exists
        ? prev.skin_concerns.filter((c) => c !== concern)
        : [...prev.skin_concerns, concern];
      return { ...prev, skin_concerns: updated };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setErrorMsg("");

    try {
      const payload = {
        ...formData,
        skin_concerns: formData.skin_concerns.join(", "),
      };

      await axios.post("http://127.0.0.1:5000/profile", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage("Profile saved successfully! AI models updated.");
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to save profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to safely read values
  const val = (key, fallback = "—") => {
    if (!profile) return fallback;
    return profile[key] || fallback;
  };

  const concernsList = () => {
    const raw = profile?.skin_concerns || "";
    if (Array.isArray(raw)) return raw;
    return String(raw)
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
  };

  return (
    <Layout>
      <div style={{ maxWidth: 860, margin: "0 auto", paddingBottom: 60 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.8rem", color: "#1b4332", fontWeight: 700 }}>
              Skin Profile & Assessment
            </h1>
            <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: 14 }}>
              This record drives your personalized AI skin health score, routines, and product matching.
            </p>
          </div>
          {!isEditing && profile && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                background: "#2d6a4f",
                color: "white",
                border: "none",
                padding: "9px 18px",
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              ✎ Edit Profile
            </button>
          )}
        </div>

        {message && (
          <div style={{ background: "#d1fae5", color: "#065f46", padding: 14, borderRadius: 10, marginBottom: 20 }}>
            {message}{" "}
            <Link to="/assessment" style={{ fontWeight: 700, color: "#065f46", textDecoration: "underline", marginLeft: 8 }}>
              View Skin Analysis →
            </Link>
          </div>
        )}

        {errorMsg && (
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: 14, borderRadius: 10, marginBottom: 20 }}>
            {errorMsg}
          </div>
        )}

        {loading ? (
          <p style={{ color: "#6b7280" }}>Loading skin profile...</p>
        ) : isEditing ? (
          /* ==================== EDIT / QUESTIONNAIRE FORM ==================== */
          <form onSubmit={handleSave} style={formCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", paddingBottom: 14, marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: "#1b4332" }}>
                {profile ? "Update Skin Profile" : "Create Your Skin Profile"}
              </h2>
              {profile && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14 }}
                >
                  Cancel
                </button>
              )}
            </div>

            {/* 1. Skin Type & Age */}
            <div style={grid2}>
              <div>
                <label style={label}>Skin Type *</label>
                <select
                  value={formData.skin_type}
                  onChange={(e) => setFormData({ ...formData, skin_type: e.target.value })}
                  style={input}
                >
                  {SKIN_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={label}>Age Group *</label>
                <select
                  value={formData.age_group}
                  onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
                  style={input}
                >
                  {AGE_GROUPS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Skin Concerns (Multi-Select) */}
            <div style={{ marginTop: 20 }}>
              <label style={label}>Skin Concerns (Select all that apply) *</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
                {CONCERN_OPTIONS.map((c) => {
                  const selected = formData.skin_concerns.includes(c);
                  return (
                    <button
                      type="button"
                      key={c}
                      onClick={() => toggleConcern(c)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        border: selected ? "1.5px solid #2d6a4f" : "1px solid #d1d5db",
                        background: selected ? "#e8f5e9" : "white",
                        color: selected ? "#1b4332" : "#4b5563",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {selected ? "✓ " : "+ "}
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Allergies & Sensitivities */}
            <div style={{ ...grid2, marginTop: 22 }}>
              <div>
                <label style={label}>Known Allergies (or type 'None')</label>
                <input
                  type="text"
                  placeholder="e.g. Fragrance, Parabens, Nuts, None"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  style={input}
                />
              </div>

              <div>
                <label style={label}>Sensitivities / Skin Reactivity</label>
                <input
                  type="text"
                  placeholder="e.g. Easily irritated, Stings with active acids, None"
                  value={formData.sensitivities}
                  onChange={(e) => setFormData({ ...formData, sensitivities: e.target.value })}
                  style={input}
                />
              </div>
            </div>

            {/* 4. Sleep & Lifestyle */}
            <div style={{ ...grid2, marginTop: 22 }}>
              <div>
                <label style={label}>Sleep Duration</label>
                <select
                  value={formData.sleep_hours}
                  onChange={(e) => setFormData({ ...formData, sleep_hours: e.target.value })}
                  style={input}
                >
                  {SLEEP_HOURS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={label}>Sleep Quality</label>
                <select
                  value={formData.sleep_quality}
                  onChange={(e) => setFormData({ ...formData, sleep_quality: e.target.value })}
                  style={input}
                >
                  {SLEEP_QUALITIES.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ ...grid2, marginTop: 22 }}>
              <div>
                <label style={label}>Daily Stress Level</label>
                <select
                  value={formData.stress_level}
                  onChange={(e) => setFormData({ ...formData, stress_level: e.target.value })}
                  style={input}
                >
                  {STRESS_LEVELS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={label}>Exercise Frequency</label>
                <select
                  value={formData.exercise_frequency}
                  onChange={(e) => setFormData({ ...formData, exercise_frequency: e.target.value })}
                  style={input}
                >
                  {EXERCISE_FREQUENCIES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 5. Hydration & Environmental */}
            <div style={{ ...grid2, marginTop: 22 }}>
              <div>
                <label style={label}>Daily Water Intake Level</label>
                <select
                  value={formData.water_intake_level}
                  onChange={(e) => setFormData({ ...formData, water_intake_level: e.target.value })}
                  style={input}
                >
                  {WATER_LEVELS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={label}>Average Water Intake (Litres)</label>
                <select
                  value={formData.average_water_intake}
                  onChange={(e) => setFormData({ ...formData, average_water_intake: e.target.value })}
                  style={input}
                >
                  {WATER_AMOUNTS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 22 }}>
              <label style={label}>Primary Environmental Exposure</label>
              <select
                value={formData.environmental_exposure}
                onChange={(e) => setFormData({ ...formData, environmental_exposure: e.target.value })}
                style={input}
              >
                {ENV_OPTIONS.map((env) => (
                  <option key={env} value={env}>{env}</option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: 32, display: "flex", gap: 14 }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: 1,
                  background: "#1b4332",
                  color: "white",
                  padding: "13px",
                  borderRadius: 12,
                  border: "none",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Analyzing & Saving..." : "Save Profile & Run AI Assessment"}
              </button>
            </div>
          </form>
        ) : (
          /* ==================== PROFILE VIEW ==================== */
          <div style={formCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#1b4332", fontWeight: 700 }}>
                  {user?.name || "User"}
                </h2>
                <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
                  {user?.email || ""} • Role: <strong style={{ textTransform: "capitalize" }}>{user?.role || "user"}</strong>
                </p>
              </div>
              <span
                style={{
                  background: "#1b4332",
                  color: "white",
                  padding: "6px 16px",
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {val("skin_type")} Skin
              </span>
            </div>

            {/* Concerns */}
            <div style={{ marginBottom: 24 }}>
              <p style={detailLabel}>TARGET SKIN CONCERNS</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {concernsList().length > 0 ? (
                  concernsList().map((c, i) => (
                    <span
                      key={i}
                      style={{
                        background: "#e8f5e9",
                        color: "#1b4332",
                        padding: "6px 14px",
                        borderRadius: 16,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {c}
                    </span>
                  ))
                ) : (
                  <span style={{ color: "#9ca3af", fontSize: 14 }}>No specific concerns listed</span>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div style={grid2}>
              <div style={detailItem}>
                <p style={detailLabel}>AGE GROUP</p>
                <p style={detailValue}>{val("age_group")}</p>
              </div>
              <div style={detailItem}>
                <p style={detailLabel}>SENSITIVITIES</p>
                <p style={detailValue}>{val("sensitivities", "None")}</p>
              </div>
              <div style={detailItem}>
                <p style={detailLabel}>SLEEP PROFILE</p>
                <p style={detailValue}>{val("sleep_hours")} ({val("sleep_quality")} quality)</p>
              </div>
              <div style={detailItem}>
                <p style={detailLabel}>STRESS LEVEL</p>
                <p style={detailValue}>{val("stress_level")}</p>
              </div>
              <div style={detailItem}>
                <p style={detailLabel}>EXERCISE FREQUENCY</p>
                <p style={detailValue}>{val("exercise_frequency")}</p>
              </div>
              <div style={detailItem}>
                <p style={detailLabel}>HYDRATION</p>
                <p style={detailValue}>{val("water_intake_level")} ({val("average_water_intake")})</p>
              </div>
              <div style={detailItem}>
                <p style={detailLabel}>ENVIRONMENT</p>
                <p style={detailValue}>{val("environmental_exposure")}</p>
              </div>
              <div style={detailItem}>
                <p style={detailLabel}>ALLERGIES</p>
                <p style={detailValue}>{val("allergies", "None")}</p>
              </div>
            </div>

            {/* Quick Action Navigation */}
            <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid #edf2f0", display: "flex", gap: 14 }}>
              <Link
                to="/assessment"
                style={{
                  flex: 1,
                  textAlign: "center",
                  background: "#2d6a4f",
                  color: "white",
                  padding: "12px",
                  borderRadius: 10,
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                🔬 View AI Skin Assessment
              </Link>
              <Link
                to="/products"
                style={{
                  flex: 1,
                  textAlign: "center",
                  background: "#e8f5e9",
                  color: "#1b4332",
                  padding: "12px",
                  borderRadius: 10,
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                🛍️ View Product Matches
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

const formCard = {
  background: "white",
  borderRadius: 18,
  padding: "28px 32px",
  boxShadow: "0 4px 20px rgba(27,67,50,0.06)",
  border: "1px solid #edf5f0",
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "18px 24px",
};

const label = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 6,
};

const input = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  background: "#f9fafb",
};

const detailItem = {
  borderTop: "1px solid #edf2f0",
  paddingTop: 12,
};

const detailLabel = {
  margin: 0,
  fontSize: 11,
  fontWeight: 700,
  color: "#6b7280",
  letterSpacing: "0.04em",
};

const detailValue = {
  margin: "4px 0 0",
  fontSize: 14.5,
  color: "#1b4332",
  fontWeight: 600,
};

export default Profile;