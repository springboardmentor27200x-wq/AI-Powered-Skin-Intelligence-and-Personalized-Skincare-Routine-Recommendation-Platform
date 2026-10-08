import apiClient from './api';

export const connectionsService = {
  // USER: Send a connection request to a professional
  createConnection: async (professionalId) => {
    const response = await apiClient.post('/connections', {
      professional_id: professionalId,
    });
    return response.data;
  },

  // USER: Get all connection requests initiated by the current user
  getMyConnections: async () => {
    const response = await apiClient.get('/connections/my');
    return response.data;
  },

  // USER: Cancel a pending request or disconnect an accepted professional
  cancelConnection: async (connectionId) => {
    const response = await apiClient.patch(`/connections/${connectionId}/cancel`);
    return response.data;
  },

  // PROFESSIONAL: Get incoming connection requests
  getIncomingRequests: async () => {
    const response = await apiClient.get('/connections/requests');
    return response.data;
  },

  // PROFESSIONAL: Accept connection request
  acceptConnection: async (connectionId) => {
    const response = await apiClient.patch(`/connections/${connectionId}/accept`);
    return response.data;
  },

  // PROFESSIONAL: Reject connection request
  rejectConnection: async (connectionId) => {
    const response = await apiClient.patch(`/connections/${connectionId}/reject`);
    return response.data;
  },

  // CONSULTANT: Refer an active client to a Dermatologist
  referDermatologist: async (clientId, dermatologistId, referralNotes, priority = 'ROUTINE') => {
    const response = await apiClient.post('/connections/refer', {
      client_id: clientId,
      dermatologist_id: dermatologistId,
      referral_notes: referralNotes,
      priority,
    });
    return response.data;
  },

  // ALL: Get unified Care Circle
  getCareCircle: async (clientId = null) => {
    const response = await apiClient.get('/connections/care-circle', {
      params: clientId ? { client_id: clientId } : {},
    });
    return response.data;
  },
};

