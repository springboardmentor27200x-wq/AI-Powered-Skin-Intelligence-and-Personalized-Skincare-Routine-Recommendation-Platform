import apiClient from './api';

export const assessmentService = {
  getPrecheckData: async () => {
    const response = await apiClient.get('/assessments/precheck');
    return response.data;
  },

  runAssessment: async () => {
    const response = await apiClient.post('/assessments/run');
    return response.data;
  },

  getLatestAssessment: async () => {
    const response = await apiClient.get('/assessments/latest');
    return response.data;
  },

  getAssessmentHistory: async () => {
    const response = await apiClient.get('/assessments/history');
    return response.data;
  },

  getAssessmentById: async (id) => {
    const response = await apiClient.get(`/assessments/${id}`);
    return response.data;
  },
};

export default assessmentService;
