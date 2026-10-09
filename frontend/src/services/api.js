// =========================================================
// API CONFIGURATION
// =========================================================

const API_URL = "http://127.0.0.1:8000";


// =========================================================
// AUTHORIZATION HEADER
// =========================================================

const authHeaders = () => {
  const token = localStorage.getItem("token");

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { Accept: "application/json", ...authHeaders(), ...(options.headers || {}) },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Request failed");
  return data;
};

export const getProductRecommendations = (filters = {}) => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== "" && value != null) query.set(key, value); });
  return requestJson(`/api/products/recommendations?${query}`);
};
export const getProductAlternatives = (id) => requestJson(`/api/products/${id}/alternatives`);
export const compareProducts = (ids) => requestJson("/api/products/compare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ids) });
export const getProductCombos = () => requestJson("/api/products/combos");
export const getDailyCheckins = (userId, days = 30) => requestJson(`/api/checkins/${userId}?days=${days}`);
export const saveDailyCheckin = (userId, data) => requestJson(`/api/checkins/${userId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });


// =========================================================
// AUTHENTICATION
// =========================================================

// ===============================
// REGISTER USER
// ===============================

export const registerUser = async (userData) => {
  const response = await fetch(
    `${API_URL}/api/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(userData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Registration failed"
    );
  }

  return data;
};


// ===============================
// LOGIN USER
// ===============================

export const loginUser = async (userData) => {
  const response = await fetch(
    `${API_URL}/api/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(userData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Login failed"
    );
  }

  /*
    Backend response:

    {
      access_token,
      token_type,
      user: {
        id,
        name,
        email,
        role
      }
    }

    We flatten the user information so
    existing frontend pages can continue
    using user_id, name, email and role.
  */

  return {
    access_token: data.access_token,
    user_id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    role: data.user.role,
  };
};


// =========================================================
// SKIN PROFILE
// =========================================================

// ===============================
// CREATE SKIN PROFILE
// ===============================

export const createSkinProfile = async (
  profileData
) => {
  const response = await fetch(
    `${API_URL}/api/profile/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(profileData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Failed to save skin profile"
    );
  }

  return data;
};


// ===============================
// GET SKIN PROFILE
// ===============================

export const getSkinProfile = async (
  userId
) => {
  const response = await fetch(
    `${API_URL}/api/profile/${userId}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...authHeaders(),
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Failed to get skin profile"
    );
  }

  return data;
};


// =========================================================
// LIFESTYLE
// =========================================================

// ===============================
// CREATE LIFESTYLE
// ===============================

export const createLifestyle = async (
  lifestyleData
) => {
  const response = await fetch(
    `${API_URL}/api/lifestyle/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(lifestyleData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Failed to save lifestyle data"
    );
  }

  return data;
};


// ===============================
// GET LIFESTYLE
// ===============================

export const getLifestyle = async (
  userId
) => {
  const response = await fetch(
    `${API_URL}/api/lifestyle/${userId}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...authHeaders(),
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Failed to get lifestyle data"
    );
  }

  return data;
};


// =========================================================
// SLEEP
// =========================================================

// ===============================
// CREATE SLEEP
// ===============================

export const createSleep = async (
  sleepData
) => {
  const response = await fetch(
    `${API_URL}/api/sleep/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(sleepData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Failed to save sleep data"
    );
  }

  return data;
};


// ===============================
// GET SLEEP
// ===============================

export const getSleep = async (
  userId
) => {
  const response = await fetch(
    `${API_URL}/api/sleep/${userId}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...authHeaders(),
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Failed to get sleep data"
    );
  }

  return data;
};


// =========================================================
// DERMATOLOGIST
// =========================================================

// ===============================
// GET ALL PATIENTS
// ===============================

export const getAllPatients = async () => {
  const response = await fetch(
    `${API_URL}/api/profile/patients`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...authHeaders(),
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Failed to get patient list"
    );
  }

  return data;
};


// =========================================================
// ADMIN
// =========================================================

// ===============================
// GET ALL USERS
// ===============================

export const getAllUsers = async () => {
  const response = await fetch(
    `${API_URL}/api/auth/admin/users`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...authHeaders(),
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Failed to get users"
    );
  }

  return data;
};


// =========================================================
// CONSULTATIONS
// =========================================================

// ===============================
// CREATE CONSULTATION
// ===============================

export const createConsultation = async (
  consultationData
) => {
  const response = await fetch(
    `${API_URL}/api/consultations/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(
        consultationData
      ),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    let errorMessage =
      "Failed to create consultation";

    if (
      typeof data.detail === "string"
    ) {
      errorMessage = data.detail;
    }

    else if (
      Array.isArray(data.detail)
    ) {
      errorMessage = data.detail
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          return (
            item.msg ||
            "Validation error"
          );
        })
        .join(", ");
    }

    else if (data.detail) {
      errorMessage =
        JSON.stringify(
          data.detail
        );
    }

    throw new Error(errorMessage);
  }

  return data;
};


