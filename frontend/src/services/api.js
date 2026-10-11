import axios from "axios";

const getApiBaseUrl = () => {
  const envUrl =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_URL;

  if (envUrl && typeof envUrl === "string" && envUrl.trim() !== "") {
    const clean = envUrl.trim().replace(/\/+$/, "");
    return clean.endsWith("/api") ? clean : `${clean}/api`;
  }

  // When deployed on Render or any public web domain
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return "https://ai-powered-skin-intelligence-and.onrender.com/api";
  }

  return "http://127.0.0.1:8000/api";
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const register = (data) => api.post("/auth/register", data);
export const login    = (data) => api.post("/auth/login", data);

// ── Users ─────────────────────────────────────────────────────────────────────
export const getCurrentUser    = ()     => api.get("/users/me");
export const updateCurrentUser = (data) => api.put("/users/me", data);
export const changePassword    = (data) => api.post("/users/change-password", data);

// Admin
export const listUsers       = ()               => api.get("/users/");
export const adminCreateUser = (data)           => api.post("/users/", data);
export const updateRole      = (userId, role)   => api.put(`/users/${userId}/role`, { role });
export const deleteUser      = (userId)         => api.delete(`/users/${userId}`);

// Consultant
export const listClients  = ()               => api.get("/users/clients");

// ── Skin Profile ──────────────────────────────────────────────────────────────
export const createProfile       = (data)    => api.post("/profile", data);
export const getProfile          = ()        => api.get("/profile");
export const updateProfile       = (data)    => api.put("/profile", data);
export const getProfileByUserId  = (userId)  => api.get(`/profile/user/${userId}`);
export const getProfileByUser    = getProfileByUserId;

// ── Sleep Logs ────────────────────────────────────────────────────────────────
export const logSleep         = (data) => api.post("/sleep", data);
export const getSleepLogs     = ()     => api.get("/sleep");
export const getTodaySleep    = ()     => api.get("/sleep/today");
export const deleteSleepLog   = (id)  => api.delete(`/sleep/${id}`);

// ── Hydration Logs ────────────────────────────────────────────────────────────
export const logHydration     = (data) => api.post("/hydration", data);
export const getHydrationLogs = ()     => api.get("/hydration");
export const getTodayHydration= ()     => api.get("/hydration/today");
export const deleteHydrationLog=(id)  => api.delete(`/hydration/${id}`);

// ── Lifestyle Logs ────────────────────────────────────────────────────────────
export const logLifestyle        = (data) => api.post("/lifestyle", data);
export const getLifestyleLogs    = ()     => api.get("/lifestyle");
export const getLatestLifestyle  = ()     => api.get("/lifestyle/latest");
export const deleteLifestyleLog  = (id)  => api.delete(`/lifestyle/${id}`);

// ── Skin Assessment & AI Scanner ──────────────────────────────────────────────
export const evaluateAssessment = ()             => api.post("/assessment/evaluate");
export const getAssessment       = ()             => api.get("/assessment");
export const scanFaceImage       = (image_base64) => api.post("/assessment/scan-face", { image_base64 });
export const applyScanResults    = (data)         => api.post("/assessment/apply-scan-results", data);

// ── Skincare Routine ──────────────────────────────────────────────────────────
export const generateRoutine   = () => api.post("/routine/generate");
export const getRoutine           = () => api.get("/routine");
export const updateChecklist   = (completed_steps) => api.post("/routine/checklist", { completed_steps });
export const getTodayChecklist = () => api.get("/routine/checklist/today");

// ── Ingredient Intelligence ───────────────────────────────────────────────────
export const getIngredientsCatalog = ()       => api.get("/ingredients");
export const analyzeFormula        = (data)   => api.post("/ingredients/analyze", data);

// ── Product Recommendations ───────────────────────────────────────────────────
export const getRecommendations = (category, budgetTier) => {
  const params = {};
  if (category) params.category = category;
  if (budgetTier) params.budget_tier = budgetTier;
  return api.get("/products/recommendations", { params });
};
export const getProductRecommendations = getRecommendations;
export const compareProducts = (productIds) => api.post("/products/compare", { product_ids: productIds });

// ── Progress Tracking ─────────────────────────────────────────────────────────
export const createProgressLog    = (data)     => api.post("/progress", data);
export const logProgress          = createProgressLog;
export const getProgressHistory   = (limit=30) => api.get(`/progress/history?limit=${limit}`);
export const getProgressAnalytics = ()         => api.get("/progress/analytics");

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications          = (limit = 30) => api.get(`/notifications?limit=${limit}`);
export const markNotificationRead      = (id)         => api.put(`/notifications/${id}/read`);
export const markAllNotificationsRead  = ()            => api.put("/notifications/read-all");
export const generateReminders         = ()            => api.post("/notifications/generate");
export const deleteNotification        = (id)          => api.delete(`/notifications/${id}`);
export const listUsersForNotification  = ()            => api.get("/notifications/users");
export const sendNotificationToUser    = (data)        => api.post("/notifications/send", data);
export const broadcastNotification     = (data)        => api.post("/notifications/broadcast", data);

// ── Dermatologist ─────────────────────────────────────────────────────────────
export const getDermatologistPatients      = ()          => api.get("/dermatologist/patients");
export const getDermatologistPatientDetail = (id)        => api.get(`/dermatologist/patients/${id}`);
export const createTreatmentReport         = (data)      => api.post("/dermatologist/treatment", data);
export const getDermatologistReports       = ()          => api.get("/dermatologist/reports");
export const getPatientReports             = (patientId) => api.get(`/dermatologist/reports/${patientId}`);
export const getMyTreatmentPlans           = ()          => api.get("/dermatologist/my-treatment-plans");

// ── Reports & Export ──────────────────────────────────────────────────────────
export const getSkinHealthReport   = ()  => api.get("/reports/skin-health");
export const exportProgressCsv     = ()  => api.get("/reports/export/csv", { responseType: "blob" });
export const getAdminAnalytics     = ()  => api.get("/reports/admin/analytics");

export default api;
