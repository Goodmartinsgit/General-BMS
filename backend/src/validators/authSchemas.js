const Joi = require('joi');

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    full_name: Joi.string().max(255).required(),
    role_name: Joi.string().max(100).allow(null, '')
});

module.exports = { loginSchema, registerSchema };
