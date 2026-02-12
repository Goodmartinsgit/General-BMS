import api from './axios';

export const branchesAPI = {
    // Get all branches
    getBranches: async (params = {}) => {
        const response = await api.get('/branches', { params });
        return response.data;
    },

    // Get single branch by ID
    getBranch: async (id) => {
        const response = await api.get(`/branches/${id}`);
        return response.data;
    },

    // Create a new branch
    createBranch: async (branchData) => {
        const response = await api.post('/branches', branchData);
        return response.data;
    },

    // Update a branch
    updateBranch: async (id, branchData) => {
        const response = await api.put(`/branches/${id}`, branchData);
        return response.data;
    },

    // Delete a branch
    deleteBranch: async (id) => {
        const response = await api.delete(`/branches/${id}`);
        return response.data;
    },

    // Get branch inventory
    getBranchInventory: async (id, params = {}) => {
        const response = await api.get(`/branches/${id}/inventory`, { params });
        return response.data;
    },

    // Get branch analytics
    getBranchAnalytics: async (id, params = {}) => {
        const response = await api.get(`/branches/${id}/analytics`, { params });
        return response.data;
    },

    // Get branch sales summary
    getBranchSales: async (id, params = {}) => {
        const response = await api.get(`/branches/${id}/sales`, { params });
        return response.data;
    }
};

export default branchesAPI;
