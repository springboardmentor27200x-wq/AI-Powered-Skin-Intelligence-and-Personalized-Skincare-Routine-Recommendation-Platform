import api from './api';

export const adminService = {
  async getUsers(skip = 0, limit = 50) {
    const response = await api.get(`/admin/users?skip=${skip}&limit=${limit}`);
    return response.data;
  },
};
