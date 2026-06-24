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

// Auth routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/profile', auth, getProfile);
router.put('/auth/profile', auth, updateProfile);

// Financial years (public)
router.get('/financial-years', auth, getFinancialYears);

// Income routes (protected)
router.get('/income', auth, getIncomeSources);
router.post('/income', auth, addIncomeSource);
router.put('/income/:id', auth, updateIncomeSource);
router.delete('/income/:id', auth, deleteIncomeSource);

// Deduction routes (protected)
router.get('/deductions', auth, getDeductions);
router.post('/deductions', auth, addDeduction);
router.put('/deductions/:id', auth, updateDeduction);
router.delete('/deductions/:id', auth, deleteDeduction);

// Tax calculation routes (protected)
router.post('/tax/calculate', auth, calculateTax);
router.get('/tax/history', auth, getSavedCalculation);
router.get('/tax/dashboard', auth, getDashboardSummary);

// ─── Admin routes (auth + admin role required) ───
router.get('/admin/dashboard', auth, adminAuth, getDashboardStats);
router.get('/admin/users', auth, adminAuth, getAllUsers);
router.post('/admin/users', auth, adminAuth, createUser);
router.get('/admin/users/:id', auth, adminAuth, getUserDetails);
router.put('/admin/users/:id/role', auth, adminAuth, updateUserRole);
router.delete('/admin/users/:id', auth, adminAuth, deleteUser);
router.get('/admin/tax-calculations', auth, adminAuth, getAllTaxCalculations);
router.get('/admin/financial-years', auth, adminAuth, adminGetFY);
router.post('/admin/financial-years', auth, adminAuth, addFinancialYear);
router.put('/admin/financial-years/:id', auth, adminAuth, updateFinancialYear);

module.exports = router;
