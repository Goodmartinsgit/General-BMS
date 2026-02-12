import api from './axios';

export const settingsAPI = {
    // Get all settings
    getSettings: async () => {
        const response = await api.get('/settings');
        return response.data;
    },

    // Update settings
    updateSettings: async (settings) => {
        const response = await api.put('/settings', settings);
        return response.data;
    },

    // Get specific setting category
    getSettingCategory: async (category) => {
        const response = await api.get(`/settings/${category}`);
        return response.data;
    },

    // Update specific setting category
    updateSettingCategory: async (category, settings) => {
        const response = await api.put(`/settings/${category}`, settings);
        return response.data;
    },

    // Reset settings to default
    resetSettings: async () => {
        const response = await api.post('/settings/reset');
        return response.data;
    },

    // Get company info
    getCompanyInfo: async () => {
        const response = await api.get('/settings/company');
        return response.data;
    },

    // Update company info
    updateCompanyInfo: async (companyInfo) => {
        const response = await api.put('/settings/company', companyInfo);
        return response.data;
    },

    // Upload company logo
    uploadLogo: async (file) => {
        const formData = new FormData();
        formData.append('logo', file);
        const response = await api.post('/settings/logo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Get tax settings
    getTaxSettings: async () => {
        const response = await api.get('/settings/tax');
        return response.data;
    },

    // Update tax settings
    updateTaxSettings: async (taxSettings) => {
        const response = await api.put('/settings/tax', taxSettings);
        return response.data;
    },

    // Get payment settings
    getPaymentSettings: async () => {
        const response = await api.get('/settings/payment');
        return response.data;
    },

    // Update payment settings
    updatePaymentSettings: async (paymentSettings) => {
        const response = await api.put('/settings/payment', paymentSettings);
        return response.data;
    },

    // Get notification settings
    getNotificationSettings: async () => {
        const response = await api.get('/settings/notifications');
        return response.data;
    },

    // Update notification settings
    updateNotificationSettings: async (notificationSettings) => {
        const response = await api.put('/settings/notifications', notificationSettings);
        return response.data;
    },

    // Test email settings
    testEmailSettings: async (email) => {
        const response = await api.post('/settings/test-email', { email });
        return response.data;
    },

    // Get receipt template
    getReceiptTemplate: async () => {
        const response = await api.get('/settings/receipt-template');
        return response.data;
    },

    // Update receipt template
    updateReceiptTemplate: async (template) => {
        const response = await api.put('/settings/receipt-template', template);
        return response.data;
    },

    // Backup database
    backupDatabase: async () => {
        const response = await api.post('/settings/backup');
        return response.data;
    },

    // Get backup history
    getBackupHistory: async () => {
        const response = await api.get('/settings/backup/history');
        return response.data;
    }
};

export default settingsAPI;
