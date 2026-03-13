const Joi = require('joi');

const passwordSchema = Joi.string()
  .min(8)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .message('Password must be at least 8 characters with uppercase, lowercase, and a number');

exports.registerSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).required(),
  lastName: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  phone: Joi.string().trim().min(7).max(20).required(),
  password: passwordSchema.required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    .messages({ 'any.only': 'Passwords do not match' }),
});

exports.loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

exports.forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
});

exports.resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: passwordSchema.required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    .messages({ 'any.only': 'Passwords do not match' }),
});

exports.changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: passwordSchema.required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    .messages({ 'any.only': 'Passwords do not match' }),
});

exports.changeEmailSchema = Joi.object({
  newEmail: Joi.string().email().lowercase().required(),
  currentPassword: Joi.string().required(),
});

exports.updateProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100),
  lastName: Joi.string().trim().min(1).max(100),
  phone: Joi.string().trim().min(7).max(20),
}).min(1);

exports.addressSchema = Joi.object({
  label: Joi.string().max(100).optional(),
  recipientName: Joi.string().trim().min(1).max(200).required(),
  phone: Joi.string().trim().min(7).max(20).required(),
  addressLine1: Joi.string().trim().min(1).max(500).required(),
  addressLine2: Joi.string().max(500).optional().allow(''),
  city: Joi.string().trim().min(1).max(100).required(),
  state: Joi.string().trim().min(1).max(100).required(),
  postalCode: Joi.string().max(20).optional().allow(''),
  country: Joi.string().trim().min(1).max(100).default('Nigeria'),
  deliveryNotes: Joi.string().max(500).optional().allow(''),
  isDefaultShipping: Joi.boolean().default(false),
  isDefaultBilling: Joi.boolean().default(false),
});

exports.checkoutSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  shippingAddress: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().optional().allow(''),
    address1: Joi.string().required(),
    address2: Joi.string().optional().allow(''),
    city: Joi.string().required(),
    state: Joi.string().required(),
    postalCode: Joi.string().optional().allow(''),
    country: Joi.string().default('Nigeria'),
    phone: Joi.string().optional().allow(''),
  }).required(),
  billingAddress: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().optional().allow(''),
    address1: Joi.string().required(),
    address2: Joi.string().optional().allow(''),
    city: Joi.string().required(),
    state: Joi.string().required(),
    postalCode: Joi.string().optional().allow(''),
    country: Joi.string().default('Nigeria'),
    phone: Joi.string().optional().allow(''),
  }).optional(),
  paymentMethod: Joi.string().valid('paystack', 'bank_transfer').required(),
  bankChannelId: Joi.when('paymentMethod', {
    is: 'bank_transfer',
    then: Joi.number().integer().required(),
    otherwise: Joi.any().optional().allow(null),
  }),
  notes: Joi.string().max(500).optional().allow(''),
});
