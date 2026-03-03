const Joi = require('joi');

const createSupplierSchema = Joi.object({
    supplier_name: Joi.string().max(255).required(),
    contact_person: Joi.string().max(255).allow(null, ''),
    email: Joi.string().email().allow(null, ''),
    phone_number: Joi.string().max(20).allow(null, ''),
    whatsapp_number: Joi.string().max(20).allow(null, ''),
    address: Joi.string().max(500).allow(null, ''),
    payment_terms: Joi.string().max(255).allow(null, ''),
    notes: Joi.string().max(1000).allow(null, '')
});

const updateSupplierSchema = createSupplierSchema.fork(
    ['supplier_name'],
    (schema) => schema.optional()
);

module.exports = { createSupplierSchema, updateSupplierSchema };
