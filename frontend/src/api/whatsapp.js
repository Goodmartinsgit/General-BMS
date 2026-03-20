import api from './axios';

// ============================================================================
// WHATSAPP API
// ============================================================================

/**
 * Send receipt via WhatsApp
 * @param {Object} data - { saleId, phoneNumber, format }
 */
export const sendReceipt = async (data) => {
    const response = await api.post(`/receipts/${data.saleId}/whatsapp`, {
        phone_number: data.phoneNumber,
        format: data.format || 'pdf',
    });
    return response.data;
};

// ============================================================================
// PHONE NUMBER UTILITIES
// ============================================================================

/**
 * Validate Nigerian phone number
 * @param {string} phone - Phone number to validate
 * @returns {Object} { isValid: boolean, message: string }
 */
export const validatePhoneNumber = (phone) => {
    if (!phone || phone.trim() === '') {
        return { isValid: false, message: 'Phone number is required' };
    }

    const digits = phone.replace(/\D/g, '');

    const validPrefixes = [
        // MTN Nigeria
        '703', '704', '706', '707', '803', '806', '810', '813', '814', '816', '903', '904', '906', '913', '916',
        // Airtel Nigeria
        '701', '708', '802', '808', '812', '901', '902', '907', '912',
        // Glo Nigeria
        '705', '805', '807', '811', '815', '905', '915',
        // 9mobile Nigeria
        '809', '817', '818', '908', '909',
        // Extended series
        '801', '804', '819',
        '910', '911', '914'
    ];

    if (digits.length === 11 && digits.startsWith('0')) {
        const prefix = digits.slice(1, 4);
        if (validPrefixes.includes(prefix)) {
            return { isValid: true, message: 'Valid phone number' };
        }
        return { isValid: false, message: 'Invalid phone number prefix' };
    }

    if (digits.length === 13 && digits.startsWith('234')) {
        const prefix = digits.slice(3, 6);
        if (validPrefixes.includes(prefix)) {
            return { isValid: true, message: 'Valid phone number' };
        }
        return { isValid: false, message: 'Invalid phone number prefix' };
    }

    if (digits.length === 10) {
        const prefix = digits.slice(0, 3);
        if (validPrefixes.includes(prefix)) {
            return { isValid: true, message: 'Valid phone number' };
        }
        return { isValid: false, message: 'Invalid phone number prefix' };
    }

    return {
        isValid: false,
        message: 'Phone must be 11 digits (e.g., 08012345678) or international (+2348012345678)'
    };
};

/**
 * Normalize phone number to international format
 * @param {string} phone - Phone number
 * @returns {string} +234XXXXXXXXXX
 */
export const normalizePhoneNumber = (phone) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');

    if (digits.length === 11 && digits.startsWith('0')) {
        return `+234${digits.slice(1)}`;
    }
    if (digits.length === 10) {
        return `+234${digits}`;
    }
    if (digits.length === 13 && digits.startsWith('234')) {
        return `+${digits}`;
    }
    return phone.startsWith('+') ? phone : `+${digits}`;
};

/**
 * Format phone number for display
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone
 */
export const formatPhoneNumber = (phone) => {
    if (!phone) return 'N/A';
    const digits = phone.replace(/\D/g, '');

    if (digits.startsWith('234') && digits.length === 13) {
        return `+234 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
    }
    if (digits.startsWith('0') && digits.length === 11) {
        return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }
    return phone;
};

/**
 * Get network provider from phone number
 * @param {string} phone - Phone number
 * @returns {string} Network provider name
 */
export const getNetworkProvider = (phone) => {
    if (!phone) return 'Unknown';
    const digits = phone.replace(/\D/g, '');
    let prefix;

    if (digits.length === 11 && digits.startsWith('0')) {
        prefix = digits.slice(1, 4);
    } else if (digits.length === 13 && digits.startsWith('234')) {
        prefix = digits.slice(3, 6);
    } else {
        return 'Unknown';
    }

    const mtnPrefixes = ['703', '706', '803', '806', '810', '813', '814', '816', '903', '906'];
    const airtelPrefixes = ['701', '708', '802', '808', '812', '901', '902', '907', '912'];
    const gloPrefixes = ['705', '805', '807', '811', '815', '905', '915'];
    const nineMobilePrefixes = ['809', '817', '818', '908', '909'];

    if (mtnPrefixes.includes(prefix)) return 'MTN';
    if (airtelPrefixes.includes(prefix)) return 'Airtel';
    if (gloPrefixes.includes(prefix)) return 'Glo';
    if (nineMobilePrefixes.includes(prefix)) return '9mobile';

    return 'Unknown';
};
