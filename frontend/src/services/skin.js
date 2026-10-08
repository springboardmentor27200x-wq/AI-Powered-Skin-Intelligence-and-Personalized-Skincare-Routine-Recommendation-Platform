import apiClient from './api';

export const skinService = {
  async getConcerns() {
    const response = await apiClient.get('/skin-profile/concerns');
    return response.data;
  },

  async getProfile() {
    const response = await apiClient.get('/skin-profile/me');
    return response.data;
  },

  async createProfile(profileData) {
    // profileData includes: skin_type, allergies, sensitivities, concerns: []
    try {
      const response = await apiClient.post('/skin-profile', profileData);
      return response.data;
    } catch (err) {
      // Graceful fallback to PATCH if profile already exists in DB
      if (
        err.response?.status === 400 &&
        (err.response?.data?.detail?.includes('already exists') ||
         err.response?.data?.detail?.includes('PATCH'))
      ) {
        const response = await apiClient.patch('/skin-profile/me', profileData);
        return response.data;
      }
      throw err;
    }
  },

  async updateProfile(profileData) {
    const response = await apiClient.patch('/skin-profile/me', profileData);
    return response.data;
  },
};
export default skinService;
