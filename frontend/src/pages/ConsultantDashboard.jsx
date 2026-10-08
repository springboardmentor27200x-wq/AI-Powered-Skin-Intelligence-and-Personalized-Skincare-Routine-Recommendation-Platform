import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

import {
  getAllPatients,
  getSkinProfile,
  getLifestyle,
  getSleep,
  getClientConsultations,
  getSkinAssessment,

  // Consultation request APIs
  getReceivedConsultationRequests,
  acceptConsultationRequest,
  rejectConsultationRequest,
  respondToConsultationRequest,
} from "../services/api";

import "./ConsultantDashboard.css";

function ConsultantDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // =========================================
  // CLIENT DATA
  // =========================================

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================
  // CONSULTATION REQUESTS
  // =========================================

  const [consultationRequests, setConsultationRequests] =
    useState([]);

  const [requestsLoading, setRequestsLoading] =
    useState(true);

  const [requestsError, setRequestsError] =
    useState("");

  const [processingRequestId, setProcessingRequestId] =
    useState(null);

  const [selectedRequest, setSelectedRequest] =
    useState(null);

  const [requestNotes, setRequestNotes] =
    useState("");

  const [requestRecommendations, setRequestRecommendations] =
    useState("");

  const [requestResponseMessage, setRequestResponseMessage] =
    useState("");

  const [requestResponseError, setRequestResponseError] =
    useState("");

  const [respondingToRequest, setRespondingToRequest] =
    useState(false);

  // =========================================
  // DASHBOARD STATISTICS
  // =========================================

  const [skinProfileCount, setSkinProfileCount] =
    useState(0);

  const [lifestyleCount, setLifestyleCount] =
    useState(0);

  const [sleepCount, setSleepCount] =
    useState(0);

  const [assessmentCount, setAssessmentCount] =
    useState(0);

  // =========================================
  // SEARCH
  // =========================================

  const [searchTerm, setSearchTerm] =
    useState("");

  // =========================================
  // SELECTED CLIENT
  // =========================================

  const [selectedPatient, setSelectedPatient] =
    useState(null);

  const [skinProfile, setSkinProfile] =
    useState(null);

  const [lifestyle, setLifestyle] =
    useState(null);

  const [sleep, setSleep] =
    useState(null);

  const [assessment, setAssessment] =
    useState(null);

  const [profileLoading, setProfileLoading] =
    useState(false);

  const [profileError, setProfileError] =
    useState("");

  // =========================================
  // CONSULTATION HISTORY
  // =========================================

  const [consultations, setConsultations] =
    useState([]);

  const [consultationLoading, setConsultationLoading] =
    useState(false);

  // =========================================
  // LOAD ALL CLIENTS
  // =========================================

  useEffect(() => {
    const loadPatients = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getAllPatients();

        const patientList = Array.isArray(data)
          ? data
          : [];

        setPatients(patientList);

        let skinProfiles = 0;
        let lifestyleRecords = 0;
        let sleepRecords = 0;
        let assessments = 0;

        await Promise.all(
          patientList.map(async (patient) => {
            // ---------------------------------
            // SKIN PROFILE
            // ---------------------------------

            try {
              const profile =
                await getSkinProfile(patient.id);

              if (profile) {
                skinProfiles++;
              }
            } catch {
              // No skin profile
            }

            // ---------------------------------
            // LIFESTYLE
            // ---------------------------------

            try {
              const lifestyleData =
                await getLifestyle(patient.id);

              if (
                Array.isArray(lifestyleData) &&
                lifestyleData.length > 0
              ) {
                lifestyleRecords++;
              }
            } catch {
              // No lifestyle data
            }

            // ---------------------------------
            // SLEEP
            // ---------------------------------

            try {
              const sleepData =
                await getSleep(patient.id);

              if (
                Array.isArray(sleepData) &&
                sleepData.length > 0
              ) {
                sleepRecords++;
              }
            } catch {
              // No sleep data
            }

            // ---------------------------------
            // AI SKIN ASSESSMENT
            // ---------------------------------

            try {
              const assessmentData =
                await getSkinAssessment(patient.id);

              if (assessmentData) {
                assessments++;
              }
            } catch {
              // No assessment
            }
          })
        );

        setSkinProfileCount(skinProfiles);
        setLifestyleCount(lifestyleRecords);
        setSleepCount(sleepRecords);
        setAssessmentCount(assessments);
      } catch (err) {
        console.error(
          "Failed to load consultant data:",
          err
        );

        setError(
          err.message ||
            "Failed to load consultant dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

  // =========================================
  // LOAD CONSULTATION REQUESTS
  // =========================================

  const loadConsultationRequests = async () => {
    try {
      setRequestsLoading(true);
      setRequestsError("");

      const data =
        await getReceivedConsultationRequests();

      const requests = Array.isArray(data)
        ? data
        : [];

      setConsultationRequests(requests);
    } catch (err) {
      console.error(
        "Failed to load consultation requests:",
        err
      );

      setRequestsError(
        err.message ||
          "Failed to load consultation requests"
      );
    } finally {
      setRequestsLoading(false);
    }
  };

  // =========================================
  // LOAD REQUESTS ON PAGE LOAD
  // =========================================

  useEffect(() => {
    loadConsultationRequests();
  }, []);

  // =========================================
  // SEARCH CLIENTS
  // =========================================

  const filteredPatients = useMemo(() => {
    const search = searchTerm
      .toLowerCase()
      .trim();

    if (!search) {
      return patients;
    }

    return patients.filter((patient) => {
      return (
        patient.name
          ?.toLowerCase()
          .includes(search) ||
        patient.email
          ?.toLowerCase()
          .includes(search)
      );
    });
  }, [patients, searchTerm]);

  // =========================================
  // PENDING REQUEST COUNT
  // =========================================

  const pendingRequests = useMemo(() => {
    return consultationRequests.filter(
      (request) =>
        request.status === "pending"
    );
  }, [consultationRequests]);

  // =========================================
  // ACCEPT CONSULTATION REQUEST
  // =========================================

  const handleAcceptRequest = async (request) => {
    try {
      setProcessingRequestId(request.id);
      setRequestsError("");
      setRequestResponseMessage("");

      await acceptConsultationRequest(
        request.id
      );

      setRequestResponseMessage(
        "Consultation request accepted successfully."
      );

      await loadConsultationRequests();
    } catch (err) {
      console.error(
        "Failed to accept consultation request:",
        err
      );

      setRequestsError(
        err.message ||
          "Failed to accept consultation request"
      );
    } finally {
      setProcessingRequestId(null);
    }
  };

  // =========================================
  // REJECT CONSULTATION REQUEST
  // =========================================

  const handleRejectRequest = async (request) => {
    const confirmed = window.confirm(
      "Are you sure you want to reject this consultation request?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingRequestId(request.id);
      setRequestsError("");
      setRequestResponseMessage("");

      await rejectConsultationRequest(
        request.id
      );

      setRequestResponseMessage(
        "Consultation request rejected."
      );

      await loadConsultationRequests();
    } catch (err) {
      console.error(
        "Failed to reject consultation request:",
        err
      );

      setRequestsError(
        err.message ||
          "Failed to reject consultation request"
      );
    } finally {
      setProcessingRequestId(null);
    }
  };

  // =========================================
  // OPEN RESPONSE FORM
  // =========================================

  const handleOpenRequestResponse = (
    request
  ) => {
    setSelectedRequest(request);

    setRequestNotes("");
    setRequestRecommendations("");

    setRequestResponseMessage("");
    setRequestResponseError("");
  };

  // =========================================
  // CLOSE RESPONSE FORM
  // =========================================

  const closeRequestResponse = () => {
    setSelectedRequest(null);

    setRequestNotes("");
    setRequestRecommendations("");

    setRequestResponseMessage("");
    setRequestResponseError("");
  };

  // =========================================
  // RESPOND TO CONSULTATION REQUEST
  // =========================================

  const handleRespondToRequest = async () => {
    if (!selectedRequest) {
      return;
    }

    if (!requestNotes.trim()) {
      setRequestResponseError(
        "Please enter consultation notes."
      );
      return;
    }

    if (!requestRecommendations.trim()) {
      setRequestResponseError(
        "Please enter recommendations."
      );
      return;
    }

    try {
      setRespondingToRequest(true);
      setRequestResponseError("");
      setRequestResponseMessage("");

      await respondToConsultationRequest(
        selectedRequest.id,
        {
          notes: requestNotes.trim(),
          recommendations:
            requestRecommendations.trim(),
        }
      );

      setRequestResponseMessage(
        "Consultation response submitted successfully."
      );

      setRequestNotes("");
      setRequestRecommendations("");

      await loadConsultationRequests();

      setTimeout(() => {
        closeRequestResponse();
      }, 1000);
    } catch (err) {
      console.error(
        "Failed to respond to consultation request:",
        err
      );

      setRequestResponseError(
        err.message ||
          "Failed to submit consultation response"
      );
    } finally {
      setRespondingToRequest(false);
    }
  };

  // =========================================
  // LOAD CONSULTATION HISTORY
  // =========================================

  const loadConsultations = async (clientId) => {
    try {
      setConsultationLoading(true);

      const data =
        await getClientConsultations(clientId);

      setConsultations(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "Failed to load consultations:",
        err
      );

      setConsultations([]);
    } finally {
      setConsultationLoading(false);
    }
  };

  // =========================================
  // OPEN CLIENT DETAILS
  // =========================================

  const handleViewClient = async (patient) => {
    try {
      setSelectedPatient(patient);

      // Reset previous client data
      setSkinProfile(null);
      setLifestyle(null);
      setSleep(null);
      setAssessment(null);

      setConsultations([]);

      setProfileError("");
      setProfileLoading(true);

      // ---------------------------------------
      // LOAD CLIENT DATA
      // ---------------------------------------

      const [
        skinData,
        lifestyleData,
        sleepData,
        assessmentData,
      ] = await Promise.all([
        getSkinProfile(patient.id).catch(
          () => null
        ),

        getLifestyle(patient.id).catch(
          () => []
        ),

        getSleep(patient.id).catch(
          () => []
        ),

        getSkinAssessment(patient.id).catch(
          () => null
        ),
      ]);

      setSkinProfile(skinData);
      setAssessment(assessmentData);

      // ---------------------------------------
      // GET LATEST LIFESTYLE
      // ---------------------------------------

      const latestLifestyle =
        Array.isArray(lifestyleData) &&
        lifestyleData.length > 0
          ? lifestyleData[
              lifestyleData.length - 1
            ]
          : null;

      // ---------------------------------------
      // GET LATEST SLEEP
      // ---------------------------------------

      const latestSleep =
        Array.isArray(sleepData) &&
        sleepData.length > 0
          ? sleepData[
              sleepData.length - 1
            ]
          : null;

      setLifestyle(latestLifestyle);
      setSleep(latestSleep);

      // ---------------------------------------
      // LOAD CONSULTATION HISTORY
      // ---------------------------------------

      await loadConsultations(patient.id);
    } catch (err) {
      console.error(
        "Failed to load client details:",
        err
      );

      setProfileError(
        err.message ||
          "Failed to load client details"
      );
    } finally {
      setProfileLoading(false);
    }
  };

  // =========================================
  // CLOSE CLIENT MODAL
  // =========================================

  const closeClient = () => {
    setSelectedPatient(null);

    setSkinProfile(null);
    setLifestyle(null);
    setSleep(null);
    setAssessment(null);

    setConsultations([]);

    setProfileError("");
  };

  // =========================================
  // STRESS TEXT
  // =========================================

  const getStressText = (level) => {
    if (
      level === null ||
      level === undefined
    ) {
      return "Not available";
    }

    if (level >= 7) {
      return "High";
    }

    if (level >= 4) {
      return "Moderate";
    }

    return "Low";
  };

  // =========================================
  // SLEEP QUALITY TEXT
  // =========================================

  const getSleepQualityText = (quality) => {
    if (
      quality === null ||
      quality === undefined
    ) {
      return "Not available";
    }

    if (quality >= 8) {
      return "Good";
    }

    if (quality >= 5) {
      return "Average";
    }

    return "Poor";
  };

  // =========================================
  // WELLNESS STATUS
  // =========================================

  const getWellnessStatus = () => {
    if (!lifestyle && !sleep) {
      return {
        text: "No wellness data",
        className: "wellness-neutral",
      };
    }

    if (
      lifestyle?.stress_level >= 7 ||
      sleep?.sleep_quality <= 4
    ) {
      return {
        text: "Needs attention",
        className: "wellness-warning",
      };
    }

    if (
      lifestyle?.stress_level >= 4 ||
      sleep?.sleep_quality <= 7
    ) {
      return {
        text: "Moderate",
        className: "wellness-moderate",
      };
    }

    return {
      text: "Good",
      className: "wellness-good",
    };
  };

  const wellnessStatus =
    getWellnessStatus();

  // =========================================
  // FORMAT DATE
  // =========================================

  const formatDate = (dateString) => {
    if (!dateString) {
      return "Date unavailable";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleString();
  };

  // =========================================
  // GET USER NAME
  // =========================================

  const consultantName =
    user?.name ||
    user?.user?.name ||
    "Consultant";

  // =========================================
  // DASHBOARD
  // =========================================

  return (
    <div className="consultant-dashboard">

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="consultant-header">

        <div>

          <p className="consultant-label">
            SKIN CONSULTANT PORTAL
          </p>

          <h1>
            Welcome, {consultantName} 👋
          </h1>

          <p>
            Monitor client wellness and provide
            personalized skincare guidance.
          </p>

        </div>

        <div className="consultant-header-actions">

          <button
            className="consultant-home-btn"
            onClick={() =>
              navigate("/consultant")
            }
          >
            Dashboard
          </button>

          <button
            className="logout-btn"
            onClick={logout}
          >
            Logout
          </button>

        </div>

      </header>


      {/* ==================================================
          QUICK NAVIGATION
      ================================================== */}

      <section className="consultant-quick-nav">

        <button
          onClick={() =>
            document
              .getElementById("requests-section")
              ?.scrollIntoView({
                behavior: "smooth",
              })
          }
        >
          📩
          <span>
            Requests
            {pendingRequests.length > 0 && (
              <strong className="request-count-badge">
                {pendingRequests.length}
              </strong>
            )}
          </span>
        </button>

        <button
          onClick={() =>
            document
              .getElementById("clients-section")
              ?.scrollIntoView({
                behavior: "smooth",
              })
          }
        >
          👥
          <span>Clients</span>
        </button>

        <button
          onClick={() =>
            navigate("/analytics")
          }
        >
          📊
          <span>Analytics</span>
        </button>

        <button
          onClick={() =>
            navigate("/progress")
          }
        >
          📈
          <span>Progress</span>
        </button>

        <button
          onClick={() =>
            navigate("/routine-adherence")
          }
        >
          ✓
          <span>Routine Adherence</span>
        </button>

      </section>


      {/* ==================================================
          DASHBOARD STATISTICS
      ================================================== */}

      <section className="consultant-stats">

        {/* TOTAL CLIENTS */}

        <div className="consultant-stat-card">

          <div className="consultant-stat-icon">
            👥
          </div>

          <div>

            <span>Total Clients</span>

            <strong>
              {loading
                ? "..."
                : patients.length}
            </strong>

          </div>

        </div>


        {/* PENDING REQUESTS */}

        <div className="consultant-stat-card">

          <div className="consultant-stat-icon">
            📩
          </div>

          <div>

            <span>Pending Requests</span>

            <strong>
              {requestsLoading
                ? "..."
                : pendingRequests.length}
            </strong>

          </div>

        </div>


        {/* SKIN PROFILES */}

        <div className="consultant-stat-card">

          <div className="consultant-stat-icon">
            🧴
          </div>

          <div>

            <span>Skin Profiles</span>

            <strong>
              {loading
                ? "..."
                : skinProfileCount}
            </strong>

          </div>

        </div>


        {/* LIFESTYLE */}

        <div className="consultant-stat-card">

          <div className="consultant-stat-icon">
            🌿
          </div>

          <div>

            <span>Lifestyle Records</span>

            <strong>
              {loading
                ? "..."
                : lifestyleCount}
            </strong>

          </div>

        </div>


        {/* SLEEP */}

        <div className="consultant-stat-card">

          <div className="consultant-stat-icon">
            😴
          </div>

          <div>

            <span>Sleep Records</span>

            <strong>
              {loading
                ? "..."
                : sleepCount}
            </strong>

          </div>

        </div>


        {/* AI ASSESSMENTS */}

        <div className="consultant-stat-card">

          <div className="consultant-stat-icon">
            ✨
          </div>

          <div>

            <span>AI Assessments</span>

            <strong>
              {loading
                ? "..."
                : assessmentCount}
            </strong>

          </div>

        </div>

      </section>


      {/* ==================================================
          CONSULTATION REQUESTS
      ================================================== */}

      <section
        className="consultant-card consultation-requests-section"
        id="requests-section"
      >

        <div className="consultant-card-header">

          <div>

            <p className="consultant-label">
              CONSULTATION REQUESTS
            </p>

            <h2>
              Client Requests
            </h2>

            <p>
              Review consultation requests assigned
              to you and respond to your clients.
            </p>

          </div>

          <button
            className="consultant-home-btn"
            onClick={loadConsultationRequests}
            disabled={requestsLoading}
          >
            {requestsLoading
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>

        </div>


        {/* SUCCESS MESSAGE */}

        {requestResponseMessage && (
          <div className="consultation-success">
            <span>✓</span>
            {requestResponseMessage}
          </div>
        )}


        {/* ERROR MESSAGE */}

        {requestsError && (
          <div className="consultation-form-error">
            <span>⚠</span>
            {requestsError}
          </div>
        )}


        {/* LOADING */}

        {requestsLoading ? (

          <div className="consultant-loading">

            <div className="consultant-loading-icon">
              ⏳
            </div>

            <p>
              Loading consultation requests...
            </p>

          </div>

        ) : consultationRequests.length === 0 ? (

          <div className="consultant-empty">

            <div className="consultant-empty-icon">
              📩
            </div>

            <h3>
              No consultation requests
            </h3>

            <p>
              New client consultation requests
              will appear here.
            </p>

          </div>

        ) : (

          <div className="consultation-request-list">

            {consultationRequests.map(
              (request) => (

                <div
                  className="consultation-request-card"
                  key={request.id}
                >

                  {/* REQUEST HEADER */}

                  <div className="consultation-request-header">

                    <div className="consultation-request-client">

                      <div className="consultant-avatar">
                        {request.client_name
                          ? request.client_name
                              .charAt(0)
                              .toUpperCase()
                          : "U"}
                      </div>

                      <div>

                        <h3>
                          {request.client_name ||
                            `Client #${request.client_id}`}
                        </h3>

                        <p>
                          Consultation Request
                        </p>

                      </div>

                    </div>


                    <span
                      className={`consultation-status consultation-status-${request.status}`}
                    >
                      {request.status}
                    </span>

                  </div>


                  {/* REQUEST DETAILS */}

                  <div className="consultation-request-details">

                    <div>
                      <span>Request ID</span>
                      <strong>
                        #{request.id}
                      </strong>
                    </div>

                    <div>
                      <span>Client ID</span>
                      <strong>
                        #{request.client_id}
                      </strong>
                    </div>

                    <div>
                      <span>Requested Role</span>
                      <strong>
                        {request.professional_role ||
                          "Consultant"}
                      </strong>
                    </div>

                    <div>
                      <span>Requested On</span>
                      <strong>
                        {formatDate(
                          request.created_at
                        )}
                      </strong>
                    </div>

                  </div>


                  {/* REQUEST MESSAGE */}

                  <div className="consultation-request-message">

                    <span>
                      CLIENT MESSAGE
                    </span>

                    <p>
                      {request.request_message ||
                        "No message provided."}
                    </p>

                  </div>


                  {/* ACTIONS */}

                  {request.status === "pending" && (

                    <div className="consultation-request-actions">

                      <button
                        className="consultation-reject-btn"
                        onClick={() =>
                          handleRejectRequest(
                            request
                          )
                        }
                        disabled={
                          processingRequestId ===
                          request.id
                        }
                      >
                        {processingRequestId ===
                        request.id
                          ? "Processing..."
                          : "✕ Reject"}
                      </button>

                      <button
                        className="consultation-accept-btn"
                        onClick={() =>
                          handleAcceptRequest(
                            request
                          )
                        }
                        disabled={
                          processingRequestId ===
                          request.id
                        }
                      >
                        {processingRequestId ===
                        request.id
                          ? "Processing..."
                          : "✓ Accept"}
                      </button>

                    </div>

                  )}


                  {/* ACCEPTED */}

                  {request.status === "accepted" && (

                    <div className="consultation-request-actions">

                      <button
                        className="consultation-respond-btn"
                        onClick={() =>
                          handleOpenRequestResponse(
                            request
                          )
                        }
                      >
                        ✍️ Write Response
                      </button>

                    </div>

                  )}


                  {/* COMPLETED */}

                  {request.status === "completed" && (

                    <div className="consultation-completed-message">
                      ✓ Consultation response completed
                    </div>

                  )}

                  {/* REJECTED */}

                  {request.status === "rejected" && (

                    <div className="consultation-rejected-message">
                      Request rejected
                    </div>

                  )}

                </div>

              )
            )}

          </div>

        )}

      </section>


      {/* ==================================================
          RESPONSE MODAL
      ================================================== */}

      {selectedRequest && (

        <div
          className="consultant-modal-overlay"
          onClick={closeRequestResponse}
        >

          <div
            className="consultant-modal consultation-response-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="consultation-response-header">

              <div>

                <span className="consultant-profile-eyebrow">
                  CONSULTATION RESPONSE
                </span>

                <h2>
                  Respond to Client
                </h2>

                <p>
                  Request #{selectedRequest.id}
                </p>

              </div>

              <button
                className="consultant-close-btn"
                onClick={closeRequestResponse}
              >
                ×
              </button>

            </div>


            <div className="consultation-response-client">

              <div className="consultant-avatar">
                {selectedRequest.client_name
                  ? selectedRequest.client_name
                      .charAt(0)
                      .toUpperCase()
                  : "U"}
              </div>

              <div>

                <strong>
                  {selectedRequest.client_name ||
                    `Client #${selectedRequest.client_id}`}
                </strong>

                <p>
                  {selectedRequest.request_message ||
                    "No request message."}
                </p>

              </div>

            </div>


            {requestResponseMessage && (

              <div className="consultation-success">
                <span>✓</span>
                {requestResponseMessage}
              </div>

            )}


            {requestResponseError && (

              <div className="consultation-form-error">
                <span>⚠</span>
                {requestResponseError}
              </div>

            )}


            <div className="consultation-form-group">

              <label htmlFor="request-notes">
                Consultation Notes
              </label>

              <textarea
                id="request-notes"
                rows="6"
                placeholder="Enter your observations, consultation findings, skin concerns, and professional notes..."
                value={requestNotes}
                onChange={(event) =>
                  setRequestNotes(
                    event.target.value
                  )
                }
              />

            </div>


            <div className="consultation-form-group">

              <label htmlFor="request-recommendations">
                Recommendations
              </label>

              <textarea
                id="request-recommendations"
                rows="6"
                placeholder="Enter personalized skincare, lifestyle, hydration, sleep, or wellness recommendations..."
                value={requestRecommendations}
                onChange={(event) =>
                  setRequestRecommendations(
                    event.target.value
                  )
                }
              />

            </div>


            <div className="consultation-form-actions">

              <button
                className="consultant-home-btn"
                onClick={closeRequestResponse}
                disabled={respondingToRequest}
              >
                Cancel
              </button>

              <button
                className="consultation-save-btn"
                onClick={
                  handleRespondToRequest
                }
                disabled={
                  respondingToRequest
                }
              >
                {respondingToRequest
                  ? "Submitting..."
                  : "📤 Submit Response"}
              </button>

            </div>

          </div>

        </div>

      )}


      {/* ==================================================
          INFORMATION BANNER
      ================================================== */}

      <section className="consultant-info-banner">

        <div className="consultant-info-icon">
          💡
        </div>

        <div>

          <h3>
            Wellness-Based Consultation
          </h3>

          <p>
            Review skin concerns together with
            lifestyle, hydration, stress and
            sleep patterns to provide better
            skincare guidance.
          </p>

        </div>

      </section>


      {/* ==================================================
          CLIENT MANAGEMENT
      ================================================== */}

      <section
        className="consultant-card"
        id="clients-section"
      >

        <div className="consultant-card-header">

          <div>

            <p className="consultant-label">
              CLIENT MANAGEMENT
            </p>

            <h2>
              Your Clients
            </h2>

            <p>
              Search and review client wellness
              information.
            </p>

          </div>


          {/* SEARCH */}

          <div className="consultant-search">

            <span>🔎</span>

            <input
              type="text"
              placeholder="Search client..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />

          </div>

        </div>


        {/* LOADING */}

        {loading && (

          <div className="consultant-loading">

            <div className="consultant-loading-icon">
              ⏳
            </div>

            <p>
              Loading client information...
            </p>

          </div>

        )}


        {/* ERROR */}

        {!loading && error && (

          <div className="consultant-error">

            <strong>
              Unable to load clients
            </strong>

            <p>
              {error}
            </p>

          </div>

        )}


        {/* EMPTY */}

        {!loading &&
          !error &&
          filteredPatients.length === 0 && (

            <div className="consultant-empty">

              <div className="consultant-empty-icon">
                👥
              </div>

              <h3>
                {searchTerm
                  ? "No matching clients"
                  : "No clients found"}
              </h3>

              <p>
                {searchTerm
                  ? "Try searching with a different name or email."
                  : "Registered clients will appear here."}
              </p>

            </div>

          )}


        {/* CLIENT CARDS */}

        {!loading &&
          !error &&
          filteredPatients.length > 0 && (

            <div className="consultant-client-grid">

              {filteredPatients.map(
                (patient) => (

                  <div
                    className="consultant-client-card"
                    key={patient.id}
                  >

                    <div className="consultant-client-top">

                      <div className="consultant-avatar">

                        {patient.name
                          ? patient.name
                              .charAt(0)
                              .toUpperCase()
                          : "U"}

                      </div>

                      <div>

                        <h3>
                          {patient.name}
                        </h3>

                        <p>
                          {patient.email}
                        </p>

                      </div>

                    </div>


                    <div className="consultant-client-status">

                      <span>
                        CLIENT
                      </span>

                      <span>
                        ID #{patient.id}
                      </span>

                    </div>


                    <button
                      className="consultant-view-btn"
                      onClick={() =>
                        handleViewClient(
                          patient
                        )
                      }
                    >
                      View Wellness Profile →
                    </button>

                  </div>

                )
              )}

            </div>

          )}

      </section>


      {/* ==================================================
          CLIENT DETAILS MODAL
      ================================================== */}

      {selectedPatient && (

        <div
          className="consultant-modal-overlay"
          onClick={closeClient}
        >

          <div
            className="consultant-modal consultant-profile-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="consultant-profile-hero">

              <div className="consultant-profile-identity">

                <div className="consultant-large-avatar">

                  {selectedPatient.name
                    ? selectedPatient.name
                        .charAt(0)
                        .toUpperCase()
                    : "U"}

                </div>

                <div>

                  <span className="consultant-profile-eyebrow">
                    CLIENT WELLNESS PROFILE
                  </span>

                  <h2>
                    {selectedPatient.name}
                  </h2>

                  <p>
                    {selectedPatient.email}
                  </p>

                  <div className="consultant-profile-meta">

                    <span>
                      Client ID #{selectedPatient.id}
                    </span>

                    <span>•</span>

                    <span>
                      Personalized Skin Review
                    </span>

                  </div>

                </div>

              </div>

              <button
                className="consultant-close-btn"
                onClick={closeClient}
                aria-label="Close profile"
              >
                ×
              </button>

            </div>


            {profileLoading && (

              <div className="consultant-loading consultant-profile-loading">

                <div className="consultant-loading-icon">
                  ⏳
                </div>

                <p>
                  Loading client wellness data...
                </p>

              </div>

            )}


            {profileError && (

              <div className="consultant-error consultant-profile-error">
                {profileError}
              </div>

            )}


            {!profileLoading &&
              !profileError && (

                <div className="consultant-profile-body">

                  {/* ==================================================
                      PROFILE SUMMARY
                  ================================================== */}

                  <section className="profile-summary-grid">

                    <div className="profile-summary-card">

                      <div className="profile-summary-icon">
                        🧴
                      </div>

                      <div>

                        <span>
                          Skin Profile
                        </span>

                        <strong>
                          {skinProfile
                            ? "Completed"
                            : "Not completed"}
                        </strong>

                      </div>

                    </div>


                    <div className="profile-summary-card">

                      <div className="profile-summary-icon">
                        🌿
                      </div>

                      <div>

                        <span>
                          Lifestyle
                        </span>

                        <strong>
                          {lifestyle
                            ? "Tracked"
                            : "Not tracked"}
                        </strong>

                      </div>

                    </div>


                    <div className="profile-summary-card">

                      <div className="profile-summary-icon">
                        😴
                      </div>

                      <div>

                        <span>
                          Sleep
                        </span>

                        <strong>
                          {sleep
                            ? "Tracked"
                            : "Not tracked"}
                        </strong>

                      </div>

                    </div>


                    <div className="profile-summary-card">

                      <div className="profile-summary-icon">
                        ✨
                      </div>

                      <div>

                        <span>
                          AI Analysis
                        </span>

                        <strong>
                          {assessment
                            ? "Available"
                            : "Pending"}
                        </strong>

                      </div>

                    </div>

                  </section>


                  {/* ==================================================
                      AI ANALYSIS
                  ================================================== */}

                  <section className="profile-main-section ai-analysis-section">

                    <div className="profile-section-heading">

                      <div className="profile-section-icon ai-icon">
                        ✨
                      </div>

                      <div>

                        <span>
                          AI SKIN ANALYSIS
                        </span>

                        <h3>
                          Skin Health Overview
                        </h3>

                        <p>
                          Latest AI-powered assessment based on the client's
                          available skin and wellness information.
                        </p>

                      </div>

                    </div>


                    {assessment ? (

                      <>

                        <div className="ai-score-layout">

                          <div className="ai-score-card">

                            <span>
                              SKIN HEALTH SCORE
                            </span>

                            <strong>
                              {assessment.skin_score ??
                                "N/A"}

                              <small>
                                /100
                              </small>

                            </strong>

                            <p>
                              Overall skin health
                            </p>

                          </div>


                          <div className="ai-highlight-card">

                            <span>
                              HEALTH STATUS
                            </span>

                            <strong>
                              {assessment.health_status ||
                                "Not available"}
                            </strong>

                            <p>
                              Current assessment status
                            </p>

                          </div>


                          <div className="ai-highlight-card">

                            <span>
                              PRIMARY CONCERN
                            </span>

                            <strong>
                              {assessment.primary_concern ||
                                "None identified"}
                            </strong>

                            <p>
                              Main concern identified
                            </p>

                          </div>

                        </div>


                        <div className="ai-details-grid">

                          <div className="ai-detail-card">

                            <span>
                              Secondary Concerns
                            </span>

                            <strong>
                              {assessment.secondary_concerns ||
                                "None identified"}
                            </strong>

                          </div>


                          <div className="ai-detail-card">

                            <span>
                              Risk Factors
                            </span>

                            <strong>
                              {assessment.risk_factors ||
                                "None identified"}
                            </strong>

                          </div>

                        </div>


                        <div className="ai-summary-box">

                          <span>
                            ASSESSMENT SUMMARY
                          </span>

                          <p>
                            {assessment.assessment_summary ||
                              "No assessment summary available."}
                          </p>

                        </div>

                      </>

                    ) : (

                      <div className="profile-empty-state">

                        <div>
                          ✨
                        </div>

                        <h4>
                          AI assessment not available
                        </h4>

                        <p>
                          This client has not completed an AI skin assessment
                          yet.
                        </p>

                      </div>

                    )}

                  </section>


                  {/* ==================================================
                      SKIN PROFILE
                  ================================================== */}

                  <section className="profile-main-section">

                    <div className="profile-section-heading">

                      <div className="profile-section-icon skin-icon">
                        🧴
                      </div>

                      <div>

                        <span>
                          SKIN PROFILE
                        </span>

                        <h3>
                          Skin Information
                        </h3>

                        <p>
                          Reported skin characteristics, concerns and
                          sensitivities.
                        </p>

                      </div>

                    </div>


                    {skinProfile ? (

                      <div className="profile-data-grid">

                        <div className="profile-data-card">

                          <span>
                            Skin Type
                          </span>

                          <strong>
                            {skinProfile.skin_type ||
                              "Not available"}
                          </strong>

                        </div>


                        <div className="profile-data-card">

                          <span>
                            Main Concerns
                          </span>

                          <strong>
                            {skinProfile.concerns ||
                              "None reported"}
                          </strong>

                        </div>


                        <div className="profile-data-card">

                          <span>
                            Sensitivity
                          </span>

                          <strong>
                            {skinProfile.sensitivity ||
                              "Not available"}
                          </strong>

                        </div>


                        <div className="profile-data-card">

                          <span>
                            Allergies
                          </span>

                          <strong>
                            {skinProfile.allergies ||
                              "None reported"}
                          </strong>

                        </div>

                      </div>

                    ) : (

                      <div className="profile-empty-state compact">

                        <div>
                          🧴
                        </div>

                        <p>
                          This client has not completed a skin profile yet.
                        </p>

                      </div>

                    )}

                  </section>


                  {/* ==================================================
                      LIFESTYLE + SLEEP
                  ================================================== */}

                  <div className="profile-two-column">

                    <section className="profile-main-section">

                      <div className="profile-section-heading">

                        <div className="profile-section-icon lifestyle-icon">
                          🌿
                        </div>

                        <div>

                          <span>
                            LIFESTYLE
                          </span>

                          <h3>
                            Wellness Habits
                          </h3>

                          <p>
                            Latest lifestyle information.
                          </p>

                        </div>

                      </div>


                      {lifestyle ? (

                        <div className="profile-data-grid single-column">

                          <div className="profile-data-card">

                            <span>
                              Water Intake
                            </span>

                            <strong>
                              {lifestyle.water_intake} L
                            </strong>

                          </div>


                          <div className="profile-data-card">

                            <span>
                              Exercise
                            </span>

                            <strong>
                              {lifestyle.exercise_minutes} min
                            </strong>

                          </div>


                          <div className="profile-data-card">

                            <span>
                              Stress Level
                            </span>

                            <strong>
                              {getStressText(
                                lifestyle.stress_level
                              )}
                            </strong>

                          </div>

                        </div>

                      ) : (

                        <div className="profile-empty-state compact">

                          <div>
                            🌿
                          </div>

                          <p>
                            No lifestyle information recorded.
                          </p>

                        </div>

                      )}

                    </section>


                    <section className="profile-main-section">

                      <div className="profile-section-heading">

                        <div className="profile-section-icon sleep-icon">
                          😴
                        </div>

                        <div>

                          <span>
                            SLEEP
                          </span>

                          <h3>
                            Sleep & Recovery
                          </h3>

                          <p>
                            Latest sleep information.
                          </p>

                        </div>

                      </div>


                      {sleep ? (

                        <div className="profile-data-grid single-column">

                          <div className="profile-data-card">

                            <span>
                              Sleep Duration
                            </span>

                            <strong>
                              {sleep.sleep_hours} hours
                            </strong>

                          </div>


                          <div className="profile-data-card">

                            <span>
                              Sleep Quality
                            </span>

                            <strong>
                              {getSleepQualityText(
                                sleep.sleep_quality
                              )}
                            </strong>

                          </div>


                          <div className="profile-data-card">

                            <span>
                              Recorded Date
                            </span>

                            <strong>
                              {sleep.date ||
                                "Not available"}
                            </strong>

                          </div>

                        </div>

                      ) : (

                        <div className="profile-empty-state compact">

                          <div>
                            😴
                          </div>

                          <p>
                            No sleep information recorded.
                          </p>

                        </div>

                      )}

                    </section>

                  </div>


                  {/* ==================================================
                      WELLNESS STATUS
                  ================================================== */}

                  <section className="profile-wellness-banner">

                    <div className="profile-wellness-icon">
                      💚
                    </div>

                    <div>

                      <span>
                        OVERALL WELLNESS STATUS
                      </span>

                      <h3>
                        {wellnessStatus.text}
                      </h3>

                      <p>
                        Wellness status considers the client's available
                        lifestyle and sleep information.
                      </p>

                    </div>

                  </section>


                  {/* ==================================================
                      CONSULTATION HISTORY
                  ================================================== */}

                  <section className="profile-main-section">

                    <div className="profile-section-heading">

                      <div className="profile-section-icon consultation-icon">
                        📋
                      </div>

                      <div>

                        <span>
                          CONSULTATION HISTORY
                        </span>

                        <h3>
                          Previous Consultations
                        </h3>

                        <p>
                          Notes and recommendations recorded for this client.
                        </p>

                      </div>

                    </div>


                    {consultationLoading ? (

                      <div className="profile-empty-state">

                        <div>
                          ⏳
                        </div>

                        <p>
                          Loading consultation history...
                        </p>

                      </div>

                    ) : consultations.length === 0 ? (

                      <div className="profile-empty-state">

                        <div>
                          📋
                        </div>

                        <h4>
                          No previous consultations
                        </h4>

                        <p>
                          Previous consultation notes will appear here after
                          they are recorded.
                        </p>

                      </div>

                    ) : (

                      <div className="consultation-history">

                        {consultations.map(
                          (consultation) => (

                            <div
                              className="consultation-history-card"
                              key={consultation.id}
                            >

                              <div className="consultation-history-header">

                                <div>

                                  <span>
                                    Consultation #
                                    {consultation.id}
                                  </span>

                                  <strong>
                                    {formatDate(
                                      consultation.created_at
                                    )}
                                  </strong>

                                </div>

                              </div>


                              <div className="consultation-history-content">

                                <div>

                                  <h4>
                                    📝 Notes
                                  </h4>

                                  <p>
                                    {consultation.notes}
                                  </p>

                                </div>


                                <div>

                                  <h4>
                                    💡 Recommendations
                                  </h4>

                                  <p>
                                    {consultation.recommendations}
                                  </p>

                                </div>

                              </div>

                            </div>

                          )
                        )}

                      </div>

                    )}

                  </section>


                  {/* ==================================================
                      CONSULTANT GUIDANCE
                  ================================================== */}

                  <section className="consultant-guidance">

                    <div className="consultant-guidance-icon">
                      💡
                    </div>

                    <div>

                      <p className="consultant-label">
                        CONSULTANT GUIDANCE
                      </p>

                      <h3>
                        Personalized Consultation Focus
                      </h3>

                      <ul>

                        {assessment?.primary_concern && (
                          <li>
                            The AI skin analysis identifies the primary
                            concern as:
                            <strong>
                              {" "}
                              {assessment.primary_concern}
                            </strong>.
                          </li>
                        )}

                        {skinProfile && (
                          <li>
                            Consider the client's
                            <strong>
                              {" "}
                              {skinProfile.skin_type}
                            </strong>{" "}
                            skin type when discussing skincare routines.
                          </li>
                        )}

                        {skinProfile?.concerns && (
                          <li>
                            Address the reported concern:
                            <strong>
                              {" "}
                              {skinProfile.concerns}
                            </strong>.
                          </li>
                        )}

                        {lifestyle?.water_intake !==
                          undefined &&
                          lifestyle?.water_intake !==
                            null && (
                            <li>
                              Current water intake is{" "}
                              <strong>
                                {lifestyle.water_intake} L
                              </strong>.
                              Encourage healthy hydration habits where
                              appropriate.
                            </li>
                          )}

                        {lifestyle?.stress_level >=
                          7 && (
                          <li>
                            The reported stress level is
                            <strong>
                              {" "}
                              high
                            </strong>.
                            Discuss stress-management and wellness habits.
                          </li>
                        )}

                        {sleep?.sleep_quality <=
                          4 && (
                          <li>
                            Sleep quality is currently
                            <strong>
                              {" "}
                              poor
                            </strong>.
                            Discuss healthy sleep habits as part of overall
                            wellness.
                          </li>
                        )}

                        {!assessment &&
                          !skinProfile &&
                          !lifestyle &&
                          !sleep && (
                            <li>
                              Collect more client information before
                              providing personalized guidance.
                            </li>
                          )}

                      </ul>

                    </div>

                  </section>

                </div>

              )}

          </div>

        </div>

      )}

    </div>
  );
}

export default ConsultantDashboard;