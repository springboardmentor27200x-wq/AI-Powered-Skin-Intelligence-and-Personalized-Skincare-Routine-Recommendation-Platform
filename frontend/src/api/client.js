const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.detail || "Something went wrong. Please try again.";
    const error = new Error(typeof message === "string" ? message : "Something went wrong.");
    error.status = res.status;
    throw error;
  }

  return data;
}

export function registerUser(payload) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload) {
  return request("/auth/login-json", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchCurrentUser(token) {
  return request("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}
export function fetchSkinProfile(token) {
  return request("/skin-profile/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function saveSkinProfile(token, payload) {
  return request("/skin-profile/me", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}
export function fetchDailyLogs(token, limit = 30) {
  return request(`/daily-logs?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function saveDailyLog(token, payload) {
  return request("/daily-logs", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function deleteDailyLog(token, logDate) {
  // The backend keys a day's entry by date (it spans four tables under
  // the hood), not by a single row id — see routers/daily_log.py.
  return request(`/daily-logs/${logDate}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
export function fetchAdminUsers(token, params = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""))
  ).toString();
  return request(`/admin/users${query ? `?${query}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function updateUserRole(token, userId, role) {
  return request(`/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ role }),
  });
}

export function updateUserStatus(token, userId, isActive) {
  return request(`/admin/users/${userId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ is_active: isActive }),
  });
}

export function fetchAdminStats(token) {
  return request("/admin/stats", {
    headers: { Authorization: `Bearer ${token}` },
  });
}
export function runAssessment(token) {
  return request("/assessments/me/run", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getLatestAssessment(token) {
  return request("/assessments/me/latest", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getAssessmentHistory(token, limit = 30) {
  return request(`/assessments/me/history?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function generateRoutine(token) {
  return request("/routines/me/generate", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getRoutine(token) {
  return request("/routines/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}
export function markAdherence(token, payload) {
  return request("/adherence/me", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function getAdherence(token, days = 7) {
  return request(`/adherence/me?days=${days}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
export function fetchIngredients(token) {
  return request("/ingredients", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function fetchIngredientDetail(token, ingredientId) {
  return request(`/ingredients/${ingredientId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function fetchMySuitability(token) {
  return request("/ingredients/me/suitability", {
    headers: { Authorization: `Bearer ${token}` },
  });
}


export function compareProducts(token, ids) {
  return request(`/products/compare?ids=${ids.join(",")}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function fetchAlternatives(token, productId) {
  return request(`/products/${productId}/alternatives`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
export function fetchAnalytics(token) {
  return request("/assessments/me/analytics", {
    headers: { Authorization: `Bearer ${token}` },
  });
}
export function fetchRecommendations(token, { category, maxPrice, limit } = {}) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "") params.set("max_price", maxPrice);
  if (limit !== undefined && limit !== null) params.set("limit", limit);
  const qs = params.toString();
  return request(`/products/me/recommendations${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
export function fetchClients(token) {
  return request("/clients", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function fetchClientDetail(token, clientId) {
  return request(`/clients/${clientId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
export function fetchClientNotes(token, clientId) {
  return request(`/clients/${clientId}/notes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function addClientNote(token, clientId, content) {
  return request(`/clients/${clientId}/notes`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content }),
  });
}
export function fetchAdminAnalytics(token) {
  return request("/admin/analytics", {
    headers: { Authorization: `Bearer ${token}` },
  });
}
async function downloadFile(token, path, filename) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.detail || "Could not generate the report.");
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export const downloadAssessmentReportPdf = (token) => downloadFile(token, "/reports/assessment/pdf", "skin-assessment-report.pdf");
export const downloadAssessmentReportExcel = (token) => downloadFile(token, "/reports/assessment/excel", "skin-assessment-report.xlsx");
export const downloadRoutineReportPdf = (token) => downloadFile(token, "/reports/routine/pdf", "routine-report.pdf");
export const downloadProductsReportPdf = (token) => downloadFile(token, "/reports/products/pdf", "product-recommendations.pdf");
export const downloadProductsReportExcel = (token) => downloadFile(token, "/reports/products/excel", "product-recommendations.xlsx");
export const downloadProgressReportPdf = (token) => downloadFile(token, "/reports/progress/pdf", "progress-report.pdf");
export const downloadProgressReportExcel = (token) => downloadFile(token, "/reports/progress/excel", "progress-report.xlsx");
export const downloadSkinHealthReportPdf = (token) => downloadFile(token, "/reports/skin-health/pdf", "skin-health-report.pdf");
export function fetchMyNotifications(token) {
  return request("/notifications/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function fetchAnnouncements(token) {
  return request("/notifications/announcements", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createAnnouncement(token, payload) {
  return request("/notifications/announcements", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function deleteAnnouncement(token, announcementId) {
  return request(`/notifications/announcements/${announcementId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
export function fetchAllMyNotifications(token) {
  return request("/notifications/me?announcement_limit=50", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function fetchProductCatalog() {
  return request("/products");
}

export function fetchMyProducts(token) {
  return request("/my-products", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function startUsingProduct(token, productId, lastsDays = null) {
  return request("/my-products", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ product_id: productId, lasts_days: lastsDays }),
  });
}

export function stopUsingProduct(token, productId) {
  return request(`/my-products/${productId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
export function fetchRecommendationMonitoring(token) {
  return request("/admin/recommendations", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export const downloadSystemReportPdf = (token) =>
  downloadFile(token, "/admin/reports/system/pdf", "platform-system-report.pdf");
export const downloadSystemReportExcel = (token) =>
  downloadFile(token, "/admin/reports/system/excel", "platform-system-report.xlsx");