// ===============================
// GET CLIENT CONSULTATIONS
// ===============================

export const getClientConsultations = async (
  clientId
) => {
  const response = await fetch(
    `${API_URL}/api/consultations/client/${clientId}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...authHeaders(),
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    let errorMessage =
      "Failed to get consultation history";

    if (
      typeof data.detail === "string"
    ) {
      errorMessage = data.detail;
    }

    else if (
      Array.isArray(data.detail)
    ) {
      errorMessage = data.detail
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          return (
            item.msg ||
            "Validation error"
          );
        })
        .join(", ");
    }

    else if (data.detail) {
      errorMessage =
        JSON.stringify(
          data.detail
        );
    }

    throw new Error(errorMessage);
  }

  return data;
};


// =========================================================
// SKIN ASSESSMENT
// =========================================================

// ===============================
// CREATE SKIN ASSESSMENT
// ===============================

export const createSkinAssessment = async (
  userId
) => {
  const response = await fetch(
    `${API_URL}/api/assessment/${userId}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...authHeaders(),
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Failed to create skin assessment"
    );
  }

  return data;
};


// ===============================
// GET SKIN ASSESSMENT
// ===============================

export const getSkinAssessment = async (
  userId
) => {
  const response = await fetch(
    `${API_URL}/api/assessment/${userId}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...authHeaders(),
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Failed to fetch skin assessment"
    );
  }

  return data;
};


// =========================================================
// PERSONALIZED ROUTINE
// =========================================================

// ===============================
// CREATE PERSONALIZED ROUTINE
// ===============================

export const createPersonalizedRoutine =
  async (userId) => {

    const response = await fetch(
      `${API_URL}/api/routines/${userId}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          ...authHeaders(),
        },
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
  const detail = data?.detail;

  const message = Array.isArray(detail)
    ? detail
        .map((item) => item.msg || JSON.stringify(item))
        .join(", ")
    : typeof detail === "string"
      ? detail
      : detail
        ? JSON.stringify(detail)
        : "Failed to fetch skin assessment";

  throw new Error(message);
}

    return data;
  };


// ===============================
// GET PERSONALIZED ROUTINE
// ===============================

export const getPersonalizedRoutine =
  async (userId) => {

    const response = await fetch(
      `${API_URL}/api/routines/${userId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...authHeaders(),
        },
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
        "Failed to fetch skincare routine"
      );
    }

    return data;
  };


// =========================================================
// PROGRESS TRACKING
// =========================================================

// ===============================
// GET USER PROGRESS
// ===============================

export const getProgress = async (
  userId
) => {

  const response = await fetch(
    `${API_URL}/api/progress/${userId}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...authHeaders(),
      },
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Failed to load progress"
    );
  }

  return data;
};


// =========================================================
// BEFORE / AFTER PROGRESS
// =========================================================

// ===============================
// GET BEFORE / AFTER
// ===============================

export const getBeforeAfterProgress =
  async (userId) => {

    const response = await fetch(
      `${API_URL}/api/progress/${userId}/before-after`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...authHeaders(),
        },
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
        "Failed to load before/after progress"
      );
    }

    return data;
  };
// =========================================================
// NOTIFICATIONS & REMINDERS
// =========================================================

// ===============================
// GET USER NOTIFICATIONS
// ===============================

export const getNotifications = async (userId) => {
  return requestJson(
    `/api/notifications/${userId}`
  );
};


// ===============================
// MARK NOTIFICATION AS READ
// ===============================

export const markNotificationRead = async (notificationId) => {
  return requestJson(
    `/api/notifications/${notificationId}/read`,
    {
      method: "PUT",
    }
  );
};


// ===============================
// MARK ALL NOTIFICATIONS AS READ
// ===============================

export const markAllNotificationsRead = async (userId) => {
  return requestJson(
    `/api/notifications/${userId}/read-all`,
    {
      method: "PUT",
    }
  );
};


// ===============================
// GET USER REMINDERS
// ===============================

export const getReminders = async (userId) => {
  return requestJson(
    `/api/notifications/reminders/${userId}`
  );
};


// ===============================
// GENERATE ALL AUTOMATIC NOTIFICATIONS
// ===============================

export const generateAllNotifications = async (userId) => {
  return requestJson(
    `/api/notifications/auto/generate-all/${userId}`,
    {
      method: "POST",
    }
  );
};


// ===============================
// GENERATE HEALTH INSIGHT NOTIFICATIONS
// ===============================

export const generateHealthInsightNotifications = async (userId) => {
  return requestJson(
    `/api/notifications/auto/health-insights/${userId}`,
    {
      method: "POST",
    }
  );
};



// =========================================================
// HEALTH DASHBOARD
// =========================================================

// ===============================
// GET HEALTH DASHBOARD
// ===============================

export const getHealthDashboard = async (userId) => {
  return requestJson(
    `/api/reports/health/${userId}/dashboard`
  );
};



