const Joi = require('joi');

const createExpenseSchema = Joi.object({
    branch_id: Joi.number().integer().positive().allow(null),
    category_id: Joi.number().integer().positive().allow(null),
    amount: Joi.number().positive().required(),
    description: Joi.string().max(500).required(),
    expense_date: Joi.date().iso().default(() => new Date()),
    status: Joi.string().valid('pending', 'approved', 'rejected').default('pending'),
    receipt_url: Joi.string().uri().max(500).allow(null, '')
});

const updateExpenseSchema = Joi.object({
    category_id: Joi.number().integer().positive().allow(null),
    amount: Joi.number().positive(),
    description: Joi.string().max(500),
    expense_date: Joi.date().iso(),
    status: Joi.string().valid('pending', 'approved', 'rejected'),
    receipt_url: Joi.string().uri().max(500).allow(null, ''),
    approved_by: Joi.number().integer().positive().allow(null)
});

module.exports = { createExpenseSchema, updateExpenseSchema };
