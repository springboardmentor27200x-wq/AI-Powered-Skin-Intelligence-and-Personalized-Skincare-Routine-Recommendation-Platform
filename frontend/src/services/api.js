import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token into authorization header & normalize URL prefix
apiClient.interceptors.request.use(
  (config) => {
    if (config.url) {
      if (config.url.startsWith('/api/v1/')) {
        config.url = config.url.replace('/api/v1', '');
      } else if (config.url === '/api/v1') {
        config.url = '/';
      }
    }
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle global responses and failures
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If it's a login or registration attempt, don't perform auto-logout redirects
    const url = error.config?.url || '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');

    // Auto logout on 401 Unauthorized for protected resources
    if (!isAuthEndpoint && error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // If we are not on login/register/landing, redirect to login
      const path = (window.location.pathname || '').replace(/\/+$/, '');
      if (path !== '' && path !== '/login' && path !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
