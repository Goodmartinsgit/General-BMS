import api from './axios';

export const financialReportsAPI = {
    getIncomeStatement: (params) => api.get('/financial-reports/income-statement', { params }).then(r => r.data),
    getBalanceSheet: (params) => api.get('/financial-reports/balance-sheet', { params }).then(r => r.data),
    getTrialBalance: (params) => api.get('/financial-reports/trial-balance', { params }).then(r => r.data),
    getCashFlow: (params) => api.get('/financial-reports/cash-flow', { params }).then(r => r.data),
    getARAging: () => api.get('/financial-reports/ar-aging').then(r => r.data),
    getAPAging: () => api.get('/financial-reports/ap-aging').then(r => r.data),
    getBranchPL: (branchId, params) => api.get(`/financial-reports/branch-pl/${branchId}`, { params }).then(r => r.data),
    getConsolidatedPL: (params) => api.get('/financial-reports/consolidated-pl', { params }).then(r => r.data),
    getInventoryValuation: (params) => api.get('/financial-reports/inventory-valuation', { params }).then(r => r.data),
    getSalesBook: (params) => api.get('/financial-reports/sales-book', { params }).then(r => r.data),
};

export default financialReportsAPI;
