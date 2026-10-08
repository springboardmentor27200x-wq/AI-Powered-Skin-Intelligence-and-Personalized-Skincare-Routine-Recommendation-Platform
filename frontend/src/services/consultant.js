import apiClient from './api';

export const consultantService = {
  // Consultant: List all connected clients
  getClients: async () => {
    const response = await apiClient.get('/consultant/clients');
    return response.data;
  },

  // Consultant: List all users in platform directory to approach
  getAllUsers: async () => {
    const response = await apiClient.get('/consultant/all-users');
    return response.data;
  },

  // Consultant: Get authorized client data
  getClientDetail: async (userId) => {
    const response = await apiClient.get(`/consultant/clients/${userId}`);
    return response.data;
  },

  // Consultant: Inspect any platform user's skin profile, conditions, allergies, routines & telemetry
  inspectUser: async (userId) => {
    const response = await apiClient.get(`/consultant/inspect-user/${userId}`);
    return response.data;
  },

  // Consultant: Approach user to initiate care connection & chat
  approachUser: async (userId, introMessage = '') => {
    const response = await apiClient.post('/consultant/approach-user', {
      user_id: userId,
      intro_message: introMessage || undefined,
    });
    return response.data;
  },
};
