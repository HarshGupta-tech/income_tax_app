const { body, validationResult } = require('express-validator');

// Middleware to catch validation errors
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      message: errors.array()[0].msg, 
      errors: errors.array() 
    });
  }
  next();
};

// Validation rules for Auth
const registerValidation = [
  body('full_name').notEmpty().withMessage('Full name is required').trim().escape(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('pan_number').optional({ checkFalsy: true }).matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i).withMessage('Invalid PAN format (e.g., ABCDE1234F)'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone().withMessage('Invalid phone number'),
  validateRequest
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest
];

const updateProfileValidation = [
  body('full_name').optional({ checkFalsy: true }).trim().escape(),
  body('pan_number').optional({ checkFalsy: true }).matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i).withMessage('Invalid PAN format'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone().withMessage('Invalid phone number'),
  validateRequest
];

// Validation rules for Income
const incomeValidation = [
  body('financial_year_id').isInt().withMessage('Financial year is required'),
  body('source_type').notEmpty().withMessage('Source type is required').trim().escape(),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('description').optional({ checkFalsy: true }).trim().escape(),
  validateRequest
];

// Validation rules for Deductions
const deductionValidation = [
  body('financial_year_id').isInt().withMessage('Financial year is required'),
  body('section').notEmpty().withMessage('Section is required').trim().escape(),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('description').optional({ checkFalsy: true }).trim().escape(),
  validateRequest
];

// Validation rules for Tax Calculation
const calculateTaxValidation = [
  body('financial_year_id').isInt().withMessage('Financial year is required'),
  body('income_sources').isArray().withMessage('Income sources must be an array'),
  body('deductions').isArray().withMessage('Deductions must be an array'),
  validateRequest
];

// Validation rules for Admin
const userRoleValidation = [
  body('role').isIn(['user', 'admin']).withMessage('Role must be either user or admin'),
  validateRequest
];

const financialYearValidation = [
  body('year_range').matches(/^\d{4}-\d{4}$/).withMessage('Year range must be in YYYY-YYYY format'),
  validateRequest
];

module.exports = {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  incomeValidation,
  deductionValidation,
  calculateTaxValidation,
  userRoleValidation,
  financialYearValidation
};
