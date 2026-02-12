import api from './axios';

export const analyticsAPI = {
    // ============ DASHBOARD ============

    // Get dashboard summary stats
    getDashboardStats: async (params = {}) => {
        const response = await api.get('/reports/dashboard-stats', { params });
        return response.data;
    },

    // ============ SALES ANALYTICS ============

    // Get sales analytics
    getSalesAnalytics: async (params = {}) => {
        const response = await api.get('/analytics/sales', { params });
        return response.data;
    },

    // Get sales trends over time
    getSalesTrend: async (params = {}) => {
        const response = await api.get('/analytics/sales/trend', { params });
        return response.data;
    },

    // Get sales by payment method
    getSalesByPaymentMethod: async (params = {}) => {
        const response = await api.get('/analytics/sales/payment-methods', { params });
        return response.data;
    },

    // Get sales by branch
    getSalesByBranch: async (params = {}) => {
        const response = await api.get('/analytics/sales/by-branch', { params });
        return response.data;
    },

    // Get hourly sales pattern
    getHourlySalesPattern: async (params = {}) => {
        const response = await api.get('/analytics/sales/hourly', { params });
        return response.data;
    },

    // ============ PRODUCT ANALYTICS ============

    // Get top selling products
    getTopProducts: async (params = {}) => {
        const response = await api.get('/analytics/products/top', { params });
        return response.data;
    },

    // Get product performance
    getProductPerformance: async (productId, params = {}) => {
        const response = await api.get(`/analytics/products/${productId}/performance`, { params });
        return response.data;
    },

    // Get slow-moving products
    getSlowMovingProducts: async (params = {}) => {
        const response = await api.get('/analytics/products/slow-moving', { params });
        return response.data;
    },

    // Get category performance
    getCategoryPerformance: async (params = {}) => {
        const response = await api.get('/analytics/categories/performance', { params });
        return response.data;
    },

    // ============ CUSTOMER ANALYTICS ============

    // Get top customers
    getTopCustomers: async (params = {}) => {
        const response = await api.get('/analytics/customers/top', { params });
        return response.data;
    },

    // Get customer growth
    getCustomerGrowth: async (params = {}) => {
        const response = await api.get('/analytics/customers/growth', { params });
        return response.data;
    },

    // Get customer retention
    getCustomerRetention: async (params = {}) => {
        const response = await api.get('/analytics/customers/retention', { params });
        return response.data;
    },

    // ============ INVENTORY ANALYTICS ============

    // Get inventory value
    getInventoryValue: async (params = {}) => {
        const response = await api.get('/analytics/inventory/value', { params });
        return response.data;
    },

    // Get inventory turnover
    getInventoryTurnover: async (params = {}) => {
        const response = await api.get('/analytics/inventory/turnover', { params });
        return response.data;
    },

    // Get low stock items
    getLowStockItems: async (params = {}) => {
        const response = await api.get('/analytics/inventory/low-stock', { params });
        return response.data;
    },

    // Get stock movement summary
    getStockMovementSummary: async (params = {}) => {
        const response = await api.get('/analytics/inventory/movements', { params });
        return response.data;
    },

    // ============ PROFIT ANALYTICS ============

    // Get profit analytics
    getProfitAnalytics: async (params = {}) => {
        const response = await api.get('/analytics/profit', { params });
        return response.data;
    },

    // Get profit by product
    getProfitByProduct: async (params = {}) => {
        const response = await api.get('/analytics/profit/by-product', { params });
        return response.data;
    },

    // Get profit margin trends
    getProfitMarginTrend: async (params = {}) => {
        const response = await api.get('/analytics/profit/margin-trend', { params });
        return response.data;
    },

    // ============ BRANCH ANALYTICS ============

    // Get branch performance comparison
    getBranchComparison: async (params = {}) => {
        const response = await api.get('/analytics/branches/comparison', { params });
        return response.data;
    },

    // Get single branch analytics
    getBranchAnalytics: async (branchId, params = {}) => {
        const response = await api.get(`/analytics/branches/${branchId}`, { params });
        return response.data;
    },

    // ============ REPORTS ============

    // Generate sales report
    generateSalesReport: async (params = {}) => {
        const response = await api.get('/reports/sales', { params, responseType: 'blob' });
        return response.data;
    },

    // Generate inventory report
    generateInventoryReport: async (params = {}) => {
        const response = await api.get('/reports/inventory', { params, responseType: 'blob' });
        return response.data;
    },

    // Generate profit/loss report
    generatePLReport: async (params = {}) => {
        const response = await api.get('/reports/profit-loss', { params, responseType: 'blob' });
        return response.data;
    }
};

export default analyticsAPI;
