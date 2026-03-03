const Joi = require('joi');

const createUserSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    full_name: Joi.string().max(255).required(),
    phone_number: Joi.string().max(20).allow(null, ''),
    role_id: Joi.number().integer().positive().required()
});

const updateUserSchema = Joi.object({
    full_name: Joi.string().max(255),
    phone_number: Joi.string().max(20).allow(null, ''),
    role_id: Joi.number().integer().positive(),
    is_active: Joi.boolean()
});

module.exports = { createUserSchema, updateUserSchema };
