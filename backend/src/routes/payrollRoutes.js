const express = require('express');
const router = express.Router();
const {
    getSalaries, getSalaryByUserId, createSalary, updateSalary,
    getPayrollRuns, getPayrollRunById, createPayrollRun, processPayrollRun, approvePayrollRun, markPayrollRunPaid,
    getPayslips, getPayslipById, getMyPayslips,
    getLoans, getLoanById, createLoan, updateLoan, cancelLoan
} = require('../controllers/payrollController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

// Self-service (no special permission)
router.get('/my-payslips', getMyPayslips);

// Salaries
router.get('/salaries', authorize('manage_payroll'), getSalaries);
router.get('/salaries/:userId', authorize('manage_payroll'), getSalaryByUserId);
router.post('/salaries', authorize('manage_payroll'), createSalary);
router.put('/salaries/:userId', authorize('manage_payroll'), updateSalary);

// Payroll Runs
router.get('/runs', authorize('manage_payroll'), getPayrollRuns);
router.get('/runs/:id', authorize('manage_payroll'), getPayrollRunById);
router.post('/runs', authorize('manage_payroll'), createPayrollRun);
router.post('/runs/:id/process', authorize('manage_payroll'), processPayrollRun);
router.post('/runs/:id/approve', authorize('manage_payroll'), approvePayrollRun);
router.post('/runs/:id/pay', authorize('manage_payroll'), markPayrollRunPaid);

// Payslips
router.get('/payslips', authorize('manage_payroll'), getPayslips);
router.get('/payslips/:id', authorize('manage_payroll'), getPayslipById);

// Loans
router.get('/loans', authorize('manage_payroll'), getLoans);
router.get('/loans/:id', authorize('manage_payroll'), getLoanById);
router.post('/loans', authorize('manage_payroll'), createLoan);
router.put('/loans/:id', authorize('manage_payroll'), updateLoan);
router.post('/loans/:id/cancel', authorize('manage_payroll'), cancelLoan);

module.exports = router;
