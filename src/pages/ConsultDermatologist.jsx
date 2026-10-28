import { useEffect, useState } from "react";

const API = "http://localhost:8000";

export default function ConsultDermatologist() {
  const [assessment, setAssessment] = useState({});
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("skinsenseAssessmentData");
      if (saved) setAssessment(JSON.parse(saved));
    } catch (err) {
      console.error("Could not load assessment", err);
    }

    loadConsultations();
  }, []);

  async function loadConsultations() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/consultations/my`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError("Please log in again to view your consultations.");
        } else {
          setError("Could not load consultations. Please try again.");
        }
        return;
      }

      const data = await response.json();
      setConsultations(Array.isArray(data) ? data : data.consultations || []);
    } catch (err) {
      console.error("Consultation loading error:", err);
      setError("Cannot connect to the SkinSense server.");
    } finally {
      setLoading(false);
    }
  }

  async function requestConsultation() {
    setSubmitting(true);
    setError("");
    setSuccess("");

    if (!assessment.skinType || !assessment.concerns?.length) {
      setError("Please complete your skin assessment before requesting a review.");
      setSubmitting(false);
      return;
    }

    const payload = {
      skin_type: assessment.skinType,
      concerns: Array.isArray(assessment.concerns)
        ? assessment.concerns.join(", ")
        : assessment.concerns,
      age_group: assessment.ageGroup || "",
      allergies: assessment.allergies || "Not provided",
      exercise: assessment.exercise || "",
      stress: assessment.stress || "",
      sun_exposure: assessment.sunExposure || "",
      pollution_exposure: assessment.pollutionExposure || "",
      environment: assessment.environment || "",
      sleep: assessment.sleep || "",
      water_intake: assessment.water || "",
    };

    try {
      const response = await fetch(`${API}/consultations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(
          data.detail ||
            "Could not submit the request. Please check your login and try again."
        );
        return;
      }

      setSuccess("Your consultation request was submitted successfully.");
      await loadConsultations();
    } catch (err) {
      console.error("Consultation request error:", err);
      setError("Cannot connect to the SkinSense server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="app-page" style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1>Consult a Dermatologist 👩‍⚕️</h1>
      <p>
        Request a professional review of your skin assessment and receive
        personalized guidance.
      </p>

      <section style={{ padding: 20, border: "1px solid #e5dce8", borderRadius: 16, marginTop: 24 }}>
        <h2>Your skin assessment</h2>
        <p><strong>Skin type:</strong> {assessment.skinType || "Not completed"}</p>
        <p>
          <strong>Concerns:</strong>{" "}
          {assessment.concerns?.length
            ? assessment.concerns.join(", ")
            : "Not provided"}
        </p>
        <p><strong>Allergies:</strong> {assessment.allergies || "Not provided"}</p>

        <button
          type="button"
          onClick={requestConsultation}
          disabled={submitting || loading}
          style={{
            padding: "12px 20px",
            border: 0,
            borderRadius: 10,
            cursor: submitting || loading ? "not-allowed" : "pointer",
            background: "#7c3f68",
            color: "white",
            fontWeight: 600,
          }}
        >
          {submitting ? "Submitting..." : "Request Dermatologist Review"}
        </button>
      </section>

      {error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}
      {success && <p role="status" style={{ color: "#167647" }}>{success}</p>}

      <section style={{ marginTop: 32 }}>
        <h2>My consultation requests</h2>

        {loading ? (
          <p>Loading your requests...</p>
        ) : consultations.length === 0 ? (
          <p>No consultation requests found yet.</p>
        ) : (
          consultations.map((item) => (
            <article
              key={item.id}
              style={{
                padding: 18,
                border: "1px solid #e5dce8",
                borderRadius: 12,
                marginBottom: 14,
              }}
            >
              <p><strong>Request:</strong> #{item.id}</p>
              <p><strong>Status:</strong> {item.status || "Pending"}</p>
              {item.dermatologist_name && (
                <p><strong>Dermatologist:</strong> {item.dermatologist_name}</p>
              )}
              {item.recommendations && (
                <p><strong>Recommendations:</strong> {item.recommendations}</p>
              )}
              {item.ingredient_guidance && (
                <p><strong>Ingredient guidance:</strong> {item.ingredient_guidance}</p>
              )}
              {item.morning_routine && (
                <p><strong>Morning routine:</strong> {item.morning_routine}</p>
              )}
              {item.night_routine && (
                <p><strong>Night routine:</strong> {item.night_routine}</p>
              )}
              {item.precautions && (
                <p><strong>Precautions:</strong> {item.precautions}</p>
              )}
              {item.follow_up_notes && (
                <p><strong>Follow-up:</strong> {item.follow_up_notes}</p>
              )}
            </article>
          ))
        )}
      </section>
    </main>
  );
}