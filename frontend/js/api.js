/**
 * SkinIQ API Client Module
 */
const API_BASE = '/api/v1';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('skiniq_token') || null;
    this.user = JSON.parse(localStorage.getItem('skiniq_user') || 'null');
  }

  setSession(token, user) {
    this.token = token;
    this.user = user;
    if (token) {
      localStorage.setItem('skiniq_token', token);
      localStorage.setItem('skiniq_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('skiniq_token');
      localStorage.removeItem('skiniq_user');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = this.getHeaders();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {})
      }
    });

    if (response.status === 401) {
      // Clear expired session and dispatch only if user previously had token
      const hadToken = !!this.token;
      this.setSession(null, null);
      if (hadToken) {
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data && data.detail ? data.detail : `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  }

  // --- Auth Endpoints ---
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setSession(data.access_token, {
      id: data.user_id,
      email: data.email,
      full_name: data.full_name,
      role: data.role
    });
    return data;
  }

  async register(email, password, full_name, role = 'USER') {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name, role })
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // --- Profile Endpoints ---
  async getMyProfile() {
    return this.request('/profiles/me');
  }

  async getUserProfile(userId) {
    return this.request(`/profiles/${userId}`);
  }

  async saveProfile(profileData) {
    return this.request('/profiles/me', {
      method: 'POST',
      body: JSON.stringify(profileData)
    });
  }

  async updateProfilePartial(profileData) {
    return this.request('/profiles/me', {
      method: 'PATCH',
      body: JSON.stringify(profileData)
    });
  }

  // --- Tracking Endpoints ---
  async logLifestyle(data) {
    return this.request('/tracking/lifestyle', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getLifestyleHistory(days = 14) {
    return this.request(`/tracking/lifestyle/history?days=${days}`);
  }

  async logSleep(data) {
    return this.request('/tracking/sleep', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getSleepHistory(days = 14) {
    return this.request(`/tracking/sleep/history?days=${days}`);
  }

  async logHydration(water_amount_ml, target_ml = 2500) {
    return this.request('/tracking/hydration', {
      method: 'POST',
      body: JSON.stringify({ water_amount_ml, target_ml })
    });
  }

  async setHydrationTotal(total_ml, target_ml = 2500) {
    return this.request(`/tracking/hydration/set?total_ml=${total_ml}&target_ml=${target_ml}`, {
      method: 'PUT'
    });
  }

  async logEnvironment(data) {
    return this.request('/tracking/environment', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getTrackingSummary(targetDate = null) {
    const query = targetDate ? `?target_date=${targetDate}` : '';
    return this.request(`/tracking/summary${query}`);
  }

  // --- Users & RBAC ---
  async listUsers() {
    return this.request('/users/');
  }

  async getAdminStats() {
    return this.request('/users/admin/stats');
  }

  async updateUserRole(userId, role) {
    return this.request(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
  }

  async deleteUser(userId) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE'
    });
  }
}

window.api = new ApiClient();
