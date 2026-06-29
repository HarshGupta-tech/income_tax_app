const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { getIncomeSources, addIncomeSource, updateIncomeSource, deleteIncomeSource, getFinancialYears } = require('../controllers/incomeController');
const { getDeductions, addDeduction, updateDeduction, deleteDeduction } = require('../controllers/deductionController');
const { calculateTax, getSavedCalculation, getDashboardSummary } = require('../controllers/taxController');
const {
  getDashboardStats, getAllUsers, getUserDetails, deleteUser,
  updateUserRole, createUser,
  getAllTaxCalculations, getFinancialYears: adminGetFY, addFinancialYear, updateFinancialYear,
} = require('../controllers/adminController');
const {
  registerValidation, loginValidation, updateProfileValidation,
  incomeValidation, deductionValidation, calculateTaxValidation,
  userRoleValidation, financialYearValidation
} = require('../middleware/validator');
const { authLimiter } = require('../middleware/rateLimiter');

// Auth routes
router.post('/auth/register', authLimiter, registerValidation, register);
router.post('/auth/login', authLimiter, loginValidation, login);
router.get('/auth/profile', auth, getProfile);
router.put('/auth/profile', auth, updateProfileValidation, updateProfile);

// Financial years (public)
router.get('/financial-years', auth, getFinancialYears);

// Income routes (protected)
router.get('/income', auth, getIncomeSources);
router.post('/income', auth, incomeValidation, addIncomeSource);
router.put('/income/:id', auth, incomeValidation, updateIncomeSource);
router.delete('/income/:id', auth, deleteIncomeSource);

// Deduction routes (protected)
router.get('/deductions', auth, getDeductions);
router.post('/deductions', auth, deductionValidation, addDeduction);
router.put('/deductions/:id', auth, deductionValidation, updateDeduction);
router.delete('/deductions/:id', auth, deleteDeduction);

// Tax calculation routes (protected)
router.post('/tax/calculate', auth, calculateTaxValidation, calculateTax);
router.get('/tax/history', auth, getSavedCalculation);
router.get('/tax/dashboard', auth, getDashboardSummary);

// ─── Admin routes (auth + admin role required) ───
router.get('/admin/dashboard', auth, adminAuth, getDashboardStats);
router.get('/admin/users', auth, adminAuth, getAllUsers);
router.post('/admin/users', auth, adminAuth, registerValidation, createUser);
router.get('/admin/users/:id', auth, adminAuth, getUserDetails);
router.put('/admin/users/:id/role', auth, adminAuth, userRoleValidation, updateUserRole);
router.delete('/admin/users/:id', auth, adminAuth, deleteUser);
router.get('/admin/tax-calculations', auth, adminAuth, getAllTaxCalculations);
router.get('/admin/financial-years', auth, adminAuth, adminGetFY);
router.post('/admin/financial-years', auth, adminAuth, financialYearValidation, addFinancialYear);
router.put('/admin/financial-years/:id', auth, adminAuth, financialYearValidation, updateFinancialYear);

module.exports = router;
