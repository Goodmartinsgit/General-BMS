const Joi = require('joi');

const createProductSchema = Joi.object({
    product_name: Joi.string().max(255).required(),
    description: Joi.string().max(2000).allow(null, ''),
    product_type: Joi.string().valid('physical', 'service', 'digital', 'bundle').default('physical'),
    category_id: Joi.number().integer().positive().allow(null),
    brand_id: Joi.number().integer().positive().allow(null),
    base_unit: Joi.string().max(50).default('piece'),
    has_variants: Joi.boolean().default(false),
    track_serial_numbers: Joi.boolean().default(false),
    track_batches: Joi.boolean().default(false),
    retail_price: Joi.number().min(0).required(),
    wholesale_base_price: Joi.number().min(0).allow(null),
    cost_price: Joi.number().min(0).allow(null),
    tax_rate: Joi.number().min(0).max(100).default(0),
    reorder_level: Joi.number().integer().min(0).default(10),
    max_stock_level: Joi.number().integer().min(0).allow(null),
    product_images: Joi.array().items(Joi.string().uri().max(500)).default([]),
    model_images: Joi.array().items(Joi.string().uri().max(500)).default([]),
    specifications: Joi.object().default({}),
    commission_amount: Joi.number().min(0).default(0),
    is_featured: Joi.boolean().default(false),
    is_retail_available: Joi.boolean().default(true),
    is_wholesale_available: Joi.boolean().default(true),
    barcode: Joi.string().max(100).allow(null, ''),
    weight_per_unit: Joi.number().min(0).allow(null),
    branch_stock_allocation: Joi.array().items(Joi.object({
        branch_id: Joi.number().integer().positive().required(),
        quantity: Joi.number().integer().min(0).required()
    })).default([])
});

const updateProductSchema = createProductSchema.fork(
    ['product_name', 'retail_price'],
    (schema) => schema.optional()
);

const deleteProductSchema = Joi.object({
    reason: Joi.string().max(500).allow(null, '')
});

module.exports = { createProductSchema, updateProductSchema, deleteProductSchema };
