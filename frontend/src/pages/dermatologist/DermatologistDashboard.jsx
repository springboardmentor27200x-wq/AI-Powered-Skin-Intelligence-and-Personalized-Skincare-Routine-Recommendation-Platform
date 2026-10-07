import { useState, useEffect } from "react";
import {
  getDermatologistPatients,
  getDermatologistPatientDetail,
  createTreatmentReport,
  getDermatologistReports,
} from "../../services/api";

const INGREDIENTS = [
  "Retinol", "Niacinamide", "Vitamin C", "Hyaluronic Acid",
  "Salicylic Acid", "Ceramides", "Peptides", "AHA/BHA",
  "Benzoyl Peroxide", "Azelaic Acid", "Zinc", "Glycolic Acid",
];

export default function DermatologistDashboard() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetail, setPatientDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("patients"); // patients | reports | analytics
  const [formData, setFormData] = useState({
    diagnosis: "",
    treatment_plan: "",
    prescribed_ingredients: [],
    avoid_ingredients: [],
    follow_up_date: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getDermatologistPatients()
      .then((r) => setPatients(r.data))
      .catch(() => setError("Failed to load patients"))
      .finally(() => setLoading(false));
    getDermatologistReports()
      .then((r) => setReports(r.data))
      .catch(() => {});
  }, []);

  const selectPatient = async (patient) => {
    setSelectedPatient(patient);
    setPatientDetail(null);
    setShowForm(false);
    setDetailLoading(true);
    try {
      const res = await getDermatologistPatientDetail(patient.id);
      setPatientDetail(res.data);
    } catch {
      setError("Failed to load patient details");
    }
    setDetailLoading(false);
  };

  const toggleIngredient = (ingredient, field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(ingredient)
        ? prev[field].filter((i) => i !== ingredient)
        : [...prev[field], ingredient],
    }));
  };

  const submitReport = async () => {
    if (!formData.diagnosis || !formData.treatment_plan) {
      setError("Diagnosis and Treatment Plan are required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await createTreatmentReport({
        patient_id: selectedPatient.id,
        ...formData,
        follow_up_date: formData.follow_up_date || null,
      });
      setSuccess("Treatment report submitted successfully!");
      setShowForm(false);
      setFormData({
        diagnosis: "",
        treatment_plan: "",
        prescribed_ingredients: [],
        avoid_ingredients: [],
        follow_up_date: "",
        notes: "",
      });
      const res = await getDermatologistPatientDetail(selectedPatient.id);
      setPatientDetail(res.data);
      // Refresh reports
      getDermatologistReports().then((r) => setReports(r.data)).catch(() => {});
    } catch {
      setError("Failed to submit report. Please try again.");
    }
    setSubmitting(false);
  };

  const parseList = (val) => {
    try { return JSON.parse(val || "[]"); } catch { return []; }
  };

  // Filtered patients
  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Quick stats
  const totalPatients = patients.length;
  const totalReports = reports.length;
  const reportsThisMonth = reports.filter((r) => {
    const d = new Date(r.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const upcomingFollowups = reports.filter(
    (r) => r.follow_up_date && new Date(r.follow_up_date) >= new Date()
  ).length;

  if (loading) return <div className="card" style={{ textAlign: "center", padding: 40 }}>Loading patients...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#1f2937" }}>🩺 Dermatologist Dashboard</h2>
        <p style={{ color: "#6b7280" }}>Manage patient profiles, skin assessments, and treatment plans.</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

      {/* ═══════════════ STATS SECTION ═══════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { icon: "👥", label: "Total Patients", value: totalPatients, color: "#7c3aed" },
          { icon: "📋", label: "Treatment Reports", value: totalReports, color: "#10b981" },
          { icon: "📅", label: "Reports This Month", value: reportsThisMonth, color: "#f59e0b" },
          { icon: "🔔", label: "Upcoming Follow-ups", value: upcomingFollowups, color: "#6366f1" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="card"
            style={{ textAlign: "center", padding: "20px 16px", borderTop: `4px solid ${stat.color}` }}
          >
            <div style={{ fontSize: "2rem", marginBottom: 6 }}>{stat.icon}</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: "0.82rem", color: "#6b7280", marginTop: 4, fontWeight: 500 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ═══════════════ TAB NAVIGATION ═══════════════ */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "2px solid #e5e7eb" }}>
        {[
          { key: "patients", label: "👥 Patients", count: totalPatients },
          { key: "reports", label: "📋 Treatment Reports", count: totalReports },
          { key: "analytics", label: "📊 Analytics" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "12px 24px",
              border: "none",
              borderBottom: activeTab === tab.key ? "3px solid #7c3aed" : "3px solid transparent",
              background: "none",
              cursor: "pointer",
              fontWeight: activeTab === tab.key ? 700 : 500,
              color: activeTab === tab.key ? "#7c3aed" : "#6b7280",
              fontSize: "0.95rem",
              transition: "all 0.2s",
            }}
          >
            {tab.label} {tab.count !== undefined && <span style={{ background: activeTab === tab.key ? "#ede9fe" : "#f3f4f6", borderRadius: 999, padding: "2px 8px", fontSize: "0.75rem", marginLeft: 6 }}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* ═══════════════ TAB: PATIENTS ═══════════════ */}
      {activeTab === "patients" && (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}>
          {/* Patient List */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "white" }}>
              <h3 style={{ margin: "0 0 10px 0", fontWeight: 700 }}>Patients ({filteredPatients.length})</h3>
              <input
                type="text"
                placeholder="🔍 Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "none",
                  fontSize: "0.85rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ maxHeight: "550px", overflowY: "auto" }}>
              {filteredPatients.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#9ca3af" }}>
                  {searchTerm ? "No patients match your search." : "No patients registered yet."}
                </div>
              ) : (
                filteredPatients.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => selectPatient(p)}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #f3f4f6",
                      cursor: "pointer",
                      background: selectedPatient?.id === p.id ? "#faf5ff" : "white",
                      borderLeft: selectedPatient?.id === p.id ? "4px solid #7c3aed" : "4px solid transparent",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 600, color: "#1f2937" }}>{p.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{p.email}</div>
                        <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                          Age: {p.age} · {p.gender}
                        </div>
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#d1d5db" }}>›</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Patient Detail */}
          <div>
            {!selectedPatient ? (
              <div className="card" style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
                <div style={{ fontSize: "3rem", marginBottom: 16 }}>👈</div>
                <p>Select a patient to view their details and create treatment reports.</p>
              </div>
            ) : detailLoading ? (
              <div className="card" style={{ textAlign: "center", padding: 60 }}>Loading patient data...</div>
            ) : patientDetail ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Patient Overview */}
                <div className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: "1.3rem", color: "#1f2937", marginBottom: 4 }}>
                        {patientDetail.patient.name}
                      </h3>
                      <p style={{ color: "#6b7280", margin: 0 }}>{patientDetail.patient.email}</p>
                      <p style={{ color: "#6b7280", margin: "4px 0 0 0", fontSize: "0.9rem" }}>
                        Age: {patientDetail.patient.age} · Gender: {patientDetail.patient.gender}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowForm(!showForm)}
                      className="btn"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "white", border: "none" }}
                    >
                      {showForm ? "✕ Cancel" : "📝 New Treatment Report"}
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 20 }}>
                    {[
                      { label: "Skin Type", value: patientDetail.skin_profile?.skin_type || "—", icon: "🧴" },
                      { label: "Age Group", value: patientDetail.skin_profile?.age_group || "—", icon: "📅" },
                      { label: "Climate", value: patientDetail.skin_profile?.climate_type || "—", icon: "🌤️" },
                      { label: "Progress Logs", value: patientDetail.progress_count, icon: "📈" },
                    ].map((item) => (
                      <div key={item.label} style={{ background: "#f9fafb", borderRadius: 10, padding: 14, textAlign: "center" }}>
                        <div style={{ fontSize: "1.3rem", marginBottom: 4 }}>{item.icon}</div>
                        <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#7c3aed" }}>{item.value}</div>
                        <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: 4 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Latest Assessment */}
                {patientDetail.latest_assessment && (
                  <div className="card">
                    <h4 style={{ fontWeight: 700, color: "#1f2937", marginBottom: 12 }}>📊 Latest Skin Assessment</h4>
                    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{
                          fontSize: "2.5rem",
                          fontWeight: 800,
                          color: patientDetail.latest_assessment.overall_score >= 70 ? "#10b981" :
                            patientDetail.latest_assessment.overall_score >= 50 ? "#f59e0b" : "#ef4444"
                        }}>
                          {patientDetail.latest_assessment.overall_score?.toFixed(1) || "N/A"}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>Overall Score</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 8 }}>Skin Concerns:</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {parseList(patientDetail.latest_assessment.skin_concerns).map((c) => (
                            <span key={c} style={{ background: "#fef3c7", color: "#92400e", borderRadius: 20, padding: "3px 10px", fontSize: "0.8rem" }}>
                              {c}
                            </span>
                          ))}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 8 }}>
                          Assessed: {new Date(patientDetail.latest_assessment.assessment_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Skin Concerns & Allergies */}
                {patientDetail.skin_profile && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    {/* Concerns */}
                    {patientDetail.skin_profile.skin_concerns && (
                      <div className="card">
                        <h4 style={{ fontWeight: 700, color: "#1f2937", marginBottom: 12 }}>⚠️ Skin Concerns</h4>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {parseList(patientDetail.skin_profile.skin_concerns).map((c) => (
                            <span key={c} style={{ background: "#fee2e2", color: "#991b1b", borderRadius: 20, padding: "4px 12px", fontSize: "0.85rem", fontWeight: 500 }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Allergies */}
                    <div className="card">
                      <h4 style={{ fontWeight: 700, color: "#1f2937", marginBottom: 12 }}>🚫 Allergies & Sensitivities</h4>
                      {patientDetail.skin_profile.allergies ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {parseList(patientDetail.skin_profile.allergies).length > 0 ? (
                            parseList(patientDetail.skin_profile.allergies).map((a) => (
                              <span key={a} style={{ background: "#fef3c7", color: "#92400e", borderRadius: 20, padding: "4px 12px", fontSize: "0.85rem", fontWeight: 500, border: "1px solid #fbbf24" }}>
                                ⚠️ {a}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: "#10b981", fontSize: "0.9rem" }}>✅ No known allergies</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "#9ca3af", fontSize: "0.9rem" }}>Not provided</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Patient Treatment History */}
                {reports.filter((r) => r.patient_id === selectedPatient.id).length > 0 && (
                  <div className="card">
                    <h4 style={{ fontWeight: 700, color: "#1f2937", marginBottom: 16 }}>📑 Treatment History for {selectedPatient.name}</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {reports
                        .filter((r) => r.patient_id === selectedPatient.id)
                        .map((r) => (
                          <div
                            key={r.id}
                            style={{
                              background: "#f9fafb",
                              borderRadius: 12,
                              padding: "16px 20px",
                              borderLeft: "4px solid #7c3aed",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                              <div style={{ fontWeight: 700, color: "#1f2937", fontSize: "0.95rem" }}>
                                {r.diagnosis.length > 80 ? r.diagnosis.slice(0, 80) + "..." : r.diagnosis}
                              </div>
                              <span style={{ fontSize: "0.75rem", color: "#9ca3af", flexShrink: 0, marginLeft: 12 }}>
                                {new Date(r.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 8 }}>
                              <strong>Plan:</strong> {r.treatment_plan.length > 120 ? r.treatment_plan.slice(0, 120) + "..." : r.treatment_plan}
                            </div>
                            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                              {parseList(r.prescribed_ingredients).length > 0 && (
                                <div style={{ fontSize: "0.78rem" }}>
                                  <span style={{ color: "#059669", fontWeight: 600 }}>✓ Prescribed: </span>
                                  {parseList(r.prescribed_ingredients).join(", ")}
                                </div>
                              )}
                              {parseList(r.avoid_ingredients).length > 0 && (
                                <div style={{ fontSize: "0.78rem" }}>
                                  <span style={{ color: "#dc2626", fontWeight: 600 }}>✗ Avoid: </span>
                                  {parseList(r.avoid_ingredients).join(", ")}
                                </div>
                              )}
                            </div>
                            {r.follow_up_date && (
                              <div style={{ fontSize: "0.78rem", color: "#6366f1", marginTop: 6, fontWeight: 500 }}>
                                📅 Follow-up: {new Date(r.follow_up_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Treatment Report Form */}
                {showForm && (
                  <div className="card">
                    <h4 style={{ fontWeight: 700, color: "#1f2937", marginBottom: 20 }}>📝 New Treatment Report for {selectedPatient.name}</h4>
                    <div style={{ display: "grid", gap: 16 }}>
                      <div>
                        <label style={{ fontWeight: 600, display: "block", marginBottom: 6, color: "#374151" }}>Diagnosis *</label>
                        <textarea
                          rows={3}
                          className="input"
                          style={{ width: "100%", resize: "vertical" }}
                          placeholder="Enter clinical diagnosis..."
                          value={formData.diagnosis}
                          onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                        />
                      </div>

                      <div>
                        <label style={{ fontWeight: 600, display: "block", marginBottom: 6, color: "#374151" }}>Treatment Plan *</label>
                        <textarea
                          rows={4}
                          className="input"
                          style={{ width: "100%", resize: "vertical" }}
                          placeholder="Describe the recommended treatment plan..."
                          value={formData.treatment_plan}
                          onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
                        />
                      </div>

                      <div>
                        <label style={{ fontWeight: 600, display: "block", marginBottom: 8, color: "#374151" }}>
                          Prescribed Ingredients
                        </label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {INGREDIENTS.map((ing) => (
                            <button
                              key={ing}
                              type="button"
                              onClick={() => toggleIngredient(ing, "prescribed_ingredients")}
                              style={{
                                padding: "5px 12px",
                                borderRadius: 20,
                                border: "2px solid",
                                cursor: "pointer",
                                fontSize: "0.8rem",
                                fontWeight: 500,
                                background: formData.prescribed_ingredients.includes(ing) ? "#d1fae5" : "white",
                                borderColor: formData.prescribed_ingredients.includes(ing) ? "#10b981" : "#e5e7eb",
                                color: formData.prescribed_ingredients.includes(ing) ? "#065f46" : "#6b7280",
                                transition: "all 0.2s",
                              }}
                            >
                              {formData.prescribed_ingredients.includes(ing) ? "✓ " : ""}{ing}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label style={{ fontWeight: 600, display: "block", marginBottom: 8, color: "#374151" }}>
                          Ingredients to Avoid
                        </label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {INGREDIENTS.map((ing) => (
                            <button
                              key={ing}
                              type="button"
                              onClick={() => toggleIngredient(ing, "avoid_ingredients")}
                              style={{
                                padding: "5px 12px",
                                borderRadius: 20,
                                border: "2px solid",
                                cursor: "pointer",
                                fontSize: "0.8rem",
                                fontWeight: 500,
                                background: formData.avoid_ingredients.includes(ing) ? "#fee2e2" : "white",
                                borderColor: formData.avoid_ingredients.includes(ing) ? "#ef4444" : "#e5e7eb",
                                color: formData.avoid_ingredients.includes(ing) ? "#991b1b" : "#6b7280",
                                transition: "all 0.2s",
                              }}
                            >
                              {formData.avoid_ingredients.includes(ing) ? "✗ " : ""}{ing}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                          <label style={{ fontWeight: 600, display: "block", marginBottom: 6, color: "#374151" }}>Follow-up Date</label>
                          <input
                            type="date"
                            className="input"
                            value={formData.follow_up_date}
                            onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ fontWeight: 600, display: "block", marginBottom: 6, color: "#374151" }}>Additional Notes</label>
                          <input
                            type="text"
                            className="input"
                            placeholder="Optional notes..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          />
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 12 }}>
                        <button
                          onClick={submitReport}
                          disabled={submitting}
                          className="btn"
                          style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none", flex: 1 }}
                        >
                          {submitting ? "Submitting..." : "✅ Submit Treatment Report"}
                        </button>
                        <button
                          onClick={() => setShowForm(false)}
                          className="btn"
                          style={{ background: "#f3f4f6", color: "#374151", border: "none" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ═══════════════ TAB: REPORTS ═══════════════ */}
      {activeTab === "reports" && (
        <div>
          <h3 style={{ fontWeight: 700, color: "#1f2937", marginBottom: 16 }}>📋 All Treatment Reports</h3>
          {reports.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>📋</div>
              <p>No treatment reports yet. Select a patient and create one.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {reports.map((r) => {
                const patient = patients.find((p) => p.id === r.patient_id);
                return (
                  <div
                    key={r.id}
                    className="card"
                    style={{ borderLeft: "5px solid #7c3aed" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#1f2937" }}>
                          🧑 {patient?.name || `Patient #${r.patient_id}`}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>{patient?.email || ""}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{
                          background: "#ede9fe",
                          color: "#7c3aed",
                          borderRadius: 20,
                          padding: "3px 12px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}>
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, color: "#374151", fontSize: "0.88rem" }}>Diagnosis: </span>
                      <span style={{ color: "#6b7280", fontSize: "0.88rem" }}>{r.diagnosis}</span>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <span style={{ fontWeight: 600, color: "#374151", fontSize: "0.88rem" }}>Treatment: </span>
                      <span style={{ color: "#6b7280", fontSize: "0.88rem" }}>{r.treatment_plan}</span>
                    </div>
                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: "0.82rem" }}>
                      {parseList(r.prescribed_ingredients).length > 0 && (
                        <div>
                          <span style={{ color: "#059669", fontWeight: 600 }}>✓ Prescribed: </span>
                          <span style={{ color: "#6b7280" }}>{parseList(r.prescribed_ingredients).join(", ")}</span>
                        </div>
                      )}
                      {parseList(r.avoid_ingredients).length > 0 && (
                        <div>
                          <span style={{ color: "#dc2626", fontWeight: 600 }}>✗ Avoid: </span>
                          <span style={{ color: "#6b7280" }}>{parseList(r.avoid_ingredients).join(", ")}</span>
                        </div>
                      )}
                    </div>
                    {r.follow_up_date && (
                      <div style={{ marginTop: 8, fontSize: "0.82rem", color: "#6366f1", fontWeight: 500 }}>
                        📅 Follow-up: {new Date(r.follow_up_date).toLocaleDateString()}
                      </div>
                    )}
                    {r.notes && (
                      <div style={{ marginTop: 6, fontSize: "0.82rem", color: "#9ca3af", fontStyle: "italic" }}>
                        💬 {r.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ TAB: ANALYTICS ═══════════════ */}
      {activeTab === "analytics" && (
        <div>
          <h3 style={{ fontWeight: 700, color: "#1f2937", marginBottom: 20 }}>📊 Practice Analytics</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Patient Demographics */}
            <div className="card">
              <h4 style={{ fontWeight: 700, color: "#1f2937", marginBottom: 16 }}>👥 Patient Demographics</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(() => {
                  const genders = {};
                  patients.forEach((p) => { genders[p.gender] = (genders[p.gender] || 0) + 1; });
                  return Object.entries(genders).map(([g, count]) => (
                    <div key={g} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 500, color: "#374151", textTransform: "capitalize" }}>{g}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ background: "#e5e7eb", borderRadius: 999, height: 8, width: 120, overflow: "hidden" }}>
                          <div style={{
                            height: "100%",
                            borderRadius: 999,
                            background: "#7c3aed",
                            width: `${(count / patients.length) * 100}%`,
                            transition: "width 0.6s",
                          }} />
                        </div>
                        <span style={{ fontSize: "0.85rem", color: "#6b7280", minWidth: 50, textAlign: "right" }}>{count} ({((count / patients.length) * 100).toFixed(0)}%)</span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
              <div style={{ marginTop: 20 }}>
                <h5 style={{ fontWeight: 600, color: "#374151", marginBottom: 10 }}>Age Distribution</h5>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(() => {
                    const ageGroups = { "Under 20": 0, "20-30": 0, "30-40": 0, "40-50": 0, "50+": 0 };
                    patients.forEach((p) => {
                      if (p.age < 20) ageGroups["Under 20"]++;
                      else if (p.age <= 30) ageGroups["20-30"]++;
                      else if (p.age <= 40) ageGroups["30-40"]++;
                      else if (p.age <= 50) ageGroups["40-50"]++;
                      else ageGroups["50+"]++;
                    });
                    return Object.entries(ageGroups).filter(([, c]) => c > 0).map(([label, count]) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.85rem", color: "#374151" }}>{label}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ background: "#e5e7eb", borderRadius: 999, height: 8, width: 100, overflow: "hidden" }}>
                            <div style={{
                              height: "100%", borderRadius: 999, background: "#10b981",
                              width: `${(count / patients.length) * 100}%`,
                            }} />
                          </div>
                          <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>{count}</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* Report Activity */}
            <div className="card">
              <h4 style={{ fontWeight: 700, color: "#1f2937", marginBottom: 16 }}>📅 Report Activity Summary</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  { label: "Total Reports", value: totalReports, icon: "📋", color: "#7c3aed" },
                  { label: "This Month", value: reportsThisMonth, icon: "📆", color: "#10b981" },
                  { label: "Upcoming Follow-ups", value: upcomingFollowups, icon: "🔔", color: "#f59e0b" },
                  { label: "Unique Patients Treated", value: new Set(reports.map((r) => r.patient_id)).size, icon: "🧑‍⚕️", color: "#6366f1" },
                ].map((item) => (
                  <div key={item.label} style={{ background: "#f9fafb", borderRadius: 10, padding: 16, textAlign: "center" }}>
                    <div style={{ fontSize: "1.4rem", marginBottom: 4 }}>{item.icon}</div>
                    <div style={{ fontSize: "1.6rem", fontWeight: 800, color: item.color }}>{item.value}</div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: 4 }}>{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Most Prescribed Ingredients */}
              <div style={{ marginTop: 24 }}>
                <h5 style={{ fontWeight: 600, color: "#374151", marginBottom: 12 }}>💊 Most Prescribed Ingredients</h5>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(() => {
                    const ingredientCount = {};
                    reports.forEach((r) => {
                      parseList(r.prescribed_ingredients).forEach((ing) => {
                        ingredientCount[ing] = (ingredientCount[ing] || 0) + 1;
                      });
                    });
                    const sorted = Object.entries(ingredientCount).sort((a, b) => b[1] - a[1]).slice(0, 6);
                    const max = sorted.length > 0 ? sorted[0][1] : 1;
                    return sorted.length === 0 ? (
                      <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>No data yet</span>
                    ) : (
                      sorted.map(([name, count]) => (
                        <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.85rem", color: "#374151", fontWeight: 500 }}>{name}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ background: "#e5e7eb", borderRadius: 999, height: 8, width: 80, overflow: "hidden" }}>
                              <div style={{ height: "100%", borderRadius: 999, background: "#059669", width: `${(count / max) * 100}%` }} />
                            </div>
                            <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>×{count}</span>
                          </div>
                        </div>
                      ))
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
