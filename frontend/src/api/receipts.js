import api from './axios';

/**
 * Receipt API Module
 * Handles receipt configuration, generation, and delivery
 */

// ============================================================================
// RECEIPT CONFIGURATION
// ============================================================================

/**
 * Get receipt configuration
 */
export const getReceiptConfig = async () => {
    const response = await api.get('/receipts/config');
    return response;
};

/**
 * Update receipt configuration
 * @param {object} configData - Configuration data
 */
export const updateReceiptConfig = async (configData) => {
    const response = await api.put('/receipts/config', configData);
    return response;
};

// ============================================================================
// RECEIPT GENERATION
// ============================================================================

/**
 * Generate and download receipt PDF
 * @param {number} saleId - Sale ID
 * @param {boolean} download - Whether to download or preview
 */
export const generateReceipt = async (saleId, download = true) => {
    try {
        const response = await api.get(`/receipts/${saleId}/pdf`, {
            params: { download: download.toString() },
            responseType: 'blob',
            timeout: 60000,
        });
        return response.data;
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            const timeoutError = new Error(
                'Receipt generation timed out. Please try again.'
            );
            timeoutError.code = 'TIMEOUT';
            throw timeoutError;
        }
        throw error;
    }
};

/**
 * Generate receipt as image (PNG)
 * @param {number} saleId - Sale ID
 */
export const generateReceiptImage = async (saleId) => {
    const response = await api.get(`/receipts/${saleId}/image`, {
        responseType: 'blob',
    });
    return response.data;
};

/**
 * Get receipt data for a sale
 * @param {number} saleId - Sale ID
 */
export const getReceiptData = async (saleId) => {
    const response = await api.get(`/receipts/${saleId}/data`);
    return response;
};

/**
 * Get receipt data for an online order
 * @param {number} orderId - Online Order ID
 */
export const getOnlineOrderReceiptData = async (orderId) => {
    const response = await api.get(`/receipts/online-order/${orderId}/data`);
    return response;
};

// ============================================================================
// RECEIPT DELIVERY
// ============================================================================

/**
 * Email receipt to customer
 * @param {number} saleId - Sale ID
 * @param {string} email - Email address
 * @param {string} message - Optional additional message
 */
export const emailReceipt = async (saleId, email, message = '') => {
    const response = await api.post(`/receipts/${saleId}/email`, {
        email,
        message,
    });
    return response.data;
};

/**
 * Send receipt via WhatsApp
 * @param {Object} data - { saleId, phoneNumber, format }
 */
export const sendReceiptWhatsApp = async (data) => {
    const response = await api.post(`/receipts/${data.saleId}/whatsapp`, {
        phone_number: data.phoneNumber,
        format: data.format || 'pdf',
    });
    return response.data;
};

// ============================================================================
// RECEIPT TEMPLATES
// ============================================================================

/**
 * Get available receipt templates
 */
export const getReceiptTemplates = async () => {
    const response = await api.get('/receipts/templates');
    return response.data;
};

/**
 * Get customer receipt history
 * @param {number} customerId - Customer ID
 */
export const getCustomerReceipts = async (customerId, page = 1, limit = 20) => {
    const response = await api.get(`/receipts/customer/${customerId}/history`, {
        params: { page, limit },
    });
    return response.data;
};

export default {
    getReceiptConfig,
    updateReceiptConfig,
    generateReceipt,
    generateReceiptImage,
    getReceiptData,
    emailReceipt,
    sendReceiptWhatsApp,
    getReceiptTemplates,
    getCustomerReceipts,
};
