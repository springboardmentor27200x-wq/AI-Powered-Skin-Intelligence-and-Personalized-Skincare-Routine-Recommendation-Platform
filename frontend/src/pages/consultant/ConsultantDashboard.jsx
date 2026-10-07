import { useEffect, useState } from "react";
import { listClients, getProfileByUser } from "../../services/api";

export default function ConsultantDashboard() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    listClients()
      .then((r) => setClients(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const viewProfile = async (userId) => {
    if (selected === userId) {
      setSelected(null);
      setProfile(null);
      return;
    }
    setSelected(userId);
    setProfile(null);
    setProfileLoading(true);
    try {
      const r = await getProfileByUser(userId);
      setProfile(r.data);
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const parseList = (val) => {
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val || "[]"); } catch { return []; }
  };

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Quick stats
  const totalClients = clients.length;

  return (
    <section>
      <p className="eyebrow">Client Management</p>
      <h1 style={{ marginBottom: 8 }}>Consultant Dashboard</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
        View and manage client skin profiles, assessments, and recommendations.
      </p>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { icon: "👥", label: "Total Clients", value: totalClients, color: "#7c3aed" },
          { icon: "🧴", label: "With Profiles", value: clients.length, color: "#10b981" },
          { icon: "📊", label: "Assessments", value: "—", color: "#f59e0b" },
          { icon: "✨", label: "Active Routines", value: "—", color: "#6366f1" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="card stat"
            style={{ textAlign: "center", padding: "18px 14px", borderTop: `4px solid ${stat.color}` }}
          >
            <div style={{ fontSize: "1.8rem", marginBottom: 4 }}>{stat.icon}</div>
            <strong style={{ fontSize: "1.5rem", color: stat.color }}>{stat.value}</strong>
            <span style={{ display: "block", fontSize: "0.8rem", color: "#6b7280", marginTop: 4 }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="🔍 Search clients by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            maxWidth: 420,
            padding: "10px 16px",
            borderRadius: 10,
            border: "2px solid #e5e7eb",
            fontSize: "0.9rem",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>Loading clients…</div>
      ) : filtered.length === 0 ? (
        <div className="card empty">
          <h3>{searchTerm ? "No matching clients" : "No clients yet"}</h3>
          <p>{searchTerm ? "Try a different search term." : "Users who complete their skin profiles will appear here."}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {filtered.map((c) => (
            <div key={c.id}>
              <div
                className="card"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  cursor: "pointer",
                  borderLeft: selected === c.id ? "4px solid #7c3aed" : "4px solid transparent",
                  background: selected === c.id ? "#faf5ff" : "white",
                  transition: "all 0.2s",
                }}
                onClick={() => viewProfile(c.id)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                    color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "1.1rem", flexShrink: 0,
                  }}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 600, color: "#1f2937" }}>{c.name}</h4>
                    <p style={{ margin: "2px 0 0", color: "#6b7280", fontSize: "0.85rem" }}>
                      {c.email} · Age {c.age} · {c.gender}
                    </p>
                  </div>
                </div>
                <button
                  className={selected === c.id ? "secondary" : "primary"}
                  style={{ padding: "8px 16px", fontSize: 13 }}
                  onClick={(e) => { e.stopPropagation(); viewProfile(c.id); }}
                >
                  {selected === c.id ? "Hide Profile" : "View Profile"}
                </button>
              </div>

              {selected === c.id && (
                <div className="card" style={{ marginTop: 4, marginLeft: 16, borderLeft: "4px solid #7c3aed", padding: "20px 24px" }}>
                  {profileLoading ? (
                    <p style={{ color: "var(--text-muted)" }}>Loading profile…</p>
                  ) : profile ? (
                    <>
                      {/* Grid of profile data */}
                      <div className="grid" style={{ marginBottom: 20 }}>
                        {[
                          ["🧴 Skin Type", profile.skin_type],
                          ["📅 Age Group", profile.age_group],
                          ["😴 Sleep Quality", profile.sleep_quality],
                          ["💧 Water Intake", `${profile.water_intake} L/day`],
                          ["☀️ Sun Exposure", profile.sun_exposure || "–"],
                          ["🏭 Pollution", profile.pollution_exposure || "–"],
                          ["🌤️ Climate", profile.climate_type || "–"],
                          ["📍 UV Index", profile.uv_index_exposure || "–"],
                          ["🌍 Region", profile.region || "–"],
                        ].map(([k, v]) => (
                          <div className="stat" key={k}>
                            <span>{k}</span>
                            <strong>{v}</strong>
                          </div>
                        ))}
                      </div>

                      {/* Concerns */}
                      {(profile.skin_concerns || []).length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <h5 style={{ fontWeight: 600, color: "#374151", marginBottom: 8 }}>⚠️ Skin Concerns</h5>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {parseList(profile.skin_concerns).map((concern) => (
                              <span key={concern} style={{
                                background: "#fee2e2", color: "#991b1b", borderRadius: 20,
                                padding: "4px 12px", fontSize: "0.82rem", fontWeight: 500,
                              }}>
                                {concern}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Allergies */}
                      {profile.allergies && (
                        <div style={{ marginBottom: 16 }}>
                          <h5 style={{ fontWeight: 600, color: "#374151", marginBottom: 8 }}>🚫 Allergies</h5>
                          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>{profile.allergies}</p>
                        </div>
                      )}

                      {/* Sensitivities */}
                      {profile.sensitivities && (
                        <div>
                          <h5 style={{ fontWeight: 600, color: "#374151", marginBottom: 8 }}>⚡ Sensitivities</h5>
                          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>{profile.sensitivities}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ textAlign: "center", padding: 20, color: "#9ca3af" }}>
                      <p>😔 Profile data unavailable. The client hasn't completed their skin profile yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
