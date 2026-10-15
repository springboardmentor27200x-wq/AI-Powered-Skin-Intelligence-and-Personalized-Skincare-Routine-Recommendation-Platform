import api from './api';

export const skinService = {
  async getProfile() {
    try {
      const response = await api.get('/skin-profile');
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async saveProfile(profileData) {
    const response = await api.post('/skin-profile', profileData);
    return response.data;
  },

  async updateProfile(profileData) {
    const response = await api.put('/skin-profile', profileData);
    return response.data;
  },
};
