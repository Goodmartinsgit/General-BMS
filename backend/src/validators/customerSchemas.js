const Joi = require('joi');

const createCustomerSchema = Joi.object({
    customer_number: Joi.string().max(50).required(),
    customer_type: Joi.string().valid('retail', 'wholesale', 'distributor').required(),
    customer_name: Joi.string().max(255).required(),
    contact_person: Joi.string().max(255).allow(null, ''),
    email: Joi.string().email().allow(null, ''),
    phone_number: Joi.string().max(20).allow(null, ''),
    alternative_phone: Joi.string().max(20).allow(null, ''),
    address: Joi.string().max(500).allow(null, ''),
    city: Joi.string().max(100).allow(null, ''),
    state: Joi.string().max(100).allow(null, ''),
    country: Joi.string().max(100).allow(null, ''),
    tax_id: Joi.string().max(50).allow(null, ''),
    price_tier_id: Joi.number().integer().positive().allow(null),
    credit_limit: Joi.number().min(0).allow(null),
    payment_terms_days: Joi.number().integer().min(0).allow(null)
});

const updateCustomerSchema = Joi.object({
    customer_type: Joi.string().valid('retail', 'wholesale', 'distributor'),
    customer_name: Joi.string().max(255),
    contact_person: Joi.string().max(255).allow(null, ''),
    email: Joi.string().email().allow(null, ''),
    phone_number: Joi.string().max(20).allow(null, ''),
    alternative_phone: Joi.string().max(20).allow(null, ''),
    address: Joi.string().max(500).allow(null, ''),
    city: Joi.string().max(100).allow(null, ''),
    state: Joi.string().max(100).allow(null, ''),
    country: Joi.string().max(100).allow(null, ''),
    tax_id: Joi.string().max(50).allow(null, ''),
    price_tier_id: Joi.number().integer().positive().allow(null),
    credit_limit: Joi.number().min(0).allow(null),
    payment_terms_days: Joi.number().integer().min(0).allow(null),
    is_active: Joi.boolean(),
    suspended: Joi.boolean(),
    suspension_reason: Joi.string().max(500).allow(null, '')
});

module.exports = { createCustomerSchema, updateCustomerSchema };
