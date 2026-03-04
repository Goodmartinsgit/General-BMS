import api from './axios';

export const getStoreConfig = () => api.get('/store-config');
export const updateStoreConfig = (data) => api.put('/store-config', data);
export const getCompanySettingsForStore = () => api.get('/store-config/company-settings');
