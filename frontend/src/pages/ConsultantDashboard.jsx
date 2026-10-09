import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";

function ConsultantDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profiles"); // "profiles" | "prescriptions" | "improvement" | "reports" | "progress" | "recommendations"
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Client Selection & Modal Controls
  const [selectedClient, setSelectedClient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientDetail, setClientDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Recommendation management state
  const [lifestyleAdvice, setLifestyleAdvice] = useState("");
  const [routineAdvice, setRoutineAdvice] = useState("");
  const [savingRec, setSavingRec] = useState(false);
  const [recSuccess, setRecSuccess] = useState("");

  // Prescription creation state
  const [rxMedication, setRxMedication] = useState("");
  const [rxDosage, setRxDosage] = useState("");
  const [rxFrequency, setRxFrequency] = useState("Once daily at bedtime");
  const [rxInstructions, setRxInstructions] = useState("");
  const [rxDuration, setRxDuration] = useState("30");
  const [savingRx, setSavingRx] = useState(false);
  const [rxSuccess, setRxSuccess] = useState("");

  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchClients();
  }, [navigate]);

  const fetchClients = () => {
    setLoading(true);
    axios
      .get("http://127.0.0.1:5000/api/doctor/patients", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const clientList = res.data.patients || [];
        setClients(clientList);
        if (clientList.length > 0 && !selectedClient) {
          setSelectedClient(clientList[0]);
          loadClientDetail(clientList[0].id);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Consultant access required to view this portal.");
      })
      .finally(() => setLoading(false));
  };

  const loadClientDetail = (clientId) => {
    setDetailLoading(true);
    axios
      .get(`http://127.0.0.1:5000/api/doctor/patient/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setClientDetail(res.data);
      })
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  };

  const selectClient = (client, openModal = false) => {
    setSelectedClient(client);
    setIsModalOpen(openModal);
    setRecSuccess("");
    setRxSuccess("");
    loadClientDetail(client.id);
  };

  const handleSaveRecommendation = (e) => {
    e.preventDefault();
    if ((!lifestyleAdvice.trim() && !routineAdvice.trim()) || !selectedClient) return;

    setSavingRec(true);
    setRecSuccess("");
    axios
      .post(
        `http://127.0.0.1:5000/api/doctor/patient/${selectedClient.id}/note`,
        {
          notes: lifestyleAdvice || "Lifestyle & routine consultation provided.",
          routine_adjustment: routineAdvice,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setRecSuccess("Client recommendation saved successfully!");
        setLifestyleAdvice("");
        setRoutineAdvice("");
        loadClientDetail(selectedClient.id);
      })
      .catch(() => {
        alert("Failed to save recommendation.");
      })
      .finally(() => setSavingRec(false));
  };

  const handleCreatePrescription = (e) => {
    e.preventDefault();
    if (!rxMedication.trim() || !selectedClient) return;

    setSavingRx(true);
    setRxSuccess("");
    axios
      .post(
        "http://127.0.0.1:5000/api/doctor/prescription",
        {
          patient_id: selectedClient.id,
          medication: rxMedication,
          dosage: rxDosage || "Standard therapeutic concentration",
          frequency: rxFrequency,
          instructions: rxInstructions || "Apply to clean skin.",
          duration_days: parseInt(rxDuration) || 30,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setRxSuccess("Prescription successfully issued and recorded in client chart!");
        setRxMedication("");
        setRxDosage("");
        setRxInstructions("");
        loadClientDetail(selectedClient.id);
        fetchClients();
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          alert("Your login session has expired. Please log in again.");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }
        alert(err.response?.data?.error || err.response?.data?.msg || "Failed to create prescription.");
      })
      .finally(() => setSavingRx(false));
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.skin_type || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div style={{ maxWidth: 1120, margin: "0 auto", paddingBottom: 60 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28 }}>💼</span>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1b4332", margin: 0 }}>
                Skincare Consultant Portal
              </h1>
            </div>
            <p style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>
              Client profile assessment, improvement score analytics, prescription management, and routine optimization.
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
            Role: {user?.role || "Consultant"}
          </span>
        </div>

        {error ? (
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 14, padding: 24, textAlign: "center" }}>
            <h3 style={{ color: "#991b1b", margin: "0 0 8px" }}>Access Restricted</h3>
            <p style={{ color: "#7f1d1d", fontSize: 14, margin: "0" }}>{error}</p>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div style={{ display: "flex", gap: 10, marginBottom: 24, borderBottom: "2px solid #e5e7eb", paddingBottom: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => setActiveTab("profiles")}
                style={{
                  ...tabBtn,
                  background: activeTab === "profiles" ? "#2d6a4f" : "#f3f4f6",
                  color: activeTab === "profiles" ? "white" : "#374151",
                }}
              >
                👥 Client Profiles ({clients.length})
              </button>
              <button
                onClick={() => setActiveTab("prescriptions")}
                style={{
                  ...tabBtn,
                  background: activeTab === "prescriptions" ? "#2d6a4f" : "#f3f4f6",
                  color: activeTab === "prescriptions" ? "white" : "#374151",
                }}
              >
                💊 Make Prescriptions
              </button>
              <button
                onClick={() => setActiveTab("improvement")}
                style={{
                  ...tabBtn,
                  background: activeTab === "improvement" ? "#2d6a4f" : "#f3f4f6",
                  color: activeTab === "improvement" ? "white" : "#374151",
                }}
              >
                📊 Improvement Score Analysis
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                style={{
                  ...tabBtn,
                  background: activeTab === "reports" ? "#2d6a4f" : "#f3f4f6",
                  color: activeTab === "reports" ? "white" : "#374151",
                }}
              >
                📑 Skin Assessment Reports
              </button>
              <button
                onClick={() => setActiveTab("progress")}
                style={{
                  ...tabBtn,
                  background: activeTab === "progress" ? "#2d6a4f" : "#f3f4f6",
                  color: activeTab === "progress" ? "white" : "#374151",
                }}
              >
                📈 Progress Monitoring
              </button>
              <button
                onClick={() => setActiveTab("recommendations")}
                style={{
                  ...tabBtn,
                  background: activeTab === "recommendations" ? "#2d6a4f" : "#f3f4f6",
                  color: activeTab === "recommendations" ? "white" : "#374151",
                }}
              >
                💡 Recommendation Management
              </button>
            </div>

            {/* Global Search Bar */}
            <div style={{ marginBottom: 20 }}>
              <input
                type="text"
                placeholder="Search clients by name, email, skin type, or condition..."
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

            {/* TAB 1: CLIENT PROFILES */}
            {activeTab === "profiles" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 18 }}>
                  {filteredClients.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        background: "white",
                        borderRadius: 16,
                        padding: 22,
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: 17, color: "#1b4332", fontWeight: 700 }}>{c.name}</h3>
                            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>{c.email}</p>
                          </div>
                          <span
                            style={{
                              background: "#e8f5e9",
                              color: "#166534",
                              fontWeight: 700,
                              fontSize: 13,
                              padding: "4px 10px",
                              borderRadius: 14,
                            }}
                          >
                            Score: {c.latest_score ?? "—"}
                          </span>
                        </div>

                        <div style={{ margin: "14px 0", fontSize: 13, lineHeight: 1.6, color: "#4b5563" }}>
                          <div><strong>Skin Type:</strong> <span style={{ color: "#1b4332", fontWeight: 600 }}>{c.skin_type}</span></div>
                          <div><strong>Age Group:</strong> {c.age_group}</div>
                          <div><strong>Primary Concerns:</strong> {c.skin_concerns}</div>
                          <div><strong>Improvement:</strong> <strong style={{ color: c.improvement_pts >= 0 ? "#16a34a" : "#dc2626" }}>+{c.improvement_pts} pts ({c.improvement_pct}%)</strong></div>
                          <div><strong>Prescriptions on File:</strong> <strong style={{ color: "#2d6a4f" }}>{c.prescription_count || 0} active Rx</strong></div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button
                          onClick={() => selectClient(c, true)}
                          style={{
                            flex: 1,
                            padding: "10px",
                            borderRadius: 10,
                            border: "none",
                            background: "#2d6a4f",
                            color: "white",
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          Inspect File →
                        </button>
                        <button
                          onClick={() => {
                            selectClient(c, false);
                            setActiveTab("prescriptions");
                          }}
                          style={{
                            padding: "10px 14px",
                            borderRadius: 10,
                            border: "1.5px solid #2d6a4f",
                            background: "#f0fdf4",
                            color: "#166534",
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          💊 Prescribe
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: MAKE PRESCRIPTIONS (Direct, No Unwanted Modal Popup) */}
            {activeTab === "prescriptions" && (
              <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, color: "#1b4332", fontSize: 18 }}>Client Prescription Writer</h3>
                    <p style={{ color: "#6b7280", fontSize: 13, margin: "4px 0 0" }}>
                      Select a client and issue therapeutic formulas, application frequencies, and instructions.
                    </p>
                  </div>
                  {selectedClient && (
                    <button
                      onClick={() => selectClient(selectedClient, true)}
                      style={{
                        background: "#f0fdf4",
                        color: "#166534",
                        border: "1px solid #86efac",
                        padding: "8px 14px",
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      View {selectedClient.name}'s Chart
                    </button>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
                  {/* Client Selector List */}
                  <div style={{ borderRight: "1px solid #e2e8f0", paddingRight: 16, maxHeight: 560, overflowY: "auto" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 10 }}>Select Client:</div>
                    {filteredClients.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => selectClient(c, false)}
                        style={{
                          padding: "12px 14px",
                          borderRadius: 10,
                          marginBottom: 8,
                          cursor: "pointer",
                          background: selectedClient?.id === c.id ? "#d8f3dc" : "#f8fafc",
                          border: selectedClient?.id === c.id ? "2px solid #2d6a4f" : "1px solid #e2e8f0",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: "#1b4332" }}>{c.name}</span>
                          <span style={{ background: "#dcfce7", color: "#166534", fontSize: 11, padding: "2px 6px", borderRadius: 6, fontWeight: 700 }}>
                            {c.prescription_count || 0} Rx
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                          {c.skin_type} • Score: {c.latest_score ?? "—"}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Prescription Form */}
                  <div>
                    {selectedClient ? (
                      <form onSubmit={handleCreatePrescription}>
                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <h4 style={{ margin: 0, color: "#1b4332", fontSize: 16 }}>
                                Prescribing for: <strong>{selectedClient.name}</strong>
                              </h4>
                              <span style={{ fontSize: 12, color: "#64748b" }}>
                                {selectedClient.email} • Skin Type: <strong>{selectedClient.skin_type}</strong>
                              </span>
                            </div>
                            <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                              Score: {selectedClient.latest_score ?? "—"}/100
                            </span>
                          </div>
                        </div>

                        {rxSuccess && (
                          <div style={{ background: "#dcfce7", color: "#166534", padding: 12, borderRadius: 10, fontSize: 13, marginBottom: 14, fontWeight: 600 }}>
                            ✓ {rxSuccess}
                          </div>
                        )}

                        <div style={{ marginBottom: 14 }}>
                          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                            Medication / Active Formulation:
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Azelaic Acid 15% Gel, Barrier Recovery Cream, Niacinamide 10%"
                            value={rxMedication}
                            onChange={(e) => setRxMedication(e.target.value)}
                            style={{ width: "100%", padding: 12, borderRadius: 8, border: "1.5px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                            required
                          />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                          <div>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                              Dosage / Concentration:
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Pea-sized amount / 15%"
                              value={rxDosage}
                              onChange={(e) => setRxDosage(e.target.value)}
                              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                              Frequency:
                            </label>
                            <select
                              value={rxFrequency}
                              onChange={(e) => setRxFrequency(e.target.value)}
                              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                            >
                              <option value="Once daily at bedtime">Once daily at bedtime (PM)</option>
                              <option value="Morning application before SPF">Morning application before SPF (AM)</option>
                              <option value="Twice daily (AM & PM)">Twice daily (AM & PM)</option>
                              <option value="Alternate evenings (Mon/Wed/Fri)">Alternate evenings (Mon/Wed/Fri)</option>
                            </select>
                          </div>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                            Clinical Application Instructions:
                          </label>
                          <textarea
                            rows={3}
                            placeholder="e.g. Apply to clean dry skin. Buffer with ceramide moisturizer for first 2 weeks. Avoid eye area."
                            value={rxInstructions}
                            onChange={(e) => setRxInstructions(e.target.value)}
                            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                          />
                        </div>

                        <div style={{ marginBottom: 18 }}>
                          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                            Course Duration (Days):
                          </label>
                          <input
                            type="number"
                            value={rxDuration}
                            onChange={(e) => setRxDuration(e.target.value)}
                            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={savingRx}
                          style={{
                            background: "#2d6a4f",
                            color: "white",
                            padding: "12px 24px",
                            borderRadius: 10,
                            border: "none",
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: savingRx ? "not-allowed" : "pointer",
                            boxShadow: "0 4px 12px rgba(45, 106, 79, 0.25)",
                          }}
                        >
                          {savingRx ? "Filing..." : "Issue & Record Prescription"}
                        </button>
                      </form>
                    ) : (
                      <div style={{ textAlign: "center", padding: 50, color: "#64748b" }}>
                        👈 Select a client from the list on the left to issue official prescriptions.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: IMPROVEMENT SCORE ANALYSIS */}
            {activeTab === "improvement" && (
              <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb" }}>
                <h3 style={{ margin: "0 0 16px", color: "#1b4332", fontSize: 18 }}>Client Improvement Score Analysis</h3>
                <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>
                  Analyze longitudinal progress by comparing each client's initial baseline score with their current skin health score.
                </p>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                        <th style={{ padding: "12px 14px", color: "#334155" }}>Client Name</th>
                        <th style={{ padding: "12px 14px", color: "#334155" }}>Baseline Score</th>
                        <th style={{ padding: "12px 14px", color: "#334155" }}>Current Score</th>
                        <th style={{ padding: "12px 14px", color: "#334155" }}>Improvement Delta (Δ)</th>
                        <th style={{ padding: "12px 14px", color: "#334155" }}>% Improvement</th>
                        <th style={{ padding: "12px 14px", color: "#334155" }}>Clinical Status</th>
                        <th style={{ padding: "12px 14px", color: "#334155" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map((c) => {
                        const isGain = (c.improvement_pts || 0) >= 0;
                        return (
                          <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "12px 14px", fontWeight: 600, color: "#1b4332" }}>{c.name}</td>
                            <td style={{ padding: "12px 14px", color: "#64748b" }}>{c.initial_score ?? 60}/100</td>
                            <td style={{ padding: "12px 14px", fontWeight: 700, color: "#0f172a" }}>{c.latest_score ?? 78}/100</td>
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
                                {isGain ? `+${c.improvement_pts}` : c.improvement_pts} pts
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px", fontWeight: 700, color: isGain ? "#16a34a" : "#dc2626" }}>
                              {isGain ? `+${c.improvement_pct}%` : `${c.improvement_pct}%`}
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <span style={{ background: "#f1f5f9", color: "#334155", padding: "3px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
                                {c.improvement_status || "Evaluating"}
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <button
                                onClick={() => selectClient(c, true)}
                                style={{
                                  background: "#2d6a4f",
                                  color: "white",
                                  border: "none",
                                  padding: "6px 12px",
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                View Breakdown
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

            {/* TAB 2: SKIN ASSESSMENT REPORTS */}
            {activeTab === "reports" && (
              <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb" }}>
                <h3 style={{ margin: "0 0 16px", color: "#1b4332", fontSize: 18 }}>Client Skin Assessment Reports</h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                        <th style={{ padding: "12px 14px", color: "#334155" }}>Client Name</th>
                        <th style={{ padding: "12px 14px", color: "#334155" }}>Skin Type</th>
                        <th style={{ padding: "12px 14px", color: "#334155" }}>Concerns</th>
                        <th style={{ padding: "12px 14px", color: "#334155" }}>Latest Score</th>
                        <th style={{ padding: "12px 14px", color: "#334155" }}>Assessment Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map((c) => (
                        <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 14px", fontWeight: 600, color: "#1b4332" }}>{c.name}</td>
                          <td style={{ padding: "12px 14px" }}>{c.skin_type}</td>
                          <td style={{ padding: "12px 14px", color: "#475569" }}>{c.skin_concerns}</td>
                          <td style={{ padding: "12px 14px", fontWeight: 700, color: "#166534" }}>{c.latest_score ?? "—"}/100</td>
                          <td style={{ padding: "12px 14px" }}>
                            <a
                              href="http://127.0.0.1:5000/api/reports/pdf/skin_assessment"
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                background: "#1b4332",
                                color: "white",
                                padding: "6px 12px",
                                borderRadius: 8,
                                textDecoration: "none",
                                fontSize: 12,
                                fontWeight: 600,
                                display: "inline-block",
                              }}
                            >
                              📥 Download PDF Report
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: PROGRESS MONITORING */}
            {activeTab === "progress" && (
              <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb" }}>
                <h3 style={{ margin: "0 0 16px", color: "#1b4332", fontSize: 18 }}>Client Routine Adherence & Progress Monitoring</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
                  {filteredClients.map((c) => (
                    <div key={c.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 18, background: "#f8fafc" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: "#1b4332" }}>{c.name}</span>
                        <span
                          style={{
                            background: c.adherence_rate >= 80 ? "#dcfce7" : "#fef9c3",
                            color: c.adherence_rate >= 80 ? "#166534" : "#854d0e",
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: 14,
                            fontSize: 12,
                          }}
                        >
                          {c.adherence_rate >= 80 ? "Consistent" : "Needs Follow-up"}
                        </span>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                          <span>Routine Adherence</span>
                          <span>{c.adherence_rate}%</span>
                        </div>
                        <div style={{ width: "100%", height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${c.adherence_rate}%`,
                              height: "100%",
                              background: c.adherence_rate >= 80 ? "#22c55e" : "#eab308",
                            }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => selectClient(c, true)}
                        style={{
                          width: "100%",
                          marginTop: 14,
                          padding: "8px",
                          borderRadius: 8,
                          border: "1px solid #cbd5e1",
                          background: "white",
                          color: "#1e293b",
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        Inspect Progress History →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: RECOMMENDATION MANAGEMENT */}
            {activeTab === "recommendations" && (
              <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb" }}>
                <h3 style={{ margin: "0 0 16px", color: "#1b4332", fontSize: 18 }}>Recommendation Management</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
                  <div style={{ borderRight: "1px solid #e2e8f0", paddingRight: 16, maxHeight: 500, overflowY: "auto" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 10 }}>Select Client:</div>
                    {filteredClients.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => selectClient(c, false)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 10,
                          marginBottom: 8,
                          cursor: "pointer",
                          background: selectedClient?.id === c.id ? "#d8f3dc" : "#f8fafc",
                          border: selectedClient?.id === c.id ? "2px solid #2d6a4f" : "1px solid #e2e8f0",
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#1b4332" }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{c.skin_type} • Score: {c.latest_score ?? "—"}</div>
                      </div>
                    ))}
                  </div>

                  <div>
                    {selectedClient ? (
                      <form onSubmit={handleSaveRecommendation}>
                        <h4 style={{ margin: "0 0 12px", color: "#1b4332", fontSize: 16 }}>
                          Recommendation for {selectedClient.name}
                        </h4>
                        {recSuccess && (
                          <div style={{ background: "#dcfce7", color: "#166534", padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
                            {recSuccess}
                          </div>
                        )}
                        <div style={{ marginBottom: 14 }}>
                          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                            Lifestyle Advice:
                          </label>
                          <textarea
                            rows={3}
                            value={lifestyleAdvice}
                            onChange={(e) => setLifestyleAdvice(e.target.value)}
                            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                            required
                          />
                        </div>
                        <div style={{ marginBottom: 18 }}>
                          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                            Routine Adjustments:
                          </label>
                          <input
                            type="text"
                            value={routineAdvice}
                            onChange={(e) => setRoutineAdvice(e.target.value)}
                            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={savingRec}
                          style={{
                            background: "#2d6a4f",
                            color: "white",
                            padding: "10px 20px",
                            borderRadius: 8,
                            border: "none",
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: savingRec ? "not-allowed" : "pointer",
                          }}
                        >
                          {savingRec ? "Saving..." : "Publish Recommendation"}
                        </button>
                      </form>
                    ) : (
                      <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                        👈 Select a client from the list.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Client Detail Modal (ONLY renders when explicitly opened) ── */}
        {isModalOpen && selectedClient && (
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
                  <h2 style={{ margin: 0, color: "#1b4332", fontSize: 20 }}>
                    Client Profile: {selectedClient.name}
                  </h2>
                  <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
                    {selectedClient.email}
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
                <p style={{ color: "#6b7280" }}>Loading client data...</p>
              ) : clientDetail ? (
                <div>
                  {/* Improvement Score Analysis Card */}
                  {clientDetail.improvement_analysis && (
                    <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 14, padding: 18, marginBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <h4 style={{ margin: 0, color: "#166534", fontSize: 15 }}>
                          📊 Improvement Score Analysis
                        </h4>
                        <span style={{ background: "#166534", color: "white", padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                          {clientDetail.improvement_analysis.status}
                        </span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, fontSize: 13 }}>
                        <div style={{ background: "white", padding: 10, borderRadius: 8 }}>
                          <span style={{ color: "#64748b", fontSize: 11 }}>Baseline Score:</span>
                          <div style={{ fontWeight: 700, fontSize: 16 }}>{clientDetail.improvement_analysis.initial_score}/100</div>
                        </div>
                        <div style={{ background: "white", padding: 10, borderRadius: 8 }}>
                          <span style={{ color: "#64748b", fontSize: 11 }}>Current Score:</span>
                          <div style={{ fontWeight: 700, fontSize: 16, color: "#166534" }}>{clientDetail.improvement_analysis.latest_score}/100</div>
                        </div>
                        <div style={{ background: "white", padding: 10, borderRadius: 8 }}>
                          <span style={{ color: "#64748b", fontSize: 11 }}>Improvement Gain:</span>
                          <div style={{ fontWeight: 800, fontSize: 16, color: "#15803d" }}>
                            +{clientDetail.improvement_analysis.improvement_pts} pts (+{clientDetail.improvement_analysis.improvement_pct}%)
                          </div>
                        </div>
                        <div style={{ background: "white", padding: 10, borderRadius: 8 }}>
                          <span style={{ color: "#64748b", fontSize: 11 }}>Barrier Gain:</span>
                          <div style={{ fontWeight: 700, fontSize: 16, color: "#0369a1" }}>+{clientDetail.improvement_analysis.barrier_gain_pct}%</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Active Prescriptions on File */}
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <h4 style={{ margin: 0, color: "#1b4332", fontSize: 15 }}>Active Prescriptions on File</h4>
                      <span style={{ fontSize: 12, color: "#64748b" }}>{clientDetail.prescriptions?.length || 0} active</span>
                    </div>
                    {clientDetail.prescriptions?.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {clientDetail.prescriptions.map((rx) => (
                          <div key={rx.id} style={{ background: "white", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <strong style={{ color: "#1b4332", fontSize: 14 }}>💊 {rx.medication}</strong>
                              <span style={{ color: "#64748b", fontSize: 11 }}>Issued: {rx.created_at}</span>
                            </div>
                            <div style={{ color: "#475569", marginTop: 4 }}>
                              Dosage: <strong>{rx.dosage}</strong> | Frequency: <strong>{rx.frequency}</strong> | Duration: {rx.duration_days} days
                            </div>
                            {rx.instructions && (
                              <div style={{ color: "#334155", fontStyle: "italic", marginTop: 4 }}>Instructions: {rx.instructions}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>No prescriptions issued yet for this client.</p>
                    )}
                  </div>

                  {/* Prescription Writer Form RIGHT INSIDE MODAL */}
                  <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 14, padding: 18, marginBottom: 18 }}>
                    <h4 style={{ margin: "0 0 12px", color: "#166534", fontSize: 15 }}>
                      💊 Authorize New Prescription for {selectedClient.name}
                    </h4>
                    {rxSuccess && (
                      <div style={{ background: "#dcfce7", color: "#166534", padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 10, fontWeight: 600 }}>
                        ✓ {rxSuccess}
                      </div>
                    )}
                    <form onSubmit={handleCreatePrescription}>
                      <div style={{ marginBottom: 10 }}>
                        <input
                          type="text"
                          placeholder="Medication / Active Formulation (e.g. Azelaic Acid 15% Gel)"
                          value={rxMedication}
                          onChange={(e) => setRxMedication(e.target.value)}
                          style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                          required
                        />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                        <input
                          type="text"
                          placeholder="Dosage (e.g. 15% / Pea-sized amount)"
                          value={rxDosage}
                          onChange={(e) => setRxDosage(e.target.value)}
                          style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                        />
                        <select
                          value={rxFrequency}
                          onChange={(e) => setRxFrequency(e.target.value)}
                          style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                        >
                          <option value="Once daily at bedtime">Once daily at bedtime (PM)</option>
                          <option value="Morning application before SPF">Morning before SPF (AM)</option>
                          <option value="Twice daily (AM & PM)">Twice daily (AM & PM)</option>
                        </select>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <input
                          type="text"
                          placeholder="Clinical Directions / Instructions"
                          value={rxInstructions}
                          onChange={(e) => setRxInstructions(e.target.value)}
                          style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={savingRx}
                        style={{
                          background: "#166534",
                          color: "white",
                          padding: "10px 18px",
                          borderRadius: 8,
                          border: "none",
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: savingRx ? "not-allowed" : "pointer",
                        }}
                      >
                        {savingRx ? "Filing..." : "Issue & Record Prescription"}
                      </button>
                    </form>
                  </div>

                  {/* Diagnostic Profile */}
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
                    <h4 style={{ margin: "0 0 10px", color: "#1b4332", fontSize: 15 }}>Diagnostic Profile & Habits</h4>
                    {clientDetail.profile ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
                        <div><strong>Skin Type:</strong> {clientDetail.profile.skin_type}</div>
                        <div><strong>Age Group:</strong> {clientDetail.profile.age_group}</div>
                        <div><strong>Concerns:</strong> {clientDetail.profile.skin_concerns}</div>
                        <div><strong>Allergies:</strong> {clientDetail.profile.allergies}</div>
                        <div><strong>Sleep:</strong> {clientDetail.profile.sleep_hours} ({clientDetail.profile.sleep_quality})</div>
                        <div><strong>Water:</strong> {clientDetail.profile.water_intake_level}</div>
                      </div>
                    ) : (
                      <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>Client has not completed questionnaire.</p>
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

export default ConsultantDashboard;
