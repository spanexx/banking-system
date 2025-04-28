const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Place specific routes before parameter routes
router.post('/', accountController.createAccount);
router.get('/', accountController.getAccounts);
router.get('/all', accountController.getAllAccounts);
router.get('/count', accountController.getAccountCountByDateRange);
router.get('/active/count', accountController.getCurrentlyActiveAccountCount);
router.get('/balance-change', accountController.getBalanceChange);

// Parameter routes should come last
router.get('/user/:userId', accountController.getAccountsByUserId);
router.get('/:id', accountController.getAccountById);

module.exports = router;
