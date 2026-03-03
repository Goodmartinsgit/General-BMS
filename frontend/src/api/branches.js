import api from './axios';

export const branchesAPI = {
    // Get branch mode (single vs multi-branch) — auto-creates Main Branch if none exist
    getBranchMode: async () => {
        const response = await api.get('/branches/mode');
        return response.data;
    },

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

    // Get organizations
    getOrganizations: async () => {
        const response = await api.get('/branches/organizations');
        return response.data;
    },

    // =========================================================================
    // BRANCH ANALYTICS (from /api/branch-analytics)
    // =========================================================================

    // Get branch performance dashboard
    getBranchDashboard: async (branchId, params = {}) => {
        const response = await api.get(`/branch-analytics/${branchId}/dashboard`, { params });
        return response.data;
    },

    // Get branch sales report
    getBranchSalesReport: async (branchId, params = {}) => {
        const response = await api.get(`/branch-analytics/${branchId}/sales-report`, { params });
        return response.data;
    },

    // Get branch inventory valuation
    getBranchInventoryValuation: async (branchId) => {
        const response = await api.get(`/branch-analytics/${branchId}/inventory-valuation`);
        return response.data;
    },

    // Get branch low stock report
    getBranchLowStock: async (branchId) => {
        const response = await api.get(`/branch-analytics/${branchId}/low-stock`);
        return response.data;
    },

    // Get branch P&L report
    getBranchPLReport: async (branchId, params = {}) => {
        const response = await api.get(`/branch-analytics/${branchId}/pl-report`, { params });
        return response.data;
    },

    // Compare all branches
    compareBranches: async (params = {}) => {
        const response = await api.get('/branch-analytics/comparison', { params });
        return response.data;
    },

    // Get branch staff performance
    getBranchStaffPerformance: async (branchId, params = {}) => {
        const response = await api.get(`/branch-analytics/${branchId}/staff-performance`, { params });
        return response.data;
    },

    // Get branch customer analytics
    getBranchCustomerAnalytics: async (branchId, params = {}) => {
        const response = await api.get(`/branch-analytics/${branchId}/customer-analytics`, { params });
        return response.data;
    }
};

export default branchesAPI;
