import apiClient from './api';

export const chatService = {
  // Get all conversation channels for current user
  getConversations: async () => {
    const response = await apiClient.get('/chat/conversations');
    return response.data;
  },

  // Get message thread with a specific partner
  getMessages: async (partnerId) => {
    const response = await apiClient.get(`/chat/${partnerId}/messages`);
    return response.data;
  },

  // Send a message to a partner
  sendMessage: async (partnerId, { message, message_type = 'TEXT', meta_data = null }) => {
    const response = await apiClient.post(`/chat/${partnerId}/messages`, {
      message,
      message_type,
      meta_data,
    });
    return response.data;
  },

  // Mark all unread messages from a partner as read
  markAsRead: async (partnerId) => {
    const response = await apiClient.patch(`/chat/${partnerId}/read`);
    return response.data;
  },

  // Get contextual quick response chips
  getSuggestions: async () => {
    const response = await apiClient.get('/chat/suggestions');
    return response.data;
  },
};

export default chatService;
