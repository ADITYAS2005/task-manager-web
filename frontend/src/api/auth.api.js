import api from './axios';

export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.patch('/auth/me', data),
  changePassword: (data) => api.patch('/auth/change-password', data),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};
