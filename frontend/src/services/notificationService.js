import apiClient from './api';

export const notificationService = {
  getNotifications: (params = {}) => apiClient.get('/notifications', { params }),
  getUnreadCount: () => apiClient.get('/notifications/unread-count'),
  markAsRead: (id) => apiClient.put(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.put('/notifications/read-all'),
  getPreferences: () => apiClient.get('/notifications/preferences'),
  updatePreferences: (data) => apiClient.put('/notifications/preferences', data),
  triggerSync: () => apiClient.post('/notifications/sync'),
};

export const browserNotification = {
  isSupported: () => typeof window !== 'undefined' && 'Notification' in window,
  getPermission: () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
  },
  requestPermission: async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return 'denied';
    }
  },
  show: (title, options = {}) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        return new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });
      } catch (e) {
        console.warn('Failed to display browser notification:', e);
      }
    }
    return null;
  },
};

