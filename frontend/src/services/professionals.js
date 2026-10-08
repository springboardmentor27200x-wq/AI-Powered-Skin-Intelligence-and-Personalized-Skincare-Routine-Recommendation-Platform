import apiClient from './api';

export const professionalsService = {
  // Discover professionals with optional filters (role, search, location)
  getProfessionals: async (params = {}) => {
    const response = await apiClient.get('/professionals', { params });
    return response.data;
  },

  // View public profile of a professional
  getProfessional: async (id) => {
    const response = await apiClient.get(`/professionals/${id}`);
    return response.data;
  },
};
