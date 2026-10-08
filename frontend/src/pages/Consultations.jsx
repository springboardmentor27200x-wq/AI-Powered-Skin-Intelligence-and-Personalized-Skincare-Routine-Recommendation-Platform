import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  createConsultationRequest,
} from "../services/api";

import "./Consultations.css";

function Consultations() {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSendRequest = async () => {
    setMessage("");
    setError("");

    if (!selectedRole) {
      setError("Please select a professional.");
      return;
    }

    if (!requestMessage.trim()) {
      setError("Please enter a request message.");
      return;
    }

    try {
      setLoading(true);

      /*
       * Professional ID will be handled automatically
       * by the backend in the next step.
       */
      const result = await createConsultationRequest({
        professional_role: selectedRole,
        request_message: requestMessage.trim(),
      });

      console.log("Consultation request created:", result);

      setMessage(
        "Consultation request sent successfully. The professional will review your request."
      );

      setRequestMessage("");

    } catch (err) {
      console.error("Consultation request error:", err);

      setError(
        err?.detail ||
        err?.message ||
        "Unable to send consultation request."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="consultations-page">

      <div className="consultations-shell">

        {/* BACK BUTTON */}
        <button
          className="consultations-back"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>

        {/* HERO */}
        <div className="consultations-hero">

          <div>
            <span className="consultations-label">
              PROFESSIONAL CARE
            </span>

            <h1>
              Find a Skincare Professional
            </h1>

            <p>
              Connect with skincare consultants and dermatologists
              for professional guidance based on your skin journey.
            </p>
          </div>

          <div className="consultations-hero-icon">
            🩺
          </div>

        </div>

        {/* PROFESSIONAL OPTIONS */}
        <div className="professional-grid">

          {/* CONSULTANT */}
          <article
            className={`professional-card ${
              selectedRole === "consultant"
                ? "professional-card-selected"
                : ""
            }`}
          >

            <div className="professional-icon">
              🧑‍⚕️
            </div>

            <div className="professional-content">

              <span className="professional-role">
                SKINCARE CONSULTANT
              </span>

              <h2>
                Skincare Consultant
              </h2>

              <p>
                Get personalized guidance about skincare routines,
                products, hydration, lifestyle and routine consistency.
              </p>

              <ul>
                <li>Personalized skincare guidance</li>
                <li>Routine recommendations</li>
                <li>Lifestyle and hydration guidance</li>
              </ul>

              <button
                className="professional-button"
                onClick={() => {
                  setSelectedRole("consultant");
                  setMessage("");
                  setError("");
                }}
              >
                Request Consultant
              </button>

            </div>

          </article>

          {/* DERMATOLOGIST */}
          <article
            className={`professional-card ${
              selectedRole === "dermatologist"
                ? "professional-card-selected"
                : ""
            }`}
          >

            <div className="professional-icon">
              👩‍⚕️
            </div>

            <div className="professional-content">

              <span className="professional-role">
                DERMATOLOGIST
              </span>

              <h2>
                Dermatologist
              </h2>

              <p>
                Discuss your skin concerns and receive
                professional dermatology-oriented guidance.
              </p>

              <ul>
                <li>Skin concern discussion</li>
                <li>Professional assessment guidance</li>
                <li>Personalized skincare advice</li>
              </ul>

              <button
                className="professional-button"
                onClick={() => {
                  setSelectedRole("dermatologist");
                  setMessage("");
                  setError("");
                }}
              >
                Request Dermatologist
              </button>

            </div>

          </article>

        </div>

        {/* REQUEST FORM */}
        {selectedRole && (
          <div className="consultation-request-card">

            <div className="request-header">

              <div>
                <span className="consultations-label">
                  CONSULTATION REQUEST
                </span>

                <h2>
                  Request a{" "}
                  {selectedRole === "consultant"
                    ? "Skincare Consultant"
                    : "Dermatologist"}
                </h2>
              </div>

              <div className="request-icon">
                💬
              </div>

            </div>

            {/* REQUEST MESSAGE ONLY */}
            <div className="form-group">

              <label>
                Request Message
              </label>

              <textarea
                rows="6"
                placeholder="Describe your skin concerns or what you would like help with..."
                value={requestMessage}
                onChange={(e) =>
                  setRequestMessage(e.target.value)
                }
              />

            </div>

            {/* ERROR */}
            {error && (
              <div className="consultation-error">
                ❌ {error}
              </div>
            )}

            {/* SUCCESS */}
            {message && (
              <div className="consultation-success">
                ✅ {message}
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="request-actions">

              <button
                className="request-cancel-button"
                onClick={() => {
                  setSelectedRole("");
                  setRequestMessage("");
                  setError("");
                  setMessage("");
                }}
              >
                Cancel
              </button>

              <button
                className="request-send-button"
                onClick={handleSendRequest}
                disabled={loading}
              >
                {loading
                  ? "Sending..."
                  : "Send Consultation Request"}
              </button>

            </div>

          </div>
        )}

        {/* INFORMATION */}
        <div className="consultations-info">

          <span>
            💡
          </span>

          <div>

            <h3>
              Your consultation history
            </h3>

            <p>
              Once a professional accepts your request and
              provides consultation notes and recommendations,
              they will appear in your consultation history
              and dashboard.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Consultations;