import api from './axios';

export const returnsAPI = {
    // Get all returns with optional filters
    getReturns: async (params = {}) => {
        const response = await api.get('/returns', { params });
        return response.data;
    },

    // Get a specific return by ID
    getReturn: async (id) => {
        const response = await api.get(`/returns/${id}`);
        return response.data;
    },

    // Create a new return request
    createReturn: async (returnData) => {
        const response = await api.post('/returns', returnData);
        return response.data;
    },

    // Approve a return
    approveReturn: async (id, approvalData) => {
        const response = await api.post(`/returns/${id}/approve`, approvalData);
        return response.data;
    },

    // Reject a return
    rejectReturn: async (id, rejectionData) => {
        const response = await api.post(`/returns/${id}/reject`, rejectionData);
        return response.data;
    },

    // Process a return (complete refund or exchange)
    processReturn: async (id, processData) => {
        const response = await api.post(`/returns/${id}/process`, processData);
        return response.data;
    },

    // Complete an exchange
    completeExchange: async (id, exchangeData) => {
        const response = await api.post(`/returns/${id}/complete-exchange`, exchangeData);
        return response.data;
    },

    // Get return statistics
    getStats: async (params = {}) => {
        const response = await api.get('/returns/stats', { params });
        return response.data;
    },

    // Get returns by sale
    getReturnsBySale: async (saleId) => {
        const response = await api.get(`/sales/${saleId}/returns`);
        return response.data;
    }
};

export default returnsAPI;
