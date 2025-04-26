const express = require('express');
const router = express.Router();
const { createAccount, getAccounts,
        getAllAccounts, getAccountById, getAccountsByUserId, getAccountCountByDateRange, getCurrentlyActiveAccountCount } = require('../controllers/accountController'); // Import necessary controllers
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/', createAccount);
router.get('/', getAccounts);
router.get('/all', getAllAccounts); // New route for getting all accounts
router.get('/count', getAccountCountByDateRange); // Route for account count by date range
router.get('/active/count', getCurrentlyActiveAccountCount); // Route for active account count
router.get('/:id', getAccountById); // Route to get account by ID
router.get('/user/:userId', getAccountsByUserId); // New route to get accounts by user ID

module.exports = router;
