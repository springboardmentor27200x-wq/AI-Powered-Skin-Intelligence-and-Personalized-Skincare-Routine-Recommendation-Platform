import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";

function DermatologistDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("insights"); // "insights" | "improvement" | "prescriptions" | "conditions" | "treatments" | "analytics"
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Patient Selection & Modal Controls
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientDetail, setPatientDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Treatment recommendation note state
  const [clinicalPrescription, setClinicalPrescription] = useState("");
  const [routineModification, setRoutineModification] = useState("");
  const [savingRxNote, setSavingRxNote] = useState(false);
  const [rxNoteSuccess, setRxNoteSuccess] = useState("");

  // Prescription Maker state
  const [rxDrug, setRxDrug] = useState("");
  const [rxStrength, setRxStrength] = useState("");
  const [rxFrequency, setRxFrequency] = useState("Apply once daily at bedtime (PM)");
  const [rxDirections, setRxDirections] = useState("");
  const [rxDurationDays, setRxDurationDays] = useState("60");
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [prescriptionSuccess, setPrescriptionSuccess] = useState("");

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
        const patientList = res.data.patients || [];
        setPatients(patientList);
        if (patientList.length > 0 && !selectedPatient) {
          // Pre-select first patient for prescribing tabs
          setSelectedPatient(patientList[0]);
          loadPatientDetail(patientList[0].id);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Dermatologist access required to view this clinical portal.");
      })
      .finally(() => setLoading(false));
  };

  const loadPatientDetail = (patientId) => {
    setDetailLoading(true);
    axios
      .get(`http://127.0.0.1:5000/api/doctor/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setPatientDetail(res.data);
      })
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  };

  const selectPatient = (patient, openModal = false) => {
    setSelectedPatient(patient);
    setIsModalOpen(openModal);
    setRxNoteSuccess("");
    setPrescriptionSuccess("");
    loadPatientDetail(patient.id);
  };

  const handleSavePrescription = (e) => {
    e.preventDefault();
    if (!rxDrug.trim() || !selectedPatient) return;

    setSavingPrescription(true);
    setPrescriptionSuccess("");
    axios
      .post(
        "http://127.0.0.1:5000/api/doctor/prescription",
        {
          patient_id: selectedPatient.id,
          medication: rxDrug,
          dosage: rxStrength || "Standard clinical strength",
          frequency: rxFrequency,
          instructions: rxDirections || "Apply thin layer to clean, dry skin.",
          duration_days: parseInt(rxDurationDays) || 60,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setPrescriptionSuccess("Medical prescription formally authorized and filed to patient chart!");
        setRxDrug("");
        setRxStrength("");
        setRxDirections("");
        loadPatientDetail(selectedPatient.id);
        fetchPatients();
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          alert("Your login session has expired. Please log in again.");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }
        alert(err.response?.data?.error || err.response?.data?.msg || "Failed to file prescription.");
      })
      .finally(() => setSavingPrescription(false));
  };

  const handleSaveTreatmentNote = (e) => {
    e.preventDefault();
    if (!clinicalPrescription.trim() || !selectedPatient) return;

    setSavingRxNote(true);
    setRxNoteSuccess("");
    axios
      .post(
        `http://127.0.0.1:5000/api/doctor/patient/${selectedPatient.id}/note`,
        {
          notes: clinicalPrescription,
          routine_adjustment: routineModification,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setRxNoteSuccess("Clinical treatment note saved to patient chart!");
        setClinicalPrescription("");
        setRoutineModification("");
        loadPatientDetail(selectedPatient.id);
      })
      .catch(() => {
        alert("Failed to save treatment recommendation.");
      })
      .finally(() => setSavingRxNote(false));
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      (p.skin_type || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.medical_flag || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div style={{ maxWidth: 1120, margin: "0 auto", paddingBottom: 60 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28 }}>🩺</span>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1b4332", margin: 0 }}>
                Dermatologist Clinical Portal
              </h1>
            </div>
            <p style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>
              Diagnostic patient triage, improvement score analytics, prescription authorization, and treatment planning.
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
            <h3 style={{ color: "#991b1b", margin: "0 0 8px" }}>Clinical Access Restricted</h3>
            <p style={{ color: "#7f1d1d", fontSize: 14, margin: 0 }}>{error}</p>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div style={{ display: "flex", gap: 10, marginBottom: 24, borderBottom: "2px solid #e5e7eb", paddingBottom: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => setActiveTab("insights")}
                style={{
                  ...tabBtn,
                  background: activeTab === "insights" ? "#1e3a8a" : "#f3f4f6",
                  color: activeTab === "insights" ? "white" : "#374151",
                }}
              >
                🩺 Patient Insights ({patients.length})
              </button>
              <button
                onClick={() => setActiveTab("prescriptions")}
                style={{
                  ...tabBtn,
                  background: activeTab === "prescriptions" ? "#1e3a8a" : "#f3f4f6",
                  color: activeTab === "prescriptions" ? "white" : "#374151",
                }}
              >
                💊 Medical Prescriptions
              </button>
              <button
                onClick={() => setActiveTab("improvement")}
                style={{
                  ...tabBtn,
                  background: activeTab === "improvement" ? "#1e3a8a" : "#f3f4f6",
                  color: activeTab === "improvement" ? "white" : "#374151",
                }}
              >
                📊 Improvement Score Analysis
              </button>
              <button
                onClick={() => setActiveTab("conditions")}
                style={{
                  ...tabBtn,
                  background: activeTab === "conditions" ? "#1e3a8a" : "#f3f4f6",
                  color: activeTab === "conditions" ? "white" : "#374151",
                }}
              >
                📋 Skin Condition Reports
              </button>
              <button
                onClick={() => setActiveTab("treatments")}
                style={{
                  ...tabBtn,
                  background: activeTab === "treatments" ? "#1e3a8a" : "#f3f4f6",
                  color: activeTab === "treatments" ? "white" : "#374151",
                }}
              >
                📝 Treatment Notes
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                style={{
                  ...tabBtn,
                  background: activeTab === "analytics" ? "#1e3a8a" : "#f3f4f6",
                  color: activeTab === "analytics" ? "white" : "#374151",
                }}
              >
                📈 Progress Analytics
              </button>
            </div>

            {/* Clinical Search Bar */}
            <div style={{ marginBottom: 20 }}>
              <input
                type="text"
                placeholder="Search patient records by name, email, condition, or triage flag..."
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

            {/* TAB 1: PATIENT INSIGHTS */}
            {activeTab === "insights" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 18 }}>
                  {filteredPatients.map((p) => {
                    const isHighPriority = p.triage === "High Priority";
                    return (
                      <div
                        key={p.id}
                        style={{
                          background: "white",
                          borderRadius: 16,
                          padding: 22,
                          border: isHighPriority ? "2px solid #ef4444" : "1px solid #e5e7eb",
                          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                            <div>
                              <h3 style={{ margin: 0, fontSize: 17, color: "#1e3a8a", fontWeight: 700 }}>{p.name}</h3>
                              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>{p.email}</p>
                            </div>
                            <span
                              style={{
                                background: isHighPriority ? "#fee2e2" : "#e0f2fe",
                                color: isHighPriority ? "#b91c1c" : "#0369a1",
                                fontWeight: 700,
                                fontSize: 11,
                                padding: "4px 8px",
                                borderRadius: 12,
                                textTransform: "uppercase",
                              }}
                            >
                              {p.triage || "Standard"}
                            </span>
                          </div>

                          <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: 8, marginBottom: 12, fontSize: 12, color: "#334155" }}>
                            <strong>Medical Flag:</strong> {p.medical_flag || "Routine Observation"}
                          </div>

                          <div style={{ fontSize: 13, lineHeight: 1.6, color: "#4b5563" }}>
                            <div><strong>Skin Type:</strong> {p.skin_type}</div>
                            <div><strong>Primary Concerns:</strong> {p.skin_concerns}</div>
                            <div><strong>Improvement Score:</strong> <strong style={{ color: p.improvement_pts >= 0 ? "#166534" : "#dc2626" }}>+{p.improvement_pts} pts ({p.improvement_pct}%)</strong></div>
                            <div><strong>Prescriptions on File:</strong> <strong style={{ color: "#1e3a8a" }}>{p.prescription_count || 0} active Rx</strong></div>
                            <div><strong>Barrier Resilience:</strong> <strong style={{ color: "#166534" }}>{p.latest_score ?? "—"}/100</strong></div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                          <button
                            onClick={() => selectPatient(p, true)}
                            style={{
                              flex: 1,
                              padding: "10px",
                              borderRadius: 10,
                              border: "none",
                              background: "#1e3a8a",
                              color: "white",
                              fontWeight: 700,
                              fontSize: 13,
                              cursor: "pointer",
                            }}
                          >
                            Open Clinical Chart →
                          </button>
                          <button
                            onClick={() => {
                              selectPatient(p, false);
                              setActiveTab("prescriptions");
                            }}
                            style={{
                              padding: "10px 14px",
                              borderRadius: 10,
                              border: "1.5px solid #1e3a8a",
                              background: "#eff6ff",
                              color: "#1e3a8a",
                              fontWeight: 700,
                              fontSize: 13,
                              cursor: "pointer",
                            }}
                          >
                            💊 Prescribe
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: MEDICAL PRESCRIPTIONS (Direct, No Unwanted Modal Popup) */}
            {activeTab === "prescriptions" && (
              <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, color: "#1e3a8a", fontSize: 18 }}>Authorized Medical Prescriptions</h3>
                    <p style={{ color: "#6b7280", fontSize: 13, margin: "4px 0 0" }}>
                      Select a patient from the left column and write pharmaceutical-grade prescriptions with application directions.
                    </p>
                  </div>
                  {selectedPatient && (
                    <button
                      onClick={() => selectPatient(selectedPatient, true)}
                      style={{
                        background: "#eff6ff",
                        color: "#1e3a8a",
                        border: "1px solid #93c5fd",
                        padding: "8px 14px",
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      View {selectedPatient.name}'s Full Chart
                    </button>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
                  {/* Patient Selector List */}
                  <div style={{ borderRight: "1px solid #e2e8f0", paddingRight: 16, maxHeight: 560, overflowY: "auto" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 10 }}>Select Patient:</div>
                    {filteredPatients.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => selectPatient(p, false)}
                        style={{
                          padding: "12px 14px",
                          borderRadius: 10,
                          marginBottom: 8,
                          cursor: "pointer",
                          background: selectedPatient?.id === p.id ? "#dbeafe" : "#f8fafc",
                          border: selectedPatient?.id === p.id ? "2px solid #1e3a8a" : "1px solid #e2e8f0",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: "#1e3a8a" }}>{p.name}</span>
                          <span style={{ background: "#e0f2fe", color: "#0369a1", fontSize: 11, padding: "2px 6px", borderRadius: 6, fontWeight: 700 }}>
                            {p.prescription_count || 0} Rx
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                          {p.skin_type} • Score: {p.latest_score ?? "—"}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Prescription Prescriber Form */}
                  <div>
                    {selectedPatient ? (
                      <form onSubmit={handleSavePrescription}>
                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <h4 style={{ margin: 0, color: "#1e3a8a", fontSize: 16 }}>
                                Prescribing for: <strong>{selectedPatient.name}</strong>
                              </h4>
                              <span style={{ fontSize: 12, color: "#64748b" }}>
                                {selectedPatient.email} • Triage: <strong>{selectedPatient.triage}</strong>
                              </span>
                            </div>
                            <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                              Score: {selectedPatient.latest_score ?? "—"}/100
                            </span>
                          </div>
                        </div>

                        {prescriptionSuccess && (
                          <div style={{ background: "#dcfce7", color: "#166534", padding: 12, borderRadius: 10, fontSize: 13, marginBottom: 14, fontWeight: 600 }}>
                            ✓ {prescriptionSuccess}
                          </div>
                        )}

                        <div style={{ marginBottom: 14 }}>
                          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                            Prescribed Molecule / Medication Name:
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Tretinoin Microsphere Gel, Adapalene 0.1%, Azelaic Acid 20%, Clindamycin 1% Solution"
                            value={rxDrug}
                            onChange={(e) => setRxDrug(e.target.value)}
                            style={{ width: "100%", padding: 12, borderRadius: 8, border: "1.5px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                            required
                          />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                          <div>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                              Concentration & Dosage:
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 0.05% / Pea-sized amount"
                              value={rxStrength}
                              onChange={(e) => setRxStrength(e.target.value)}
                              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                              Application Frequency:
                            </label>
                            <select
                              value={rxFrequency}
                              onChange={(e) => setRxFrequency(e.target.value)}
                              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                            >
                              <option value="Apply once daily at bedtime (PM)">Apply once daily at bedtime (PM)</option>
                              <option value="Alternate evenings (Mon/Wed/Fri)">Alternate evenings (Mon/Wed/Fri)</option>
                              <option value="Twice daily (Morning & Evening)">Twice daily (Morning & Evening)</option>
                              <option value="Once daily in morning before sunscreen">Once daily in morning before sunscreen</option>
                            </select>
                          </div>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                            Clinical Directions & Buffering Instructions:
                          </label>
                          <textarea
                            rows={3}
                            placeholder="e.g. Apply to clean dry skin 20 mins after cleansing. Buffer with ceramide moisturizer for first 2 weeks. Always wear broad-spectrum SPF 50."
                            value={rxDirections}
                            onChange={(e) => setRxDirections(e.target.value)}
                            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                          />
                        </div>

                        <div style={{ marginBottom: 18 }}>
                          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                            Therapeutic Course Duration (Days):
                          </label>
                          <input
                            type="number"
                            value={rxDurationDays}
                            onChange={(e) => setRxDurationDays(e.target.value)}
                            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={savingPrescription}
                          style={{
                            background: "#1e3a8a",
                            color: "white",
                            padding: "12px 24px",
                            borderRadius: 10,
                            border: "none",
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: savingPrescription ? "not-allowed" : "pointer",
                            boxShadow: "0 4px 12px rgba(30, 58, 138, 0.25)",
                          }}
                        >
                          {savingPrescription ? "Authorizing..." : "Authorize Clinical Prescription"}
                        </button>
                      </form>
                    ) : (
                      <div style={{ textAlign: "center", padding: 50, color: "#64748b" }}>
                        👈 Select a patient from the list on the left to authorize prescriptions.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: IMPROVEMENT SCORE ANALYSIS */}
            {activeTab === "improvement" && (
              <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb" }}>
                <h3 style={{ margin: "0 0 16px", color: "#1e3a8a", fontSize: 18 }}>Patient Clinical Improvement Score Analysis</h3>
                <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>
                  Evaluate therapeutic efficacy by analyzing score delta from baseline consultation to present follow-up.
                </p>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                        <th style={{ padding: "12px 14px", color: "#334155" }}>Patient</th>
                        <th style={{ padding: "12px 14px", color: "#334155" }}>Baseline Score</th>
                        <th style={{ padding: "12px 14px", color: "#334155" }}>Follow-up Score</th>
                        <th style={{ padding: "12px 14px", color: "#334155" }}>Improvement Delta (Δ)</th>
                        <th style={{ padding: "12px 14px", color: "#334155" }}>% Recovery Gain</th>
                        <th style={{ padding: "12px 14px", color: "#334155" }}>Clinical Milestone</th>
                        <th style={{ padding: "12px 14px", color: "#334155" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map((p) => {
                        const isGain = (p.improvement_pts || 0) >= 0;
                        return (
                          <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "12px 14px", fontWeight: 600, color: "#1e3a8a" }}>{p.name}</td>
                            <td style={{ padding: "12px 14px", color: "#64748b" }}>{p.initial_score ?? 60}/100</td>
                            <td style={{ padding: "12px 14px", fontWeight: 700, color: "#0f172a" }}>{p.latest_score ?? 78}/100</td>
                            <td style={{ padding: "12px 14px" }}>
                              <span
                                style={{
                                  background: isGain ? "#dcfce7" : "#fee2e2",
                                  color: isGain ? "#166534" : "#991b1b",
                                  padding: "4px 10px",
                                  borderRadius: 12,
                                  fontWeight: 800,
                                }}
                              >
                                {isGain ? `+${p.improvement_pts}` : p.improvement_pts} pts
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px", fontWeight: 700, color: isGain ? "#16a34a" : "#dc2626" }}>
                              {isGain ? `+${p.improvement_pct}%` : `${p.improvement_pct}%`}
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "3px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
                                {p.improvement_status || "Analyzing"}
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <button
                                onClick={() => selectPatient(p, true)}
                                style={{
                                  background: "#1e3a8a",
                                  color: "white",
                                  border: "none",
                                  padding: "6px 12px",
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                Open Chart
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: SKIN CONDITION REPORTS */}
            {activeTab === "conditions" && (
              <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb" }}>
                <h3 style={{ margin: "0 0 16px", color: "#1e3a8a", fontSize: 18 }}>Patient Skin Condition Diagnostic Reports</h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                        <th style={{ padding: "12px 14px", color: "#334155" }}>Patient</th>
                        <th style={{ padding: "12px 14px", color: "#334155" }}>Skin Type</th>
                        <th style={{ padding: "12px 14px", color: "#334155" }}>Diagnosed Conditions</th>
                        <th style={{ padding: "12px 14px", color: "#334155" }}>Barrier Score</th>
                        <th style={{ padding: "12px 14px", color: "#334155" }}>Medical PDF Dossier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map((p) => (
                        <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 14px", fontWeight: 600, color: "#1e3a8a" }}>{p.name}</td>
                          <td style={{ padding: "12px 14px" }}>{p.skin_type}</td>
                          <td style={{ padding: "12px 14px", color: "#475569" }}>{p.skin_concerns}</td>
                          <td style={{ padding: "12px 14px", fontWeight: 700, color: "#166534" }}>{p.latest_score ?? "—"}/100</td>
                          <td style={{ padding: "12px 14px" }}>
                            <a
                              href="http://127.0.0.1:5000/api/reports/pdf/skin_assessment"
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                background: "#1e3a8a",
                                color: "white",
                                padding: "6px 12px",
                                borderRadius: 8,
                                textDecoration: "none",
                                fontSize: 12,
                                fontWeight: 600,
                                display: "inline-block",
                              }}
                            >
                              📄 Clinical Dossier PDF
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: TREATMENT NOTES */}
            {activeTab === "treatments" && (
              <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb" }}>
                <h3 style={{ margin: "0 0 16px", color: "#1e3a8a", fontSize: 18 }}>Treatment Notes & Clinical Guidance</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
                  <div style={{ borderRight: "1px solid #e2e8f0", paddingRight: 16, maxHeight: 500, overflowY: "auto" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 10 }}>Select Patient:</div>
                    {filteredPatients.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => selectPatient(p, false)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 10,
                          marginBottom: 8,
                          cursor: "pointer",
                          background: selectedPatient?.id === p.id ? "#dbeafe" : "#f8fafc",
                          border: selectedPatient?.id === p.id ? "2px solid #1e3a8a" : "1px solid #e2e8f0",
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#1e3a8a" }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{p.skin_type} • {p.medical_flag}</div>
                      </div>
                    ))}
                  </div>

                  <div>
                    {selectedPatient ? (
                      <form onSubmit={handleSaveTreatmentNote}>
                        <h4 style={{ margin: "0 0 12px", color: "#1e3a8a", fontSize: 16 }}>
                          Clinical Treatment Plan for {selectedPatient.name}
                        </h4>

                        {rxNoteSuccess && (
                          <div style={{ background: "#dcfce7", color: "#166534", padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
                            {rxNoteSuccess}
                          </div>
                        )}

                        <div style={{ marginBottom: 14 }}>
                          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                            Clinical Notes & Assessment:
                          </label>
                          <textarea
                            rows={3}
                            placeholder="e.g. Patient presents with comedonal acne and post-inflammatory erythema."
                            value={clinicalPrescription}
                            onChange={(e) => setClinicalPrescription(e.target.value)}
                            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                            required
                          />
                        </div>

                        <div style={{ marginBottom: 18 }}>
                          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                            Routine Modification Note:
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Pause all AHA/BHA chemical peels; rehydrate with ceramides."
                            value={routineModification}
                            onChange={(e) => setRoutineModification(e.target.value)}
                            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={savingRxNote}
                          style={{
                            background: "#1e3a8a",
                            color: "white",
                            padding: "10px 20px",
                            borderRadius: 8,
                            border: "none",
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: savingRxNote ? "not-allowed" : "pointer",
                          }}
                        >
                          {savingRxNote ? "Saving..." : "Save Clinical Note"}
                        </button>
                      </form>
                    ) : (
                      <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                        👈 Select a patient from the list.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PROGRESS ANALYTICS */}
            {activeTab === "analytics" && (
              <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb" }}>
                <h3 style={{ margin: "0 0 16px", color: "#1e3a8a", fontSize: 18 }}>Patient Clinical Progress & Recovery Analytics</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
                  {filteredPatients.map((p) => (
                    <div key={p.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 18, background: "#f8fafc" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: 15, color: "#1e3a8a" }}>{p.name}</span>
                          <div style={{ fontSize: 12, color: "#64748b" }}>{p.skin_type}</div>
                        </div>
                        <span
                          style={{
                            background: "#dcfce7",
                            color: "#166534",
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: 14,
                            fontSize: 12,
                          }}
                        >
                          Score: {p.latest_score ?? "—"}/100
                        </span>
                      </div>

                      <div style={{ background: "white", padding: 12, borderRadius: 8, marginBottom: 10, fontSize: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ color: "#64748b" }}>Treatment Adherence Rate</span>
                          <strong>{p.adherence_rate}%</strong>
                        </div>
                        <div style={{ width: "100%", height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${p.adherence_rate}%`, height: "100%", background: "#1e3a8a" }} />
                        </div>
                      </div>

                      <button
                        onClick={() => selectPatient(p, true)}
                        style={{
                          width: "100%",
                          padding: "8px",
                          borderRadius: 8,
                          border: "1px solid #cbd5e1",
                          background: "white",
                          color: "#1e3a8a",
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        Inspect Full Recovery Chart →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Patient Clinical Chart Modal (ONLY renders when explicitly opened) ── */}
        {isModalOpen && selectedPatient && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.55)",
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
                maxWidth: 780,
                width: "100%",
                maxHeight: "92vh",
                overflowY: "auto",
                padding: 30,
                boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", paddingBottom: 16, marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: 0, color: "#1e3a8a", fontSize: 20 }}>
                    Clinical File: {selectedPatient.name}
                  </h2>
                  <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
                    {selectedPatient.email} • Triage: <strong>{selectedPatient.triage}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: "none", border: "none", fontSize: 24, color: "#6b7280", cursor: "pointer", padding: "4px 8px" }}
                >
                  ✕
                </button>
              </div>

              {detailLoading ? (
                <p style={{ color: "#6b7280" }}>Loading clinical history...</p>
              ) : patientDetail ? (
                <div>
                  {/* Improvement Score Analysis Card */}
                  {patientDetail.improvement_analysis && (
                    <div style={{ background: "#eff6ff", border: "1.5px solid #93c5fd", borderRadius: 14, padding: 18, marginBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <h4 style={{ margin: 0, color: "#1e40af", fontSize: 15 }}>
                          📊 Clinical Improvement Score Analysis
                        </h4>
                        <span style={{ background: "#1e40af", color: "white", padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                          {patientDetail.improvement_analysis.status}
                        </span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, fontSize: 13 }}>
                        <div style={{ background: "white", padding: 10, borderRadius: 8 }}>
                          <span style={{ color: "#64748b", fontSize: 11 }}>Baseline Score:</span>
                          <div style={{ fontWeight: 700, fontSize: 16 }}>{patientDetail.improvement_analysis.initial_score}/100</div>
                        </div>
                        <div style={{ background: "white", padding: 10, borderRadius: 8 }}>
                          <span style={{ color: "#64748b", fontSize: 11 }}>Follow-up Score:</span>
                          <div style={{ fontWeight: 700, fontSize: 16, color: "#166534" }}>{patientDetail.improvement_analysis.latest_score}/100</div>
                        </div>
                        <div style={{ background: "white", padding: 10, borderRadius: 8 }}>
                          <span style={{ color: "#64748b", fontSize: 11 }}>Recovery Delta (Δ):</span>
                          <div style={{ fontWeight: 800, fontSize: 16, color: "#1d4ed8" }}>
                            +{patientDetail.improvement_analysis.improvement_pts} pts (+{patientDetail.improvement_analysis.improvement_pct}%)
                          </div>
                        </div>
                        <div style={{ background: "white", padding: 10, borderRadius: 8 }}>
                          <span style={{ color: "#64748b", fontSize: 11 }}>Erythema Reduction:</span>
                          <div style={{ fontWeight: 700, fontSize: 16, color: "#b91c1c" }}>-{patientDetail.improvement_analysis.erythema_reduction_pct}%</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Active Prescriptions on File */}
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <h4 style={{ margin: 0, color: "#1e3a8a", fontSize: 15 }}>Authorized Prescriptions on File</h4>
                      <span style={{ fontSize: 12, color: "#64748b" }}>{patientDetail.prescriptions?.length || 0} active</span>
                    </div>
                    {patientDetail.prescriptions?.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {patientDetail.prescriptions.map((rx) => (
                          <div key={rx.id} style={{ background: "white", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <strong style={{ color: "#1e3a8a", fontSize: 14 }}>💊 Rx: {rx.medication}</strong>
                              <span style={{ color: "#64748b", fontSize: 11 }}>Authorized: {rx.created_at}</span>
                            </div>
                            <div style={{ color: "#475569", marginTop: 4 }}>
                              Strength: <strong>{rx.dosage}</strong> | Frequency: <strong>{rx.frequency}</strong> | Duration: {rx.duration_days} days
                            </div>
                            {rx.instructions && (
                              <div style={{ color: "#334155", fontStyle: "italic", marginTop: 4 }}>Clinical Directions: {rx.instructions}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>No active prescriptions filed yet for this patient.</p>
                    )}
                  </div>

                  {/* Prescription Writer Form RIGHT INSIDE THE MODAL */}
                  <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 14, padding: 20, marginBottom: 20 }}>
                    <h4 style={{ margin: "0 0 12px", color: "#166534", fontSize: 16 }}>
                      💊 Authorize New Prescription for {selectedPatient.name}
                    </h4>

                    {prescriptionSuccess && (
                      <div style={{ background: "#dcfce7", color: "#166534", padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 12, fontWeight: 600 }}>
                        ✓ {prescriptionSuccess}
                      </div>
                    )}

                    <form onSubmit={handleSavePrescription}>
                      <div style={{ marginBottom: 10 }}>
                        <input
                          type="text"
                          placeholder="Prescribed Molecule (e.g. Tretinoin 0.05%, Adapalene 0.1%, Azelaic Acid 20%)"
                          value={rxDrug}
                          onChange={(e) => setRxDrug(e.target.value)}
                          style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                          required
                        />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                        <input
                          type="text"
                          placeholder="Dosage (e.g. Pea-sized amount)"
                          value={rxStrength}
                          onChange={(e) => setRxStrength(e.target.value)}
                          style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                        />
                        <select
                          value={rxFrequency}
                          onChange={(e) => setRxFrequency(e.target.value)}
                          style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                        >
                          <option value="Apply once daily at bedtime (PM)">Apply once daily at bedtime (PM)</option>
                          <option value="Alternate evenings (Mon/Wed/Fri)">Alternate evenings (Mon/Wed/Fri)</option>
                          <option value="Twice daily (Morning & Evening)">Twice daily (Morning & Evening)</option>
                        </select>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <input
                          type="text"
                          placeholder="Clinical Directions & Buffering Instructions"
                          value={rxDirections}
                          onChange={(e) => setRxDirections(e.target.value)}
                          style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={savingPrescription}
                        style={{
                          background: "#166534",
                          color: "white",
                          padding: "10px 18px",
                          borderRadius: 8,
                          border: "none",
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: savingPrescription ? "not-allowed" : "pointer",
                        }}
                      >
                        {savingPrescription ? "Authorizing..." : "Authorize & File Prescription"}
                      </button>
                    </form>
                  </div>

                  {/* Diagnostic condition breakdown */}
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
                    <h4 style={{ margin: "0 0 10px", color: "#1e3a8a", fontSize: 15 }}>Diagnostic Condition Breakdown</h4>
                    {patientDetail.condition_breakdown && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
                        {Object.entries(patientDetail.condition_breakdown).map(([k, v]) => (
                          <div key={k}>
                            <strong>{k}:</strong> <span style={{ color: "#1e3a8a", fontWeight: 600 }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

const tabBtn = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

export default DermatologistDashboard;