// =========================================================
// REPORTS
// =========================================================

// ===============================
// GET SKIN ASSESSMENT REPORT
// ===============================

export const getAssessmentReport = async (userId) => {
  return requestJson(
    `/api/reports/assessment/${userId}`
  );
};


// ===============================
// GET ROUTINE REPORT
// ===============================

export const getRoutineReport = async (userId) => {
  return requestJson(
    `/api/reports/routine/${userId}`
  );
};


// ===============================
// GET PRODUCT RECOMMENDATION REPORT
// ===============================

export const getProductReport = async (userId) => {
  return requestJson(
    `/api/reports/products/${userId}`
  );
};


// ===============================
// GET PROGRESS REPORT
// ===============================

export const getProgressReport = async (userId) => {
  return requestJson(
    `/api/reports/progress/${userId}`
  );
};


// ===============================
// GET SKIN HEALTH REPORT
// ===============================

export const getHealthReport = async (userId) => {
  return requestJson(
    `/api/reports/health/${userId}`
  );
};



// =========================================================
// PDF EXPORT
// =========================================================

// ===============================
// DOWNLOAD SKIN ASSESSMENT PDF
// ===============================

export const downloadAssessmentPDF = async (userId) => {
  const response = await fetch(
    `${API_URL}/api/reports/assessment/${userId}/pdf`,
    {
      method: "GET",
      headers: {
        Accept: "application/pdf",
        ...authHeaders(),
      },
    }
  );

  if (!response.ok) {
    let message = "Failed to download assessment PDF";

    try {
      const data = await response.json();
      message = data.detail || message;
    } catch {
      // Keep default error message
    }

    throw new Error(message);
  }

  return await response.blob();
};


// ===============================
// DOWNLOAD HEALTH REPORT PDF
// ===============================

export const downloadHealthPDF = async (userId) => {
  const response = await fetch(
    `${API_URL}/api/reports/health/${userId}/pdf`,
    {
      method: "GET",
      headers: {
        Accept: "application/pdf",
        ...authHeaders(),
      },
    }
  );

  if (!response.ok) {
    let message = "Failed to download health PDF";

    try {
      const data = await response.json();
      message = data.detail || message;
    } catch {
      // Keep default error message
    }

    throw new Error(message);
  }

  return await response.blob();
};



// =========================================================
// EXCEL EXPORT
// =========================================================

// ===============================
// DOWNLOAD PROGRESS EXCEL
// ===============================

export const downloadProgressExcel = async (userId) => {
  const response = await fetch(
    `${API_URL}/api/reports/progress/${userId}/excel`,
    {
      method: "GET",
      headers: {
        Accept:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ...authHeaders(),
      },
    }
  );

  if (!response.ok) {
    let message = "Failed to download progress Excel report";

    try {
      const data = await response.json();
      message = data.detail || message;
    } catch {
      // Keep default error message
    }

    throw new Error(message);
  }

  return await response.blob();
};


// ===============================
// DOWNLOAD HEALTH EXCEL
// ===============================

export const downloadHealthExcel = async (userId) => {
  const response = await fetch(
    `${API_URL}/api/reports/health/${userId}/excel`,
    {
      method: "GET",
      headers: {
        Accept:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ...authHeaders(),
      },
    }
  );

  if (!response.ok) {
    let message = "Failed to download health Excel report";

    try {
      const data = await response.json();
      message = data.detail || message;
    } catch {
      // Keep default error message
    }

    throw new Error(message);
  }

  return await response.blob();
};
// ==========================================================
// CONSULTATION REQUESTS
// ==========================================================

// ===============================
// GET MY CONSULTATION REQUESTS
// ===============================

export const getConsultationRequests = () => {
  return requestJson(
    "/api/consultation-requests/my-requests"
  );
};


// ===============================
// GET RECEIVED CONSULTATION REQUESTS
// For Consultant / Dermatologist
// ===============================

export const getReceivedConsultationRequests = () => {
  return requestJson(
    "/api/consultation-requests/received"
  );
};


// ===============================
// CREATE CONSULTATION REQUEST
// ===============================

export const createConsultationRequest = (data) => {
  return requestJson(
    "/api/consultation-requests/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );
};


// ===============================
// ACCEPT CONSULTATION REQUEST
// ===============================

export const acceptConsultationRequest = (requestId) => {
  return requestJson(
    `/api/consultation-requests/${requestId}/accept`,
    {
      method: "PUT",
    }
  );
};


// ===============================
// REJECT CONSULTATION REQUEST
// ===============================

export const rejectConsultationRequest = (requestId) => {
  return requestJson(
    `/api/consultation-requests/${requestId}/reject`,
    {
      method: "PUT",
    }
  );
};


// ===============================
// RESPOND TO CONSULTATION REQUEST
// ===============================

export const respondToConsultationRequest = (
  requestId,
  data
) => {
  return requestJson(
    `/api/consultation-requests/${requestId}/respond`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );
};