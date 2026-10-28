
import { useEffect, useState } from "react";

const API = "http://localhost:8000";

export default function DermatologistDashboard() {
  const [consultations, setConsultations] = useState([]);
  const [forms, setForms] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submittingId, setSubmittingId] = useState(null);

  async function loadConsultations() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/dermatologist/consultations`,
        { credentials: "include" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not load consultations."
        );
      }

      const items = Array.isArray(data)
        ? data
        : data.consultations || [];
console.log("Consultation data:", items);
console.log("Assessment data:", items.map((item) => ({
  id: item.id,
  assessment: item.assessment,
  age_group: item.assessment?.age_group,
})));
      setConsultations(items);

      setForms((previous) => {
        const next = { ...previous };

        items.forEach((item) => {
          if (!next[item.id]) {
            next[item.id] = {
              recommendations: item.recommendations || "",
              ingredient_guidance: item.ingredient_guidance || "",
              morning_routine: item.morning_routine || "",
              night_routine: item.night_routine || "",
              precautions: item.precautions || "",
              follow_up_notes: item.follow_up_notes || "",
            };
          }
        });

        return next;
      });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConsultations();
  }, []);

  function updateField(id, field, value) {
    setForms((previous) => ({
      ...previous,
      [id]: {
        ...previous[id],
        [field]: value,
      },
    }));
  }

  async function submitAdvice(id) {
    setSubmittingId(id);
    setError("");

    try {
      const response = await fetch(
        `${API}/dermatologist/consultations/${id}/respond`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(forms[id]),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not submit advice."
        );
      }

      alert("Personalized guidance submitted!");
      await loadConsultations();
    } catch (err) {
      alert(err.message || "Could not submit guidance.");
    } finally {
      setSubmittingId(null);
    }
  }

  const completed = consultations.filter(
    (item) => item.status === "completed"
  ).length;

  const fields = [
    {
      name: "recommendations",
      label: "Personalized Recommendations",
      description: "Personalized advice based on the patient's assessment.",
      rows: 4,
    },
    {
      name: "ingredient_guidance",
      label: "Ingredient Guidance",
      description: "Suggested ingredients and their intended purpose.",
      rows: 3,
    },
    {
      name: "morning_routine",
      label: "Morning Routine",
      description: "Recommended morning skincare steps.",
      rows: 3,
    },
    {
      name: "night_routine",
      label: "Night Routine",
      description: "Recommended evening skincare steps.",
      rows: 3,
    },
    {
      name: "precautions",
      label: "Precautions",
      description: "Allergy considerations and relevant precautions.",
      rows: 3,
    },
    {
      name: "follow_up_notes",
      label: "Follow-up Notes",
      description: "Suggested follow-up and monitoring notes.",
      rows: 3,
    },
  ];

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.loadingCard}>
          <div style={styles.spinner} />
          <h2 style={styles.loadingTitle}>
            Preparing your workspace
          </h2>
          <p style={styles.muted}>
            Loading assigned consultations...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <span style={styles.eyebrow}>
            SKINSENSE AI · CLINICAL WORKSPACE
          </span>

          <h1 style={styles.title}>
            Dermatologist Dashboard
          </h1>

          <p style={styles.subtitle}>
            Review assigned patient assessments and provide
            personalized skincare guidance.
          </p>
        </div>

        <button
          type="button"
          style={styles.refreshButton}
          onClick={loadConsultations}
        >
          ↻ Refresh
        </button>
      </header>

      {error && (
        <div style={styles.error}>
          <strong>Something went wrong</strong>
          <p style={{ margin: "6px 0 0" }}>{error}</p>
          <button
            type="button"
            style={styles.errorButton}
            onClick={loadConsultations}
          >
            Try again
          </button>
        </div>
      )}

      <section style={styles.stats}>
        <StatCard
          label="Assigned Consultations"
          value={consultations.length}
          icon="✦"
        />
        <StatCard
          label="Awaiting Guidance"
          value={consultations.length - completed}
          icon="◷"
        />
        <StatCard
          label="Completed"
          value={completed}
          icon="✓"
        />
      </section>

      <div style={styles.sectionHeading}>
        <div>
          <h2 style={styles.sectionTitle}>
            Patient Consultations
          </h2>
          <p style={styles.sectionDescription}>
            Your assigned cases and their assessment details.
          </p>
        </div>

        <span style={styles.countBadge}>
          {consultations.length}{" "}
          {consultations.length === 1 ? "case" : "cases"}
        </span>
      </div>

      {consultations.length === 0 ? (
        <section style={styles.emptyState}>
          <div style={styles.emptyIcon}>♡</div>
          <h3 style={styles.emptyTitle}>
            No consultations assigned yet
          </h3>
          <p style={styles.muted}>
            New patient requests will appear here once a
            consultant assigns them to you.
          </p>
          <button
            type="button"
            style={styles.primaryButton}
            onClick={loadConsultations}
          >
            Refresh consultations
          </button>
        </section>
      ) : (
        consultations.map((item) => {
          const form = forms[item.id] || {};
          const isCompleted = item.status === "completed";
          const isSubmitting = submittingId === item.id;

          return (
            <article key={item.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.patientHeading}>
                  <div style={styles.patientAvatar}>P</div>

                  <div>
                    <span style={styles.caseLabel}>
                      PATIENT CASE
                    </span>
                    <h3 style={styles.patientTitle}>
                      Consultation #{item.id}
                    </h3>
                    <p style={styles.patientId}>
                      Patient ID: {item.user_id}
                    </p>
                  </div>
                </div>

                <span
                  style={{
                    ...styles.statusBadge,
                    ...(isCompleted
                      ? styles.completedBadge
                      : styles.pendingBadge),
                  }}
                >
                  <span style={styles.statusDot}>●</span>
                  {item.status || "Unknown"}
                </span>
              </div>

              <div style={styles.divider} />

              <section style={styles.assessmentSection}>
                <h4 style={styles.subheading}>
                  <span style={styles.headingIcon}>✦</span>
                  Patient Assessment
                </h4>

                <div style={styles.assessmentGrid}>
                  <AssessmentItem
                    label="Skin Type"
                    value={item.assessment?.skin_type}
                  />
                  {/* <AssessmentItem
  label="Age Group"
  value={
    item.assessment?.age_group ||
    item.assessment?.age ||
    "Not available"
  }
/> */}
                  <AssessmentItem
                    label="Skin Concerns"
                    value={item.assessment?.concerns}
                  />
                  <AssessmentItem
                    label="Allergies"
                    value={item.assessment?.allergies}
                  />
                  <AssessmentItem
                    label="Sleep Pattern"
                    value={item.assessment?.sleep}
                  />
                  <AssessmentItem
                    label="Water Intake"
                    value={item.assessment?.water_intake}
                  />
                </div>
              </section>

              <div style={styles.divider} />

              <section style={styles.guidanceSection}>
                <div style={styles.guidanceHeading}>
                  <div>
                    <h4 style={styles.subheading}>
                      Personalized Care Plan
                    </h4>
                    <p style={styles.sectionDescription}>
                      Complete the fields below and submit your
                      professional guidance.
                    </p>
                  </div>

                  {isCompleted && (
                    <span style={styles.savedBadge}>
                      ✓ Submitted
                    </span>
                  )}
                </div>

                <div style={styles.formGrid}>
                  {fields.map((field, index) => (
                    <label
                      key={field.name}
                      style={{
                        ...styles.field,
                        ...(index === 0
                          ? styles.fullWidth
                          : {}),
                        ...(index === 5
                          ? styles.fullWidth
                          : {}),
                      }}
                    >
                      <span style={styles.fieldLabel}>
                        {field.label}
                      </span>

                      <span style={styles.fieldDescription}>
                        {field.description}
                      </span>

                      <textarea
                        rows={field.rows}
                        value={form[field.name] || ""}
                        readOnly={isCompleted}
                        onChange={(e) =>
                          updateField(
                            item.id,
                            field.name,
                            e.target.value
                          )
                        }
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                        style={{
                          ...styles.textarea,
                          ...(isCompleted
                            ? styles.readOnlyTextarea
                            : {}),
                        }}
                      />
                    </label>
                  ))}
                </div>

                {!isCompleted && (
                  <div style={styles.formFooter}>
                    <p style={styles.footerNote}>
                      Please review your entries before submitting.
                    </p>

                    <button
                      type="button"
                      style={{
                        ...styles.primaryButton,
                        ...(isSubmitting
                          ? styles.disabledButton
                          : {}),
                      }}
                      disabled={isSubmitting}
                      onClick={() => submitAdvice(item.id)}
                    >
                      {isSubmitting
                        ? "Submitting guidance..."
                        : "Submit Guidance  →"}
                    </button>
                  </div>
                )}
              </section>
            </article>
          );
        })
      )}
    </main>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <article style={styles.statCard}>
      <div style={styles.statTop}>
        <span style={styles.statLabel}>{label}</span>
        <span style={styles.statIcon}>{icon}</span>
      </div>
      <h2 style={styles.statValue}>{value}</h2>
    </article>
  );
}

function AssessmentItem({ label, value }) {
  let displayValue = value;

  if (Array.isArray(value)) {
    displayValue = value.join(", ");
  } else if (value && typeof value === "object") {
    displayValue = Object.values(value).join(", ");
  }

  return (
    <div style={styles.assessmentItem}>
      <span style={styles.detailLabel}>{label}</span>
      <span style={styles.detailValue}>
        {displayValue === null ||
        displayValue === undefined ||
        displayValue === ""
          ? "Not available"
          : displayValue}
      </span>
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    maxWidth: 1180,
    boxSizing: "border-box",
    margin: "0 auto",
    padding: "42px 28px 64px",
    fontFamily:
      "'Inter', 'Segoe UI', Arial, sans-serif",
    color: "#382630",
    background: "#fcf9f7",
    minHeight: "calc(100vh - 80px)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 22,
    marginBottom: 32,
  },

  eyebrow: {
    display: "inline-block",
    color: "#a35d77",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 2,
    marginBottom: 12,
  },

  title: {
    fontSize: "clamp(26px, 4vw, 36px)",
    lineHeight: 1.2,
    letterSpacing: "-1.1px",
    fontWeight: 750,
    margin: "0 0 12px",
    color: "#422634",
  },

  subtitle: {
    color: "#85747c",
    fontSize: 14,
    lineHeight: 1.8,
    margin: 0,
    maxWidth: 620,
  },

  refreshButton: {
    padding: "12px 18px",
    border: "1px solid #ead6df",
    borderRadius: 10,
    background: "#fff",
    color: "#85445e",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },

  stats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 18,
    marginBottom: 42,
  },

  statCard: {
    padding: "22px 24px",
    border: "1px solid #f0e3e7",
    borderRadius: 16,
    background: "#fff",
    boxShadow: "0 5px 22px rgba(85, 44, 60, 0.035)",
  },

  statTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  statLabel: {
    fontSize: 13,
    lineHeight: 1.5,
    color: "#88747e",
    fontWeight: 600,
  },

  statIcon: {
    display: "grid",
    placeItems: "center",
    width: 36,
    height: 36,
    borderRadius: 11,
    background: "#f9eaf0",
    color: "#984c69",
    fontSize: 19,
  },

  statValue: {
    margin: "17px 0 0",
    color: "#71374e",
    fontSize: 32,
    lineHeight: 1,
    fontWeight: 750,
  },

  sectionHeading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 20,
  },

  sectionTitle: {
    margin: "0 0 7px",
    fontSize: 22,
    letterSpacing: "-0.4px",
    color: "#422634",
  },

  sectionDescription: {
    margin: 0,
    color: "#8c7b83",
    fontSize: 13,
    lineHeight: 1.7,
  },

  countBadge: {
    padding: "8px 13px",
    borderRadius: 30,
    background: "#f6e6ec",
    color: "#8a405c",
    fontSize: 12,
    fontWeight: 750,
  },

  card: {
    marginBottom: 24,
    padding: "26px",
    border: "1px solid #eee0e6",
    borderRadius: 18,
    background: "#fff",
    boxShadow: "0 8px 28px rgba(72, 37, 52, 0.045)",
    boxSizing: "border-box",
    minWidth: 0,
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 18,
  },

  patientHeading: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    minWidth: 0,
  },

  patientAvatar: {
    display: "grid",
    placeItems: "center",
    width: 52,
    height: 52,
    flexShrink: 0,
    borderRadius: 16,
    background: "linear-gradient(145deg, #f8e4eb, #f0d2de)",
    color: "#853f59",
    fontSize: 21,
    fontWeight: 800,
  },

  caseLabel: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1.6,
    color: "#a35d77",
  },

  patientTitle: {
    fontSize: 19,
    margin: "5px 0 4px",
    color: "#442b36",
  },

  patientId: {
    fontSize: 12,
    color: "#91818a",
    margin: 0,
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "8px 12px",
    borderRadius: 30,
    fontSize: 11,
    fontWeight: 750,
    textTransform: "capitalize",
  },

  statusDot: {
    fontSize: 8,
  },

  pendingBadge: {
    background: "#fff2df",
    color: "#98631f",
  },

  completedBadge: {
    background: "#e6f5eb",
    color: "#33764e",
  },

  divider: {
    height: 1,
    background: "#f0e5e9",
    margin: "24px 0",
  },

  assessmentSection: {
    minWidth: 0,
  },

  subheading: {
    margin: "0 0 18px",
    fontSize: 15,
    fontWeight: 750,
    color: "#513443",
  },

  headingIcon: {
    color: "#a45572",
    marginRight: 9,
  },

  assessmentGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 12,
  },

  assessmentItem: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "15px 16px",
    border: "1px solid #f1e6ea",
    borderRadius: 12,
    background: "#fdf9fa",
    minWidth: 0,
    boxSizing: "border-box",
  },

  detailLabel: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#9a7c89",
  },

  detailValue: {
    fontSize: 13,
    lineHeight: 1.65,
    fontWeight: 650,
    color: "#4c3540",
    overflowWrap: "anywhere",
  },

  guidanceSection: {
    minWidth: 0,
  },

  guidanceHeading: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 24,
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
    gap: "22px 24px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: 8,
    minWidth: 0,
    fontWeight: 400,
  },

  fullWidth: {
    gridColumn: "1 / -1",
  },

  fieldLabel: {
    color: "#543543",
    fontSize: 13,
    fontWeight: 750,
    lineHeight: 1.5,
  },

  fieldDescription: {
    color: "#95838c",
    fontSize: 11,
    lineHeight: 1.6,
  },

  textarea: {
    display: "block",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: "14px 15px",
    border: "1px solid #e8d9e0",
    borderRadius: 11,
    background: "#fffdfd",
    color: "#49333e",
    fontFamily: "inherit",
    fontSize: 13,
    lineHeight: 1.7,
    resize: "vertical",
    outline: "none",
  },

  readOnlyTextarea: {
    background: "#f8f4f5",
    color: "#796a72",
    cursor: "default",
  },

  formFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 28,
    paddingTop: 22,
    borderTop: "1px solid #f0e5e9",
  },

  footerNote: {
    margin: 0,
    fontSize: 11,
    lineHeight: 1.7,
    color: "#9a858e",
  },

  primaryButton: {
    padding: "13px 21px",
    border: "1px solid #803e58",
    borderRadius: 10,
    background: "linear-gradient(135deg, #934b68, #71354e)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 750,
    letterSpacing: 0.2,
    cursor: "pointer",
    boxShadow: "0 5px 14px rgba(113, 53, 78, 0.15)",
  },

  disabledButton: {
    opacity: 0.65,
    cursor: "wait",
  },

  savedBadge: {
    padding: "7px 11px",
    borderRadius: 30,
    background: "#e7f5ec",
    color: "#33764e",
    fontSize: 11,
    fontWeight: 750,
  },

  emptyState: {
    padding: "55px 24px",
    textAlign: "center",
    border: "1px dashed #e6cbd6",
    borderRadius: 18,
    background: "#fff",
  },

  emptyIcon: {
    display: "grid",
    placeItems: "center",
    width: 60,
    height: 60,
    margin: "0 auto 18px",
    borderRadius: "50%",
    background: "#f8e9ef",
    color: "#934b68",
    fontSize: 28,
  },

  emptyTitle: {
    margin: "0 0 10px",
    fontSize: 19,
    color: "#513443",
  },

  muted: {
    color: "#8c7b83",
    fontSize: 13,
    lineHeight: 1.7,
  },

  loadingCard: {
    maxWidth: 450,
    margin: "90px auto",
    padding: 35,
    textAlign: "center",
    border: "1px solid #eee0e6",
    borderRadius: 18,
    background: "#fff",
  },

  spinner: {
    width: 30,
    height: 30,
    margin: "0 auto 18px",
    border: "3px solid #f2dce5",
    borderTopColor: "#85445e",
    borderRadius: "50%",
  },

  loadingTitle: {
    fontSize: 19,
    color: "#513443",
  },

  error: {
    marginBottom: 22,
    padding: 17,
    border: "1px solid #f0caca",
    borderRadius: 12,
    background: "#fff5f5",
    color: "#9b3030",
    fontSize: 13,
    lineHeight: 1.6,
  },

  errorButton: {
    marginTop: 10,
    padding: "8px 12px",
    border: "1px solid #e4baba",
    borderRadius: 8,
    background: "#fff",
    color: "#9b3030",
    cursor: "pointer",
  },
};
