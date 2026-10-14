
 // API CONFIGURATION
const API_URL = "http://127.0.0.1:8000";

// AUTHORIZATION HEADER
const authHeaders = () => {
  const token = localStorage.getItem("token");

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
};

// SHARED ERROR HANDLER
const getErrorMessage = (data, fallback) => {
  const detail = data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) =>
        typeof item === "string"
          ? item
          : item.msg || JSON.stringify(item)
      )
      .join(", ");
  }

  if (detail) {
    return JSON.stringify(detail);
  }

  return fallback;
};

// SHARED JSON REQUEST
const requestJson = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(
      getErrorMessage(data, `Request failed (${response.status})`)
    );
    error.status = response.status;
    throw error;
  }

  return data;
};

// =====================================================
// PRODUCT RECOMMENDATIONS
// =====================================================

export const getProductRecommendations = (filters = {}) => {
  const query = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value != null) {
      query.set(key, value);
    }
  });

  return requestJson(`/api/products/recommendations?${query}`);
};

export const getProductAlternatives = (id) =>
  requestJson(`/api/products/${id}/alternatives`);

export const compareProducts = (ids) =>
  requestJson("/api/products/compare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ids),
  });

export const getProductCombos = () =>
  requestJson("/api/products/combos");

// =====================================================
// DAILY CHECK-INS
// =====================================================

export const getDailyCheckins = (userId, days = 30) =>
  requestJson(`/api/checkins/${userId}?days=${days}`);

export const saveDailyCheckin = (userId, data) =>
  requestJson(`/api/checkins/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

// =====================================================
// AUTHENTICATION
// =====================================================

export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(userData),
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Registration failed")
    );
  }

  return data;
};

export const loginUser = async (userData) => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(userData),
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Login failed"));
  }

  if (!data.access_token || !data.user?.id) {
    throw new Error("Invalid login response from server");
  }

  return {
    access_token: data.access_token,
    user_id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    role: data.user.role,
  };
};

// =====================================================
// SKIN PROFILE
// =====================================================

// CREATE SKIN PROFILE
export const createSkinProfile = async (profileData) => {
  const response = await fetch(`${API_URL}/api/profile/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(profileData),
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Failed to save skin profile")
    );
  }

  return data;
};

// GET EXISTING SKIN PROFILE
export const getSkinProfile = async (userId) => {
  if (!userId) {
    throw new Error("User ID is missing. Please log in again.");
  }

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

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(
      getErrorMessage(data, "Failed to get skin profile")
    );
    error.status = response.status;
    throw error;
  }

  return data;
};

// UPDATE EXISTING SKIN PROFILE
export const updateSkinProfile = async (userId, profileData) => {
  if (!userId) {
    throw new Error("User ID is missing. Please log in again.");
  }

  const response = await fetch(
    `${API_URL}/api/profile/${userId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({
        ...profileData,
        user_id: userId,
      }),
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Failed to update skin profile")
    );
  }

  return data;
};

// =====================================================
// LIFESTYLE
// =====================================================

// CREATE LIFESTYLE
export const createLifestyle = async (lifestyleData) => {
  const response = await fetch(`${API_URL}/api/lifestyle/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(lifestyleData),
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Failed to save lifestyle data")
    );
  }

  return data;
};

// GET LIFESTYLE
export const getLifestyle = async (userId) => {
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

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Failed to get lifestyle data")
    );
  }

  return data;
};

// =====================================================
// SLEEP
// =====================================================

// CREATE SLEEP
export const createSleep = async (sleepData) => {
  const response = await fetch(`${API_URL}/api/sleep/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(sleepData),
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Failed to save sleep data")
    );
  }

  return data;
};

// GET SLEEP
export const getSleep = async (userId) => {
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

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Failed to get sleep data")
    );
  }

  return data;
};

// =====================================================
// DERMATOLOGIST: PATIENTS
// =====================================================

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

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Failed to get patient list")
    );
  }

  return data;
};

// =====================================================
// ADMIN: USERS
// =====================================================

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

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Failed to get users")
    );
  }

  return data;
};

// =====================================================
// CONSULTATIONS
// =====================================================

// CREATE CONSULTATION
export const createConsultation = async (consultationData) => {
  const response = await fetch(
    `${API_URL}/api/consultations/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(consultationData),
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Failed to create consultation")
    );
  }

  return data;
};

// GET CLIENT CONSULTATIONS
export const getClientConsultations = async (clientId) => {
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

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Failed to get consultation history")
    );
  }

  return data;
};

// =====================================================
// SKIN ASSESSMENT
// =====================================================

// CREATE SKIN ASSESSMENT
export const createSkinAssessment = async (userId) => {
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

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Failed to create skin assessment")
    );
  }

  return data;
};

