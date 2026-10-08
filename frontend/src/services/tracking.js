import apiClient from './api';

export const trackingService = {
  // --- Lifestyle ---
  async getLifestyle(date = null) {
    const url = date ? `/lifestyle?record_date=${date}` : '/lifestyle';
    const response = await apiClient.get(url);
    return response.data;
  },
  async createLifestyle(data) {
    const response = await apiClient.post('/lifestyle', data);
    return response.data;
  },
  async updateLifestyle(id, data) {
    const response = await apiClient.patch(`/lifestyle/${id}`, data);
    return response.data;
  },
  async deleteLifestyle(id) {
    await apiClient.delete(`/lifestyle/${id}`);
  },

  // --- Sleep ---
  async getSleep(date = null) {
    const url = date ? `/sleep?record_date=${date}` : '/sleep';
    const response = await apiClient.get(url);
    return response.data;
  },
  async createSleep(data) {
    const response = await apiClient.post('/sleep', data);
    return response.data;
  },
  async updateSleep(id, data) {
    const response = await apiClient.patch(`/sleep/${id}`, data);
    return response.data;
  },
  async deleteSleep(id) {
    await apiClient.delete(`/sleep/${id}`);
  },

  // --- Hydration ---
  async getHydration(date = null) {
    const url = date ? `/hydration?record_date=${date}` : '/hydration';
    const response = await apiClient.get(url);
    return response.data;
  },
  async createHydration(data) {
    const response = await apiClient.post('/hydration', data);
    return response.data;
  },
  async updateHydration(id, data) {
    const response = await apiClient.patch(`/hydration/${id}`, data);
    return response.data;
  },
  async deleteHydration(id) {
    await apiClient.delete(`/hydration/${id}`);
  },

  // --- Environment ---
  async getEnvironment(date = null) {
    const url = date ? `/environment?record_date=${date}` : '/environment';
    const response = await apiClient.get(url);
    return response.data;
  },
  async createEnvironment(data) {
    const response = await apiClient.post('/environment', data);
    return response.data;
  },
  async updateEnvironment(id, data) {
    const response = await apiClient.patch(`/environment/${id}`, data);
    return response.data;
  },
  async deleteEnvironment(id) {
    await apiClient.delete(`/environment/${id}`);
  },
};
export default trackingService;
