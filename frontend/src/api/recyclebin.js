import api from './axios';

export const recyclebinAPI = {
    // Get all deleted items
    getDeletedItems: async (params = {}) => {
        const response = await api.get('/recycle-bin', { params });
        return response.data;
    },

    // Get deleted items by type
    getDeletedItemsByType: async (type, params = {}) => {
        const response = await api.get(`/recycle-bin/${type}`, { params });
        return response.data;
    },

    // Restore a single item
    restoreItem: async (type, id) => {
        const response = await api.post(`/recycle-bin/${id}/restore`);
        return response.data;
    },

    // Restore multiple items
    restoreItems: async (items) => {
        const response = await api.post('/recycle-bin/restore-bulk', { items });
        return response.data;
    },

    // Permanently delete a single item
    purgeItem: async (type, id) => {
        const response = await api.delete(`/recycle-bin/${id}/purge`);
        return response.data;
    },

    // Permanently delete multiple items
    purgeItems: async (items) => {
        const response = await api.post('/recycle-bin/purge-bulk', { items });
        return response.data;
    },

    // Empty the entire recycle bin
    emptyBin: async () => {
        const response = await api.delete('/recycle-bin/empty');
        return response.data;
    },

    // Get recycle bin statistics
    getStats: async () => {
        const response = await api.get('/recycle-bin/stats');
        return response.data;
    }
};

export default recyclebinAPI;
