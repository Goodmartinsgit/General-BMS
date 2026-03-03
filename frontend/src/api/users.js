import api from './axios';

const usersAPI = {
  // List all users visible to the current actor
  getAll: () => api.get('/users'),

  // Roles
  getRoles: () => api.get('/users/roles'),
  getManageableRoles: () => api.get('/users/manageable-roles'),

  // CRUD
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),

  // Lock / Unlock
  lock:   (id, reason) => api.post(`/users/${id}/lock`, { reason }),
  unlock: (id)         => api.post(`/users/${id}/unlock`),

  // Admin password reset (returns temporary_password)
  resetPassword: (id) => api.post(`/users/${id}/reset-password`),

  // Role change
  changeRole: (id, role_id) => api.patch(`/users/${id}/role`, { role_id }),
};

export default usersAPI;
