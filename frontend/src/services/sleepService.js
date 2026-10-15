import api from './api';

export const sleepService = {
  async getHistory(limit = 30) {
    const response = await api.get(`/sleep?limit=${limit}`);
    return response.data;
  },

  async logSleep(recordData) {
    const response = await api.post('/sleep', recordData);
    return response.data;
  },

  async updateSleep(id, recordData) {
    const response = await api.put(`/sleep/${id}`, recordData);
    return response.data;
  },

  async deleteSleep(id) {
    const response = await api.delete(`/sleep/${id}`);
    return response.data;
  },
};
