import api from './axios';

export const fiscalPeriodsAPI = {
    getAll: () => api.get('/fiscal-periods').then(r => r.data),
    getActive: () => api.get('/fiscal-periods/active').then(r => r.data),
    create: (data) => api.post('/fiscal-periods', data).then(r => r.data),
    update: (id, data) => api.put(`/fiscal-periods/${id}`, data).then(r => r.data),
    activate: (id) => api.put(`/fiscal-periods/${id}/activate`).then(r => r.data),
    close: (id) => api.put(`/fiscal-periods/${id}/close`).then(r => r.data),
    lock: (id) => api.put(`/fiscal-periods/${id}/lock`).then(r => r.data),
    unlock: (id) => api.put(`/fiscal-periods/${id}/unlock`).then(r => r.data),
    delete: (id) => api.delete(`/fiscal-periods/${id}`).then(r => r.data),
    getGlobalSettings: () => api.get('/fiscal-periods/global-settings').then(r => r.data),
    updateGlobalSettings: (data) => api.put('/fiscal-periods/global-settings', data).then(r => r.data),
    getCurrentRange: () => api.get('/fiscal-periods/current-range').then(r => r.data),
};

export default fiscalPeriodsAPI;
