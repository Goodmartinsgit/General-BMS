const Joi = require('joi');

const createBankChannelSchema = Joi.object({
    channel_name: Joi.string().max(255).required(),
    bank_name: Joi.string().max(255).required(),
    account_number: Joi.string().max(50).required(),
    account_name: Joi.string().max(255).required(),
    initial_balance: Joi.number().min(0).default(0)
});

const updateBankChannelSchema = Joi.object({
    channel_name: Joi.string().max(255),
    bank_name: Joi.string().max(255),
    account_number: Joi.string().max(50),
    account_name: Joi.string().max(255),
    is_active: Joi.boolean()
});

module.exports = { createBankChannelSchema, updateBankChannelSchema };
