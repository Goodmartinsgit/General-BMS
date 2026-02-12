import api from './axios';

export const salesAPI = {
    // Get all sales with optional filters
    getSales: async (params = {}) => {
        const response = await api.get('/sales', { params });
        return response.data;
    },

    // Get a specific sale by ID
    getSale: async (id) => {
        const response = await api.get(`/sales/${id}`);
        return response.data;
    },

    // Create a new sale
    createSale: async (saleData) => {
        const response = await api.post('/sales', saleData);
        return response.data;
    },

    // Reverse a sale
    reverseSale: async (id, reason) => {
        const response = await api.post(`/sales/${id}/reverse`, { reason });
        return response.data;
    },

    // Add comment to a sale
    addComment: async (id, comment) => {
        const response = await api.post(`/sales/${id}/comments`, { comment });
        return response.data;
    },

    // Get sale comments
    getComments: async (id) => {
        const response = await api.get(`/sales/${id}/comments`);
        return response.data;
    }
};

export default salesAPI;
