import apiClient from './api';

export const dermatologistService = {
  // Dermatologist: List all connected patients
  getPatients: async () => {
    const response = await apiClient.get('/dermatologist/patients');
    return response.data;
  },

  // Dermatologist: List all users in platform directory to approach
  getAllUsers: async () => {
    const response = await apiClient.get('/dermatologist/all-users');
    return response.data;
  },

  // Dermatologist: List all skincare consultants to connect & collaborate
  getAllConsultants: async () => {
    const response = await apiClient.get('/dermatologist/all-consultants');
    return response.data;
  },

  // Dermatologist: Get authorized patient clinical data
  getPatientDetail: async (userId) => {
    const response = await apiClient.get(`/dermatologist/patients/${userId}`);
    return response.data;
  },

  // Dermatologist: Inspect any platform user's skin profile, conditions, allergies, routines & telemetry
  inspectUser: async (userId) => {
    const response = await apiClient.get(`/dermatologist/inspect-user/${userId}`);
    return response.data;
  },

  // Dermatologist: Approach user to initiate care connection & chat
  approachUser: async (userId, introMessage = '') => {
    const response = await apiClient.post('/dermatologist/approach-user', {
      user_id: userId,
      intro_message: introMessage || undefined,
    });
    return response.data;
  },

  // Dermatologist: Approach consultant colleague to initiate peer collaboration & chat
  approachConsultant: async (consultantId, introMessage = '') => {
    const response = await apiClient.post('/dermatologist/approach-consultant', {
      consultant_id: consultantId,
      intro_message: introMessage || undefined,
    });
    return response.data;
  },
};
