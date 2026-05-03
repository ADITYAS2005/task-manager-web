import api from './axios';

export const tasksApi = {
  getByProject: (projectId, params) => api.get(`/projects/${projectId}/tasks`, { params }),
  getMyTasks: (params) => api.get('/tasks/my', { params }),
  getDashboardStats: () => api.get('/tasks/dashboard-stats'),
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  addComment: (id, text) => api.post(`/tasks/${id}/comments`, { text }),
  deleteComment: (id, commentId) => api.delete(`/tasks/${id}/comments/${commentId}`),
};
