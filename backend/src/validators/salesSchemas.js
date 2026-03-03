const Joi = require('joi');

const createSaleSchema = Joi.object({
    branch_id: Joi.number().integer().positive().required(),
    customer_id: Joi.number().integer().positive().allow(null),
    items: Joi.array().items(Joi.object({
        product_id: Joi.number().integer().positive().required(),
        quantity: Joi.number().integer().positive().required(),
        unit_price: Joi.number().min(0).required(),
        subtotal: Joi.number().min(0).required(),
        variant_id: Joi.number().integer().positive().allow(null),
        batch_id: Joi.number().integer().positive().allow(null),
        serial_numbers: Joi.array().items(Joi.string().max(100)).optional()
    })).min(1).required(),
    subtotal: Joi.number().min(0).required(),
    discount_amount: Joi.number().min(0).default(0),
    tax_amount: Joi.number().min(0).default(0),
    total_amount: Joi.number().min(0).required(),
    payment_method: Joi.string().valid('cash', 'card', 'transfer', 'mobile', 'credit').required(),
    amount_paid: Joi.number().min(0).required(),
    referrer_id: Joi.number().integer().positive().allow(null),
    channel_id: Joi.number().integer().positive().allow(null),
    promotion_id: Joi.number().integer().positive().allow(null),
    coupon_code: Joi.string().max(50).allow(null, ''),
    notes: Joi.string().max(500).allow(null, '')
});

const reverseSaleSchema = Joi.object({
    reversal_reason: Joi.string().max(500).required(),
    reversal_note: Joi.string().max(1000).allow(null, '')
});

const unreverseSaleSchema = Joi.object({
    unreverse_reason: Joi.string().max(500).required()
});

const addCommentSchema = Joi.object({
    comment: Joi.string().max(1000).required(),
    attachments: Joi.array().items(Joi.string()).optional()
});

module.exports = { createSaleSchema, reverseSaleSchema, unreverseSaleSchema, addCommentSchema };
