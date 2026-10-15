import api from './api';

export const authService = {
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async updateMe(data) {
    const response = await api.put('/users/me', data);
    return response.data;
  },

  async changePassword(data) {
    const response = await api.put('/users/me/password', data);
    return response.data;
  },
};
