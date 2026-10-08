import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/useAuth";

import {
  getAllPatients,
  getSkinProfile,
  getLifestyle,
  getSleep,
  getSkinAssessment,

  // Consultation request APIs
  getReceivedConsultationRequests,
  acceptConsultationRequest,
  rejectConsultationRequest,
  respondToConsultationRequest,
} from "../services/api";

import "./DermatologistDashboard.css";

function DermatologistDashboard() {
  const { user, logout } = useAuth();

  // =========================================================
  // PATIENT LIST
  // =========================================================

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // CONSULTATION REQUESTS
  // =========================================================

  const [consultationRequests, setConsultationRequests] =
    useState([]);

  const [requestsLoading, setRequestsLoading] =
    useState(true);

  const [requestsError, setRequestsError] =
    useState("");

  const [processingRequestId, setProcessingRequestId] =
    useState(null);

  // =========================================================
  // RESPONSE FORM
  // =========================================================

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

  // =========================================================
  // SELECTED PATIENT
  // =========================================================

  const [selectedPatient, setSelectedPatient] =
    useState(null);

  // =========================================================
  // SKIN PROFILE
  // =========================================================

  const [skinProfile, setSkinProfile] =
    useState(null);

  const [profileLoading, setProfileLoading] =
    useState(false);

  const [profileError, setProfileError] =
    useState("");

  // =========================================================
  // LIFESTYLE
  // =========================================================

  const [lifestyle, setLifestyle] =
    useState(null);

  const [lifestyleLoading, setLifestyleLoading] =
    useState(false);

  const [lifestyleError, setLifestyleError] =
    useState("");

  // =========================================================
  // SLEEP
  // =========================================================

  const [sleep, setSleep] =
    useState(null);

  const [sleepLoading, setSleepLoading] =
    useState(false);

  const [sleepError, setSleepError] =
    useState("");

  // =========================================================
  // AI ASSESSMENT
  // =========================================================

  const [assessment, setAssessment] =
    useState(null);

  const [assessmentLoading, setAssessmentLoading] =
    useState(false);

  const [assessmentError, setAssessmentError] =
    useState("");

  // =========================================================
  // LOAD ALL PATIENTS
  // =========================================================

  useEffect(() => {
    const loadPatients = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getAllPatients();

        setPatients(
          Array.isArray(data) ? data : []
        );
      } catch (err) {
        console.error(
          "Failed to load patients:",
          err
        );

        setError(
          err.message ||
            "Failed to load patients"
        );
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

  // =========================================================
  // LOAD CONSULTATION REQUESTS
  // =========================================================

  const loadConsultationRequests = async () => {
    try {
      setRequestsLoading(true);
      setRequestsError("");

      const data =
        await getReceivedConsultationRequests();

      setConsultationRequests(
        Array.isArray(data) ? data : []
      );
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

  // =========================================================
  // LOAD REQUESTS WHEN DASHBOARD OPENS
  // =========================================================

  useEffect(() => {
    loadConsultationRequests();
  }, []);

  // =========================================================
  // PENDING REQUESTS
  // =========================================================

  const pendingRequests = useMemo(() => {
    return consultationRequests.filter(
      (request) =>
        request.status === "pending"
    );
  }, [consultationRequests]);

  // =========================================================
  // ACCEPT REQUEST
  // =========================================================

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

  // =========================================================
  // REJECT REQUEST
  // =========================================================

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

  // =========================================================
  // OPEN RESPONSE FORM
  // =========================================================

  const handleOpenRequestResponse = (
    request
  ) => {
    setSelectedRequest(request);

    setRequestNotes("");
    setRequestRecommendations("");

    setRequestResponseMessage("");
    setRequestResponseError("");
  };

  // =========================================================
  // CLOSE RESPONSE FORM
  // =========================================================

  const closeRequestResponse = () => {
    setSelectedRequest(null);

    setRequestNotes("");
    setRequestRecommendations("");

    setRequestResponseMessage("");
    setRequestResponseError("");
  };

  // =========================================================
  // RESPOND TO REQUEST
  // =========================================================

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

  // =========================================================
  // OPEN PATIENT PROFILE FROM REQUEST
  // =========================================================

  const handleViewRequestPatient = async (
    request
  ) => {
    const patient = patients.find(
      (item) =>
        item.id === request.client_id
    );

    if (!patient) {
      setRequestsError(
        "The patient associated with this request could not be found."
      );
      return;
    }

    await handleViewPatient(patient);
  };

  // =========================================================
  // VIEW PATIENT
  // =========================================================

  const handleViewPatient = async (patient) => {
    try {
      setSelectedPatient(patient);

      // Reset previous data
      setSkinProfile(null);
      setLifestyle(null);
      setSleep(null);
      setAssessment(null);

      setProfileError("");
      setLifestyleError("");
      setSleepError("");
      setAssessmentError("");

      setProfileLoading(true);
      setLifestyleLoading(true);
      setSleepLoading(true);
      setAssessmentLoading(true);

      // -------------------------------------------------------
      // Load skin profile
      // -------------------------------------------------------

      try {
        const profile =
          await getSkinProfile(patient.id);

        setSkinProfile(profile);
      } catch (err) {
        console.error(
          "Failed to load skin profile:",
          err
        );

        setProfileError(
          err.message ||
            "Skin profile not available"
        );
      } finally {
        setProfileLoading(false);
      }

      // -------------------------------------------------------
      // Load lifestyle
      // -------------------------------------------------------

      try {
        const lifestyleData =
          await getLifestyle(patient.id);

        if (
          Array.isArray(lifestyleData) &&
          lifestyleData.length > 0
        ) {
          setLifestyle(
            lifestyleData[
              lifestyleData.length - 1
            ]
          );
        } else {
          setLifestyle(null);
        }
      } catch (err) {
        console.error(
          "Failed to load lifestyle:",
          err
        );

        setLifestyleError(
          err.message ||
            "Lifestyle data not available"
        );
      } finally {
        setLifestyleLoading(false);
      }

      // -------------------------------------------------------
      // Load sleep
      // -------------------------------------------------------

      try {
        const sleepData =
          await getSleep(patient.id);

        if (
          Array.isArray(sleepData) &&
          sleepData.length > 0
        ) {
          setSleep(
            sleepData[
              sleepData.length - 1
            ]
          );
        } else {
          setSleep(null);
        }
      } catch (err) {
        console.error(
          "Failed to load sleep:",
          err
        );

        setSleepError(
          err.message ||
            "Sleep data not available"
        );
      } finally {
        setSleepLoading(false);
      }

      // -------------------------------------------------------
      // Load AI assessment
      // -------------------------------------------------------

      try {
        const assessmentData =
          await getSkinAssessment(patient.id);

        setAssessment(assessmentData);
      } catch (err) {
        console.error(
          "Failed to load AI assessment:",
          err
        );

        setAssessmentError(
          err.message ||
            "AI assessment not available"
        );
      } finally {
        setAssessmentLoading(false);
      }
    } catch (err) {
      console.error(
        "Failed to view patient:",
        err
      );
    }
  };

  // =========================================================
  // CLOSE PATIENT PROFILE
  // =========================================================

  const closePatientProfile = () => {
    setSelectedPatient(null);

    setSkinProfile(null);
    setLifestyle(null);
    setSleep(null);
    setAssessment(null);

    setProfileError("");
    setLifestyleError("");
    setSleepError("");
    setAssessmentError("");
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

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

  // =========================================================
  // FORMAT SLEEP QUALITY
  // =========================================================

  const getSleepQualityText = (quality) => {
    if (
      quality === null ||
      quality === undefined
    ) {
      return "Not provided";
    }

    if (quality >= 4) {
      return `${quality}/5 - Good`;
    }

    if (quality === 3) {
      return `${quality}/5 - Average`;
    }

    return `${quality}/5 - Poor`;
  };

  // =========================================================
  // GET ASSESSMENT VALUE
  // =========================================================

  const getAssessmentValue = (
    key,
    fallback = "Not available"
  ) => {
    if (!assessment) {
      return fallback;
    }

    return (
      assessment[key] ??
      fallback
    );
  };

  // =========================================================
  // GET USER NAME
  // =========================================================

  const doctorName =
    user?.name ||
    user?.user?.name ||
    "Doctor";

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="dermatologist-dashboard">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="derma-header">

        <div>

          <p className="derma-label">
            DERMATOLOGIST PORTAL
          </p>

          <h1>
            Welcome, Dr. {doctorName} 👋
          </h1>

          <p>
            Monitor patient skin health and provide
            personalized dermatological guidance.
          </p>

        </div>

        <button
          className="logout-btn"
          onClick={logout}
        >
          Logout
        </button>

      </header>


      {/* =====================================================
          QUICK NAVIGATION
      ====================================================== */}

      <section
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >

        <button
          onClick={() =>
            document
              .getElementById(
                "derma-requests-section"
              )
              ?.scrollIntoView({
                behavior: "smooth",
              })
          }
          style={{
            padding: "10px 16px",
            borderRadius: "10px",
            border: "1px solid #d7e5df",
            background: "#ffffff",
            cursor: "pointer",
          }}
        >
          📩 Requests
          {pendingRequests.length > 0 && (
            <strong
              style={{
                marginLeft: "7px",
                background: "#16834d",
                color: "#ffffff",
                padding: "2px 7px",
                borderRadius: "20px",
                fontSize: "12px",
              }}
            >
              {pendingRequests.length}
            </strong>
          )}
        </button>

        <button
          onClick={() =>
            document
              .getElementById(
                "derma-patients-section"
              )
              ?.scrollIntoView({
                behavior: "smooth",
              })
          }
          style={{
            padding: "10px 16px",
            borderRadius: "10px",
            border: "1px solid #d7e5df",
            background: "#ffffff",
            cursor: "pointer",
          }}
        >
          👥 Patients
        </button>

      </section>


      {/* =====================================================
          STATISTICS
      ====================================================== */}

      <section className="derma-stats">

        {/* TOTAL PATIENTS */}

        <div className="stat-card">

          <div className="stat-icon">
            👥
          </div>

          <div>

            <span>
              Total Patients
            </span>

            <strong>
              {loading
                ? "..."
                : patients.length}
            </strong>

          </div>

        </div>


        {/* PENDING REQUESTS */}

        <div className="stat-card">

          <div className="stat-icon">
            📩
          </div>

          <div>

            <span>
              Pending Requests
            </span>

            <strong>
              {requestsLoading
                ? "..."
                : pendingRequests.length}
            </strong>

          </div>

        </div>


        {/* SKIN ASSESSMENTS */}

        <div className="stat-card">

          <div className="stat-icon">
            🔬
          </div>

          <div>

            <span>
              Skin Assessments
            </span>

            <strong>
              0
            </strong>

          </div>

        </div>


        {/* RECOMMENDATIONS */}

        <div className="stat-card">

          <div className="stat-icon">
            ⭐
          </div>

          <div>

            <span>
              Recommendations
            </span>

            <strong>
              0
            </strong>

          </div>

        </div>

      </section>


      {/* =====================================================
          CONSULTATION REQUESTS
      ====================================================== */}

      <section
        className="dashboard-card"
        id="derma-requests-section"
        style={{
          marginBottom: "24px",
        }}
      >

        <div className="card-header">

          <div>

            <p className="derma-label">
              CONSULTATION REQUESTS
            </p>

            <h2>
              Patient Requests
            </h2>

            <p>
              Review consultation requests assigned
              to you and provide professional guidance.
            </p>

          </div>

          <button
            onClick={loadConsultationRequests}
            disabled={requestsLoading}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              border: "1px solid #d7e5df",
              background: "#ffffff",
              cursor: requestsLoading
                ? "not-allowed"
                : "pointer",
            }}
          >
            {requestsLoading
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>

        </div>


        {/* SUCCESS */}

        {requestResponseMessage && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px 16px",
              borderRadius: "10px",
              background: "#ecfdf3",
              color: "#167044",
            }}
          >
            ✓ {requestResponseMessage}
          </div>
        )}


        {/* ERROR */}

        {requestsError && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px 16px",
              borderRadius: "10px",
              background: "#fff1f2",
              color: "#b42318",
            }}
          >
            ⚠ {requestsError}
          </div>
        )}


        {/* LOADING */}

        {requestsLoading ? (

          <div className="patient-loading">
            Loading consultation requests...
          </div>

        ) : consultationRequests.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              📩
            </div>

            <h3>
              No consultation requests
            </h3>

            <p>
              New patient consultation requests
              will appear here.
            </p>

          </div>

        ) : (

          <div
            style={{
              display: "grid",
              gap: "16px",
            }}
          >

            {consultationRequests.map(
              (request) => {

                const requestPatient =
                  patients.find(
                    (patient) =>
                      patient.id ===
                      request.client_id
                  );

                const patientName =
                  request.client_name ||
                  requestPatient?.name ||
                  `Patient #${request.client_id}`;

                return (

                  <div
                    key={request.id}
                    style={{
                      border: "1px solid #e1e9e5",
                      borderRadius: "16px",
                      padding: "20px",
                      background: "#ffffff",
                    }}
                  >

                    {/* REQUEST HEADER */}

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "flex-start",
                        gap: "15px",
                        flexWrap: "wrap",
                      }}
                    >

                      <div
                        style={{
                          display: "flex",
                          alignItems:
                            "center",
                          gap: "12px",
                        }}
                      >

                        <div
                          className="patient-avatar"
                        >
                          {patientName
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>

                          <strong
                            style={{
                              display:
                                "block",
                              fontSize:
                                "17px",
                            }}
                          >
                            {patientName}
                          </strong>

                          <span
                            style={{
                              color:
                                "#667085",
                              fontSize:
                                "13px",
                            }}
                          >
                            Patient ID #
                            {request.client_id}
                          </span>

                        </div>

                      </div>


                      <span
                        style={{
                          padding:
                            "6px 12px",
                          borderRadius:
                            "20px",
                          background:
                            request.status ===
                            "pending"
                              ? "#fff7e6"
                              : request.status ===
                                "accepted"
                              ? "#ecfdf3"
                              : request.status ===
                                "completed"
                              ? "#eef4ff"
                              : "#fef2f2",
                          color:
                            request.status ===
                            "pending"
                              ? "#a15c00"
                              : request.status ===
                                "accepted"
                              ? "#167044"
                              : request.status ===
                                "completed"
                              ? "#175cd3"
                              : "#b42318",
                          fontSize:
                            "12px",
                          fontWeight:
                            "700",
                          textTransform:
                            "uppercase",
                        }}
                      >
                        {request.status}
                      </span>

                    </div>


                    {/* REQUEST MESSAGE */}

                    <div
                      style={{
                        marginTop:
                          "18px",
                        padding:
                          "14px",
                        borderRadius:
                          "10px",
                        background:
                          "#f8faf9",
                      }}
                    >

                      <span
                        style={{
                          display:
                            "block",
                          fontSize:
                            "11px",
                          fontWeight:
                            "700",
                          letterSpacing:
                            "0.08em",
                          color:
                            "#667085",
                          marginBottom:
                            "6px",
                        }}
                      >
                        PATIENT MESSAGE
                      </span>

                      <p
                        style={{
                          margin: 0,
                          color:
                            "#344054",
                          lineHeight:
                            "1.6",
                        }}
                      >
                        {request.request_message ||
                          "No message provided."}
                      </p>

                    </div>


                    {/* REQUEST META */}

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(150px, 1fr))",
                        gap: "12px",
                        marginTop:
                          "15px",
                      }}
                    >

                      <div>

                        <span
                          style={{
                            display:
                              "block",
                            fontSize:
                              "11px",
                            color:
                              "#667085",
                          }}
                        >
                          REQUEST ID
                        </span>

                        <strong>
                          #{request.id}
                        </strong>

                      </div>


                      <div>

                        <span
                          style={{
                            display:
                              "block",
                            fontSize:
                              "11px",
                            color:
                              "#667085",
                          }}
                        >
                          ROLE
                        </span>

                        <strong>
                          Dermatologist
                        </strong>

                      </div>


                      <div>

                        <span
                          style={{
                            display:
                              "block",
                            fontSize:
                              "11px",
                            color:
                              "#667085",
                          }}
                        >
                          REQUESTED ON
                        </span>

                        <strong>
                          {formatDate(
                            request.created_at
                          )}
                        </strong>

                      </div>

                    </div>


                    {/* ACTIONS */}

                    <div
                      style={{
                        display:
                          "flex",
                        gap: "10px",
                        marginTop:
                          "18px",
                        flexWrap:
                          "wrap",
                      }}
                    >

                      <button
                        className="view-patient-btn"
                        onClick={() =>
                          handleViewRequestPatient(
                            request
                          )
                        }
                      >
                        👤 View Patient
                      </button>


                      {request.status ===
                        "pending" && (

                        <>

                          <button
                            onClick={() =>
                              handleRejectRequest(
                                request
                              )
                            }
                            disabled={
                              processingRequestId ===
                              request.id
                            }
                            style={{
                              padding:
                                "10px 16px",
                              borderRadius:
                                "9px",
                              border:
                                "1px solid #f0c7c7",
                              background:
                                "#fff5f5",
                              color:
                                "#b42318",
                              cursor:
                                "pointer",
                            }}
                          >
                            {processingRequestId ===
                            request.id
                              ? "Processing..."
                              : "✕ Reject"}
                          </button>


                          <button
                            onClick={() =>
                              handleAcceptRequest(
                                request
                              )
                            }
                            disabled={
                              processingRequestId ===
                              request.id
                            }
                            style={{
                              padding:
                                "10px 16px",
                              borderRadius:
                                "9px",
                              border:
                                "1px solid #b7dfc7",
                              background:
                                "#ecfdf3",
                              color:
                                "#167044",
                              cursor:
                                "pointer",
                            }}
                          >
                            {processingRequestId ===
                            request.id
                              ? "Processing..."
                              : "✓ Accept"}
                          </button>

                        </>

                      )}


                      {request.status ===
                        "accepted" && (

                        <button
                          onClick={() =>
                            handleOpenRequestResponse(
                              request
                            )
                          }
                          style={{
                            padding:
                              "10px 16px",
                            borderRadius:
                              "9px",
                            border:
                              "1px solid #c7d7fe",
                            background:
                              "#eef4ff",
                            color:
                              "#175cd3",
                            cursor:
                              "pointer",
                          }}
                        >
                          ✍️ Write Response
                        </button>

                      )}


                      {request.status ===
                        "completed" && (

                        <span
                          style={{
                            padding:
                              "10px 14px",
                            borderRadius:
                              "9px",
                            background:
                              "#eef4ff",
                            color:
                              "#175cd3",
                            fontWeight:
                              "600",
                          }}
                        >
                          ✓ Response Completed
                        </span>

                      )}


                      {request.status ===
                        "rejected" && (

                        <span
                          style={{
                            padding:
                              "10px 14px",
                            borderRadius:
                              "9px",
                            background:
                              "#fef2f2",
                            color:
                              "#b42318",
                            fontWeight:
                              "600",
                          }}
                        >
                          Request Rejected
                        </span>

                      )}

                    </div>

                  </div>

                );
              }
            )}

          </div>

        )}

      </section>


      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <section
        className="derma-content"
        id="derma-patients-section"
      >

        {/* ===================================================
            PATIENT OVERVIEW
        ==================================================== */}

        <div className="dashboard-card">

          <div className="card-header">

            <div>

              <p className="derma-label">
                PATIENT MANAGEMENT
              </p>

              <h2>
                Patient Overview
              </h2>

              <p>
                View registered patients and their
                health information.
              </p>

            </div>

          </div>


          {/* ERROR */}

          {error && (
            <div className="patient-error">
              {error}
            </div>
          )}


          {/* LOADING */}

          {loading && (
            <div className="patient-loading">
              Loading patients...
            </div>
          )}


          {/* EMPTY */}

          {!loading &&
            !error &&
            patients.length === 0 && (

              <div className="empty-state">

                <div className="empty-icon">
                  👨‍⚕️
                </div>

                <h3>
                  No patients found
                </h3>

                <p>
                  Patient information will appear
                  here once users register in the system.
                </p>

              </div>

            )}


          {/* PATIENT LIST */}

          {!loading &&
            !error &&
            patients.length > 0 && (

              <div className="patient-list">

                {patients.map(
                  (patient) => (

                    <div
                      className="patient-row"
                      key={patient.id}
                    >

                      <div className="patient-avatar">
                        {patient.name
                          ? patient.name
                              .charAt(0)
                              .toUpperCase()
                          : "P"}
                      </div>

                      <div className="patient-info">

                        <strong>
                          {patient.name}
                        </strong>

                        <span>
                          {patient.email}
                        </span>

                      </div>

                      <button
                        className="view-patient-btn"
                        onClick={() =>
                          handleViewPatient(
                            patient
                          )
                        }
                      >
                        View
                      </button>

                    </div>

                  )
                )}

              </div>

            )}

        </div>


        {/* ===================================================
            QUICK ACTIONS
        ==================================================== */}

        <div className="dashboard-card">

          <div className="card-header">

            <div>

              <h2>
                Quick Actions
              </h2>

              <p>
                Common dermatologist tasks
              </p>

            </div>

          </div>


          <div className="quick-actions">

            <button
              className="action-card"
              onClick={() =>
                document
                  .getElementById(
                    "derma-patients-section"
                  )
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >

              <span>
                👥
              </span>

              <div>

                <strong>
                  Patient Profiles
                </strong>

                <small>
                  View patient information
                </small>

              </div>

            </button>


            <button
              className="action-card"
              onClick={() =>
                document
                  .getElementById(
                    "derma-requests-section"
                  )
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >

              <span>
                📩
              </span>

              <div>

                <strong>
                  Consultation Requests
                </strong>

                <small>
                  Review patient requests
                </small>

              </div>

            </button>


            <button
              className="action-card"
              onClick={() =>
                document
                  .getElementById(
                    "derma-requests-section"
                  )
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >

              <span>
                💡
              </span>

              <div>

                <strong>
                  Recommendations
                </strong>

                <small>
                  Provide professional guidance
                </small>

              </div>

            </button>

          </div>

        </div>

      </section>


      {/* =====================================================
          PATIENT PROFILE MODAL
      ====================================================== */}

      {selectedPatient && (

        <div
          className="patient-modal-overlay"
          onClick={closePatientProfile}
        >

          <div
            className="patient-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* =================================================
                MODAL HEADER
            ================================================== */}

            <div className="patient-modal-header">

              <div>

                <p className="derma-label">
                  PATIENT PROFILE
                </p>

                <h2>
                  {selectedPatient.name}
                </h2>

                <p>
                  {selectedPatient.email}
                </p>

              </div>

              <button
                className="modal-close-btn"
                onClick={closePatientProfile}
              >
                ×
              </button>

            </div>


            {/* =================================================
                AI SKIN ASSESSMENT
            ================================================== */}

            <div className="patient-section">

              <div className="patient-section-title">

                <span>
                  ✨
                </span>

                <div>

                  <h3>
                    AI Skin Assessment
                  </h3>

                  <p>
                    Latest AI-powered skin health analysis
                  </p>

                </div>

              </div>


              {assessmentLoading && (
                <div className="patient-loading">
                  Loading AI assessment...
                </div>
              )}


              {assessmentError && (
                <div className="patient-error">
                  {assessmentError}
                </div>
              )}


              {!assessmentLoading &&
                !assessmentError &&
                assessment && (

                  <>

                    <div className="health-data-grid">

                      <div className="health-data-card">

                        <div className="health-data-icon">
                          🎯
                        </div>

                        <div>

                          <span>
                            Skin Score
                          </span>

                          <strong>
                            {getAssessmentValue(
                              "skin_score"
                            )}/100
                          </strong>

                        </div>

                      </div>


                      <div className="health-data-card">

                        <div className="health-data-icon">
                          💚
                        </div>

                        <div>

                          <span>
                            Health Status
                          </span>

                          <strong>
                            {getAssessmentValue(
                              "health_status"
                            )}
                          </strong>

                        </div>

                      </div>


                      <div className="health-data-card">

                        <div className="health-data-icon">
                          🎯
                        </div>

                        <div>

                          <span>
                            Primary Concern
                          </span>

                          <strong>
                            {getAssessmentValue(
                              "primary_concern"
                            )}
                          </strong>

                        </div>

                      </div>

                    </div>


                    <div
                      style={{
                        marginTop:
                          "15px",
                        padding:
                          "16px",
                        borderRadius:
                          "12px",
                        background:
                          "#f8faf9",
                      }}
                    >

                      <span
                        style={{
                          display:
                            "block",
                          fontSize:
                            "11px",
                          fontWeight:
                            "700",
                          color:
                            "#667085",
                          marginBottom:
                            "6px",
                        }}
                      >
                        ASSESSMENT SUMMARY
                      </span>

                      <p
                        style={{
                          margin: 0,
                          lineHeight:
                            "1.6",
                          color:
                            "#344054",
                        }}
                      >
                        {getAssessmentValue(
                          "assessment_summary",
                          "No assessment summary available."
                        )}
                      </p>

                    </div>

                  </>

                )}


              {!assessmentLoading &&
                !assessmentError &&
                !assessment && (

                  <div className="empty-profile-message">
                    No AI skin assessment is available yet.
                  </div>

                )}

            </div>


            {/* =================================================
                SKIN PROFILE
            ================================================== */}

            <div className="patient-section">

              <div className="patient-section-title">

                <span>
                  🧴
                </span>

                <div>

                  <h3>
                    Skin Profile
                  </h3>

                  <p>
                    Patient skin characteristics
                  </p>

                </div>

              </div>


              {profileLoading && (
                <div className="patient-loading">
                  Loading skin profile...
                </div>
              )}


              {profileError && (
                <div className="patient-error">
                  {profileError}
                </div>
              )}


              {!profileLoading &&
                !profileError &&
                skinProfile && (

                  <div className="skin-profile-details">

                    <div className="profile-detail-card">

                      <span>
                        Skin Type
                      </span>

                      <strong>
                        {skinProfile.skin_type ||
                          "Not provided"}
                      </strong>

                    </div>


                    <div className="profile-detail-card">

                      <span>
                        Skin Concerns
                      </span>

                      <strong>
                        {skinProfile.concerns ||
                          "Not provided"}
                      </strong>

                    </div>


                    <div className="profile-detail-card">

                      <span>
                        Sensitivity
                      </span>

                      <strong>
                        {skinProfile.sensitivity ||
                          "Not provided"}
                      </strong>

                    </div>


                    <div className="profile-detail-card">

                      <span>
                        Allergies
                      </span>

                      <strong>
                        {skinProfile.allergies ||
                          "None reported"}
                      </strong>

                    </div>

                  </div>

                )}


              {!profileLoading &&
                !profileError &&
                !skinProfile && (

                  <div className="empty-profile-message">
                    No skin profile has been created yet.
                  </div>

                )}

            </div>


            {/* =================================================
                LIFESTYLE
            ================================================== */}

            <div className="patient-section">

              <div className="patient-section-title">

                <span>
                  🌿
                </span>

                <div>

                  <h3>
                    Lifestyle
                  </h3>

                  <p>
                    Patient lifestyle information
                  </p>

                </div>

              </div>


              {lifestyleLoading && (
                <div className="patient-loading">
                  Loading lifestyle data...
                </div>
              )}


              {lifestyleError && (
                <div className="patient-error">
                  {lifestyleError}
                </div>
              )}


              {!lifestyleLoading &&
                !lifestyleError &&
                lifestyle && (

                  <div className="health-data-grid">

                    <div className="health-data-card">

                      <div className="health-data-icon">
                        💧
                      </div>

                      <div>

                        <span>
                          Water Intake
                        </span>

                        <strong>
                          {lifestyle.water_intake} L
                        </strong>

                      </div>

                    </div>


                    <div className="health-data-card">

                      <div className="health-data-icon">
                        🏃
                      </div>

                      <div>

                        <span>
                          Exercise
                        </span>

                        <strong>
                          {lifestyle.exercise_minutes} min
                        </strong>

                      </div>

                    </div>


                    <div className="health-data-card">

                      <div className="health-data-icon">
                        🧘
                      </div>

                      <div>

                        <span>
                          Stress Level
                        </span>

                        <strong>
                          {lifestyle.stress_level}/5
                        </strong>

                      </div>

                    </div>

                  </div>

                )}


              {!lifestyleLoading &&
                !lifestyleError &&
                !lifestyle && (

                  <div className="empty-profile-message">
                    No lifestyle data has been recorded yet.
                  </div>

                )}

            </div>


            {/* =================================================
                SLEEP
            ================================================== */}

            <div className="patient-section">

              <div className="patient-section-title">

                <span>
                  😴
                </span>

                <div>

                  <h3>
                    Sleep
                  </h3>

                  <p>
                    Patient sleep information
                  </p>

                </div>

              </div>


              {sleepLoading && (
                <div className="patient-loading">
                  Loading sleep data...
                </div>
              )}


              {sleepError && (
                <div className="patient-error">
                  {sleepError}
                </div>
              )}


              {!sleepLoading &&
                !sleepError &&
                sleep && (

                  <div className="health-data-grid">

                    <div className="health-data-card">

                      <div className="health-data-icon">
                        🌙
                      </div>

                      <div>

                        <span>
                          Sleep Hours
                        </span>

                        <strong>
                          {sleep.sleep_hours} hrs
                        </strong>

                      </div>

                    </div>


                    <div className="health-data-card">

                      <div className="health-data-icon">
                        ⭐
                      </div>

                      <div>

                        <span>
                          Sleep Quality
                        </span>

                        <strong>
                          {getSleepQualityText(
                            sleep.sleep_quality
                          )}
                        </strong>

                      </div>

                    </div>


                    <div className="health-data-card">

                      <div className="health-data-icon">
                        📅
                      </div>

                      <div>

                        <span>
                          Recorded Date
                        </span>

                        <strong>
                          {sleep.date ||
                            "Not available"}
                        </strong>

                      </div>

                    </div>

                  </div>

                )}


              {!sleepLoading &&
                !sleepError &&
                !sleep && (

                  <div className="empty-profile-message">
                    No sleep data has been recorded yet.
                  </div>

                )}

            </div>


            {/* =================================================
                CLOSE
            ================================================== */}

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "flex-end",
                marginTop:
                  "10px",
              }}
            >

              <button
                className="modal-close-btn"
                onClick={closePatientProfile}
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          CONSULTATION RESPONSE MODAL
      ====================================================== */}

      {selectedRequest && (

        <div
          className="patient-modal-overlay"
          onClick={closeRequestResponse}
        >

          <div
            className="patient-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              maxWidth:
                "720px",
            }}
          >

            {/* HEADER */}

            <div className="patient-modal-header">

              <div>

                <p className="derma-label">
                  CONSULTATION RESPONSE
                </p>

                <h2>
                  Respond to Patient
                </h2>

                <p>
                  Request #{selectedRequest.id}
                </p>

              </div>

              <button
                className="modal-close-btn"
                onClick={closeRequestResponse}
              >
                ×
              </button>

            </div>


            {/* PATIENT INFORMATION */}

            <div
              style={{
                padding:
                  "16px",
                borderRadius:
                  "12px",
                background:
                  "#f8faf9",
                marginBottom:
                  "20px",
              }}
            >

              <strong>
                Patient #
                {selectedRequest.client_id}
              </strong>

              <p
                style={{
                  margin:
                    "8px 0 0",
                  color:
                    "#667085",
                }}
              >
                {selectedRequest.request_message ||
                  "No message provided."}
              </p>

            </div>


            {/* SUCCESS */}

            {requestResponseMessage && (

              <div
                style={{
                  marginBottom:
                    "16px",
                  padding:
                    "12px 16px",
                  borderRadius:
                    "10px",
                  background:
                    "#ecfdf3",
                  color:
                    "#167044",
                }}
              >
                ✓ {requestResponseMessage}
              </div>

            )}


            {/* ERROR */}

            {requestResponseError && (

              <div
                style={{
                  marginBottom:
                    "16px",
                  padding:
                    "12px 16px",
                  borderRadius:
                    "10px",
                  background:
                    "#fff1f2",
                  color:
                    "#b42318",
                }}
              >
                ⚠ {requestResponseError}
              </div>

            )}


            {/* NOTES */}

            <div
              style={{
                marginBottom:
                  "18px",
              }}
            >

              <label
                htmlFor="derma-request-notes"
                style={{
                  display:
                    "block",
                  fontWeight:
                    "600",
                  marginBottom:
                    "8px",
                }}
              >
                Consultation Notes
              </label>

              <textarea
                id="derma-request-notes"
                rows="7"
                placeholder="Enter your dermatological observations, clinical notes, skin concerns, and consultation findings..."
                value={requestNotes}
                onChange={(event) =>
                  setRequestNotes(
                    event.target.value
                  )
                }
                style={{
                  width:
                    "100%",
                  boxSizing:
                    "border-box",
                  padding:
                    "14px",
                  borderRadius:
                    "10px",
                  border:
                    "1px solid #d0d5dd",
                  resize:
                    "vertical",
                  fontFamily:
                    "inherit",
                }}
              />

            </div>


            {/* RECOMMENDATIONS */}

            <div
              style={{
                marginBottom:
                  "20px",
              }}
            >

              <label
                htmlFor="derma-request-recommendations"
                style={{
                  display:
                    "block",
                  fontWeight:
                    "600",
                  marginBottom:
                    "8px",
                }}
              >
                Dermatologist Recommendations
              </label>

              <textarea
                id="derma-request-recommendations"
                rows="7"
                placeholder="Enter personalized skincare, treatment, lifestyle, hydration, sleep, or follow-up recommendations..."
                value={
                  requestRecommendations
                }
                onChange={(event) =>
                  setRequestRecommendations(
                    event.target.value
                  )
                }
                style={{
                  width:
                    "100%",
                  boxSizing:
                    "border-box",
                  padding:
                    "14px",
                  borderRadius:
                    "10px",
                  border:
                    "1px solid #d0d5dd",
                  resize:
                    "vertical",
                  fontFamily:
                    "inherit",
                }}
              />

            </div>


            {/* ACTIONS */}

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "flex-end",
                gap:
                  "10px",
              }}
            >

              <button
                onClick={
                  closeRequestResponse
                }
                disabled={
                  respondingToRequest
                }
                style={{
                  padding:
                    "11px 18px",
                  borderRadius:
                    "9px",
                  border:
                    "1px solid #d0d5dd",
                  background:
                    "#ffffff",
                  cursor:
                    "pointer",
                }}
              >
                Cancel
              </button>

              <button
                onClick={
                  handleRespondToRequest
                }
                disabled={
                  respondingToRequest
                }
                style={{
                  padding:
                    "11px 18px",
                  borderRadius:
                    "9px",
                  border:
                    "1px solid #16834d",
                  background:
                    "#16834d",
                  color:
                    "#ffffff",
                  cursor:
                    "pointer",
                }}
              >
                {respondingToRequest
                  ? "Submitting..."
                  : "📤 Submit Response"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default DermatologistDashboard;