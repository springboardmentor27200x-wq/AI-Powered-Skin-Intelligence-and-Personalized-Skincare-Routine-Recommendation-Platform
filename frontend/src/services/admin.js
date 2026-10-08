import apiClient from './api';

export const adminService = {
  // Get platform telemetry & stats
  getStats: async () => {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },

  // List and search users with role & status filters
  getUsers: async (params = {}) => {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  // Get specific user details
  getUserDetail: async (id) => {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response.data;
  },

  // Activate or deactivate user
  updateUserStatus: async (id, isActive) => {
    const response = await apiClient.patch(`/admin/users/${id}/status`, {
      is_active: isActive,
    });
    return response.data;
  },

  // Update user role
  updateUserRole: async (id, role) => {
    const response = await apiClient.patch(`/admin/users/${id}/role`, {
      role: role,
    });
    return response.data;
  },

  // List all platform connections
  getConnections: async (status = null) => {
    const params = status ? { status } : {};
    const response = await apiClient.get('/admin/connections', { params });
    return response.data;
  },

  // Get real-time system health checks
  getSystemStatus: async () => {
    const response = await apiClient.get('/admin/system-status');
    return response.data;
  },

  // Public setting fetcher (for Privacy, Terms, Security, and UI Branding)
  getPublicSetting: async (key) => {
    const response = await apiClient.get(`/admin/public-settings/${key}`);
    return response.data;
  },

  // Admin-only: Get all configurable settings & CMS content
  getAllSettings: async () => {
    const response = await apiClient.get('/admin/settings');
    return response.data.settings;
  },

  // Admin-only: Update setting by key
  updateSetting: async (key, value) => {
    const response = await apiClient.put(`/admin/settings/${key}`, { value });
    return response.data;
  },

  // Admin-only: Reset setting to clinical defaults
  resetSetting: async (key) => {
    const response = await apiClient.post(`/admin/settings/reset/${key}`);
    return response.data;
  },
};
