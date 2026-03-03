const express = require('express');
const router = express.Router();
const {
    getAccounts, getAccountById, createAccount, updateAccount, deleteAccount,
    getAccountTree, getTrialBalance,
    getJournalEntries, getJournalEntryById, createJournalEntry, updateJournalEntry,
    deleteJournalEntry, approveJournalEntry, postJournalEntry, reverseJournalEntry
} = require('../controllers/glController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/permissionMiddleware');

router.use(authenticateToken);

// Chart of Accounts
router.get('/accounts', authorize('view_accounting'), getAccounts);
router.get('/accounts/tree', authorize('view_accounting'), getAccountTree);
router.get('/trial-balance', authorize('view_accounting'), getTrialBalance);
router.get('/accounts/:id', authorize('view_accounting'), getAccountById);
router.post('/accounts', authorize('manage_accounting'), createAccount);
router.put('/accounts/:id', authorize('manage_accounting'), updateAccount);
router.delete('/accounts/:id', authorize('manage_accounting'), deleteAccount);

// Journal Entries
router.get('/journal-entries', authorize('view_accounting'), getJournalEntries);
router.post('/journal-entries', authorize('manage_accounting'), createJournalEntry);
router.get('/journal-entries/:id', authorize('view_accounting'), getJournalEntryById);
router.put('/journal-entries/:id', authorize('manage_accounting'), updateJournalEntry);
router.delete('/journal-entries/:id', authorize('manage_accounting'), deleteJournalEntry);
router.post('/journal-entries/:id/approve', authorize('manage_accounting'), approveJournalEntry);
router.post('/journal-entries/:id/post', authorize('manage_accounting'), postJournalEntry);
router.post('/journal-entries/:id/reverse', authorize('manage_accounting'), reverseJournalEntry);

module.exports = router;
