import api from './api';

export const hydrationService = {
  async getSummary(limit = 30) {
    const response = await api.get(`/hydration?limit=${limit}`);
    return response.data;
  },

  async logHydration(data) {
    const response = await api.post('/hydration', data);
    return response.data;
  },

  async updateHydration(id, data) {
    const response = await api.put(`/hydration/${id}`, data);
    return response.data;
  },

  async deleteHydration(id) {
    const response = await api.delete(`/hydration/${id}`);
    return response.data;
  },
};
