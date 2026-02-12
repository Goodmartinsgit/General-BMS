import api from './axios';

export const productAPI = {
    // Get all products with filters
    getProducts: async (params = {}) => {
        const response = await api.get('/products', { params });
        return response.data;
    },

    // Get single product by ID
    getProduct: async (id) => {
        const response = await api.get(`/products/${id}`);
        return response.data;
    },

    // Get products with variants
    getProductsWithVariants: async () => {
        const response = await api.get('/products/with-variants');
        return response.data;
    },

    // Get low stock products
    getLowStockProducts: async (params = {}) => {
        const response = await api.get('/products/low-stock', { params });
        return response.data;
    }
};

export default productAPI;
