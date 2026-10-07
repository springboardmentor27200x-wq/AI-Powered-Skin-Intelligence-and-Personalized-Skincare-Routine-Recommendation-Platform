const API_BASE_URL = 'http://localhost:8000/api';

export const setToken = (token) => {
  if (token) {
    localStorage.setItem('skin_token', token);
  } else {
    localStorage.removeItem('skin_token');
  }
};

export const getToken = () => {
  return localStorage.getItem('skin_token');
};

export const setUserData = (user) => {
  if (user) {
    localStorage.setItem('skin_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('skin_user');
  }
};

export const getUserData = () => {
  const user = localStorage.getItem('skin_user');
  return user ? JSON.parse(user) : null;
};

export const clearAuth = () => {
  localStorage.removeItem('skin_token');
  localStorage.removeItem('skin_user');
};

const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.detail || 'An error occurred';
    throw new Error(message);
  }

  if (options.responseType === 'blob') {
    return response.blob();
  }

  return response.json();
};

export const api = {
  // ── Auth ────────────────────────────────────────────────
  register: async (fullName, email, password, role = 'USER') => {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ full_name: fullName, email, password, role }),
    });
    setToken(data.access_token);
    setUserData(data.user);
    return data;
  },

  login: async (email, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.access_token);
    setUserData(data.user);
    return data;
  },

  oauthMock: async (provider, oauthToken, email, fullName, role = 'USER') => {
    const data = await request('/auth/oauth-mock', {
      method: 'POST',
      body: JSON.stringify({ provider, oauth_token: oauthToken, email, full_name: fullName, role }),
    });
    setToken(data.access_token);
    setUserData(data.user);
    return data;
  },

  getMe: async () => {
    const user = await request('/auth/me');
    setUserData(user);
    return user;
  },

  // ── Skin Profile ─────────────────────────────────────────
  getProfile: async () => {
    return request('/profile');
  },

  saveProfile: async (profileData) => {
    return request('/profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  },

  // ── Lifestyle Tracking ───────────────────────────────────
  getTodayLog: async () => {
    return request('/lifestyle/today');
  },

  saveLifestyleLog: async (logData) => {
    return request('/lifestyle', {
      method: 'POST',
      body: JSON.stringify(logData),
    });
  },

  getLifestyleHistory: async (days = 7) => {
    return request(`/lifestyle/history?days=${days}`);
  },

  getLifestyleStats: async () => {
    return request('/lifestyle/stats');
  },

  // ── Skin Assessment (Module 3) ───────────────────────────
  runAssessment: async () => {
    return request('/assessment/run', { method: 'POST', body: JSON.stringify({}) });
  },

  getLatestAssessment: async () => {
    return request('/assessment/latest');
  },

  getAssessmentHistory: async (limit = 10) => {
    return request(`/assessment/history?limit=${limit}`);
  },

  // ── Skincare Routine (Module 4) ──────────────────────────
  generateRoutine: async () => {
    return request('/routine/generate', { method: 'POST', body: JSON.stringify({}) });
  },

  getLatestRoutine: async () => {
    return request('/routine/latest');
  },

  getRoutineByType: async (type) => {
    return request(`/routine/${type}`);
  },

  // ── Product Intelligence (Milestone 3) ───────────────────
  getProductRecommendations: async (budget = null) => {
    const qs = budget && budget !== 'Any' ? `?budget=${encodeURIComponent(budget)}` : '';
    return request(`/products/recommendations${qs}`);
  },

  analyzeProductIngredients: async (productId) => {
    return request(`/products/${productId}/analysis`);
  },

  getProductAlternatives: async (productId, budgetLimit = null) => {
    const qs = budgetLimit ? `?budget_limit=${budgetLimit}` : '';
    return request(`/products/${productId}/alternatives${qs}`);
  },

  compareProducts: async (productIds) => {
    // productIds should be an array or comma-separated string
    const ids = Array.isArray(productIds) ? productIds.join(',') : productIds;
    return request(`/products/compare?product_ids=${ids}`);
  },

  // ── Progress Tracking (Milestone 3) ──────────────────────
  logProgress: async (progressData) => {
    return request('/progress', {
      method: 'POST',
      body: JSON.stringify(progressData),
    });
  },

  getProgressHistory: async () => {
    return request('/progress');
  },

  getProgressAnalytics: async () => {
    return request('/progress/analytics');
  },

  // ── Skin Texture Vision Analysis (Single & 3-Angle Capture) ──
  analyzeTextureImage: async (formDataOrBase64, angle = 'front') => {
    if (typeof formDataOrBase64 === 'string') {
      return request('/texture/analyze', {
        method: 'POST',
        body: JSON.stringify({ image_base64: formDataOrBase64, angle }),
      });
    } else if (formDataOrBase64 instanceof FormData) {
      const token = getToken();
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE_URL}/texture/analyze`, {
        method: 'POST',
        headers,
        body: formDataOrBase64,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to analyze skin image');
      }
      return res.json();
    }
  },

  analyzeMultiAngleTexture: async (anglesPayload) => {
    // anglesPayload: { front: base64, left: base64, right: base64 }
    return request('/texture/analyze-multi', {
      method: 'POST',
      body: JSON.stringify(anglesPayload),
    });
  },

  getTextureHistory: async (limit = 10) => {
    return request(`/texture/history?limit=${limit}`);
  },

  syncTextureWithProfile: async (scanId) => {
    return request('/texture/sync-profile', {
      method: 'POST',
      body: JSON.stringify({ scan_id: scanId }),
    });
  },

  // ── Dermatologist & Clinical Specialist Portal ───────────
  getDermatologistPatients: async () => {
    return request('/dermatologist/patients');
  },

  getDermatologistCatalog: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.product_type_tag) query.append('product_type_tag', params.product_type_tag);
    if (params.concern) query.append('concern', params.concern);
    if (params.search) query.append('search', params.search);
    const qs = query.toString();
    return request(`/dermatologist/catalog${qs ? `?${qs}` : ''}`);
  },

  prescribeRoutine: async (payload) => {
    return request('/dermatologist/prescribe', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getMyPrescription: async () => {
    return request('/dermatologist/my-prescription');
  },

  // ── Notification & Reminder System (Module 10) ───────────
  getNotifications: async () => {
    return request('/notifications');
  },

  markNotificationRead: async (notificationId) => {
    return request(`/notifications/${notificationId}/read`, { method: 'POST' });
  },

  markAllNotificationsRead: async () => {
    return request('/notifications/read-all', { method: 'POST' });
  },

  dismissNotification: async (notificationId) => {
    return request(`/notifications/${notificationId}/dismiss`, { method: 'POST' });
  },

  getNotificationSettings: async () => {
    return request('/notifications/settings');
  },

  updateNotificationSettings: async (settings) => {
    return request('/notifications/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  },

  getProductReplenishments: async () => {
    return request('/notifications/replenishments');
  },

  addProductReplenishment: async (payload) => {
    return request('/notifications/replenishments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  restockProduct: async (itemId) => {
    return request(`/notifications/replenishments/${itemId}/restock`, { method: 'POST' });
  },

  deleteProductReplenishment: async (itemId) => {
    return request(`/notifications/replenishments/${itemId}`, { method: 'DELETE' });
  },

  // ── Admin Dashboard ──────────────────────────────────────
  getAdminStats: async () => {
    return request('/admin/stats');
  },

  getAdminUsers: async () => {
    return request('/admin/users');
  },

  // ── Reports & Exports ──────────────────────────────────────
  exportAssessmentPdf: async () => {
    return request('/reports/assessment/pdf', { responseType: 'blob' });
  },

  exportAssessmentExcel: async () => {
    return request('/reports/assessment/excel', { responseType: 'blob' });
  },

  exportRoutinePdf: async () => {
    return request('/reports/routine/pdf', { responseType: 'blob' });
  },

  exportProgressPdf: async () => {
    return request('/reports/progress/pdf', { responseType: 'blob' });
  },
};


