const express = require('express');
const router = express.Router();
const { createTransaction, getTransactions, getAllTransactions, getTransactionsByUserId, updateTransactionStatus, getTransactionByRequestId, createCardTransaction, cancelTransactionRequestAndReturnFunds } = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');
router.use(protect);
// router.post('/', createTransaction);
router.get('/', getTransactions);
router.get('/all', getAllTransactions);
router.get('/user/:userId', getTransactionsByUserId);
router.put('/:transactionId/status', updateTransactionStatus);

router.get('/by-request/:requestId', getTransactionByRequestId);

router.post('/card', createCardTransaction);

router.post('/cancel-transfer', cancelTransactionRequestAndReturnFunds);

module.exports = router;