// GET SKIN ASSESSMENT
export const getSkinAssessment = async (userId) => {
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

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Failed to fetch skin assessment")
    );
  }

  return data;
};

// =====================================================
// PERSONALIZED ROUTINE
// =====================================================

// CREATE PERSONALIZED ROUTINE
export const createPersonalizedRoutine = async (userId) => {
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

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Failed to create personalized routine")
    );
  }

  return data;
};

// GET PERSONALIZED ROUTINE
export const getPersonalizedRoutine = async (userId) => {
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

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Failed to fetch skincare routine")
    );
  }

  return data;
};

// =====================================================
// PROGRESS TRACKING
// =====================================================

// GET USER PROGRESS
export const getProgress = async (userId) => {
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

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Failed to load progress")
    );
  }

  return data;
};

// BEFORE / AFTER PROGRESS
export const getBeforeAfterProgress = async (userId) => {
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

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Failed to load before/after progress")
    );
  }

  return data;
};

// =====================================================
// NOTIFICATIONS & REMINDERS
// =====================================================

// GET USER NOTIFICATIONS
export const getNotifications = async (userId) =>
  requestJson(`/api/notifications/${userId}`);

// MARK NOTIFICATION AS READ
export const markNotificationRead = async (notificationId) =>
  requestJson(`/api/notifications/${notificationId}/read`, {
    method: "PUT",
  });

// MARK ALL NOTIFICATIONS AS READ
export const markAllNotificationsRead = async (userId) =>
  requestJson(`/api/notifications/${userId}/read-all`, {
    method: "PUT",
  });

// GET USER REMINDERS
export const getReminders = async (userId) =>
  requestJson(`/api/notifications/reminders/${userId}`);

// GENERATE ALL AUTOMATIC NOTIFICATIONS
export const generateAllNotifications = async (userId) =>
  requestJson(`/api/notifications/auto/generate-all/${userId}`, {
    method: "POST",
  });

// GENERATE HEALTH INSIGHT NOTIFICATIONS
export const generateHealthInsightNotifications = async (userId) =>
  requestJson(
    `/api/notifications/auto/health-insights/${userId}`,
    {
      method: "POST",
    }
  );

// =====================================================
// HEALTH DASHBOARD & REPORTS
// =====================================================

// HEALTH DASHBOARD
export const getHealthDashboard = async (userId) =>
  requestJson(`/api/reports/health/${userId}/dashboard`);

// GET SKIN ASSESSMENT REPORT
export const getAssessmentReport = async (userId) =>
  requestJson(`/api/reports/assessment/${userId}`);

// GET ROUTINE REPORT
export const getRoutineReport = async (userId) =>
  requestJson(`/api/reports/routine/${userId}`);

// GET PRODUCT RECOMMENDATION REPORT
export const getProductReport = async (userId) =>
  requestJson(`/api/reports/products/${userId}`);

// GET PROGRESS REPORT
export const getProgressReport = async (userId) =>
  requestJson(`/api/reports/progress/${userId}`);

// GET SKIN HEALTH REPORT
export const getHealthReport = async (userId) =>
  requestJson(`/api/reports/health/${userId}`);

// =====================================================
// PDF EXPORT
// =====================================================

// DOWNLOAD SKIN ASSESSMENT PDF
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
      message = getErrorMessage(data, message);
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  return response.blob();
};

// DOWNLOAD HEALTH REPORT PDF
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
      message = getErrorMessage(data, message);
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  return response.blob();
};

// =====================================================
// EXCEL EXPORT
// =====================================================

// DOWNLOAD PROGRESS EXCEL
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
      message = getErrorMessage(data, message);
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  return response.blob();
};

// DOWNLOAD HEALTH EXCEL
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
      message = getErrorMessage(data, message);
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  return response.blob();
};

// =====================================================
// CONSULTATION REQUESTS
// =====================================================

// GET MY CONSULTATION REQUESTS
export const getConsultationRequests = () =>
  requestJson("/api/consultation-requests/my-requests");

// GET RECEIVED CONSULTATION REQUESTS
export const getReceivedConsultationRequests = () =>
  requestJson("/api/consultation-requests/received");

// CREATE CONSULTATION REQUEST
export const createConsultationRequest = (data) =>
  requestJson("/api/consultation-requests/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

// ACCEPT CONSULTATION REQUEST
export const acceptConsultationRequest = (requestId) =>
  requestJson(`/api/consultation-requests/${requestId}/accept`, {
    method: "PUT",
  });

// REJECT CONSULTATION REQUEST
export const rejectConsultationRequest = (requestId) =>
  requestJson(`/api/consultation-requests/${requestId}/reject`, {
    method: "PUT",
  });

// RESPOND TO CONSULTATION REQUEST
export const respondToConsultationRequest = (requestId, data) =>
  requestJson(`/api/consultation-requests/${requestId}/respond`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
