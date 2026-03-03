const Joi = require('joi');

const createTransferSchema = Joi.object({
    from_branch_id: Joi.number().integer().positive().required(),
    to_branch_id: Joi.number().integer().positive().required(),
    items: Joi.array().items(Joi.object({
        product_id: Joi.number().integer().positive().required(),
        quantity: Joi.number().integer().positive().required(),
        notes: Joi.string().max(500).allow(null, '')
    })).min(1).required(),
    notes: Joi.string().max(500).allow(null, '')
});

const cancelTransferSchema = Joi.object({
    cancellation_reason: Joi.string().max(500).required()
});

const recordDamageSchema = Joi.object({
    branch_id: Joi.number().integer().positive().required(),
    product_id: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().positive().required(),
    damage_reason: Joi.string().max(500).required(),
    damage_type: Joi.string().max(100).allow(null, ''),
    estimated_loss: Joi.number().min(0).allow(null),
    notes: Joi.string().max(500).allow(null, '')
});

const createAdjustmentSchema = Joi.object({
    branch_id: Joi.number().integer().positive().required(),
    product_id: Joi.number().integer().positive().required(),
    adjustment_quantity: Joi.number().integer().required(),
    adjustment_reason: Joi.string().max(500).required(),
    notes: Joi.string().max(500).allow(null, '')
});

module.exports = { createTransferSchema, cancelTransferSchema, recordDamageSchema, createAdjustmentSchema };
