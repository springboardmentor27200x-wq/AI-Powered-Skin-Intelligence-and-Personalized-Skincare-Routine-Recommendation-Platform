import apiClient from './api';

export const authService = {
  async register(email, password, confirmPassword, fullName, role = 'USER') {
    const response = await apiClient.post('/auth/register', {
      email,
      password,
      confirm_password: confirmPassword,
      full_name: fullName,
      role,
    });
    return response.data;
  },

  async login(email, password) {
    // Form data is urlencoded for OAuth2 compatibility
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    const response = await apiClient.post('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },

  async googleAuth(credential) {
    const response = await apiClient.post('/auth/google', { credential });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },

  async getMe() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
  },
};
