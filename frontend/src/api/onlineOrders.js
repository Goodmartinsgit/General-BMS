import api from './axios';

export const getOnlineOrders = (params) => api.get('/online-orders', { params });
export const getOnlineOrderById = (id) => api.get(`/online-orders/${id}`);
export const updateOrderStatus = (id, data) => api.put(`/online-orders/${id}/status`, data);
export const updateOrderTracking = (id, data) => api.put(`/online-orders/${id}/tracking`, data);
export const updateOrderNotes = (id, data) => api.put(`/online-orders/${id}/notes`, data);
export const confirmPayment = (id) => api.put(`/online-orders/${id}/confirm-payment`);
export const rejectPayment = (id, data) => api.put(`/online-orders/${id}/reject-payment`, data);
export const getOrderStats = () => api.get('/online-orders/stats');
