// ============================================================================
// VALIDATION SCHEMAS - JOI VALIDATORS
// ============================================================================

import Joi from 'joi';

// ============================================================================
// AUTH VALIDATION SCHEMAS
// ============================================================================

export const loginSchema = Joi.object({
  username: Joi.string().min(3).max(100).required(),
  password: Joi.string().required(),
});

export const registerSchema = Joi.object({
  username: Joi.string().min(3).max(100).required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]{8,}$/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character',
    }),
  email: Joi.string().email().lowercase().required(),
  phone: Joi.string().regex(/^\+?[1-9]\d{1,14}$/).optional().allow('', null),
});

// ============================================================================
// EMPLOYEE VALIDATION SCHEMAS
// ============================================================================

export const createEmployeeSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  type: Joi.string().valid('pel', 'dhar', 'ghodi', 'table').required(),
  phone: Joi.string().regex(/^\+?[1-9]\d{1,14}$/).optional().allow('', null),
});

export const updateEmployeeSchema = Joi.object({
  name: Joi.string().min(2).max(255),
  type: Joi.string().valid('pel', 'dhar', 'ghodi', 'table'),
  phone: Joi.string().regex(/^\+?[1-9]\d{1,14}$/).allow('', null),
}).min(1);

// ============================================================================
// CLIENT VALIDATION SCHEMAS
// ============================================================================

export const createClientSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().lowercase().optional().allow('', null),
  phone: Joi.string().regex(/^\+?[1-9]\d{1,14}$/).optional().allow('', null),
  address: Joi.string().max(500).optional().allow('', null),
});

export const updateClientSchema = Joi.object({
  name: Joi.string().min(2).max(255),
  email: Joi.string().email().lowercase().allow('', null),
  phone: Joi.string().regex(/^\+?[1-9]\d{1,14}$/).allow('', null),
  address: Joi.string().max(500).allow('', null),
}).min(1);

// ============================================================================
// PACKET VALIDATION SCHEMAS
// ============================================================================

export const createPacketSchema = Joi.object({
  clientId: Joi.string().required().messages({
    'any.required': 'Client is required',
    'string.empty': 'Client is required',
  }),
  description: Joi.string().max(2000).optional().allow('', null),
  weight: Joi.number().positive().optional(),
  carat: Joi.number().positive().optional(),
  tyareWeight: Joi.number().positive().optional(),
  color: Joi.string().max(50).optional().allow('', null),
  kasuWeight: Joi.number().positive().optional(),
  peroty: Joi.number().positive().optional(),
  shape: Joi.string().max(50).optional().allow('', null),
  cut: Joi.string().max(50).optional().allow('', null),
  polishWeight: Joi.number().positive().optional(),
}).custom((value, helpers) => {
  if (
    value.kasuWeight !== undefined &&
    value.tyareWeight !== undefined &&
    value.kasuWeight > value.tyareWeight
  ) {
    return helpers.error('any.invalid', {
      message: 'Kasu weight cannot be greater than Tyare weight',
    });
  }
  return value;
}).messages({
  'any.invalid': 'Kasu weight cannot be greater than Tyare weight',
});

export const updatePacketSchema = Joi.object({
  clientId: Joi.string().optional(),
  description: Joi.string().max(2000).allow('', null),
  weight: Joi.number().positive(),
  carat: Joi.number().positive(),
  tyareWeight: Joi.number().positive(),
  color: Joi.string().max(50).allow('', null),
  kasuWeight: Joi.number().positive(),
  peroty: Joi.number().positive(),
  shape: Joi.string().max(50).allow('', null),
  cut: Joi.string().max(50).allow('', null),
  polishWeight: Joi.number().positive(),
}).min(1).custom((value, helpers) => {
  if (
    value.kasuWeight !== undefined &&
    value.tyareWeight !== undefined &&
    value.kasuWeight > value.tyareWeight
  ) {
    return helpers.error('any.invalid', {
      message: 'Kasu weight cannot be greater than Tyare weight',
    });
  }
  return value;
}).messages({
  'any.invalid': 'Kasu weight cannot be greater than Tyare weight',
});

export const assignPacketSchema = Joi.object({
  employeeId: Joi.string().required(),
});

export const updateStatusSchema = Joi.object({
  status: Joi.string().valid('created', 'assigned', 'done', 'reviewed').required(),
});

// ============================================================================
// PAGINATION VALIDATION SCHEMA
// ============================================================================

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
});
