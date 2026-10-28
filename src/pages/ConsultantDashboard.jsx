
import { useEffect, useState } from "react";

const API = "http://localhost:8000";

export default function ConsultantDashboard() {
  const [consultations, setConsultations] = useState([]);
  const [dermatologists, setDermatologists] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assigningId, setAssigningId] = useState(null);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [consultRes, dermRes] = await Promise.all([
        fetch(`${API}/admin/consultations`, {
          credentials: "include",
        }),
        fetch(`${API}/admin/dermatologists`, {
          credentials: "include",
        }),
      ]);

      if (!consultRes.ok || !dermRes.ok) {
        throw new Error(
          "Could not load data. Check your login, consultant role, and backend permissions."
        );
      }

      const consultData = await consultRes.json();
      const dermData = await dermRes.json();

      setConsultations(
        Array.isArray(consultData)
          ? consultData
          : consultData.consultations || []
      );

      setDermatologists(
        Array.isArray(dermData)
          ? dermData
          : dermData.dermatologists || []
      );
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function assignConsultation(id) {
    const dermatologistId = assignments[id];

    if (!dermatologistId) {
      alert("Please select a dermatologist.");
      return;
    }

    setAssigningId(id);
    setError("");

    try {
      const response = await fetch(
        `${API}/admin/consultations/${id}/assign`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dermatologist_id: Number(dermatologistId),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Assignment failed.");
      }

      alert("Dermatologist assigned successfully!");
      await loadData();
    } catch (err) {
      setError(err.message || "Could not assign dermatologist.");
    } finally {
      setAssigningId(null);
    }
  }

  const pending = consultations.filter(
    (item) =>
      item.status === "requested" || item.status === "pending"
  ).length;

  const assigned = consultations.filter(
    (item) => item.status === "assigned"
  ).length;

  if (loading) {
    return (
      <main style={styles.page}>
        <p>Loading Consultant Dashboard...</p>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>SKINSENSE AI</p>
          <h1 style={styles.title}>Consultant Dashboard</h1>
          <p style={styles.subtitle}>
            Manage consultation requests and assign dermatologists.
          </p>
        </div>

        <button style={styles.refreshButton} onClick={loadData}>
          Refresh Data
        </button>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      <section style={styles.stats}>
        <StatCard label="Total Requests" value={consultations.length} />
        <StatCard label="Pending Requests" value={pending} />
        <StatCard label="Assigned Requests" value={assigned} />
        <StatCard label="Dermatologists" value={dermatologists.length} />
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Dermatologists</h2>

        {dermatologists.length === 0 ? (
          <p style={styles.muted}>No dermatologist accounts found.</p>
        ) : (
          <div style={styles.doctorGrid}>
            {dermatologists.map((doctor) => (
              <article key={doctor.id} style={styles.doctorCard}>
                <div style={styles.avatar}>
                  {(doctor.name || "D").charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <strong>{doctor.name || "Dermatologist"}</strong>
                  <p style={styles.muted}>{doctor.email}</p>
                  <span style={styles.idLabel}>ID: {doctor.id}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Consultation Requests</h2>

        {consultations.length === 0 ? (
          <p style={styles.muted}>No consultation requests yet.</p>
        ) : (
          consultations.map((item) => {
            const canAssign =
              item.status === "requested" ||
              item.status === "pending";

            return (
              <article key={item.id} style={styles.request}>
                <div style={styles.requestHeader}>
                  <h3 style={styles.requestTitle}>
                    Request #{item.id}
                  </h3>
                  <span
                    style={{
                      ...styles.status,
                      ...(item.status === "assigned"
                        ? styles.assignedStatus
                        : item.status === "completed"
                        ? styles.completedStatus
                        : styles.pendingStatus),
                    }}
                  >
                    {item.status || "unknown"}
                  </span>
                </div>

                <div style={styles.detailsGrid}>
                  <Detail label="User ID" value={item.user_id} />
                  <Detail
                    label="Skin Type"
                    value={item.assessment?.skin_type}
                  />
                  <Detail
                    label="Concerns"
                    value={formatValue(item.assessment?.concerns)}
                  />
                  <Detail
                    label="Allergies"
                    value={formatValue(item.assessment?.allergies)}
                  />
                </div>

                {canAssign ? (
                  <div style={styles.assignRow}>
                    <select
                      style={styles.select}
                      value={assignments[item.id] || ""}
                      onChange={(e) =>
                        setAssignments((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select dermatologist</option>
                      {dermatologists.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.name} — {doctor.email}
                        </option>
                      ))}
                    </select>

                    <button
                      style={styles.assignButton}
                      onClick={() => assignConsultation(item.id)}
                      disabled={
                        assigningId === item.id ||
                        dermatologists.length === 0
                      }
                    >
                      {assigningId === item.id
                        ? "Assigning..."
                        : "Assign Dermatologist"}
                    </button>
                  </div>
                ) : (
                  <p style={styles.muted}>
                    {item.status === "assigned"
                      ? "A dermatologist has been assigned to this request."
                      : "No assignment action available for this status."}
                  </p>
                )}
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <article style={styles.statCard}>
      <p style={styles.statLabel}>{label}</p>
      <h2 style={styles.statValue}>{value}</h2>
    </article>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p style={styles.detailLabel}>{label}</p>
      <p style={styles.detailValue}>
        {value === null || value === undefined || value === ""
          ? "Not available"
          : value}
      </p>
    </div>
  );
}

function formatValue(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") {
    return Object.values(value).join(", ");
  }
  return value;
}

const styles = {
  page: {
    maxWidth: 1150,
    margin: "32px auto",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
    color: "#35252c",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 28,
  },
  eyebrow: {
    color: "#9b536b",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 2,
  },
  title: {
    fontSize: 30,
    margin: "8px 0",
  },
  subtitle: {
    color: "#796b72",
    marginTop: 8,
  },
  refreshButton: {
    padding: "11px 18px",
    border: "1px solid #d9b9c5",
    borderRadius: 9,
    background: "#fff8fa",
    color: "#793d54",
    cursor: "pointer",
    fontWeight: 600,
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 16,
    marginBottom: 28,
  },
  statCard: {
    padding: 22,
    border: "1px solid #f0dfe5",
    borderRadius: 14,
    background: "#fffafb",
  },
  statLabel: {
    margin: 0,
    color: "#806d75",
    fontSize: 14,
  },
  statValue: {
    margin: "12px 0 0",
    fontSize: 30,
    color: "#813f58",
  },
  section: {
    padding: 24,
    marginBottom: 24,
    border: "1px solid #eee2e7",
    borderRadius: 16,
    background: "#ffffff",
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: 20,
    fontSize: 21,
  },
  doctorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: 14,
  },
  doctorCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: 16,
    border: "1px solid #f0e4e9",
    borderRadius: 12,
    background: "#fffafb",
  },
  avatar: {
    width: 42,
    height: 42,
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    background: "#f3dce5",
    color: "#813f58",
    fontWeight: 700,
  },
  idLabel: {
    color: "#9a7d89",
    fontSize: 12,
  },
  request: {
    padding: 20,
    marginBottom: 16,
    border: "1px solid #eee2e7",
    borderRadius: 13,
    background: "#fffdfd",
  },
  requestHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  requestTitle: {
    margin: 0,
    fontSize: 18,
  },
  status: {
    padding: "6px 11px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    textTransform: "capitalize",
  },
  pendingStatus: {
    background: "#fff0d8",
    color: "#8b5b16",
  },
  assignedStatus: {
    background: "#e8e5ff",
    color: "#51439b",
  },
  completedStatus: {
    background: "#e1f5e9",
    color: "#256746",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: 18,
  },
  detailLabel: {
    margin: "0 0 6px",
    fontSize: 12,
    color: "#927b85",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    margin: 0,
    fontWeight: 600,
    overflowWrap: "anywhere",
  },
  assignRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 22,
  },
  select: {
    flex: "1 1 260px",
    minWidth: 0,
    padding: 12,
    border: "1px solid #dfc9d2",
    borderRadius: 9,
    background: "#ffffff",
    color: "#35252c",
  },
  assignButton: {
    padding: "12px 18px",
    border: "none",
    borderRadius: 9,
    background: "#843f59",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 600,
  },
  muted: {
    color: "#8b7b82",
    fontSize: 14,
  },
  error: {
    padding: 14,
    marginBottom: 20,
    borderRadius: 9,
    background: "#fff0f0",
    color: "#a12626",
  },
};
