import api from './axios';

export const promotionsAPI = {
    // Get all promotions with optional filters
    getPromotions: async (params = {}) => {
        const response = await api.get('/promotions', { params });
        return response.data;
    },

    // Get a specific promotion by ID
    getPromotion: async (id) => {
        const response = await api.get(`/promotions/${id}`);
        return response.data;
    },

    // Create a new promotion
    createPromotion: async (promotionData) => {
        const response = await api.post('/promotions', promotionData);
        return response.data;
    },

    // Update a promotion
    updatePromotion: async (id, promotionData) => {
        const response = await api.put(`/promotions/${id}`, promotionData);
        return response.data;
    },

    // Delete a promotion
    deletePromotion: async (id) => {
        const response = await api.delete(`/promotions/${id}`);
        return response.data;
    },

    // Activate a promotion
    activatePromotion: async (id) => {
        const response = await api.post(`/promotions/${id}/activate`);
        return response.data;
    },

    // Deactivate a promotion
    deactivatePromotion: async (id) => {
        const response = await api.post(`/promotions/${id}/deactivate`);
        return response.data;
    },

    // Get active promotions
    getActivePromotions: async (params = {}) => {
        const response = await api.get('/promotions/active', { params });
        return response.data;
    },

    // Get applicable promotions for cart/products
    getApplicablePromotions: async (cartData) => {
        const response = await api.post('/promotions/applicable', cartData);
        return response.data;
    },

    // Validate a coupon code
    validateCoupon: async (code, cartData = {}) => {
        const response = await api.post('/promotions/validate-coupon', { code, ...cartData });
        return response.data;
    },

    // Apply promotion to cart
    applyPromotion: async (promotionId, cartData) => {
        const response = await api.post(`/promotions/${promotionId}/apply`, cartData);
        return response.data;
    },

    // Get promotion usage statistics
    getPromotionStats: async (id) => {
        const response = await api.get(`/promotions/${id}/stats`);
        return response.data;
    },

    // Get all promotion statistics
    getStats: async (params = {}) => {
        const response = await api.get('/promotions/stats', { params });
        return response.data;
    },

    // Get promotion types
    getPromotionTypes: async () => {
        const response = await api.get('/promotions/types');
        return response.data;
    }
};

export default promotionsAPI;
