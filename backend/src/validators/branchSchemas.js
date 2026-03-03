const Joi = require('joi');

const createBranchSchema = Joi.object({
    branch_name: Joi.string().max(255).required(),
    address: Joi.string().max(500).allow(null, ''),
    city: Joi.string().max(100).allow(null, ''),
    state: Joi.string().max(100).allow(null, ''),
    phone_number: Joi.string().max(20).allow(null, ''),
    email: Joi.string().email().allow(null, ''),
    manager_id: Joi.number().integer().positive().allow(null),
    is_active: Joi.boolean().default(true)
});

const updateBranchSchema = createBranchSchema.fork(
    ['branch_name'],
    (schema) => schema.optional()
);

module.exports = { createBranchSchema, updateBranchSchema };
