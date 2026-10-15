import api from './api';

export const lifestyleService = {
  async getProfile() {
    try {
      const response = await api.get('/lifestyle');
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async saveProfile(data) {
    const response = await api.post('/lifestyle', data);
    return response.data;
  },

  async updateProfile(data) {
    const response = await api.put('/lifestyle', data);
    return response.data;
  },
};
