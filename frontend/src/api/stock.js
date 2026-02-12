import api from './axios';

export const stockAPI = {
    // ============ STOCK TRANSFERS ============

    // Get all stock transfers with optional filters
    getTransfers: async (params = {}) => {
        const response = await api.get('/stock/transfers', { params });
        return response.data;
    },

    // Get a specific transfer by ID
    getTransfer: async (id) => {
        const response = await api.get(`/stock/transfers/${id}`);
        return response.data;
    },

    // Create a new stock transfer
    createTransfer: async (transferData) => {
        const response = await api.post('/stock/transfers', transferData);
        return response.data;
    },

    // Approve a stock transfer
    approveTransfer: async (id, approvalData) => {
        const response = await api.post(`/stock/transfers/${id}/approve`, approvalData);
        return response.data;
    },

    // Reject a stock transfer
    rejectTransfer: async (id, rejectionData) => {
        const response = await api.post(`/stock/transfers/${id}/reject`, rejectionData);
        return response.data;
    },

    // Complete a stock transfer
    completeTransfer: async (id, completionData) => {
        const response = await api.post(`/stock/transfers/${id}/complete`, completionData);
        return response.data;
    },

    // Cancel a stock transfer
    cancelTransfer: async (id, reason) => {
        const response = await api.post(`/stock/transfers/${id}/cancel`, { reason });
        return response.data;
    },

    // ============ STOCK DAMAGES ============

    // Get all stock damages with optional filters
    getDamages: async (params = {}) => {
        const response = await api.get('/stock/damages', { params });
        return response.data;
    },

    // Get a specific damage record by ID
    getDamage: async (id) => {
        const response = await api.get(`/stock/damages/${id}`);
        return response.data;
    },

    // Record stock damage
    recordDamage: async (damageData) => {
        const response = await api.post('/stock/damages', damageData);
        return response.data;
    },

    // Approve a damage record
    approveDamage: async (id, approvalData) => {
        const response = await api.post(`/stock/damages/${id}/approve`, approvalData);
        return response.data;
    },

    // Reject a damage record
    rejectDamage: async (id, rejectionData) => {
        const response = await api.post(`/stock/damages/${id}/reject`, rejectionData);
        return response.data;
    },

    // ============ STOCK ACTIVITY ============

    // Get stock activity log
    getActivity: async (params = {}) => {
        const response = await api.get('/stock/activity', { params });
        return response.data;
    },

    // Get activity for a specific product/variant
    getProductActivity: async (productId, variantId = null, params = {}) => {
        const url = variantId
            ? `/stock/activity/product/${productId}/variant/${variantId}`
            : `/stock/activity/product/${productId}`;
        const response = await api.get(url, { params });
        return response.data;
    },

    // Get activity for a specific branch
    getBranchActivity: async (branchId, params = {}) => {
        const response = await api.get(`/stock/activity/branch/${branchId}`, { params });
        return response.data;
    },

    // ============ STOCK ADJUSTMENTS ============

    // Create stock adjustment
    createAdjustment: async (adjustmentData) => {
        const response = await api.post('/stock/adjustments', adjustmentData);
        return response.data;
    },

    // Get stock adjustments
    getAdjustments: async (params = {}) => {
        const response = await api.get('/stock/adjustments', { params });
        return response.data;
    },

    // ============ INVENTORY COUNTS ============

    // Start inventory count session
    startInventoryCount: async (countData) => {
        const response = await api.post('/stock/inventory-count', countData);
        return response.data;
    },

    // Update inventory count
    updateInventoryCount: async (id, countData) => {
        const response = await api.put(`/stock/inventory-count/${id}`, countData);
        return response.data;
    },

    // Complete inventory count
    completeInventoryCount: async (id) => {
        const response = await api.post(`/stock/inventory-count/${id}/complete`);
        return response.data;
    },

    // Get inventory counts
    getInventoryCounts: async (params = {}) => {
        const response = await api.get('/stock/inventory-count', { params });
        return response.data;
    },

    // ============ STATISTICS ============

    // Get stock statistics
    getStats: async (params = {}) => {
        const response = await api.get('/stock/stats', { params });
        return response.data;
    },

    // Get low stock alerts
    getLowStockAlerts: async (params = {}) => {
        const response = await api.get('/stock/low-stock', { params });
        return response.data;
    }
};

export default stockAPI;
