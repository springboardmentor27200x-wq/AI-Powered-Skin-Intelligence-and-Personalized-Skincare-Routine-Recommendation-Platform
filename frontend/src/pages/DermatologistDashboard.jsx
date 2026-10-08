import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";

function DermatologistDashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetail, setPatientDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [routineNote, setRoutineNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteMsg, setNoteMsg] = useState("");

  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchPatients();
  }, [navigate]);

  const fetchPatients = () => {
    setLoading(true);
    axios
      .get("http://127.0.0.1:5000/api/doctor/patients", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setPatients(res.data.patients || []);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load patient records. Doctor/Consultant access required.");
      })
      .finally(() => setLoading(false));
  };

  const openPatient = (patient) => {
    setSelectedPatient(patient);
    setDetailLoading(true);
    setNoteMsg("");
    setNoteText("");
    setRoutineNote("");

    axios
      .get(`http://127.0.0.1:5000/api/doctor/patient/${patient.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setPatientDetail(res.data);
      })
      .catch(() => {
        alert("Failed to load patient clinical detail.");
      })
      .finally(() => setDetailLoading(false));
  };

  const submitNote = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setSavingNote(true);
    axios
      .post(
        `http://127.0.0.1:5000/api/doctor/patient/${selectedPatient.id}/note`,
        { notes: noteText, routine_adjustment: routineNote },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setNoteMsg("Clinical note & recommendation saved!");
        setNoteText("");
        setRoutineNote("");
        // refresh detail
        openPatient(selectedPatient);
      })
      .catch(() => {
        alert("Failed to save clinical note.");
      })
      .finally(() => setSavingNote(false));
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      (p.skin_type || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div style={{ maxWidth: 1040, margin: "0 auto", paddingBottom: 60 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }}>🩺</span>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1b4332", margin: 0 }}>
                {user?.role === "consultant" ? "Skincare Consultant Portal" : "Dermatologist Clinical Portal"}
              </h1>
            </div>
            <p style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>
              Review patient assessments, monitor score trends, and provide clinical treatment adjustments.
            </p>
          </div>

          <span
            style={{
              background: "#d8f3dc",
              color: "#1b4332",
              padding: "6px 16px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Role: {user?.role || "Dermatologist"}
          </span>
        </div>

        {error ? (
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 14, padding: 24, textAlign: "center" }}>
            <h3 style={{ color: "#991b1b", margin: "0 0 8px" }}>Access Restricted</h3>
            <p style={{ color: "#7f1d1d", fontSize: 14, margin: "0 0 16px" }}>{error}</p>
            <p style={{ fontSize: 13, color: "#6b7280" }}>
              Only users registered or assigned as <strong>Dermatologist</strong>, <strong>Consultant</strong>, or <strong>Admin</strong> can access this portal.
            </p>
            <Link
              to="/dashboard"
              style={{
                display: "inline-block",
                marginTop: 12,
                background: "#1b4332",
                color: "white",
                padding: "8px 18px",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Return to User Dashboard
            </Link>
          </div>
        ) : (
          <>
            {/* Quick Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
              <div style={statBox}>
                <div style={statLabel}>Total Patients / Clients</div>
                <div style={statNum}>{patients.length}</div>
              </div>
              <div style={statBox}>
                <div style={statLabel}>Completed Profiles</div>
                <div style={statNum}>{patients.filter((p) => p.has_profile).length}</div>
              </div>
              <div style={statBox}>
                <div style={statLabel}>With AI Score History</div>
                <div style={statNum}>{patients.filter((p) => p.latest_score != null).length}</div>
              </div>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: 20 }}>
              <input
                type="text"
                placeholder="Search patients by name, email, or skin type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                  background: "white",
                }}
              />
            </div>

            {/* Patient Grid / Table */}
            {loading ? (
              <p style={{ color: "#6b7280" }}>Loading patients...</p>
            ) : filteredPatients.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", background: "white", borderRadius: 16 }}>
                <p style={{ color: "#6b7280" }}>No matching patients found.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18 }}>
                {filteredPatients.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      background: "white",
                      borderRadius: 16,
                      padding: 20,
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 16, color: "#1b4332", fontWeight: 700 }}>{p.name}</h3>
                          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>{p.email}</p>
                        </div>
                        {p.latest_score != null ? (
                          <span
                            style={{
                              background: "#e8f5e9",
                              color: "#166534",
                              fontWeight: 700,
                              fontSize: 14,
                              padding: "4px 10px",
                              borderRadius: 14,
                            }}
                          >
                            Score: {p.latest_score}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: "#9ca3af" }}>No Score</span>
                        )}
                      </div>

                      <div style={{ margin: "12px 0", fontSize: 13 }}>
                        <div style={{ marginBottom: 4 }}>
                          <span style={{ color: "#6b7280" }}>Skin Type:</span>{" "}
                          <strong>{p.skin_type}</strong>
                        </div>
                        <div>
                          <span style={{ color: "#6b7280" }}>Concerns:</span>{" "}
                          <span style={{ color: "#374151" }}>{p.skin_concerns}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => openPatient(p)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: 10,
                        border: "none",
                        background: "#2d6a4f",
                        color: "white",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        marginTop: 10,
                      }}
                    >
                      View Clinical Chart & Prescribe →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Patient Clinical Chart Modal ── */}
        {selectedPatient && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
              padding: 20,
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: 20,
                maxWidth: 720,
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: 30,
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              }}
            >
              {/* Modal Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", paddingBottom: 16, marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: 0, color: "#1b4332", fontSize: 20 }}>
                    Clinical File: {selectedPatient.name}
                  </h2>
                  <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
                    {selectedPatient.email}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  style={{ background: "none", border: "none", fontSize: 22, color: "#6b7280", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>

              {detailLoading ? (
                <p style={{ color: "#6b7280" }}>Loading clinical history...</p>
              ) : patientDetail ? (
                <div>
                  {/* Skin Profile Summary */}
                  <div style={{ background: "#f8faf9", borderRadius: 14, padding: 18, marginBottom: 20 }}>
                    <h4 style={{ margin: "0 0 12px", color: "#1b4332", fontSize: 15 }}>Skin & Lifestyle Profile</h4>
                    {patientDetail.profile ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
                        <div><strong>Skin Type:</strong> {patientDetail.profile.skin_type}</div>
                        <div><strong>Age Group:</strong> {patientDetail.profile.age_group}</div>
                        <div><strong>Concerns:</strong> {patientDetail.profile.skin_concerns}</div>
                        <div><strong>Allergies:</strong> {patientDetail.profile.allergies}</div>
                        <div><strong>Sensitivities:</strong> {patientDetail.profile.sensitivities}</div>
                        <div><strong>Sleep:</strong> {patientDetail.profile.sleep_hours} ({patientDetail.profile.sleep_quality})</div>
                        <div><strong>Stress:</strong> {patientDetail.profile.stress_level}</div>
                        <div><strong>Hydration:</strong> {patientDetail.profile.water_intake_level}</div>
                        <div><strong>Environment:</strong> {patientDetail.profile.environmental_exposure}</div>
                      </div>
                    ) : (
                      <p style={{ color: "#6b7280", margin: 0, fontSize: 13 }}>Patient has not completed their skin profile questionnaire yet.</p>
                    )}
                  </div>

                  {/* Score History */}
                  <div style={{ marginBottom: 20 }}>
                    <h4 style={{ margin: "0 0 10px", color: "#1b4332", fontSize: 15 }}>Recent Skin Score History</h4>
                    {patientDetail.score_history?.length > 0 ? (
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {patientDetail.score_history.slice(0, 7).map((h, idx) => (
                          <div key={idx} style={{ background: "#e8f5e9", padding: "8px 12px", borderRadius: 10, fontSize: 12 }}>
                            <div style={{ fontWeight: 700, color: "#166534" }}>{h.score}/100</div>
                            <div style={{ color: "#6b7280" }}>{h.date}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: "#6b7280", fontSize: 13 }}>No score history available.</p>
                    )}
                  </div>

                  {/* Doctor Notes Form */}
                  <form onSubmit={submitNote} style={{ borderTop: "1px solid #e5e7eb", paddingTop: 18 }}>
                    <h4 style={{ margin: "0 0 10px", color: "#1b4332", fontSize: 15 }}>
                      Add Clinical Recommendation / Treatment Note
                    </h4>
                    {noteMsg && (
                      <div style={{ background: "#d1fae5", color: "#065f46", padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
                        {noteMsg}
                      </div>
                    )}
                    <textarea
                      placeholder="Doctor's clinical assessment, prescribed actives (e.g. Adapalene 0.1%, Azelaic Acid 15%), cautions..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={3}
                      style={{
                        width: "100%",
                        padding: 12,
                        borderRadius: 10,
                        border: "1px solid #d1d5db",
                        fontSize: 13,
                        boxSizing: "border-box",
                        marginBottom: 10,
                      }}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Routine Adjustment Note (e.g. 'Apply retinol only 2x a week; pause chemical peels')"
                      value={routineNote}
                      onChange={(e) => setRoutineNote(e.target.value)}
                      style={{
                        width: "100%",
                        padding: 10,
                        borderRadius: 10,
                        border: "1px solid #d1d5db",
                        fontSize: 13,
                        boxSizing: "border-box",
                        marginBottom: 14,
                      }}
                    />
                    <button
                      type="submit"
                      disabled={savingNote}
                      style={{
                        background: "#1b4332",
                        color: "white",
                        padding: "10px 20px",
                        borderRadius: 8,
                        border: "none",
                        fontWeight: 700,
                        cursor: savingNote ? "not-allowed" : "pointer",
                      }}
                    >
                      {savingNote ? "Saving..." : "Save Clinical Recommendation"}
                    </button>
                  </form>

                  {/* Past Notes List */}
                  {patientDetail.clinical_notes?.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <h4 style={{ margin: "0 0 10px", color: "#1b4332", fontSize: 14 }}>Past Clinical Advice</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {patientDetail.clinical_notes.map((n) => (
                          <div key={n.id} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, fontSize: 13 }}>
                            <div style={{ color: "#6b7280", fontSize: 11, marginBottom: 4 }}>Recorded on {n.created_at}</div>
                            <div style={{ color: "#1f2937", marginBottom: n.routine_adjustment ? 4 : 0 }}>{n.notes}</div>
                            {n.routine_adjustment && (
                              <div style={{ color: "#065f46", fontSize: 12, fontWeight: 600 }}>
                                Adjustment: {n.routine_adjustment}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

const statBox = {
  background: "white",
  borderRadius: 14,
  padding: "16px 20px",
  border: "1px solid #e5e7eb",
};

const statLabel = {
  fontSize: 12,
  fontWeight: 600,
  color: "#6b7280",
  marginBottom: 6,
};

const statNum = {
  fontSize: 26,
  fontWeight: 800,
  color: "#1b4332",
};

export default DermatologistDashboard;
