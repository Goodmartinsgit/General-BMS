import api from './axios';

export const customerAPI = {
    // Get all customers
    getCustomers: async (params = {}) => {
        const response = await api.get('/customers', { params });
        return response.data;
    },

    // Get customer by ID
    getCustomer: async (id) => {
        const response = await api.get(`/customers/${id}`);
        return response.data;
    },

    // Create a new customer
    createCustomer: async (customerData) => {
        const response = await api.post('/customers', customerData);
        return response.data;
    },

    // Update customer
    updateCustomer: async (id, customerData) => {
        const response = await api.put(`/customers/${id}`, customerData);
        return response.data;
    },

    // Delete customer
    deleteCustomer: async (id) => {
        const response = await api.delete(`/customers/${id}`);
        return response.data;
    }
};

export default customerAPI;
