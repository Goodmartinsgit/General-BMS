const axios = require('axios');

const sendWhatsAppMessage = async (phone, message) => {
    const instanceId = process.env.GREEN_API_INSTANCE_ID;
    const apiToken = process.env.GREEN_API_TOKEN;

    if (!instanceId || !apiToken) {
        console.warn('WhatsApp integration not configured (Missing Green API credentials)');
        return null;
    }

    try {
        const url = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`;
        const payload = {
            chatId: `${phone}@c.us`,
            message: message
        };
        const response = await axios.post(url, payload);
        return response.data;
    } catch (error) {
        console.error('WhatsApp Error:', error.response?.data || error.message);
        return null;
    }
};

module.exports = { sendWhatsAppMessage };
