import api from './axios';

export const referrerAPI = {
    // Get all referrers
    getReferrers: async (params = {}) => {
        const response = await api.get('/referrers', { params });
        return response.data;
    },

    // Get referrer by ID
    getReferrer: async (id) => {
        const response = await api.get(`/referrers/${id}`);
        return response.data;
    },

    // Create a new referrer
    createReferrer: async (referrerData) => {
        const response = await api.post('/referrers', referrerData);
        return response.data;
    },

    // Update referrer
    updateReferrer: async (id, referrerData) => {
        const response = await api.put(`/referrers/${id}`, referrerData);
        return response.data;
    },

    // Delete referrer
    deleteReferrer: async (id) => {
        const response = await api.delete(`/referrers/${id}`);
        return response.data;
    }
};

export default referrerAPI;
